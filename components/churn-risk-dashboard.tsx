'use client';

import React, { useMemo } from 'react';
import { UserChurnRisk, RiskLevel, ChurnIntervention } from '@/types/analytics';
import { AlertTriangle, TrendingDown, Users, Activity, Send } from 'lucide-react';

/**
 * Props for ChurnRiskDashboard component
 */
export interface ChurnRiskDashboardProps {
  /** Array of users at churn risk */
  atRiskUsers: UserChurnRisk[];
  /** Array of active interventions */
  interventions?: ChurnIntervention[];
  /** Callback when intervention button is clicked */
  onCreateIntervention?: (userId: string) => void;
  /** Additional CSS classes for container */
  className?: string;
  /** Show loading state */
  isLoading?: boolean;
  /** Max users to display in table */
  maxUsers?: number;
  /** Page index for pagination */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

/**
 * Risk level styling
 */
interface RiskLevelStyle {
  bg: string;
  border: string;
  badge: string;
  icon: string;
}

/**
 * Get styling for risk level
 */
const getRiskLevelStyle = (level: RiskLevel): RiskLevelStyle => {
  const styles: Record<RiskLevel, RiskLevelStyle> = {
    low: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-800 border border-green-300',
      icon: 'text-green-600',
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      icon: 'text-yellow-600',
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800 border border-orange-300',
      icon: 'text-orange-600',
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800 border border-red-300',
      icon: 'text-red-600',
    },
  };
  return styles[level];
};

/**
 * Get risk level from score (0-100)
 */
const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 76) return RiskLevel.CRITICAL;
  if (score >= 51) return RiskLevel.HIGH;
  if (score >= 26) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
};

/**
 * ChurnRiskDashboard
 * 
 * Displays an overview of users at churn risk with:
 * - Risk score distribution (pie chart substitute)
 * - Risk level breakdown
 * - List of at-risk users with top factors
 * - Intervention tracking
 * - Action buttons for creating interventions
 * 
 * Features:
 * - Summary statistics
 * - Factor breakdown
 * - User list with pagination
 * - Color-coded risk levels
 * - Intervention history
 * - Loading states
 */
export const ChurnRiskDashboard: React.FC<ChurnRiskDashboardProps> = ({
  atRiskUsers,
  interventions = [],
  onCreateIntervention,
  className = '',
  isLoading = false,
  maxUsers = 10,
  page = 0,
  pageSize = 10,
}) => {
  // Calculate statistics
  const stats = useMemo(() => {
    if (!atRiskUsers || atRiskUsers.length === 0) {
      return {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        avgRiskScore: 0,
        topFactor: null,
      };
    }

    const critical = atRiskUsers.filter((u) => u.risk_score >= 76).length;
    const high = atRiskUsers.filter((u) => u.risk_score >= 51 && u.risk_score < 76).length;
    const medium = atRiskUsers.filter((u) => u.risk_score >= 26 && u.risk_score < 51).length;
    const low = atRiskUsers.filter((u) => u.risk_score < 26).length;
    const avgScore = atRiskUsers.reduce((sum, u) => sum + u.risk_score, 0) / atRiskUsers.length;

    return {
      total: atRiskUsers.length,
      critical,
      high,
      medium,
      low,
      avgRiskScore: avgScore,
      topFactor: null,
    };
  }, [atRiskUsers]);

  // Paginate users
  const startIdx = page * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedUsers = atRiskUsers.slice(startIdx, Math.min(endIdx, maxUsers));

  if (isLoading) {
    return (
      <div className={`w-full bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Churn Risk Dashboard</h3>
            <p className="text-sm text-slate-600">
              Users at risk of churning with intervention tracking
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Card */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Total At Risk</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-slate-400" />
            </div>
          </div>

          {/* Critical Card */}
          <div className="p-4 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-700 uppercase">Critical</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* High Card */}
          <div className="p-4 rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-700 uppercase">High</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{stats.high}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          {/* Medium Card */}
          <div className="p-4 rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-700 uppercase">Medium</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.medium}</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          {/* Average Score Card */}
          <div className="p-4 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase">Avg Score</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {stats.avgRiskScore.toFixed(1)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Risk Level Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-base font-semibold text-slate-900 mb-4">Risk Distribution</h4>
        <div className="space-y-3">
          {/* Critical Bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-red-700">Critical</span>
              <span className="text-sm text-gray-600">
                {stats.total > 0
                  ? `${Math.round((stats.critical / stats.total) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: stats.total > 0 ? `${(stats.critical / stats.total) * 100}%` : '0%',
                }}
              />
            </div>
          </div>

          {/* High Bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-orange-700">High</span>
              <span className="text-sm text-gray-600">
                {stats.total > 0
                  ? `${Math.round((stats.high / stats.total) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: stats.total > 0 ? `${(stats.high / stats.total) * 100}%` : '0%',
                }}
              />
            </div>
          </div>

          {/* Medium Bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-yellow-700">Medium</span>
              <span className="text-sm text-gray-600">
                {stats.total > 0
                  ? `${Math.round((stats.medium / stats.total) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: stats.total > 0 ? `${(stats.medium / stats.total) * 100}%` : '0%',
                }}
              />
            </div>
          </div>

          {/* Low Bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-green-700">Low</span>
              <span className="text-sm text-gray-600">
                {stats.total > 0
                  ? `${Math.round((stats.low / stats.total) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: stats.total > 0 ? `${(stats.low / stats.total) * 100}%` : '0%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
          <h4 className="text-base font-semibold text-slate-900">At-Risk Users</h4>
        </div>

        {atRiskUsers.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500 text-sm">No at-risk users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    User ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Risk Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Risk Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Activity Decline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.map((user, idx) => {
                  const riskLevel = getRiskLevel(user.risk_score);
                  const style = getRiskLevelStyle(riskLevel);
                  const hasIntervention = interventions?.some((i) => i.user_id === user.user_id);

                  return (
                    <tr
                      key={user.user_id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{user.user_id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{user.risk_score.toFixed(1)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
                          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          {user.activity_trend ? `${(user.activity_trend * 100).toFixed(0)}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => onCreateIntervention?.(user.user_id)}
                          disabled={hasIntervention}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                            hasIntervention
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          {hasIntervention ? 'Sent' : 'Intervene'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {atRiskUsers.length > pageSize && (
        <div className="text-xs text-gray-600 flex justify-between">
          <span>
            Showing {startIdx + 1}-{Math.min(endIdx, atRiskUsers.length)} of {atRiskUsers.length} users
          </span>
        </div>
      )}
    </div>
  );
};

ChurnRiskDashboard.displayName = 'ChurnRiskDashboard';

export default ChurnRiskDashboard;
