/**
 * BASEERA 360 - Advanced Analytics Service
 * Phase 4: Advanced Viewers & Analytics
 * Generates comprehensive analytics and dashboards
 */
import { Router } from 'express';
interface AnalyticsData {
    projectId: string;
    generatedAt: Date;
    overview: {
        totalDefects: number;
        defectsByStatus: {
            open: number;
            inProgress: number;
            resolved: number;
            closed: number;
        };
        defectsBySeverity: {
            critical: number;
            high: number;
            medium: number;
            low: number;
            info: number;
        };
        defectsByCategory: Record<string, number>;
        resolutionRate: number;
        averageResolutionTime: number;
    };
    trends: {
        defectsOverTime: Array<{
            date: string;
            count: number;
        }>;
        resolutionTrend: Array<{
            date: string;
            percentage: number;
        }>;
        severity: Array<{
            date: string;
            critical: number;
            high: number;
            medium: number;
            low: number;
        }>;
    };
    riskAssessment: {
        overallRiskScore: number;
        criticalAreas: string[];
        estimatedRepairCost: number;
        urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
        maintenancePriority: string[];
    };
    efficiency: {
        inspectionCoverage: number;
        dataQuality: number;
        defectDetectionRate: number;
        averageTimePerZone: number;
    };
    predictions: {
        estimatedDeteriorationRate: number;
        projectedCriticalDefectsIn12Months: number;
        recommendedInspectionFrequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
        lifeExpectancy: number;
    };
    comparison: {
        vs_industry_average: {
            defectDensity: number;
            resolutionRate: number;
            repairCost: number;
        };
        vs_similar_buildings: {
            condition: string;
            ranking: number;
        };
    };
    charts: {
        defectDistribution: Array<{
            name: string;
            value: number;
            percentage: number;
        }>;
        severityBreakdown: Array<{
            severity: string;
            count: number;
            percentage: number;
        }>;
        timelineData: Array<{
            date: string;
            metrics: Record<string, number>;
        }>;
    };
}
/**
 * Advanced Analytics Service
 * Provides comprehensive analytics and insights from inspection data
 */
export declare class AnalyticsService {
    /**
     * Calculate overall risk score
     */
    static calculateRiskScore(overview: AnalyticsData['overview']): number;
    /**
     * Calculate efficiency metrics
     */
    static calculateEfficiency(overview: AnalyticsData['overview']): AnalyticsData['efficiency'];
    /**
     * Generate trend predictions
     */
    static generatePredictions(overview: AnalyticsData['overview']): AnalyticsData['predictions'];
    /**
     * Calculate repair cost estimate
     */
    static calculateRepairCost(overview: AnalyticsData['overview']): number;
    /**
     * Generate comparison metrics
     */
    static generateComparison(overview: AnalyticsData['overview']): AnalyticsData['comparison'];
    /**
     * Generate chart data
     */
    static generateCharts(overview: AnalyticsData['overview']): AnalyticsData['charts'];
    /**
     * Generate comprehensive analytics report
     */
    static generateReport(defects: any[]): AnalyticsData;
}
/**
 * Analytics Routes
 */
export declare const createAnalyticsRoutes: (db: any) => Router;
export default AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map