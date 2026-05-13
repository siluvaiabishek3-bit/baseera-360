/**
 * BASEERA 360 - Comment Service
 * Handle comments and discussions on annotations
 */

import { query, transaction } from '@/config/database';
import { NotFoundError, ValidationError } from '@/middleware/error-handler';
import logger from '@/config/logger';
import { v4 as uuidv4 } from 'uuid';

interface CommentData {
  annotationId: string;
  message: string;
  attachmentUrl?: string;
}

interface CommentUpdate {
  message?: string;
}

export class CommentService {
  /**
   * Create comment on annotation
   */
  async createComment(
    projectId: string,
    userId: string,
    data: CommentData
  ): Promise<any> {
    logger.info('Creating comment', { annotationId: data.annotationId });

    // Validate input
    if (!data.annotationId || !data.message) {
      throw new ValidationError('annotationId and message are required');
    }

    if (data.message.trim().length === 0 || data.message.length > 2000) {
      throw new ValidationError('Message must be between 1 and 2000 characters');
    }

    // Verify annotation exists
    const annotationExists = await query<{ id: string }>(
      'SELECT id FROM annotations WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
      [data.annotationId, projectId]
    );

    if (annotationExists.rows.length === 0) {
      throw new NotFoundError('Annotation not found');
    }

    // Create comment in transaction
    const comment = await transaction(async (client) => {
      const commentId = uuidv4();

      const result = await client.query<any>(
        `INSERT INTO comments (
          id, annotation_id, project_id, message, created_by, attachment_url
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          commentId,
          data.annotationId,
          projectId,
          data.message.trim(),
          userId,
          data.attachmentUrl || null,
        ]
      );

      return result.rows[0];
    });

    logger.info('Comment created', { commentId: comment.id });

    return this.formatComment(comment);
  }

  /**
   * Get comments on annotation
   */
  async getAnnotationComments(
    projectId: string,
    annotationId: string
  ): Promise<any[]> {
    logger.info('Fetching comments', { annotationId });

    const result = await query<any>(
      `SELECT 
        c.*,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT cr.id)::int as reply_count
      FROM comments c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN comment_replies cr ON c.id = cr.comment_id AND cr.deleted_at IS NULL
      WHERE c.annotation_id = $1 AND c.project_id = $2 AND c.deleted_at IS NULL
      GROUP BY c.id, u.id
      ORDER BY c.created_at ASC`,
      [annotationId, projectId]
    );

    return result.rows.map(c => this.formatComment(c));
  }

  /**
   * Get single comment
   */
  async getComment(commentId: string, projectId: string): Promise<any> {
    logger.info('Fetching comment', { commentId });

    const result = await query<any>(
      `SELECT 
        c.*,
        u.email,
        u.first_name,
        u.last_name
      FROM comments c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1 AND c.project_id = $2 AND c.deleted_at IS NULL`,
      [commentId, projectId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Comment ${commentId} not found`);
    }

    return this.formatComment(result.rows[0]);
  }

  /**
   * Update comment
   */
  async updateComment(
    commentId: string,
    projectId: string,
    userId: string,
    data: CommentUpdate
  ): Promise<any> {
    logger.info('Updating comment', { commentId });

    // Validate input
    if (!data.message || data.message.trim().length === 0) {
      throw new ValidationError('Message is required and cannot be empty');
    }

    if (data.message.length > 2000) {
      throw new ValidationError('Message cannot exceed 2000 characters');
    }

    // Verify user owns comment
    const commentOwner = await query<{ created_by: string }>(
      'SELECT created_by FROM comments WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
      [commentId, projectId]
    );

    if (commentOwner.rows.length === 0) {
      throw new NotFoundError(`Comment ${commentId} not found`);
    }

    if (commentOwner.rows[0].created_by !== userId) {
      throw new ValidationError('You can only edit your own comments');
    }

    const result = await query<any>(
      `UPDATE comments 
       SET message = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND project_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [data.message.trim(), commentId, projectId]
    );

    logger.info('Comment updated', { commentId });

    return this.formatComment(result.rows[0]);
  }

  /**
   * Delete comment (soft delete)
   */
  async deleteComment(
    commentId: string,
    projectId: string,
    userId: string
  ): Promise<void> {
    logger.info('Deleting comment', { commentId });

    // Verify user owns comment
    const commentOwner = await query<{ created_by: string }>(
      'SELECT created_by FROM comments WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
      [commentId, projectId]
    );

    if (commentOwner.rows.length === 0) {
      throw new NotFoundError(`Comment ${commentId} not found`);
    }

    if (commentOwner.rows[0].created_by !== userId) {
      throw new ValidationError('You can only delete your own comments');
    }

    await query(
      'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND project_id = $2',
      [commentId, projectId]
    );

    logger.info('Comment deleted', { commentId });
  }

  /**
   * Create reply to comment
   */
  async replyToComment(
    projectId: string,
    userId: string,
    commentId: string,
    message: string
  ): Promise<any> {
    logger.info('Creating comment reply', { commentId });

    // Validate input
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Reply message cannot be empty');
    }

    if (message.length > 2000) {
      throw new ValidationError('Reply cannot exceed 2000 characters');
    }

    // Verify comment exists
    const commentExists = await query<{ id: string }>(
      'SELECT id FROM comments WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
      [commentId, projectId]
    );

    if (commentExists.rows.length === 0) {
      throw new NotFoundError('Comment not found');
    }

    // Create reply in transaction
    const reply = await transaction(async (client) => {
      const replyId = uuidv4();

      const result = await client.query<any>(
        `INSERT INTO comment_replies (
          id, comment_id, project_id, message, created_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [replyId, commentId, projectId, message.trim(), userId]
      );

      return result.rows[0];
    });

    logger.info('Reply created', { replyId: reply.id });

    return this.formatReply(reply);
  }

  /**
   * Get replies to comment
   */
  async getCommentReplies(commentId: string, projectId: string): Promise<any[]> {
    logger.info('Fetching comment replies', { commentId });

    const result = await query<any>(
      `SELECT 
        cr.*,
        u.email,
        u.first_name,
        u.last_name
      FROM comment_replies cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.comment_id = $1 AND cr.project_id = $2 AND cr.deleted_at IS NULL
      ORDER BY cr.created_at ASC`,
      [commentId, projectId]
    );

    return result.rows.map(r => this.formatReply(r));
  }

  /**
   * Update reply
   */
  async updateReply(
    replyId: string,
    projectId: string,
    userId: string,
    message: string
  ): Promise<any> {
    logger.info('Updating reply', { replyId });

    // Validate input
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Message is required');
    }

    if (message.length > 2000) {
      throw new ValidationError('Message cannot exceed 2000 characters');
    }

    // Verify user owns reply
    const replyOwner = await query<{ created_by: string }>(
      'SELECT created_by FROM comment_replies WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
      [replyId, projectId]
    );

    if (replyOwner.rows.length === 0) {
      throw new NotFoundError(`Reply ${replyId} not found`);
    }

    if (replyOwner.rows[0].created_by !== userId) {
      throw new ValidationError('You can only edit your own replies');
    }

    const result = await query<any>(
      `UPDATE comment_replies 
       SET message = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND project_id = $3
       RETURNING *`,
      [message.trim(), replyId, projectId]
    );

    logger.info('Reply updated', { replyId });

    return this.formatReply(result.rows[0]);
  }

  /**
   * Delete reply
   */
  async deleteReply(
    replyId: string,
    projectId: string,
    userId: string
  ): Promise<void> {
    logger.info('Deleting reply', { replyId });

    // Verify user owns reply
    const replyOwner = await query<{ created_by: string }>(
      'SELECT created_by FROM comment_replies WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
      [replyId, projectId]
    );

    if (replyOwner.rows.length === 0) {
      throw new NotFoundError(`Reply ${replyId} not found`);
    }

    if (replyOwner.rows[0].created_by !== userId) {
      throw new ValidationError('You can only delete your own replies');
    }

    await query(
      'UPDATE comment_replies SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [replyId]
    );

    logger.info('Reply deleted', { replyId });
  }

  /**
   * Helper: Format comment response
   */
  private formatComment(row: any): any {
    return {
      id: row.id,
      annotationId: row.annotation_id,
      projectId: row.project_id,
      message: row.message,
      createdBy: row.created_by,
      createdByName: row.first_name ? `${row.first_name} ${row.last_name}` : 'Unknown',
      createdByEmail: row.email,
      attachmentUrl: row.attachment_url,
      replyCount: row.reply_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Helper: Format reply response
   */
  private formatReply(row: any): any {
    return {
      id: row.id,
      commentId: row.comment_id,
      projectId: row.project_id,
      message: row.message,
      createdBy: row.created_by,
      createdByName: row.first_name ? `${row.first_name} ${row.last_name}` : 'Unknown',
      createdByEmail: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new CommentService();
