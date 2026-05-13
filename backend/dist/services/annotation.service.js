"use strict";
/**
 * BASEERA 360 - Annotation Service
 * Handle defect annotations, marking, and status management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnotationService = exports.DefectCategory = exports.AnnotationStatus = exports.AnnotationSeverity = void 0;
const database_1 = require("@/config/database");
const error_handler_1 = require("@/middleware/error-handler");
const logger_1 = __importDefault(require("@/config/logger"));
const uuid_1 = require("uuid");
var AnnotationSeverity;
(function (AnnotationSeverity) {
    AnnotationSeverity["CRITICAL"] = "CRITICAL";
    AnnotationSeverity["HIGH"] = "HIGH";
    AnnotationSeverity["MEDIUM"] = "MEDIUM";
    AnnotationSeverity["LOW"] = "LOW";
    AnnotationSeverity["INFO"] = "INFO";
})(AnnotationSeverity || (exports.AnnotationSeverity = AnnotationSeverity = {}));
var AnnotationStatus;
(function (AnnotationStatus) {
    AnnotationStatus["OPEN"] = "OPEN";
    AnnotationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AnnotationStatus["RESOLVED"] = "RESOLVED";
    AnnotationStatus["CLOSED"] = "CLOSED";
    AnnotationStatus["REOPEN"] = "REOPEN";
})(AnnotationStatus || (exports.AnnotationStatus = AnnotationStatus = {}));
var DefectCategory;
(function (DefectCategory) {
    DefectCategory["CRACK"] = "CRACK";
    DefectCategory["SPALLING"] = "SPALLING";
    DefectCategory["EFFLORESCENCE"] = "EFFLORESCENCE";
    DefectCategory["STAINING"] = "STAINING";
    DefectCategory["JOINT_FAILURE"] = "JOINT_FAILURE";
    DefectCategory["SEALANT_FAILURE"] = "SEALANT_FAILURE";
    DefectCategory["CORROSION"] = "CORROSION";
    DefectCategory["WATER_DAMAGE"] = "WATER_DAMAGE";
    DefectCategory["GLASS_DAMAGE"] = "GLASS_DAMAGE";
    DefectCategory["METAL_DAMAGE"] = "METAL_DAMAGE";
    DefectCategory["THERMAL_ISSUE"] = "THERMAL_ISSUE";
    DefectCategory["OTHER"] = "OTHER";
})(DefectCategory || (exports.DefectCategory = DefectCategory = {}));
class AnnotationService {
    /**
     * Create annotation on media
     */
    async createAnnotation(projectId, userId, data) {
        logger_1.default.info('Creating annotation', { projectId, mediaId: data.mediaId });
        // Validate input
        if (!data.mediaId || !data.category || !data.severity || !data.description) {
            throw new error_handler_1.ValidationError('mediaId, category, severity, and description are required');
        }
        // Validate enum values
        if (!Object.values(DefectCategory).includes(data.category)) {
            throw new error_handler_1.ValidationError(`Invalid category: ${data.category}`);
        }
        if (!Object.values(AnnotationSeverity).includes(data.severity)) {
            throw new error_handler_1.ValidationError(`Invalid severity: ${data.severity}`);
        }
        // Verify media exists in project
        const mediaExists = await (0, database_1.query)('SELECT id FROM media_assets WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL', [data.mediaId, projectId]);
        if (mediaExists.rows.length === 0) {
            throw new error_handler_1.NotFoundError('Media not found in this project');
        }
        // Create annotation in transaction
        const annotation = await (0, database_1.transaction)(async (client) => {
            const annotationId = (0, uuid_1.v4)();
            const result = await client.query(`INSERT INTO annotations (
          id, project_id, media_id, category, severity, status,
          description, coordinates, created_by, assigned_to, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`, [
                annotationId,
                projectId,
                data.mediaId,
                data.category,
                data.severity,
                AnnotationStatus.OPEN,
                data.description,
                data.coordinates ? JSON.stringify(data.coordinates) : null,
                userId,
                data.assignedTo || null,
                data.dueDate || null,
            ]);
            return result.rows[0];
        });
        logger_1.default.info('Annotation created', { annotationId: annotation.id });
        return this.formatAnnotation(annotation);
    }
    /**
     * Get all annotations for project
     */
    async getProjectAnnotations(projectId, userId, filters) {
        logger_1.default.info('Fetching project annotations', { projectId });
        // Build where clause
        let whereClause = 'WHERE a.project_id = $1 AND a.deleted_at IS NULL';
        let params = [projectId];
        let paramIndex = 2;
        if (filters?.status) {
            whereClause += ` AND a.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }
        if (filters?.severity) {
            whereClause += ` AND a.severity = $${paramIndex}`;
            params.push(filters.severity);
            paramIndex++;
        }
        if (filters?.category) {
            whereClause += ` AND a.category = $${paramIndex}`;
            params.push(filters.category);
            paramIndex++;
        }
        if (filters?.mediaId) {
            whereClause += ` AND a.media_id = $${paramIndex}`;
            params.push(filters.mediaId);
            paramIndex++;
        }
        // Get total count
        const countResult = await (0, database_1.query)(`SELECT COUNT(*) as count FROM annotations a ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count.toString());
        // Get annotations with comment count
        params.push(50); // limit
        params.push(0); // offset
        const result = await (0, database_1.query)(`SELECT 
        a.*,
        u.email as created_by_email,
        au.email as assigned_to_email,
        COUNT(DISTINCT c.id)::int as comment_count
      FROM annotations a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN users au ON a.assigned_to = au.id
      LEFT JOIN comments c ON a.id = c.annotation_id AND c.deleted_at IS NULL
      ${whereClause}
      GROUP BY a.id, u.email, au.email
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
        const annotations = result.rows.map(a => this.formatAnnotation(a));
        return { annotations, total };
    }
    /**
     * Get single annotation
     */
    async getAnnotation(annotationId, projectId) {
        logger_1.default.info('Fetching annotation', { annotationId, projectId });
        const result = await (0, database_1.query)(`SELECT 
        a.*,
        u.email as created_by_email,
        au.email as assigned_to_email,
        COUNT(DISTINCT c.id)::int as comment_count
      FROM annotations a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN users au ON a.assigned_to = au.id
      LEFT JOIN comments c ON a.id = c.annotation_id AND c.deleted_at IS NULL
      WHERE a.id = $1 AND a.project_id = $2 AND a.deleted_at IS NULL
      GROUP BY a.id, u.email, au.email`, [annotationId, projectId]);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Annotation ${annotationId} not found`);
        }
        return this.formatAnnotation(result.rows[0]);
    }
    /**
     * Update annotation
     */
    async updateAnnotation(annotationId, projectId, userId, data) {
        logger_1.default.info('Updating annotation', { annotationId, projectId });
        // Validate enum values if provided
        if (data.status && !Object.values(AnnotationStatus).includes(data.status)) {
            throw new error_handler_1.ValidationError(`Invalid status: ${data.status}`);
        }
        if (data.severity && !Object.values(AnnotationSeverity).includes(data.severity)) {
            throw new error_handler_1.ValidationError(`Invalid severity: ${data.severity}`);
        }
        if (data.category && !Object.values(DefectCategory).includes(data.category)) {
            throw new error_handler_1.ValidationError(`Invalid category: ${data.category}`);
        }
        // Build update query
        const updates = [];
        const values = [annotationId, projectId];
        let paramIndex = 3;
        const allowedFields = [
            'status',
            'severity',
            'category',
            'description',
            'coordinates',
            'assigned_to',
            'due_date',
            'resolution_notes',
        ];
        for (const [key, value] of Object.entries(data)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey) && value !== undefined) {
                if (dbKey === 'coordinates') {
                    updates.push(`${dbKey} = $${paramIndex}::jsonb`);
                }
                else {
                    updates.push(`${dbKey} = $${paramIndex}`);
                }
                values.push(dbKey === 'coordinates' ? JSON.stringify(value) : value);
                paramIndex++;
            }
        }
        if (updates.length === 0) {
            throw new error_handler_1.ValidationError('No valid fields to update');
        }
        values.push(userId);
        const result = await (0, database_1.query)(`UPDATE annotations 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
       RETURNING *`, values);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Annotation ${annotationId} not found`);
        }
        logger_1.default.info('Annotation updated', { annotationId });
        return this.formatAnnotation(result.rows[0]);
    }
    /**
     * Update annotation status
     */
    async updateAnnotationStatus(annotationId, projectId, userId, status, resolutionNotes) {
        logger_1.default.info('Updating annotation status', { annotationId, status });
        if (!Object.values(AnnotationStatus).includes(status)) {
            throw new error_handler_1.ValidationError(`Invalid status: ${status}`);
        }
        const result = await (0, database_1.query)(`UPDATE annotations 
       SET status = $1, resolution_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND project_id = $4 AND deleted_at IS NULL
       RETURNING *`, [status, resolutionNotes || null, annotationId, projectId]);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Annotation ${annotationId} not found`);
        }
        logger_1.default.info('Annotation status updated', { annotationId, status });
        return this.formatAnnotation(result.rows[0]);
    }
    /**
     * Delete annotation (soft delete)
     */
    async deleteAnnotation(annotationId, projectId, userId) {
        logger_1.default.info('Deleting annotation', { annotationId, projectId });
        const result = await (0, database_1.query)('UPDATE annotations SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND project_id = $2 RETURNING id', [annotationId, projectId]);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Annotation ${annotationId} not found`);
        }
        logger_1.default.info('Annotation deleted', { annotationId });
    }
    /**
     * Get annotations by severity
     */
    async getAnnotationsBySeverity(projectId, severity) {
        logger_1.default.info('Fetching annotations by severity', { projectId, severity });
        if (!Object.values(AnnotationSeverity).includes(severity)) {
            throw new error_handler_1.ValidationError(`Invalid severity: ${severity}`);
        }
        const result = await (0, database_1.query)(`SELECT a.*
       FROM annotations a
       WHERE a.project_id = $1 AND a.severity = $2 AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`, [projectId, severity]);
        return result.rows.map(a => this.formatAnnotation(a));
    }
    /**
     * Get annotations statistics
     */
    async getAnnotationStatistics(projectId) {
        logger_1.default.info('Getting annotation statistics', { projectId });
        const result = await (0, database_1.query)(`SELECT 
        status,
        severity,
        COUNT(*) as count
       FROM annotations
       WHERE project_id = $1 AND deleted_at IS NULL
       GROUP BY status, severity
       ORDER BY status, severity`, [projectId]);
        const stats = {
            total: 0,
            byStatus: {},
            bySeverity: {},
        };
        result.rows.forEach(row => {
            stats.total += row.count;
            if (!stats.byStatus[row.status]) {
                stats.byStatus[row.status] = 0;
            }
            stats.byStatus[row.status] += row.count;
            if (!stats.bySeverity[row.severity]) {
                stats.bySeverity[row.severity] = 0;
            }
            stats.bySeverity[row.severity] += row.count;
        });
        return stats;
    }
    /**
     * Assign annotation to user
     */
    async assignAnnotation(annotationId, projectId, assignToUserId, userId) {
        logger_1.default.info('Assigning annotation', { annotationId, assignToUserId });
        const result = await (0, database_1.query)(`UPDATE annotations 
       SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND project_id = $3 AND deleted_at IS NULL
       RETURNING *`, [assignToUserId, annotationId, projectId]);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Annotation ${annotationId} not found`);
        }
        logger_1.default.info('Annotation assigned', { annotationId, assignToUserId });
        return this.formatAnnotation(result.rows[0]);
    }
    /**
     * Get annotation history
     */
    async getAnnotationHistory(annotationId, projectId) {
        logger_1.default.info('Fetching annotation history', { annotationId });
        const result = await (0, database_1.query)(`SELECT 
        ah.*,
        u.email as changed_by_email
       FROM annotation_history ah
       LEFT JOIN users u ON ah.changed_by = u.id
       WHERE ah.annotation_id = $1
       ORDER BY ah.changed_at DESC`, [annotationId]);
        return result.rows.map(h => ({
            id: h.id,
            annotationId: h.annotation_id,
            field: h.field,
            oldValue: h.old_value,
            newValue: h.new_value,
            changedBy: h.changed_by_email,
            changedAt: h.changed_at,
        }));
    }
    /**
     * Helper: Format annotation response
     */
    formatAnnotation(row) {
        return {
            id: row.id,
            projectId: row.project_id,
            mediaId: row.media_id,
            category: row.category,
            severity: row.severity,
            status: row.status,
            description: row.description,
            coordinates: row.coordinates,
            createdBy: row.created_by,
            createdByEmail: row.created_by_email,
            assignedTo: row.assigned_to,
            assignedToEmail: row.assigned_to_email,
            dueDate: row.due_date,
            resolutionNotes: row.resolution_notes,
            commentCount: row.comment_count || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.AnnotationService = AnnotationService;
exports.default = new AnnotationService();
//# sourceMappingURL=annotation.service.js.map