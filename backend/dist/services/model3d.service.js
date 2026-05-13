"use strict";
/**
 * BASEERA 360 - 3D Model Viewer Service
 * Phase 4: Advanced Viewers
 * Handles OBJ, FBX, and IFC 3D model rendering
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create3DViewerRoutes = exports.Model3DService = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const fs_1 = __importDefault(require("fs"));
/**
 * 3D Model Viewer Service
 * Manages 3D model rendering, processing, and metadata
 */
class Model3DService {
    /**
     * Parse OBJ file and extract metadata
     */
    static async parseOBJFile(filePath) {
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        let vertices = 0;
        let faces = 0;
        const minCoords = { x: Infinity, y: Infinity, z: Infinity };
        const maxCoords = { x: -Infinity, y: -Infinity, z: -Infinity };
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            // Count vertices
            if (parts[0] === 'v') {
                vertices++;
                const [x, y, z] = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
                minCoords.x = Math.min(minCoords.x, x);
                minCoords.y = Math.min(minCoords.y, y);
                minCoords.z = Math.min(minCoords.z, z);
                maxCoords.x = Math.max(maxCoords.x, x);
                maxCoords.y = Math.max(maxCoords.y, y);
                maxCoords.z = Math.max(maxCoords.z, z);
            }
            // Count faces
            if (parts[0] === 'f') {
                faces++;
            }
        }
        return {
            vertices,
            faces,
            boundingBox: {
                min: minCoords,
                max: maxCoords,
            },
        };
    }
    /**
     * Parse IFC file and extract metadata
     * Note: Full IFC parsing requires ifc.js library
     */
    static async parseIFCFile(filePath) {
        // Simplified IFC parsing - production would use ifc.js
        const fileSize = fs_1.default.statSync(filePath).size;
        // Extract basic info from IFC file
        const content = fs_1.default.readFileSync(filePath, 'utf-8').substring(0, 5000);
        // Count entities (simplified)
        const entityCount = (content.match(/#\d+=/g) || []).length;
        return {
            vertices: entityCount,
            faces: Math.ceil(entityCount / 3),
            boundingBox: {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 100, y: 100, z: 100 },
            },
        };
    }
    /**
     * Process uploaded 3D model
     */
    static async processModel(filePath, format) {
        try {
            switch (format) {
                case 'OBJ':
                    return await this.parseOBJFile(filePath);
                case 'IFC':
                    return await this.parseIFCFile(filePath);
                case 'FBX':
                    // FBX parsing would require fbx-binary-parser or similar
                    return {
                        vertices: 1000,
                        faces: 500,
                        boundingBox: {
                            min: { x: 0, y: 0, z: 0 },
                            max: { x: 100, y: 100, z: 100 },
                        },
                    };
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        }
        catch (error) {
            console.error('Error processing 3D model:', error);
            throw error;
        }
    }
    /**
     * Get model viewing URL
     */
    static getModelViewerURL(modelId) {
        return `/api/viewer/3d/${modelId}`;
    }
    /**
     * Calculate model statistics
     */
    static calculateStatistics(metadata) {
        const totalPolygons = metadata.faces;
        let complexity = 'low';
        let estimatedLoadTime = '< 1 second';
        let recommendation = 'Suitable for all devices';
        if (totalPolygons > 100000) {
            complexity = 'high';
            estimatedLoadTime = '5-10 seconds';
            recommendation = 'Best on desktop, may be slow on mobile';
        }
        else if (totalPolygons > 50000) {
            complexity = 'medium';
            estimatedLoadTime = '2-5 seconds';
            recommendation = 'Suitable for most devices';
        }
        return { complexity, estimatedLoadTime, recommendation };
    }
}
exports.Model3DService = Model3DService;
/**
 * 3D Viewer Routes
 */
const create3DViewerRoutes = (db) => {
    const router = (0, express_1.Router)();
    /**
     * GET /api/viewer/3d/:modelId
     * Get 3D model for viewing
     */
    router.get('/3d/:modelId', auth_1.verifyToken, async (req, res) => {
        try {
            const { modelId } = req.params;
            const { projectId } = req.query;
            // Get model from database
            // This would typically query your database
            const model = {
                id: modelId,
                filename: 'building-facade.obj',
                format: 'OBJ',
                metadata: {
                    vertices: 50000,
                    faces: 25000,
                    boundingBox: {
                        min: { x: 0, y: 0, z: 0 },
                        max: { x: 100, y: 100, z: 50 },
                    },
                },
            };
            const stats = Model3DService.calculateStatistics(model.metadata);
            res.json({
                success: true,
                data: {
                    model,
                    statistics: stats,
                    viewerURL: Model3DService.getModelViewerURL(modelId),
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    });
    /**
     * POST /api/viewer/3d/upload
     * Upload and process 3D model
     */
    router.post('/3d/upload', auth_1.verifyToken, async (req, res) => {
        try {
            const { projectId, mediaId, format, filePath } = req.body;
            if (!['OBJ', 'FBX', 'IFC'].includes(format)) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Unsupported 3D format' },
                });
            }
            // Process model
            const metadata = await Model3DService.processModel(filePath, format);
            // Save to database (simplified)
            const model = {
                projectId,
                mediaId,
                format,
                metadata: metadata,
                uploadedAt: new Date(),
            };
            res.json({
                success: true,
                data: {
                    model,
                    statistics: Model3DService.calculateStatistics(metadata),
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    });
    /**
     * GET /api/viewer/3d/:modelId/info
     * Get detailed model information
     */
    router.get('/3d/:modelId/info', auth_1.verifyToken, async (req, res) => {
        try {
            const { modelId } = req.params;
            // Get model info
            const model = {
                id: modelId,
                format: 'OBJ',
                fileSize: 5242880, // 5MB
                metadata: {
                    vertices: 50000,
                    faces: 25000,
                    boundingBox: {
                        min: { x: 0, y: 0, z: 0 },
                        max: { x: 100, y: 100, z: 50 },
                    },
                },
            };
            const stats = Model3DService.calculateStatistics(model.metadata);
            res.json({
                success: true,
                data: {
                    model,
                    statistics: stats,
                    supportedFormats: ['OBJ', 'FBX', 'IFC', 'GLTF'],
                    renderingOptions: {
                        wireframe: true,
                        shading: ['flat', 'smooth', 'pbr'],
                        lighting: ['default', 'night', 'studio'],
                        background: ['white', 'transparent', 'gradient'],
                    },
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    });
    return router;
};
exports.create3DViewerRoutes = create3DViewerRoutes;
exports.default = Model3DService;
//# sourceMappingURL=model3d.service.js.map