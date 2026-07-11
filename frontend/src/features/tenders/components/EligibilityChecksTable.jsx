import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

function EligibilityChecksTable({ checks, isLoading, canOverride, onOverrideRequest }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!checks || checks.length === 0) {
    return (
      <Alert>
        <AlertDescription>Eligibility not yet assessed for this tender.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Criterion</TableHead>
          <TableHead>Actual Value</TableHead>
          <TableHead>Threshold Used</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checks.map((check) => (
          <TableRow key={check.id}>
            <TableCell className="font-medium">{check.criterion}</TableCell>
            <TableCell>{check.actual_value ?? '-'}</TableCell>
            <TableCell>{check.threshold_value_used ?? '-'}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant={check.passed ? 'success' : 'destructive'}>
                  {check.passed ? 'Passed' : 'Failed'}
                </Badge>
                {!check.passed && canOverride && (
                  <Button variant="outline" size="sm" onClick={() => onOverrideRequest(check)}>
                    Override
                  </Button>
                )}
              </div>
            </TableCell>
            <TableCell className="capitalize">{check.source?.replace('_', ' ') ?? '-'}</TableCell>
            <TableCell className="max-w-xs text-muted-foreground">{check.notes ?? '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default EligibilityChecksTable;
