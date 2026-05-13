/**
 * BASEERA 360 - GIS/Map Integration Service
 * Phase 4: Advanced Viewers & Analytics
 * Integrates building location mapping with inspection data
 */
import { Router } from 'express';
interface GISData {
    id: string;
    projectId: string;
    building: {
        name: string;
        address: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
        boundingBox: {
            north: number;
            south: number;
            east: number;
            west: number;
        };
        footprint: Array<{
            latitude: number;
            longitude: number;
        }>;
        height: number;
        floors: number;
    };
    zones: Array<{
        id: string;
        name: string;
        type: 'facade' | 'roof' | 'foundation' | 'parking';
        coordinates: Array<{
            latitude: number;
            longitude: number;
        }>;
        defectCount: number;
        criticalDefectCount: number;
        area: number;
        material: string;
    }>;
    defectLocations: Array<{
        id: string;
        annotationId: string;
        zoneId: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
        altitude: number;
        category: string;
        severity: string;
        status: string;
    }>;
    inspectionPath: Array<{
        timestamp: Date;
        coordinates: {
            latitude: number;
            longitude: number;
        };
        altitude: number;
        droneId?: string;
    }>;
    heatmap: {
        enabled: boolean;
        data: Array<{
            coordinates: {
                latitude: number;
                longitude: number;
            };
            value: number;
            radius: number;
        }>;
    };
}
/**
 * GIS/Map Integration Service
 * Manages building mapping, zone analysis, and spatial defect distribution
 */
export declare class GISService {
    /**
     * Calculate building footprint from coordinates
     */
    static calculateFootprint(boundingBox: {
        north: number;
        south: number;
        east: number;
        west: number;
    }): Array<{
        latitude: number;
        longitude: number;
    }>;
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    static calculateDistance(coord1: {
        latitude: number;
        longitude: number;
    }, coord2: {
        latitude: number;
        longitude: number;
    }): number;
    /**
     * Calculate zone area in m²
     */
    static calculateZoneArea(coordinates: Array<{
        latitude: number;
        longitude: number;
    }>): number;
    /**
     * Generate heatmap from defect locations
     */
    static generateHeatmap(defects: GISData['defectLocations']): GISData['heatmap'];
    /**
     * Analyze defect distribution by zone
     */
    static analyzeByZone(zones: GISData['zones'], defects: GISData['defectLocations']): GISData['zones'];
    /**
     * Generate zone statistics
     */
    static generateZoneStats(zones: GISData['zones']): {
        totalZones: number;
        affectedZones: number;
        criticalZones: number;
        averageDefectDensity: number;
    };
    /**
     * Generate geojson for mapping
     */
    static generateGeoJSON(gisData: GISData): {
        type: string;
        features: Array<any>;
    };
}
/**
 * GIS/Map Routes
 */
export declare const createGISRoutes: (db: any) => Router;
export default GISService;
//# sourceMappingURL=gis.service.d.ts.map