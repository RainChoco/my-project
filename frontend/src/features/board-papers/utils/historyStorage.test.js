/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHistoryEntries } from "./historyStorage";

describe("historyStorage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("loads history entries from the dedicated history API", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{
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

        vi.stubGlobal("fetch", fetchMock);

        const entries = await getHistoryEntries();

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/history",
            expect.objectContaining({ credentials: "include" })
        );
        expect(entries).toHaveLength(2);
        expect(entries[0].type).toBe("Proposal");
        expect(entries[1].type).toBe("Board Paper");
    });
});
