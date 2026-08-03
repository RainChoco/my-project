import { useNavigate, useLocation } from "react-router-dom";

import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "../../../components/ui/card";

function BoardPaperResultPage() {

    const navigate = useNavigate();
    const location = useLocation();

    const boardPaper = location.state || {};

    console.log(boardPaper);

    const tenderNames = {
        1: "Managing Agent Services",
        2: "Lift Maintenance Contract",
        3: "Cleaning Services"
    };

    const tenderName =
        tenderNames[boardPaper?.tenderId] || "Unknown Tender";

    const generatedDate = new Date().toLocaleDateString("en-SG", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    return (

        <div className="space-y-6">

            <div>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    AI Generated Board Paper
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    Review the AI-generated board paper before exporting or submitting.
                </p>

            </div>

            <Card>

                <CardHeader>

                    <CardTitle>

                        Board Paper Information

                    </CardTitle>

                </CardHeader>

                <CardContent className="grid grid-cols-2 gap-6">

                    <div>

                        <p className="text-sm text-muted-foreground">
                            Tender
                        </p>

                        <p className="font-semibold">
                            {tenderName}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-muted-foreground">
                            Board Paper Title
                        </p>

                        <p className="font-semibold">
                            {boardPaper?.title}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-muted-foreground">
                            Purpose
                        </p>

                        <p className="font-semibold">
                            {boardPaper?.purpose}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-muted-foreground">
                            Prepared By
                        </p>

                        <p className="font-semibold">
                            {boardPaper?.preparedBy}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-muted-foreground">
                            Generated Date
                        </p>

                        <p className="font-semibold">
                            {generatedDate}
                        </p>

                    </div>

                    <div>

                        <p className="text-sm text-muted-foreground">
                            Status
                        </p>

                        <Badge variant="success">Generated</Badge>

                    </div>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Executive Summary
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <p>
                        The submitted tender has satisfied the technical,
                        operational and financial evaluation requirements.
                    </p>

                    <p className="mt-3">
                        AI recommends proceeding to the next approval stage.
                    </p>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        AI Confidence Score
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <div className="space-y-3">

                        <div className="text-5xl font-bold text-emerald-600">

                            94%

                        </div>

                        <div className="h-3 rounded-full bg-muted">

                            <div className="h-3 w-[94%] rounded-full bg-emerald-600"></div>

                        </div>

                        <p className="text-muted-foreground">

                            High confidence based on AI evaluation.

                        </p>

                    </div>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Financial Analysis
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <ul className="list-disc ml-6 space-y-2">

                        <li>Competitive pricing.</li>

                        <li>Within approved budget.</li>

                        <li>No abnormal pricing detected.</li>

                    </ul>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Risk Assessment
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <Badge variant="warning">Medium Risk</Badge>

                    <ul className="list-disc ml-6 mt-4 space-y-2">

                        <li>Supplier has relevant experience.</li>

                        <li>No major compliance issues.</li>

                        <li>Minor clarification required.</li>

                    </ul>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        AI Recommendation
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <div className="rounded-lg border border-green-300 bg-green-50 p-5">

                        <h3 className="font-bold text-green-700">

                            AI Recommendation

                        </h3>

                        <p className="mt-2">

                            Proceed to Management Approval.
                            The tender satisfies the required financial,
                            technical and operational evaluation criteria.

                        </p>

                    </div>

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
                    onClick={() => {
                        // Backend PDF download will be connected later
                        alert("Download PDF feature coming soon.");
                    }}
                >
                    Download PDF
                </Button>

                <Button
                    onClick={() => navigate("/board-papers/proposal-generation")}
                >
                    Generate Proposal
                </Button>

            </div>

        </div>

    );

}

export default BoardPaperResultPage;