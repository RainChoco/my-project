import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';

// Sample shadcn/ui rendering, to confirm the Vite + Tailwind + shadcn setup works end-to-end.
function ShadcnDemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>shadcn/ui is working</CardTitle>
          <CardDescription>Card + Button rendered via Tailwind CSS 3.x</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This Card and the Button below are both shadcn/ui components, styled with the project's Tailwind config.
          </p>
        </CardContent>
        <CardFooter>
          <Button>Click me</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ShadcnDemoPage;
