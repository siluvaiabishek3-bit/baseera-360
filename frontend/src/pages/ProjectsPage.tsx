import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { mockAPI } from '@/services/mockDataService';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    buildingName: '',
    clientName: '',
    jobNumber: '',
    facadeType: 'Curtain Wall',
    currentStage: 'Planning',
  });

  const projectStages = ['Planning', 'Field Inspection', 'Annotation', 'Completed'];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await mockAPI.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.buildingName || !formData.clientName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await mockAPI.createProject({
        ...formData,
        status: 'active',
        createdAt: new Date().toLocaleDateString(),
      });
      fetchProjects();
      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  const handleUpdateProject = async () => {
    if (!formData.name || !formData.buildingName || !formData.clientName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await mockAPI.updateProject(editingProject.id, formData);
      fetchProjects();
      resetForm();
      setShowEditModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await mockAPI.deleteProject(id);
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project');
      }
    }
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      buildingName: project.buildingName,
      clientName: project.clientName,
      jobNumber: project.jobNumber || '',
      facadeType: project.facadeType || 'Curtain Wall',
      currentStage: project.currentStage || 'Planning',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      buildingName: '',
      clientName: '',
      jobNumber: '',
      facadeType: 'Curtain Wall',
      currentStage: 'Planning',
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Planning': return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' };
      case 'Field Inspection': return { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' };
      case 'Annotation': return { bg: '#DDD6FE', text: '#4C1D95', border: '#8B5CF6' };
      case 'Completed': return { bg: '#D1FAE5', text: '#065F46', border: '#10B981' };
      default: return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
    }
  };

  const getStageProgress = (stage: string) => {
    const stages = projectStages;
    const currentIndex = stages.indexOf(stage);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: '48px',
          height: '48px',
          border: '4px solid #DC143C',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
        <p style={{ color: '#666', marginTop: '16px' }}>Loading projects...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '32px' }}>
      {/* HEADER WITH CREATE BUTTON */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
            Projects
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0 0' }}>
            Manage and track all inspection projects
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
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
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 20, 60, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#DC143C';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Plus size={18} />
          Create New Project
        </button>
      </div>

      {/* PROJECTS GRID */}
      {projects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 32px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
            No projects yet. Create your first project to get started.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#DC143C',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#B91C3C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#DC143C';
            }}
          >
            + Create First Project
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px',
        }}>
          {projects.map((project) => {
            const stageColor = getStageColor(project.currentStage || 'Planning');
            const stageProgress = getStageProgress(project.currentStage || 'Planning');

            return (
              <div
                key={project.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'all 0.3s',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* PROJECT HEADER */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    margin: '0 0 4px 0',
                  }}>
                    {project.name}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#666',
                    margin: 0,
                  }}>
                    {project.buildingName}
                  </p>
                </div>

                {/* PROJECT INFO */}
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '16px',
                  lineHeight: '1.6',
                }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#1a1a1a' }}>Client:</span> {project.clientName}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#1a1a1a' }}>Job Number:</span> {project.jobNumber || 'N/A'}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#1a1a1a' }}>Facade Type:</span> {project.facadeType || 'N/A'}
                  </div>
                </div>

                {/* STAGE PROGRESS */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                    }}>
                      PROJECT STAGE
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: stageColor.text,
                      backgroundColor: stageColor.bg,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${stageColor.border}`,
                    }}>
                      {project.currentStage || 'Planning'}
                    </span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${stageProgress}%`,
                      height: '100%',
                      backgroundColor: '#DC143C',
                      transition: 'width 0.3s',
                    }}></div>
                  </div>

                  {/* STAGE INDICATORS */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    marginTop: '12px',
                  }}>
                    {projectStages.map((stage) => {
                      const isActive = projectStages.indexOf(stage) <= projectStages.indexOf(project.currentStage || 'Planning');
                      return (
                        <div
                          key={stage}
                          style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            textAlign: 'center',
                            padding: '4px',
                            backgroundColor: isActive ? '#DC143C' : '#f3f4f6',
                            color: isActive ? 'white' : '#999',
                            borderRadius: '3px',
                            transition: 'all 0.3s',
                          }}
                        >
                          {stage.split(' ')[0]}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIONS */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '16px',
                }}>
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#DC143C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#B91C3C';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#DC143C';
                    }}
                  >
                    <Eye size={14} />
                    View
                  </button>

                  <button
                    onClick={() => handleEditProject(project)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563EB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3B82F6';
                    }}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#DC2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#EF4444';
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '24px',
              margin: '0 0 24px 0',
            }}>
              Create New Project
            </h2>

            {/* PROJECT NAME */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Burj Khalifa Tower"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* BUILDING NAME */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Building Name *
              </label>
              <input
                type="text"
                value={formData.buildingName}
                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                placeholder="e.g., Burj Khalifa"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* CLIENT NAME */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Client Name *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g., Emaar Properties"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* JOB NUMBER */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Job Number
              </label>
              <input
                type="text"
                value={formData.jobNumber}
                onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                placeholder="e.g., JN-2026-001"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* FACADE TYPE */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Facade Type
              </label>
              <select
                value={formData.facadeType}
                onChange={(e) => setFormData({ ...formData, facadeType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Curtain Wall">Curtain Wall</option>
                <option value="Masonry">Masonry</option>
                <option value="Precast">Precast Concrete</option>
                <option value="Stone">Natural Stone</option>
                <option value="Glass">Glass Panel</option>
                <option value="Metal">Metal Composite</option>
              </select>
            </div>

            {/* STARTING STAGE */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Initial Project Stage
              </label>
              <select
                value={formData.currentStage}
                onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {projectStages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <p style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '6px',
                margin: '6px 0 0 0',
              }}>
                Project progression: Planning → Field Inspection → Annotation → Completed
              </p>
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add project notes..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* BUTTONS */}
            <div style={{
              display: 'flex',
              gap: '12px',
            }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                style={{
                  flex: 1,
                  padding: '10px 16px',
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
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '24px',
              margin: '0 0 24px 0',
            }}>
              Edit Project
            </h2>

            {/* PROJECT NAME */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* BUILDING NAME */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Building Name *
              </label>
              <input
                type="text"
                value={formData.buildingName}
                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* CLIENT NAME */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Client Name *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* JOB NUMBER */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Job Number
              </label>
              <input
                type="text"
                value={formData.jobNumber}
                onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* FACADE TYPE */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Facade Type
              </label>
              <select
                value={formData.facadeType}
                onChange={(e) => setFormData({ ...formData, facadeType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Curtain Wall">Curtain Wall</option>
                <option value="Masonry">Masonry</option>
                <option value="Precast">Precast Concrete</option>
                <option value="Stone">Natural Stone</option>
                <option value="Glass">Glass Panel</option>
                <option value="Metal">Metal Composite</option>
              </select>
            </div>

            {/* CURRENT STAGE */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Project Stage
              </label>
              <select
                value={formData.currentStage}
                onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {projectStages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '6px',
              }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* BUTTONS */}
            <div style={{
              display: 'flex',
              gap: '12px',
            }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                  resetForm();
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProject}
                style={{
                  flex: 1,
                  padding: '10px 16px',
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
                Update Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;