/**
 * BASEERA 360 - Media Service
 * Handle image, thermal, 3D model, and video uploads
 */

import { query, transaction } from '@/config/database';
import { NotFoundError, ValidationError, AuthorizationError } from '@/middleware/error-handler';
import logger from '@/config/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import config from '@/config';

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

export class MediaService {
  /**
   * Upload media file to project
   */
  async uploadMedia(
    projectId: string,
    userId: string,
    file: UploadedFile,
    metadata?: MediaMetadata
  ): Promise<any> {
    logger.info('Uploading media', { projectId, fileName: file.originalname, size: file.size });

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      throw new ValidationError('File size exceeds 500MB limit');
    }

    // Determine media type from MIME type
    const mediaType = this.getMediaType(file.mimetype);
    if (!mediaType) {
      throw new ValidationError(`Unsupported file type: ${file.mimetype}`);
    }

    // Check project access
    const projectExists = await query<{ id: string }>(
      'SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL',
      [projectId]
    );

    if (projectExists.rows.length === 0) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    // Create CDN URL
    const fileName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    const cdnUrl = `${config.cdn.url}/media/${projectId}/${fileName}`;

    // Save media record in transaction
    const media = await transaction(async (client) => {
      const result = await client.query<any>(
        `INSERT INTO media_assets (
          id, project_id, file_name, original_name, media_type, mime_type,
          file_size, cdn_url, uploaded_by, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          uuidv4(),
          projectId,
          fileName,
          file.originalname,
          mediaType,
          file.mimetype,
          file.size,
          cdnUrl,
          userId,
          metadata ? JSON.stringify(metadata) : null,
        ]
      );

      return result.rows[0];
    });

    logger.info('Media uploaded successfully', {
      mediaId: media.id,
      fileName: media.file_name,
    });

    return {
      id: media.id,
      projectId: media.project_id,
      fileName: media.original_name,
      mediaType: media.media_type,
      fileSize: media.file_size,
      cdnUrl: media.cdn_url,
      uploadedBy: media.uploaded_by,
      uploadedAt: media.created_at,
      metadata: media.metadata,
    };
  }

  /**
   * Get all media for a project
   */
  async getProjectMedia(
    projectId: string,
    userId: string,
    limit: number = 100,
    offset: number = 0,
    filters?: any
  ): Promise<{ media: any[]; total: number }> {
    logger.info('Fetching project media', { projectId, limit, offset });

    // Check project exists
    const projectExists = await query<{ id: string }>(
      'SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL',
      [projectId]
    );

    if (projectExists.rows.length === 0) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    // Build where clause
    let whereClause = 'WHERE project_id = $1 AND deleted_at IS NULL';
    let params: any[] = [projectId];
    let paramIndex = 2;

    if (filters?.mediaType) {
      whereClause += ` AND media_type = $${paramIndex}`;
      params.push(filters.mediaType);
      paramIndex++;
    }

    // Get total
    const countResult = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM media_assets ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count.toString());

    // Get media
    params.push(limit, offset);
    const result = await query<any>(
      `SELECT * FROM media_assets
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const media = result.rows.map(m => ({
      id: m.id,
      projectId: m.project_id,
      fileName: m.original_name,
      mediaType: m.media_type,
      fileSize: m.file_size,
      cdnUrl: m.cdn_url,
      uploadedBy: m.uploaded_by,
      uploadedAt: m.created_at,
      metadata: m.metadata,
      annotationCount: m.annotation_count || 0,
    }));

    return { media, total };
  }

  /**
   * Get specific media
   */
  async getMedia(mediaId: string, projectId: string): Promise<any> {
    logger.info('Fetching media', { mediaId, projectId });

    const result = await query<any>(
      `SELECT * FROM media_assets 
       WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [mediaId, projectId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Media ${mediaId} not found`);
    }

    const m = result.rows[0];

    return {
      id: m.id,
      projectId: m.project_id,
      fileName: m.original_name,
      mediaType: m.media_type,
      fileSize: m.file_size,
      cdnUrl: m.cdn_url,
      uploadedBy: m.uploaded_by,
      uploadedAt: m.created_at,
      metadata: m.metadata,
    };
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(
    mediaId: string,
    projectId: string,
    metadata: MediaMetadata,
    userId: string
  ): Promise<any> {
    logger.info('Updating media metadata', { mediaId });

    const result = await query<any>(
      `UPDATE media_assets 
       SET metadata = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND project_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [JSON.stringify(metadata), mediaId, projectId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Media ${mediaId} not found`);
    }

    const m = result.rows[0];

    logger.info('Media metadata updated', { mediaId });

    return {
      id: m.id,
      projectId: m.project_id,
      fileName: m.original_name,
      mediaType: m.media_type,
      metadata: m.metadata,
      updatedAt: m.updated_at,
    };
  }

  /**
   * Delete media (soft delete)
   */
  async deleteMedia(mediaId: string, projectId: string, userId: string): Promise<void> {
    logger.info('Deleting media', { mediaId, projectId, userId });

    const result = await query(
      `UPDATE media_assets 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND project_id = $2
       RETURNING id`,
      [mediaId, projectId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Media ${mediaId} not found`);
    }

    logger.info('Media deleted', { mediaId });
  }

  /**
   * Get media by type (RGB, Thermal, 3D, Video, etc.)
   */
  async getMediaByType(
    projectId: string,
    mediaType: string,
    limit: number = 50
  ): Promise<any[]> {
    logger.info('Fetching media by type', { projectId, mediaType });

    const validTypes = ['RGB', 'THERMAL', 'MODEL_3D', 'VIDEO_360', 'VIDEO', 'CAD', 'PANORAMA'];
    if (!validTypes.includes(mediaType)) {
      throw new ValidationError(`Invalid media type: ${mediaType}`);
    }

    const result = await query<any>(
      `SELECT * FROM media_assets
       WHERE project_id = $1 AND media_type = $2 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $3`,
      [projectId, mediaType, limit]
    );

    return result.rows.map(m => ({
      id: m.id,
      projectId: m.project_id,
      fileName: m.original_name,
      mediaType: m.media_type,
      fileSize: m.file_size,
      cdnUrl: m.cdn_url,
      uploadedBy: m.uploaded_by,
      uploadedAt: m.created_at,
      metadata: m.metadata,
    }));
  }

  /**
   * Create media folder in project storage
   */
  async ensureProjectMediaFolder(projectId: string): Promise<string> {
    const folderPath = `${config.storage.localPath}/${projectId}`;

    try {
      await fs.mkdir(folderPath, { recursive: true });
      logger.info('Project media folder created/verified', { projectId, folderPath });
    } catch (error) {
      logger.error('Failed to create media folder', error);
      throw new Error(`Failed to create project media folder: ${error}`);
    }

    return folderPath;
  }

  /**
   * Determine media type from MIME type
   */
  private getMediaType(mimeType: string): string | null {
    // Image types
    if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) {
      return 'RGB'; // Could be thermal if R-JPEG
    }
    if (mimeType.includes('image/png')) {
      return 'RGB';
    }

    // Video types
    if (mimeType.includes('video/mp4')) {
      return 'VIDEO';
    }
    if (mimeType.includes('video/quicktime')) {
      return 'VIDEO';
    }

    // 3D model types
    if (mimeType.includes('model/obj') || mimeType.includes('application/obj')) {
      return 'MODEL_3D';
    }
    if (mimeType.includes('model/fbx') || mimeType.includes('application/octet-stream')) {
      return 'MODEL_3D';
    }
    if (mimeType.includes('model/gltf')) {
      return 'MODEL_3D';
    }

    // CAD types
    if (mimeType.includes('application/dwg') || mimeType.includes('image/vnd.dwg')) {
      return 'CAD';
    }
    if (mimeType.includes('application/dxf')) {
      return 'CAD';
    }

    return null;
  }

  /**
   * Get media statistics
   */
  async getMediaStatistics(projectId: string): Promise<any> {
    logger.info('Getting media statistics', { projectId });

    const result = await query<any>(
      `SELECT 
        media_type,
        COUNT(*) as count,
        SUM(file_size) as total_size,
        MAX(created_at) as latest_upload
       FROM media_assets
       WHERE project_id = $1 AND deleted_at IS NULL
       GROUP BY media_type
       ORDER BY count DESC`,
      [projectId]
    );

    const stats: any = {
      total: 0,
      totalSize: 0,
      byType: {},
    };

    result.rows.forEach(row => {
      stats.total += row.count;
      stats.totalSize += parseInt(row.total_size || '0');
      stats.byType[row.media_type] = {
        count: row.count,
        size: row.total_size,
        latestUpload: row.latest_upload,
      };
    });

    return stats;
  }
}

export default new MediaService();
