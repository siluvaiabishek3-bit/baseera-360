import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockAPI } from '@/services/mockDataService';
import { 
  ArrowLeft, ZoomIn, ZoomOut, Maximize2, RotateCw, Download, 
  Plus, AlertCircle, Edit, Trash2, Save, X, Image as ImageIcon
} from 'lucide-react';

interface Annotation {
  id: string;
  globalDefectNumber?: number;
  type?: string;
  defectType?: string;
  severity: string;
  description: string;
  remedialAction?: string;
  annotatedImageData?: string;
}

export function InspectionViewerPage() {
  const navigate = useNavigate();
  const { projectId, imageId } = useParams();
  const [image, setImage] = useState<any>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [displayImage, setDisplayImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [newAnnotation, setNewAnnotation] = useState({
    x: 0,
    y: 0,
    type: 'CRACK',
    severity: 'MEDIUM',
    description: '',
    remedialAction: '',
  });
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchImageAndAnnotations();
  }, [projectId, imageId]);

  const fetchImageAndAnnotations = async () => {
    try {
      setLoading(true);

      // Fetch the media item
      const allMedia = await mockAPI.getMediaByProject(projectId);
      const mediaItem = allMedia.find((m: any) => m.id === imageId);
      setImage(mediaItem);

      if (!mediaItem) {
        console.error('Image not found');
        setLoading(false);
        return;
      }

      // Set display image - use imageData from media
      setDisplayImage(mediaItem.imageData || '/placeholder-image.jpg');

      // Fetch all annotations for this project
      const allAnnotations = await mockAPI.getAnnotationsByProject(projectId);
      
      // Filter annotations for this specific media
      const mediaAnnotations = allAnnotations.filter(
        (a: any) => a.mediaId === imageId
      );

      console.log('📸 Loaded image:', mediaItem.filename);
      console.log('📌 Found annotations for this image:', mediaAnnotations.length);
      
      setAnnotations(mediaAnnotations);
    } catch (error) {
      console.error('Error loading image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingAnnotation) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewAnnotation({ ...newAnnotation, x, y });
    setShowAnnotationForm(true);
    setIsAddingAnnotation(false);
  };

  const handleSaveAnnotation = () => {
    const annotation: Annotation = {
      id: Date.now().toString(),
      ...newAnnotation,
    };
    setAnnotations([...annotations, annotation]);
    setShowAnnotationForm(false);
    setNewAnnotation({
      x: 0,
      y: 0,
      type: 'CRACK',
      severity: 'MEDIUM',
      description: '',
      remedialAction: '',
    });
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    setSelectedAnnotation(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* HEADER */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="h-6 w-px bg-gray-700"></div>
          <div>
            <h1 className="text-white font-semibold">{image?.filename || 'Loading...'}</h1>
            <p className="text-gray-400 text-sm">Facade Inspection Image</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* ZOOM CONTROLS */}
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-2 hover:bg-gray-600 rounded transition text-white"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="p-2 hover:bg-gray-600 rounded transition text-white"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          <button
            onClick={() => setRotation((rotation + 90) % 360)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-white"
          >
            <RotateCw size={18} />
          </button>

          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-white">
            <Download size={18} />
          </button>

          <button
            onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${
              isAddingAnnotation
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <Plus size={18} />
            Add Defect
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* IMAGE VIEWER */}
        <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
          {loading ? (
            <div className="text-center text-white">
              <div className="inline-block animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
              <p>Loading image...</p>
            </div>
          ) : (
            <>
              {isAddingAnnotation && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-10">
                  Click on the image to mark a defect location
                </div>
              )}

              <div
                ref={imageRef}
                onClick={handleImageClick}
                className="relative cursor-crosshair"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                }}
              >
                {/* DISPLAY ACTUAL IMAGE */}
                {displayImage ? (
                  <div className="relative w-[800px] h-[600px] rounded-lg overflow-hidden">
                    <img
                      src={displayImage}
                      alt={image?.filename || 'Inspection Image'}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Show annotated images if available */}
                    {annotations.map((annotation) => (
                      <div key={annotation.id}>
                        {annotation.annotatedImageData && (
                          <div className="absolute inset-0 opacity-80">
                            <img
                              src={annotation.annotatedImageData}
                              alt={`Annotation #${annotation.globalDefectNumber}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-[800px] h-[600px] bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon size={48} className="text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No image available</p>
                    </div>
                  </div>
                )}

                {/* DEFECT MARKERS ON IMAGE */}
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnotation(annotation);
                    }}
                    className="absolute cursor-pointer"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center font-bold text-white text-sm animate-pulse"
                      style={{
                        backgroundColor:
                          annotation.severity === 'CRITICAL'
                            ? '#DC143C'
                            : annotation.severity === 'HIGH'
                            ? '#FF6600'
                            : annotation.severity === 'MEDIUM'
                            ? '#FFC107'
                            : '#4CAF50',
                      }}
                    >
                      {annotation.globalDefectNumber || '?'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-white font-bold text-xl mb-4">
              📌 Defects ({annotations.length})
            </h2>

            <div className="space-y-4">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  onClick={() => setSelectedAnnotation(annotation)}
                  className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition ${
                    selectedAnnotation?.id === annotation.id
                      ? 'ring-2 ring-blue-500'
                      : 'hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs"
                        style={{
                          backgroundColor:
                            annotation.severity === 'CRITICAL'
                              ? '#DC143C'
                              : annotation.severity === 'HIGH'
                              ? '#FF6600'
                              : annotation.severity === 'MEDIUM'
                              ? '#FFC107'
                              : '#4CAF50',
                        }}
                      >
                        {annotation.globalDefectNumber}
                      </div>
                      <span className="text-white font-semibold">
                        {annotation.defectType || annotation.type || 'Defect'}
                      </span>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded text-white font-bold"
                      style={{
                        backgroundColor:
                          annotation.severity === 'CRITICAL'
                            ? '#DC143C'
                            : annotation.severity === 'HIGH'
                            ? '#FF6600'
                            : annotation.severity === 'MEDIUM'
                            ? '#FFC107'
                            : '#4CAF50',
                      }}
                    >
                      {annotation.severity}
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm mb-2">{annotation.description}</p>

                  {annotation.annotatedImageData && (
                    <div className="bg-green-900 text-green-200 text-xs px-2 py-1 rounded mb-2 flex items-center gap-1">
                      <ImageIcon size={12} />
                      ✓ Annotated image available
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-600">
                    <p className="text-gray-400 text-xs mb-1">Remedial Action:</p>
                    <p className="text-gray-300 text-sm">{annotation.remedialAction || 'N/A'}</p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded transition text-sm"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnnotation(annotation.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded transition text-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {annotations.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle size={48} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No defects found for this image</p>
                  <p className="text-gray-500 text-sm mt-1">Use the annotation tool or go to reports</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD ANNOTATION MODAL */}
      {showAnnotationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Defect Annotation</h2>
              <button
                onClick={() => setShowAnnotationForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Defect Type *
                </label>
                <select
                  value={newAnnotation.type}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CRACK">Crack</option>
                  <option value="SPALLING">Spalling</option>
                  <option value="CORROSION">Corrosion</option>
                  <option value="WATER_DAMAGE">Water Damage</option>
                  <option value="JOINT_FAILURE">Joint Failure</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Severity Level *
                </label>
                <select
                  value={newAnnotation.severity}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, severity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newAnnotation.description}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the defect..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remedial Action *
                </label>
                <textarea
                  value={newAnnotation.remedialAction}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, remedialAction: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Recommended action to fix this defect..."
                  required
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowAnnotationForm(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnnotation}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold"
              >
                <Save size={18} />
                Save Defect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InspectionViewerPage;