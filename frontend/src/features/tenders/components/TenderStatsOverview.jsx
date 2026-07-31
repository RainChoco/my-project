import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '../utils/format';

function StatCard({ label, value, subtitle, isLoading }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {isLoading ? (
          <Skeleton className="mt-1.5 h-7 w-16" />
        ) : (
          <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
        )}
        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

function formatMonthLabel(period) {
  const [year, month] = period.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-SG', { month: 'short', year: '2-digit' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-semibold">{label}</div>
      <div>{payload[0].value} submission{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
}

// Stats/chart are derived from whatever tender rows are currently loaded on the page
// (i.e. the active filters/pagination), not a separate full-dataset fetch - so they
// reflect "what's in view", matching the "X tender(s) on record" count above the table.
function TenderStatsOverview({ tenders = [], totalCount = 0, isLoading }) {
  const totalOfferValue = tenders.reduce((sum, t) => sum + Number(t.main_offer_price || 0), 0);
  const eligibleCount = tenders.filter((t) => t.eligibility_status === 'eligible').length;
  const eligibleRate = tenders.length > 0 ? Math.round((eligibleCount / tenders.length) * 100) : 0;
  const pendingReviewCount = tenders.filter((t) => ['submitted', 'under_evaluation'].includes(t.status)).length;

  const monthMap = {};
  tenders.forEach((t) => {
    if (!t.submission_date) return;
    const period = String(t.submission_date).slice(0, 7); // 'YYYY-MM'
    monthMap[period] = (monthMap[period] || 0) + 1;
  });
  const chartData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ name: formatMonthLabel(period), count }));

  const isEmpty = !isLoading && tenders.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Submissions"
          value={totalCount}
          subtitle="Matching current filters"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Offered Value"
          value={formatCurrency(totalOfferValue)}
          subtitle="Sum of main offer prices"
          isLoading={isLoading}
        />
        <StatCard
          label="Eligible Rate"
          value={`${eligibleRate}%`}
          subtitle={`${eligibleCount} of ${tenders.length} eligible`}
          isLoading={isLoading}
        />
        <StatCard
          label="Pending Review"
          value={pendingReviewCount}
          subtitle="Submitted or under evaluation"
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tender Submissions Over Time</CardTitle>
          <CardDescription>Submission count by month</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : isEmpty ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <span className="text-2xl">📈</span>
              <span className="text-sm">No submission data yet</span>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TenderStatsOverview;
