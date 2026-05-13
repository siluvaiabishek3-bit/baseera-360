/**
 * BASEERA 360 - Comment Service
 * Handle comments and discussions on annotations
 */
interface CommentData {
    annotationId: string;
    message: string;
    attachmentUrl?: string;
}
interface CommentUpdate {
    message?: string;
}
export declare class CommentService {
    /**
     * Create comment on annotation
     */
    createComment(projectId: string, userId: string, data: CommentData): Promise<any>;
    /**
     * Get comments on annotation
     */
    getAnnotationComments(projectId: string, annotationId: string): Promise<any[]>;
    /**
     * Get single comment
     */
    getComment(commentId: string, projectId: string): Promise<any>;
    /**
     * Update comment
     */
    updateComment(commentId: string, projectId: string, userId: string, data: CommentUpdate): Promise<any>;
    /**
     * Delete comment (soft delete)
     */
    deleteComment(commentId: string, projectId: string, userId: string): Promise<void>;
    /**
     * Create reply to comment
     */
    replyToComment(projectId: string, userId: string, commentId: string, message: string): Promise<any>;
    /**
     * Get replies to comment
     */
    getCommentReplies(commentId: string, projectId: string): Promise<any[]>;
    /**
     * Update reply
     */
    updateReply(replyId: string, projectId: string, userId: string, message: string): Promise<any>;
    /**
     * Delete reply
     */
    deleteReply(replyId: string, projectId: string, userId: string): Promise<void>;
    /**
     * Helper: Format comment response
     */
    private formatComment;
    /**
     * Helper: Format reply response
     */
    private formatReply;
}
declare const _default: CommentService;
export default _default;
//# sourceMappingURL=comment.service.d.ts.map