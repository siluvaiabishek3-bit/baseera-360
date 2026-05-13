/**
 * BASEERA 360 - Project Service
 * Complete CRUD operations for projects
 */

import { query, transaction } from '@/config/database';
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from '@/middleware/error-handler';
import logger from '@/config/logger';
import { v4 as uuidv4 } from 'uuid';

interface ProjectData {
  projectName: string;
  buildingName: string;
  jobNumber: string;
  facadeType: string;
  clientName?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
}

interface ProjectUpdate extends Partial<ProjectData> {
  status?: string;
}

export class ProjectService {
  /**
   * Get all projects for an organization
   */
  async getProjects(
    organizationId: string,
    limit: number = 50,
    offset: number = 0,
    filters?: any
  ): Promise<{ projects: any[]; total: number }> {
    logger.info('Fetching projects', { organizationId, limit, offset });

    let whereClause = 'WHERE p.organization_id = $1 AND p.deleted_at IS NULL';
    let params: any[] = [organizationId];
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
    const countResult = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM projects p ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count.toString());

    // Get projects with stats
    params.push(limit, offset);
    const result = await query<any>(
      `SELECT 
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
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

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
  async getProject(projectId: string, userId: string): Promise<any> {
    logger.info('Fetching project', { projectId, userId });

    // Check if user has access to this project
    await this.checkProjectAccess(projectId, userId);

    const result = await query<any>(
      `SELECT 
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
      GROUP BY p.id`,
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Project ${projectId} not found`);
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
  async createProject(organizationId: string, userId: string, data: ProjectData): Promise<any> {
    logger.info('Creating project', { organizationId, projectName: data.projectName });

    // Validate input
    if (!data.projectName || !data.buildingName || !data.jobNumber) {
      throw new ValidationError('projectName, buildingName, and jobNumber are required');
    }

    // Check for duplicate job number in organization
    const existingProject = await query<{ id: string }>(
      'SELECT id FROM projects WHERE organization_id = $1 AND job_number = $2 AND deleted_at IS NULL',
      [organizationId, data.jobNumber]
    );

    if (existingProject.rows.length > 0) {
      throw new ConflictError(`Project with job number ${data.jobNumber} already exists`);
    }

    // Create project in transaction
    const project = await transaction(async (client) => {
      const projectId = uuidv4();

      const result = await client.query<any>(
        `INSERT INTO projects (
          id, organization_id, project_name, building_name, job_number,
          facade_type, client_name, status, latitude, longitude,
          address, city, country, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
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
        ]
      );

      // Assign creator to project as ENGINEER
      await client.query(
        `INSERT INTO user_project_roles (user_id, project_id, role)
         VALUES ($1, $2, $3)`,
        [userId, projectId, 'ENGINEER']
      );

      return result.rows[0];
    });

    logger.info('Project created successfully', { projectId: project.id });

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
  async updateProject(
    projectId: string,
    userId: string,
    data: ProjectUpdate
  ): Promise<any> {
    logger.info('Updating project', { projectId, userId });

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

    const updates: string[] = [];
    const values: any[] = [projectId];
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
      throw new ValidationError('No valid fields to update');
    }

    values.push(userId);

    const result = await query<any>(
      `UPDATE projects 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    const p = result.rows[0];

    logger.info('Project updated successfully', { projectId });

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
  async deleteProject(projectId: string, userId: string): Promise<void> {
    logger.info('Deleting project', { projectId, userId });

    // Check access - only ADMIN or creator can delete
    const projectResult = await query<{ created_by: string; organization_id: string }>(
      'SELECT created_by, organization_id FROM projects WHERE id = $1 AND deleted_at IS NULL',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    // Check user role
    const userRole = await this.getUserProjectRole(userId, projectResult.rows[0].organization_id);
    if (userRole !== 'ADMIN' && projectResult.rows[0].created_by !== userId) {
      throw new AuthorizationError('Only admins or project creator can delete projects');
    }

    await query(
      'UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [projectId]
    );

    logger.info('Project deleted successfully', { projectId });
  }

  /**
   * Check if user has access to project
   */
  private async checkProjectAccess(
    projectId: string,
    userId: string,
    minRole?: string
  ): Promise<void> {
    const result = await query<{ role: string; organization_id: string }>(
      `SELECT upr.role, p.organization_id
       FROM user_project_roles upr
       JOIN projects p ON p.id = upr.project_id
       WHERE p.id = $1 AND upr.user_id = $2`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      throw new AuthorizationError('No access to this project');
    }

    if (minRole) {
      const roles = ['VIEWER', 'ANNOTATOR', 'ENGINEER', 'ADMIN'];
      const userRoleIndex = roles.indexOf(result.rows[0].role);
      const minRoleIndex = roles.indexOf(minRole);

      if (userRoleIndex < minRoleIndex) {
        throw new AuthorizationError(`Requires ${minRole} role or higher`);
      }
    }
  }

  /**
   * Get user's role in organization
   */
  private async getUserProjectRole(userId: string, organizationId: string): Promise<string> {
    const result = await query<{ role: string }>(
      `SELECT role FROM user_organization_roles
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );

    return result.rows.length > 0 ? result.rows[0].role : 'VIEWER';
  }

  /**
   * Assign user to project
   */
  async assignUserToProject(
    projectId: string,
    userId: string,
    targetUserId: string,
    role: string,
    adminUserId: string
  ): Promise<void> {
    logger.info('Assigning user to project', { projectId, targetUserId, role });

    // Check admin has access
    await this.checkProjectAccess(projectId, adminUserId, 'ENGINEER');

    // Validate role
    const validRoles = ['VIEWER', 'ANNOTATOR', 'ENGINEER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Invalid role: ${role}`);
    }

    // Upsert role assignment
    await query(
      `INSERT INTO user_project_roles (user_id, project_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, project_id) DO UPDATE SET role = $3`,
      [targetUserId, projectId, role]
    );

    logger.info('User assigned to project', { projectId, targetUserId, role });
  }

  /**
   * Remove user from project
   */
  async removeUserFromProject(
    projectId: string,
    targetUserId: string,
    adminUserId: string
  ): Promise<void> {
    logger.info('Removing user from project', { projectId, targetUserId });

    // Check admin has access
    await this.checkProjectAccess(projectId, adminUserId, 'ENGINEER');

    await query(
      'DELETE FROM user_project_roles WHERE project_id = $1 AND user_id = $2',
      [projectId, targetUserId]
    );

    logger.info('User removed from project', { projectId, targetUserId });
  }

  /**
   * Get project team members
   */
  async getProjectTeam(projectId: string, userId: string): Promise<any[]> {
    logger.info('Fetching project team', { projectId });

    // Check access
    await this.checkProjectAccess(projectId, userId);

    const result = await query<any>(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, upr.role
       FROM user_project_roles upr
       JOIN users u ON u.id = upr.user_id
       WHERE upr.project_id = $1 AND u.deleted_at IS NULL
       ORDER BY u.first_name, u.last_name`,
      [projectId]
    );

    return result.rows.map(r => ({
      id: r.id,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      role: r.role,
    }));
  }
}

export default new ProjectService();
