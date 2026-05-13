/**
 * BASEERA 360 - Media Gallery Component
 * Upload and display media files (images, videos, 3D models)
 */

import { useState, useRef, useCallback } from 'react';
import apiClient from '@/services/api';

interface MediaFile {
  id: string;
  projectId: string;
  fileName: string;
  mediaType: 'RGB' | 'THERMAL' | 'MODEL_3D' | 'VIDEO' | 'VIDEO_360' | 'CAD' | 'PANORAMA';
  fileSize: number;
  cdnUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  annotationCount?: number;
}

interface MediaGalleryProps {
  projectId: string;
  onMediaUploaded?: (media: MediaFile) => void;
}

export function MediaGallery({ projectId, onMediaUploaded }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load media on mount
  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMediaByProject(projectId);
      setMedia(response.data.media || []);
    } catch (err: any) {
      console.error('Failed to load media:', err);
      setError('Failed to load media files');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        // Upload file
        const response = await apiClient.uploadMedia(formData, {
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        });

        if (response.success) {
          setMedia(prev => [response.data.media, ...prev]);
          if (onMediaUploaded) {
            onMediaUploaded(response.data.media);
          }
        }
      }

      setUploadProgress(0);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter media by type
  const filteredMedia = filterType ? media.filter(m => m.mediaType === filterType) : media;

  // Get media type icon
  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'RGB':
        return '🖼️';
      case 'THERMAL':
        return '🌡️';
      case 'MODEL_3D':
        return '🎯';
      case 'VIDEO':
      case 'VIDEO_360':
        return '🎬';
      case 'CAD':
        return '🏗️';
      case 'PANORAMA':
        return '🌐';
      default:
        return '📄';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Media</h3>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={e => {
            e.preventDefault();
            handleFileSelect(e.dataTransfer.files);
          }}
          onDragOver={e => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={e => handleFileSelect(e.target.files)}
            accept=".jpg,.jpeg,.png,.mp4,.obj,.fbx,.gltf,.dwg,.dxf,.mov"
          />

          {uploading ? (
            <div>
              <div className="text-4xl mb-4">📤</div>
              <p className="text-gray-600 mb-4">Uploading... {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-700 font-medium">
                Drag and drop files here or click to select
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supported: JPG, PNG, MP4, MOV, OBJ, FBX, GLTF, DWG, DXF (Max 500MB)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Filter Section */}
      {media.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Filter by Type</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType(null)}
              className={`px-4 py-2 rounded-lg transition ${
                filterType === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({media.length})
            </button>
            {['RGB', 'THERMAL', 'MODEL_3D', 'VIDEO', 'CAD'].map(type => {
              const count = media.filter(m => m.mediaType === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getMediaIcon(type)} {type} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Gallery Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Media Files {filterType && `- ${filterType}`}
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔄</div>
            <p className="text-gray-600">Loading media...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600">
              {filterType ? `No ${filterType} files found` : 'No media uploaded yet'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Upload files above to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map(m => (
              <div key={m.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition">
                {/* Thumbnail / Preview */}
                <div className="bg-gray-200 h-48 flex items-center justify-center text-6xl">
                  {getMediaIcon(m.mediaType)}
                </div>

                {/* File Info */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 truncate" title={m.fileName}>
                    {m.fileName}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {m.mediaType} • {formatFileSize(m.fileSize)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Uploaded: {new Date(m.uploadedAt).toLocaleDateString()}
                  </p>

                  {m.annotationCount && m.annotationCount > 0 && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-700">
                        ✍️ {m.annotationCount} annotation(s)
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-4 flex gap-2">
                  <button
                    onClick={() => window.open(m.cdnUrl, '_blank')}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => {
                      // Copy URL to clipboard
                      navigator.clipboard.writeText(m.cdnUrl);
                      alert('URL copied to clipboard');
                    }}
                    className="px-3 py-2 bg-gray-300 text-gray-800 text-sm rounded hover:bg-gray-400 transition"
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaGallery;
