"use strict";
/**
 * BASEERA 360 - Project Service
 * Complete CRUD operations for projects
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const database_1 = require("@/config/database");
const error_handler_1 = require("@/middleware/error-handler");
const logger_1 = __importDefault(require("@/config/logger"));
const uuid_1 = require("uuid");
class ProjectService {
    /**
     * Get all projects for an organization
     */
    async getProjects(organizationId, limit = 50, offset = 0, filters) {
        logger_1.default.info('Fetching projects', { organizationId, limit, offset });
        let whereClause = 'WHERE p.organization_id = $1 AND p.deleted_at IS NULL';
        let params = [organizationId];
        let paramIndex = 2;
        // Apply filters
        if (filters?.status) {
            whereClause += ` AND p.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }
        if (filters?.facadeType) {
            whereClause += ` AND p.facade_type = $${paramIndex}`;
            params.push(filters.facadeType);
            paramIndex++;
        }
        if (filters?.search) {
            whereClause += ` AND (p.project_name ILIKE $${paramIndex} OR p.building_name ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }
        // Get total count
        const countResult = await (0, database_1.query)(`SELECT COUNT(*) as count FROM projects p ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count.toString());
        // Get projects with stats
        params.push(limit, offset);
        const result = await (0, database_1.query)(`SELECT 
        p.id, p.project_name, p.building_name, p.job_number, p.facade_type,
        p.client_name, p.status, p.latitude, p.longitude, p.address, p.city,
        p.country, p.created_by, p.created_at, p.updated_at,
        COUNT(DISTINCT m.id)::int as media_count,
        COUNT(DISTINCT a.id)::int as annotation_count
      FROM projects p
      LEFT JOIN media_assets m ON p.id = m.project_id AND m.deleted_at IS NULL
      LEFT JOIN annotations a ON p.id = a.project_id AND a.deleted_at IS NULL
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
        const projects = result.rows.map(p => ({
            id: p.id,
            projectName: p.project_name,
            buildingName: p.building_name,
            jobNumber: p.job_number,
            facadeType: p.facade_type,
            clientName: p.client_name,
            status: p.status,
            location: {
                latitude: p.latitude,
                longitude: p.longitude,
                address: p.address,
                city: p.city,
                country: p.country,
            },
            createdBy: p.created_by,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            mediaCount: p.media_count,
            annotationCount: p.annotation_count,
        }));
        return { projects, total };
    }
    /**
     * Get single project by ID
     */
    async getProject(projectId, userId) {
        logger_1.default.info('Fetching project', { projectId, userId });
        // Check if user has access to this project
        await this.checkProjectAccess(projectId, userId);
        const result = await (0, database_1.query)(`SELECT 
        p.id, p.organization_id, p.project_name, p.building_name, p.job_number,
        p.facade_type, p.client_name, p.status, p.latitude, p.longitude, 
        p.address, p.city, p.country, p.created_by, p.created_at, p.updated_at,
        COUNT(DISTINCT m.id)::int as media_count,
        COUNT(DISTINCT a.id)::int as annotation_count,
        COUNT(DISTINCT z.id)::int as zone_count
      FROM projects p
      LEFT JOIN media_assets m ON p.id = m.project_id AND m.deleted_at IS NULL
      LEFT JOIN annotations a ON p.id = a.project_id AND a.deleted_at IS NULL
      LEFT JOIN building_zones z ON p.id = z.project_id AND z.deleted_at IS NULL
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id`, [projectId]);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Project ${projectId} not found`);
        }
        const p = result.rows[0];
        return {
            id: p.id,
            organizationId: p.organization_id,
            projectName: p.project_name,
            buildingName: p.building_name,
            jobNumber: p.job_number,
            facadeType: p.facade_type,
            clientName: p.client_name,
            status: p.status,
            location: {
                latitude: p.latitude,
                longitude: p.longitude,
                address: p.address,
                city: p.city,
                country: p.country,
            },
            createdBy: p.created_by,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            statistics: {
                mediaCount: p.media_count,
                annotationCount: p.annotation_count,
                zoneCount: p.zone_count,
            },
        };
    }
    /**
     * Create new project
     */
    async createProject(organizationId, userId, data) {
        logger_1.default.info('Creating project', { organizationId, projectName: data.projectName });
        // Validate input
        if (!data.projectName || !data.buildingName || !data.jobNumber) {
            throw new error_handler_1.ValidationError('projectName, buildingName, and jobNumber are required');
        }
        // Check for duplicate job number in organization
        const existingProject = await (0, database_1.query)('SELECT id FROM projects WHERE organization_id = $1 AND job_number = $2 AND deleted_at IS NULL', [organizationId, data.jobNumber]);
        if (existingProject.rows.length > 0) {
            throw new error_handler_1.ConflictError(`Project with job number ${data.jobNumber} already exists`);
        }
        // Create project in transaction
        const project = await (0, database_1.transaction)(async (client) => {
            const projectId = (0, uuid_1.v4)();
            const result = await client.query(`INSERT INTO projects (
          id, organization_id, project_name, building_name, job_number,
          facade_type, client_name, status, latitude, longitude,
          address, city, country, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`, [
                projectId,
                organizationId,
                data.projectName,
                data.buildingName,
                data.jobNumber,
                data.facadeType || 'Other',
                data.clientName || null,
                'ACTIVE',
                data.latitude || null,
                data.longitude || null,
                data.address || null,
                data.city || null,
                data.country || null,
                userId,
            ]);
            // Assign creator to project as ENGINEER
            await client.query(`INSERT INTO user_project_roles (user_id, project_id, role)
         VALUES ($1, $2, $3)`, [userId, projectId, 'ENGINEER']);
            return result.rows[0];
        });
        logger_1.default.info('Project created successfully', { projectId: project.id });
        return {
            id: project.id,
            projectName: project.project_name,
            buildingName: project.building_name,
            jobNumber: project.job_number,
            facadeType: project.facade_type,
            clientName: project.client_name,
            status: project.status,
            location: {
                latitude: project.latitude,
                longitude: project.longitude,
                address: project.address,
                city: project.city,
                country: project.country,
            },
            createdBy: project.created_by,
            createdAt: project.created_at,
        };
    }
    /**
     * Update project
     */
    async updateProject(projectId, userId, data) {
        logger_1.default.info('Updating project', { projectId, userId });
        // Check access
        await this.checkProjectAccess(projectId, userId, 'ENGINEER');
        // Build update query dynamically
        const allowedFields = [
            'project_name',
            'building_name',
            'facade_type',
            'client_name',
            'status',
            'latitude',
            'longitude',
            'address',
            'city',
            'country',
        ];
        const updates = [];
        const values = [projectId];
        let paramIndex = 2;
        for (const [key, value] of Object.entries(data)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey) && value !== undefined) {
                updates.push(`${dbKey} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }
        if (updates.length === 0) {
            throw new error_handler_1.ValidationError('No valid fields to update');
        }
        values.push(userId);
        const result = await (0, database_1.query)(`UPDATE projects 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`, values);
        if (result.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Project ${projectId} not found`);
        }
        const p = result.rows[0];
        logger_1.default.info('Project updated successfully', { projectId });
        return {
            id: p.id,
            projectName: p.project_name,
            buildingName: p.building_name,
            jobNumber: p.job_number,
            facadeType: p.facade_type,
            clientName: p.client_name,
            status: p.status,
            location: {
                latitude: p.latitude,
                longitude: p.longitude,
                address: p.address,
                city: p.city,
                country: p.country,
            },
            updatedAt: p.updated_at,
        };
    }
    /**
     * Delete project (soft delete)
     */
    async deleteProject(projectId, userId) {
        logger_1.default.info('Deleting project', { projectId, userId });
        // Check access - only ADMIN or creator can delete
        const projectResult = await (0, database_1.query)('SELECT created_by, organization_id FROM projects WHERE id = $1 AND deleted_at IS NULL', [projectId]);
        if (projectResult.rows.length === 0) {
            throw new error_handler_1.NotFoundError(`Project ${projectId} not found`);
        }
        // Check user role
        const userRole = await this.getUserProjectRole(userId, projectResult.rows[0].organization_id);
        if (userRole !== 'ADMIN' && projectResult.rows[0].created_by !== userId) {
            throw new error_handler_1.AuthorizationError('Only admins or project creator can delete projects');
        }
        await (0, database_1.query)('UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [projectId]);
        logger_1.default.info('Project deleted successfully', { projectId });
    }
    /**
     * Check if user has access to project
     */
    async checkProjectAccess(projectId, userId, minRole) {
        const result = await (0, database_1.query)(`SELECT upr.role, p.organization_id
       FROM user_project_roles upr
       JOIN projects p ON p.id = upr.project_id
       WHERE p.id = $1 AND upr.user_id = $2`, [projectId, userId]);
        if (result.rows.length === 0) {
            throw new error_handler_1.AuthorizationError('No access to this project');
        }
        if (minRole) {
            const roles = ['VIEWER', 'ANNOTATOR', 'ENGINEER', 'ADMIN'];
            const userRoleIndex = roles.indexOf(result.rows[0].role);
            const minRoleIndex = roles.indexOf(minRole);
            if (userRoleIndex < minRoleIndex) {
                throw new error_handler_1.AuthorizationError(`Requires ${minRole} role or higher`);
            }
        }
    }
    /**
     * Get user's role in organization
     */
    async getUserProjectRole(userId, organizationId) {
        const result = await (0, database_1.query)(`SELECT role FROM user_organization_roles
       WHERE user_id = $1 AND organization_id = $2`, [userId, organizationId]);
        return result.rows.length > 0 ? result.rows[0].role : 'VIEWER';
    }
    /**
     * Assign user to project
     */
    async assignUserToProject(projectId, userId, targetUserId, role, adminUserId) {
        logger_1.default.info('Assigning user to project', { projectId, targetUserId, role });
        // Check admin has access
        await this.checkProjectAccess(projectId, adminUserId, 'ENGINEER');
        // Validate role
        const validRoles = ['VIEWER', 'ANNOTATOR', 'ENGINEER', 'ADMIN'];
        if (!validRoles.includes(role)) {
            throw new error_handler_1.ValidationError(`Invalid role: ${role}`);
        }
        // Upsert role assignment
        await (0, database_1.query)(`INSERT INTO user_project_roles (user_id, project_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, project_id) DO UPDATE SET role = $3`, [targetUserId, projectId, role]);
        logger_1.default.info('User assigned to project', { projectId, targetUserId, role });
    }
    /**
     * Remove user from project
     */
    async removeUserFromProject(projectId, targetUserId, adminUserId) {
        logger_1.default.info('Removing user from project', { projectId, targetUserId });
        // Check admin has access
        await this.checkProjectAccess(projectId, adminUserId, 'ENGINEER');
        await (0, database_1.query)('DELETE FROM user_project_roles WHERE project_id = $1 AND user_id = $2', [projectId, targetUserId]);
        logger_1.default.info('User removed from project', { projectId, targetUserId });
    }
    /**
     * Get project team members
     */
    async getProjectTeam(projectId, userId) {
        logger_1.default.info('Fetching project team', { projectId });
        // Check access
        await this.checkProjectAccess(projectId, userId);
        const result = await (0, database_1.query)(`SELECT 
        u.id, u.email, u.first_name, u.last_name, upr.role
       FROM user_project_roles upr
       JOIN users u ON u.id = upr.user_id
       WHERE upr.project_id = $1 AND u.deleted_at IS NULL
       ORDER BY u.first_name, u.last_name`, [projectId]);
        return result.rows.map(r => ({
            id: r.id,
            email: r.email,
            firstName: r.first_name,
            lastName: r.last_name,
            role: r.role,
        }));
    }
}
exports.ProjectService = ProjectService;
exports.default = new ProjectService();
//# sourceMappingURL=project.service.js.map