/**
 * BASEERA 360 - 3D Model Viewer Service
 * Phase 4: Advanced Viewers
 * Handles OBJ, FBX, and IFC 3D model rendering
 */
import { Router } from 'express';
interface Model3D {
    id: string;
    projectId: string;
    mediaId: string;
    filename: string;
    format: 'OBJ' | 'FBX' | 'IFC';
    fileSize: number;
    uploadedBy: string;
    uploadedAt: Date;
    metadata: {
        vertices: number;
        faces: number;
        boundingBox?: {
            min: {
                x: number;
                y: number;
                z: number;
            };
            max: {
                x: number;
                y: number;
                z: number;
            };
        };
    };
}
/**
 * 3D Model Viewer Service
 * Manages 3D model rendering, processing, and metadata
 */
export declare class Model3DService {
    /**
     * Parse OBJ file and extract metadata
     */
    static parseOBJFile(filePath: string): Promise<Partial<Model3D['metadata']>>;
    /**
     * Parse IFC file and extract metadata
     * Note: Full IFC parsing requires ifc.js library
     */
    static parseIFCFile(filePath: string): Promise<Partial<Model3D['metadata']>>;
    /**
     * Process uploaded 3D model
     */
    static processModel(filePath: string, format: 'OBJ' | 'FBX' | 'IFC'): Promise<Partial<Model3D['metadata']>>;
    /**
     * Get model viewing URL
     */
    static getModelViewerURL(modelId: string): string;
    /**
     * Calculate model statistics
     */
    static calculateStatistics(metadata: Model3D['metadata']): {
        complexity: 'low' | 'medium' | 'high';
        estimatedLoadTime: string;
        recommendation: string;
    };
}
/**
 * 3D Viewer Routes
 */
export declare const create3DViewerRoutes: (db: any) => Router;
export default Model3DService;
//# sourceMappingURL=model3d.service.d.ts.map