import jsPDF from 'jspdf';

export async function generatePDFReport(
  projectName: string,
  jobNumber: string,
  clientName: string,
  companyName: string,
  defects: any[],
  reportConfig: any
) {
  try {
    console.log('=== PDF GENERATION STARTED ===');
    console.log('Project:', projectName);
    console.log('Defects count:', defects.length);
    
    defects.forEach((d, i) => {
      console.log(`Defect ${i}:`, {
        hasImageData: !!d.imageData,
        hasPoints: !!d.points,
        pointsLength: d.points?.length || 0,
        type: d.type,
      });
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    addCoverPage(pdf, pageWidth, pageHeight, projectName, jobNumber, clientName, companyName);
    pdf.addPage();
    addExecutiveSummary(pdf, pageWidth, pageHeight, margin, defects);

    for (let i = 0; i < defects.length; i++) {
      pdf.addPage();
      await addDefectPageWithImage(pdf, pageWidth, pageHeight, margin, defects[i], i + 1);
    }

    pdf.addPage();
    addConclusionsPage(pdf, pageWidth, pageHeight, margin);

    const filename = `${jobNumber}_${projectName}_Report.pdf`;
    pdf.save(filename);
    console.log('=== PDF SAVED SUCCESSFULLY ===', filename);
  } catch (error) {
    console.error('=== PDF GENERATION ERROR ===', error);
    alert('Error generating PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    throw error;
  }
}

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

  pdf.setFillColor(26, 26, 26);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFillColor(220, 20, 60);
  pdf.rect(0, 0, pageWidth, 50, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BASEERA 360', margin, 32);

  pdf.setFillColor(255, 255, 255);
  pdf.setTextColor(26, 26, 26);
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FACADE INSPECTION REPORT', margin, 100);

  pdf.setFillColor(240, 240, 240);
  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(2);
  pdf.rect(margin, 115, pageWidth - 2 * margin, 65, 'FD');

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');

  let detailY = 130;
  pdf.text(`Project Name: ${projectName}`, margin + 8, detailY);
  detailY += 12;
  pdf.text(`Job Number: ${jobNumber}`, margin + 8, detailY);
  detailY += 12;
  pdf.text(`Client: ${clientName}`, margin + 8, detailY);
  detailY += 12;
  pdf.text(`Company: ${companyName}`, margin + 8, detailY);

  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, pageHeight - 15);
  pdf.text(`Report ID: ${jobNumber}-${Date.now()}`, margin, pageHeight - 8);
}

function addExecutiveSummary(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  defects: any[]
) {
  let yPos = margin + 10;

  pdf.setTextColor(220, 20, 60);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXECUTIVE SUMMARY', margin, yPos);
  yPos += 8;

  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(1);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  pdf.setFillColor(245, 245, 245);
  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(1);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 40, 'FD');

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total Defects: ${defects.length}`, margin + 5, yPos + 8);

  const critical = defects.filter(d => d.severity === 'CRITICAL').length;
  const high = defects.filter(d => d.severity === 'HIGH').length;
  const medium = defects.filter(d => d.severity === 'MEDIUM').length;
  const low = defects.filter(d => d.severity === 'LOW').length;

  pdf.setTextColor(220, 20, 60);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(`Critical: ${critical}`, margin + 5, yPos + 18);
  pdf.text(`High: ${high}`, margin + 65, yPos + 18);
  pdf.text(`Medium: ${medium}`, margin + 115, yPos + 18);
  pdf.text(`Low: ${low}`, margin + 165, yPos + 18);
}

async function addDefectPageWithImage(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  defect: any,
  defectNumber: number
) {
  let yPos = margin + 10;

  pdf.setTextColor(220, 20, 60);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`DEFECT #${defectNumber}`, margin, yPos);
  yPos += 7;

  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 7;

  pdf.setFillColor(245, 245, 245);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 18, 'FD');

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Type: ${defect.defectType || 'N/A'}`, margin + 3, yPos + 5);
  pdf.text(`Severity: ${defect.severity || 'N/A'}`, margin + 3, yPos + 11);
  pdf.text(`Location: ${defect.location || 'N/A'}`, pageWidth / 2, yPos + 5);
  pdf.text(`Date: ${new Date(defect.createdAt || Date.now()).toLocaleDateString()}`, pageWidth / 2, yPos + 11);

  yPos += 22;

  if (defect.imageData) {
    try {
      console.log(`Processing image for defect ${defectNumber}...`);
      
      const annotatedImageData = await getAnnotatedImage(defect);
      
      if (annotatedImageData) {
        const imgWidth = 120;
        const imgHeight = 90;
        const imgX = (pageWidth - imgWidth) / 2;
        
        console.log(`Adding annotated image to PDF...`);
        
        pdf.setDrawColor(220, 20, 60);
        pdf.setLineWidth(1.5);
        pdf.rect(imgX - 1, yPos - 1, imgWidth + 2, imgHeight + 2);

        try {
          pdf.addImage(annotatedImageData, 'JPEG', imgX, yPos, imgWidth, imgHeight);
          console.log(`Image added successfully to defect ${defectNumber}`);
        } catch (err) {
          console.error(`Failed to add JPEG:`, err);
          try {
            pdf.addImage(annotatedImageData, 'PNG', imgX, yPos, imgWidth, imgHeight);
          } catch (err2) {
            console.error(`Failed to add PNG:`, err2);
            try {
              pdf.addImage(defect.imageData, 'JPEG', imgX, yPos, imgWidth, imgHeight);
              console.log(`Using original image instead`);
            } catch (err3) {
              console.error(`All image attempts failed:`, err3);
            }
          }
        }
        
        yPos += imgHeight + 8;
      }
    } catch (error) {
      console.error(`Error processing image:`, error);
    }
  }

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Description:', margin, yPos);
  yPos += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const descLines = pdf.splitTextToSize(
    defect.description || 'No description provided',
    pageWidth - 2 * margin - 6
  );
  pdf.text(descLines, margin + 3, yPos);
  yPos += descLines.length * 5 + 5;

  if (defect.temperature || defect.thermalData) {
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Thermal Data:', margin, yPos);
    yPos += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const thermalInfo = defect.thermalData || defect.temperature;
    if (typeof thermalInfo === 'object') {
      let thermalText = '';
      if (thermalInfo.point) thermalText += `Point: ${thermalInfo.point}°C | `;
      if (thermalInfo.max) thermalText += `Max: ${thermalInfo.max}°C | `;
      if (thermalInfo.min) thermalText += `Min: ${thermalInfo.min}°C | `;
      if (thermalInfo.mean) thermalText += `Mean: ${thermalInfo.mean}°C`;
      
      if (thermalText) {
        thermalText = thermalText.replace(/\s*\|\s*$/, '');
        pdf.text(thermalText, margin + 3, yPos);
      }
    } else if (thermalInfo) {
      pdf.text(`${thermalInfo}°C`, margin + 3, yPos);
    }
  }
}

async function getAnnotatedImage(defect: any): Promise<string | null> {
  return new Promise((resolve) => {
    if (defect.annotatedImageData) {
      console.log('Using pre-made annotated image');
      resolve(defect.annotatedImageData);
      return;
    }

    if (!defect.imageData) {
      console.warn('No image data available');
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.warn('Could not get canvas context');
          resolve(defect.imageData);
          return;
        }

        ctx.drawImage(img, 0, 0);

        if (defect.points && Array.isArray(defect.points) && defect.points.length > 0) {
          console.log(`Drawing ${defect.type} annotation with ${defect.points.length} points`);
          
          ctx.strokeStyle = '#DC143C';
          ctx.fillStyle = 'rgba(220, 20, 60, 0.3)';
          ctx.lineWidth = Math.max(3, img.naturalWidth / 100);

          if (defect.type === 'point' && defect.points[0]) {
            const p = defect.points[0];
            const radius = Math.max(8, img.naturalWidth / 80);
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#DC143C';
            ctx.lineWidth = Math.max(3, img.naturalWidth / 100);
            ctx.stroke();
            ctx.fillStyle = 'rgba(220, 20, 60, 0.3)';
            ctx.fill();
          } else if (defect.type === 'circle' && defect.points.length >= 2) {
            const center = defect.points[0];
            const edge = defect.points[1];
            const radius = Math.sqrt(
              Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
            );
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#DC143C';
            ctx.lineWidth = Math.max(3, img.naturalWidth / 100);
            ctx.stroke();
            ctx.fillStyle = 'rgba(220, 20, 60, 0.2)';
            ctx.fill();
          } else if (defect.type === 'rectangle' && defect.points.length >= 2) {
            const start = defect.points[0];
            const end = defect.points[1];
            const width = end.x - start.x;
            const height = end.y - start.y;
            ctx.strokeStyle = '#DC143C';
            ctx.lineWidth = Math.max(3, img.naturalWidth / 100);
            ctx.strokeRect(start.x, start.y, width, height);
            ctx.fillStyle = 'rgba(220, 20, 60, 0.2)';
            ctx.fillRect(start.x, start.y, width, height);
          } else if (defect.type === 'freehand' && defect.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(defect.points[0].x, defect.points[0].y);
            ctx.strokeStyle = '#DC143C';
            ctx.lineWidth = Math.max(4, img.naturalWidth / 80);
            for (let i = 1; i < defect.points.length; i++) {
              ctx.lineTo(defect.points[i].x, defect.points[i].y);
            }
            ctx.stroke();
          }
        }

        const annotatedData = canvas.toDataURL('image/jpeg', 0.85);
        console.log(`Annotated image created, size: ${annotatedData.length}`);
        resolve(annotatedData);
      } catch (err) {
        console.error('Canvas error:', err);
        resolve(defect.imageData);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image');
      resolve(defect.imageData);
    };

    img.src = defect.imageData;
  });
}

function addConclusionsPage(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  pdf.setTextColor(220, 20, 60);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONCLUSIONS & RECOMMENDATIONS', margin, yPos);
  yPos += 8;

  pdf.setDrawColor(220, 20, 60);
  pdf.setLineWidth(1);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary:', margin, yPos);
  yPos += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const summary = 'This facade inspection report provides a comprehensive analysis of building defects identified during the inspection. All findings have been documented with photographic evidence and severity classifications.';
  const summaryLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin - 6);
  pdf.text(summaryLines, margin + 3, yPos);
  yPos += summaryLines.length * 5 + 5;

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Recommendations:', margin, yPos);
  yPos += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const recs = [
    '• CRITICAL defects require immediate remediation.',
    '• HIGH priority defects should be addressed within 30 days.',
    '• MEDIUM priority defects within 60-90 days.',
    '• LOW priority defects to be monitored and addressed during routine maintenance.',
  ];

  recs.forEach((rec) => {
    pdf.text(rec, margin + 3, yPos);
    yPos += 5;
  });

  yPos = pageHeight - 50;
  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Report prepared by:', margin, yPos);
  pdf.text('_____________________', margin, yPos + 8);
  pdf.text('Drone Pilot', margin, yPos + 12);

  pdf.text('Verified by:', pageWidth / 2, yPos);
  pdf.text('_____________________', pageWidth / 2, yPos + 8);
  pdf.text('QA/QC Engineer', pageWidth / 2, yPos + 12);

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, pageHeight - 5);
}