import React, { useState } from 'react';

interface ExportDialogProps {
  onExportPDF: (config: any) => void;
  onExportExcel?: (config: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  onExportPDF,
  onCancel,
  loading,
}) => {
  const [imageTypes, setImageTypes] = useState<string[]>(['rgb', 'thermal', 'annotated']);

  const handleImageTypeChange = (type: string) => {
    setImageTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <div style={styles.header}>
          <h2 style={styles.title}>📄 Export Inspection Report</h2>
          <p style={styles.subtitle}>Select options for your PDF report</p>
        </div>

        <div style={styles.content}>
          {/* Image Type Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Include Images in Report:</h3>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={imageTypes.includes('annotated')}
                  onChange={() => handleImageTypeChange('annotated')}
                  style={styles.checkbox}
                />
                <span>Annotated Images (with markings)</span>
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={imageTypes.includes('rgb')}
                  onChange={() => handleImageTypeChange('rgb')}
                  style={styles.checkbox}
                />
                <span>Original RGB Images</span>
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={imageTypes.includes('thermal')}
                  onChange={() => handleImageTypeChange('thermal')}
                  style={styles.checkbox}
                />
                <span>Thermal Images</span>
              </label>
            </div>
          </div>

          {/* Info */}
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              ℹ️ Annotated images include all defect markings and numbers for easy reference.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttons}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ ...styles.button, ...styles.cancelButton }}
          >
            Cancel
          </button>
          <button
            onClick={() => onExportPDF({ imageTypes })}
            disabled={loading}
            style={{ ...styles.button, ...styles.exportButton }}
          >
            {loading ? '⏳ Generating...' : '📄 Export as PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    maxWidth: '500px',
    width: '90%',
    overflow: 'auto',
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#0066CC',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: '0',
  },
  content: {
    padding: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#333',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  infoBox: {
    backgroundColor: '#E8F4F8',
    padding: '12px 16px',
    borderRadius: '6px',
    borderLeft: '4px solid #0066CC',
  },
  infoText: {
    fontSize: '13px',
    color: '#0066CC',
    margin: '0',
    lineHeight: '1.5',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #eee',
    justifyContent: 'flex-end',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  exportButton: {
    backgroundColor: '#0066CC',
    color: '#fff',
  },
};

export default ExportDialog;
