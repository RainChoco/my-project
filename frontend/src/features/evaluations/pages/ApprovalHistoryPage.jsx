import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { Separator } from '../../../components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { EvaluationStatusBadge, DecisionBadge } from '../components/StatusBadge';
import { CriterionScoresTable } from '../components/CriterionScoresTable';
import { ApprovalForm } from '../components/ApprovalForm';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import { fetchEvaluation } from '../services/evaluationApi';
import { fetchApprovals, createApproval } from '../services/approvalApi';
import { fetchBoardPaperForTender } from '../services/boardPaperSummaryApi';
import { useAuth } from '../../../context';
import { ROLES } from '../../../routes/routeConfig';

const BOARD_PAPER_SECTIONS = [
  { key: 'executiveSummary', label: 'Executive Summary' },
  { key: 'background', label: 'Background' },
  { key: 'scopeOfWork', label: 'Scope of Work' },
  { key: 'financialAnalysis', label: 'Financial Analysis' },
  { key: 'riskAssessment', label: 'Risk Assessment' },
  { key: 'recommendation', label: 'Recommendation' },
];

// UC-B9/B10: the manager's dedicated screen for reviewing an evaluation before
// approving/rejecting it - criteria scores, a board paper summary for context,
// the decision history, and (management only) the decision form itself.
export default function ApprovalHistoryPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, showSuccess } = useActionMessage();

  const [approvalError, setApprovalError] = useState(null);

  const evaluationQuery = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => fetchEvaluation(id),
  });

  const approvalsQuery = useQuery({
    queryKey: ['evaluation-approvals', id],
    queryFn: () => fetchApprovals(id),
  });

  const evaluation = evaluationQuery.data;

  const boardPaperQuery = useQuery({
    queryKey: ['board-paper-for-tender', evaluation?.tender_id],
    queryFn: () => fetchBoardPaperForTender(evaluation.tender_id),
    enabled: Boolean(evaluation?.tender_id),
  });

  const approvalMutation = useMutation({
    mutationFn: (values) => createApproval(id, values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-approvals', id] });
      setApprovalError(null);
      showSuccess(variables.decision === 'approved' ? 'Evaluation approved successfully.' : 'Evaluation rejected.');
    },
    onError: (err) => setApprovalError(getErrorMessage(err)),
  });

  if (evaluationQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (evaluationQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {evaluationQuery.error?.response?.status === 404
            ? 'No evaluation found with that id.'
            : getErrorMessage(evaluationQuery.error, 'Failed to load this evaluation.')}
        </p>
        <Button variant="outline" onClick={() => evaluationQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  // Backend enforces authorise('management') on POST /evaluations/:id/approvals -
  // gated here too so non-management users see the read-only decision history
  // instead of controls that would just 403 on submit.
  const canDecide = role === ROLES.MANAGEMENT && evaluation.status === 'scored';
  const decisionCompleted = ['approved', 'rejected'].includes(evaluation.status);
  const boardPaper = boardPaperQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/evaluations/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
          Back to evaluation
        </Button>
      </div>

      <ActionMessage message={message} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Approval</h1>
          <p className="text-sm text-muted-foreground">
            Manager decision for Evaluation #{evaluation.id} -{' '}
            {evaluation.tender_ref_no ? `${evaluation.tender_ref_no} - ${evaluation.vendor_name}` : `Tender #${evaluation.tender_id}`}
          </p>
        </div>
        <EvaluationStatusBadge status={evaluation.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PQM score</CardTitle>
          <CardDescription>Backend-calculated weighted total for this evaluation attempt.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Price score</p>
            <p className="text-lg font-semibold">{evaluation.price_score ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quality score</p>
            <p className="text-lg font-semibold">{evaluation.quality_score ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">PQM score</p>
            <p className="text-lg font-semibold">{evaluation.pqm_score ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Evaluation date</p>
            <p className="text-lg font-semibold">{evaluation.evaluation_date ?? '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criteria scores</CardTitle>
          <CardDescription>Criteria, weights, and staff scores exactly as recorded on this evaluation attempt.</CardDescription>
        </CardHeader>
        <CardContent>
          <CriterionScoresTable criterionScores={evaluation.criterion_scores} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Board paper summary</CardTitle>
          <CardDescription>Report context from Scope C's board paper for this tender, where one has been generated.</CardDescription>
        </CardHeader>
        <CardContent>
          {boardPaperQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : boardPaperQuery.isError ? (
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(boardPaperQuery.error, 'Failed to load the board paper summary.')}
            </p>
          ) : !boardPaper ? (
            <p className="text-sm text-muted-foreground">No board paper has been generated yet for this tender.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{boardPaper.title}</p>
                  <p className="text-sm text-muted-foreground">{boardPaper.purpose}</p>
                </div>
                <Badge variant="outline">{boardPaper.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">AI confidence</p>
                  <p className="text-lg font-semibold">{boardPaper.confidence}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-lg font-semibold">{boardPaper.score}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prepared by</p>
                  <p className="text-sm">{boardPaper.preparedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Generated by</p>
                  <p className="text-sm">{boardPaper.generatedBy}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium">Sections included</p>
                <div className="flex flex-wrap gap-2">
                  {BOARD_PAPER_SECTIONS.filter((section) => boardPaper[section.key]).map((section) => (
                    <Badge key={section.key} variant="secondary">{section.label}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Final recommendation</p>
                <p className="text-sm">{boardPaper.finalRecommendation}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decision history</CardTitle>
          <CardDescription>Append-only audit trail - a new evaluation attempt starts its own fresh history.</CardDescription>
        </CardHeader>
        <CardContent>
          {approvalsQuery.isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : approvalsQuery.isError ? (
            <p className="text-sm text-muted-foreground">{getErrorMessage(approvalsQuery.error, 'Failed to load approval history.')}</p>
          ) : approvalsQuery.data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Awaiting approval.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Decision</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Decision Date</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalsQuery.data.data.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell><DecisionBadge decision={approval.decision} /></TableCell>
                    <TableCell>{approval.approver_name ?? `Manager #${approval.approver_id}`}</TableCell>
                    <TableCell>
                      {new Date(approval.decided_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="max-w-sm truncate">{approval.remarks ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canDecide && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manager Decision</CardTitle>
            <CardDescription>Approve or reject this evaluation. Remarks are required when rejecting.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalForm
              onSubmit={(values) => approvalMutation.mutateAsync(values)}
              isSubmitting={approvalMutation.isPending}
              submitError={approvalError}
            />
          </CardContent>
        </Card>
      )}

      {decisionCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manager Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              Decision Completed - see Decision history above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
