import { useEffect, useState } from "react";
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

import { getHistoryEntries } from "../utils/historyStorage";
import { deleteBoardPaper } from "../services/boardPaperApi";
import { deleteProposal } from "../services/proposalApi";
import { deleteHistoryEntry } from "../services/historyApi";
import { getHistoryEntryTargetId } from "../utils/historyEntryUtils";

function HistoryPage() {

    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const loadHistory = async () => {
        setLoading(true);

        try {
            const entries = await getHistoryEntries();

            setHistory(entries.map((item) => ({
                ...item,
                date: item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })
                    : "Unknown",
                status: "Generated",
            })));
        } catch (error) {
            console.error("Unable to load history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchHistory = async () => {
            if (!isMounted) {
                return;
            }

            await loadHistory();
        };

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleDelete = async (item) => {
        const idToDelete = getHistoryEntryTargetId(item);

        if (!idToDelete) {
            return;
        }

        const confirmed = window.confirm(`Delete ${item.title || "this entry"}?`);

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(idToDelete);

            // Delete only the history entry instead of the underlying resource.
            await deleteHistoryEntry(item.id || idToDelete);

            window.dispatchEvent(new Event("history-updated"));

            setHistory((previous) => previous.filter((entry) => entry.id !== (item.id || idToDelete)));
        } catch (error) {
            console.error("Unable to delete history entry", error);
        } finally {
            setDeletingId(null);
        }
    };

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
                                loading ? (

                                    <TableRow>

                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-gray-500 py-10"
                                        >

                                            Loading history...

                                        </TableCell>

                                    </TableRow>

                                ) : history.length === 0 ? (

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

                                            <TableCell className="space-x-2">

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (item.type === "Board Paper") {
                                                            navigate("/board-papers/result", {
                                                                state: {
                                                                    report: item.report || item,
                                                                    tenderLabel: item.tenderLabel || "Selected Tender",
                                                                    tenderId: item.tenderId,
                                                                    title: item.title,
                                                                    purpose: item.purpose,
                                                                    preparedBy: item.preparedBy,
                                                                }
                                                            });
                                                        } else {
                                                            navigate("/proposal-report/result", {
                                                                state: item.proposal || {
                                                                    proposalTitle: item.proposalTitle,
                                                                    proposalType: item.proposalType,
                                                                    sections: {
                                                                        content: "Proposal content unavailable."
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }}
                                                >
                                                    View
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(item)}
                                                    disabled={deletingId === getHistoryEntryTargetId(item)}
                                                >
                                                    {deletingId === getHistoryEntryTargetId(item) ? "Deleting..." : "Delete"}
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