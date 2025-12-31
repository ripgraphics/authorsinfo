'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Download } from 'lucide-react';

export interface AuditLogFilters {
  source?: 'enterprise' | 'social' | 'privacy' | 'group' | 'moderation' | 'all';
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

interface AuditLogFilterProps {
  onFiltersChange: (filters: AuditLogFilters) => void;
  onExport?: () => void;
  isLoading?: boolean;
  filterCount?: number;
}

export function AuditLogFilter({
  onFiltersChange,
  onExport,
  isLoading = false,
  filterCount = 0,
}: AuditLogFilterProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    source: 'all',
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFiltersChange(filters);
    setIsExpanded(false);
  };

  const handleReset = () => {
    const emptyFilters: AuditLogFilters = { source: 'all' };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v && v !== 'all'
  ).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Audit Log Filters</CardTitle>
            <CardDescription>
              Filter audit logs by source, user, action, or date range
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} active
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Source Filter */}
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={filters.source || 'all'} onValueChange={(v) => handleFilterChange('source', v)}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="privacy">Privacy</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="moderation">Moderation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User ID Filter */}
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="User UUID..."
                value={filters.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                placeholder="e.g., create, update..."
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleApply} disabled={isLoading}>
              Apply Filters
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                Reset Filters
              </Button>
            )}
            {onExport && (
              <Button variant="outline" onClick={onExport} disabled={isLoading} className="ml-auto">
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface ModerationQueueFilterProps {
  onFiltersChange: (filters: ModerationFilters) => void;
  isLoading?: boolean;
}

export interface ModerationFilters {
  status?: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  contentType?: string;
}

export function ModerationQueueFilter({
  onFiltersChange,
  isLoading = false,
}: ModerationQueueFilterProps) {
  const [filters, setFilters] = useState<ModerationFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof ModerationFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFiltersChange(filters);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setFilters({});
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Moderation Queue Filters</CardTitle>
            <CardDescription>Filter by status, priority, or content type</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} active
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(v) => handleFilterChange('status', v)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={filters.priority || ''}
                onValueChange={(v) => handleFilterChange('priority', v)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <Input
                id="contentType"
                placeholder="e.g., post, comment..."
                value={filters.contentType || ''}
                onChange={(e) => handleFilterChange('contentType', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleApply} disabled={isLoading}>
              Apply Filters
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
