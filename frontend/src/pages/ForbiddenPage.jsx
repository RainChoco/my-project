import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-semibold">403 - Access denied</h1>
      <p className="text-sm text-muted-foreground">
        Your account role doesn't have permission to view this page.
      </p>
      <Button asChild>
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}

export default ForbiddenPage;
