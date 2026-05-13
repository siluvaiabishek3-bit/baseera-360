/**
 * BASEERA 360 - Annotation Viewer Component
 * Display images with annotation overlays and defect marking
 */

import { useState, useRef, useEffect } from 'react';
import apiClient from '@/services/api';

interface Annotation {
  id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdBy: string;
  createdAt: string;
}

interface AnnotationViewerProps {
  projectId: string;
  mediaId: string;
  mediaUrl: string;
  onAnnotationCreated?: (annotation: Annotation) => void;
}

const severityColors = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6',
  INFO: '#10b981',
};

const severityLabels = {
  CRITICAL: '🔴 Critical',
  HIGH: '🟠 High',
  MEDIUM: '🟡 Medium',
  LOW: '🔵 Low',
  INFO: '🟢 Info',
};

export function AnnotationViewer({
  projectId,
  mediaId,
  mediaUrl,
  onAnnotationCreated,
}: AnnotationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<any>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'CRACK',
    severity: 'MEDIUM',
    description: '',
  });

  // Load annotations
  useEffect(() => {
    loadAnnotations();
  }, [mediaId]);

  // Draw on canvas when annotations change
  useEffect(() => {
    if (imgRef.current && canvasRef.current) {
      drawAnnotations();
    }
  }, [annotations, selectedAnnotation]);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAnnotations(projectId, { mediaId });
      setAnnotations(response.data.annotations || []);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const drawAnnotations = () => {
    if (!canvasRef.current || !imgRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw annotations
    annotations.forEach(annotation => {
      if (!annotation.coordinates) return;

      const { x, y, width, height } = annotation.coordinates;
      const color = severityColors[annotation.severity as keyof typeof severityColors] || '#3b82f6';
      const isSelected = annotation.id === selectedAnnotation;

      // Draw rectangle
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      const label = severityLabels[annotation.severity as keyof typeof severityLabels] || annotation.severity;
      ctx.fillStyle = color;
      ctx.font = 'bold 12px sans-serif';
      const textMetrics = ctx.measureText(label);
      const textHeight = 16;

      ctx.fillRect(x, y - textHeight - 4, textMetrics.width + 4, textHeight);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(label, x + 2, y - 6);

      // Draw category
      ctx.fillStyle = '#1f2937';
      ctx.font = '11px sans-serif';
      ctx.fillText(annotation.category, x + 2, y + height + 14);
    });

    // Draw current box being drawn
    if (currentBox) {
      const { startX, startY, endX, endY } = currentBox;
      const width = endX - startX;
      const height = endY - startY;

      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startX, startY, width, height);
      ctx.setLineDash([]);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ startX: x, startY: y, endX: x, endY: y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentBox({
      startX: startPos.x,
      startY: startPos.y,
      endX: x,
      endY: y,
    });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (currentBox) {
      const { startX, startY, endX, endY } = currentBox;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      if (width > 10 && height > 10) {
        setFormData(prev => ({
          ...prev,
          coordinates: { x, y, width, height },
        }));
        setShowForm(true);
        setCurrentBox(null);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on annotation
    for (const annotation of annotations) {
      if (!annotation.coordinates) continue;

      const { x: ax, y: ay, width: aw, height: ah } = annotation.coordinates;

      if (x >= ax && x <= ax + aw && y >= ay && y <= ay + ah) {
        setSelectedAnnotation(annotation.id);
        return;
      }
    }

    setSelectedAnnotation(null);
  };

  const handleCreateAnnotation = async () => {
    try {
      const response = await apiClient.createAnnotation({
        projectId,
        mediaId,
        ...formData,
      });

      if (response.success) {
        setAnnotations([...annotations, response.data.annotation]);
        setShowForm(false);
        setFormData({
          category: 'CRACK',
          severity: 'MEDIUM',
          description: '',
        });
        setCurrentBox(null);

        if (onAnnotationCreated) {
          onAnnotationCreated(response.data.annotation);
        }
      }
    } catch (error) {
      console.error('Failed to create annotation:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 flex-wrap items-center">
          <button
            onClick={() => setDrawMode(!drawMode)}
            className={`px-4 py-2 rounded-lg transition ${
              drawMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {drawMode ? '✏️ Drawing Mode (Click to stop)' : '✏️ Draw Annotation'}
          </button>

          {drawMode && (
            <p className="text-sm text-gray-600">
              Draw a rectangle on the image to mark defects
            </p>
          )}

          <div className="ml-auto">
            <p className="text-sm font-semibold text-gray-700">
              Total Annotations: <span className="text-blue-600">{annotations.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Image Canvas */}
      <div className="bg-gray-50 rounded-lg shadow p-4">
        <div className="relative inline-block">
          <img
            ref={imgRef}
            src={mediaUrl}
            alt="Inspectable media"
            className="max-w-full h-auto rounded-lg"
            onLoad={() => {
              if (canvasRef.current && imgRef.current) {
                canvasRef.current.width = imgRef.current.offsetWidth;
                canvasRef.current.height = imgRef.current.offsetHeight;
                drawAnnotations();
              }
            }}
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className={`absolute top-0 left-0 rounded-lg ${drawMode ? 'cursor-crosshair' : 'cursor-pointer'}`}
            style={{ display: imgRef.current ? 'block' : 'none' }}
          />
        </div>
      </div>

      {/* Annotation Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create Annotation</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Defect Category
              </label>
              <select
                value={formData.category}
                onChange={e =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="CRACK">🔨 Crack</option>
                <option value="SPALLING">💥 Spalling</option>
                <option value="EFFLORESCENCE">💧 Efflorescence</option>
                <option value="STAINING">🩶 Staining</option>
                <option value="JOINT_FAILURE">🔗 Joint Failure</option>
                <option value="SEALANT_FAILURE">🧴 Sealant Failure</option>
                <option value="CORROSION">🦀 Corrosion</option>
                <option value="WATER_DAMAGE">💧 Water Damage</option>
                <option value="GLASS_DAMAGE">🪟 Glass Damage</option>
                <option value="METAL_DAMAGE">⚙️ Metal Damage</option>
                <option value="THERMAL_ISSUE">🌡️ Thermal Issue</option>
                <option value="OTHER">❓ Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Severity Level
              </label>
              <select
                value={formData.severity}
                onChange={e =>
                  setFormData({ ...formData, severity: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="CRITICAL">🔴 Critical - Immediate action required</option>
                <option value="HIGH">🟠 High - Urgent attention needed</option>
                <option value="MEDIUM">🟡 Medium - Should be addressed</option>
                <option value="LOW">🔵 Low - Monitor and track</option>
                <option value="INFO">🟢 Info - General note</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the defect in detail..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateAnnotation}
                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✓ Save Annotation
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setCurrentBox(null);
                }}
                className="flex-1 px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Annotations ({annotations.length})</h3>

          <div className="space-y-3">
            {annotations.map(annotation => (
              <div
                key={annotation.id}
                onClick={() => setSelectedAnnotation(annotation.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedAnnotation === annotation.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {severityLabels[annotation.severity as keyof typeof severityLabels]}
                      {' '}
                      <span className="text-gray-600 font-normal">• {annotation.category}</span>
                    </p>
                    <p className="text-gray-700 mt-2">{annotation.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Status: <span className="font-semibold">{annotation.status}</span>
                    </p>
                  </div>
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        severityColors[annotation.severity as keyof typeof severityColors],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {annotations.length === 0 && !showForm && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-600">No annotations yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Click "Draw Annotation" above to mark defects on the image
          </p>
        </div>
      )}
    </div>
  );
}

export default AnnotationViewer;
