/**
 * BASEERA 360 - Annotation Detail Page
 * View and manage single annotation with comments and history
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/services/api';
import CommentThread from '@/components/CommentThread';

interface AnnotationDetail {
  id: string;
  projectId: string;
  mediaId: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  coordinates?: any;
  assignedTo?: string;
  assignedToEmail?: string;
  dueDate?: string;
  resolutionNotes?: string;
  commentCount: number;
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
}

const severityColors = {
  CRITICAL: 'bg-red-100 border-red-300 text-red-900',
  HIGH: 'bg-orange-100 border-orange-300 text-orange-900',
  MEDIUM: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  LOW: 'bg-blue-100 border-blue-300 text-blue-900',
  INFO: 'bg-green-100 border-green-300 text-green-900',
};

const statusOptions = [
  { value: 'OPEN', label: '🔴 Open', color: 'bg-red-100' },
  { value: 'IN_PROGRESS', label: '🟡 In Progress', color: 'bg-yellow-100' },
  { value: 'RESOLVED', label: '✅ Resolved', color: 'bg-green-100' },
  { value: 'CLOSED', label: '⭕ Closed', color: 'bg-gray-100' },
];

export function AnnotationDetailPage() {
  const { projectId, annotationId } = useParams<{ projectId: string; annotationId: string }>();
  const navigate = useNavigate();
  const [annotation, setAnnotation] = useState<AnnotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    loadAnnotation();
    loadCurrentUser();
  }, [annotationId, projectId]);

  const loadAnnotation = async () => {
    try {
      setLoading(true);
      if (!annotationId || !projectId) return;

      const response = await apiClient.getAnnotation(projectId, annotationId);
      setAnnotation(response.data.annotation);
      setEditForm(response.data.annotation);
    } catch (err: any) {
      console.error('Failed to load annotation:', err);
      setError(err.response?.data?.error?.message || 'Failed to load annotation');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      setCurrentUserId(response.data.user.id);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (!annotationId || !projectId) return;

      const response = await apiClient.updateAnnotationStatus(projectId, annotationId, {
        status: newStatus,
        resolutionNotes: editForm.resolutionNotes,
      });

      setAnnotation(response.data.annotation);
      setEditForm(response.data.annotation);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      if (!annotationId || !projectId) return;

      const response = await apiClient.updateAnnotation(projectId, annotationId, editForm);
      setAnnotation(response.data.annotation);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update annotation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading annotation...</p>
        </div>
      </div>
    );
  }

  if (error || !annotation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← Back
          </button>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-red-600 text-lg">{error || 'Annotation not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 mb-2 text-sm"
          >
            ← Back
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Defect Annotation</h1>
              <p className="text-gray-600 mt-1">{annotation.category} • {annotation.description}</p>
            </div>

            <div
              className={`px-4 py-2 rounded-lg font-bold border-2 ${
                severityColors[annotation.severity as keyof typeof severityColors]
              }`}
            >
              {annotation.severity}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Status & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-3">Status</p>
            {editMode ? (
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={annotation.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  className={`px-4 py-2 rounded-lg font-bold border-2 bg-white focus:ring-2 focus:ring-blue-500 ${
                    statusOptions.find(o => o.value === annotation.status)?.color
                  }`}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Assigned To */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-3">Assigned To</p>
            {editMode ? (
              <input
                type="text"
                value={editForm.assignedToEmail || ''}
                onChange={e => setEditForm({ ...editForm, assignedToEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Email or name"
              />
            ) : (
              <p className="font-semibold text-gray-900">
                {annotation.assignedToEmail || 'Unassigned'}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-3">Due Date</p>
            {editMode ? (
              <input
                type="date"
                value={editForm.dueDate || ''}
                onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="font-semibold text-gray-900">
                {annotation.dueDate
                  ? new Date(annotation.dueDate).toLocaleDateString()
                  : 'Not set'}
              </p>
            )}
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Details</h2>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={editForm.resolutionNotes || ''}
                  onChange={e => setEditForm({ ...editForm, resolutionNotes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add resolution notes..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSaveChanges}
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditForm(annotation);
                  }}
                  className="flex-1 px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900 whitespace-pre-wrap">{annotation.description}</p>
              </div>

              {annotation.resolutionNotes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Resolution Notes</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{annotation.resolutionNotes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-semibold text-gray-900">{annotation.createdByEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(annotation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        {projectId && annotationId && currentUserId && (
          <CommentThread
            projectId={projectId}
            annotationId={annotationId}
            currentUserId={currentUserId}
          />
        )}
      </main>
    </div>
  );
}

export default AnnotationDetailPage;
