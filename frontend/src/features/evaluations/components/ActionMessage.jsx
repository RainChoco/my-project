import { CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { cn } from '../../../lib';

export function ActionMessage({ message }) {
  if (!message) return null;

  const isSuccess = message.type === 'success';
  return (
    <Alert
      className={cn(
        isSuccess
          ? 'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600'
          : 'border-destructive/50 text-destructive [&>svg]:text-destructive'
      )}
    >
      {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <AlertDescription>{message.text}</AlertDescription>
    </Alert>
  );
}
