/**
 * BASEERA 360 - Report Generation Service
 * Phase 4: Advanced Viewers & Analytics
 * Generates comprehensive PDF inspection reports
 */
import { Router } from 'express';
interface ReportData {
    id: string;
    projectId: string;
    title: string;
    createdAt: Date;
    generatedBy: string;
    projectInfo: {
        name: string;
        buildingName: string;
        location: string;
        clientName: string;
        jobNumber: string;
    };
    summary: {
        totalDefects: number;
        criticalDefects: number;
        highDefects: number;
        mediumDefects: number;
        lowDefects: number;
        resolutionRate: number;
    };
    sections: Array<{
        id: string;
        title: string;
        content: string;
        type: 'text' | 'table' | 'chart' | 'image';
        data?: any;
    }>;
    defectAnalysis: Array<{
        category: string;
        count: number;
        severity: string;
        recommendations: string[];
        estimatedCost: number;
    }>;
    photos: Array<{
        url: string;
        caption: string;
        location: string;
    }>;
    conclusion: string;
    nextSteps: string[];
}
/**
 * Report Generation Service
 * Creates comprehensive inspection reports in PDF format
 */
export declare class ReportService {
    /**
     * Generate report summary from defect data
     */
    static generateSummary(defects: any[]): ReportData['summary'];
    /**
     * Analyze defects by category
     */
    static analyzeByCateogry(defects: any[]): ReportData['defectAnalysis'];
    /**
     * Generate report content
     */
    static generateReportContent(data: Partial<ReportData>): ReportData['sections'];
    /**
     * Generate PDF from report data
     */
    static generatePDF(reportData: ReportData): Promise<Buffer>;
    /**
     * Generate Excel report
     */
    static generateExcel(reportData: ReportData): Promise<Buffer>;
}
/**
 * Report Generation Routes
 */
export declare const createReportRoutes: (db: any) => Router;
export default ReportService;
//# sourceMappingURL=report.service.d.ts.map