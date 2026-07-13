import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/button";

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

                    <h1 className="text-3xl font-bold text-red-700">
                        Generation History
                    </h1>

                    <p className="mt-2 text-gray-500">
                        View previously generated board papers and proposals.
                    </p>

                    <hr className="mt-6 border-gray-200" />

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
                                            className="text-center text-gray-500 py-10"
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

                                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                                    {item.status}

                                                </span>

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