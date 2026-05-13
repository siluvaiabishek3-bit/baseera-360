/**
 * BASEERA 360 - Annotation Service
 * Handle defect annotations, marking, and status management
 */
export declare enum AnnotationSeverity {
    CRITICAL = "CRITICAL",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW",
    INFO = "INFO"
}
export declare enum AnnotationStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
    REOPEN = "REOPEN"
}
export declare enum DefectCategory {
    CRACK = "CRACK",
    SPALLING = "SPALLING",
    EFFLORESCENCE = "EFFLORESCENCE",
    STAINING = "STAINING",
    JOINT_FAILURE = "JOINT_FAILURE",
    SEALANT_FAILURE = "SEALANT_FAILURE",
    CORROSION = "CORROSION",
    WATER_DAMAGE = "WATER_DAMAGE",
    GLASS_DAMAGE = "GLASS_DAMAGE",
    METAL_DAMAGE = "METAL_DAMAGE",
    THERMAL_ISSUE = "THERMAL_ISSUE",
    OTHER = "OTHER"
}
interface AnnotationData {
    mediaId: string;
    category: DefectCategory;
    severity: AnnotationSeverity;
    description: string;
    coordinates?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    assignedTo?: string;
    dueDate?: string;
}
interface AnnotationUpdate {
    status?: AnnotationStatus;
    severity?: AnnotationSeverity;
    category?: DefectCategory;
    description?: string;
    coordinates?: any;
    assignedTo?: string;
    dueDate?: string;
    resolutionNotes?: string;
}
export declare class AnnotationService {
    /**
     * Create annotation on media
     */
    createAnnotation(projectId: string, userId: string, data: AnnotationData): Promise<any>;
    /**
     * Get all annotations for project
     */
    getProjectAnnotations(projectId: string, userId: string, filters?: any): Promise<{
        annotations: any[];
        total: number;
    }>;
    /**
     * Get single annotation
     */
    getAnnotation(annotationId: string, projectId: string): Promise<any>;
    /**
     * Update annotation
     */
    updateAnnotation(annotationId: string, projectId: string, userId: string, data: AnnotationUpdate): Promise<any>;
    /**
     * Update annotation status
     */
    updateAnnotationStatus(annotationId: string, projectId: string, userId: string, status: AnnotationStatus, resolutionNotes?: string): Promise<any>;
    /**
     * Delete annotation (soft delete)
     */
    deleteAnnotation(annotationId: string, projectId: string, userId: string): Promise<void>;
    /**
     * Get annotations by severity
     */
    getAnnotationsBySeverity(projectId: string, severity: AnnotationSeverity): Promise<any[]>;
    /**
     * Get annotations statistics
     */
    getAnnotationStatistics(projectId: string): Promise<any>;
    /**
     * Assign annotation to user
     */
    assignAnnotation(annotationId: string, projectId: string, assignToUserId: string, userId: string): Promise<any>;
    /**
     * Get annotation history
     */
    getAnnotationHistory(annotationId: string, projectId: string): Promise<any[]>;
    /**
     * Helper: Format annotation response
     */
    private formatAnnotation;
}
declare const _default: AnnotationService;
export default _default;
//# sourceMappingURL=annotation.service.d.ts.map