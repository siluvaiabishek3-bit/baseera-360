import { useState, useRef, useEffect } from 'react';
import { Circle, Square, PenTool, MousePointer, Loader } from 'lucide-react';
import { extractThermalData, generateSimulatedThermalData } from '@/services/thermalDataExtractor';

interface AnnotationToolProps {
  imageType: 'rgb' | 'thermal';
  imageData: string;
  existingAnnotationCount?: number;
  onSave: (annotation: any) => void;
  onCancel: () => void;
}

export function AnnotationTool({
  imageType,
  imageData,
  existingAnnotationCount = 0,
  onSave,
  onCancel,
}: AnnotationToolProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'point' | 'circle' | 'rectangle' | 'freehand' | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [defectType, setDefectType] = useState('Crack');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [temperatureData, setTemperatureData] = useState<any>(null);
  const [loadingTemperature, setLoadingTemperature] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasData, setCanvasData] = useState<ImageData | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (imageData) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setTimeout(() => {
          setupCanvas(img);
        }, 100);
      };
      img.onerror = () => {
        console.error('Failed to load image');
      };
      img.src = imageData;
    }
  }, [imageData]);

  const setupCanvas = (img: HTMLImageElement) => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const imgAspectRatio = img.width / img.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let canvasWidth = containerWidth;
    let canvasHeight = containerHeight;

    if (imgAspectRatio > containerAspectRatio) {
      canvasHeight = containerWidth / imgAspectRatio;
    } else {
      canvasWidth = containerHeight * imgAspectRatio;
    }

    const newScale = canvasWidth / img.width;
    setScale(newScale);

    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const imageDataObj = ctx.getImageData(0, 0, img.width, img.height);
      setCanvasData(imageDataObj);
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasData || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Restore original image
    ctx.putImageData(canvasData, 0, 0);

    // Redraw current drawing on top
    if (mode === 'point' && startPoint) {
      ctx.fillStyle = 'rgba(220, 20, 60, 0.9)';
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#DC143C';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (mode === 'circle' && startPoint && points.length > 0) {
      const radius = Math.sqrt(
        Math.pow(points[0].x - startPoint.x, 2) + Math.pow(points[0].y - startPoint.y, 2)
      );
      ctx.strokeStyle = '#DC143C';
      ctx.fillStyle = 'rgba(220, 20, 60, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (mode === 'rectangle' && startPoint && points.length > 0) {
      const width = points[0].x - startPoint.x;
      const height = points[0].y - startPoint.y;
      ctx.strokeStyle = '#DC143C';
      ctx.fillStyle = 'rgba(220, 20, 60, 0.2)';
      ctx.lineWidth = 2;
      ctx.fillRect(startPoint.x, startPoint.y, width, height);
      ctx.strokeRect(startPoint.x, startPoint.y, width, height);
    } else if (mode === 'freehand' && points.length > 0) {
      ctx.strokeStyle = '#DC143C';
      ctx.lineWidth = 2;
      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseDown = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mode) {
      alert('Please select a drawing tool first');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (mode === 'point') {
      setStartPoint({ x, y });
      // Extract temperature for point
      if (imageType === 'thermal') {
        setLoadingTemperature(true);
        try {
          const tempData = await extractThermalData(imageData, 'point', { x, y });
          setTemperatureData(tempData);
        } catch (error) {
          console.error('Error extracting temperature:', error);
          setTemperatureData(generateSimulatedThermalData('point'));
        } finally {
          setLoadingTemperature(false);
        }
      }
      setShowForm(true);
    } else if (mode === 'circle' || mode === 'rectangle') {
      setStartPoint({ x, y });
      setIsDrawing(true);
    } else if (mode === 'freehand') {
      setIsDrawing(true);
      setPoints([{ x, y }]);
      setStartPoint({ x, y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !mode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if ((mode === 'circle' || mode === 'rectangle') && startPoint) {
      setPoints([{ x, y }]);
      redrawCanvas();
    } else if (mode === 'freehand') {
      setPoints([...points, { x, y }]);
      redrawCanvas();
    }
  };

  const handleCanvasMouseUp = async () => {
    if (mode === 'circle' || mode === 'rectangle') {
      setIsDrawing(false);
      // Extract temperature for polygon
      if (imageType === 'thermal' && startPoint && points.length > 0) {
        setLoadingTemperature(true);
        try {
          const tempData = await extractThermalData(imageData, mode, startPoint, points);
          setTemperatureData(tempData);
        } catch (error) {
          console.error('Error extracting temperature:', error);
          setTemperatureData(generateSimulatedThermalData('polygon'));
        } finally {
          setLoadingTemperature(false);
        }
      }
      setShowForm(true);
    } else if (mode === 'freehand') {
      setIsDrawing(false);
      // Extract temperature for freehand
      if (imageType === 'thermal' && startPoint && points.length > 1) {
        setLoadingTemperature(true);
        try {
          const tempData = await extractThermalData(imageData, 'freehand', startPoint, points);
          setTemperatureData(tempData);
        } catch (error) {
          console.error('Error extracting temperature:', error);
          setTemperatureData(generateSimulatedThermalData('polygon'));
        } finally {
          setLoadingTemperature(false);
        }
      }
      setShowForm(true);
    }
  };

  const handleSave = () => {
    if (!defectType || !severity) {
      alert('Please fill in all required fields');
      return;
    }

    const annotation = {
      type: mode || 'point',
      points,
      startPoint,
      defectType,
      severity,
      description,
      temperatureData: imageType === 'thermal' ? temperatureData : undefined,
      imageType,
      number: existingAnnotationCount + 1,
    };

    onSave(annotation);
    resetForm();
  };

  const resetForm = () => {
    setMode(null);
    setStartPoint(null);
    setPoints([]);
    setShowForm(false);
    setDefectType('Crack');
    setSeverity('MEDIUM');
    setDescription('');
    setTemperatureData(null);
    setLoadingTemperature(false);
    if (image) {
      setupCanvas(image);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return '#DC143C';
      case 'HIGH': return '#FF4444';
      case 'MEDIUM': return '#f97316';
      case 'LOW': return '#eab308';
      default: return '#666';
    }
  };

  return (
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
          borderBottom: '1px solid #DC143C',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          Add {imageType.toUpperCase()} Annotation (#{existingAnnotationCount + 1})
        </h2>
        <button
          onClick={onCancel}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#DC143C',
            cursor: 'pointer',
            fontSize: '32px',
            fontWeight: 'bold',
            padding: '0',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220, 20, 60, 0.2)';
            e.currentTarget.style.borderRadius = '4px';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
      </div>

      {/* TOOLS BAR */}
      <div
        style={{
          backgroundColor: '#0f0f0f',
          borderBottom: '1px solid #333',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: '#999', fontSize: '12px', fontWeight: '600' }}>DRAWING TOOLS:</span>

        <button
          onClick={() => {
            setMode('point');
            setShowForm(false);
            setStartPoint(null);
            setPoints([]);
            setTemperatureData(null);
            if (canvasData) redrawCanvas();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'point' ? '#DC143C' : '#1a1a1a',
            color: mode === 'point' ? 'white' : '#fff',
            border: `1px solid ${mode === 'point' ? '#DC143C' : '#333'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            if (mode !== 'point') {
              e.currentTarget.style.borderColor = '#DC143C';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'point') {
              e.currentTarget.style.borderColor = '#333';
            }
          }}
        >
          <MousePointer size={14} />
          Point
        </button>

        <button
          onClick={() => {
            setMode('circle');
            setShowForm(false);
            setStartPoint(null);
            setPoints([]);
            setTemperatureData(null);
            if (canvasData) redrawCanvas();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'circle' ? '#DC143C' : '#1a1a1a',
            color: mode === 'circle' ? 'white' : '#fff',
            border: `1px solid ${mode === 'circle' ? '#DC143C' : '#333'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            if (mode !== 'circle') {
              e.currentTarget.style.borderColor = '#DC143C';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'circle') {
              e.currentTarget.style.borderColor = '#333';
            }
          }}
        >
          <Circle size={14} />
          Circle
        </button>

        <button
          onClick={() => {
            setMode('rectangle');
            setShowForm(false);
            setStartPoint(null);
            setPoints([]);
            setTemperatureData(null);
            if (canvasData) redrawCanvas();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'rectangle' ? '#DC143C' : '#1a1a1a',
            color: mode === 'rectangle' ? 'white' : '#fff',
            border: `1px solid ${mode === 'rectangle' ? '#DC143C' : '#333'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            if (mode !== 'rectangle') {
              e.currentTarget.style.borderColor = '#DC143C';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'rectangle') {
              e.currentTarget.style.borderColor = '#333';
            }
          }}
        >
          <Square size={14} />
          Rectangle
        </button>

        <button
          onClick={() => {
            setMode('freehand');
            setShowForm(false);
            setStartPoint(null);
            setPoints([]);
            setTemperatureData(null);
            if (canvasData) redrawCanvas();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'freehand' ? '#DC143C' : '#1a1a1a',
            color: mode === 'freehand' ? 'white' : '#fff',
            border: `1px solid ${mode === 'freehand' ? '#DC143C' : '#333'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            if (mode !== 'freehand') {
              e.currentTarget.style.borderColor = '#DC143C';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'freehand') {
              e.currentTarget.style.borderColor = '#333';
            }
          }}
        >
          <PenTool size={14} />
          Freehand
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', padding: '24px', overflow: 'hidden' }}>
        {/* CANVAS AREA */}
        <div
          ref={canvasContainerRef}
          style={{
            backgroundColor: '#0f0f0f',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
          }}
        >
          {image ? (
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{
                cursor: mode ? 'crosshair' : 'default',
                border: '1px solid #333',
                borderRadius: '4px',
                backgroundColor: '#1a1a1a',
                display: 'block',
              }}
            />
          ) : (
            <div style={{ color: '#999', fontSize: '14px' }}>Loading image...</div>
          )}
        </div>

        {/* FORM SIDEBAR */}
        {showForm && (
          <div
            style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>Annotation #{existingAnnotationCount + 1}</h3>

            {/* THERMAL DATA SECTION */}
            {imageType === 'thermal' && temperatureData ? (
              <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #FF4444',
                borderRadius: '6px',
                padding: '12px',
              }}>
                <h4 style={{ color: '#FF4444', fontWeight: 'bold', fontSize: '12px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                  🌡️ Thermal Data
                </h4>

                {loadingTemperature ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#999' }}>
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Extracting temperature...
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#fff' }}>
                    {mode === 'point' && temperatureData.point !== undefined && (
                      <div style={{ color: '#FF4444', fontWeight: '600', fontSize: '14px' }}>
                        📍 {temperatureData.point}°C
                      </div>
                    )}

                    {['circle', 'rectangle', 'freehand'].includes(mode || '') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {temperatureData.max !== undefined && (
                          <div>
                            <span style={{ color: '#999' }}>Max:</span>{' '}
                            <span style={{ color: '#FF4444', fontWeight: '600' }}>{temperatureData.max}°C</span>
                          </div>
                        )}
                        {temperatureData.mean !== undefined && (
                          <div>
                            <span style={{ color: '#999' }}>Mean:</span>{' '}
                            <span style={{ color: '#f97316', fontWeight: '600' }}>{temperatureData.mean}°C</span>
                          </div>
                        )}
                        {temperatureData.min !== undefined && (
                          <div>
                            <span style={{ color: '#999' }}>Min:</span>{' '}
                            <span style={{ color: '#3B82F6', fontWeight: '600' }}>{temperatureData.min}°C</span>
                          </div>
                        )}
                        {temperatureData.median !== undefined && (
                          <div>
                            <span style={{ color: '#999' }}>Median:</span>{' '}
                            <span style={{ color: '#8B5CF6', fontWeight: '600' }}>{temperatureData.median}°C</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : imageType === 'thermal' ? (
              <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #FF4444',
                borderRadius: '6px',
                padding: '12px',
                color: '#999',
                fontSize: '12px',
              }}>
                ⚠️ No thermal data found in this image
              </div>
            ) : null}

            {/* DEFECT TYPE */}
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                Defect Type *
              </label>
              <select
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <option value="Crack">Crack</option>
                <option value="Corrosion">Corrosion</option>
                <option value="Spalling">Spalling</option>
                <option value="Water Ingress">Water Ingress</option>
                <option value="Staining">Staining</option>
                <option value="Efflorescence">Efflorescence</option>
              </select>
            </div>

            {/* SEVERITY */}
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                Severity *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    style={{
                      padding: '8px',
                      backgroundColor: severity === sev ? getSeverityColor(sev) : '#1a1a1a',
                      color: 'white',
                      border: `1px solid ${getSeverityColor(sev)}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '11px',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      if (severity !== sev) {
                        e.currentTarget.style.backgroundColor = getSeverityColor(sev) + '20';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (severity !== sev) {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                      }
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes..."
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  fontSize: '12px',
                  minHeight: '80px',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* BUTTONS */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={() => {
                  resetForm();
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                }}
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#DC143C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B91C3C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#DC143C';
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnnotationTool;