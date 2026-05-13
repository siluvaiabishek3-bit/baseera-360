/**
 * BASEERA 360 - Thermal Image Viewer Service
 * Phase 4: Advanced Viewers
 * Handles FLIR R-JPEG thermal images and thermal analysis
 */
import { Router } from 'express';
interface ThermalData {
    id: string;
    mediaId: string;
    projectId: string;
    filename: string;
    format: 'RJPEG' | 'TIFF' | 'PNG';
    thermalInfo: {
        minTemp: number;
        maxTemp: number;
        avgTemp: number;
        emissivity: number;
        reflectedTemp: number;
        distance: number;
    };
    analysis: {
        hotSpots: Array<{
            x: number;
            y: number;
            temp: number;
            severity: 'critical' | 'high' | 'medium' | 'low';
        }>;
        coldSpots: Array<{
            x: number;
            y: number;
            temp: number;
        }>;
        temperatureVariation: number;
        issues: Array<{
            type: 'moisture' | 'insulation' | 'thermal_bridge' | 'heat_loss';
            location: string;
            severity: string;
            recommendation: string;
        }>;
    };
    uploadedAt: Date;
}
/**
 * Thermal Image Viewer Service
 * Analyzes thermal data and identifies building issues
 */
export declare class ThermalImageService {
    /**
     * Parse FLIR R-JPEG metadata
     */
    static parseThermalData(filePath: string): Promise<Partial<ThermalData['thermalInfo']>>;
    /**
     * Analyze thermal image for issues
     */
    static analyzeThermalImage(thermalInfo: ThermalData['thermalInfo']): Promise<ThermalData['analysis']>;
    /**
     * Generate thermal report
     */
    static generateThermalReport(data: ThermalData): {
        summary: string;
        findings: string[];
        recommendations: string[];
        urgency: 'critical' | 'high' | 'medium' | 'low';
    };
    /**
     * Create temperature heatmap data
     */
    static generateHeatmapData(data: ThermalData): {
        points: Array<{
            x: number;
            y: number;
            temp: number;
            color: string;
        }>;
        colorScale: Array<{
            temp: number;
            color: string;
        }>;
    };
    /**
     * Get color for temperature
     */
    private static getTempColor;
}
/**
 * Thermal Viewer Routes
 */
export declare const createThermalViewerRoutes: (db: any) => Router;
export default ThermalImageService;
//# sourceMappingURL=thermal.service.d.ts.map