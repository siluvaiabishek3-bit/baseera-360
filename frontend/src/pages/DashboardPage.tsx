import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { mockAPI } from '@/services/mockDataService';

export function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await mockAPI.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'In Progress').length,
    completedProjects: projects.filter((p) => p.status === 'Completed').length,
    pendingProjects: projects.filter((p) => p.status === 'Planning').length,
  };

  const chartData = [
    { name: 'In Progress', value: stats.activeProjects, fill: '#f97316' },
    { name: 'Completed', value: stats.completedProjects, fill: '#22c55e' },
    { name: 'Planning', value: stats.pendingProjects, fill: '#6b7280' },
  ];

  const recentProjects = projects.slice(0, 5);

  const defectDistribution = [
    { name: 'Cracks', value: 35 },
    { name: 'Corrosion', value: 25 },
    { name: 'Spalling', value: 22 },
    { name: 'Water Ingress', value: 18 },
  ];

  const timelineData = [
    { month: 'Jan', projects: 2, defects: 12 },
    { month: 'Feb', projects: 3, defects: 18 },
    { month: 'Mar', projects: 5, defects: 24 },
    { month: 'Apr', projects: 4, defects: 20 },
    { month: 'May', projects: 6, defects: 31 },
    { month: 'Jun', projects: 3, defects: 15 },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin w-12 h-12 border-4 border-baseera-red border-t-transparent rounded-full"></div>
        <p className="text-gray-600 mt-4">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="bg-white border-b border-baseera-red p-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to BASEERA 360 Inspection Portal</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-8">
        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Projects */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              border: '1px solid #e5e5e5',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 16px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => navigate('/projects')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                  TOTAL PROJECTS
                </p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  {stats.totalProjects}
                </p>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundImage: 'linear-gradient(135deg, #DC143C 0%, #FF4444 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={28} color="white" />
              </div>
            </div>
          </div>

          {/* Active Projects */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              border: '1px solid #e5e5e5',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 16px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                  IN PROGRESS
                </p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  {stats.activeProjects}
                </p>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundImage: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={28} color="white" />
              </div>
            </div>
          </div>

          {/* Completed Projects */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              border: '1px solid #e5e5e5',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 16px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                  COMPLETED
                </p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  {stats.completedProjects}
                </p>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundImage: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={28} color="white" />
              </div>
            </div>
          </div>

          {/* Planning */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              border: '1px solid #e5e5e5',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 16px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                  PLANNING
                </p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  {stats.pendingProjects}
                </p>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundImage: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle size={28} color="white" />
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Project Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Project Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Projects & Defects Timeline</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="projects" stroke="#DC143C" strokeWidth={2} name="Projects" />
                <Line type="monotone" dataKey="defects" stroke="#f97316" strokeWidth={2} name="Defects Found" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DEFECT DISTRIBUTION & RECENT PROJECTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Defect Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Defect Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={defectDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#DC143C" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Projects */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Projects</h3>
              <button
                onClick={() => navigate('/projects')}
                className="text-baseera-red hover:text-baseera-red-dark font-semibold text-sm transition"
              >
                View All →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Project Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Building</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Client</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((project) => (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{project.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{project.buildingName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{project.clientName}</td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          style={{
                            backgroundColor:
                              project.status === 'Completed'
                                ? '#dbeafe'
                                : project.status === 'In Progress'
                                ? '#fed7aa'
                                : '#e5e7eb',
                            color:
                              project.status === 'Completed'
                                ? '#1e40af'
                                : project.status === 'In Progress'
                                ? '#b45309'
                                : '#374151',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontWeight: '600',
                          }}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="text-baseera-red hover:text-baseera-red-dark font-semibold transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="bg-gradient-to-r from-baseera-black to-baseera-red text-white px-6 py-3 rounded-lg hover:shadow-lg transition font-semibold flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              Create Project
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="border border-gray-300 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
            >
              <Users size={18} />
              View Projects
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="border border-gray-300 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
            >
              <TrendingUp size={18} />
              Analytics
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="border border-gray-300 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;