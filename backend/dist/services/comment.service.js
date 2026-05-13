"use strict";
/**
 * BASEERA 360 - Comment Service
 * Handle comments and discussions on annotations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const database_1 = require("@/config/database");
const error_handler_1 = require("@/middleware/error-handler");
const logger_1 = __importDefault(require("@/config/logger"));
const uuid_1 = require("uuid");
class CommentService {
    /**
     * Create comment on annotation
     */
    async createComment(projectId, userId, data) {
        logger_1.default.info('Creating comment', { annotationId: data.annotationId });
        // Validate input
        if (!data.annotationId || !data.message) {
            throw new error_handler_1.ValidationError('annotationId and message are required');
        }
        if (data.message.trim().length === 0 || data.message.length > 2000) {
            throw new error_handler_1.ValidationError('Message must be between 1 and 2000 characters');
        }
        // Verify annotation exists
        const annotationExists = await (0, database_1.query)('SELECT id FROM annotations WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL', [data.annotationId, projectId]);
        if (annotationExists.rows.length === 0) {
            throw new error_handler_1.NotFoundError('Annotation not found');
        }
        // Create comment in transaction
        const comment = await (0, database_1.transaction)(async (client) => {
            const commentId = (0, uuid_1.v4)();
            const result = await client.query(`INSERT INTO comments (
          id, annotation_id, project_id, message, created_by, attachment_url
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`, [
                commentId,
                data.annotationId,
                projectId,
                data.message.trim(),
                userId,
                data.attachmentUrl || null,
            ]);
            return result.rows[0];
        });
        logger_1.default.info('Comment created', { commentId: comment.id });
        return this.formatComment(comment);
    }
    /**
     * Get comments on annotation
     */
    async getAnnotationComments(projectId, annotationId) {
        logger_1.default.info('Fetching comments', { annotationId });
        const result = await (0, database_1.query)(`SELECT 
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
      ORDER BY c.created_at ASC`, [annotationId, projectId]);
        return result.rows.map(c => this.formatComment(c));
    }
    /**
     * Get single comment
     */
    async getComment(commentId, projectId) {
        logger_1.default.info('Fetching comment', { commentId });
        const result = await (0, database_1.query)(`SELECT 
        c.*,
        u.email,
        u.first_name,
        u.last_name
      FROM comments c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1 AND c.project_id = $2 AND c.deleted_at IS NULL`, [commentId, projectId]);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Comment ${commentId} not found`);
        }
        return this.formatComment(result.rows[0]);
    }
    /**
     * Update comment
     */
    async updateComment(commentId, projectId, userId, data) {
        logger_1.default.info('Updating comment', { commentId });
        // Validate input
        if (!data.message || data.message.trim().length === 0) {
            throw new error_handler_1.ValidationError('Message is required and cannot be empty');
        }
        if (data.message.length > 2000) {
            throw new error_handler_1.ValidationError('Message cannot exceed 2000 characters');
        }
        // Verify user owns comment
        const commentOwner = await (0, database_1.query)('SELECT created_by FROM comments WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL', [commentId, projectId]);
        if (commentOwner.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Comment ${commentId} not found`);
        }
        if (commentOwner.rows[0].created_by !== userId) {
            throw new error_handler_1.ValidationError('You can only edit your own comments');
        }
        const result = await (0, database_1.query)(`UPDATE comments 
       SET message = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND project_id = $3 AND deleted_at IS NULL
       RETURNING *`, [data.message.trim(), commentId, projectId]);
        logger_1.default.info('Comment updated', { commentId });
        return this.formatComment(result.rows[0]);
    }
    /**
     * Delete comment (soft delete)
     */
    async deleteComment(commentId, projectId, userId) {
        logger_1.default.info('Deleting comment', { commentId });
        // Verify user owns comment
        const commentOwner = await (0, database_1.query)('SELECT created_by FROM comments WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL', [commentId, projectId]);
        if (commentOwner.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Comment ${commentId} not found`);
        }
        if (commentOwner.rows[0].created_by !== userId) {
            throw new error_handler_1.ValidationError('You can only delete your own comments');
        }
        await (0, database_1.query)('UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND project_id = $2', [commentId, projectId]);
        logger_1.default.info('Comment deleted', { commentId });
    }
    /**
     * Create reply to comment
     */
    async replyToComment(projectId, userId, commentId, message) {
        logger_1.default.info('Creating comment reply', { commentId });
        // Validate input
        if (!message || message.trim().length === 0) {
            throw new error_handler_1.ValidationError('Reply message cannot be empty');
        }
        if (message.length > 2000) {
            throw new error_handler_1.ValidationError('Reply cannot exceed 2000 characters');
        }
        // Verify comment exists
        const commentExists = await (0, database_1.query)('SELECT id FROM comments WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL', [commentId, projectId]);
        if (commentExists.rows.length === 0) {
            throw new error_handler_1.NotFoundError('Comment not found');
        }
        // Create reply in transaction
        const reply = await (0, database_1.transaction)(async (client) => {
            const replyId = (0, uuid_1.v4)();
            const result = await client.query(`INSERT INTO comment_replies (
          id, comment_id, project_id, message, created_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`, [replyId, commentId, projectId, message.trim(), userId]);
            return result.rows[0];
        });
        logger_1.default.info('Reply created', { replyId: reply.id });
        return this.formatReply(reply);
    }
    /**
     * Get replies to comment
     */
    async getCommentReplies(commentId, projectId) {
        logger_1.default.info('Fetching comment replies', { commentId });
        const result = await (0, database_1.query)(`SELECT 
        cr.*,
        u.email,
        u.first_name,
        u.last_name
      FROM comment_replies cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.comment_id = $1 AND cr.project_id = $2 AND cr.deleted_at IS NULL
      ORDER BY cr.created_at ASC`, [commentId, projectId]);
        return result.rows.map(r => this.formatReply(r));
    }
    /**
     * Update reply
     */
    async updateReply(replyId, projectId, userId, message) {
        logger_1.default.info('Updating reply', { replyId });
        // Validate input
        if (!message || message.trim().length === 0) {
            throw new error_handler_1.ValidationError('Message is required');
        }
        if (message.length > 2000) {
            throw new error_handler_1.ValidationError('Message cannot exceed 2000 characters');
        }
        // Verify user owns reply
        const replyOwner = await (0, database_1.query)('SELECT created_by FROM comment_replies WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL', [replyId, projectId]);
        if (replyOwner.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Reply ${replyId} not found`);
        }
        if (replyOwner.rows[0].created_by !== userId) {
            throw new error_handler_1.ValidationError('You can only edit your own replies');
        }
        const result = await (0, database_1.query)(`UPDATE comment_replies 
       SET message = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND project_id = $3
       RETURNING *`, [message.trim(), replyId, projectId]);
        logger_1.default.info('Reply updated', { replyId });
        return this.formatReply(result.rows[0]);
    }
    /**
     * Delete reply
     */
    async deleteReply(replyId, projectId, userId) {
        logger_1.default.info('Deleting reply', { replyId });
        // Verify user owns reply
        const replyOwner = await (0, database_1.query)('SELECT created_by FROM comment_replies WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL', [replyId, projectId]);
        if (replyOwner.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Reply ${replyId} not found`);
        }
        if (replyOwner.rows[0].created_by !== userId) {
            throw new error_handler_1.ValidationError('You can only delete your own replies');
        }
        await (0, database_1.query)('UPDATE comment_replies SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [replyId]);
        logger_1.default.info('Reply deleted', { replyId });
    }
    /**
     * Helper: Format comment response
     */
    formatComment(row) {
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
    formatReply(row) {
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
exports.CommentService = CommentService;
exports.default = new CommentService();
//# sourceMappingURL=comment.service.js.map