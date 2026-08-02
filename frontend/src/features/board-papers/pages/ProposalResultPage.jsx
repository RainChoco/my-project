import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";

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
            let sectionTitle = normalizedSection.replace(/^###\s*/, "").replace(/\s*\(Read Only\)$/, "");

            // If the AI placed the section content on the same line as the heading
            // (eg. "### Executive Summary The board paper recommends ..."), split
            // the known title out and treat the remainder as the first content line.
            const KNOWN_TITLES = [
                'Executive Summary',
                'Tender Overview',
                'Vendor Recommendation',
                'Financial Analysis',
                'Risk Assessment',
                'AI Recommendation',
                'Conclusion'
            ];

            // More robust extraction: inspect the first line and pull any inline
            // content after a known title using a regex (case-insensitive).
            const firstLine = normalizedSection.split(/\n/)[0].replace(/^###\s*/, "").replace(/\s*\(Read Only\)$/, "");
            const titleRegex = new RegExp(`^(${KNOWN_TITLES.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')).join('|')})(?:\s+(.*))?$`, 'i');
            const titleMatch = firstLine.match(titleRegex);

            let inlineContent = null;
            if (titleMatch) {
                sectionTitle = titleMatch[1];
                inlineContent = titleMatch[2] ? titleMatch[2].trim() : null;
            }

            const lines = normalizedSection
                .split(/\n/)
                .filter(Boolean)
                .slice(1);

            if (inlineContent) {
                lines.unshift(inlineContent);
            }

            const contentLines = lines.filter((line) => line.trim() !== "");

            // Defensive dedupe: remove repeated headings and consecutive duplicate paragraphs
            const dedupedLines = [];
            let lastNorm = null;

            for (let rawLine of contentLines) {
                const line = rawLine.replace(/^[\-•]\s*/, "");
                const norm = line.replace(/\s+/g, " ").trim();

                // skip empty or same-as-title lines
                if (!norm) continue;
                if (norm === sectionTitle) continue;

                // skip if identical to previous normalized line
                if (lastNorm && norm === lastNorm) continue;

                dedupedLines.push(rawLine);
                lastNorm = norm;
            }

            const isBulletList = dedupedLines.some((line) => line.trim().startsWith("- "));

            return (
                <div key={`${section}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
                    <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-red-700">{sectionTitle}</h3>
                    <div className="space-y-3">
                        {dedupedLines.length > 0 ? (
                            isBulletList ? (
                                <ul className="ml-5 list-disc space-y-2 text-sm text-gray-700">
                                    {dedupedLines.map((line, lineIndex) => (
                                        <li key={`${section}-${lineIndex}`} className="leading-6">{line.replace(/^[-•]\s*/, "")}</li>
                                    ))}
                                </ul>
                            ) : (
                                dedupedLines.map((line, lineIndex) => {
                                    const match = line.match(/^([A-Za-z ]+)(\s*\*?)(:)?$/);

                                    if (match) {
                                        const label = match[1].trim();
                                        const value = line;
                                        const isEditableField = label === "Proposal Title" || label === "Proposal Purpose" || label === "Prepared By" || label === "Submission Date";

                                        return (
                                            <div key={`${section}-${lineIndex}`} className="rounded-lg border border-gray-200 bg-white p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                                                {isEditableField ? (
                                                    <input
                                                        className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                                        value={editableFields[
                                                            label === "Proposal Title"
                                                                ? "proposalTitle"
                                                                : label === "Proposal Purpose"
                                                                    ? "proposalPurpose"
                                                                    : label === "Prepared By"
                                                                        ? "preparedBy"
                                                                        : "submissionDate"
                                                        ] || ""}
                                                        onChange={(event) => {
                                                            const fieldKey = label === "Proposal Title"
                                                                ? "proposalTitle"
                                                                : label === "Proposal Purpose"
                                                                    ? "proposalPurpose"
                                                                    : label === "Prepared By"
                                                                        ? "preparedBy"
                                                                        : "submissionDate";

                                                            setEditableFields((current) => ({
                                                                ...current,
                                                                [fieldKey]: event.target.value
                                                            }));
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="mt-2 font-medium text-gray-700">{value}</p>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={`${section}-${lineIndex}`} className="rounded-lg border border-gray-200 bg-white p-3">
                                            <p className="whitespace-pre-line text-sm text-gray-700">{line}</p>
                                        </div>
                                    );
                                })
                            )
                        ) : (
                            <div className="rounded-lg border border-gray-200 bg-white p-3">
                                <p className="text-sm text-gray-700">No details available.</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div key={`${section}-${index}`} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="whitespace-pre-line text-sm leading-7 text-gray-700">{normalizedSection}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Proposal Report</p>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {editableFields.proposalTitle || proposal.proposalTitle}
                        </h1>
                        <p className="mt-2 text-gray-500">
                            Review the AI-generated report before submission.
                        </p>
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
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p>{proposal.sections?.content}</p>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-lg font-semibold text-red-700">Proposal Summary</h3>
                <p className="text-sm leading-7 text-gray-700">
                    The report below is generated from the selected board paper and presented in a structured proposal format for review.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-red-700">Proposal Details</h3>
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

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                    variant="outline"
                    onClick={() => navigate("/proposal-report")}
                >
                    Back
                </Button>

                <Button
                    variant="outline"
                    onClick={() => navigate("/proposal-report")}
                >
                    Edit Report
                </Button>

                <Button
                    className="bg-red-700 hover:bg-red-800"
                    onClick={() => navigate("/history")}
                >
                    Submit Report
                </Button>
            </div>

        </div>
    );
}

export default ProposalResultPage;