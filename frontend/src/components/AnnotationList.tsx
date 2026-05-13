/**
 * BASEERA 360 - Annotation List Component
 * Display and manage annotations with filtering and status updates
 */

import { useState, useEffect } from 'react';
import apiClient from '@/services/api';

interface Annotation {
  id: string;
  mediaId: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  assignedTo?: string;
  assignedToEmail?: string;
  dueDate?: string;
  commentCount: number;
  createdAt: string;
}

interface AnnotationListProps {
  projectId: string;
  onAnnotationSelect?: (annotation: Annotation) => void;
}

const severityColors = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-blue-100 text-blue-800 border-blue-300',
  INFO: 'bg-green-100 text-green-800 border-green-300',
};

const statusColors = {
  OPEN: 'bg-red-50 border-red-200',
  IN_PROGRESS: 'bg-yellow-50 border-yellow-200',
  RESOLVED: 'bg-green-50 border-green-200',
  CLOSED: 'bg-gray-50 border-gray-200',
  REOPEN: 'bg-orange-50 border-orange-200',
};

const statusIcons = {
  OPEN: '🔴',
  IN_PROGRESS: '🟡',
  RESOLVED: '✅',
  CLOSED: '⭕',
  REOPEN: '🔁',
};

export function AnnotationList({ projectId, onAnnotationSelect }: AnnotationListProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    severity: 'all',
    category: 'all',
  });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadAnnotations();
  }, [projectId, filter]);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      const filterParams: any = { projectId };

      if (filter.status !== 'all') filterParams.status = filter.status;
      if (filter.severity !== 'all') filterParams.severity = filter.severity;
      if (filter.category !== 'all') filterParams.category = filter.category;

      const response = await apiClient.getAnnotations(projectId, filterParams);
      setAnnotations(response.data.annotations || []);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (annotationId: string, newStatus: string) => {
    try {
      setUpdatingStatus(annotationId);
      const response = await apiClient.updateAnnotationStatus(
        projectId,
        annotationId,
        {
          status: newStatus,
        }
      );

      if (response.success) {
        setAnnotations(
          annotations.map(a =>
            a.id === annotationId ? { ...a, status: newStatus } : a
          )
        );
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSelectAnnotation = (annotation: Annotation) => {
    setSelectedAnnotation(annotation.id);
    if (onAnnotationSelect) {
      onAnnotationSelect(annotation);
    }
  };

  const filteredAnnotations = annotations.filter(a => {
    if (filter.status !== 'all' && a.status !== filter.status) return false;
    if (filter.severity !== 'all' && a.severity !== filter.severity) return false;
    if (filter.category !== 'all' && a.category !== filter.category) return false;
    return true;
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      CRACK: '🔨 Crack',
      SPALLING: '💥 Spalling',
      EFFLORESCENCE: '💧 Efflorescence',
      STAINING: '🩶 Staining',
      JOINT_FAILURE: '🔗 Joint Failure',
      SEALANT_FAILURE: '🧴 Sealant Failure',
      CORROSION: '🦀 Corrosion',
      WATER_DAMAGE: '💧 Water Damage',
      GLASS_DAMAGE: '🪟 Glass Damage',
      METAL_DAMAGE: '⚙️ Metal Damage',
      THERMAL_ISSUE: '🌡️ Thermal Issue',
      OTHER: '❓ Other',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading annotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Filters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="OPEN">🔴 Open</option>
              <option value="IN_PROGRESS">🟡 In Progress</option>
              <option value="RESOLVED">✅ Resolved</option>
              <option value="CLOSED">⭕ Closed</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={filter.severity}
              onChange={e => setFilter({ ...filter, severity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severity</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🔵 Low</option>
              <option value="INFO">🟢 Info</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filter.category}
              onChange={e => setFilter({ ...filter, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="CRACK">🔨 Crack</option>
              <option value="SPALLING">💥 Spalling</option>
              <option value="CORROSION">🦀 Corrosion</option>
              <option value="WATER_DAMAGE">💧 Water Damage</option>
              <option value="THERMAL_ISSUE">🌡️ Thermal Issue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Annotations List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          📋 Annotations ({filteredAnnotations.length})
        </h3>

        {filteredAnnotations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600">No annotations found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or create new annotations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnotations.map(annotation => (
              <div
                key={annotation.id}
                onClick={() => handleSelectAnnotation(annotation)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedAnnotation === annotation.id
                    ? 'border-blue-600 bg-blue-50'
                    : statusColors[annotation.status as keyof typeof statusColors]
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          severityColors[annotation.severity as keyof typeof severityColors]
                        }`}
                      >
                        {annotation.severity}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {getCategoryLabel(annotation.category)}
                      </span>
                    </div>

                    <p className="text-gray-700 font-medium">{annotation.description}</p>

                    {annotation.commentCount > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        💬 {annotation.commentCount} comment(s)
                      </p>
                    )}
                  </div>

                  {/* Right Section - Status & Actions */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {statusIcons[annotation.status as keyof typeof statusIcons]}
                      </span>
                      <select
                        value={annotation.status}
                        onChange={e => {
                          e.stopPropagation();
                          handleStatusChange(annotation.id, e.target.value);
                        }}
                        disabled={updatingStatus === annotation.id}
                        className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>

                    {annotation.dueDate && (
                      <p className="text-xs text-gray-600">
                        Due: {new Date(annotation.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-200 text-xs text-gray-600">
                  <span>Created: {new Date(annotation.createdAt).toLocaleDateString()}</span>
                  {annotation.assignedToEmail && (
                    <span>Assigned to: {annotation.assignedToEmail}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => {
          const count = annotations.filter(a => a.status === status).length;
          const icon = statusIcons[status as keyof typeof statusIcons];
          return (
            <div key={status} className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl mb-2">{icon}</p>
              <p className="text-3xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600 mt-1">{status.replace('_', ' ')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnnotationList;
