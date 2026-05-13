/**
 * BASEERA 360 - Comment Thread Component
 * Display and manage comments on annotations
 */

import { useState, useEffect } from 'react';
import apiClient from '@/services/api';

interface Comment {
  id: string;
  annotationId: string;
  message: string;
  createdByName: string;
  createdByEmail: string;
  attachmentUrl?: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CommentThreadProps {
  projectId: string;
  annotationId: string;
  currentUserId: string;
}

export function CommentThread({
  projectId,
  annotationId,
  currentUserId,
}: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadComments();
  }, [annotationId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAnnotationComments(projectId, annotationId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await apiClient.createAnnotationComment(
        projectId,
        annotationId,
        {
          message: newComment.trim(),
        }
      );

      if (response.success) {
        setComments([...comments, response.data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiClient.deleteAnnotationComment(projectId, annotationId, commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-4">
          <div className="text-2xl mb-2">🔄</div>
          <p className="text-gray-600 text-sm">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">💬 Add Comment</h3>

        <div className="space-y-4">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this defect..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={submitting}
          />

          <div className="flex gap-4">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {submitting ? '📤 Posting...' : '✓ Post Comment'}
            </button>
            <button
              onClick={() => setNewComment('')}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">💭</div>
            <p className="text-gray-600">No comments yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Be the first to comment on this defect
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{comment.createdByName}</p>
                    <p className="text-xs text-gray-500">{comment.createdByEmail}</p>
                  </div>
                  <p className="text-xs text-gray-500 text-right">{formatDate(comment.createdAt)}</p>
                </div>

                {/* Comment Body */}
                <p className="text-gray-700 my-3 whitespace-pre-wrap">{comment.message}</p>

                {/* Attachment */}
                {comment.attachmentUrl && (
                  <div className="mb-3">
                    <a
                      href={comment.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2"
                    >
                      📎 View Attachment
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  {comment.replyCount > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {expandedReplies.has(comment.id) ? '▼' : '▶'}
                      {comment.replyCount} {comment.replyCount === 1 ? 'Reply' : 'Replies'}
                    </button>
                  )}

                  {currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-sm text-red-600 hover:text-red-700 ml-auto"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                {/* Replies (if expanded) */}
                {expandedReplies.has(comment.id) && comment.replyCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-600">
                      💬 {comment.replyCount} reply/replies (expandable in full view)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentThread;
