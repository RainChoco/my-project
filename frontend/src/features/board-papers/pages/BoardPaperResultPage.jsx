import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../../../components/ui/button";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "../../../components/ui/card";

import { downloadBoardPaperPDF } from "../services/boardPaperApi";
import { getTender, listTenderDocuments } from "../../tenders/services/tenderApi";

function BoardPaperResultPage() {

    const navigate = useNavigate();
    const location = useLocation();

    const { report: boardPaper = {}, tenderLabel, tenderId } = location.state || {};

    useEffect(() => {
        if (!boardPaper?.id && !boardPaper?.title && !location.state) {
            navigate("/history", { replace: true });
        }
    }, [boardPaper, location.state, navigate]);

    const tenderName = tenderLabel || "Unknown Tender";

    const {
        data: tender = null,
        isLoading: isTenderLoading,
        isError: isTenderError
    } = useQuery({
        queryKey: ['tender', tenderId],
        queryFn: () => getTender(tenderId),
        enabled: Boolean(tenderId),
    });

    const {
        data: tenderDocs = [],
        isLoading: isTenderDocsLoading,
        isError: isTenderDocsError
    } = useQuery({
        queryKey: ['tenderDocuments', tenderId],
        queryFn: () => listTenderDocuments(tenderId),
        enabled: Boolean(tenderId),
    });

    const generatedDate = new Date().toLocaleDateString("en-SG", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const summaryText = boardPaper?.aiSummary || `The tender submitted under ${tenderName} has been reviewed for management approval. The proposal is assessed as operationally suitable, commercially competitive, and aligned to the required scope of work.`;
    const confidenceScore = boardPaper?.confidence ?? 94;
    const confidenceText = boardPaper?.aiConfidenceText || (confidenceScore >= 90
        ? "High confidence based on the tender evaluation and supporting documentation."
        : "Moderate confidence based on the tender evaluation and supporting documentation.");
    const financialAnalysisText = boardPaper?.aiFinancialAnalysis || `Financial review indicates the offer is competitive and aligned to the approved budget range. The main offer price is ${tender?.main_offer_price ? `SGD ${Number(tender.main_offer_price).toLocaleString()}` : "not yet available"}.`;
    const riskAssessmentText = boardPaper?.aiRiskAssessment || `The tender has been reviewed for compliance and delivery risk. ${tender?.status ? `Current status: ${tender.status}.` : "Status information is pending."} Key risks are manageable and can be resolved through standard approval conditions.`;
    const recommendationText = boardPaper?.aiRecommendation || boardPaper?.finalRecommendation || `Proceed to Management Approval. The tender satisfies the required financial, technical and operational evaluation criteria for ${tenderName}.`;
    const riskLevelText = boardPaper?.aiRiskLevel || (confidenceScore >= 90 ? "Low" : "Medium");

    const tenderDetailsText = [
        `Tender Reference: ${tender?.tender_ref_no || "—"}`,
        `Vendor: ${tender?.vendor_name || "—"}`,
        `Submission Date: ${tender?.submission_date ? new Date(tender.submission_date).toLocaleDateString("en-SG") : "—"}`,
        `Status: ${tender?.status || "—"}`,
        `Main Offer Price: ${tender?.main_offer_price ? `SGD ${Number(tender.main_offer_price).toLocaleString()}` : "—"}`,
        `Alternative Offer Price: ${tender?.alternative_offer_price ? `SGD ${Number(tender.alternative_offer_price).toLocaleString()}` : "—"}`,
    ].join("\n");

    const documentsList = Array.isArray(tenderDocs) ? tenderDocs : [];
    const documentsText = documentsList.length > 0
        ? documentsList.map((doc) => doc.original_filename || doc.file_type || "Document").join("\n")
        : "No tender documents found.";

    const summarySections = useMemo(() => {
        const normalizeLine = (line, title) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                return "";
            }

            const titlePrefix = `${title}:`;
            if (trimmedLine.toLowerCase().startsWith(titlePrefix.toLowerCase())) {
                return trimmedLine.slice(titlePrefix.length).trim();
            }

            return trimmedLine;
        };

        const sections = [
            {
                title: "Executive Summary",
                content: summaryText
            },
            {
                title: "Tender Overview",
                content: [
                    `Tender: ${tenderName}`,
                    `Vendor: ${tender?.vendor_name || "—"}`,
                    `Contract Value: ${tender?.main_offer_price ? `SGD ${Number(tender.main_offer_price).toLocaleString()}` : "Not available"}`,
                    `Contract Duration: Not available`,
                    `Evaluation Score: ${boardPaper?.score || "92 / 100"}`
                ]
            },
            {
                title: "Financial Analysis",
                content: financialAnalysisText
            },
            {
                title: "Risk Assessment",
                content: riskAssessmentText
            },
            {
                title: "AI Recommendation",
                content: recommendationText
            }
        ];

        return sections.map((section) => ({
            ...section,
            lines: (Array.isArray(section.content)
                ? section.content
                : section.content.split(/\n/).filter(Boolean)
            ).map((line) => normalizeLine(line, section.title))
        }));
    }, [boardPaper?.score, financialAnalysisText, recommendationText, riskAssessmentText, summaryText, tender?.main_offer_price, tender?.vendor_name, tenderName]);

    return (

        <div className="space-y-6">

            <div>

                <h1 className="text-3xl font-bold text-red-700">
                    AI Generated Board Paper
                </h1>

                <p className="text-gray-500 mt-2">
                    Review the AI-generated board paper before exporting or submitting.
                </p>

                <hr className="mt-6 border-gray-200" />

            </div>

            <Card>

                <CardHeader>

                    <CardTitle>

                        Board Paper Information

                    </CardTitle>

                </CardHeader>

                <CardContent className="grid grid-cols-2 gap-6">

                    <div>

                        <p className="text-sm text-gray-500">
                            Tender
                        </p>

                        <p className="font-semibold">
                            {tenderName}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">
                            Board Paper Title
                        </p>

                        <p className="font-semibold">
                            {boardPaper?.title}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">
                            Purpose
                        </p>

                        <p className="font-semibold">
                            {boardPaper?.purpose}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">
                            Prepared By
                        </p>

                        <p className="font-semibold">
                            {boardPaper?.preparedBy}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">
                            Generated Date
                        </p>

                        <p className="font-semibold">
                            {generatedDate}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-gray-500">
                            Status
                        </p>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700 text-sm font-semibold">

                            Generated

                        </span>

                    </div>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Linked Tender Details
                    </CardTitle>

                </CardHeader>

                <CardContent>
                    {isTenderLoading ? (
                        <p>Loading tender details...</p>
                    ) : isTenderError ? (
                        <p className="text-sm text-red-600">Unable to load tender details.</p>
                    ) : tender ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500">Tender Reference</p>
                                    <p className="font-semibold">{tender.tender_ref_no || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Vendor</p>
                                    <p className="font-semibold">{tender.vendor_name || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Submission Date</p>
                                    <p className="font-semibold">{tender.submission_date ? new Date(tender.submission_date).toLocaleDateString('en-SG') : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className="font-semibold">{tender.status || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Main Offer Price</p>
                                    <p className="font-semibold">{tender.main_offer_price ? `SGD ${Number(tender.main_offer_price).toLocaleString()}` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Alternative Offer Price</p>
                                    <p className="font-semibold">{tender.alternative_offer_price ? `SGD ${Number(tender.alternative_offer_price).toLocaleString()}` : '—'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>No tender details available.</p>
                    )}
                </CardContent>
            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Tender Documents
                    </CardTitle>

                </CardHeader>

                <CardContent>
                    {isTenderDocsLoading ? (
                        <p>Loading documents...</p>
                    ) : isTenderDocsError ? (
                        <p className="text-sm text-red-600">Unable to load tender documents.</p>
                    ) : documentsList.length > 0 ? (
                        <ul className="list-disc ml-6 space-y-2">
                            {documentsList.map((doc) => (
                                <li key={doc.id}>
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sky-600 hover:underline"
                                    >
                                        {doc.original_filename || doc.file_type || 'Document'}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No tender documents found.</p>
                    )}
                </CardContent>
            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Board Paper Summary
                    </CardTitle>

                </CardHeader>

                <CardContent className="space-y-4">
                    {summarySections.map((section) => {
                        const isBulletList = section.lines.some((line) => line.trim().startsWith("- "));
                        const isRecommendation = section.title === "AI Recommendation";

                        return (
                            <div key={section.title} className={`rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm ${isRecommendation ? "border-green-300 bg-green-50" : ""}`}>
                                <h3 className={`mb-3 text-lg font-semibold ${isRecommendation ? "text-green-700" : "text-red-700"}`}>
                                    {section.title}
                                </h3>
                                {section.lines.length > 0 ? (
                                    isBulletList ? (
                                        <ul className="ml-5 list-disc space-y-2 text-sm text-gray-700">
                                            {section.lines.map((line, index) => (
                                                <li key={`${section.title}-${index}`} className="leading-6">{line.replace(/^[-•]\s*/, "")}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="space-y-3">
                                            {section.lines.map((line, index) => (
                                                <p key={`${section.title}-${index}`} className={`text-sm leading-7 ${isRecommendation ? "text-green-700" : "text-gray-700"}`}>
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <p className="text-sm text-gray-700">No details available.</p>
                                )}
                            </div>
                        );
                    })}
                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        AI Confidence Score
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <div className="text-4xl font-bold text-green-600">

                        <div className="space-y-3">

                            <div className="text-5xl font-bold text-green-600">

                                {confidenceScore}%

                            </div>

                            <div className="h-3 rounded-full bg-gray-200">

                                <div className="h-3 rounded-full bg-green-600" style={{ width: `${Math.min(confidenceScore, 100)}%` }}></div>

                            </div>

                            <p className="text-gray-500">

                                {confidenceText}

                            </p>

                        </div>

                    </div>

                    <p className="text-gray-500 mt-2">

                        {confidenceText}

                    </p>

                </CardContent>

            </Card>

            <div className="flex justify-end gap-4">

                <Button
                    variant="outline"
                    onClick={() => navigate("/board-papers")}
                >
                    Back
                </Button>

                <Button
                    variant="outline"
                    onClick={async () => {
                        if (!boardPaper?.id) {
                            alert("Unable to download PDF: board paper ID is missing.");
                            return;
                        }

                        try {
                            const blob = await downloadBoardPaperPDF(boardPaper.id, {
                                title: boardPaper?.title || "",
                                purpose: boardPaper?.purpose || "",
                                preparedBy: boardPaper?.preparedBy || "",
                                tenderLabel: tenderName,
                                generatedDate,
                                summaryText,
                                confidenceScore,
                                confidenceText,
                                financialAnalysisText,
                                riskAssessmentText,
                                recommendationText,
                                tenderDetailsText,
                                documentListText: documentsText,
                            });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `BoardPaper-${boardPaper.id}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                        } catch (error) {
                            console.error(error);
                            alert("Failed to download board paper PDF.");
                        }
                    }}
                >
                    Download PDF
                </Button>

            </div>

        </div>

    );

}

export default BoardPaperResultPage;