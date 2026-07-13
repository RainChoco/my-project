import { generateBoardPaper } from "../services/boardPaperApi";
import { useToast } from "../../../hooks/use-toast";
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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../components/ui/select";

function BoardPaperPage() {

    const navigate = useNavigate();

    const { toast } = useToast();

    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        tender: "",
        title: "",
        purpose: "",
        preparedBy: ""
    });

    const handleChange = (field, value) => {

        setFormData({
            ...formData,
            [field]: value
        });

        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: false
            });
        }

    };

    const handleGenerate = async () => {

        const newErrors = {};
        const missingFields = [];

        if (!formData.tender) {
            newErrors.tender = true;
            missingFields.push("Tender");
        }

        if (!formData.title.trim()) {
            newErrors.title = true;
            missingFields.push("Board Paper Title");
        }

        if (!formData.purpose.trim()) {
            newErrors.purpose = true;
            missingFields.push("Purpose");
        }

        if (!formData.preparedBy.trim()) {
            newErrors.preparedBy = true;
            missingFields.push("Prepared By");
        }

        setErrors(newErrors);

        if (missingFields.length > 0) {

            toast({
                title: "Please complete all required fields",
                description: missingFields.join(", "),
                variant: "destructive",
            });

            return;
        }

        // Clear errors
        setErrors({});

        setLoading(true);

        try {

            const result = await generateBoardPaper(formData);

            console.log(result);

            toast({
                title: "Success",
                description: "Board Paper generated successfully."
            });

            navigate("/board-papers/result", {
                state: result.report
            });

        }
        catch (error) {

            toast({
                variant: "destructive",
                title: "Error",
                description: error.message
            });

        }
        finally {

            setLoading(false);

        }

    };

    return (

        <div className="space-y-6">

            <div>

                <h1 className="text-3xl font-bold text-red-700">
                    Board Paper Generation
                </h1>

                <p className="text-gray-500 mt-2">
                    Generate AI-assisted board papers for management approval.
                </p>

            </div>

            <Card>

                <CardHeader>

                    <CardTitle>
                        Board Paper Details
                    </CardTitle>

                </CardHeader>

                <CardContent className="space-y-6">

                    <div className="space-y-2">

                        <Label>
                            Select Tender <span className="text-red-600">*</span>
                        </Label>

                        <Select
                            onValueChange={(value) =>
                                handleChange("tender", value)
                            }
                        >

                            <SelectTrigger
                                className={errors.tender ? "border-red-500 focus:ring-red-500" : ""}>

                                <SelectValue placeholder="Select Tender" />

                            </SelectTrigger>

                            <SelectContent>

                                <SelectItem value="Managing Agent Services">
                                    Managing Agent Services
                                </SelectItem>

                                <SelectItem value="Lift Maintenance Contract">
                                    Lift Maintenance Contract
                                </SelectItem>

                                <SelectItem value="Cleaning Services">
                                    Cleaning Services
                                </SelectItem>

                            </SelectContent>

                        </Select>

                        {errors.tender && (
                            <p className="text-sm text-red-600">
                                Please select a tender.
                            </p>
                        )}

                    </div>

                    <div className="space-y-2">

                        <Label>
                            Board Paper Title <span className="text-red-600">*</span>
                        </Label>

                        <Input
                            className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
                            value={formData.title}
                            placeholder="Enter board paper title"
                            onChange={(e) =>
                                handleChange("title", e.target.value)
                            }
                        />

                        {errors.title && (
                            <p className="text-sm text-red-600">
                                Board Paper Title is required.
                            </p>
                        )}

                    </div>

                    <div className="space-y-2">

                        <Label>
                            Purpose <span className="text-red-600">*</span>
                        </Label>

                        <Select
                            onValueChange={(value) =>
                                handleChange("purpose", value)
                            }
                        >
                            <SelectTrigger
                                className={
                                    errors.purpose
                                        ? "border-red-500"
                                        : ""
                                }
                            >
                                <SelectValue placeholder="Select Purpose" />
                            </SelectTrigger>

                            <SelectContent>

                                <SelectItem value="Recommendation">
                                    Recommendation
                                </SelectItem>

                                <SelectItem value="Approval Required">
                                    Approval Required
                                </SelectItem>

                                <SelectItem value="Information Only">
                                    Information Only
                                </SelectItem>

                            </SelectContent>

                        </Select>

                        {errors.purpose && (
                            <p className="text-sm text-red-600">
                                Purpose is required.
                            </p>
                        )}

                    </div>

                    <div className="space-y-2">

                        <Label>
                            Prepared By <span className="text-red-600">*</span>
                        </Label>

                        <Input
                            className={errors.preparedBy ? "border-red-500 focus-visible:ring-red-500" : ""}
                            value={formData.preparedBy}
                            placeholder="Enter your name"
                            onChange={(e) =>
                                handleChange("preparedBy", e.target.value)
                            }
                        />

                        {errors.preparedBy && (
                            <p className="text-sm text-red-600">
                                Prepared By is required.
                            </p>
                        )}

                    </div>

                    <div className="flex justify-end">

                        <Button
                            className="bg-red-700 hover:bg-red-800"
                            onClick={handleGenerate}
                            disabled={loading}
                        >

                            <>
                                {loading && (
                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
                                )}

                                {loading ? "Generating..." : "Generate Board Paper"}
                            </>

                        </Button>

                    </div>

                </CardContent>

            </Card>

        </div>

    );

}

export default BoardPaperPage;