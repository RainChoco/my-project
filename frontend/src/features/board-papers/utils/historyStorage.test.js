/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

// historyStorage.js used to call fetch() directly with `credentials: "include"`
// and no Authorization header - this app authenticates via a Bearer token
// (apiClient.js), not cookies, so every real request 401'd and was silently
// swallowed into []. Now goes through apiClient, which attaches that header;
// mock apiClient itself rather than global fetch.
vi.mock("../../../lib/apiClient", () => ({
    default: { get: vi.fn() },
}));

import apiClient from "../../../lib/apiClient";
import { getHistoryEntries } from "./historyStorage";

describe("historyStorage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("loads history entries from the dedicated history API", async () => {
        apiClient.get.mockResolvedValue({
            data: [{
                id: 1,
                type: "Board Paper",
                title: "Board Paper - T-001",
                createdAt: "2026-07-29T10:00:00.000Z",
                entryData: {
                    report: { title: "Board Paper - T-001" },
                    tenderLabel: "T-001",
                    purpose: "Review",
                    preparedBy: "Alice"
                }
            }, {
                id: 2,
                type: "Proposal",
                title: "Proposal - T-001",
                createdAt: "2026-07-29T11:00:00.000Z",
                entryData: {
                    proposal: {
                        proposalTitle: "Proposal - T-001",
                        proposalType: "Recommendation",
                        sections: { content: "Proposal content" }
                    }
                }
            }]
        });

        const entries = await getHistoryEntries();

        expect(apiClient.get).toHaveBeenCalledWith("/history");
        expect(entries).toHaveLength(2);
        expect(entries[0].type).toBe("Proposal");
        expect(entries[1].type).toBe("Board Paper");
    });

    it("returns an empty list instead of throwing when the request fails (e.g. a 401)", async () => {
        apiClient.get.mockRejectedValue(new Error("Request failed with status code 401"));

        const entries = await getHistoryEntries();

        expect(entries).toEqual([]);
    });
});
