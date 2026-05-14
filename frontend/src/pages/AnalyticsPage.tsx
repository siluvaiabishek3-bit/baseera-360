import { useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Building, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalyticsPage() {
  // Mock data for charts
  const defectsByType = [
    { name: 'Cracks', value: 45, color: '#3B82F6' },
    { name: 'Spalling', value: 32, color: '#EF4444' },
    { name: 'Corrosion', value: 28, color: '#F59E0B' },
    { name: 'Water Damage', value: 15, color: '#8B5CF6' },
    { name: 'Joint Failure', value: 7, color: '#10B981' },
  ];

  const defectsBySeverity = [
    { name: 'Critical', value: 12, color: '#DC2626' },
    { name: 'High', value: 28, color: '#F59E0B' },
    { name: 'Medium', value: 52, color: '#FBBF24' },
    { name: 'Low', value: 35, color: '#3B82F6' },
  ];

  const monthlyProgress = [
    { month: 'Jan', inspections: 12, defects: 45 },
    { month: 'Feb', inspections: 19, defects: 62 },
    { month: 'Mar', inspections: 15, defects: 48 },
    { month: 'Apr', inspections: 25, defects: 73 },
    { month: 'May', inspections: 22, defects: 89 },
    { month: 'Jun', inspections: 30, defects: 95 },
  ];

  const buildingCondition = [
    { building: 'Tower A', score: 85 },
    { building: 'Tower B', score: 72 },
    { building: 'Tower C', score: 91 },
    { building: 'Tower D', score: 68 },
    { building: 'Tower E', score: 78 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive inspection analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
            <button className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition font-semibold">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-8">
        {/* KEY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Building size={32} className="opacity-80" />
              <TrendingUp size={24} className="opacity-60" />
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Buildings</p>
            <p className="text-4xl font-bold">24</p>
            <p className="text-blue-100 text-xs mt-2">↑ 12% from last month</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle size={32} className="opacity-80" />
              <TrendingUp size={24} className="opacity-60" />
            </div>
            <p className="text-green-100 text-sm mb-1">Completed Inspections</p>
            <p className="text-4xl font-bold">127</p>
            <p className="text-green-100 text-xs mt-2">↑ 8% this week</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle size={32} className="opacity-80" />
              <TrendingUp size={24} className="opacity-60" />
            </div>
            <p className="text-orange-100 text-sm mb-1">Total Defects</p>
            <p className="text-4xl font-bold">412</p>
            <p className="text-orange-100 text-xs mt-2">47 critical</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 size={32} className="opacity-80" />
              <TrendingUp size={24} className="opacity-60" />
            </div>
            <p className="text-purple-100 text-sm mb-1">Avg Building Score</p>
            <p className="text-4xl font-bold">79%</p>
            <p className="text-purple-100 text-xs mt-2">↑ 5% improvement</p>
          </div>
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* DEFECTS BY TYPE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Defects by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={defectsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {defectsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* DEFECTS BY SEVERITY */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Defects by Severity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={defectsBySeverity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {defectsBySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHARTS ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MONTHLY PROGRESS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Progress</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="inspections" stroke="#3B82F6" strokeWidth={3} name="Inspections" />
                <Line type="monotone" dataKey="defects" stroke="#EF4444" strokeWidth={3} name="Defects Found" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* BUILDING CONDITION SCORES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Building Condition Scores</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buildingCondition} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="building" type="category" />
                <Tooltip />
                <Bar dataKey="score" fill="#10B981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <span className="font-bold text-blue-900">Positive Trend</span>
              </div>
              <p className="text-sm text-gray-700">Inspection completion rate increased by 15% this month</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <span className="font-bold text-orange-900">Attention Needed</span>
              </div>
              <p className="text-sm text-gray-700">Tower D has the lowest condition score and requires priority inspection</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <span className="font-bold text-green-900">Achievement</span>
              </div>
              <p className="text-sm text-gray-700">Tower C achieved 91% condition score - highest this quarter</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;