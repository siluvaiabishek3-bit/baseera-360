import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Download, Share2, AlertCircle, ChevronDown } from 'lucide-react';

interface DefectMarker {
  id: number;
  x: number;
  y: number;
  type: string;
  severity: string;
  description: string;
  floor: string;
  phase: string;
}

export function CADViewerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [selectedFloor, setSelectedFloor] = useState('Ground');
  const [floors, setFloors] = useState(['Ground', 'Floor 1', 'Floor 2']);
  const [selectedDefect, setSelectedDefect] = useState<DefectMarker | null>(null);
  const [showDefectList, setShowDefectList] = useState(true);

  // Mock defect markers
  const [defects, setDefects] = useState<DefectMarker[]>([
    {
      id: 1,
      x: 20,
      y: 30,
      type: 'Crack',
      severity: 'HIGH',
      description: 'Horizontal crack at 2m height',
      floor: 'Ground',
      phase: 'Phase 1',
    },
    {
      id: 2,
      x: 45,
      y: 50,
      type: 'Corrosion',
      severity: 'MEDIUM',
      description: 'Surface corrosion on aluminum frame',
      floor: 'Ground',
      phase: 'Phase 1',
    },
    {
      id: 3,
      x: 70,
      y: 40,
      type: 'Spalling',
      severity: 'HIGH',
      description: 'Concrete spalling near window',
      floor: 'Ground',
      phase: 'Phase 1',
    },
    {
      id: 4,
      x: 60,
      y: 75,
      type: 'Water Ingress',
      severity: 'CRITICAL',
      description: 'Water seepage through joint',
      floor: 'Ground',
      phase: 'Phase 1',
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

  const floorDefects = defects.filter((d) => d.floor === selectedFloor);

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
        <p style={{ color: '#666', marginTop: '16px' }}>Loading CAD viewer...</p>
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
          CAD/Ortho Viewer - {project?.name}
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
        {/* CAD VIEWER */}
        <div style={{ backgroundColor: '#1a1a1a', position: 'relative', overflow: 'auto' }}>
          {/* Floor Selector */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 10,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          }}>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#1a1a1a',
              }}
            >
              {floors.map((floor) => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>
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

          {/* CAD Drawing Area */}
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center',
            transition: 'transform 0.3s',
          }}>
            {/* Mock CAD Drawing */}
            <svg
              width="800"
              height="600"
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              }}
              viewBox="0 0 800 600"
            >
              {/* Building Facade */}
              <rect x="50" y="50" width="700" height="500" fill="#e5e5e5" stroke="#999" strokeWidth="2" />

              {/* Windows Grid */}
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2, 3].map((col) => (
                  <rect
                    key={`window-${row}-${col}`}
                    x={100 + col * 150}
                    y={100 + row * 100}
                    width="120"
                    height="80"
                    fill="#87ceeb"
                    stroke="#666"
                    strokeWidth="1"
                  />
                ))
              )}

              {/* Defect Markers */}
              {floorDefects.map((defect) => (
                <g key={defect.id}>
                  {/* Circle marker */}
                  <circle
                    cx={`${defect.x}%`}
                    cy={`${defect.y}%`}
                    r="20"
                    fill={getSeverityColor(defect.severity)}
                    opacity="0.8"
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
                    fontSize="16"
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
                Defects ({floorDefects.length})
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
              {selectedFloor}
            </p>
          </div>

          {/* Defect List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {floorDefects.map((defect) => (
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
                    {defect.description}
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
                {selectedDefect.phase} • {selectedDefect.floor}
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

export default CADViewerPage;