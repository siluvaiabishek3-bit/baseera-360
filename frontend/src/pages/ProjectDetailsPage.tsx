import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Image as ImageIcon, MapPin, User, Calendar, Folder, FileText, AlertCircle, CheckCircle, Clock, Trash2, Download } from 'lucide-react';

export function ProjectDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    fetchMedia();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3000/projects/${id}`);
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const response = await fetch(`http://localhost:3000/media`);
      const data = await response.json();
      setMedia(data.filter((m: any) => m.projectId === id));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 mt-4">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-2">{project.description}</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                <Download size={18} />
                Export
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-semibold"
              >
                <Upload size={20} />
                Upload Images
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="px-8 flex gap-6 border-t border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-900 text-blue-900 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-4 px-2 border-b-2 transition ${
              activeTab === 'media'
                ? 'border-blue-900 text-blue-900 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Media ({media.length})
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className={`py-4 px-2 border-b-2 transition ${
              activeTab === 'inspections'
                ? 'border-blue-900 text-blue-900 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Inspections
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-2 border-b-2 transition ${
              activeTab === 'reports'
                ? 'border-blue-900 text-blue-900 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PROJECT INFO */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Project Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin size={16} />
                      <span className="text-sm font-medium">Building Name</span>
                    </div>
                    <p className="text-gray-900 font-semibold">{project.buildingName || 'N/A'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <User size={16} />
                      <span className="text-sm font-medium">Client</span>
                    </div>
                    <p className="text-gray-900 font-semibold">{project.clientName || 'N/A'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Folder size={16} />
                      <span className="text-sm font-medium">Job Number</span>
                    </div>
                    <p className="text-gray-900 font-semibold">{project.jobNumber || 'N/A'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <FileText size={16} />
                      <span className="text-sm font-medium">Facade Type</span>
                    </div>
                    <p className="text-gray-900 font-semibold">{project.facadeType || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* STATISTICS */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ImageIcon size={20} className="text-blue-900" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{media.length}</span>
                  </div>
                  <p className="text-sm text-gray-600">Total Images</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertCircle size={20} className="text-orange-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">0</span>
                  </div>
                  <p className="text-sm text-gray-600">Defects Found</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">85%</span>
                  </div>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </div>

            {/* ACTIVITY FEED */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Upload size={14} className="text-blue-900" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Project created</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Inspection started</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Report generated</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div>
            {media.length === 0 ? (
  <div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ImageIcon size={32} className="text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No images yet</h3>
      <p className="text-gray-600 mb-6">Upload drone or inspection images to get started</p>
      <button
        onClick={() => setShowUploadModal(true)}
        className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-semibold"
      >
        Upload Images
      </button>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-6">
      <p className="text-gray-600 mb-4">Try the demo:</p>
      <button
        onClick={() => navigate(`/projects/${id}/inspection/demo-image-1`)}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
      >
        🎯 Open Inspection Viewer
      </button>
    </div>
  </div>
) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {media.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <ImageIcon size={48} className="text-gray-400" />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.filename}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inspections' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Inspections Coming Soon</h3>
            <p className="text-gray-600">Defect marking and annotations will be available here</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reports Coming Soon</h3>
            <p className="text-gray-600">Generate and download inspection reports</p>
          </div>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Upload Images</h2>
              <p className="text-gray-600 mt-1">Upload drone or inspection images</p>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition cursor-pointer">
                <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailsPage;