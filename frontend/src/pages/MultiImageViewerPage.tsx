import { useState, useEffect, useRef } from 'react';
import { getNextDefectNumber, resetDefectCounter, drawAnnotationOnCanvas, SEVERITY_COLORS } from '@/services/annotationDrawing';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import AnnotationTool from '@/components/AnnotationTool';
import { mockAPI } from '@/services/mockDataService';

export function MultiImageViewerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotationImageType, setAnnotationImageType] = useState<'rgb' | 'thermal' | 'zoom' | null>(null);
  const [annotationImageData, setAnnotationImageData] = useState<string>('');
  const [annotationsByImage, setAnnotationsByImage] = useState<{
    [key: string]: any[];
  }>({});

  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [phases, setPhases] = useState<string[]>([]);
  const [floors, setFloors] = useState<string[]>([]);
  const [imagePairs, setImagePairs] = useState<any[]>([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  const rgbCanvasRef = useRef<HTMLCanvasElement>(null);
  const thermalCanvasRef = useRef<HTMLCanvasElement>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    redrawAllAnnotations();
  }, [annotationsByImage, currentPairIndex, imagePairs]);

useEffect(() => {
  redrawAllAnnotations();
}, [annotationsByImage, currentPairIndex, imagePairs, rgbCanvasRef, thermalCanvasRef, zoomCanvasRef]);

useEffect(() => {
  if (id) {
    resetDefectCounter(id);
  }
}, [id]);

  const fetchData = async () => {
    try {
      const projectData = await mockAPI.getProjectById(id);
      setProject(projectData);

      const phasesData = await mockAPI.getPhasesByProject(id);
      setPhases(phasesData);

      if (phasesData.length > 0) {
        setSelectedPhase(phasesData[0]);
      }

      // Load annotations from database
      const annotations = await mockAPI.getAnnotationsByProject(id);
      const annotationsObj: { [key: string]: any[] } = {};
      annotations.forEach((ann) => {
        if (!annotationsObj[ann.mediaId]) {
          annotationsObj[ann.mediaId] = [];
        }
        annotationsObj[ann.mediaId].push(ann);
      });
      setAnnotationsByImage(annotationsObj);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPhase && id) {
      loadFloorsAndPairs();
    }
  }, [selectedPhase, id]);

  useEffect(() => {
    if (selectedFloor && selectedPhase && id) {
      loadImagePairs();
    }
  }, [selectedFloor, selectedPhase, id]);

  const loadFloorsAndPairs = async () => {
    try {
      if (!selectedPhase) return;
      const floorsData = await mockAPI.getFloorsByPhase(id, selectedPhase);
      setFloors(floorsData);

      if (floorsData.length > 0) {
        setSelectedFloor(floorsData[0]);
      }
    } catch (error) {
      console.error('Error loading floors:', error);
    }
  };

  const loadImagePairs = async () => {
  try {
    if (!selectedPhase || !selectedFloor) return;
    const pairs = await mockAPI.getImagePairs(id, selectedPhase, selectedFloor);
    setImagePairs(pairs);
    setCurrentPairIndex(0);
  } catch (error) {
    console.error('Error loading pairs:', error);
  }
};

  const redrawAllAnnotations = () => {
  const currentPair = imagePairs[currentPairIndex];
  if (!currentPair) return;

  if (currentPair.rgb) {
    drawAnnotationsOnCanvas(rgbCanvasRef, currentPair.rgb, annotationsByImage[currentPair.rgb.id] || []);
  }

  if (currentPair.thermal) {
    drawAnnotationsOnCanvas(thermalCanvasRef, currentPair.thermal, annotationsByImage[currentPair.thermal.id] || []);
  }

  if (currentPair.zoom) {
    drawAnnotationsOnCanvas(zoomCanvasRef, currentPair.zoom, annotationsByImage[currentPair.zoom.id] || []);
  }
};

  const drawAnnotationsOnCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, image: any, annotations: any[]) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    // Draw each annotation
    annotations.forEach((annotation) => {
      console.log('Drawing annotation:', annotation);
      
      const color = SEVERITY_COLORS[annotation.severity as keyof typeof SEVERITY_COLORS]?.color || '#999';
      const number = annotation.globalDefectNumber || annotation.number || '?';

      // Draw polygon
      if (annotation.type === 'polygon' && annotation.points && annotation.points.length > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw number at center
        let sumX = 0, sumY = 0;
        for (const p of annotation.points) {
          sumX += p.x;
          sumY += p.y;
        }
        const centerX = sumX / annotation.points.length;
        const centerY = sumY / annotation.points.length;

        // Draw number background and text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(String(number));
        const width = metrics.width + 16;
        const height = 40;
        ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - width / 2, centerY - height / 2, width, height);

        ctx.fillStyle = color;
        ctx.fillText(String(number), centerX, centerY);
      }
      // Draw point
      else if (annotation.type === 'point' && annotation.startPoint) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(annotation.startPoint.x, annotation.startPoint.y, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(String(number));
        const width = metrics.width + 16;
        const height = 40;
        ctx.fillRect(annotation.startPoint.x - width / 2, annotation.startPoint.y - height / 2, width, height);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(annotation.startPoint.x - width / 2, annotation.startPoint.y - height / 2, width, height);

        ctx.fillStyle = color;
        ctx.fillText(String(number), annotation.startPoint.x, annotation.startPoint.y);
      }
      // Draw circle
      else if (annotation.type === 'circle' && annotation.startPoint && annotation.points && annotation.points.length > 0) {
        const radius = Math.sqrt(
          Math.pow(annotation.points[0].x - annotation.startPoint.x, 2) +
            Math.pow(annotation.points[0].y - annotation.startPoint.y, 2)
        );

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(annotation.startPoint.x, annotation.startPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(String(number));
        const width = metrics.width + 16;
        const height = 40;
        ctx.fillRect(annotation.startPoint.x - width / 2, annotation.startPoint.y - height / 2, width, height);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(annotation.startPoint.x - width / 2, annotation.startPoint.y - height / 2, width, height);

        ctx.fillStyle = color;
        ctx.fillText(String(number), annotation.startPoint.x, annotation.startPoint.y);
      }
      // Draw rectangle
      else if (annotation.type === 'rectangle' && annotation.startPoint && annotation.points && annotation.points.length > 0) {
        const width = annotation.points[0].x - annotation.startPoint.x;
        const height = annotation.points[0].y - annotation.startPoint.y;

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(annotation.startPoint.x, annotation.startPoint.y, width, height);

        const centerX = annotation.startPoint.x + width / 2;
        const centerY = annotation.startPoint.y + height / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(String(number));
        const boxWidth = metrics.width + 16;
        const boxHeight = 40;
        ctx.fillRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);

        ctx.fillStyle = color;
        ctx.fillText(String(number), centerX, centerY);
      }
      // Draw freehand
      else if (annotation.type === 'freehand' && annotation.points && annotation.points.length > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.stroke();

        const lastPoint = annotation.points[annotation.points.length - 1];

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(String(number));
        const width = metrics.width + 16;
        const height = 40;
        ctx.fillRect(lastPoint.x - width / 2, lastPoint.y - height / 2, width, height);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(lastPoint.x - width / 2, lastPoint.y - height / 2, width, height);

        ctx.fillStyle = color;
        ctx.fillText(String(number), lastPoint.x, lastPoint.y);
      }
    });
  };
  img.src = image.imageData;
};

  const handleAddAnnotation = (imageId: string, imageType: 'rgb' | 'thermal' | 'zoom', imageData: string) => {
    setAnnotationImageType(imageType);
    setAnnotationImageData(imageData);
    setShowAnnotationModal(true);
  };

  const handleSaveAnnotation = async (annotation: any) => {
  const imageId = imagePairs[currentPairIndex]?.[annotationImageType === 'rgb' ? 'rgb' : annotationImageType === 'thermal' ? 'thermal' : 'zoom']?.id;
  if (!imageId) return;

  try {
    // Get next global defect number
    const globalDefectNumber = getNextDefectNumber(id);

    // Add globalDefectNumber to annotation
    const annotationWithNumber = {
      ...annotation,
      globalDefectNumber,
    };

    // Save to database
    await mockAPI.createAnnotation({
      projectId: id,
      mediaId: imageId,
      ...annotationWithNumber,
    });

    // Update local state
    setAnnotationsByImage((prev) => ({
      ...prev,
      [imageId]: [...(prev[imageId] || []), annotationWithNumber],
    }));

    setShowAnnotationModal(false);
    setAnnotationImageType(null);
    setAnnotationImageData('');
  } catch (error) {
    console.error('Error saving annotation:', error);
  }
};

  const handleDeleteAnnotation = async (imageId: string, annotationIndex: number) => {
    try {
      const annotationToDelete = annotationsByImage[imageId][annotationIndex];
      if (annotationToDelete.id) {
        await mockAPI.deleteAnnotation(annotationToDelete.id);
      }

      setAnnotationsByImage((prev) => ({
        ...prev,
        [imageId]: prev[imageId].filter((_, idx) => idx !== annotationIndex),
      }));
    } catch (error) {
      console.error('Error deleting annotation:', error);
    }
  };

  const getTotalAnnotationCount = () => {
    const currentPair = imagePairs[currentPairIndex];
    if (!currentPair) return 0;

    let count = 0;
    if (currentPair.rgb) {
      count += (annotationsByImage[currentPair.rgb.id] || []).length;
    }
    if (currentPair.thermal) {
      count += (annotationsByImage[currentPair.thermal.id] || []).length;
    }
    if (currentPair.zoom) {
      count += (annotationsByImage[currentPair.zoom.id] || []).length;
    }
    return count;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin w-12 h-12 border-4 border-baseera-red border-t-transparent rounded-full"></div>
        <p className="text-gray-600 mt-4">Loading viewer...</p>
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

  const currentPair = imagePairs[currentPairIndex];

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{
        backgroundColor: '#0f0f0f',
        borderBottom: '1px solid #DC143C',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate(`/projects/${id}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fff',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#DC143C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#fff';
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          Multi-Image Viewer • {project.name}
        </h1>

        <div style={{ width: '100px' }}></div>
      </div>

      {/* CONTROLS BAR */}
      <div style={{
        backgroundColor: '#0f0f0f',
        borderBottom: '1px solid #333',
        padding: '16px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
      }}>
        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
            Phase
          </label>
          <select
            value={selectedPhase || ''}
            onChange={(e) => setSelectedPhase(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {phases.map((phase) => (
              <option key={phase} value={phase}>{phase}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
            Floor
          </label>
          <select
            value={selectedFloor || ''}
            onChange={(e) => setSelectedFloor(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {floors.map((floor) => (
              <option key={floor} value={floor}>{floor}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#999', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
            Zoom
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              style={{
                padding: '6px 8px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
              style={{
                padding: '6px 8px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', padding: '24px', gap: '24px', overflow: 'auto' }}>
        {/* ANNOTATIONS SIDEBAR */}
        <div style={{
          width: '300px',
          backgroundColor: '#0f0f0f',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '16px',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <h3 style={{ color: '#fff', fontWeight: 'bold', marginBottom: '16px', fontSize: '14px' }}>
            Annotations (Total: {getTotalAnnotationCount()})
          </h3>

          {currentPair ? (
            <>
              {/* RGB ANNOTATIONS */}
              {currentPair.rgb && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#DC143C', fontWeight: '600', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    📷 RGB ({(annotationsByImage[currentPair.rgb.id] || []).length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {(annotationsByImage[currentPair.rgb.id] || []).map((annotation, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: `1px solid #DC143C`,
                          borderRadius: '4px',
                          padding: '10px',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#DC143C',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}>
                                {annotation.globalDefectNumber}
                              </span>
                              <p style={{ color: '#DC143C', fontWeight: '600', margin: 0 }}>
                                {annotation.defectType}
                              </p>
                            </div>
                            <p style={{ color: '#999', fontSize: '11px', margin: '4px 0' }}>
                              {annotation.severity}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnotation(currentPair.rgb.id, idx)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#DC143C',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              padding: '0',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddAnnotation(currentPair.rgb.id, 'rgb', currentPair.rgb.imageData)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#DC143C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px',
                    }}
                  >
                    + Add RGB
                  </button>
                </div>
              )}

              {/* THERMAL ANNOTATIONS */}
              {currentPair.thermal && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#FF4444', fontWeight: '600', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    🌡️ Thermal ({(annotationsByImage[currentPair.thermal.id] || []).length})
                  </h4>
                  {!currentPair.thermal.hasRadiometricData && (
                    <div style={{
                      backgroundColor: '#FEE2E2',
                      border: '1px solid #FECACA',
                      borderRadius: '4px',
                      padding: '8px',
                      marginBottom: '8px',
                      display: 'flex',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#DC2626',
                    }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      No thermal data found
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {(annotationsByImage[currentPair.thermal.id] || []).map((annotation, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: `1px solid #FF4444`,
                          borderRadius: '4px',
                          padding: '10px',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#FF4444',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}>
                                {annotation.globalDefectNumber}
                              </span>
                              <p style={{ color: '#FF4444', fontWeight: '600', margin: 0 }}>
                                {annotation.defectType}
                              </p>
                            </div>
                            <p style={{ color: '#999', fontSize: '11px', margin: '4px 0' }}>
                              {annotation.severity}
                            </p>
                            {annotation.temperatureData && (
                              <div style={{ marginTop: '4px', fontSize: '10px', color: '#ccc' }}>
                                {annotation.temperatureData.high && (
                                  <p style={{ margin: '2px 0' }}>High: {annotation.temperatureData.high}°C</p>
                                )}
                                {annotation.temperatureData.mean && (
                                  <p style={{ margin: '2px 0' }}>Mean: {annotation.temperatureData.mean}°C</p>
                                )}
                                {annotation.temperatureData.low && (
                                  <p style={{ margin: '2px 0' }}>Low: {annotation.temperatureData.low}°C</p>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteAnnotation(currentPair.thermal.id, idx)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#FF4444',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              padding: '0',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddAnnotation(currentPair.thermal.id, 'thermal', currentPair.thermal.imageData)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#FF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px',
                    }}
                  >
                    + Add Thermal
                  </button>
                </div>
              )}

              {/* ZOOM ANNOTATIONS */}
              {currentPair.zoom && (
                <div>
                  <h4 style={{ color: '#8B5CF6', fontWeight: '600', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    🔍 Zoom ({(annotationsByImage[currentPair.zoom.id] || []).length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {(annotationsByImage[currentPair.zoom.id] || []).map((annotation, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: `1px solid #8B5CF6`,
                          borderRadius: '4px',
                          padding: '10px',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#8B5CF6',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}>
                                {annotation.globalDefectNumber}
                              </span>
                              <p style={{ color: '#8B5CF6', fontWeight: '600', margin: 0 }}>
                                {annotation.defectType}
                              </p>
                            </div>
                            <p style={{ color: '#999', fontSize: '11px', margin: '4px 0' }}>
                              {annotation.severity}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnotation(currentPair.zoom.id, idx)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#8B5CF6',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              padding: '0',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddAnnotation(currentPair.zoom.id, 'zoom', currentPair.zoom.imageData)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px',
                    }}
                  >
                    + Add Zoom
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#999', fontSize: '12px' }}>No images in this pair</p>
          )}
        </div>

        {/* IMAGES CONTAINER */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* IMAGE GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: currentPair?.zoom ? 'repeat(3, 1fr)' : currentPair?.thermal || currentPair?.rgb ? currentPair?.thermal && currentPair?.rgb ? 'repeat(2, 1fr)' : '1fr' : '1fr',
            gap: '16px',
            flex: 1,
          }}>
            {/* RGB IMAGE */}
            {currentPair?.rgb ? (
              <div style={{
                backgroundColor: '#0f0f0f',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <h3 style={{ color: '#DC143C', fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
                  📷 RGB
                </h3>
                <div style={{
                  flex: 1,
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <canvas
                    ref={rgbCanvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      transform: `scale(${zoomLevel / 100})`,
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>
              </div>
            ) : null}

            {/* THERMAL IMAGE */}
            {currentPair?.thermal ? (
              <div style={{
                backgroundColor: '#0f0f0f',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <h3 style={{ color: '#FF4444', fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
                  🌡️ Thermal
                </h3>
                <div style={{
                  flex: 1,
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <canvas
                    ref={thermalCanvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      transform: `scale(${zoomLevel / 100})`,
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>
              </div>
            ) : null}

            {/* ZOOM IMAGE */}
            {currentPair?.zoom ? (
              <div style={{
                backgroundColor: '#0f0f0f',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <h3 style={{ color: '#8B5CF6', fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
                  🔍 Zoom
                </h3>
                <div style={{
                  flex: 1,
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <canvas
                    ref={zoomCanvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      transform: `scale(${zoomLevel / 100})`,
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* NAVIGATION */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#0f0f0f',
            borderRadius: '8px',
            border: '1px solid #333',
          }}>
            <button
              onClick={() => setCurrentPairIndex(Math.max(0, currentPairIndex - 1))}
              disabled={currentPairIndex === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPairIndex === 0 ? '#333' : '#DC143C',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPairIndex === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <span style={{ color: '#fff', fontWeight: '600' }}>
              Pair {currentPairIndex + 1} of {imagePairs.length}
            </span>

            <button
              onClick={() => setCurrentPairIndex(Math.min(imagePairs.length - 1, currentPairIndex + 1))}
              disabled={currentPairIndex === imagePairs.length - 1}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPairIndex === imagePairs.length - 1 ? '#333' : '#DC143C',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPairIndex === imagePairs.length - 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ANNOTATION MODAL */}
      {showAnnotationModal && annotationImageType && (
        <AnnotationTool
          imageType={annotationImageType}
          imageData={annotationImageData}
          hasThermalData={currentPair?.thermal?.hasRadiometricData || false}
          existingAnnotationCount={getTotalAnnotationCount()}
          onSave={handleSaveAnnotation}
          onCancel={() => {
            setShowAnnotationModal(false);
            setAnnotationImageType(null);
            setAnnotationImageData('');
          }}
        />
      )}
    </div>
  );
}

export default MultiImageViewerPage;