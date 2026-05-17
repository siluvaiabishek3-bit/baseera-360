import { useState } from 'react';
import { X } from 'lucide-react';

interface ReportConfigProps {
  project?: any;
  onCancel?: () => void;
  onClose?: () => void;
  onGenerate: (config: any) => void;
}

export function ReportConfig({ project, onCancel, onClose, onGenerate }: ReportConfigProps) {
  const [imageryType, setImageryType] = useState<'rgb' | 'rgb-thermal' | 'rgb-zoom' | 'rgb-thermal-zoom'>('rgb-thermal');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [scopeType, setScopeType] = useState<'entire' | 'phase'>('entire');
  const [selectedPhase, setSelectedPhase] = useState<string>('Phase 1');

  const phases = Array.from({ length: project?.numberOfPhases || 1 }, (_, i) => `Phase ${i + 1}`);

  const closeModal = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const handleGenerate = () => {
    const config = {
      imageryType,
      exportFormat,
      scopeType,
      selectedPhase: scopeType === 'phase' ? selectedPhase : null,
    };

    onGenerate(config);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target) {
      closeModal();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '600px',
          width: '95%',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER WITH CLOSE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#DC143C' }}>Generate Report</h2>
          <button
            onClick={closeModal}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '32px',
              padding: '0',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
            }}
          >
            ✕
          </button>
        </div>

        {/* SECTION 1: IMAGERY TYPE */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#DC143C' }}>
            Select Imagery Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { value: 'rgb' as const, label: 'RGB Only', icon: '📷' },
              { value: 'rgb-thermal' as const, label: 'RGB + Thermal', icon: '🌡️' },
              { value: 'rgb-zoom' as const, label: 'RGB + Zoom', icon: '🔍' },
              { value: 'rgb-thermal-zoom' as const, label: 'RGB + Thermal + Zoom', icon: '⚡' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setImageryType(option.value)}
                style={{
                  padding: '16px',
                  backgroundColor: imageryType === option.value ? '#DC143C' : '#2a2a2a',
                  color: 'white',
                  border: imageryType === option.value ? '2px solid #FF4444' : '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{option.icon}</div>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: SCOPE */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#DC143C' }}>
            Select Scope
          </label>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            {[
              { value: 'entire' as const, label: 'Entire Building' },
              { value: 'phase' as const, label: 'Specific Phase' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setScopeType(option.value)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: scopeType === option.value ? '#DC143C' : '#2a2a2a',
                  color: 'white',
                  border: scopeType === option.value ? '2px solid #FF4444' : '1px solid #444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.3s ease',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* PHASE SELECTOR - ONLY SHOW IF PHASE SELECTED */}
          {scopeType === 'phase' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#bbb' }}>
                Select Phase
              </label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {phases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SECTION 3: EXPORT FORMAT */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#DC143C' }}>
            Export Format
          </label>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { value: 'pdf' as const, label: 'PDF Report', icon: '📄' },
              { value: 'excel' as const, label: 'Excel Report', icon: '📊' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setExportFormat(option.value)}
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: exportFormat === option.value ? '#DC143C' : '#2a2a2a',
                  color: 'white',
                  border: exportFormat === option.value ? '2px solid #FF4444' : '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{option.icon}</div>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleGenerate}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
          >
            Generate {exportFormat.toUpperCase()}
          </button>
          <button
            onClick={closeModal}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#777')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#666')}
          >
            Cancel
          </button>
        </div>

        {/* INFO BOX */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px',
            backgroundColor: '#2a2a2a',
            borderLeft: '4px solid #DC143C',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#bbb',
          }}
        >
          <strong>📋 Selected Options:</strong>
          <div style={{ marginTop: '8px', lineHeight: '1.6' }}>
            • Imagery: <span style={{ color: '#DC143C', fontWeight: '600' }}>{imageryType.toUpperCase()}</span>
            <br />
            • Scope: <span style={{ color: '#DC143C', fontWeight: '600' }}>{scopeType === 'entire' ? 'Entire Building' : `${selectedPhase} Only`}</span>
            <br />
            • Format: <span style={{ color: '#DC143C', fontWeight: '600' }}>{exportFormat.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportConfig;
