const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const HISTORY_ENDPOINTS = [`${API_URL}/history`, `${API_URL}/proposals/history`];

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

    for (const endpoint of HISTORY_ENDPOINTS) {
        try {
            const response = await fetch(endpoint, { credentials: "include" });

            if (!response.ok) {
                continue;
            }

            const historyResponse = await response.json();
            const entries = Array.isArray(historyResponse)
                ? historyResponse.map(buildEntry).filter(Boolean)
                : [];

            return entries
                .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
                .slice(0, 30);
        } catch (error) {
            console.error(`Unable to read history entries from ${endpoint}`, error);
        }
    }

    return [];
};

export const saveHistoryEntry = async (entry) => {
    return entry;
};
