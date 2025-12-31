/**
 * CSV Export utilities for admin dashboard
 * Provides methods to export various admin data to CSV format
 */

interface CSVRow {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Convert an array of objects to CSV format
 */
export function convertToCSV(data: CSVRow[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Use provided headers or extract from first row
  const csvHeaders = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = csvHeaders.map((header) => `"${header}"`).join(',');

  // Create data rows
  const dataRows = data.map((row) =>
    csvHeaders
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '""';
        }
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsToCSV(filters?: any): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      format: 'csv',
      ...filters,
    });

    const response = await fetch(`/api/admin/audit-logs?${queryParams}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to export audit logs');
    }

    // Get the CSV content from response
    const csvContent = await response.text();

    // Download the file
    downloadCSV(csvContent, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
}

/**
 * Export user growth data to CSV
 */
export function exportUserGrowthToCSV(data: any[]): void {
  const headers = ['Date', 'New Users', 'Active Users', 'Total Users'];

  const csvData = data.map((row) => ({
    Date: row.date || '',
    'New Users': row.newUsers || 0,
    'Active Users': row.activeUsers || 0,
    'Total Users': row.totalUsers || 0,
  }));

  const csvContent = convertToCSV(csvData, headers);
  downloadCSV(csvContent, `user-growth-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export engagement data to CSV
 */
export function exportEngagementToCSV(data: any[]): void {
  const headers = ['Date', 'Engagement', 'Unique Users', 'Avg Engagement'];

  const csvData = data.map((row) => ({
    Date: row.date || '',
    Engagement: row.engagement || 0,
    'Unique Users': row.uniqueUsers || 0,
    'Avg Engagement': row.avgEngagement || 0,
  }));

  const csvContent = convertToCSV(csvData, headers);
  downloadCSV(csvContent, `engagement-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export moderation queue to CSV
 */
export function exportModerationQueueToCSV(data: any[]): void {
  const headers = ['ID', 'Content Type', 'Priority', 'Status', 'Flags', 'Created At'];

  const csvData = data.map((item) => ({
    ID: item.id?.slice(0, 8) || '',
    'Content Type': item.content_type || '',
    Priority: item.priority || '',
    Status: item.status || '',
    Flags: item.flag_count || 0,
    'Created At': item.created_at ? new Date(item.created_at).toLocaleString() : '',
  }));

  const csvContent = convertToCSV(csvData, headers);
  downloadCSV(
    csvContent,
    `moderation-queue-${new Date().toISOString().split('T')[0]}.csv`
  );
}

/**
 * Export platform stats to CSV
 */
export function exportPlatformStatsToCSV(stats: any): void {
  const data = [
    { Metric: 'Total Users', Value: stats.overview.totalUsers },
    { Metric: 'Total Books', Value: stats.overview.totalBooks },
    { Metric: 'Total Authors', Value: stats.overview.totalAuthors },
    { Metric: 'Total Groups', Value: stats.overview.totalGroups },
    { Metric: 'Total Events', Value: stats.overview.totalEvents },
    { Metric: 'Total Reviews', Value: stats.overview.totalReviews },
    { Metric: 'Total Posts', Value: stats.overview.totalPosts },
    { Metric: 'New Users This Month', Value: stats.activity.newUsersThisMonth },
    { Metric: 'Daily Active Users', Value: stats.activity.dailyActiveUsers },
    { Metric: 'Monthly Active Users', Value: stats.activity.monthlyActiveUsers },
    { Metric: 'User Growth Rate', Value: `${stats.activity.userGrowthRate}%` },
    { Metric: 'Pending Moderation', Value: stats.moderation.pendingItems },
  ];

  const csvContent = convertToCSV(data, ['Metric', 'Value']);
  downloadCSV(csvContent, `platform-stats-${new Date().toISOString().split('T')[0]}.csv`);
}
