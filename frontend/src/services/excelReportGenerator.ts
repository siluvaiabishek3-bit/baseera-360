import * as XLSX from 'xlsx';

interface ExcelReportConfig {
  projectName: string;
  buildingName: string;
  projectId: string;
  phase: string | null;
  floor: string | null;
  allAnnotations: any[];
  media?: any[];
}

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    CRITICAL: 'DC143C',
    HIGH: 'FF6600',
    MEDIUM: 'FFC107',
    LOW: '4CAF50',
  };
  return colors[severity] || '999999';
};

const getRecommendation = (severity: string) => {
  const recommendations: Record<string, string> = {
    CRITICAL: 'Immediate attention required. Address within 7 days.',
    HIGH: 'High priority repairs needed. Address within 30 days.',
    MEDIUM: 'Medium priority repairs. Address within 60-90 days.',
    LOW: 'Low priority issues. Monitor regularly.',
  };
  return recommendations[severity] || 'Take appropriate action.';
};

const borderStyle = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

export const generateExcelReport = async (config: ExcelReportConfig) => {
  try {
    const { projectName, buildingName, projectId, phase, floor, allAnnotations } = config;

    console.log('📊 Generating Excel Report...');
    console.log('   Defects:', allAnnotations.length);

    const wb = XLSX.utils.book_new();

    // ========== SHEET 1: SUMMARY ==========
    const summaryData = [
      ['BASEERA 360 - INSPECTION REPORT'],
      [''],
      ['Project Name:', projectName],
      ['Building Name:', buildingName],
      ['Report Date:', new Date().toLocaleDateString()],
      ['Report Time:', new Date().toLocaleTimeString()],
      ['Inspection Scope:', phase && floor ? `${phase} - ${floor}` : phase ? `${phase} - All Floors` : floor ? `All Phases - ${floor}` : 'Entire Building'],
      [''],
      ['DEFECT SUMMARY'],
      ['Total Defects', allAnnotations.length],
      ['Critical', allAnnotations.filter(a => a.severity === 'CRITICAL').length],
      ['High', allAnnotations.filter(a => a.severity === 'HIGH').length],
      ['Medium', allAnnotations.filter(a => a.severity === 'MEDIUM').length],
      ['Low', allAnnotations.filter(a => a.severity === 'LOW').length],
      [''],
      ['IMPORTANT NOTE:'],
      ['All annotated images with markings are included in the accompanying PDF report.'],
      ['This Excel file provides detailed inspection data for analysis and record-keeping.'],
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 30 }, { wch: 40 }];

    for (let i = 0; i < summaryData.length; i++) {
      const cell0 = XLSX.utils.encode_cell({ r: i, c: 0 });
      const cell1 = XLSX.utils.encode_cell({ r: i, c: 1 });

      if (summaryWs[cell0]) {
        summaryWs[cell0].s = {
          border: borderStyle,
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          font: i === 0 ? { bold: true, size: 14, color: { rgb: 'FFFFFF' } } :
                i === 8 ? { bold: true, size: 11, color: { rgb: 'FFFFFF' } } :
                i === 15 ? { bold: true, size: 11, color: { rgb: 'DC143C' } } :
                { size: 10 },
          fill: i === 0 ? { fgColor: { rgb: '0066CC' }, patternType: 'solid' } :
                i === 8 ? { fgColor: { rgb: '0066CC' }, patternType: 'solid' } :
                i === 15 ? { fgColor: { rgb: 'FFF3CD' }, patternType: 'solid' } :
                i > 8 ? { fgColor: { rgb: 'F5F5F5' }, patternType: 'solid' } :
                undefined,
        };
      }

      if (summaryWs[cell1]) {
        summaryWs[cell1].s = {
          border: borderStyle,
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          font: i === 0 ? { bold: true, size: 14, color: { rgb: 'FFFFFF' } } :
                i === 8 ? { bold: true, size: 11, color: { rgb: 'FFFFFF' } } :
                i === 15 ? { bold: true, size: 11, color: { rgb: 'DC143C' } } :
                { size: 10 },
          fill: i === 0 ? { fgColor: { rgb: '0066CC' }, patternType: 'solid' } :
                i === 8 ? { fgColor: { rgb: '0066CC' }, patternType: 'solid' } :
                i === 15 ? { fgColor: { rgb: 'FFF3CD' }, patternType: 'solid' } :
                i > 8 ? { fgColor: { rgb: 'F5F5F5' }, patternType: 'solid' } :
                undefined,
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    console.log('✅ Summary sheet created');

    // ========== SHEET 2: ALL DEFECTS ==========
    const defectHeaders = ['#', 'Type', 'Severity', 'Phase', 'Floor', 'Description', 'Remedial Action', 'Created'];
    const defectRows = [defectHeaders];

    allAnnotations.forEach((d) => {
      defectRows.push([
        d.globalDefectNumber || '',
        d.defectType || '',
        d.severity || '',
        d.phase || '',
        d.floor || '',
        d.description || '',
        d.remedialAction || '',
        d.createdAt || '',
      ]);
    });

    const defectWs = XLSX.utils.aoa_to_sheet(defectRows);
    defectWs['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 28 }, { wch: 28 }, { wch: 15 }];

    for (let i = 0; i < defectRows.length; i++) {
      for (let j = 0; j < defectHeaders.length; j++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
        if (defectWs[cellRef]) {
          const severity = i > 0 ? defectRows[i][2] : '';
          const sevColor = severity ? getSeverityColor(severity as string) : '0066CC';

          defectWs[cellRef].s = {
            border: borderStyle,
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            font: i === 0 ? { bold: true, color: { rgb: 'FFFFFF' }, size: 11 } :
                  j === 2 ? { bold: true, color: { rgb: 'FFFFFF' }, size: 10 } :
                  { size: 10 },
            fill: i === 0 ? { fgColor: { rgb: '0066CC' }, patternType: 'solid' } :
                  j === 2 ? { fgColor: { rgb: sevColor }, patternType: 'solid' } :
                  { fgColor: { rgb: i % 2 === 0 ? 'FFFFFF' : 'F8F8F8' }, patternType: 'solid' },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, defectWs, 'All Defects');
    console.log('✅ All Defects sheet created');

    // ========== SHEET 3: DETAILED DEFECTS ==========
    const detailedData: any[] = [];

    allAnnotations.forEach((d, idx) => {
      detailedData.push([`DEFECT #${d.globalDefectNumber || idx + 1}`, '']);
      detailedData.push(['Type:', d.defectType || '']);
      detailedData.push(['Severity:', d.severity || '']);
      detailedData.push(['Location:', `${d.phase || ''} - ${d.floor || ''}`]);
      detailedData.push(['Description:', d.description || 'N/A']);
      detailedData.push(['Remedial Action:', d.remedialAction || 'N/A']);
      detailedData.push(['Recommended Action:', getRecommendation(d.severity)]);
      detailedData.push(['Created:', d.createdAt || '']);
      detailedData.push(['Annotated Image:', d.annotatedImageData ? 'Yes - See PDF Report' : 'No']);
      detailedData.push(['']);
    });

    const detailedWs = XLSX.utils.aoa_to_sheet(detailedData);
    detailedWs['!cols'] = [{ wch: 25 }, { wch: 50 }];

    for (let i = 0; i < detailedData.length; i++) {
      for (let j = 0; j < 2; j++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
        if (detailedWs[cellRef]) {
          const isHeader = detailedData[i][0]?.startsWith('DEFECT #');
          const isLabel = j === 0 && detailedData[i][0]?.endsWith(':');
          const isImageYes = j === 1 && detailedData[i][j] === 'Yes - See PDF Report';

          detailedWs[cellRef].s = {
            border: borderStyle,
            alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
            font: isHeader ? { bold: true, size: 11, color: { rgb: 'FFFFFF' } } :
                  isLabel ? { bold: true, size: 10, color: { rgb: '0066CC' } } :
                  isImageYes ? { bold: true, size: 10, color: { rgb: '4CAF50' } } :
                  { size: 10 },
            fill: isHeader ? { fgColor: { rgb: getSeverityColor(detailedData[i][1] || 'MEDIUM') }, patternType: 'solid' } :
                  isLabel ? { fgColor: { rgb: 'F0F0F0' }, patternType: 'solid' } :
                  isImageYes ? { fgColor: { rgb: 'E8F8E8' }, patternType: 'solid' } :
                  { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed Defects');
    console.log('✅ Detailed Defects sheet created');

    // ========== SHEET 4: BY SEVERITY ==========
    const severityData = [['SEVERITY', 'COUNT', 'PERCENTAGE', 'TIMELINE']];
    let totalCount = allAnnotations.length;

    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach((sev) => {
      const count = allAnnotations.filter(a => a.severity === sev).length;
      const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0';
      const timeline = sev === 'CRITICAL' ? 'Within 7 days' :
                       sev === 'HIGH' ? 'Within 30 days' :
                       sev === 'MEDIUM' ? 'Within 60-90 days' : 'Ongoing';
      severityData.push([sev, count, `${pct}%`, timeline]);
    });

    const severityWs = XLSX.utils.aoa_to_sheet(severityData);
    severityWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 18 }];

    for (let i = 0; i < severityData.length; i++) {
      for (let j = 0; j < 4; j++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
        if (severityWs[cellRef]) {
          const color = i > 0 ? getSeverityColor(severityData[i][0]) : '0066CC';
          severityWs[cellRef].s = {
            border: borderStyle,
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            font: { bold: true, color: { rgb: 'FFFFFF' }, size: 10 },
            fill: { fgColor: { rgb: color }, patternType: 'solid' },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, severityWs, 'By Severity');
    console.log('✅ By Severity sheet created');

    // ========== SHEET 5: BY TYPE ==========
    const typeMap = new Map<string, number>();
    allAnnotations.forEach((a) => {
      typeMap.set(a.defectType || 'Unknown', (typeMap.get(a.defectType || 'Unknown') || 0) + 1);
    });

    const typeData = [['DEFECT TYPE', 'COUNT', 'PERCENTAGE']];
    const typeEntries = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]);

    typeEntries.forEach(([type, count]) => {
      const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0';
      typeData.push([type, count, `${pct}%`]);
    });

    const typeWs = XLSX.utils.aoa_to_sheet(typeData);
    typeWs['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 15 }];

    for (let i = 0; i < typeData.length; i++) {
      for (let j = 0; j < 3; j++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
        if (typeWs[cellRef]) {
          typeWs[cellRef].s = {
            border: borderStyle,
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            font: i === 0 ? { bold: true, color: { rgb: 'FFFFFF' }, size: 11 } : { size: 10 },
            fill: i === 0 ? { fgColor: { rgb: '0066CC' }, patternType: 'solid' } :
                  { fgColor: { rgb: i % 2 === 0 ? 'FFFFFF' : 'F8F8F8' }, patternType: 'solid' },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, typeWs, 'By Type');
    console.log('✅ By Type sheet created');

    // ========== SHEET 6: ACTION PLAN ==========
    const actionData = [
      ['PRIORITY LEVEL', 'COUNT', 'TIMELINE', 'RECOMMENDED ACTION'],
      ['CRITICAL', allAnnotations.filter(a => a.severity === 'CRITICAL').length, 'Within 7 days', 'Immediate professional remediation required. These defects may compromise building safety.'],
      ['HIGH', allAnnotations.filter(a => a.severity === 'HIGH').length, 'Within 30 days', 'High priority repairs with qualified contractors. May lead to accelerated deterioration.'],
      ['MEDIUM', allAnnotations.filter(a => a.severity === 'MEDIUM').length, 'Within 60-90 days', 'Include in planned maintenance schedule. Group similar repairs for cost efficiency.'],
      ['LOW', allAnnotations.filter(a => a.severity === 'LOW').length, 'Ongoing monitoring', 'Monitor regularly during routine inspections. Address opportunistically.'],
    ];

    const actionWs = XLSX.utils.aoa_to_sheet(actionData);
    actionWs['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 50 }];

    for (let i = 0; i < actionData.length; i++) {
      for (let j = 0; j < 4; j++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
        if (actionWs[cellRef]) {
          const color = i > 0 ? getSeverityColor(actionData[i][0]) : '0066CC';
          actionWs[cellRef].s = {
            border: borderStyle,
            alignment: { horizontal: j === 3 ? 'left' : 'center', vertical: 'center', wrapText: true },
            font: { bold: i === 0, color: { rgb: 'FFFFFF' }, size: 10 },
            fill: { fgColor: { rgb: color }, patternType: 'solid' },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, actionWs, 'Action Plan');
    console.log('✅ Action Plan sheet created');

    // Save
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `BASEERA360_${projectName}_${timestamp}.xlsx`;

    XLSX.writeFile(wb, filename);

    console.log('✅ Excel Report Generated Successfully!');
    console.log(`   📄 File: ${filename}`);
    console.log(`   📊 Sheets: ${wb.SheetNames.length}`);
    console.log(`   📌 Defects: ${allAnnotations.length}`);

  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  }
};