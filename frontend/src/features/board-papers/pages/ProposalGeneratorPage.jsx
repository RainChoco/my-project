import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/button";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "../../../components/ui/card";

import { Input } from "../../../components/ui/input";

import { Label } from "../../../components/ui/label";

import { Textarea } from "../../../components/ui/textarea";

function ProposalGeneratorPage() {

    const navigate = useNavigate();

    const [proposal, setProposal] = useState({
        title: "Managing Agent Services Proposal",

        objective: "Recommendation for Award",
        content:
            `Based on the completed evaluation, the AI recommends awarding the tender to the selected vendor.
            The proposal has been generated using the evaluation results and financial analysis.`
    });



    const handleChange = (field, value) => {
        setProposal({
            ...proposal,
            [field]: value
        });
    };

    const handleGenerate = () => {

        // Backend API later

        navigate("/board-papers/proposal-result");

    };

    return (

        <div className="space-y-6">

            <div>

                <h1 className="text-3xl font-bold text-red-700">

                    Proposal Generation

                </h1>

                <p className="text-gray-500 mt-2">

                    Generate a proposal based on the AI-generated board paper.

                </p>

                <div className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    AI Assisted Proposal
                </div>

                <hr className="mt-6 border-gray-200" />

            </div>

            <Card>

                <CardHeader>

                    <CardTitle>

                        Proposal Details

                    </CardTitle>

                </CardHeader>

                <CardContent className="space-y-5">

                    <div>

                        <Label>

                            Proposal Title

                        </Label>

                        <Input
                            value={proposal.title}
                            placeholder="Managing Agent Services Proposal"
                            onChange={(e) =>
                                handleChange("title", e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <Label>

                            Objective

                        </Label>

                        <Input
                            value={proposal.objective}
                            placeholder="Project Objective"
                            onChange={(e) =>
                                handleChange("objective", e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <Label>

                            Proposal Content

                        </Label>

                        <Textarea
                            rows={10}
                            value={proposal.content}
                            placeholder="AI generated proposal..."
                            onChange={(e) =>
                                handleChange("content", e.target.value)
                            }
                        />

                        <p className="text-right text-sm text-gray-400">

                            {proposal.content.length} characters

                        </p>

                    </div>

                    <div className="flex justify-between">

                        <Button
                            variant="outline"
                            onClick={() => navigate("/board-papers/result")}
                        >
                            Back
                        </Button>

                        <Button
                            className="bg-red-700 hover:bg-red-800"
                            onClick={handleGenerate}
                        >
                            Generate Proposal
                        </Button>

                    </div>

                </CardContent>

            </Card>

        </div>

    );

}

export default ProposalGeneratorPage;