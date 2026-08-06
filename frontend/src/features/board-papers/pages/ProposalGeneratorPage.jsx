import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "../../../components/ui/card";

import { Input } from "../../../components/ui/input";

import { Label } from "../../../components/ui/label";

import { useToast } from "../../../hooks/use-toast";
import { generateProposal } from "../services/proposalApi";
import { getHistoryEntries } from "../utils/historyStorage";
import { getHistoryEntryTargetId } from "../utils/historyEntryUtils";

function ProposalGeneratorPage() {

    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const boardPaperId = location.state?.id || location.state?.report?.id || null;

    const sanitizeTextValue = (value, fallback) => {
        if (typeof value === "string") {
            const trimmedValue = value.trim();
            if (!trimmedValue || ["true", "false"].includes(trimmedValue.toLowerCase())) {
                return fallback;
            }
            return trimmedValue;
        }

        if (typeof value === "number") {
            return String(value);
        }

        return fallback;
    };

    const stripLeadingHeading = (text) => {
        if (!text || typeof text !== "string") return text;
        // remove a leading markdown heading (e.g. "### Executive Summary\n\n") if present
        return text.replace(/^\s*#{1,6}\s*[^\n]*\n+/m, "").trim();
    };

    const buildExecutiveSummary = (summary, score, confidence, tenderName) => {
        const normalizedSummary = sanitizeTextValue(summary, `The board paper recommends proceeding with ${tenderName || "the selected tender"} based on the latest evaluation findings.`);
        const summaryText = normalizedSummary.trim();

        return summaryText;
    };

    const buildProposalDraftContent = (report = {}, selectedReportSections = []) => {
        const title = sanitizeTextValue(report?.title, "Managing Agent Services Board Paper");
        const tenderName = title.replace(/ Board Paper$/i, "");
        // strip any leading markdown headings from AI-provided fields to avoid duplicate headings
        const rawAiSummary = report?.aiSummary || report?.executiveSummary;
        const aiSummary = buildExecutiveSummary(stripLeadingHeading(rawAiSummary), report?.score || "90 / 100", report?.confidence || 90, tenderName);
        const aiRecommendation = sanitizeTextValue(stripLeadingHeading(report?.aiRecommendation || report?.finalRecommendation), `Proceed to management approval for ${tenderName || "the recommended vendor"}.`);
        const financialAnalysis = sanitizeTextValue(stripLeadingHeading(report?.aiFinancialAnalysis || report?.financialAnalysis), "The board paper highlights that the submitted quotation remains competitive and aligned with the approved budget.");
        const riskAssessment = sanitizeTextValue(stripLeadingHeading(report?.aiRiskAssessment || report?.riskAssessment), "The board paper identifies manageable delivery risk with standard follow-up controls.");
        const confidence = report?.confidence || 90;
        const score = report?.score || "90 / 100";
        const vendorName = sanitizeTextValue(report?.vendorName || report?.vendor, "the selected vendor");
        const contractValue = sanitizeTextValue(report?.contractValue || report?.mainOfferPrice, "Not available");
        const contractDuration = sanitizeTextValue(report?.contractDuration, "Not available");
        const evaluationScore = sanitizeTextValue(report?.evaluationScore || score, score);
        const selectedSections = selectedReportSections && selectedReportSections.length > 0
            ? selectedReportSections
            : [
                "Executive Summary",
                "Tender Overview",
                "Vendor Recommendation",
                "Financial Analysis",
                "Risk Assessment",
                "AI Recommendation",
                "Conclusion"
            ];

        const sections = [];

        if (selectedSections.includes("Executive Summary")) {
            sections.push("### Executive Summary", "", aiSummary);
        }

        if (selectedSections.includes("Tender Overview")) {
            sections.push(
                "### Tender Overview",
                "",
                `- Tender: ${tenderName}`,
                `- Vendor: ${vendorName}`,
                `- Contract Value: ${contractValue}`,
                `- Contract Duration: ${contractDuration}`,
                `- Evaluation Score: ${evaluationScore}`
            );
        }

        if (selectedSections.includes("Vendor Recommendation")) {
            sections.push("### Vendor Recommendation", "", `Based on the board paper evidence, ${vendorName} is recommended for contract award because the evaluation outcome supports its suitability for the requested purpose and delivery of ${tenderName}.`);
        }

        if (selectedSections.includes("Financial Analysis")) {
            sections.push("### Financial Analysis", "", financialAnalysis);
        }

        if (selectedSections.includes("Risk Assessment")) {
            sections.push("### Risk Assessment", "", riskAssessment);
        }

        if (selectedSections.includes("AI Recommendation")) {
            sections.push("### AI Recommendation", "", aiRecommendation);
        }

        if (selectedSections.includes("Conclusion")) {
            sections.push("### Conclusion", "", `The board paper supports proceeding with the award of ${tenderName} to ${vendorName}, with ${confidence}% confidence and an evaluation score of ${score}.`);
        }

        return sections.join("\n\n");
    };

    const buildProposalDraftFromBoardPaper = (report) => {
        const title = report?.title || "Board Paper Proposal";
        const purpose = report?.purpose || "Recommendation";
        const aiSummary = report?.aiSummary || report?.executiveSummary || "The board paper highlights a favourable recommendation for the selected tender.";
        const aiRecommendation = report?.aiRecommendation || report?.finalRecommendation || "Proceed to Management Approval.";
        const confidence = report?.confidence || 90;
        const score = report?.score || "90 / 100";

        return {
            title: `${title.replace(/ Board Paper$/i, "")} Proposal`,
            objective: `${purpose} for Award`,
            content: buildProposalDraftContent(report)
        };
    };

    const toggleReportSection = (section) => {
        setSelectedReportSections((currentSections) => {
            if (currentSections.includes(section)) {
                return currentSections.filter((item) => item !== section);
            }

            return [...currentSections, section];
        });
    };

    const reportSectionOptions = [
        "Executive Summary",
        "Tender Overview",
        "Vendor Recommendation",
        "Financial Analysis",
        "Risk Assessment",
        "AI Recommendation",
        "Conclusion"
    ];

    const [proposal, setProposal] = useState({
        title: "Managing Agent Services Proposal",
        objective: "Recommendation for Award",
        content: buildProposalDraftContent()
    });
    const [selectedReportSections, setSelectedReportSections] = useState(reportSectionOptions);
    const [boardPapers, setBoardPapers] = useState([]);
    const [selectedBoardPaperId, setSelectedBoardPaperId] = useState(boardPaperId);
    const [loading, setLoading] = useState(false);

    const loadBoardPapers = async () => {
        try {
            const historyEntries = await getHistoryEntries();
            const normalizedPapers = historyEntries
                .filter((entry) => entry.type === "Board Paper")
                .map((entry) => ({
                    id: getHistoryEntryTargetId(entry),
                    title: entry.title || entry.report?.title || `Board Paper #${entry.id}`,
                    report: entry.report || entry.entryData?.report || null
                }));

            setBoardPapers(normalizedPapers);

            if (!selectedBoardPaperId && normalizedPapers.length > 0) {
                setSelectedBoardPaperId(normalizedPapers[0].id);
            }
        } catch (error) {
            console.error("Unable to load generated board papers", error);
        }
    };

    useEffect(() => {
        loadBoardPapers();
    }, []);

    useEffect(() => {
        const handleHistoryUpdated = () => {
            loadBoardPapers();
        };

        window.addEventListener("history-updated", handleHistoryUpdated);

        return () => {
            window.removeEventListener("history-updated", handleHistoryUpdated);
        };
    }, [selectedBoardPaperId]);

    useEffect(() => {
        const selectedPaper = boardPapers.find((paper) => paper.id === selectedBoardPaperId);

        if (selectedPaper?.report) {
            const draft = buildProposalDraftFromBoardPaper(selectedPaper.report);
            setProposal((currentProposal) => ({
                ...currentProposal,
                title: draft.title,
                objective: draft.objective,
                content: draft.content
            }));
        }
    }, [selectedBoardPaperId, boardPapers]);

    const handleChange = (field, value) => {
        setProposal({
            ...proposal,
            [field]: value
        });
    };

    const handleGenerate = async () => {
        if (!proposal.title.trim() || !proposal.objective.trim()) {
            toast({
                title: "Please complete the proposal fields",
                description: "Proposal title and objective are required.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            const effectiveBoardPaperId = selectedBoardPaperId || boardPaperId;
            const payload = {
                proposalTitle: proposal.title,
                proposalType: proposal.objective,
                language: "English",
                selectedReportSections
            };

            if (effectiveBoardPaperId) {
                payload.boardPaperId = effectiveBoardPaperId;
            }

            const result = await generateProposal(payload);

            toast({
                title: "Proposal generated",
                description: "Your AI-assisted proposal was created successfully."
            });

            navigate("/proposal-report/result", {
                state: result.proposal
            });
        }
        catch (error) {
            console.error(error);
            toast({
                title: "Unable to generate proposal",
                description: error.message || "Network error occurred.",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };

    return (

        <div className="space-y-6">

            <div>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground">

                    Proposal Generation

                </h1>

                <p className="mt-1 text-sm text-muted-foreground">

                    Generate a proposal report directly from the selected board paper.

                </p>

                <Badge className="mt-3 bg-red-100 text-red-700 hover:bg-red-100">
                    AI Assisted Proposal
                </Badge>

            </div>

            <Card>

                <CardHeader>

                    <CardTitle>

                        Proposal Details

                    </CardTitle>

                </CardHeader>

                <CardContent className="space-y-5">

                    <div>

                        <Label>

                            Select Board Paper

                        </Label>

                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={selectedBoardPaperId ?? ""}
                            onChange={(e) => setSelectedBoardPaperId(e.target.value ? Number(e.target.value) : null)}
                        >
                            {boardPapers.length === 0 ? (
                                <option value="">No generated board papers found</option>
                            ) : (
                                boardPapers.map((paper) => (
                                    <option key={paper.id} value={paper.id}>
                                        {paper.title || `Board Paper #${paper.id}`}
                                    </option>
                                ))
                            )}
                        </select>

                    </div>

                    <div>

                        <Label>

                            Proposal Title

                        </Label>

                        <Input
                            value={proposal.title}
                            placeholder="Managing Agent Services Proposal"
                            onChange={(e) =>
                                handleChange("title", e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <Label>

                            Objective

                        </Label>

                        <Input
                            value={proposal.objective}
                            placeholder="Project Objective"
                            onChange={(e) =>
                                handleChange("objective", e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <Label>

                            Include Report Sections

                        </Label>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {reportSectionOptions.map((section) => (
                                <label key={section} className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedReportSections.includes(section)}
                                        onChange={() => toggleReportSection(section)}
                                    />
                                    <span>{section}</span>
                                </label>
                            ))}
                        </div>
                        <Textarea
                            rows={10}
                            value={proposal.content}
                            placeholder="AI generated proposal..."
                            onChange={(e) =>
                                handleChange("content", e.target.value)
                            }
                        />

                        <p className="text-right text-sm text-muted-foreground">

                            {proposal.content.length} characters

                        </p>

                    </div>

                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        The proposal report will be generated from the selected board paper and shown on the next page.
                    </div>

                    <div className="flex justify-between">

                        <Button
                            variant="outline"
                            onClick={() => navigate("/history")}
                        >
                            History
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate("/board-papers/result")}
                        >
                            Back
                        </Button>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                        >
                            {loading ? "Generating..." : "Generate Report"}
                        </Button>

                    </div>

                </CardContent>

            </Card>

        </div>

    );

}

export default ProposalGeneratorPage;