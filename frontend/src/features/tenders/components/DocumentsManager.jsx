import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import DocumentUploadForm from './DocumentUploadForm';
import TenderDocumentsList from './TenderDocumentsList';
import { uploadTenderDocument, replaceTenderDocument } from '../services/tenderApi';

function DocumentsManager({ tenderId, documents, isLoading, canManage }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const replaceInputRef = useRef(null);
  const [pendingReplaceDoc, setPendingReplaceDoc] = useState(null);
  const [uploadFormKey, setUploadFormKey] = useState(0);

  const invalidateDocuments = () => queryClient.invalidateQueries({ queryKey: ['tender-documents', tenderId] });

  const uploadMutation = useMutation({
    mutationFn: ({ file, fileType }) => uploadTenderDocument(tenderId, file, fileType),
    onSuccess: () => {
      toast({ title: 'Document uploaded', variant: 'success' });
      invalidateDocuments();
      setUploadFormKey((key) => key + 1); // remounts DocumentUploadForm to clear its file input
    },
    onError: (err) => {
      toast({
        title: 'Upload failed',
        description: err.response?.data?.message ?? 'Could not upload the document.',
        variant: 'destructive',
      });
    },
  });

  const replaceMutation = useMutation({
    mutationFn: ({ documentId, file }) => replaceTenderDocument(tenderId, documentId, file),
    onSuccess: () => {
      toast({ title: 'Document replaced', description: 'A new version was uploaded.', variant: 'success' });
      invalidateDocuments();
    },
    onError: (err) => {
      toast({
        title: 'Replace failed',
        description: err.response?.data?.message ?? 'Could not replace the document.',
        variant: 'destructive',
      });
    },
    onSettled: () => setPendingReplaceDoc(null),
  });

  const handleReplaceRequest = (doc) => {
    setPendingReplaceDoc(doc);
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same filename on a future replace
    if (!file || !pendingReplaceDoc) return;
    replaceMutation.mutate({ documentId: pendingReplaceDoc.id, file });
  };

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <DocumentUploadForm
          key={uploadFormKey}
          onUpload={(file, fileType) => uploadMutation.mutate({ file, fileType })}
          isPending={uploadMutation.isPending}
        />
      )}
      <TenderDocumentsList
        documents={documents}
        isLoading={isLoading}
        canManage={canManage}
        onReplaceRequest={handleReplaceRequest}
        replacingDocumentId={replaceMutation.isPending ? pendingReplaceDoc?.id : null}
      />
      {canManage && (
        <input
          ref={replaceInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleReplaceFileChange}
        />
      )}
    </div>
  );
}

export default DocumentsManager;
