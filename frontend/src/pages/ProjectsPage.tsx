import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Folder, Calendar, User, MapPin, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    buildingName: '',
    clientName: '',
    jobNumber: '',
    facadeType: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const handleCreateProject = async (e: any) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          createdBy: '1',
          id: Date.now().toString(),
        }),
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewProject({
          name: '',
          description: '',
          buildingName: '',
          clientName: '',
          jobNumber: '',
          facadeType: '',
        });
        fetchProjects();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredProjects = projects.filter((project: any) =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.buildingName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage your facade inspection projects</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-all font-semibold shadow-sm"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mt-6 flex gap-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 px-4 py-3 rounded-lg">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search projects by name, client, or building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition">
            <Filter size={20} />
            Filter
          </button>
        </div>
      </div>

      {/* PROJECTS GRID */}
      <div className="p-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-gray-600 mt-4">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Create your first project to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-semibold"
              >
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              >
                {/* PROJECT HEADER */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-2">{project.name}</h3>
                      <p className="text-blue-100 text-sm line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-blue-700 rounded-lg transition">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* PROJECT DETAILS */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-gray-900 font-medium">
                      {project.buildingName || 'No building name'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-600">
                      {project.clientName || 'No client'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Folder size={16} className="text-gray-400" />
                    <span className="text-gray-600">
                      Job #{project.jobNumber || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-600">
                      {project.facadeType || 'No facade type'}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-2">
                  <button 
  onClick={() => navigate(`/projects/${project.id}`)}
  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-semibold"
>
  <Eye size={16} />
  View
</button>
                  <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                    <Edit size={16} />
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
              <p className="text-gray-600 mt-1">Fill in the project details below</p>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dubai Marina Tower Inspection"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Building Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.buildingName}
                    onChange={(e) => setNewProject({ ...newProject, buildingName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Marina Heights"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.clientName}
                    onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Emaar Properties"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Number
                  </label>
                  <input
                    type="text"
                    value={newProject.jobNumber}
                    onChange={(e) => setNewProject({ ...newProject, jobNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., JOB-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Facade Type
                  </label>
                  <select
                    value={newProject.facadeType}
                    onChange={(e) => setNewProject({ ...newProject, facadeType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="Glass Curtain Wall">Glass Curtain Wall</option>
                    <option value="Stone Cladding">Stone Cladding</option>
                    <option value="Metal Panels">Metal Panels</option>
                    <option value="Concrete">Concrete</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;