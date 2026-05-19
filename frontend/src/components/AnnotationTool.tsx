import { useState, useRef, useEffect } from 'react';
import { Circle, Square, PenTool, MousePointer, Loader } from 'lucide-react';
import { extractThermalData, generateSimulatedThermalData } from '@/services/thermalDataExtractor';

interface AnnotationToolProps {
  imageType: 'rgb' | 'thermal';
  imageData: string;
  hasThermalData?: boolean;
  existingAnnotationCount?: number;
  onSave: (annotation: any) => void;
  onCancel: () => void;
}

export function AnnotationTool({
  imageType,
  imageData,
  hasThermalData = false,
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
  const [remedialAction, setRemedialAction] = useState('');
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
      if (imageType === 'thermal' && hasThermalData) {
        setLoadingTemperature(true);
        try {
          const tempData = await extractThermalData(imageData, 'point', { x, y });
          setTemperatureData(tempData);
        } catch (error) {
          console.error('Error extracting temperature:', error);
          setTemperatureData(null);
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
      if (imageType === 'thermal' && hasThermalData && startPoint && points.length > 0) {
        setLoadingTemperature(true);
        try {
          const tempData = await extractThermalData(imageData, mode, startPoint, points);
          setTemperatureData(tempData);
        } catch (error) {
          console.error('Error extracting temperature:', error);
          setTemperatureData(null);
        } finally {
          setLoadingTemperature(false);
        }
      }
      setShowForm(true);
    } else if (mode === 'freehand') {
      setIsDrawing(false);
      if (imageType === 'thermal' && hasThermalData && startPoint && points.length > 1) {
        setLoadingTemperature(true);
        try {
          const tempData = await extractThermalData(imageData, mode, startPoint, points);
          setTemperatureData(tempData);
        } catch (error) {
          console.error('Error extracting temperature:', error);
          setTemperatureData(null);
        } finally {
          setLoadingTemperature(false);
        }
      }
      setShowForm(true);
    }
  };

  // ========== DRAW DEFECT NUMBER ON CANVAS ==========
  const drawDefectNumber = (ctx: CanvasRenderingContext2D, number: number) => {
    if (!startPoint) return;

    const fontSize = Math.max(40, (Math.min(ctx.canvas.width, ctx.canvas.height) * 0.04));
    const labelWidth = fontSize * 1.2;
    const labelHeight = fontSize * 1.5;

    // Draw white background box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(
      startPoint.x - labelWidth / 2,
      startPoint.y - labelHeight / 2,
      labelWidth,
      labelHeight
    );

    // Draw border
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      startPoint.x - labelWidth / 2,
      startPoint.y - labelHeight / 2,
      labelWidth,
      labelHeight
    );

    // Draw number
    ctx.fillStyle = '#DC143C';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), startPoint.x, startPoint.y);
  };

  // ========== CAPTURE CANVAS WITH DEFECT NUMBER ==========
  const handleSave = () => {
    if (!defectType || !severity) {
      alert('Please fill in all required fields');
      return;
    }

    const canvas = canvasRef.current;
    const globalDefectNumber = existingAnnotationCount + 1;

    console.log('🖼️ Canvas element exists:', !!canvas);
    console.log('Canvas dimensions:', canvas?.width, 'x', canvas?.height);
    console.log('Global Defect Number:', globalDefectNumber);

    let annotatedImageData = '';

    if (canvas) {
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw the defect number on the canvas BEFORE capturing
          console.log('🔢 Drawing defect number #' + globalDefectNumber + ' on canvas...');
          drawDefectNumber(ctx, globalDefectNumber);
        }

        // Verify canvas has content
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData?.data;
        let hasDrawing = false;

        if (data) {
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) {
              hasDrawing = true;
              break;
            }
          }
        }

        console.log('🎨 Canvas has content:', hasDrawing);

        // Convert canvas to base64
        annotatedImageData = canvas.toDataURL('image/jpeg', 0.95);

        console.log('✅ CANVAS CONVERTED TO BASE64');
        console.log('   Length:', annotatedImageData.length, 'characters');
        console.log('   Size: ~', (annotatedImageData.length / 1024).toFixed(2), 'KB');
      } catch (error) {
        console.error('❌ Could not capture canvas:', error);
        annotatedImageData = '';
      }
    } else {
      console.error('❌ Canvas ref is NULL');
    }

    const annotation = {
      type: mode || 'point',
      points,
      startPoint,
      defectType,
      severity,
      description,
      remedialAction,
      temperatureData: imageType === 'thermal' ? temperatureData : undefined,
      imageType,
      number: existingAnnotationCount + 1,
      annotatedImageData,
      globalDefectNumber, // ← Send the number
    };

    console.log('📦 ANNOTATION OBJECT BEING SAVED:');
    console.log({
      type: annotation.type,
      defectType: annotation.defectType,
      severity: annotation.severity,
      globalDefectNumber: annotation.globalDefectNumber,
      hasAnnotatedImageData: !!annotation.annotatedImageData,
      annotatedImageDataSizeKB: annotation.annotatedImageData ? (annotation.annotatedImageData.length / 1024).toFixed(2) : 0,
    });

    console.log('📤 Calling onSave with annotation...');
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
    setRemedialAction('');
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#000', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)', width: '90vw', height: '90vh', maxWidth: '1400px', display: 'flex', overflow: 'hidden' }}>
        {/* Canvas Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            borderRight: '1px solid #222',
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: '12px',
              display: 'flex',
              gap: '8px',
              backgroundColor: '#111',
              borderBottom: '1px solid #222',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => setMode('point')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: mode === 'point' ? '#DC143C' : '#222',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
              title="Click to place a point"
            >
              <MousePointer size={14} /> Point
            </button>
            <button
              onClick={() => setMode('circle')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: mode === 'circle' ? '#DC143C' : '#222',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
              title="Drag to draw a circle"
            >
              <Circle size={14} /> Circle
            </button>
            <button
              onClick={() => setMode('rectangle')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: mode === 'rectangle' ? '#DC143C' : '#222',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
              title="Drag to draw a rectangle"
            >
              <Square size={14} /> Rectangle
            </button>
            <button
              onClick={() => setMode('freehand')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: mode === 'freehand' ? '#DC143C' : '#222',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
              title="Click and drag to draw freehand"
            >
              <PenTool size={14} /> Freehand
            </button>
          </div>

          {/* Canvas */}
          <div
            ref={canvasContainerRef}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
              overflow: 'hidden',
              cursor: mode ? 'crosshair' : 'default',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                border: '1px solid #333',
              }}
            />
          </div>

          {/* Close Button */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#111',
              borderTop: '1px solid #222',
              textAlign: 'right',
            }}
          >
            <button
              onClick={onCancel}
              style={{
                padding: '6px 16px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Sidebar Form */}
        {showForm && (
          <div
            style={{
              width: '320px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#0a0a0a',
              borderLeft: '1px solid #222',
              overflowY: 'auto',
            }}
          >
            {/* DEFECT NUMBER DISPLAY */}
            <div style={{
              backgroundColor: '#DC143C',
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#fff', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                DEFECT #
              </div>
              <div style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}>
                {existingAnnotationCount + 1}
              </div>
            </div>

            {/* THERMAL DATA */}
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
                placeholder="Add notes about the defect..."
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

            {/* REMEDIAL ACTION */}
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                Remedial Action
              </label>
              <textarea
                value={remedialAction}
                onChange={(e) => setRemedialAction(e.target.value)}
                placeholder="Recommended action to fix this defect..."
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  fontSize: '12px',
                  minHeight: '60px',
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
                💾 Save Defect #{existingAnnotationCount + 1}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnnotationTool;
