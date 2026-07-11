import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '../utils/format';
import { FILE_TYPE_LABELS } from '../constants';

function TenderDocumentsList({ documents, isLoading, canManage, onReplaceRequest, replacingDocumentId }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Filename</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">File</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="capitalize">{FILE_TYPE_LABELS[doc.file_type] ?? doc.file_type}</TableCell>
            <TableCell>{doc.original_filename}</TableCell>
            <TableCell>
              v{doc.version} {doc.is_latest && <Badge variant="success" className="ml-1">latest</Badge>}
            </TableCell>
            <TableCell>{formatDateTime(doc.uploaded_at)}</TableCell>
            <TableCell className="text-right">
              <a
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open
              </a>
            </TableCell>
            {canManage && (
              <TableCell className="text-right">
                {doc.is_latest && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(replacingDocumentId)}
                    onClick={() => onReplaceRequest(doc)}
                  >
                    {replacingDocumentId === doc.id ? 'Replacing...' : 'Replace'}
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default TenderDocumentsList;
