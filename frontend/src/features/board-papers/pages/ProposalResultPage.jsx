import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../../components/ui/card";

function ProposalResultPage() {

    const navigate = useNavigate();

    return (
        <div className="space-y-6">

            <div>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Proposal Result
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    Review the AI-generated proposal before submission.
                </p>

                <Badge className="mt-3 bg-red-100 text-red-700 hover:bg-red-100">
                    AI Generated Proposal
                </Badge>

            </div>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Proposal Summary
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <p>
                        This proposal recommends awarding the tender to the
                        highest-ranked vendor based on technical, financial,
                        and compliance evaluation.
                    </p>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Project Objectives
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <ul className="list-disc ml-5 space-y-2">
                        <li>Improve estate management efficiency.</li>
                        <li>Maintain service quality.</li>
                        <li>Deliver value for money.</li>
                    </ul>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Financial Benefits
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <p>
                        The selected proposal offers competitive pricing while
                        remaining within the approved budget allocation.
                    </p>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>

                        Estimated Budget

                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <div className="text-4xl font-bold text-emerald-600">

                        $1,250,000

                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">

                        Within Approved Budget

                    </p>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Recommendation
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <Badge variant="success">Recommended</Badge>

                    <p className="mt-4">

                        Proceed with contract award and submit the proposal
                        for management approval.

                    </p>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>

                        Approval Status

                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <Badge variant="warning">Awaiting Management Approval</Badge>

                    <p className="mt-4 text-sm text-muted-foreground">

                        This proposal is ready for submission to management.

                    </p>

                </CardContent>

            </Card>

            <div className="flex justify-end gap-3">

                <Button
                    variant="outline"
                    onClick={() => navigate("/board-papers/proposal-generation")}
                >
                    Back
                </Button>

                <Button
                    variant="outline"
                    disabled
                >
                    Export PDF (Coming Soon)
                </Button>

                <Button
                    onClick={() => navigate("/board-papers/history")}
                >
                    Generation History
                </Button>

            </div>

        </div>
    );
}

export default ProposalResultPage;