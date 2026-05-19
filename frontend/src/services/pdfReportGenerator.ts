import jsPDF from 'jspdf';

interface PDFReportConfig {
  projectName: string;
  buildingName: string;
  projectId: string;
  phase: string | null;
  floor: string | null;
  allAnnotations: any[];
  media: any[];
  imageTypes: string[];
}

const getSeverityColor = (severity: string) => {
  const colors: Record<string, number[]> = {
    CRITICAL: [220, 20, 60],
    HIGH: [255, 102, 0],
    MEDIUM: [255, 193, 7],
    LOW: [76, 175, 80],
  };
  return colors[severity] || [100, 100, 100];
};

const getRecommendation = (severity: string) => {
  const recommendations: Record<string, string> = {
    CRITICAL: 'Immediate attention required. These defects may compromise building safety. Professional remediation is essential. Address within 7 days.',
    HIGH: 'High priority repairs needed. May lead to accelerated deterioration if left unattended. Schedule repairs with qualified contractors. Address within 30 days.',
    MEDIUM: 'Medium priority repairs. Include in your planned maintenance schedule. Group similar repairs for cost efficiency. Address within 60-90 days.',
    LOW: 'Low priority issues. Monitor regularly during routine inspections. Address opportunistically when other work is being done.',
  };
  return recommendations[severity] || 'Take appropriate action.';
};

export const generatePDFReport = async (config: PDFReportConfig) => {
  try {
    const { projectName, buildingName, phase, floor, allAnnotations, media, imageTypes } = config;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    }) as any;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;

    // ========== PAGE 1: COVER PAGE ==========
    let pageY = 30;

    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, pageWidth, 60, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(42);
    doc.setTextColor(255, 255, 255);
    doc.text('BASEERA 360', margin, 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(200, 220, 255);
    doc.text('Professional Facade Inspection Report', margin, 48);

    pageY = 70;

    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(2);
    doc.rect(margin, pageY, contentWidth, 70, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('PROJECT INFORMATION', margin + 6, pageY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    pageY += 18;

    doc.text(`Building:`, margin + 6, pageY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${buildingName}`, margin + 40, pageY);

    pageY += 9;
    doc.setFont('helvetica', 'normal');
    doc.text(`Project:`, margin + 6, pageY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${projectName}`, margin + 40, pageY);

    pageY += 9;
    const scopeText = phase && floor
      ? `${phase} - ${floor}`
      : phase
      ? `${phase} - All Floors`
      : floor
      ? `All Phases - ${floor}`
      : 'Entire Building';

    doc.setFont('helvetica', 'normal');
    doc.text(`Inspection Scope:`, margin + 6, pageY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${scopeText}`, margin + 40, pageY);

    pageY += 9;
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated:`, margin + 6, pageY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 40, pageY);

    pageY = 160;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('DEFECT SUMMARY', margin, pageY);
    pageY += 15;

    const stats = [
      { label: 'Total Defects', value: allAnnotations.length, color: [100, 100, 100] },
      { label: 'Critical', value: allAnnotations.filter(a => a.severity === 'CRITICAL').length, color: [220, 20, 60] },
      { label: 'High Priority', value: allAnnotations.filter(a => a.severity === 'HIGH').length, color: [255, 102, 0] },
      { label: 'Medium Priority', value: allAnnotations.filter(a => a.severity === 'MEDIUM').length, color: [255, 193, 7] },
      { label: 'Low Priority', value: allAnnotations.filter(a => a.severity === 'LOW').length, color: [76, 175, 80] },
    ];

    stats.forEach((stat, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const boxX = margin + (col * (contentWidth / 2 + 2));
      const boxY = pageY + (row * 22);

      doc.setFillColor(...stat.color, 0.1);
      doc.setDrawColor(...stat.color);
      doc.setLineWidth(1.5);
      doc.rect(boxX, boxY, contentWidth / 2 - 2, 20, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(...stat.color);
      doc.text(String(stat.value), boxX + 8, boxY + 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(stat.label, boxX + 30, boxY + 15);
    });

    pageY = 250;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Comprehensive facade inspection and defect analysis', margin, pageY);

    // ========== DEFECT PAGES ==========

    const sortedDefects = [...allAnnotations].sort((a, b) => {
      const numA = a.globalDefectNumber || 999;
      const numB = b.globalDefectNumber || 999;
      return numA - numB;
    });

    for (const defect of sortedDefects) {
      doc.addPage();
      pageY = 12;

      const color = getSeverityColor(defect.severity);

      // Header
      doc.setFillColor(...color);
      doc.rect(0, 0, pageWidth, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(`DEFECT #${defect.globalDefectNumber || 1}`, margin, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`${defect.defectType}`, margin + 60, 16);

      pageY = 28;

      // Details Section
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, pageY, contentWidth, 2, 'F');

      pageY += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 102, 204);
      doc.text('DETAILS & LOCATION', margin, pageY);

      pageY += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);

      const detailsText = [
        { label: 'Location:', value: `${defect.phase || 'Unknown'} - ${defect.floor || 'Unknown'}` },
        { label: 'Type:', value: defect.defectType },
        { label: 'Severity:', value: defect.severity },
      ];

      detailsText.forEach((detail) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}`, margin + 6, pageY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${detail.value}`, margin + 40, pageY);
        pageY += 7;
      });

      pageY += 5;

      // Description
      if (defect.description) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('Description:', margin + 6, pageY);
        pageY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        const descLines = doc.splitTextToSize(defect.description, contentWidth - 12);
        doc.text(descLines, margin + 6, pageY);
        pageY += descLines.length * 4 + 3;
      }

      pageY += 5;

      // Recommendation
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, pageY, contentWidth, 2, 'F');

      pageY += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...color);
      doc.text('RECOMMENDED ACTION', margin, pageY);

      pageY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      const recLines = doc.splitTextToSize(
        getRecommendation(defect.severity),
        contentWidth - 12
      );
      doc.text(recLines, margin + 6, pageY);
      pageY += recLines.length * 4 + 5;

      // Remedial Action
      if (defect.remedialAction) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('Remedial Action:', margin + 6, pageY);
        pageY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        const actionLines = doc.splitTextToSize(defect.remedialAction, contentWidth - 12);
        doc.text(actionLines, margin + 6, pageY);
        pageY += actionLines.length * 4 + 5;
      }

      pageY += 3;

      // ========== ANNOTATED IMAGES ==========

      const defectImages = media.filter((m: any) => m.id === defect.mediaId);
      const relevantImages = defectImages.filter((m: any) => {
        if (imageTypes.length === 0) return false;
        return imageTypes.includes(m.type);
      });

      if (relevantImages.length > 0) {
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, pageY, contentWidth, 2, 'F');
        pageY += 8;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 102, 204);
        doc.text('ANNOTATED IMAGES', margin, pageY);

        pageY += 10;

        for (const imgItem of relevantImages) {
          // Check if need new page
          if (pageY + 100 > pageHeight - 10) {
            doc.addPage();
            pageY = 15;
          }

          // Image label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`${imgItem.type.toUpperCase()} IMAGE - WITH ANNOTATIONS`, margin, pageY);
          pageY += 8;

          try {
            // Use annotated image if available, otherwise use raw image
            const imageToDisplay = defect.annotatedImageData || imgItem.imageData;

            const img = new Image();
            const imgLoadPromise = new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = imageToDisplay;
            });

            await imgLoadPromise;

            const imgWidth = img.width;
            const imgHeight = img.height;
            const aspectRatio = imgHeight / imgWidth;

            // Calculate dimensions to fit in PDF
            let pdfWidth = contentWidth;
            let pdfHeight = pdfWidth * aspectRatio;

            // If height exceeds available space, scale down
            const maxHeight = pageHeight - pageY - 15;
            if (pdfHeight > maxHeight) {
              pdfHeight = maxHeight;
              pdfWidth = pdfHeight / aspectRatio;
            }

            // Center image horizontally
            const xOffset = (contentWidth - pdfWidth) / 2;

            // Add annotated image
            doc.addImage(
              imageToDisplay,
              'JPEG',
              margin + xOffset,
              pageY,
              pdfWidth,
              pdfHeight
            );

            pageY += pdfHeight + 8;

            // Image info
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `${imgItem.type.toUpperCase()} | ${imgItem.uploadedAt || 'N/A'} | With Annotations`,
              margin,
              pageY
            );
            pageY += 5;
          } catch (error) {
            console.warn(`Could not add image: ${error}`);

            // Placeholder
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(1);
            doc.rect(margin, pageY, contentWidth, 50);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('[Image Not Available]', margin + contentWidth / 2, pageY + 25, {
              align: 'center',
            });

            pageY += 55;
          }

          pageY += 3;
        }
      }
    }

    // ========== SUMMARY PAGE ==========
    doc.addPage();
    pageY = 20;

    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('ACTION PLAN BY SEVERITY', margin, 16);

    pageY = 35;

    const actionPlans = [
      {
        severity: 'CRITICAL',
        count: allAnnotations.filter((a: any) => a.severity === 'CRITICAL').length,
        timeline: 'Within 7 Days',
        action: 'Immediate professional remediation required. These defects may compromise building safety or structural integrity.',
      },
      {
        severity: 'HIGH',
        count: allAnnotations.filter((a: any) => a.severity === 'HIGH').length,
        timeline: 'Within 30 Days',
        action: 'High priority repairs. May lead to accelerated deterioration. Contact qualified contractors for assessment and quotes.',
      },
      {
        severity: 'MEDIUM',
        count: allAnnotations.filter((a: any) => a.severity === 'MEDIUM').length,
        timeline: 'Within 60-90 Days',
        action: 'Include in planned maintenance schedule. Group similar repairs to optimize costs and minimize disruption.',
      },
      {
        severity: 'LOW',
        count: allAnnotations.filter((a: any) => a.severity === 'LOW').length,
        timeline: 'Ongoing Monitoring',
        action: 'Monitor regularly during routine inspections. Address opportunistically when other maintenance work is scheduled.',
      },
    ];

    actionPlans.forEach((plan) => {
      if (plan.count === 0) return;

      if (pageY > 240) {
        doc.addPage();
        pageY = 20;
      }

      const color = getSeverityColor(plan.severity);

      doc.setFillColor(...color, 0.12);
      doc.setDrawColor(...color);
      doc.setLineWidth(2);
      doc.rect(margin, pageY, contentWidth, 40, 'FD');

      doc.setFillColor(...color);
      doc.rect(margin, pageY, 4, 40, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...color);
      doc.text(`${plan.severity} PRIORITY - ${plan.count} Defect${plan.count !== 1 ? 's' : ''}`, margin + 8, pageY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Timeline: ${plan.timeline}`, margin + 8, pageY + 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      const actionLines = doc.splitTextToSize(plan.action, contentWidth - 16);
      doc.text(actionLines, margin + 8, pageY + 21);

      pageY += 45;
    });

    // ========== FOOTER ==========
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('BASEERA 360 | Professional Facade Inspection Report', margin, pageHeight - 8);

      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 8);
    }

    // ========== SAVE ==========
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `BASEERA360_${projectName}_${timestamp}.pdf`;

    console.log('✅ Saving PDF:', filename);
    doc.save(filename);
    console.log('✅ PDF generated successfully!');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};