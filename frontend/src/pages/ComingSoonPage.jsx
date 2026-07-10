import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

// Placeholder for feature pages not yet built by their owning scope.
// Swap out for the real page component once that scope's UI lands.
function ComingSoonPage({ title, description }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default ComingSoonPage;
