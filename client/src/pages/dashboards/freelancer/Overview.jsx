import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { 
  Briefcase, Calendar, DollarSign, TrendingUp, 
  UserCheck, Clock, Star, Download,
  Eye, MessageSquare, ArrowUpRight, ArrowDownRight
} from "lucide-react";

import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function FreelancerOverview() {
  const { fetchAPI, currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState("month");
  const [loading, setLoading] = useState(true);
  
  // États pour les données
  const [stats, setStats] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [projectTypeData, setProjectTypeData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Récupérer les stats principales
      const statsResponse = await fetchAPI('/freelancer-dashboard/stats');
      if (statsResponse.success) {
        const statsData = statsResponse.data;
        setStats([
          {
            title: "Total Revenue",
            value: statsData.totalRevenue.formatted,
            change: statsData.totalRevenue.change,
            isPositive: statsData.totalRevenue.isPositive,
            icon: <DollarSign size={20} />,
            color: "text-green-600"
          },
          {
            title: "Total Missions",
            value: statsData.totalMissions.value.toString(),
            change: statsData.totalMissions.change,
            isPositive: statsData.totalMissions.isPositive,
            icon: <Briefcase size={20} />,
            color: "text-blue-600"
          },
          {
            title: "Client Satisfaction",
            value: statsData.clientSatisfaction.formatted,
            change: statsData.clientSatisfaction.change,
            isPositive: statsData.clientSatisfaction.isPositive,
            icon: <Star size={20} />,
            color: "text-yellow-600"
          },
          {
            title: "Avg. Response Time",
            value: statsData.avgResponseTime.formatted,
            change: statsData.avgResponseTime.change,
            isPositive: statsData.avgResponseTime.isPositive,
            icon: <Clock size={20} />,
            color: "text-purple-600"
          }
        ]);
      }

      // Récupérer les données de revenu
      const revenueResponse = await fetchAPI('/freelancer-dashboard/revenue');
      if (revenueResponse.success) {
        setRevenueData(revenueResponse.data);
      }

      // Récupérer la distribution des missions par statut
      const distributionResponse = await fetchAPI('/freelancer-dashboard/mission-status');
      if (distributionResponse.success) {
        setProjectTypeData(distributionResponse.data);
      }

      // Récupérer la performance hebdomadaire
      const performanceResponse = await fetchAPI('/freelancer-dashboard/weekly-performance');
      if (performanceResponse.success) {
        setPerformanceData(performanceResponse.data);
      }

      // Récupérer les projets récents
      const projectsResponse = await fetchAPI('/freelancer-dashboard/recent-projects');
      if (projectsResponse.success) {
        setRecentProjects(projectsResponse.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "completed": { label: "Completed", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      "in-progress": { label: "In Progress", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      "pending": { label: "Pending", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {currentUser?.firstName}! Here's what's happening with your projects today.
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${stat.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{stat.change}</span>
                  <span className="text-gray-500 dark:text-gray-400">from last period</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span>Revenue</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, fill: '#4f46e5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Types Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mission Distribution</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">By category</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent}%`}
                >
                  {projectTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Performance</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Pending</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#4f46e5" name="Completed Tasks" />
                <Bar dataKey="pending" fill="#f97316" name="Pending Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
            View all
            <ArrowUpRight size={16} />
          </button>
        </div>
        
        <div className="space-y-4">
          {recentProjects.map((project) => (
            <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{project.client}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Deadline</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(project.deadline)}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(project.budget)}</p>
                </div>
                
                <div className="w-24">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  {getStatusBadge(project.status)}
                </div>
                
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-2">Need help?</h3>
          <p className="text-sm opacity-90 mb-4">Contact our support team for assistance</p>
          <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
            Get Support
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-2">Boost your profile</h3>
          <p className="text-sm opacity-90 mb-4">Add new skills to attract more clients</p>
          <button className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
            Update Skills
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-2">Share feedback</h3>
          <p className="text-sm opacity-90 mb-4">Help us improve the platform</p>
          <button className="px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
            Give Feedback
          </button>
        </div>
      </div> */}
    </div>
  );
}