import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDFReport(
  projectName: string,
  jobNumber: string,
  clientName: string,
  companyName: string,
  defects: any[],
  reportConfig: any
) {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // PAGE 1: COVER PAGE
    addCoverPage(pdf, pageWidth, pageHeight, projectName, jobNumber, clientName, companyName);

    // PAGE 2: EXECUTIVE SUMMARY
    pdf.addPage();
    addExecutiveSummary(pdf, pageWidth, pageHeight, margin, defects, reportConfig);

    // PAGE 3+: DEFECT DETAILS (one per page)
    for (let i = 0; i < defects.length; i++) {
      pdf.addPage();
      await addDefectPage(pdf, pageWidth, pageHeight, margin, defects[i], i + 1);
    }

    // FINAL PAGE: CONCLUSIONS
    pdf.addPage();
    addConclusionsPage(pdf, pageWidth, pageHeight, margin, reportConfig);

    // Save PDF
    pdf.save(`${jobNumber}_${projectName}_Report.pdf`);
    console.log('PDF Report generated successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// ============ COVER PAGE ============
function addCoverPage(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  projectName: string,
  jobNumber: string,
  clientName: string,
  companyName: string
) {
  const margin = 15;

  // Background: Gradient-like effect with dark blue
  pdf.setFillColor(26, 26, 26); // Dark background
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Red accent bar at top
  pdf.setFillColor(220, 20, 60); // Crimson red
  pdf.rect(0, 0, pageWidth, 40, 'F');

  // Logo / Company Name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BASEERA 360', margin, 25);

  // Title
  pdf.setFillColor(255, 255, 255);
  pdf.setTextColor(26, 26, 26);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FACADE INSPECTION REPORT', margin, 80);

  // Project Details
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  const detailsStartY = 110;
  const lineHeight = 8;

  pdf.text(`Project: ${projectName}`, margin, detailsStartY);
  pdf.text(`Job Number: ${jobNumber}`, margin, detailsStartY + lineHeight * 1.5);
  pdf.text(`Client: ${clientName}`, margin, detailsStartY + lineHeight * 3);
  pdf.text(`Company: ${companyName}`, margin, detailsStartY + lineHeight * 4.5);

  // Divider
  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(1);
  pdf.line(margin, detailsStartY + lineHeight * 6.5, pageWidth - margin, detailsStartY + lineHeight * 6.5);

  // Date and Document Info
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(10);
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  pdf.text(`Report Date: ${today}`, margin, detailsStartY + lineHeight * 8);
  pdf.text(`Document Version: 1.0`, margin, detailsStartY + lineHeight * 9.5);

  // Footer
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(9);
  pdf.text('© 2026 Baseera 360 - All Rights Reserved', margin, pageHeight - 15);
  pdf.text('Confidential - For Authorized Use Only', margin, pageHeight - 10);
}

// ============ EXECUTIVE SUMMARY ============
function addExecutiveSummary(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  defects: any[],
  reportConfig: any
) {
  let yPosition = margin + 10;
  const lineHeight = 6;
  const sectionSpacing = 8;

  // Title
  pdf.setTextColor(220, 20, 60);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXECUTIVE SUMMARY', margin, yPosition);
  yPosition += sectionSpacing;

  // Divider
  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += sectionSpacing;

  // Project Overview
  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Project Overview', margin, yPosition);
  yPosition += lineHeight + 2;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Building: ${reportConfig.buildingName || 'N/A'}`, margin + 3, yPosition);
  yPosition += lineHeight;
  pdf.text(`Location: ${reportConfig.projectLocation || 'N/A'}`, margin + 3, yPosition);
  yPosition += lineHeight;
  pdf.text(`Facade Type: ${reportConfig.facadeType || 'N/A'}`, margin + 3, yPosition);
  yPosition += lineHeight + sectionSpacing;

  // Defect Summary
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(50, 50, 50);
  pdf.text('Defect Summary', margin, yPosition);
  yPosition += lineHeight + 2;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const totalDefects = defects.length;
  const criticalCount = defects.filter((d) => d.severity === 'CRITICAL').length;
  const highCount = defects.filter((d) => d.severity === 'HIGH').length;
  const mediumCount = defects.filter((d) => d.severity === 'MEDIUM').length;
  const lowCount = defects.filter((d) => d.severity === 'LOW').length;

  // Use simple text rendering
  pdf.setTextColor(26, 26, 26);
  pdf.text(`Total Defects Found: ${totalDefects}`, margin + 3, yPosition);
  yPosition += lineHeight;

  // Severity breakdown
  pdf.setTextColor(220, 20, 60);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`CRITICAL: ${criticalCount} defect(s)`, margin + 3, yPosition);
  yPosition += lineHeight;

  pdf.setTextColor(255, 68, 68);
  pdf.text(`HIGH: ${highCount} defect(s)`, margin + 3, yPosition);
  yPosition += lineHeight;

  pdf.setTextColor(249, 115, 22);
  pdf.text(`MEDIUM: ${mediumCount} defect(s)`, margin + 3, yPosition);
  yPosition += lineHeight;

  pdf.setTextColor(234, 179, 8);
  pdf.text(`LOW: ${lowCount} defect(s)`, margin + 3, yPosition);
  yPosition += lineHeight + sectionSpacing;

  // Inspection Team
  pdf.setTextColor(50, 50, 50);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Inspection Team', margin, yPosition);
  yPosition += lineHeight + 2;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Drone Pilot: ${reportConfig.dronePilotName || 'N/A'}`, margin + 3, yPosition);
  yPosition += lineHeight;
  pdf.text(`QA Verified By: ${reportConfig.qaVerifiedBy || 'N/A'}`, margin + 3, yPosition);
  yPosition += lineHeight;
  pdf.text(`Engineer: ${reportConfig.engineerName || 'N/A'}`, margin + 3, yPosition);

  // Reset colors
  pdf.setTextColor(0, 0, 0);
}

// ============ DEFECT DETAIL PAGE ============
async function addDefectPage(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  defect: any,
  defectNumber: number
) {
  let yPosition = margin + 10;
  const lineHeight = 6;
  const sectionSpacing = 8;

  // Title
  pdf.setTextColor(220, 20, 60);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Defect #${defectNumber}`, margin, yPosition);
  yPosition += sectionSpacing;

  // Divider
  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += sectionSpacing;

  // Defect Type & Severity Box
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 20, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 20);

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Type: ${defect.defectType || 'Unknown'}`, margin + 5, yPosition + 4);
  pdf.text(`Severity: ${defect.severity || 'N/A'}`, margin + 5, yPosition + 10);
  pdf.text(`Image Type: ${defect.imageType?.toUpperCase() || 'N/A'}`, margin + 5, yPosition + 16);

  yPosition += 25;

  // Image
  if (defect.imageData) {
    try {
      const imgWidth = 80;
      const imgHeight = 60;
      const imgX = margin;
      const imgY = yPosition;

      // Add border around image
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(imgX - 1, imgY - 1, imgWidth + 2, imgHeight + 2);

      pdf.addImage(defect.imageData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      yPosition += imgHeight + sectionSpacing;
    } catch (error) {
      console.error('Error adding image:', error);
      pdf.setTextColor(200, 0, 0);
      pdf.setFontSize(9);
      pdf.text('Image not available', margin, yPosition);
      yPosition += sectionSpacing;
    }
  }

  // Description
  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Description:', margin, yPosition);
  yPosition += lineHeight;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const descriptionLines = pdf.splitTextToSize(defect.description || 'No description provided', pageWidth - 2 * margin - 3);
  pdf.text(descriptionLines, margin + 3, yPosition);
  yPosition += descriptionLines.length * lineHeight + sectionSpacing;

  // Additional Details
  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Details:', margin, yPosition);
  yPosition += lineHeight;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  if (defect.temperature) {
    pdf.text(`Temperature: ${defect.temperature}°C`, margin + 3, yPosition);
    yPosition += lineHeight;
  }

  pdf.text(`Type of Mark: ${defect.type || 'N/A'}`, margin + 3, yPosition);
  yPosition += lineHeight;

  pdf.text(`Points Marked: ${defect.points?.length || 0}`, margin + 3, yPosition);

  // Reset colors
  pdf.setTextColor(0, 0, 0);
}

// ============ CONCLUSIONS PAGE ============
function addConclusionsPage(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  reportConfig: any
) {
  let yPosition = margin + 10;
  const lineHeight = 6;
  const sectionSpacing = 8;

  // Title
  pdf.setTextColor(220, 20, 60);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONCLUSIONS & RECOMMENDATIONS', margin, yPosition);
  yPosition += sectionSpacing;

  // Divider
  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += sectionSpacing;

  // Summary
  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const conclusionText =
    'This comprehensive facade inspection report provides a detailed analysis of the building exterior condition. ' +
    'All identified defects have been documented with photographic evidence and precise location marking. ' +
    'Recommended remedial actions should be prioritized based on severity levels indicated in this report.';

  const conclusionLines = pdf.splitTextToSize(conclusionText, pageWidth - 2 * margin - 3);
  pdf.text(conclusionLines, margin + 3, yPosition);
  yPosition += conclusionLines.length * lineHeight + sectionSpacing;

  // Recommendations
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Recommendations:', margin, yPosition);
  yPosition += lineHeight + 2;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  const recommendations = [
    '• Address all CRITICAL defects immediately to prevent further deterioration',
    '• Schedule repairs for HIGH severity defects within 30 days',
    '• Monitor MEDIUM severity defects and plan maintenance accordingly',
    '• Document all repairs with before/after photographic evidence',
    '• Conduct periodic follow-up inspections to ensure remedial work quality',
  ];

  recommendations.forEach((rec) => {
    pdf.text(rec, margin + 3, yPosition);
    yPosition += lineHeight + 2;
  });

  yPosition += sectionSpacing;

  // Certification
  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += sectionSpacing;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Report Certification:', margin, yPosition);
  yPosition += lineHeight;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(
    'This report has been prepared by Baseera 360 drone inspection specialists using ' +
      'high-resolution aerial imaging and advanced data processing techniques.',
    margin + 3,
    yPosition
  );
  yPosition += lineHeight * 2;

  pdf.text(`Prepared: ${new Date().toLocaleDateString()}`, margin + 3, yPosition);
  yPosition += lineHeight;
  pdf.text(`Engineer: ${reportConfig.engineerName || 'N/A'}`, margin + 3, yPosition);
  yPosition += lineHeight;
  pdf.text(`QA Verified: ${reportConfig.qaVerifiedBy || 'N/A'}`, margin + 3, yPosition);

  // Reset colors
  pdf.setTextColor(0, 0, 0);
}