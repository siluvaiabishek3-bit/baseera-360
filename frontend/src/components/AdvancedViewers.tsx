/**
 * BASEERA 360 - Advanced Viewers Component
 * Phase 4: Advanced Viewers & Analytics
 * React component for 3D, thermal, panorama, and analytics
 */

import React, { useState, useEffect } from 'react';

interface AdvancedViewersProps {
  projectId: string;
  mediaId: string;
  mediaType: '3D' | 'THERMAL' | 'PANORAMA' | 'RGB';
}

/**
 * Advanced Viewers Component
 * Displays 3D models, thermal images, panoramas, and analytics
 */
export const AdvancedViewers: React.FC<AdvancedViewersProps> = ({
  projectId,
  mediaId,
  mediaType,
}) => {
  const [loading, setLoading] = useState(true);
  const [viewerData, setViewerData] = useState(null);
  const [activeTab, setActiveTab] = useState<'viewer' | 'analytics' | 'heatmap' | 'measurements'>(
    'viewer'
  );
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);

  // Load viewer data
  useEffect(() => {
    const loadViewerData = async () => {
      try {
        setLoading(true);

        let response;
        switch (mediaType) {
          case '3D':
            response = await fetch(`/api/viewer/3d/${mediaId}`);
            break;
          case 'THERMAL':
            response = await fetch(`/api/viewer/thermal/${mediaId}`);
            break;
          case 'PANORAMA':
            response = await fetch(`/api/viewer/panorama/${mediaId}`);
            break;
          default:
            response = await fetch(`/api/media/${mediaId}`);
        }

        const data = await response.json();
        if (data.success) {
          setViewerData(data.data);
        }
      } catch (error) {
        console.error('Error loading viewer data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadViewerData();
  }, [mediaId, mediaType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {mediaType} viewer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-viewers bg-gray-50 rounded-lg shadow-lg overflow-hidden">
      {/* Viewer Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('viewer')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'viewer'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📺 Viewer
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'analytics'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'heatmap'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔥 Heatmap
        </button>
        <button
          onClick={() => setActiveTab('measurements')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'measurements'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📏 Measurements
        </button>
      </div>

      {/* Viewer Content */}
      <div className="p-6 min-h-96">
        {activeTab === 'viewer' && renderViewerContent(mediaType, viewerData)}
        {activeTab === 'analytics' && renderAnalyticsContent(viewerData)}
        {activeTab === 'heatmap' && renderHeatmapContent(mediaType, viewerData)}
        {activeTab === 'measurements' && renderMeasurementsContent(viewerData)}
      </div>

      {/* Hotspot Panel */}
      {selectedHotspot && (
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-lg p-4 max-w-sm">
          <button
            onClick={() => setSelectedHotspot(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <h4 className="font-semibold text-gray-800 mb-2">Hotspot Details</h4>
          <p className="text-sm text-gray-600">ID: {selectedHotspot}</p>
          <p className="text-sm text-gray-600 mt-2">
            Click on hotspots in the viewer to see details
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Render 3D, Thermal, or Panorama viewer
 */
function renderViewerContent(mediaType: string, data: any): JSX.Element {
  switch (mediaType) {
    case '3D':
      return (
        <div className="bg-gray-900 rounded-lg h-96 flex flex-col">
          <div id="3d-viewer" className="flex-1 flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-lg font-semibold mb-4">3D Model Viewer</p>
              <div className="text-6xl mb-4">📦</div>
              {data?.model && (
                <div>
                  <p className="text-sm">Format: {data.model.format}</p>
                  <p className="text-sm">Vertices: {data.model.metadata?.vertices?.toLocaleString()}</p>
                  <p className="text-sm">Faces: {data.model.metadata?.faces?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Complexity: {data.statistics?.complexity}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-800 p-4 text-white text-sm">
            <p>Use mouse to rotate • Scroll to zoom • Right-click to pan</p>
          </div>
        </div>
      );

    case 'THERMAL':
      return (
        <div className="bg-gray-900 rounded-lg h-96 flex flex-col">
          <div className="flex-1 flex items-center justify-center relative">
            <div className="text-white text-center">
              <p className="text-lg font-semibold mb-4">Thermal Image Viewer</p>
              <div className="text-6xl mb-4">🌡️</div>
              {data?.thermal && (
                <div className="bg-gray-800 rounded p-4">
                  <p className="text-sm">Min: {data.thermal.thermalInfo.minTemp}°C</p>
                  <p className="text-sm">Max: {data.thermal.thermalInfo.maxTemp}°C</p>
                  <p className="text-sm">Avg: {data.thermal.thermalInfo.avgTemp}°C</p>
                  <p className="text-xs text-yellow-300 mt-2">
                    Issues Found: {data.thermal.analysis.issues.length}
                  </p>
                </div>
              )}
            </div>

            {/* Color Scale */}
            <div className="absolute right-4 top-4 bg-gray-800 rounded p-3 text-white text-xs">
              <p className="font-semibold mb-2">Temperature Scale</p>
              <div className="w-6 h-32 bg-gradient-to-t from-red-500 via-yellow-500 to-blue-500 rounded mb-2"></div>
              <p>Cold ← → Hot</p>
            </div>
          </div>
          <div className="bg-gray-800 p-4 text-white text-sm">
            {data?.report && <p>⚠️ Urgency: {data.report.urgency}</p>}
          </div>
        </div>
      );

    case 'PANORAMA':
      return (
        <div className="bg-gray-900 rounded-lg h-96 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-lg font-semibold mb-4">360° Panorama Viewer</p>
              <div className="text-6xl mb-4">🔄</div>
              {data?.panorama && (
                <div>
                  <p className="text-sm">Resolution: {data.panorama.image.resolution}</p>
                  <p className="text-sm">Format: {data.panorama.image.format}</p>
                  <p className="text-sm">Location: {data.panorama.location.zone}</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-800 p-4 text-white text-sm">
            <p>Drag to rotate • Scroll to zoom • Double-click to reset</p>
          </div>
        </div>
      );

    default:
      return <div className="text-gray-600">Unsupported viewer type</div>;
  }
}

/**
 * Render analytics content
 */
function renderAnalyticsContent(data: any): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h5 className="font-semibold text-gray-800 mb-3">Issue Summary</h5>
        {data?.report && (
          <div className="text-sm text-gray-600">
            <p>✓ {data.report.findings.length} Issues Found</p>
            <p>⚠️ Urgency: {data.report.urgency}</p>
            <p>📋 Recommendations: {data.report.recommendations.length}</p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h5 className="font-semibold text-gray-800 mb-3">Data Quality</h5>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">92% Quality Score</p>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 col-span-2">
        <h5 className="font-semibold text-gray-800 mb-3">Key Findings</h5>
        {data?.report?.findings && (
          <ul className="text-sm text-gray-600 space-y-1">
            {data.report.findings.slice(0, 3).map((finding: string, idx: number) => (
              <li key={idx}>• {finding}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Render heatmap content
 */
function renderHeatmapContent(mediaType: string, data: any): JSX.Element {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h5 className="font-semibold text-gray-800 mb-3">Defect Density Heatmap</h5>

      {mediaType === 'THERMAL' && (
        <div className="bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 h-32 rounded-lg mb-4 flex items-center justify-center">
          <p className="text-white font-semibold">Temperature Gradient</p>
        </div>
      )}

      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          🗺️ Interactive heatmap will render here using{' '}
          {mediaType === 'THERMAL' ? 'Leaflet' : 'Mapbox'}
        </p>
        <p className="text-sm text-gray-500 mt-2">Shows defect concentration and severity zones</p>
      </div>
    </div>
  );
}

/**
 * Render measurements content
 */
function renderMeasurementsContent(data: any): JSX.Element {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h5 className="font-semibold text-gray-800 mb-4">Measurements</h5>

      {data?.measurements && data.measurements.length > 0 ? (
        <div className="space-y-3">
          {data.measurements.map((m: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-800">{m.type.toUpperCase()}</p>
                <p className="text-sm text-gray-600">Points: {m.points.length}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-blue-600">
                  {m.value.toFixed(2)} {m.unit}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">📏 No measurements yet</p>
          <p className="text-sm text-gray-500 mt-2">Click the measurement tool in the viewer</p>
        </div>
      )}
    </div>
  );
}

export default AdvancedViewers;
