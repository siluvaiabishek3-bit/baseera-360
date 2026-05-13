"use strict";
/**
 * BASEERA 360 - Advanced Analytics Service
 * Phase 4: Advanced Viewers & Analytics
 * Generates comprehensive analytics and dashboards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsRoutes = exports.AnalyticsService = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
/**
 * Advanced Analytics Service
 * Provides comprehensive analytics and insights from inspection data
 */
class AnalyticsService {
    /**
     * Calculate overall risk score
     */
    static calculateRiskScore(overview) {
        let score = 0;
        // Critical defects heavily weighted
        score += overview.defectsBySeverity.critical * 25;
        // High defects moderately weighted
        score += overview.defectsBySeverity.high * 10;
        // Medium defects lightly weighted
        score += overview.defectsBySeverity.medium * 3;
        // Lower score if resolution rate is high
        const resolutionBonus = overview.resolutionRate * 10;
        score = Math.max(0, Math.min(100, score - resolutionBonus));
        return Math.round(score);
    }
    /**
     * Calculate efficiency metrics
     */
    static calculateEfficiency(overview) {
        const totalDefects = overview.totalDefects;
        const totalArea = 5000; // m² - simplified
        const inspectionHours = 24; // simplified
        return {
            inspectionCoverage: 85, // percentage
            dataQuality: 92, // percentage
            defectDetectionRate: (totalDefects / totalArea) * 1000,
            averageTimePerZone: inspectionHours / 8, // 8 zones
        };
    }
    /**
     * Generate trend predictions
     */
    static generatePredictions(overview) {
        const criticalDefectRate = overview.defectsBySeverity.critical / overview.totalDefects;
        return {
            estimatedDeteriorationRate: 2.5, // % per year
            projectedCriticalDefectsIn12Months: Math.ceil(overview.defectsBySeverity.critical * 1.3),
            recommendedInspectionFrequency: overview.defectsBySeverity.critical > 0 ? 'monthly' : 'quarterly',
            lifeExpectancy: 20, // years
        };
    }
    /**
     * Calculate repair cost estimate
     */
    static calculateRepairCost(overview) {
        // Simplified cost calculation
        const criticalCost = overview.defectsBySeverity.critical * 5000;
        const highCost = overview.defectsBySeverity.high * 2000;
        const mediumCost = overview.defectsBySeverity.medium * 500;
        const lowCost = overview.defectsBySeverity.low * 100;
        return criticalCost + highCost + mediumCost + lowCost;
    }
    /**
     * Generate comparison metrics
     */
    static generateComparison(overview) {
        const defectDensity = overview.totalDefects / 5000; // per 1000m²
        const industryAvgDensity = 0.08;
        const industryAvgResolution = 65;
        const industryAvgCost = 50000;
        return {
            vs_industry_average: {
                defectDensity: (defectDensity / industryAvgDensity) * 100,
                resolutionRate: (overview.resolutionRate / industryAvgResolution) * 100,
                repairCost: (this.calculateRepairCost(overview) / industryAvgCost) * 100,
            },
            vs_similar_buildings: {
                condition: overview.defectsBySeverity.critical > 3
                    ? 'poor'
                    : overview.defectsBySeverity.critical > 1
                        ? 'fair'
                        : overview.defectsBySeverity.high > 5
                            ? 'good'
                            : 'excellent',
                ranking: overview.resolutionRate > 80
                    ? 90
                    : overview.resolutionRate > 60
                        ? 70
                        : overview.resolutionRate > 40
                            ? 50
                            : 30,
            },
        };
    }
    /**
     * Generate chart data
     */
    static generateCharts(overview) {
        const total = overview.totalDefects;
        return {
            defectDistribution: Object.entries(overview.defectsByCategory).map(([name, count]) => ({
                name,
                value: count,
                percentage: (count / total) * 100,
            })),
            severityBreakdown: [
                { severity: 'CRITICAL', count: overview.defectsBySeverity.critical, percentage: (overview.defectsBySeverity.critical / total) * 100 },
                { severity: 'HIGH', count: overview.defectsBySeverity.high, percentage: (overview.defectsBySeverity.high / total) * 100 },
                { severity: 'MEDIUM', count: overview.defectsBySeverity.medium, percentage: (overview.defectsBySeverity.medium / total) * 100 },
                { severity: 'LOW', count: overview.defectsBySeverity.low, percentage: (overview.defectsBySeverity.low / total) * 100 },
            ],
            timelineData: [
                {
                    date: '2024-01-01',
                    metrics: { open: 10, inProgress: 3, resolved: 2 },
                },
                {
                    date: '2024-02-01',
                    metrics: { open: 8, inProgress: 4, resolved: 5 },
                },
                {
                    date: '2024-03-01',
                    metrics: { open: 5, inProgress: 3, resolved: 9 },
                },
            ],
        };
    }
    /**
     * Generate comprehensive analytics report
     */
    static generateReport(defects) {
        const overview = {
            totalDefects: defects.length,
            defectsByStatus: {
                open: defects.filter(d => d.status === 'OPEN').length,
                inProgress: defects.filter(d => d.status === 'IN_PROGRESS').length,
                resolved: defects.filter(d => d.status === 'RESOLVED').length,
                closed: defects.filter(d => d.status === 'CLOSED').length,
            },
            defectsBySeverity: {
                critical: defects.filter(d => d.severity === 'CRITICAL').length,
                high: defects.filter(d => d.severity === 'HIGH').length,
                medium: defects.filter(d => d.severity === 'MEDIUM').length,
                low: defects.filter(d => d.severity === 'LOW').length,
                info: defects.filter(d => d.severity === 'INFO').length,
            },
            defectsByCategory: defects.reduce((acc, d) => {
                acc[d.category] = (acc[d.category] || 0) + 1;
                return acc;
            }, {}),
            resolutionRate: defects.length > 0
                ? Math.round(((defects.filter(d => d.status === 'RESOLVED' || d.status === 'CLOSED').length /
                    defects.length) *
                    100))
                : 0,
            averageResolutionTime: 15, // days
        };
        const riskScore = this.calculateRiskScore(overview);
        return {
            projectId: '',
            generatedAt: new Date(),
            overview,
            trends: {
                defectsOverTime: [
                    { date: '2024-01-01', count: 15 },
                    { date: '2024-02-01', count: 18 },
                    { date: '2024-03-01', count: 17 },
                ],
                resolutionTrend: [
                    { date: '2024-01-01', percentage: 20 },
                    { date: '2024-02-01', percentage: 35 },
                    { date: '2024-03-01', percentage: 53 },
                ],
                severity: [
                    { date: '2024-01-01', critical: 3, high: 5, medium: 5, low: 2 },
                    { date: '2024-02-01', critical: 2, high: 6, medium: 7, low: 3 },
                    { date: '2024-03-01', critical: 1, high: 5, medium: 8, low: 3 },
                ],
            },
            riskAssessment: {
                overallRiskScore: riskScore,
                criticalAreas: ['Main Facade', 'Upper Floors', 'Roof'],
                estimatedRepairCost: this.calculateRepairCost(overview),
                urgencyLevel: riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : 'medium',
                maintenancePriority: [
                    'Address critical structural defects',
                    'Improve waterproofing',
                    'Replace corroded elements',
                ],
            },
            efficiency: this.calculateEfficiency(overview),
            predictions: this.generatePredictions(overview),
            comparison: this.generateComparison(overview),
            charts: this.generateCharts(overview),
        };
    }
}
exports.AnalyticsService = AnalyticsService;
/**
 * Analytics Routes
 */
const createAnalyticsRoutes = (db) => {
    const router = (0, express_1.Router)();
    /**
     * GET /api/analytics/:projectId
     * Get comprehensive analytics
     */
    router.get('/:projectId', auth_1.verifyToken, async (req, res) => {
        try {
            const { projectId } = req.params;
            // Get defect data (would come from database)
            const mockDefects = [
                { category: 'CRACK', severity: 'CRITICAL', status: 'OPEN' },
                { category: 'WATER_DAMAGE', severity: 'HIGH', status: 'IN_PROGRESS' },
                { category: 'CORROSION', severity: 'HIGH', status: 'OPEN' },
                { category: 'SPALLING', severity: 'MEDIUM', status: 'RESOLVED' },
                { category: 'JOINT_FAILURE', severity: 'MEDIUM', status: 'OPEN' },
            ];
            const analytics = AnalyticsService.generateReport(mockDefects);
            analytics.projectId = projectId;
            res.json({
                success: true,
                data: { analytics },
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
     * GET /api/analytics/:projectId/dashboard
     * Get dashboard data
     */
    router.get('/:projectId/dashboard', auth_1.verifyToken, async (req, res) => {
        try {
            const { projectId } = req.params;
            const mockDefects = [
                { category: 'CRACK', severity: 'CRITICAL', status: 'OPEN' },
                { category: 'WATER_DAMAGE', severity: 'HIGH', status: 'IN_PROGRESS' },
            ];
            const analytics = AnalyticsService.generateReport(mockDefects);
            res.json({
                success: true,
                data: {
                    riskScore: analytics.riskAssessment.overallRiskScore,
                    overview: analytics.overview,
                    charts: analytics.charts,
                    riskAssessment: analytics.riskAssessment,
                    trends: analytics.trends,
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
     * GET /api/analytics/:projectId/predictions
     * Get AI predictions
     */
    router.get('/:projectId/predictions', auth_1.verifyToken, async (req, res) => {
        try {
            const { projectId } = req.params;
            const mockDefects = [
                { category: 'CRACK', severity: 'CRITICAL', status: 'OPEN' },
            ];
            const analytics = AnalyticsService.generateReport(mockDefects);
            res.json({
                success: true,
                data: {
                    predictions: analytics.predictions,
                    comparison: analytics.comparison,
                    recommendations: [
                        'Schedule immediate structural assessment',
                        'Plan phased renovation approach',
                        'Increase inspection frequency to monthly',
                    ],
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
exports.createAnalyticsRoutes = createAnalyticsRoutes;
exports.default = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map