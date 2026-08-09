import apiClient from "../../../lib/apiClient";

const buildEntry = (entry) => {
    if (!entry) {
        return null;
    }

    const entryData = entry.entryData || {};

    if (entry.type === "Proposal") {
        const proposal = entryData.proposal || {};

        return {
            ...entry,
            type: "Proposal",
            title: entry.title || proposal.proposalTitle || "Untitled Proposal",
            createdAt: entry.createdAt || proposal.generatedDate,
            proposal: proposal.sections
                ? proposal
                : {
                    proposalTitle: proposal.proposalTitle,
                    proposalType: proposal.proposalType,
                    sections: proposal.sections || { content: "Proposal content unavailable." },
                },
        };
    }

    const report = entryData.report || {};

    return {
        ...entry,
        type: "Board Paper",
        title: entry.title || report.title || "Untitled Board Paper",
        createdAt: entry.createdAt || report.generatedDate,
        report: report.report || report,
        tenderLabel: report.tenderLabel || "Selected Tender",
        tenderId: report.tenderId,
        purpose: report.purpose,
        preparedBy: report.preparedBy,
    };
};

export const getHistoryEntries = async () => {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        // Was previously a raw fetch() with `credentials: "include"` and no
        // Authorization header - this app authenticates via a Bearer token
        // (see apiClient.js), not cookies, so every call 401'd and the
        // catch-all below silently returned [] - "no board papers generated"
        // even when plenty existed. apiClient attaches the real auth header.
        const { data: historyResponse } = await apiClient.get("/history");

        const entries = Array.isArray(historyResponse)
            ? historyResponse.map(buildEntry).filter(Boolean)
            : [];

        return entries
            .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
            .slice(0, 30);
    } catch (error) {
        console.error("Unable to read history entries", error);
        return [];
    }
};
