import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

// Read-only rendering of an evaluation's criterion_scores snapshot - shared by
// EvaluationDetailPage.jsx (non-scoring view) and ApprovalHistoryPage.jsx.
export function CriterionScoresTable({ criterionScores }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Criterion</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead>Staff score</TableHead>
          <TableHead>Weighted contribution</TableHead>
          <TableHead>Remarks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {criterionScores.map((c) => (
          <TableRow key={c.evaluation_criteria_id}>
            <TableCell>{c.criteria_name}</TableCell>
            <TableCell className="capitalize">{c.category}</TableCell>
            <TableCell>{c.weight_percentage}%</TableCell>
            <TableCell>{c.staff_score ?? '-'}</TableCell>
            <TableCell>{c.weighted_score ?? '-'}</TableCell>
            <TableCell className="max-w-sm truncate">{c.remarks ?? '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
