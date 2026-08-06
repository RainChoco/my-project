import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

function ProposalResultPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const proposal = location.state || {
        proposalTitle: "Managing Agent Services Proposal",
        proposalType: "Recommendation for Award",
        language: "English",
        sections: {
            content:
                "This proposal recommends awarding the tender to the highest-ranked vendor based on technical, financial, and compliance evaluation."
        }
    };

    const [editableFields, setEditableFields] = useState({
        proposalTitle: proposal.proposalTitle || "Managing Agent Services Proposal",
        proposalPurpose: proposal.proposalType || "Recommendation for Award",
        preparedBy: "AI Proposal Assistant",
        submissionDate: new Date().toLocaleDateString("en-SG")
    });

    const contentSections = useMemo(() => {
        const content = proposal.sections?.content || "";
        const blocks = [];
        const lines = content.split(/\n/);
        let currentBlock = [];

        lines.forEach((line) => {
            if (/^###\s+/.test(line.trim())) {
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock.join("\n").trim());
                }
                currentBlock = [line.trim()];
            } else if (line.trim() === "") {
                if (currentBlock.length > 0) {
                    currentBlock.push("");
                }
            } else if (currentBlock.length > 0) {
                currentBlock.push(line);
            } else {
                currentBlock = [line];
            }
        });

        if (currentBlock.length > 0) {
            blocks.push(currentBlock.join("\n").trim());
        }

        return blocks.filter(Boolean);
    }, [proposal.sections?.content]);

    const renderTemplateBlock = (section, index) => {
        const normalizedSection = section.trim();

        if (normalizedSection.startsWith("### ")) {
            const title = normalizedSection.replace(/^###\s*/, "").split(/\n/)[0];
            const content = normalizedSection.split(/\n/).slice(1).join("\n").trim();
            return (
                <Card key={`${section}-${index}`} className="border-gray-200 bg-gray-50">
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{content || "No content available."}</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card key={`${section}-${index}`} className="border-gray-200 bg-white">
                <CardContent>
                    <p className="text-sm leading-7 text-gray-700 whitespace-pre-line">{normalizedSection}</p>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Proposal Report</p>
                        <h1 className="text-3xl font-bold text-gray-900">{editableFields.proposalTitle}</h1>
                        <p className="mt-2 text-gray-500">Review the AI-generated report before submission.</p>
                    </div>
                    <div className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                        AI Generated Proposal
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {contentSections.length > 0 ? (
                    contentSections.map((section, index) => renderTemplateBlock(section, index))
                ) : (
                    <Card className="border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle>Proposal Result</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700">{proposal.sections?.content || "No proposal content available."}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="success">Recommended</Badge>
                        <p className="mt-4 text-sm text-gray-700">Proceed with contract award and submit the proposal for management approval.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Approval Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="warning">Awaiting Management Approval</Badge>
                        <p className="mt-4 text-sm text-gray-700">This proposal is ready for submission to management.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-lg font-semibold text-red-700">Proposal Details</div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Proposal Title</p>
                            <input
                                className="mt-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                value={editableFields.proposalTitle}
                                onChange={(event) => setEditableFields((current) => ({ ...current, proposalTitle: event.target.value }))}
                            />
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Proposal Purpose</p>
                            <input
                                className="mt-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                value={editableFields.proposalPurpose}
                                onChange={(event) => setEditableFields((current) => ({ ...current, proposalPurpose: event.target.value }))}
                            />
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prepared By</p>
                            <input
                                className="mt-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                value={editableFields.preparedBy}
                                onChange={(event) => setEditableFields((current) => ({ ...current, preparedBy: event.target.value }))}
                            />
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Submission Date</p>
                            <input
                                className="mt-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                value={editableFields.submissionDate}
                                onChange={(event) => setEditableFields((current) => ({ ...current, submissionDate: event.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => navigate("/proposal-report")}>Back</Button>
                <Button variant="outline" onClick={() => navigate("/proposal-report")}>Edit Report</Button>
                <Button className="bg-red-700 hover:bg-red-800" onClick={() => navigate("/board-papers/history")}>Submit Report</Button>
            </div>
        </div>
    );
}

export default ProposalResultPage;
