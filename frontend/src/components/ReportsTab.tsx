import React, { useState, useEffect } from 'react';
import { generatePDFReport } from '../services/pdfReportGenerator';
import ExportDialog from './ExportDialog';

interface ReportsTabProps {
  projectId: string;
  projectName: string;
  buildingName: string;
  allAnnotations: any[];
  stats: any;
  media: any[];
}

const ReportsTab: React.FC<ReportsTabProps> = ({
  projectId,
  projectName,
  buildingName,
  allAnnotations,
  stats,
  media,
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [phases, setPhases] = useState<string[]>([]);
  const [floors, setFloors] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  // ========== DEBUG: Log all annotations on mount ==========
  useEffect(() => {
    console.log('='.repeat(60));
    console.log('📊 ALL ANNOTATIONS IN REPORT TAB:');
    console.log('Total count:', allAnnotations.length);
    console.log('Annotations:');
    allAnnotations.forEach((a, idx) => {
      console.log(`  [${idx}] #${a.globalDefectNumber} | Phase: "${a.phase}" | Floor: "${a.floor}" | Type: ${a.defectType} | Severity: ${a.severity}`);
    });
    console.log('='.repeat(60));
  }, [allAnnotations]);

  useEffect(() => {
    // Get unique phases from annotations
    const uniquePhases = Array.from(
      new Set(
        allAnnotations
          .map((a) => a.phase)
          .filter((p) => p && p !== 'Unknown Phase')
      )
    ).sort() as string[];
    
    console.log('✅ Unique phases found:', uniquePhases);
    setPhases(uniquePhases);
    
    if (uniquePhases.length > 0) {
      setSelectedPhase(uniquePhases[0]);
    }
  }, [allAnnotations]);

  useEffect(() => {
    // Get unique floors for selected phase
    if (selectedPhase && selectedPhase !== 'all') {
      const uniqueFloors = Array.from(
        new Set(
          allAnnotations
            .filter((a) => a.phase === selectedPhase)
            .map((a) => a.floor)
            .filter((f) => f && f !== 'Unknown Floor')
        )
      ).sort() as string[];
      console.log(`✅ Unique floors for phase "${selectedPhase}":`, uniqueFloors);
      setFloors(uniqueFloors);
      if (uniqueFloors.length > 0) {
        setSelectedFloor(uniqueFloors[0]);
      }
    } else {
      // All phases selected - get all unique floors
      const uniqueFloors = Array.from(
        new Set(
          allAnnotations
            .map((a) => a.floor)
            .filter((f) => f && f !== 'Unknown Floor')
        )
      ).sort() as string[];
      console.log('✅ Unique floors for ALL PHASES:', uniqueFloors);
      setFloors(uniqueFloors);
      if (uniqueFloors.length > 0 && !selectedFloor) {
        setSelectedFloor(uniqueFloors[0]);
      }
    }
  }, [selectedPhase, allAnnotations]);

  // ========== FILTER FUNCTION WITH LOGGING ==========
  const getDefectsForSelection = () => {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 APPLYING FILTER:');
    console.log(`   selectedPhase: "${selectedPhase}"`);
    console.log(`   selectedFloor: "${selectedFloor}"`);
    console.log(`   Total annotations available: ${allAnnotations.length}`);

    let filtered = allAnnotations;

    // Filter by phase
    if (selectedPhase && selectedPhase !== 'all') {
      console.log(`\n📍 Filtering by phase: "${selectedPhase}"`);
      const beforePhase = filtered.length;
      filtered = filtered.filter((a) => {
        const match = a.phase === selectedPhase;
        console.log(`   Annotation #${a.globalDefectNumber}: phase="${a.phase}" - ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
        return match;
      });
      console.log(`   Result: ${beforePhase} → ${filtered.length} annotations`);
    } else {
      console.log(`\n📍 Phase filter: DISABLED (All Phases selected)`);
    }

    // Filter by floor
    if (selectedFloor && selectedFloor !== 'all') {
      console.log(`\n🏢 Filtering by floor: "${selectedFloor}"`);
      const beforeFloor = filtered.length;
      filtered = filtered.filter((a) => {
        const match = a.floor === selectedFloor;
        console.log(`   Annotation #${a.globalDefectNumber}: floor="${a.floor}" - ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
        return match;
      });
      console.log(`   Result: ${beforeFloor} → ${filtered.length} annotations`);
    } else {
      console.log(`\n🏢 Floor filter: DISABLED (All Floors selected)`);
    }

    console.log('\n📊 FINAL RESULT:');
    console.log(`   Filtered count: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log('   Filtered defects:');
      filtered.forEach((d) => {
        console.log(`     - #${d.globalDefectNumber} | ${d.phase} - ${d.floor} | ${d.defectType} (${d.severity})`);
      });
    }
    console.log('='.repeat(60) + '\n');

    return filtered;
  };

  const handleExportPDF = async (exportConfig: any) => {
    setExportLoading(true);
    try {
      const defects = getDefectsForSelection();
      console.log('Exporting PDF with defects:', defects.length);
      console.log('Media available:', media.length);
      console.log('Image types selected:', exportConfig.imageTypes);
      
      await generatePDFReport({
        projectName,
        buildingName,
        projectId,
        phase: selectedPhase === 'all' ? null : selectedPhase,
        floor: selectedFloor === 'all' ? null : selectedFloor,
        allAnnotations: defects,
        media: media || [],
        imageTypes: exportConfig.imageTypes || [],
      });

    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportLoading(false);
      setShowExportDialog(false);
    }
  };

  const filteredDefects = getDefectsForSelection();
  const severityCounts = {
    CRITICAL: filteredDefects.filter((d) => d.severity === 'CRITICAL').length,
    HIGH: filteredDefects.filter((d) => d.severity === 'HIGH').length,
    MEDIUM: filteredDefects.filter((d) => d.severity === 'MEDIUM').length,
    LOW: filteredDefects.filter((d) => d.severity === 'LOW').length,
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Inspection Reports</h2>
        <p style={styles.subtitle}>
          Generate professional PDF reports organized by Phase & Floor
        </p>
      </div>

      {/* Selection Section */}
      <div style={styles.selectionSection}>
        <div style={styles.selectionGrid}>
          {/* Phase Selection */}
          <div style={styles.filterGroup}>
            <label style={styles.label}>Select Phase:</label>
            <select
              value={selectedPhase || ''}
              onChange={(e) => {
                const newPhase = e.target.value === '' ? 'all' : e.target.value;
                console.log('🔄 Phase changed to:', newPhase);
                setSelectedPhase(newPhase);
              }}
              style={styles.select}
            >
              <option value="">📋 All Phases</option>
              {phases.map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </div>

          {/* Floor Selection */}
          <div style={styles.filterGroup}>
            <label style={styles.label}>Select Floor:</label>
            <select
              value={selectedFloor || ''}
              onChange={(e) => {
                const newFloor = e.target.value === '' ? 'all' : e.target.value;
                console.log('🔄 Floor changed to:', newFloor);
                setSelectedFloor(newFloor);
              }}
              style={styles.select}
            >
              <option value="">🏢 All Floors</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </select>
          </div>

          {/* Building Selection Note */}
          <div style={styles.filterGroup}>
            <label style={styles.label}>Report Scope:</label>
            <div
              style={{
                padding: '10px',
                backgroundColor: '#E8F4F8',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#0066cc',
                fontWeight: '600',
              }}
            >
              {selectedPhase === 'all' && selectedFloor === 'all'
                ? '🏢 Entire Building'
                : selectedPhase === 'all'
                ? '📋 All Phases'
                : selectedFloor === 'all'
                ? `${selectedPhase} - All Floors`
                : `${selectedPhase} - ${selectedFloor}`}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {filteredDefects.length > 0 && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{filteredDefects.length}</div>
              <div style={styles.statLabel}>Total Defects</div>
            </div>
            <div style={{ ...styles.statCard, borderColor: '#DC143C' }}>
              <div style={{ ...styles.statValue, color: '#DC143C' }}>
                {severityCounts.CRITICAL}
              </div>
              <div style={styles.statLabel}>Critical</div>
            </div>
            <div style={{ ...styles.statCard, borderColor: '#FF6600' }}>
              <div style={{ ...styles.statValue, color: '#FF6600' }}>
                {severityCounts.HIGH}
              </div>
              <div style={styles.statLabel}>High</div>
            </div>
            <div style={{ ...styles.statCard, borderColor: '#FFC107' }}>
              <div style={{ ...styles.statValue, color: '#FFC107' }}>
                {severityCounts.MEDIUM}
              </div>
              <div style={styles.statLabel}>Medium</div>
            </div>
            <div style={{ ...styles.statCard, borderColor: '#4CAF50' }}>
              <div style={{ ...styles.statValue, color: '#4CAF50' }}>
                {severityCounts.LOW}
              </div>
              <div style={styles.statLabel}>Low</div>
            </div>
          </div>
        )}
      </div>

      {/* Export Button - ONLY PDF */}
      <div style={styles.exportSection}>
        <button
          onClick={() => setShowExportDialog(true)}
          disabled={filteredDefects.length === 0 || exportLoading}
          style={{
            ...styles.exportButton,
            ...(filteredDefects.length === 0 || exportLoading
              ? styles.exportButtonDisabled
              : {}),
          }}
        >
          {exportLoading ? '⏳ Generating PDF...' : '📄 Export as PDF'}
        </button>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          onExportPDF={handleExportPDF}
          onExportExcel={undefined}
          onCancel={() => setShowExportDialog(false)}
          loading={exportLoading}
        />
      )}

      {/* Defects Preview */}
      {filteredDefects.length > 0 && (
        <div style={styles.previewSection}>
          <h3 style={styles.previewTitle}>
            📋 Preview: Defects to be included in report ({filteredDefects.length})
          </h3>
          <div style={styles.defectGrid}>
            {filteredDefects.map((defect, idx) => (
              <div key={defect.id} style={styles.defectCard}>
                <div
                  style={{
                    ...styles.defectNumber,
                    backgroundColor:
                      defect.severity === 'CRITICAL'
                        ? '#DC143C'
                        : defect.severity === 'HIGH'
                        ? '#FF6600'
                        : defect.severity === 'MEDIUM'
                        ? '#FFC107'
                        : '#4CAF50',
                  }}
                >
                  {defect.globalDefectNumber || idx + 1}
                </div>
                <div style={styles.defectInfo}>
                  <p style={styles.defectType}>{defect.defectType}</p>
                  <p style={styles.defectSeverity}>
                    {defect.severity === 'MEDIUM' ? '🟡' : '●'}{' '}
                    {defect.severity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredDefects.length === 0 && (
        <div style={styles.emptyState}>
          <p>No defects found for the selected phase and floor.</p>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0',
  },
  selectionSection: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
  },
  statCard: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '6px',
    textAlign: 'center',
    border: '2px solid #eee',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 8px 0',
  },
  statLabel: {
    fontSize: '11px',
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  exportSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  exportButton: {
    padding: '12px 24px',
    backgroundColor: '#0066cc',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  exportButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  previewSection: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  previewTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 16px 0',
  },
  defectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  },
  defectCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    border: '1px solid #eee',
  },
  defectNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
    flexShrink: 0,
  },
  defectInfo: {
    flex: 1,
  },
  defectType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 4px 0',
  },
  defectSeverity: {
    fontSize: '11px',
    color: '#666',
    margin: 0,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: '40px 24px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#999',
  },
};

export default ReportsTab;
