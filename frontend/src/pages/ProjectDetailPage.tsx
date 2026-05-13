/**
 * BASEERA 360 - Project Detail Page
 * View and manage project details, media, and team
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/services/api';

interface Project {
  id: string;
  projectName: string;
  buildingName: string;
  jobNumber: string;
  facadeType: string;
  clientName?: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
  statistics: {
    mediaCount: number;
    annotationCount: number;
    zoneCount: number;
  };
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'team' | 'annotations'>(
    'overview'
  );
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      if (!projectId) return;

      const response = await apiClient.getProject(projectId);
      setProject(response.data.project);
      setEditForm(response.data.project);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      if (err.response?.status === 404) {
        setError('Project not found');
      } else {
        setError('Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      if (!projectId) return;

      const response = await apiClient.updateProject(projectId, editForm);
      setProject(response.data.project);
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/projects')}
            className="mb-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← Back to Projects
          </button>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-red-600 text-lg">{error || 'Project not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-start">
          <div>
            <button
              onClick={() => navigate('/projects')}
              className="text-blue-600 hover:text-blue-700 mb-2 text-sm"
            >
              ← Back to Projects
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{project.projectName}</h1>
            <p className="text-gray-600">{project.buildingName}</p>
            <p className="text-sm text-gray-500 mt-1">Job: {project.jobNumber}</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                project.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6">
              {(['overview', 'media', 'team', 'annotations'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 font-medium border-b-2 transition ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'overview' && '📋 Overview'}
                  {tab === 'media' && '🖼️ Media'}
                  {tab === 'team' && '👥 Team'}
                  {tab === 'annotations' && '✍️ Annotations'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                {editMode ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Project Name
                        </label>
                        <input
                          type="text"
                          value={editForm.projectName || ''}
                          onChange={e =>
                            setEditForm({ ...editForm, projectName: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Building Name
                        </label>
                        <input
                          type="text"
                          value={editForm.buildingName || ''}
                          onChange={e =>
                            setEditForm({ ...editForm, buildingName: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Facade Type
                        </label>
                        <select
                          value={editForm.facadeType || ''}
                          onChange={e =>
                            setEditForm({ ...editForm, facadeType: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                          value={editForm.clientName || ''}
                          onChange={e =>
                            setEditForm({ ...editForm, clientName: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={editForm.location?.address || ''}
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              location: { ...editForm.location, address: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={editForm.location?.city || ''}
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              location: { ...editForm.location, city: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleSaveChanges}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        ✓ Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setEditForm(project);
                        }}
                        className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Stats Cards */}
                      <div className="bg-blue-50 rounded-lg p-6">
                        <p className="text-gray-600 text-sm">Media Files</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                          {project.statistics.mediaCount}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-6">
                        <p className="text-gray-600 text-sm">Defects Found</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {project.statistics.annotationCount}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-6">
                        <p className="text-gray-600 text-sm">Zones</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                          {project.statistics.zoneCount}
                        </p>
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Project Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Facade Type</p>
                          <p className="font-semibold text-gray-900">{project.facadeType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Client</p>
                          <p className="font-semibold text-gray-900">
                            {project.clientName || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-semibold text-gray-900">
                            {project.location.city}, {project.location.country}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditMode(true)}
                      className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      ✏️ Edit Project
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Media</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600 mb-4">Drag and drop files here or click to select</p>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Choose Files
                    </button>
                    <p className="text-xs text-gray-500 mt-4">
                      Supported: JPG, PNG, MP4, OBJ, FBX, DWG
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Media Files</h3>
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-600">No media uploaded yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Upload media to start your inspection
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
                  <p className="text-gray-600 text-sm">Manage who can access this project</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">Loading team members...</p>
                </div>
              </div>
            )}

            {/* Annotations Tab */}
            {activeTab === 'annotations' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Defect Annotations</h3>
                  <p className="text-gray-600 text-sm">Mark, track, and manage all defects found during inspection</p>
                </div>

                {project.statistics.mediaCount > 0 ? (
                  <div className="space-y-8">
                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Select a media file from the Media tab first, then use the annotation viewer to mark defects on images.
                      </p>
                    </div>

                    {/* Annotation Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <p className="text-gray-600 text-sm">Critical Issues</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">0</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <p className="text-gray-600 text-sm">High Priority</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">0</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-gray-600 text-sm">In Progress</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-gray-600 text-sm">Resolved</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">0</p>
                      </div>
                    </div>

                    {/* Coming Soon Message */}
                    <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                      <div className="text-5xl mb-4">📸</div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">Annotation Viewer</h4>
                      <p className="text-gray-600 mb-4">
                        In Phase 3, you'll be able to:
                      </p>
                      <ul className="text-left inline-block space-y-2 text-gray-600">
                        <li>✅ View project images</li>
                        <li>✅ Draw boxes on defects</li>
                        <li>✅ Add categories (Crack, Spalling, etc.)</li>
                        <li>✅ Set severity levels</li>
                        <li>✅ Add detailed descriptions</li>
                        <li>✅ Track status workflow</li>
                        <li>✅ Add comments and discussions</li>
                        <li>✅ Assign to team members</li>
                      </ul>
                      <div className="mt-6">
                        <p className="text-sm text-gray-500">
                          This feature is being built in Phase 3
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="text-5xl mb-4">📷</div>
                    <p className="text-gray-600 text-lg mb-2">No media uploaded yet</p>
                    <p className="text-sm text-gray-500">
                      Upload images to the Media tab first, then you can mark defects here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDetailPage;
