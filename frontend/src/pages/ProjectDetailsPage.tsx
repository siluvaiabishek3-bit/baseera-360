import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, FolderOpen, FileText, Image as ImageIcon, X, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';
import { mockAPI } from '@/services/mockDataService';
import UploadMediaModal from '@/components/uploadMediaModal';
import ReportConfig from '@/components/ReportConfig';
import { generatePDFReport } from '@/services/pdfReportGenerator';

export function ProjectDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'analytics' | 'inspections' | 'reports'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReportConfig, setShowReportConfig] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [phases, setPhases] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [floors, setFloors] = useState<{ [key: string]: string[] }>({});
  const [selectedImageType, setSelectedImageType] = useState<'rgb' | 'thermal' | 'zoom' | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewingImage, setViewingImage] = useState<any>(null);
  const [imageZoom, setImageZoom] = useState(100);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const projectData = await mockAPI.getProjectById(id);
      setProject(projectData);

      const statsData = await mockAPI.getProjectStats(id);
      setStats(statsData);

      const mediaData = await mockAPI.getMediaByProject(id);
      setMedia(mediaData);

      const phasesData = await mockAPI.getPhasesByProject(id);
      setPhases(phasesData);

      // Set first phase as default
      if (phasesData.length > 0) {
        setSelectedPhase(phasesData[0]);
      }

      // Load floors for each phase
      const floorsMap: { [key: string]: string[] } = {};
      for (const phase of phasesData) {
        const floorsData = await mockAPI.getFloorsByPhase(id, phase);
        floorsMap[phase] = floorsData;
      }
      setFloors(floorsMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchData();
  };

  const getImagesByType = (phase: string, floor: string, type: string) => {
    return media.filter((m) => m.phase === phase && m.floor === floor && m.type === type);
  };

  const getThermalStatus = (mediaItem: any) => {
    if (mediaItem.type !== 'thermal') return null;
    return mediaItem.hasRadiometricData ? '✓ Has Data' : '⚠️ No Data';
  };

  const openImageViewer = (image: any) => {
    setViewingImage(image);
    setImageZoom(100);
    setShowImageViewer(true);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setViewingImage(null);
    setImageZoom(100);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await mockAPI.deleteMedia(imageId);
        fetchData();
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin w-12 h-12 border-4 border-baseera-red border-t-transparent rounded-full"></div>
        <p className="text-gray-600 mt-4">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
        <button
          onClick={() => navigate('/projects')}
          className="bg-baseera-red text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '32px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#DC143C',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={18} />
          Back to Projects
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 8px 0' }}>
          {project.name}
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          {project.buildingName} • {project.clientName}
        </p>
      </div>

      {/* PROJECT INFO CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 8px 0' }}>Total Images</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
            {stats?.totalImages || 0}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 8px 0' }}>RGB Images</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6', margin: 0 }}>
            {stats?.rgbCount || 0}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 8px 0' }}>Thermal Images</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF4444', margin: 0 }}>
            {stats?.thermalCount || 0}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 8px 0' }}>Zoom Images</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#8B5CF6', margin: 0 }}>
            {stats?.zoomCount || 0}
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '32px',
      }}>
        <button
          onClick={() => navigate(`/projects/${id}/images`)}
          style={{
            padding: '12px 16px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3B82F6';
          }}
        >
          🔍 Multi-Image Viewer
        </button>

        <button
          onClick={() => navigate(`/projects/${id}/model`)}
          style={{
            padding: '12px 16px',
            backgroundColor: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7C3AED';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#8B5CF6';
          }}
        >
          📦 3D Model Viewer
        </button>

        <button
          onClick={() => navigate(`/projects/${id}/cad`)}
          style={{
            padding: '12px 16px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10B981';
          }}
        >
          📐 CAD Viewer
        </button>

        <button
          onClick={() => setShowReportConfig(true)}
          style={{
            padding: '12px 16px',
            backgroundColor: '#DC143C',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#B91C3C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#DC143C';
          }}
        >
          📄 Generate Report
        </button>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex',
        gap: '16px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px',
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'media', label: 'Media Library' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'inspections', label: 'Inspections' },
          { id: 'reports', label: 'Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 0',
              color: activeTab === tab.id ? '#DC143C' : '#666',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #DC143C' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '600' : '500',
              fontSize: '14px',
              transition: 'all 0.3s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px' }}>
            Project Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Building Name</p>
              <p style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>{project.buildingName}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Client Name</p>
              <p style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>{project.clientName}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Job Number</p>
              <p style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>{project.jobNumber || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Facade Type</p>
              <p style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>{project.facadeType || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Current Stage</p>
              <p style={{ fontSize: '14px', color: '#DC143C', fontWeight: '600', margin: 0 }}>
                {project.currentStage}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 4px 0' }}>Created Date</p>
              <p style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>{project.createdAt}</p>
            </div>
          </div>

          {project.description && (
            <div>
              <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', margin: '0 0 8px 0' }}>Description</p>
              <p style={{ fontSize: '14px', color: '#1a1a1a', margin: 0, lineHeight: '1.6' }}>
                {project.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* MEDIA TAB */}
      {activeTab === 'media' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>Media Library</h2>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#DC143C',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#B91C3C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#DC143C';
              }}
            >
              <Upload size={18} />
              Upload Media
            </button>
          </div>

          {phases.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '48px 32px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <FolderOpen size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
              <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                No media uploaded yet. Click "Upload Media" to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
              {/* PHASE & FLOOR SELECTOR */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '16px',
                height: 'fit-content',
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '12px', margin: '0 0 12px 0' }}>
                  📁 Phases & Floors
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {phases.map((phase) => (
                    <div key={phase}>
                      <button
                        onClick={() => setSelectedPhase(selectedPhase === phase ? null : phase)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: selectedPhase === phase ? '#DC143C' : '#f3f4f6',
                          color: selectedPhase === phase ? 'white' : '#1a1a1a',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          textAlign: 'left',
                          transition: 'all 0.3s',
                        }}
                      >
                        {phase}
                      </button>

                      {selectedPhase === phase && (
                        <div style={{ marginTop: '8px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {floors[phase]?.map((floor) => (
                            <button
                              key={floor}
                              onClick={() => setSelectedFloor(selectedFloor === floor ? null : floor)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                backgroundColor: selectedFloor === floor ? '#3B82F6' : '#f9fafb',
                                color: selectedFloor === floor ? 'white' : '#666',
                                border: `1px solid ${selectedFloor === floor ? '#3B82F6' : '#e5e7eb'}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '12px',
                                textAlign: 'left',
                                transition: 'all 0.3s',
                              }}
                            >
                              └─ {floor}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* IMAGE TYPE FOLDERS */}
              {selectedPhase && selectedFloor ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}>
                  {/* RGB FOLDER */}
                  <div
                    onClick={() => setSelectedImageType(selectedImageType === 'rgb' ? null : 'rgb')}
                    style={{
                      backgroundColor: selectedImageType === 'rgb' ? '#EFF6FF' : 'white',
                      border: `2px solid ${selectedImageType === 'rgb' ? '#3B82F6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.backgroundColor = '#EFF6FF';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedImageType !== 'rgb') {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '32px' }}>📷</div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>RGB Images</h4>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                          {getImagesByType(selectedPhase, selectedFloor, 'rgb').length} images
                        </p>
                      </div>
                    </div>

                    {selectedImageType === 'rgb' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {getImagesByType(selectedPhase, selectedFloor, 'rgb').length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#999', gridColumn: '1 / -1' }}>No images</p>
                        ) : (
                          getImagesByType(selectedPhase, selectedFloor, 'rgb').map((img) => (
                            <div
                              key={img.id}
                              style={{
                                position: 'relative',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                backgroundColor: '#f3f4f6',
                                aspectRatio: '1',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                            >
                              <img
                                src={img.imageData}
                                alt="RGB"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onClick={() => openImageViewer(img)}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(img.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* THERMAL FOLDER */}
                  <div
                    onClick={() => setSelectedImageType(selectedImageType === 'thermal' ? null : 'thermal')}
                    style={{
                      backgroundColor: selectedImageType === 'thermal' ? '#FEF2F2' : 'white',
                      border: `2px solid ${selectedImageType === 'thermal' ? '#FF4444' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FF4444';
                      e.currentTarget.style.backgroundColor = '#FEF2F2';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedImageType !== 'thermal') {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '32px' }}>🌡️</div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>Thermal Images</h4>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                          {getImagesByType(selectedPhase, selectedFloor, 'thermal').length} images
                        </p>
                      </div>
                    </div>

                    {selectedImageType === 'thermal' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {getImagesByType(selectedPhase, selectedFloor, 'thermal').length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#999', gridColumn: '1 / -1' }}>No images</p>
                        ) : (
                          getImagesByType(selectedPhase, selectedFloor, 'thermal').map((img) => (
                            <div
                              key={img.id}
                              style={{
                                position: 'relative',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                backgroundColor: '#f3f4f6',
                                aspectRatio: '1',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                            >
                              <img
                                src={img.imageData}
                                alt="Thermal"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onClick={() => openImageViewer(img)}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  left: '4px',
                                  backgroundColor: img.hasRadiometricData ? 'rgba(16, 185, 129, 0.9)' : 'rgba(252, 165, 165, 0.9)',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                }}
                              >
                                {getThermalStatus(img)}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(img.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* ZOOM FOLDER */}
                  <div
                    onClick={() => setSelectedImageType(selectedImageType === 'zoom' ? null : 'zoom')}
                    style={{
                      backgroundColor: selectedImageType === 'zoom' ? '#F3E8FF' : 'white',
                      border: `2px solid ${selectedImageType === 'zoom' ? '#8B5CF6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8B5CF6';
                      e.currentTarget.style.backgroundColor = '#F3E8FF';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedImageType !== 'zoom') {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '32px' }}>🔍</div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>Zoom Images</h4>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                          {getImagesByType(selectedPhase, selectedFloor, 'zoom').length} images
                        </p>
                      </div>
                    </div>

                    {selectedImageType === 'zoom' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {getImagesByType(selectedPhase, selectedFloor, 'zoom').length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#999', gridColumn: '1 / -1' }}>No images</p>
                        ) : (
                          getImagesByType(selectedPhase, selectedFloor, 'zoom').map((img) => (
                            <div
                              key={img.id}
                              style={{
                                position: 'relative',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                backgroundColor: '#f3f4f6',
                                aspectRatio: '1',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                            >
                              <img
                                src={img.imageData}
                                alt="Zoom"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onClick={() => openImageViewer(img)}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(img.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '48px 32px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}>
                  <FolderOpen size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
                  <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                    Select a phase and floor to view images
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px' }}>
            Project Analytics
          </h2>
          <p style={{ color: '#666', margin: 0 }}>Analytics features coming soon...</p>
        </div>
      )}

      {/* INSPECTIONS TAB */}
      {activeTab === 'inspections' && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px' }}>
            Inspections
          </h2>
          <p style={{ color: '#666', margin: 0 }}>Inspection data and annotations will appear here...</p>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px' }}>
            Reports
          </h2>
          <p style={{ color: '#666', margin: 0 }}>Generated reports will appear here...</p>
        </div>
      )}

      {/* IMAGE VIEWER MODAL */}
      {showImageViewer && viewingImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
          }}
        >
          {/* HEADER */}
          <div
            style={{
              backgroundColor: '#0f0f0f',
              borderBottom: '1px solid #333',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                {viewingImage.type.toUpperCase()} Image
              </h2>
              <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0 0' }}>
                {viewingImage.uploadedAt} • {viewingImage.phase} - {viewingImage.floor}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setImageZoom(Math.max(50, imageZoom - 10))}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '600', minWidth: '50px', textAlign: 'center' }}>
                {imageZoom}%
              </span>
              <button
                onClick={() => setImageZoom(Math.min(200, imageZoom + 10))}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => handleDeleteImage(viewingImage.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#DC143C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button
                onClick={closeImageViewer}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '24px',
                  padding: 0,
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* IMAGE VIEWER */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <img
              src={viewingImage.imageData}
              alt="Viewing"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${imageZoom / 100})`,
                transition: 'transform 0.2s',
              }}
            />
          </div>
        </div>
      )}

      {/* MODALS */}
      {showUploadModal && (
        <UploadMediaModal
          projectId={id!}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {showReportConfig && (
        <ReportConfig
          project={project}
          onGenerate={async (config) => {
            try {
              const annotations = await mockAPI.getAnnotations();
              const projectAnnotations = annotations.filter((a) => a.projectId === id);

              await generatePDFReport(
                project.name,
                project.jobNumber,
                project.clientName,
                config.companyName,
                projectAnnotations,
                config
              );

              setShowReportConfig(false);
            } catch (error) {
              console.error('Error generating report:', error);
              alert('Error generating report');
            }
          }}
          onCancel={() => setShowReportConfig(false)}
        />
      )}
    </div>
  );
}

export default ProjectDetailsPage;