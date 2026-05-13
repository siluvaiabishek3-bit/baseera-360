"use strict";
/**
 * BASEERA 360 - 360° Panorama Viewer Service
 * Phase 4: Advanced Viewers
 * Handles stitched panoramic images and navigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPanoramaViewerRoutes = exports.PanoramaService = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
/**
 * 360 Panorama Viewer Service
 * Manages panoramic image viewing, navigation, and measurements
 */
class PanoramaService {
    /**
     * Parse panorama metadata
     */
    static async parsePanoramaMetadata(filePath) {
        // Simplified panorama parsing
        // Production would use image metadata extraction
        return {
            format: 'equirectangular',
            resolution: '4K',
            fileSize: 15728640, // 15MB
        };
    }
    /**
     * Create hotspot in panorama
     */
    static createHotspot(position, type, content) {
        return {
            id: `hotspot-${Date.now()}`,
            type: type,
            position,
            content,
        };
    }
    /**
     * Calculate distance between two points in panorama
     */
    static calculateDistance(point1, point2, realWorldScale = 1 // meters per unit
    ) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const dz = point2.z - point1.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance * realWorldScale;
    }
    /**
     * Calculate area in panorama
     */
    static calculateArea(points, realWorldScale = 1) {
        if (points.length < 3)
            return 0;
        // Simplified area calculation using cross product
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            area += p1.x * p2.y - p2.x * p1.y;
        }
        area = Math.abs(area) / 2;
        return area * realWorldScale * realWorldScale;
    }
    /**
     * Create measurement in panorama
     */
    static createMeasurement(type, points, realWorldScale = 1) {
        let value = 0;
        let unit = '';
        if (type === 'distance' && points.length >= 2) {
            value = this.calculateDistance(points[0], points[1], realWorldScale);
            unit = 'm';
        }
        else if (type === 'area' && points.length >= 3) {
            value = this.calculateArea(points, realWorldScale);
            unit = 'm²';
        }
        else if (type === 'angle' && points.length >= 3) {
            // Calculate angle from 3 points
            const v1 = { x: points[0].x - points[1].x, y: points[0].y - points[1].y };
            const v2 = { x: points[2].x - points[1].x, y: points[2].y - points[1].y };
            const dotProduct = v1.x * v2.x + v1.y * v2.y;
            const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            value = Math.acos(dotProduct / (mag1 * mag2)) * (180 / Math.PI);
            unit = '°';
        }
        return {
            id: `measurement-${Date.now()}`,
            type,
            points,
            value,
            unit,
        };
    }
    /**
     * Link panoramas for navigation
     */
    static createNavigation(direction, linkedPanoId, label) {
        return {
            direction,
            linkedPanoId,
            label,
        };
    }
    /**
     * Generate panorama viewer HTML
     */
    static generateViewerHTML(panoId) {
        return `
      <div id="panorama-${panoId}" class="panorama-viewer" style="width: 100%; height: 600px;">
        <!-- Panorama viewer will be rendered here using Three.js/Pannellum -->
      </div>
      <script>
        // Pannellum viewer initialization
        pannellum.viewer('panorama-${panoId}', {
          default: {
            firstScene: '${panoId}',
            author: 'BASEERA 360',
            title: 'Building Inspection Panorama'
          },
          scenes: {
            '${panoId}': {
              type: 'equirectangular',
              panorama: '/api/panorama/${panoId}/image',
              pitch: 0,
              yaw: 0,
              hfov: 100,
              hotSpots: []
            }
          }
        });
      </script>
    `;
    }
}
exports.PanoramaService = PanoramaService;
/**
 * Panorama Viewer Routes
 */
const createPanoramaViewerRoutes = (db) => {
    const router = (0, express_1.Router)();
    /**
     * GET /api/viewer/panorama/:panoId
     * Get panorama data
     */
    router.get('/panorama/:panoId', auth_1.verifyToken, async (req, res) => {
        try {
            const { panoId } = req.params;
            const { projectId } = req.query;
            // Get panorama data (would come from database)
            const panorama = {
                id: panoId,
                mediaId: panoId,
                projectId: projectId,
                location: {
                    floor: 1,
                    zone: 'Main Facade',
                    coordinates: { x: 100, y: 200 },
                    elevation: 15,
                },
                image: {
                    url: `/api/panorama/${panoId}/image`,
                    format: 'equirectangular',
                    resolution: '4K',
                    fileSize: 15728640,
                },
                annotations: [
                    PanoramaService.createHotspot({ x: 50, y: 100, z: 75 }, 'defect', 'Crack detected'),
                    PanoramaService.createHotspot({ x: 150, y: 50, z: 100 }, 'annotation', 'Joint failure'),
                ],
                measurements: [
                    PanoramaService.createMeasurement('distance', [
                        { x: 0, y: 0, z: 0 },
                        { x: 100, y: 100, z: 50 },
                    ]),
                ],
                navigation: [
                    PanoramaService.createNavigation('north', 'pano-2', 'Upper floor'),
                    PanoramaService.createNavigation('south', 'pano-3', 'Ground floor'),
                ],
                uploadedAt: new Date(),
            };
            res.json({
                success: true,
                data: { panorama },
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
     * GET /api/viewer/panorama/:panoId/viewer
     * Get panorama viewer HTML
     */
    router.get('/panorama/:panoId/viewer', auth_1.verifyToken, async (req, res) => {
        try {
            const { panoId } = req.params;
            const html = PanoramaService.generateViewerHTML(panoId);
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    });
    /**
     * POST /api/viewer/panorama/:panoId/annotate
     * Add annotation to panorama
     */
    router.post('/panorama/:panoId/annotate', auth_1.verifyToken, async (req, res) => {
        try {
            const { panoId } = req.params;
            const { position, type, content } = req.body;
            const hotspot = PanoramaService.createHotspot(position, type, content);
            res.json({
                success: true,
                data: { hotspot },
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
     * POST /api/viewer/panorama/:panoId/measure
     * Create measurement in panorama
     */
    router.post('/panorama/:panoId/measure', auth_1.verifyToken, async (req, res) => {
        try {
            const { panoId } = req.params;
            const { type, points, realWorldScale } = req.body;
            const measurement = PanoramaService.createMeasurement(type, points, realWorldScale);
            res.json({
                success: true,
                data: { measurement },
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
exports.createPanoramaViewerRoutes = createPanoramaViewerRoutes;
exports.default = PanoramaService;
//# sourceMappingURL=panorama.service.js.map