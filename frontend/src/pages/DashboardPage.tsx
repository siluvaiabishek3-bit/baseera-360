import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, MapPin, BarChart3 } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:3000/projects');
        const data = await response.json();
        setProjects(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || 'Engineer'}!
        </h1>
        <p className="text-gray-600">
          Here's your facade inspection overview for today.
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {projects.length}
              </p>
              <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Folder size={28} className="text-blue-900" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Inspections</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
              <p className="text-xs text-green-600 mt-1">↑ 8% this week</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <MapPin size={28} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Defects Found</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">127</p>
              <p className="text-xs text-orange-600 mt-1">47 critical</p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
              ⚠️
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">87%</p>
              <p className="text-xs text-green-600 mt-1">↑ 5% improvement</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 size={28} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* PROJECTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your facade inspection projects
            </p>
          </div>
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-gray-600 mt-4">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4 text-lg">No projects yet</p>
            <button 
              onClick={() => navigate('/projects')}
              className="text-blue-900 hover:text-blue-700 font-semibold"
            >
              Create your first project →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Project Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Building
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project: any) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500">{project.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {project.buildingName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {project.clientName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        ● Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-blue-900 hover:text-blue-700 font-semibold text-sm"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;