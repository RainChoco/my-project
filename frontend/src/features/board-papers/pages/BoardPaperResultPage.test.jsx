import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import BoardPaperResultPage from "./BoardPaperResultPage";

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");

    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useLocation: () => ({
            state: {
                report: {
                    id: 1,
                    title: "Tender A Board Paper",
                    purpose: "Management approval",
                    preparedBy: "AI Assistant",
                    aiSummary: "The tender is recommended for award.",
                    aiFinancialAnalysis: "The offer remains competitive.",
                    aiRiskAssessment: "Delivery risk is manageable.",
                    aiRecommendation: "Proceed to management approval.",
                    confidence: 92,
                    score: "92 / 100"
                },
                tenderLabel: "Tender A",
                tenderId: 1
            }
        })
    };
});

vi.mock("@tanstack/react-query", () => ({
    useQuery: () => ({ data: null, isLoading: false, isError: false })
}));

describe("BoardPaperResultPage", () => {
    it("renders board paper summary sections in the proposal-style format", () => {
        render(
            <MemoryRouter>
                <BoardPaperResultPage />
            </MemoryRouter>
        );

        expect(screen.getByText("Board Paper Summary")).toBeTruthy();
        expect(screen.getByText("Executive Summary")).toBeTruthy();
        expect(screen.getByText("Tender Overview")).toBeTruthy();
        expect(screen.getByText("Financial Analysis")).toBeTruthy();
        expect(screen.getByText("Risk Assessment")).toBeTruthy();
        expect(screen.getByText("AI Recommendation")).toBeTruthy();
    });

    it("removes repeated section title prefixes from the content body", () => {
        render(
            <MemoryRouter>
                <BoardPaperResultPage />
            </MemoryRouter>
        );

        expect(screen.getByText("The tender is recommended for award.")).toBeTruthy();
        expect(screen.queryByText("Executive Summary: The tender is recommended for award.")).toBeNull();
    });
});
