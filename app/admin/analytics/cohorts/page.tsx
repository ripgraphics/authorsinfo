// app/admin/analytics/cohorts/page.tsx
import CohortAnalysisDashboard from '@/components/analytics/cohort-analysis-dashboard';
import { PageHeader, PageHeaderHeading } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CohortAnalysisPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader>
        <PageHeaderHeading>Cohort Analysis & Retention</PageHeaderHeading>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            This dashboard provides a high-level overview of user cohorts based on their signup period. The data is sourced from a pre-calculated materialized view for performance.
          </p>
          <CohortAnalysisDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
