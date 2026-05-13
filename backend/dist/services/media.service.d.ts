/**
 * BASEERA 360 - Media Service
 * Handle image, thermal, 3D model, and video uploads
 */
interface UploadedFile {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path?: string;
}
interface MediaMetadata {
    width?: number;
    height?: number;
    temperature?: {
        min: number;
        max: number;
        avg: number;
    };
    duration?: number;
    format?: string;
}
export declare class MediaService {
    /**
     * Upload media file to project
     */
    uploadMedia(projectId: string, userId: string, file: UploadedFile, metadata?: MediaMetadata): Promise<any>;
    /**
     * Get all media for a project
     */
    getProjectMedia(projectId: string, userId: string, limit?: number, offset?: number, filters?: any): Promise<{
        media: any[];
        total: number;
    }>;
    /**
     * Get specific media
     */
    getMedia(mediaId: string, projectId: string): Promise<any>;
    /**
     * Update media metadata
     */
    updateMediaMetadata(mediaId: string, projectId: string, metadata: MediaMetadata, userId: string): Promise<any>;
    /**
     * Delete media (soft delete)
     */
    deleteMedia(mediaId: string, projectId: string, userId: string): Promise<void>;
    /**
     * Get media by type (RGB, Thermal, 3D, Video, etc.)
     */
    getMediaByType(projectId: string, mediaType: string, limit?: number): Promise<any[]>;
    /**
     * Create media folder in project storage
     */
    ensureProjectMediaFolder(projectId: string): Promise<string>;
    /**
     * Determine media type from MIME type
     */
    private getMediaType;
    /**
     * Get media statistics
     */
    getMediaStatistics(projectId: string): Promise<any>;
}
declare const _default: MediaService;
export default _default;
//# sourceMappingURL=media.service.d.ts.map