import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Download, Share2, AlertCircle, ChevronDown, Box, Eye, EyeOff } from 'lucide-react';

interface ModelDefect {
  id: number;
  name: string;
  type: string;
  severity: string;
  x: number;
  y: number;
  z: number;
  description: string;
}

export function ModelViewerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [selectedDefect, setSelectedDefect] = useState<ModelDefect | null>(null);
  const [showDefectList, setShowDefectList] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  // Mock 3D defects
  const [defects] = useState<ModelDefect[]>([
    {
      id: 1,
      name: 'Foundation Crack',
      type: 'Crack',
      severity: 'HIGH',
      x: 25,
      y: 10,
      z: 15,
      description: 'Horizontal crack in foundation wall at base level',
    },
    {
      id: 2,
      name: 'Roof Corrosion',
      type: 'Corrosion',
      severity: 'MEDIUM',
      x: 50,
      y: 85,
      z: 50,
      description: 'Surface corrosion on metal roof panels',
    },
    {
      id: 3,
      name: 'Wall Spalling',
      type: 'Spalling',
      severity: 'HIGH',
      x: 75,
      y: 45,
      z: 30,
      description: 'Concrete spalling on exterior wall face',
    },
    {
      id: 4,
      name: 'Window Seal Failure',
      type: 'Water Ingress',
      severity: 'CRITICAL',
      x: 60,
      y: 50,
      z: 25,
      description: 'Failed window seal causing water ingress',
    },
  ]);

  useEffect(() => {
    fetchProjectDetails();
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '#DC143C';
      case 'HIGH':
        return '#FF4444';
      case 'MEDIUM':
        return '#f97316';
      case 'LOW':
        return '#eab308';
      default:
        return '#666';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '#fef2f2';
      case 'HIGH':
        return '#fef2f2';
      case 'MEDIUM':
        return '#fffbeb';
      case 'LOW':
        return '#fffbeb';
      default:
        return '#f5f5f5';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          animation: 'spin 1s linear infinite',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          borderTop: '4px solid #DC143C',
          borderRight: '4px solid transparent',
        }}></div>
        <p style={{ color: '#666', marginTop: '16px' }}>Loading 3D model...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e5e5',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(`/projects/${id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            <ArrowLeft size={18} />
            Back to Project
          </button>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>
          3D Model Viewer - {project?.name}
        </h1>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#DC143C';
            e.currentTarget.style.color = '#DC143C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e5e5';
            e.currentTarget.style.color = '#1a1a1a';
          }}
          >
            <Download size={16} />
            Export
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#DC143C';
            e.currentTarget.style.color = '#DC143C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e5e5';
            e.currentTarget.style.color = '#1a1a1a';
          }}
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: '0', overflow: 'hidden' }}>
        {/* 3D VIEWER */}
        <div style={{ backgroundColor: '#1a1a1a', position: 'relative', overflow: 'auto' }}>
          {/* Controls */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 10,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <button
              onClick={() => setWireframe(!wireframe)}
              style={{
                padding: '8px 12px',
                backgroundColor: wireframe ? '#DC143C' : 'transparent',
                color: wireframe ? 'white' : '#1a1a1a',
                border: wireframe ? 'none' : '1px solid #e5e5e5',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s',
              }}
            >
              <Box size={14} />
              {wireframe ? 'Solid' : 'Wireframe'}
            </button>
          </div>

          {/* Zoom Controls */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 10,
            display: 'flex',
            gap: '8px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          }}>
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              style={{
                padding: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1a1a',
              }}
            >
              <ZoomOut size={18} />
            </button>
            <div style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1a1a1a',
              minWidth: '50px',
              textAlign: 'center',
            }}>
              {zoom}%
            </div>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              style={{
                padding: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1a1a',
              }}
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* 3D Model Area */}
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Mock 3D Representation */}
            <svg
              width="600"
              height="600"
              style={{
                opacity: zoom / 100,
                transform: `scale(${zoom / 100}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.3s',
                filter: wireframe ? 'invert(1)' : 'none',
              }}
              viewBox="0 0 600 600"
            >
              {/* Building Structure */}
              <defs>
                <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#DC143C', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#8B0000', stopOpacity: 0.8 }} />
                </linearGradient>
              </defs>

              {/* Main Building Body */}
              <rect x="100" y="100" width="400" height="400" fill="url(#buildingGradient)" stroke="#333" strokeWidth="2" />

              {/* Windows */}
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2, 3].map((col) => (
                  <rect
                    key={`window-${row}-${col}`}
                    x={130 + col * 90}
                    y={130 + row * 90}
                    width="70"
                    height="70"
                    fill="#87ceeb"
                    stroke="#333"
                    strokeWidth="1"
                  />
                ))
              )}

              {/* Roof */}
              <polygon
                points="100,100 300,20 500,100"
                fill="#A9A9A9"
                stroke="#333"
                strokeWidth="2"
              />

              {/* Defect Markers */}
              {defects.map((defect) => (
                <g key={defect.id}>
                  {/* Sphere marker */}
                  <circle
                    cx={`${defect.x}%`}
                    cy={`${defect.y}%`}
                    r="18"
                    fill={getSeverityColor(defect.severity)}
                    opacity="0.9"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDefect(defect)}
                  />

                  {/* Number inside circle */}
                  <text
                    x={`${defect.x}%`}
                    y={`${defect.y}%`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    style={{ cursor: 'pointer', pointerEvents: 'none' }}
                  >
                    {defect.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* DEFECT LIST SIDEBAR */}
        <div style={{
          backgroundColor: 'white',
          borderLeft: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: '#f9f9f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>
                Defects ({defects.length})
              </h2>
              <button
                onClick={() => setShowDefectList(!showDefectList)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px',
                }}
              >
                <ChevronDown size={16} style={{ transform: showDefectList ? 'rotate(0)' : 'rotate(180deg)' }} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              3D Model View
            </p>
          </div>

          {/* Defect List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {defects.map((defect) => (
                <div
                  key={defect.id}
                  onClick={() => setSelectedDefect(defect)}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedDefect?.id === defect.id ? '#fef2f2' : getSeverityBgColor(defect.severity),
                    border: selectedDefect?.id === defect.id ? '2px solid #DC143C' : '1px solid #e5e5e5',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDefect?.id !== defect.id) {
                      e.currentTarget.style.borderColor = '#DC143C';
                      e.currentTarget.style.backgroundColor = '#fff9f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDefect?.id !== defect.id) {
                      e.currentTarget.style.borderColor = '#e5e5e5';
                      e.currentTarget.style.backgroundColor = getSeverityBgColor(defect.severity);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: getSeverityColor(defect.severity),
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {defect.id}
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', marginBottom: '2px' }}>
                        {defect.type}
                      </p>
                      <p style={{ fontSize: '10px', color: '#666' }}>
                        {defect.severity}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#666', marginLeft: '32px' }}>
                    {defect.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SELECTED DEFECT DETAIL */}
      {selectedDefect && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '316px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          border: `2px solid ${getSeverityColor(selectedDefect.severity)}`,
          padding: '16px',
          maxWidth: '350px',
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
                Defect #{selectedDefect.id}: {selectedDefect.type}
              </h3>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Position: ({selectedDefect.x}, {selectedDefect.y}, {selectedDefect.z})
              </p>
            </div>
            <button
              onClick={() => setSelectedDefect(null)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#999',
                padding: '4px',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: getSeverityColor(selectedDefect.severity),
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              {selectedDefect.severity}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5', marginBottom: '12px' }}>
            {selectedDefect.description}
          </p>

          <button style={{
            width: '100%',
            padding: '10px',
            backgroundColor: getSeverityColor(selectedDefect.severity),
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          >
            View Images & Annotations
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ModelViewerPage;