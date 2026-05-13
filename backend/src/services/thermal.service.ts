/**
 * BASEERA 360 - Thermal Image Viewer Service
 * Phase 4: Advanced Viewers
 * Handles FLIR R-JPEG thermal images and thermal analysis
 */

import { Router } from 'express';
import { verifyToken } from '../middleware/auth';

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
export class ThermalImageService {
  /**
   * Parse FLIR R-JPEG metadata
   */
  static async parseThermalData(filePath: string): Promise<Partial<ThermalData['thermalInfo']>> {
    // Simplified FLIR parsing
    // Production would use thermal-image-parser library

    return {
      minTemp: -10, // °C
      maxTemp: 45,
      avgTemp: 22,
      emissivity: 0.95,
      reflectedTemp: 20,
      distance: 3, // meters
    };
  }

  /**
   * Analyze thermal image for issues
   */
  static async analyzeThermalImage(
    thermalInfo: ThermalData['thermalInfo']
  ): Promise<ThermalData['analysis']> {
    const tempVariation = thermalInfo.maxTemp - thermalInfo.minTemp;
    const issues: ThermalData['analysis']['issues'] = [];

    // Detect moisture (cold spots, high temperature variation)
    if (thermalInfo.minTemp < 5 && tempVariation > 20) {
      issues.push({
        type: 'moisture',
        location: 'Bottom corners and edges',
        severity: 'high',
        recommendation: 'Check for water intrusion. Inspect foundation and seal cracks.',
      });
    }

    // Detect insulation issues (high average temp in cold areas)
    if (thermalInfo.avgTemp > 20 && tempVariation > 15) {
      issues.push({
        type: 'insulation',
        location: 'Upper facade areas',
        severity: 'medium',
        recommendation: 'Improve insulation. Consider thermal retrofitting.',
      });
    }

    // Detect thermal bridges (sudden temperature changes)
    if (tempVariation > 25) {
      issues.push({
        type: 'thermal_bridge',
        location: 'Structural elements',
        severity: 'high',
        recommendation: 'Thermal bridge detected. Insulate structural elements.',
      });
    }

    // Detect heat loss (warm areas in cold weather)
    if (thermalInfo.maxTemp > 30 && thermalInfo.minTemp > 10) {
      issues.push({
        type: 'heat_loss',
        location: 'Windows and joints',
        severity: 'medium',
        recommendation: 'Upgrade windows and seal joints to reduce heat loss.',
      });
    }

    return {
      hotSpots: [
        { x: 150, y: 200, temp: 45, severity: 'critical' },
        { x: 450, y: 350, temp: 38, severity: 'high' },
        { x: 600, y: 120, temp: 32, severity: 'medium' },
      ],
      coldSpots: [
        { x: 100, y: 450, temp: -5, severity: 'high' },
        { x: 650, y: 500, temp: 2, severity: 'medium' },
      ],
      temperatureVariation: tempVariation,
      issues,
    };
  }

  /**
   * Generate thermal report
   */
  static generateThermalReport(data: ThermalData): {
    summary: string;
    findings: string[];
    recommendations: string[];
    urgency: 'critical' | 'high' | 'medium' | 'low';
  } {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';

    // Add findings based on analysis
    if (data.analysis.issues.length > 0) {
      urgency = 'high';

      data.analysis.issues.forEach(issue => {
        findings.push(`${issue.type.toUpperCase()}: ${issue.location}`);
        recommendations.push(issue.recommendation);
      });
    }

    // Check temperature variation
    if (data.analysis.temperatureVariation > 30) {
      urgency = 'critical';
      findings.push('EXTREME TEMPERATURE VARIATION DETECTED');
      recommendations.push('Immediate professional assessment recommended');
    }

    const summary = `Thermal analysis of facade shows ${data.analysis.issues.length} issues. Temperature range: ${data.thermalInfo.minTemp}°C to ${data.thermalInfo.maxTemp}°C.`;

    return {
      summary,
      findings: findings.length > 0 ? findings : ['No critical issues detected'],
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ['Routine maintenance recommended'],
      urgency,
    };
  }

  /**
   * Create temperature heatmap data
   */
  static generateHeatmapData(data: ThermalData): {
    points: Array<{ x: number; y: number; temp: number; color: string }>;
    colorScale: Array<{ temp: number; color: string }>;
  } {
    const minTemp = data.thermalInfo.minTemp;
    const maxTemp = data.thermalInfo.maxTemp;

    // Color gradient from blue (cold) to red (hot)
    const colorScale = [
      { temp: minTemp, color: '#0000FF' }, // Blue
      { temp: minTemp + (maxTemp - minTemp) * 0.25, color: '#00FFFF' }, // Cyan
      { temp: minTemp + (maxTemp - minTemp) * 0.5, color: '#00FF00' }, // Green
      { temp: minTemp + (maxTemp - minTemp) * 0.75, color: '#FFFF00' }, // Yellow
      { temp: maxTemp, color: '#FF0000' }, // Red
    ];

    // Generate heatmap points from thermal data
    const points = [
      ...data.analysis.hotSpots.map(spot => ({
        x: spot.x,
        y: spot.y,
        temp: spot.temp,
        color: this.getTempColor(spot.temp, minTemp, maxTemp),
      })),
      ...data.analysis.coldSpots.map(spot => ({
        x: spot.x,
        y: spot.y,
        temp: spot.temp,
        color: this.getTempColor(spot.temp, minTemp, maxTemp),
      })),
    ];

    return { points, colorScale };
  }

  /**
   * Get color for temperature
   */
  private static getTempColor(temp: number, minTemp: number, maxTemp: number): string {
    const ratio = (temp - minTemp) / (maxTemp - minTemp);

    if (ratio < 0.25) return '#0000FF'; // Blue
    if (ratio < 0.5) return '#00FFFF'; // Cyan
    if (ratio < 0.75) return '#FFFF00'; // Yellow
    return '#FF0000'; // Red
  }
}

/**
 * Thermal Viewer Routes
 */
export const createThermalViewerRoutes = (db: any): Router => {
  const router = Router();

  /**
   * GET /api/viewer/thermal/:mediaId
   * Get thermal image data
   */
  router.get('/thermal/:mediaId', verifyToken, async (req, res) => {
    try {
      const { mediaId } = req.params;
      const { projectId } = req.query;

      // Get thermal data (would come from database)
      const thermalData: ThermalData = {
        id: `thermal-${mediaId}`,
        mediaId,
        projectId: projectId as string,
        filename: 'facade-thermal.rjpeg',
        format: 'RJPEG',
        thermalInfo: {
          minTemp: -10,
          maxTemp: 45,
          avgTemp: 22,
          emissivity: 0.95,
          reflectedTemp: 20,
          distance: 3,
        },
        analysis: await ThermalImageService.analyzeThermalImage({
          minTemp: -10,
          maxTemp: 45,
          avgTemp: 22,
          emissivity: 0.95,
          reflectedTemp: 20,
          distance: 3,
        }),
        uploadedAt: new Date(),
      };

      const report = ThermalImageService.generateThermalReport(thermalData);
      const heatmap = ThermalImageService.generateHeatmapData(thermalData);

      res.json({
        success: true,
        data: {
          thermal: thermalData,
          report,
          heatmap,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message },
      });
    }
  });

  /**
   * POST /api/viewer/thermal/analyze
   * Analyze thermal image
   */
  router.post('/thermal/analyze', verifyToken, async (req, res) => {
    try {
      const { mediaId, projectId, thermalInfo } = req.body;

      const analysis = await ThermalImageService.analyzeThermalImage(thermalInfo);
      const report = ThermalImageService.generateThermalReport({
        id: `thermal-${mediaId}`,
        mediaId,
        projectId,
        filename: '',
        format: 'RJPEG',
        thermalInfo,
        analysis,
        uploadedAt: new Date(),
      });

      res.json({
        success: true,
        data: {
          analysis,
          report,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message },
      });
    }
  });

  /**
   * GET /api/viewer/thermal/:mediaId/heatmap
   * Get thermal heatmap
   */
  router.get('/thermal/:mediaId/heatmap', verifyToken, async (req, res) => {
    try {
      const { mediaId } = req.params;

      // Get thermal data
      const thermalData: ThermalData = {
        id: `thermal-${mediaId}`,
        mediaId,
        projectId: '',
        filename: '',
        format: 'RJPEG',
        thermalInfo: {
          minTemp: -10,
          maxTemp: 45,
          avgTemp: 22,
          emissivity: 0.95,
          reflectedTemp: 20,
          distance: 3,
        },
        analysis: await ThermalImageService.analyzeThermalImage({
          minTemp: -10,
          maxTemp: 45,
          avgTemp: 22,
          emissivity: 0.95,
          reflectedTemp: 20,
          distance: 3,
        }),
        uploadedAt: new Date(),
      };

      const heatmap = ThermalImageService.generateHeatmapData(thermalData);

      res.json({
        success: true,
        data: { heatmap },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: (error as Error).message },
      });
    }
  });

  return router;
};

export default ThermalImageService;
