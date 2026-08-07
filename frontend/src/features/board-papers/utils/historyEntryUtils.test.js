import { describe, expect, it } from "vitest";

import { getHistoryEntryTargetId } from "./historyEntryUtils";

describe("getHistoryEntryTargetId", () => {
    it("returns the board paper id from entryData when present", () => {
        const item = {
            id: 99,
            type: "Board Paper",
            entryData: {
                boardPaperId: 42,
                report: { title: "Board Paper" }
            }
        };

        expect(getHistoryEntryTargetId(item)).toBe(42);
    });

    it("returns the proposal id from nested proposal data", () => {
        const item = {
            id: 100,
            type: "Proposal",
            entryData: {
                proposal: {
                    id: 55,
                    proposalTitle: "Proposal"
                }
            }
        };

        expect(getHistoryEntryTargetId(item)).toBe(55);
    });

    it("falls back to the history entry id when no record id exists", () => {
        const item = {
            id: 77,
            type: "Board Paper"
        };

        expect(getHistoryEntryTargetId(item)).toBe(77);
    });
});
