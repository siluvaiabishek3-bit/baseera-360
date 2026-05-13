/**
 * BASEERA 360 - Projects Dashboard
 * Display and manage inspection projects
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/services/api';

interface Project {
  id: string;
  project_name: string;
  building_name: string;
  job_number: string;
  facade_type: string;
  client_name: string;
  status: string;
  media_count: number;
  annotation_count: number;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    buildingName: '',
    jobNumber: '',
    facadeType: 'Glass Curtain Wall',
    clientName: '',
    latitude: 28.5244,
    longitude: 55.2664,
    address: 'Dubai, UAE',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const userResponse = await apiClient.getCurrentUser();
      setUser(userResponse.data.user);

      // Get projects
      const projectsResponse = await apiClient.getProjects();
      setProjects(projectsResponse.data.projects || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      // If unauthorized, go back to login
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiClient.createProject(formData);
      
      // Add new project to list
      setProjects([response.data.project, ...projects]);
      
      // Reset form
      setFormData({
        projectName: '',
        buildingName: '',
        jobNumber: '',
        facadeType: 'Glass Curtain Wall',
        clientName: '',
        latitude: 28.5244,
        longitude: 55.2664,
        address: 'Dubai, UAE',
      });
      setShowForm(false);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to create project';
      setError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BASEERA 360</h1>
            <p className="text-gray-600">Facade Inspection Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title & Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Create Project Form */}
        {showForm && (
          <form
            onSubmit={handleCreateProject}
            className="bg-white rounded-lg shadow p-6 mb-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Project</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) =>
                    setFormData({ ...formData, projectName: e.target.value })
                  }
                  placeholder="e.g., Marina Tower Annual Inspection"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Building Name *
                </label>
                <input
                  type="text"
                  value={formData.buildingName}
                  onChange={(e) =>
                    setFormData({ ...formData, buildingName: e.target.value })
                  }
                  placeholder="e.g., Marina Tower"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Number *
                </label>
                <input
                  type="text"
                  value={formData.jobNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, jobNumber: e.target.value })
                  }
                  placeholder="e.g., MAR-2024-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Facade Type
                </label>
                <select
                  value={formData.facadeType}
                  onChange={(e) =>
                    setFormData({ ...formData, facadeType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Glass Curtain Wall</option>
                  <option>Stone Facade</option>
                  <option>Metal Panels</option>
                  <option>Mixed Materials</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  placeholder="e.g., DAMAC Properties"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="e.g., Downtown Dubai"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                ✓ Create Project
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first project to start inspecting facades
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition p-6"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {project.project_name}
                  </h3>
                  <p className="text-sm text-gray-600">{project.building_name}</p>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Job Number:</span>
                    <span className="font-semibold text-gray-900">{project.job_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Facade Type:</span>
                    <span className="font-semibold text-gray-900">{project.facade_type}</span>
                  </div>
                  {project.client_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Client:</span>
                      <span className="font-semibold text-gray-900">{project.client_name}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 flex gap-4 text-sm">
                  <div className="flex-1">
                    <p className="text-gray-600">Media</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {project.media_count || 0}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-600">Defects</p>
                    <p className="text-2xl font-bold text-red-600">
                      {project.annotation_count || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectsPage;
