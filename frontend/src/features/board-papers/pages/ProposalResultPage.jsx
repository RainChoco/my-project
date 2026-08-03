import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/button";

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

                <h1 className="text-3xl font-bold text-red-700">
                    Proposal Result
                </h1>

                <p className="mt-2 text-gray-500">
                    Review the AI-generated proposal before submission.
                </p>

                <div className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    AI Generated Proposal
                </div>

                <hr className="mt-6 border-gray-200" />

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

                    <div className="text-4xl font-bold text-green-600">

                        $1,250,000

                    </div>

                    <p className="mt-2 text-gray-500">

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

                    <div className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">

                        Recommended

                    </div>

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

                    <div className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">

                        Awaiting Management Approval

                    </div>

                    <p className="mt-4 text-gray-500">

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
                    className="bg-red-700 hover:bg-red-800"
                    onClick={() => navigate("/board-papers/history")}
                >
                    Generation History
                </Button>

            </div>

        </div>
    );
}

export default ProposalResultPage;