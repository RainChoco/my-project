import { generateBoardPaper } from "../services/boardPaperApi";
import { useToast } from "../../../hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { buildBoardPaperTitle, getSelectedTenderDetails } from "../utils/boardPaperFormUtils";

import { Button } from "../../../components/ui/button";
import { listTenders } from "../../tenders/services/tenderApi";
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

    const { data: tendersResponse = { data: [] }, isLoading: isTendersLoading, isError: isTendersError } = useQuery({
        queryKey: ['tenders', { eligibility_status: 'eligible' }],
        queryFn: () => listTenders({ eligibility_status: 'eligible' }),
    });

    const tenders = tendersResponse.data || [];
    const noEligibleTenders = !isTendersLoading && tenders.length === 0;

    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        tenderId: "",
        title: "",
        purpose: "",
        preparedBy: ""
    });

    const selectedTender = getSelectedTenderDetails(tenders, formData.tenderId);

    useEffect(() => {
        if (!formData.tenderId) {
            setFormData((prev) => ({ ...prev, title: "" }));
            return;
        }

        const autoTitle = buildBoardPaperTitle(selectedTender);
        setFormData((prev) => ({
            ...prev,
            title: autoTitle
        }));
    }, [formData.tenderId, selectedTender]);

    const handleChange = (field, value) => {

        setFormData((prevFormData) => ({
            ...prevFormData,
            [field]: value
        }));

        if (errors[field]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [field]: false
            }));
        }

    };

    const handleGenerate = async () => {

        const newErrors = {};
        const missingFields = [];
        const selectedTenderId = String(formData.tenderId || "").trim();

        if (!selectedTenderId) {
            newErrors.tenderId = true;
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
            const parsedTenderId = Number(selectedTenderId);

            const result = await generateBoardPaper({
                tenderId: parsedTenderId,
                title: formData.title,
                purpose: formData.purpose,
                preparedBy: formData.preparedBy,
            });

            console.log(result);

            toast({
                title: "Success",
                description: "Board Paper generated successfully."
            });

            const tenderLabel = selectedTender
                ? selectedTender.tender_ref_no
                : "Selected Tender";

            navigate("/board-papers/result", {
                state: {
                    report: result.report,
                    tenderLabel,
                    tenderId: formData.tenderId,
                    title: formData.title || buildBoardPaperTitle(selectedTender),
                    purpose: formData.purpose,
                    preparedBy: formData.preparedBy,
                }
            });

        }
        catch (error) {
            const message = error.response?.data?.message || error.message;

            toast({
                variant: "destructive",
                title: "Error",
                description: message
            });

            console.error('Board paper generate failed:', error);
        }
        finally {

            setLoading(false);

        }

    };

    return (

        <div className="space-y-6">

            <div>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Board Paper Generation
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
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
                            Select Tender <span className="text-destructive">*</span>
                        </Label>

                        <Select
                            value={formData.tenderId}
                            onValueChange={(value) =>
                                handleChange("tenderId", value)
                            }
                        >
                            <SelectTrigger
                                className={errors.tenderId ? "border-red-500 focus:ring-red-500" : ""}
                            >
                                <SelectValue placeholder="Select Tender" />
                            </SelectTrigger>

                            <SelectContent>
                                {isTendersLoading ? (
                                    <SelectItem value="">Loading tenders...</SelectItem>
                                ) : tenders.length > 0 ? (
                                    tenders.map((tender) => (
                                        <SelectItem key={tender.id} value={String(tender.id)}>
                                            {tender.tender_ref_no}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="">No eligible tenders available</SelectItem>
                                )}
                            </SelectContent>
                        </Select>

                        {errors.tenderId && (
                            <p className="text-sm text-destructive">
                                Please select a tender.
                            </p>
                        )}

                        {selectedTender && (
                            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                <p className="text-sm font-medium text-gray-700">Vendor</p>
                                <p className="text-sm text-gray-600">{selectedTender.vendor_name}</p>
                            </div>
                        )}

                    </div>

                    <div className="space-y-2">

                        <Label>
                            Board Paper Title <span className="text-destructive">*</span>
                        </Label>

                        <Input
                            className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                            value={formData.title}
                            placeholder="Enter board paper title"
                            onChange={(e) =>
                                handleChange("title", e.target.value)
                            }
                        />

                        {errors.title && (
                            <p className="text-sm text-destructive">
                                Board Paper Title is required.
                            </p>
                        )}

                    </div>

                    <div className="space-y-2">

                        <Label>
                            Purpose <span className="text-destructive">*</span>
                        </Label>

                        <Select
                            onValueChange={(value) =>
                                handleChange("purpose", value)
                            }
                        >
                            <SelectTrigger
                                className={
                                    errors.purpose
                                        ? "border-destructive"
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
                            <p className="text-sm text-destructive">
                                Purpose is required.
                            </p>
                        )}

                    </div>

                    <div className="space-y-2">

                        <Label>
                            Prepared By <span className="text-destructive">*</span>
                        </Label>

                        <Input
                            className={errors.preparedBy ? "border-destructive focus-visible:ring-destructive" : ""}
                            value={formData.preparedBy}
                            placeholder="Enter your name"
                            onChange={(e) =>
                                handleChange("preparedBy", e.target.value)
                            }
                        />

                        {errors.preparedBy && (
                            <p className="text-sm text-destructive">
                                Prepared By is required.
                            </p>
                        )}

                    </div>

                    <div className="flex justify-end gap-3">

                        <Button
                            variant="outline"
                            onClick={() => navigate("/history")}
                        >
                            History
                        </Button>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading || noEligibleTenders}
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