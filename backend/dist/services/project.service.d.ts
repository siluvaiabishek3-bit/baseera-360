/**
 * BASEERA 360 - Project Service
 * Complete CRUD operations for projects
 */
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
export declare class ProjectService {
    /**
     * Get all projects for an organization
     */
    getProjects(organizationId: string, limit?: number, offset?: number, filters?: any): Promise<{
        projects: any[];
        total: number;
    }>;
    /**
     * Get single project by ID
     */
    getProject(projectId: string, userId: string): Promise<any>;
    /**
     * Create new project
     */
    createProject(organizationId: string, userId: string, data: ProjectData): Promise<any>;
    /**
     * Update project
     */
    updateProject(projectId: string, userId: string, data: ProjectUpdate): Promise<any>;
    /**
     * Delete project (soft delete)
     */
    deleteProject(projectId: string, userId: string): Promise<void>;
    /**
     * Check if user has access to project
     */
    private checkProjectAccess;
    /**
     * Get user's role in organization
     */
    private getUserProjectRole;
    /**
     * Assign user to project
     */
    assignUserToProject(projectId: string, userId: string, targetUserId: string, role: string, adminUserId: string): Promise<void>;
    /**
     * Remove user from project
     */
    removeUserFromProject(projectId: string, targetUserId: string, adminUserId: string): Promise<void>;
    /**
     * Get project team members
     */
    getProjectTeam(projectId: string, userId: string): Promise<any[]>;
}
declare const _default: ProjectService;
export default _default;
//# sourceMappingURL=project.service.d.ts.map