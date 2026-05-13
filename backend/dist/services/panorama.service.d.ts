/**
 * BASEERA 360 - 360° Panorama Viewer Service
 * Phase 4: Advanced Viewers
 * Handles stitched panoramic images and navigation
 */
import { Router } from 'express';
interface PanoramaData {
    id: string;
    mediaId: string;
    projectId: string;
    location: {
        floor: number;
        zone: string;
        coordinates: {
            x: number;
            y: number;
        };
        elevation: number;
    };
    image: {
        url: string;
        format: 'equirectangular' | 'cubemap';
        resolution: '2K' | '4K' | '8K';
        fileSize: number;
    };
    annotations: Array<{
        id: string;
        type: 'hotspot' | 'defect' | 'measurement';
        position: {
            x: number;
            y: number;
            z: number;
        };
        content: string;
        linkedTo?: string;
    }>;
    measurements: Array<{
        id: string;
        type: 'distance' | 'area' | 'angle';
        points: Array<{
            x: number;
            y: number;
            z: number;
        }>;
        value: number;
        unit: string;
    }>;
    navigation: Array<{
        direction: 'north' | 'south' | 'east' | 'west' | 'up' | 'down';
        linkedPanoId: string;
        label: string;
    }>;
    uploadedAt: Date;
}
/**
 * 360 Panorama Viewer Service
 * Manages panoramic image viewing, navigation, and measurements
 */
export declare class PanoramaService {
    /**
     * Parse panorama metadata
     */
    static parsePanoramaMetadata(filePath: string): Promise<Partial<PanoramaData['image']>>;
    /**
     * Create hotspot in panorama
     */
    static createHotspot(position: {
        x: number;
        y: number;
        z: number;
    }, type: 'annotation' | 'defect' | 'measurement', content: string): PanoramaData['annotations'][0];
    /**
     * Calculate distance between two points in panorama
     */
    static calculateDistance(point1: {
        x: number;
        y: number;
        z: number;
    }, point2: {
        x: number;
        y: number;
        z: number;
    }, realWorldScale?: number): number;
    /**
     * Calculate area in panorama
     */
    static calculateArea(points: Array<{
        x: number;
        y: number;
        z: number;
    }>, realWorldScale?: number): number;
    /**
     * Create measurement in panorama
     */
    static createMeasurement(type: 'distance' | 'area' | 'angle', points: Array<{
        x: number;
        y: number;
        z: number;
    }>, realWorldScale?: number): PanoramaData['measurements'][0];
    /**
     * Link panoramas for navigation
     */
    static createNavigation(direction: 'north' | 'south' | 'east' | 'west' | 'up' | 'down', linkedPanoId: string, label: string): PanoramaData['navigation'][0];
    /**
     * Generate panorama viewer HTML
     */
    static generateViewerHTML(panoId: string): string;
}
/**
 * Panorama Viewer Routes
 */
export declare const createPanoramaViewerRoutes: (db: any) => Router;
export default PanoramaService;
//# sourceMappingURL=panorama.service.d.ts.map