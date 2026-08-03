import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../../components/ui/card";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";

const STATUS_BADGE_VARIANTS = {
    Generated: "success",
    Approved: "success",
    Pending: "warning",
};

function HistoryPage() {

    const navigate = useNavigate();

    // Temporary dummy data
    const history = [
        {
            id: 1,
            title: "Board Paper - Lift Maintenance",
            type: "Board Paper",
            date: "13 Jul 2026",
            status: "Generated",
        },
        {
            id: 2,
            title: "Managing Agent Proposal",
            type: "Proposal",
            date: "13 Jul 2026",
            status: "Generated",
        },
        {
            id: 3,
            title: "Cleaning Services Board Paper",
            type: "Board Paper",
            date: "11 Jul 2026",
            status: "Approved",
        },
        {
            id: 4,
            title: "Cleaning Services Proposal",
            type: "Proposal",
            date: "11 Jul 2026",
            status: "Pending",
        },
    ];

    return (

        <div className="space-y-6">

            <div className="flex items-center justify-between">

                <div>

                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Generation History
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        View previously generated board papers and proposals.
                    </p>

                </div>

                <Button
                    variant="outline"
                    onClick={() => navigate("/board-papers")}
                >
                    Back
                </Button>

            </div>

            <Card>

                <CardHeader>

                    <CardTitle>
                        History
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <Table>

                        <TableHeader>

                            <TableRow>

                                <TableHead>Title</TableHead>

                                <TableHead>Type</TableHead>

                                <TableHead>Date</TableHead>

                                <TableHead>Status</TableHead>

                                <TableHead>Action</TableHead>

                            </TableRow>

                        </TableHeader>

                        <TableBody>

                            {
                                history.length === 0 ? (

                                    <TableRow>

                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-muted-foreground py-10"
                                        >

                                            No board papers or proposals generated yet.

                                        </TableCell>

                                    </TableRow>

                                ) :

                                    history.map((item) => (

                                        <TableRow key={item.id}>

                                            <TableCell>
                                                {item.title}
                                            </TableCell>

                                            <TableCell>
                                                {item.type}
                                            </TableCell>

                                            <TableCell>
                                                {item.date}
                                            </TableCell>

                                            <TableCell>

                                                <Badge variant={STATUS_BADGE_VARIANTS[item.status] ?? "secondary"}>
                                                    {item.status}
                                                </Badge>

                                            </TableCell>

                                            <TableCell>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (item.type === "Board Paper") {
                                                            navigate("/board-papers/result");
                                                        } else {
                                                            navigate("/board-papers/proposal-result");
                                                        }
                                                    }}
                                                >
                                                    View
                                                </Button>

                                            </TableCell>

                                        </TableRow>

                                    ))}

                        </TableBody>

                    </Table>

                </CardContent>

            </Card>

        </div>

    );

}

export default HistoryPage;