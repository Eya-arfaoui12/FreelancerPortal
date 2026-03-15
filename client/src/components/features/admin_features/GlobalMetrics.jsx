import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GroupIcon,
  FolderIcon,
  PageIcon,
  DocsIcon
} from "../../../icons";
import Badge from "../../ui/badge/Badge";

export default function GlobalMetrics() {
  const { fetchAPI } = useAuth();
  const [metrics, setMetrics] = useState({
    freelancers: { total: 0, growth: 0, trend: 'up' },
    projects: { total: 0, growth: 0, trend: 'up' },
    activeProjects: { total: 0, growth: 0, trend: 'up' },
    ongoingContracts: { total: 0, growth: 0, trend: 'up' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetchAPI('/dashboard/metrics');
        if (response.success) {
          setMetrics(response.data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [fetchAPI]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
            <div className="mt-5 space-y-2">
              <div className="w-20 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="w-24 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Freelancers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Freelancers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.freelancers.total)}
            </h4>
          </div>
          <Badge color={metrics.freelancers.trend === 'up' ? 'success' : 'error'}>
            {metrics.freelancers.trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(metrics.freelancers.growth).toFixed(2)}%
          </Badge>
        </div>
      </div>

      {/* Projects */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <FolderIcon className="text-gray-800 size-5 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Projects
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.projects.total)}
            </h4>
          </div>

          <Badge color={metrics.projects.trend === 'up' ? 'success' : 'error'}>
            {metrics.projects.trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(metrics.projects.growth).toFixed(2)}%
          </Badge>
        </div>
      </div>

      {/* Active Projects */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <PageIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active Projects
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.activeProjects.total)}
            </h4>
          </div>

          <Badge color={metrics.activeProjects.trend === 'up' ? 'success' : 'error'}>
            {metrics.activeProjects.trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(metrics.activeProjects.growth).toFixed(2)}%
          </Badge>
        </div>
      </div>

      {/* Ongoing Contracts */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DocsIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Ongoing Contracts
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.ongoingContracts.total)}
            </h4>
          </div>

          <Badge color={metrics.ongoingContracts.trend === 'up' ? 'success' : 'error'}>
            {metrics.ongoingContracts.trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(metrics.ongoingContracts.growth).toFixed(2)}%
          </Badge>
        </div>
      </div>
    </div>
  );
}