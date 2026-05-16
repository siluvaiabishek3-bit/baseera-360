import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Annotation {
  id: number;
  x: number;
  y: number;
  type: string;
  severity: string;
  description: string;
  temperature?: number;
}

interface AnnotationPanelProps {
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onDeleteAnnotation: (id: number) => void;
  onSelectAnnotation: (annotation: Annotation | null) => void;
  selectedAnnotation: Annotation | null;
}

export function AnnotationPanel({ 
  annotations, 
  onAddAnnotation, 
  onDeleteAnnotation, 
  onSelectAnnotation,
  selectedAnnotation 
}: AnnotationPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Crack',
    severity: 'MEDIUM',
    description: '',
    temperature: '',
  });

  const defectTypes = ['Crack', 'Corrosion', 'Spalling', 'Water Ingress', 'Efflorescence', 'Delamination'];
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  const handleAddAnnotation = () => {
    if (!formData.description.trim()) {
      alert('Please enter a description');
      return;
    }

    const newAnnotation: Annotation = {
      id: annotations.length + 1,
      x: 50,
      y: 50,
      type: formData.type,
      severity: formData.severity,
      description: formData.description,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
    };

    onAddAnnotation(newAnnotation);
    setFormData({ type: 'Crack', severity: 'MEDIUM', description: '', temperature: '' });
    setShowForm(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#DC143C';
      case 'HIGH': return '#FF4444';
      case 'MEDIUM': return '#f97316';
      case 'LOW': return '#eab308';
      default: return '#666';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0f0f0f',
      borderRight: '1px solid #333',
    }}>
      {/* HEADER */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #333',
        backgroundColor: '#1a1a1a',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
            Annotations ({annotations.length})
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '6px 10px',
              backgroundColor: '#DC143C',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#DC143C';
            }}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* ADD ANNOTATION FORM */}
      {showForm && (
        <div style={{
          padding: '12px',
          borderBottom: '1px solid #333',
          backgroundColor: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div>
            <label style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
              Defect Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#0f0f0f',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {defectTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
              Severity
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#0f0f0f',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {severities.map((sev) => (
                <option key={sev} value={sev}>{sev}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the defect..."
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#0f0f0f',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                resize: 'none',
                height: '50px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
              Temperature (°C) - Optional
            </label>
            <input
              type="number"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              placeholder="e.g., 45.5"
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#0f0f0f',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleAddAnnotation}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: '#DC143C',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#DC143C';
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({ type: 'Crack', severity: 'MEDIUM', description: '', temperature: '' });
              }}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: 'transparent',
                color: '#999',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ANNOTATIONS LIST */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {annotations.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '20px' }}>
            No annotations yet
          </p>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              onClick={() => onSelectAnnotation(annotation)}
              style={{
                padding: '12px',
                backgroundColor: selectedAnnotation?.id === annotation.id ? '#DC143C' : '#1a1a1a',
                border: `1px solid ${selectedAnnotation?.id === annotation.id ? '#DC143C' : '#333'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (selectedAnnotation?.id !== annotation.id) {
                  e.currentTarget.style.borderColor = '#DC143C';
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAnnotation?.id !== annotation.id) {
                  e.currentTarget.style.borderColor = '#333';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: getSeverityColor(annotation.severity),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}>
                    {annotation.id}
                  </div>
                  <div>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: selectedAnnotation?.id === annotation.id ? 'white' : '#fff',
                      marginBottom: '2px',
                    }}>
                      {annotation.type}
                    </p>
                    <p style={{
                      fontSize: '10px',
                      color: selectedAnnotation?.id === annotation.id ? '#ddd' : '#999',
                    }}>
                      {annotation.severity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(annotation.id);
                  }}
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#999',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#DC143C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#999';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <p style={{
                fontSize: '11px',
                color: selectedAnnotation?.id === annotation.id ? '#ddd' : '#999',
                lineHeight: '1.4',
                marginBottom: '6px',
              }}>
                {annotation.description}
              </p>

              {annotation.temperature && (
                <div style={{
                  padding: '6px',
                  backgroundColor: 'rgba(255, 68, 68, 0.1)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#FF4444',
                  fontWeight: '600',
                }}>
                  🌡️ {annotation.temperature}°C
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AnnotationPanel;