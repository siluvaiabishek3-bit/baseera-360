import { useState, useRef } from 'react';
import { Upload, X, Check, Trash2 } from 'lucide-react';
import { mockAPI } from '@/services/mockDataService';
import { extractImageMetadata } from '@/services/exifExtractor';

interface UploadMediaModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FilePreview {
  file: File;
  preview: string;
  id: string;
}

export function UploadMediaModal({ projectId, onClose, onSuccess }: UploadMediaModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPhase, setSelectedPhase] = useState('Phase 1');
  const [selectedFloor, setSelectedFloor] = useState('Ground');
  const [selectedType, setSelectedType] = useState<'rgb' | 'thermal' | 'zoom'>('rgb');
  const [files, setFiles] = useState<{ [key: string]: FilePreview[] }>({
    rgb: [],
    thermal: [],
    zoom: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const phases = ['Phase 1', 'Phase 2', 'Phase 3'];
  const floors = ['Ground', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5'];

  const handleFilesSelect = async (newFiles: FileList | null) => {
  if (!newFiles) return;

  const fileArray = Array.from(newFiles);
  let processedCount = 0;

  for (const file of fileArray) {
    if (!file.type.startsWith('image/')) {
      setError(`${file.name} is not an image file`);
      continue;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const preview = e.target?.result as string;
      
      // Extract EXIF metadata
      const metadata = await extractImageMetadata(file);

      const filePreview: FilePreview = {
        file,
        preview,
        id: `${Date.now()}-${Math.random()}`,
      };

      setFiles((prev) => ({
        ...prev,
        [selectedType]: [...prev[selectedType], filePreview],
      }));

      processedCount++;
      if (processedCount === fileArray.length) {
        setError('');
      }
    };
    reader.readAsDataURL(file);
  }
};

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFilesSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (type: 'rgb' | 'thermal' | 'zoom', id: string) => {
    setFiles((prev) => ({
      ...prev,
      [type]: prev[type].filter((f) => f.id !== id),
    }));
  };

const handleUpload = async () => {
  const totalFiles = files.rgb.length + files.thermal.length + files.zoom.length;
  
  if (totalFiles === 0) {
    setError('Please select at least one image');
    return;
  }

  setLoading(true);
  try {
    console.log('\n\n🚀 UPLOADING WITH REAL EXIF METADATA\n');

    let uploadedCount = 0;

    // Upload RGB
    for (const filePreview of files.rgb) {
      const metadata = await extractImageMetadata(filePreview.file);

      await mockAPI.createMedia({
        projectId,
        phase: selectedPhase,
        floor: selectedFloor,
        type: 'rgb',
        imageData: filePreview.preview,
        uploadedAt: new Date().toLocaleString(),
        timestamp: metadata.captureTime,
        captureTime: metadata.captureTime,
        hasRadiometricData: false,
        geoTag: {
          x: metadata.latitude || (25.1972 + Math.random() * 0.01),
          y: metadata.longitude || (55.2744 + Math.random() * 0.01),
          z: metadata.altitude || (800 + Math.random() * 50),
        },
        filename: filePreview.file.name,
        cameraMake: metadata.cameraMake,
        cameraModel: metadata.cameraModel,
      });
      uploadedCount++;
      console.log(`✅ RGB: ${filePreview.file.name}`);
      console.log(`   Capture Time: ${metadata.captureDateString}\n`);
    }

    // Upload Thermal
    for (const filePreview of files.thermal) {
      const metadata = await extractImageMetadata(filePreview.file);

      await mockAPI.createMedia({
        projectId,
        phase: selectedPhase,
        floor: selectedFloor,
        type: 'thermal',
        imageData: filePreview.preview,
        uploadedAt: new Date().toLocaleString(),
        timestamp: metadata.captureTime,
        captureTime: metadata.captureTime,
        hasRadiometricData: metadata.isThermalCamera,
        geoTag: {
          x: metadata.latitude || (25.1972 + Math.random() * 0.01),
          y: metadata.longitude || (55.2744 + Math.random() * 0.01),
          z: metadata.altitude || (800 + Math.random() * 50),
        },
        filename: filePreview.file.name,
        cameraMake: metadata.cameraMake,
        cameraModel: metadata.cameraModel,
      });
      uploadedCount++;
      console.log(`✅ Thermal: ${filePreview.file.name}`);
      console.log(`   Capture Time: ${metadata.captureDateString}\n`);
    }

    // Upload Zoom
    for (const filePreview of files.zoom) {
      const metadata = await extractImageMetadata(filePreview.file);

      await mockAPI.createMedia({
        projectId,
        phase: selectedPhase,
        floor: selectedFloor,
        type: 'zoom',
        imageData: filePreview.preview,
        uploadedAt: new Date().toLocaleString(),
        timestamp: metadata.captureTime,
        captureTime: metadata.captureTime,
        hasRadiometricData: false,
        geoTag: {
          x: metadata.latitude || (25.1972 + Math.random() * 0.01),
          y: metadata.longitude || (55.2744 + Math.random() * 0.01),
          z: metadata.altitude || (800 + Math.random() * 50),
        },
        filename: filePreview.file.name,
        cameraMake: metadata.cameraMake,
        cameraModel: metadata.cameraModel,
      });
      uploadedCount++;
      console.log(`✅ Zoom: ${filePreview.file.name}`);
      console.log(`   Capture Time: ${metadata.captureDateString}\n`);
    }

    console.log(`\n✅✅✅ ${uploadedCount} images uploaded!\n\n`);

    setFiles({
      rgb: [],
      thermal: [],
      zoom: [],
    });
    setError('');
    onSuccess();
    onClose();
  } catch (err) {
    setError('Error uploading images');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleCloseModal = () => {
    setStep(1);
    setFiles({
      rgb: [],
      thermal: [],
      zoom: [],
    });
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const getTotalFiles = () => files.rgb.length + files.thermal.length + files.zoom.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
            Upload Media
          </h2>
          <button
            onClick={handleCloseModal}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '24px',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* PROGRESS STEPS */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', justifyContent: 'space-between' }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: step >= s ? '#DC143C' : '#f3f4f6',
                color: step >= s ? 'white' : '#666',
                borderRadius: '6px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Step {s}
            </div>
          ))}
        </div>

        {/* STEP 1: SELECT PHASE & FLOOR */}
        {step === 1 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px' }}>
              Step 1: Select Building Phase & Floor
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
                Phase *
              </label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {phases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
                Floor *
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {floors.map((floor) => (
                  <option key={floor} value={floor}>
                    {floor}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#DC143C',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* STEP 2: SELECT AND UPLOAD FILES */}
        {step === 2 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px' }}>
              Step 2: Upload Images
            </h3>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px', fontSize: '12px', color: '#666' }}>
              <strong>Phase:</strong> {selectedPhase} | <strong>Floor:</strong> {selectedFloor}
              <br />
              <strong style={{ color: '#DC143C' }}>
                Upload multiple RGB, Thermal, and Zoom images - they will auto-pair by capture time!
              </strong>
            </div>

            {/* RGB SECTION */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '2px solid #3B82F6' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px', margin: '0 0 12px 0' }}>
                📷 RGB Images ({files.rgb.length})
              </h4>

              {files.rgb.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {files.rgb.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        position: 'relative',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#e5e7eb',
                        aspectRatio: '1',
                      }}
                    >
                      <img
                        src={file.preview}
                        alt="RGB"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => removeFile('rgb', file.id)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => {
                  setSelectedType('rgb');
                  fileInputRef.current?.click();
                }}
                style={{
                  border: '2px dashed #3B82F6',
                  borderRadius: '6px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <Upload size={24} style={{ margin: '0 auto 8px', color: '#3B82F6' }} />
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>
                  Add RGB Images
                </p>
              </div>
            </div>

            {/* THERMAL SECTION */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '2px solid #FF4444' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px', margin: '0 0 12px 0' }}>
                🌡️ Thermal Images ({files.thermal.length})
              </h4>

              {files.thermal.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {files.thermal.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        position: 'relative',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#e5e7eb',
                        aspectRatio: '1',
                      }}
                    >
                      <img
                        src={file.preview}
                        alt="Thermal"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => removeFile('thermal', file.id)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => {
                  setSelectedType('thermal');
                  fileInputRef.current?.click();
                }}
                style={{
                  border: '2px dashed #FF4444',
                  borderRadius: '6px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <Upload size={24} style={{ margin: '0 auto 8px', color: '#FF4444' }} />
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>
                  Add Thermal Images
                </p>
              </div>
            </div>

            {/* ZOOM SECTION */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f3e8ff', borderRadius: '8px', border: '2px solid #8B5CF6' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px', margin: '0 0 12px 0' }}>
                🔍 Zoom Images ({files.zoom.length})
              </h4>

              {files.zoom.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {files.zoom.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        position: 'relative',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#e5e7eb',
                        aspectRatio: '1',
                      }}
                    >
                      <img
                        src={file.preview}
                        alt="Zoom"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => removeFile('zoom', file.id)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => {
                  setSelectedType('zoom');
                  fileInputRef.current?.click();
                }}
                style={{
                  border: '2px dashed #8B5CF6',
                  borderRadius: '6px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <Upload size={24} style={{ margin: '0 auto 8px', color: '#8B5CF6' }} />
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', margin: '0' }}>
                  Add Zoom Images
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFilesSelect(e.target.files)}
              style={{ display: 'none' }}
            />

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '12px',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleUpload}
                disabled={getTotalFiles() === 0 || loading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: getTotalFiles() === 0 || loading ? '#d1d5db' : '#DC143C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: getTotalFiles() === 0 || loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? 'Uploading...' : (
                  <>
                    <Check size={16} />
                    Upload {getTotalFiles()} {getTotalFiles() === 1 ? 'Image' : 'Images'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadMediaModal;