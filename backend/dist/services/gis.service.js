"use strict";
/**
 * BASEERA 360 - GIS/Map Integration Service
 * Phase 4: Advanced Viewers & Analytics
 * Integrates building location mapping with inspection data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGISRoutes = exports.GISService = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
/**
 * GIS/Map Integration Service
 * Manages building mapping, zone analysis, and spatial defect distribution
 */
class GISService {
    /**
     * Calculate building footprint from coordinates
     */
    static calculateFootprint(boundingBox) {
        return [
            { latitude: boundingBox.north, longitude: boundingBox.west },
            { latitude: boundingBox.north, longitude: boundingBox.east },
            { latitude: boundingBox.south, longitude: boundingBox.east },
            { latitude: boundingBox.south, longitude: boundingBox.west },
        ];
    }
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    static calculateDistance(coord1, coord2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
        const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((coord1.latitude * Math.PI) / 180) *
                Math.cos((coord2.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Convert to meters
    }
    /**
     * Calculate zone area in m²
     */
    static calculateZoneArea(coordinates) {
        // Simplified area calculation using shoelace formula
        // Production would use proper geospatial library
        let area = 0;
        const n = coordinates.length;
        for (let i = 0; i < n; i++) {
            const x1 = coordinates[i].longitude;
            const y1 = coordinates[i].latitude;
            const x2 = coordinates[(i + 1) % n].longitude;
            const y2 = coordinates[(i + 1) % n].latitude;
            area += x1 * y2 - x2 * y1;
        }
        area = Math.abs(area) / 2;
        // Convert from degrees to approximate m²
        const metersPerDegree = 111000;
        return area * metersPerDegree * metersPerDegree;
    }
    /**
     * Generate heatmap from defect locations
     */
    static generateHeatmap(defects) {
        const heatmapData = [];
        // Create heatmap points with density calculations
        const gridSize = 0.0005; // ~50 meters at equator
        // Group defects into grid cells
        const grid = {};
        defects.forEach(defect => {
            const gridKey = `${Math.floor(defect.coordinates.latitude / gridSize)}_${Math.floor(defect.coordinates.longitude / gridSize)}`;
            if (!grid[gridKey]) {
                grid[gridKey] = [];
            }
            grid[gridKey].push(defect);
        });
        // Generate heatmap points
        Object.entries(grid).forEach(([key, defectGroup]) => {
            const [latIdx, lonIdx] = key.split('_').map(Number);
            const lat = latIdx * gridSize + gridSize / 2;
            const lon = lonIdx * gridSize + gridSize / 2;
            // Calculate severity-weighted value
            const criticalCount = defectGroup.filter(d => d.severity === 'CRITICAL').length;
            const highCount = defectGroup.filter(d => d.severity === 'HIGH').length;
            const value = Math.min(100, criticalCount * 40 + highCount * 20 + defectGroup.length * 5);
            heatmapData.push({
                coordinates: { latitude: lat, longitude: lon },
                value,
                radius: 50, // meters
            });
        });
        return {
            enabled: true,
            data: heatmapData,
        };
    }
    /**
     * Analyze defect distribution by zone
     */
    static analyzeByZone(zones, defects) {
        return zones.map(zone => {
            const zoneDefects = defects.filter(d => d.zoneId === zone.id);
            const criticalDefects = zoneDefects.filter(d => d.severity === 'CRITICAL');
            return {
                ...zone,
                defectCount: zoneDefects.length,
                criticalDefectCount: criticalDefects.length,
            };
        });
    }
    /**
     * Generate zone statistics
     */
    static generateZoneStats(zones) {
        const affectedZones = zones.filter(z => z.defectCount > 0).length;
        const criticalZones = zones.filter(z => z.criticalDefectCount > 0).length;
        const totalArea = zones.reduce((sum, z) => sum + z.area, 0);
        const totalDefects = zones.reduce((sum, z) => sum + z.defectCount, 0);
        return {
            totalZones: zones.length,
            affectedZones,
            criticalZones,
            averageDefectDensity: totalArea > 0 ? (totalDefects / totalArea) * 1000 : 0, // defects per 1000m²
        };
    }
    /**
     * Generate geojson for mapping
     */
    static generateGeoJSON(gisData) {
        const features = [];
        // Building footprint feature
        features.push({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[gisData.building.footprint.map(p => [p.longitude, p.latitude])]],
            },
            properties: {
                name: gisData.building.name,
                type: 'building',
            },
        });
        // Zone features
        gisData.zones.forEach(zone => {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[zone.coordinates.map(c => [c.longitude, c.latitude])]],
                },
                properties: {
                    id: zone.id,
                    name: zone.name,
                    type: zone.type,
                    defectCount: zone.defectCount,
                    criticalDefectCount: zone.criticalDefectCount,
                },
            });
        });
        // Defect point features
        gisData.defectLocations.forEach(defect => {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [defect.coordinates.longitude, defect.coordinates.latitude],
                },
                properties: {
                    id: defect.id,
                    category: defect.category,
                    severity: defect.severity,
                    status: defect.status,
                },
            });
        });
        return {
            type: 'FeatureCollection',
            features,
        };
    }
}
exports.GISService = GISService;
/**
 * GIS/Map Routes
 */
const createGISRoutes = (db) => {
    const router = (0, express_1.Router)();
    /**
     * GET /api/gis/:projectId
     * Get GIS data for project
     */
    router.get('/:projectId', auth_1.verifyToken, async (req, res) => {
        try {
            const { projectId } = req.params;
            const gisData = {
                id: `gis-${projectId}`,
                projectId,
                building: {
                    name: 'Commercial Tower A',
                    address: '123 Business Ave, Downtown',
                    coordinates: { latitude: 40.7128, longitude: -74.006 },
                    boundingBox: {
                        north: 40.7138,
                        south: 40.7118,
                        east: -74.005,
                        west: -74.007,
                    },
                    footprint: [
                        { latitude: 40.7138, longitude: -74.007 },
                        { latitude: 40.7138, longitude: -74.005 },
                        { latitude: 40.7118, longitude: -74.005 },
                        { latitude: 40.7118, longitude: -74.007 },
                    ],
                    height: 150,
                    floors: 30,
                },
                zones: [
                    {
                        id: 'zone-1',
                        name: 'Main Facade',
                        type: 'facade',
                        coordinates: [
                            { latitude: 40.7138, longitude: -74.007 },
                            { latitude: 40.7138, longitude: -74.006 },
                        ],
                        defectCount: 5,
                        criticalDefectCount: 1,
                        area: 2000,
                        material: 'Aluminum and glass',
                    },
                    {
                        id: 'zone-2',
                        name: 'Roof',
                        type: 'roof',
                        coordinates: [
                            { latitude: 40.7128, longitude: -74.006 },
                            { latitude: 40.7128, longitude: -74.005 },
                        ],
                        defectCount: 3,
                        criticalDefectCount: 0,
                        area: 1500,
                        material: 'Waterproof membrane',
                    },
                ],
                defectLocations: [
                    {
                        id: 'defect-1',
                        annotationId: 'anno-1',
                        zoneId: 'zone-1',
                        coordinates: { latitude: 40.7133, longitude: -74.0065 },
                        altitude: 45,
                        category: 'CRACK',
                        severity: 'CRITICAL',
                        status: 'OPEN',
                    },
                    {
                        id: 'defect-2',
                        annotationId: 'anno-2',
                        zoneId: 'zone-1',
                        coordinates: { latitude: 40.7135, longitude: -74.0062 },
                        altitude: 50,
                        category: 'WATER_DAMAGE',
                        severity: 'HIGH',
                        status: 'IN_PROGRESS',
                    },
                ],
                inspectionPath: [
                    {
                        timestamp: new Date(Date.now() - 3600000),
                        coordinates: { latitude: 40.7128, longitude: -74.006 },
                        altitude: 10,
                        droneId: 'DJI-001',
                    },
                    {
                        timestamp: new Date(Date.now() - 1800000),
                        coordinates: { latitude: 40.7135, longitude: -74.0062 },
                        altitude: 50,
                        droneId: 'DJI-001',
                    },
                ],
                heatmap: { enabled: false, data: [] },
            };
            // Generate heatmap
            gisData.heatmap = GISService.generateHeatmap(gisData.defectLocations);
            // Analyze by zone
            gisData.zones = GISService.analyzeByZone(gisData.zones, gisData.defectLocations);
            const stats = GISService.generateZoneStats(gisData.zones);
            res.json({
                success: true,
                data: {
                    gisData,
                    statistics: stats,
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
     * GET /api/gis/:projectId/geojson
     * Get GeoJSON for mapping libraries
     */
    router.get('/:projectId/geojson', auth_1.verifyToken, async (req, res) => {
        try {
            const { projectId } = req.params;
            // Get GIS data
            const gisData = {
                id: `gis-${projectId}`,
                projectId,
                building: {
                    name: 'Commercial Tower A',
                    address: '123 Business Ave',
                    coordinates: { latitude: 40.7128, longitude: -74.006 },
                    boundingBox: {
                        north: 40.7138,
                        south: 40.7118,
                        east: -74.005,
                        west: -74.007,
                    },
                    footprint: [
                        { latitude: 40.7138, longitude: -74.007 },
                        { latitude: 40.7138, longitude: -74.005 },
                        { latitude: 40.7118, longitude: -74.005 },
                        { latitude: 40.7118, longitude: -74.007 },
                    ],
                    height: 150,
                    floors: 30,
                },
                zones: [],
                defectLocations: [],
                inspectionPath: [],
                heatmap: { enabled: false, data: [] },
            };
            const geoJson = GISService.generateGeoJSON(gisData);
            res.json({
                success: true,
                data: { geoJson },
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
     * GET /api/gis/:projectId/zones
     * Get zone analysis
     */
    router.get('/:projectId/zones', auth_1.verifyToken, async (req, res) => {
        try {
            const { projectId } = req.params;
            const zones = [
                {
                    id: 'zone-1',
                    name: 'Main Facade',
                    type: 'facade',
                    coordinates: [],
                    defectCount: 5,
                    criticalDefectCount: 1,
                    area: 2000,
                    material: 'Aluminum and glass',
                },
            ];
            const stats = GISService.generateZoneStats(zones);
            res.json({
                success: true,
                data: {
                    zones,
                    statistics: stats,
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
exports.createGISRoutes = createGISRoutes;
exports.default = GISService;
//# sourceMappingURL=gis.service.js.map