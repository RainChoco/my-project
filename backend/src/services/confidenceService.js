const { Op } = require("sequelize");
const { Tender, Contract, EligibilityThreshold, BcaGradeLimit, Evaluation } = require("../models");

const BIZSAFE_LEVELS = ["None", "Level 1", "Level 2", "Level 3", "STAR"];
const bizsafeLevelToNumber = (level) => {
    const index = BIZSAFE_LEVELS.indexOf(level);
    return index === -1 ? 0 : index;
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

// Continuous headroom score against a price ceiling (BCA grade limit,
// contract budget, ...): 0.5 exactly at the ceiling, rising toward 1 the
// further under it the price sits, falling toward 0 the further over.
// Using a flat 1.0 for "any price at or under the ceiling" would make every
// tender priced comfortably under the same ceiling score identically -
// this rewards the more competitive price instead.
const headroomScore = (price, ceiling) => {
    if (!ceiling || price == null) return null;
    return clamp01(0.5 + (ceiling - price) / ceiling);
};

const ELIGIBILITY_STATUS_SCORE = {
    eligible: 1,
    flagged: 0.5,
    pending: 0.35,
    rejected: 0
};

async function getCurrentBcaGradeLimit(grade) {
    if (!grade) return null;
    const today = new Date().toISOString().slice(0, 10);
    return BcaGradeLimit.findOne({
        where: { grade, effective_from: { [Op.lte]: today } },
        order: [["effective_from", "DESC"]]
    });
}

// Composite 0-100 confidence score for a board paper, derived from the same
// eligibility/financial data used to assess the tender itself (rather than a
// flat constant) - so a tender missing eligibility criteria, over its BCA
// grade's tender value ceiling, short on paid-up capital/bizSAFE level, or
// priced above the contract budget scores lower. Returns the loaded tender
// (with its contract) alongside the score so callers generating AI narrative
// text from the same tender don't need a second query.
async function calculateBoardPaperConfidence(tenderId) {
    const tender = await Tender.findByPk(tenderId, {
        include: [{ model: Contract, as: "contract" }]
    });

    if (!tender) {
        const err = new Error("Tender not found");
        err.status = 404;
        throw err;
    }

    const price = tender.main_offer_price != null ? Number(tender.main_offer_price) : null;
    const factors = [];

    // 1. Eligibility status - reflects the deterministic eligibility checks
    // (paid-up capital, BCA FM01 license/tender limit, non-debarment) already
    // run for this tender via triggerEligibilityCheck.
    factors.push({
        weight: 0.35,
        score: ELIGIBILITY_STATUS_SCORE[tender.eligibility_status] ?? ELIGIBILITY_STATUS_SCORE.pending
    });

    // 2. BCA FM01 grade headroom - how comfortably the main offer price sits
    // under the grade's tender value ceiling, not just a pass/fail flag.
    let bcaScore = 0.5;
    if (tender.bca_fm01_grade) {
        const gradeLimit = await getCurrentBcaGradeLimit(tender.bca_fm01_grade);
        if (!gradeLimit || gradeLimit.max_tender_value == null) {
            bcaScore = 1;
        } else {
            const scored = headroomScore(price, Number(gradeLimit.max_tender_value));
            if (scored != null) bcaScore = scored;
        }
    }
    factors.push({ weight: 0.15, score: bcaScore });

    // 3. Paid-up capital adequacy vs the configured minimum threshold.
    const minCapitalThreshold = await EligibilityThreshold.findOne({ where: { criterion_key: "min_paid_up_capital" } });
    let capitalScore = 0.3;
    if (tender.paid_up_capital != null && minCapitalThreshold) {
        const ratio = Number(tender.paid_up_capital) / Number(minCapitalThreshold.threshold_value);
        capitalScore = clamp01(ratio / 1.5); // full credit once capital reaches 150% of the minimum
    }
    factors.push({ weight: 0.15, score: capitalScore });

    // 4. bizSAFE level vs the configured minimum threshold.
    const minBizsafeThreshold = await EligibilityThreshold.findOne({ where: { criterion_key: "min_bizsafe_level" } });
    let bizsafeScore = 0.7;
    if (minBizsafeThreshold) {
        const requiredLevel = Number(minBizsafeThreshold.threshold_value);
        const vendorLevel = bizsafeLevelToNumber(tender.bizsafe_level);
        bizsafeScore = requiredLevel > 0 ? clamp01(vendorLevel / requiredLevel) : 1;
    }
    factors.push({ weight: 0.15, score: bizsafeScore });

    // 5. Financial competitiveness of the main offer against the contract's
    // approved budget, falling back to the latest PQM evaluation score if the
    // contract has no budget on file.
    let financialScore = 0.6;
    const budgetLimit = tender.contract?.budgetLimit != null ? Number(tender.contract.budgetLimit) : null;
    const budgetScore = headroomScore(price, budgetLimit);
    if (budgetScore != null) {
        financialScore = budgetScore;
    } else {
        const latestEvaluation = await Evaluation.findOne({
            where: { tender_id: tenderId, pqm_score: { [Op.ne]: null } },
            order: [["evaluation_date", "DESC"]]
        });
        if (latestEvaluation) {
            financialScore = clamp01(Number(latestEvaluation.pqm_score) / 100);
        }
    }
    factors.push({ weight: 0.2, score: financialScore });

    const weightedSum = factors.reduce((sum, factor) => sum + factor.weight * factor.score, 0);
    const confidence = Math.round(clamp01(weightedSum) * 100);

    return { confidence, tender };
}

module.exports = { calculateBoardPaperConfidence };
