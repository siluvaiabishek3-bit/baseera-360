import { useState } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';

interface ProjectDetails {
  clientName: string;
  companyName: string;
  jobNumber: string;
  projectName: string;
  buildingName: string;
  projectLocation: string;
  clientLogo?: File;
  companyLogo?: File;
}

interface BuildingInfo {
  numberOfFloors: number;
  numberOfPhases: number;
  facadeType: string;
  engineerName: string;
  qaVerifiedBy: string;
  dronePilotName: string;
  technicians: string[];
  daysForInspection: number;
  sensorsUsed: string[];
}

interface ReportScope {
  scopeType: 'entire' | 'phase' | 'floor';
  selectedPhase?: string;
  selectedFloor?: string;
  imageryType: 'rgb' | 'thermal' | 'rgb-thermal' | 'rgb-thermal-zoom';
  exportFormat: 'pdf' | 'excel';
}

interface ReportConfigProps {
  onClose: () => void;
  onGenerate: (config: any) => void;
}

export function ReportConfig({ onClose, onGenerate }: ReportConfigProps) {
  const [step, setStep] = useState(1);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    clientName: '',
    companyName: 'Baseera 360 for Unmanned Aerial Vehicle (Drone) Services LLC',
    jobNumber: '',
    projectName: '',
    buildingName: '',
    projectLocation: '',
  });

  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo>({
    numberOfFloors: 1,
    numberOfPhases: 1,
    facadeType: '',
    engineerName: '',
    qaVerifiedBy: '',
    dronePilotName: '',
    technicians: [''],
    daysForInspection: 0,
    sensorsUsed: [],
  });

  const [reportScope, setReportScope] = useState<ReportScope>({
    scopeType: 'entire',
    imageryType: 'rgb-thermal',
    exportFormat: 'pdf',
  });

  const [clientLogoPreview, setClientLogoPreview] = useState<string>('');
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string>('');

  const phases = Array.from({ length: buildingInfo.numberOfPhases }, (_, i) => `Phase ${i + 1}`);
  const floors = Array.from({ length: buildingInfo.numberOfFloors }, (_, i) => {
    const floorNum = i + 1;
    return floorNum === 1 ? 'Ground Floor' : `${floorNum}th Floor`;
  });

  const facadeTypes = ['Glass Curtain Wall', 'Stone Facade', 'Metal Panel', 'Brick Masonry', 'Mixed Material', 'Other'];
  const sensorsOptions = ['RGB', 'Thermal', 'Zoom'];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'client' | 'company') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      if (type === 'client') {
        setProjectDetails({ ...projectDetails, clientLogo: file });
        setClientLogoPreview(preview);
      } else {
        setProjectDetails({ ...projectDetails, companyLogo: file });
        setCompanyLogoPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTechnician = () => {
    setBuildingInfo({
      ...buildingInfo,
      technicians: [...buildingInfo.technicians, ''],
    });
  };

  const handleRemoveTechnician = (index: number) => {
    setBuildingInfo({
      ...buildingInfo,
      technicians: buildingInfo.technicians.filter((_, i) => i !== index),
    });
  };

  const handleUpdateTechnician = (index: number, value: string) => {
    const updated = [...buildingInfo.technicians];
    updated[index] = value;
    setBuildingInfo({ ...buildingInfo, technicians: updated });
  };

  const handleSensorToggle = (sensor: string) => {
    const updated = buildingInfo.sensorsUsed.includes(sensor)
      ? buildingInfo.sensorsUsed.filter((s) => s !== sensor)
      : [...buildingInfo.sensorsUsed, sensor];
    setBuildingInfo({ ...buildingInfo, sensorsUsed: updated });
  };

  const handleGenerate = () => {
    if (!projectDetails.clientName || !projectDetails.jobNumber || !projectDetails.projectName) {
      alert('Please fill in Client Name, Job Number, and Project Name');
      return;
    }

    if (!buildingInfo.engineerName || !buildingInfo.qaVerifiedBy) {
      alert('Please fill in Engineer Name and QA/QC Verified By');
      return;
    }

    const config = {
      projectDetails,
      buildingInfo,
      reportScope,
      clientLogo: clientLogoPreview,
      companyLogo: companyLogoPreview,
    };

    onGenerate(config);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.95)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 300,
      overflowY: 'auto',
    }}>
      {/* HEADER */}
      <div style={{
        backgroundColor: '#0f0f0f',
        borderBottom: '1px solid #DC143C',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
          Generate Inspection Report
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '24px',
          }}
        >
          ×
        </button>
      </div>

      {/* STEP INDICATOR */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        padding: '12px 32px',
        display: 'flex',
        gap: '8px',
      }}>
        {[1, 2, 3].map((stepNum) => (
          <button
            key={stepNum}
            onClick={() => setStep(stepNum)}
            style={{
              padding: '8px 16px',
              backgroundColor: step === stepNum ? '#DC143C' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            Step {stepNum}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: '32px', backgroundColor: '#1a1a1a', overflow: 'auto' }}>
        {/* STEP 1: PROJECT DETAILS */}
        {step === 1 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>
              Project & Stakeholder Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Client Name *
                </label>
                <input
                  type="text"
                  value={projectDetails.clientName}
                  onChange={(e) => setProjectDetails({ ...projectDetails, clientName: e.target.value })}
                  placeholder="e.g., Emirates Real Estate Developer"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Job Number *
                </label>
                <input
                  type="text"
                  value={projectDetails.jobNumber}
                  onChange={(e) => setProjectDetails({ ...projectDetails, jobNumber: e.target.value })}
                  placeholder="e.g., JOB-2024-001"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectDetails.projectName}
                  onChange={(e) => setProjectDetails({ ...projectDetails, projectName: e.target.value })}
                  placeholder="e.g., Facade Inspection 2024"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Building Name
                </label>
                <input
                  type="text"
                  value={projectDetails.buildingName}
                  onChange={(e) => setProjectDetails({ ...projectDetails, buildingName: e.target.value })}
                  placeholder="e.g., Tower A"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Project Location
                </label>
                <input
                  type="text"
                  value={projectDetails.projectLocation}
                  onChange={(e) => setProjectDetails({ ...projectDetails, projectLocation: e.target.value })}
                  placeholder="e.g., Dubai, UAE"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={projectDetails.companyName}
                  onChange={(e) => setProjectDetails({ ...projectDetails, companyName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* LOGOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '12px' }}>
                  Client Logo
                </label>
                <div style={{
                  backgroundColor: '#0f0f0f',
                  border: '2px dashed #333',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  {clientLogoPreview ? (
                    <img src={clientLogoPreview} alt="Client Logo" style={{ maxHeight: '80px', marginBottom: '8px' }} />
                  ) : (
                    <Upload size={24} style={{ color: '#666', margin: '0 auto 8px' }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'client')}
                    style={{ display: 'none' }}
                    id="client-logo"
                  />
                  <button
                    onClick={() => document.getElementById('client-logo')?.click()}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#DC143C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    Upload
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '12px' }}>
                  Company Logo
                </label>
                <div style={{
                  backgroundColor: '#0f0f0f',
                  border: '2px dashed #333',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  {companyLogoPreview ? (
                    <img src={companyLogoPreview} alt="Company Logo" style={{ maxHeight: '80px', marginBottom: '8px' }} />
                  ) : (
                    <Upload size={24} style={{ color: '#666', margin: '0 auto 8px' }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'company')}
                    style={{ display: 'none' }}
                    id="company-logo"
                  />
                  <button
                    onClick={() => document.getElementById('company-logo')?.click()}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#DC143C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUILDING INFO */}
        {step === 2 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>
              Building & Inspection Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Number of Floors
                </label>
                <input
                  type="number"
                  value={buildingInfo.numberOfFloors}
                  onChange={(e) => setBuildingInfo({ ...buildingInfo, numberOfFloors: parseInt(e.target.value) || 1 })}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Number of Phases
                </label>
                <input
                  type="number"
                  value={buildingInfo.numberOfPhases}
                  onChange={(e) => setBuildingInfo({ ...buildingInfo, numberOfPhases: parseInt(e.target.value) || 1 })}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Facade Type
                </label>
                <select
                  value={buildingInfo.facadeType}
                  onChange={(e) => setBuildingInfo({ ...buildingInfo, facadeType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select Type</option>
                  {facadeTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Days for Inspection
                </label>
                <input
                  type="number"
                  value={buildingInfo.daysForInspection}
                  onChange={(e) => setBuildingInfo({ ...buildingInfo, daysForInspection: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Engineer Name (Report Prepared By) *
                </label>
                <input
                  type="text"
                  value={buildingInfo.engineerName}
                  onChange={(e) => setBuildingInfo({ ...buildingInfo, engineerName: e.target.value })}
                  placeholder="e.g., John Smith"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  QA/QC Verified By *
                </label>
                <input
                  type="text"
                  value={buildingInfo.qaVerifiedBy}
                  onChange={(e) => setBuildingInfo({ ...buildingInfo, qaVerifiedBy: e.target.value })}
                  placeholder="e.g., Jane Doe"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>
                  Drone Pilot Name
                </label>
                <input
                  type="text"
                  value={buildingInfo.dronePilotName}
                  onChange={(e) => setBuildingInfo({ ...buildingInfo, dronePilotName: e.target.value })}
                  placeholder="e.g., Ahmed Hassan"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '12px' }}>
                  Rope Access / BMU Technicians
                </label>
                {buildingInfo.technicians.map((tech, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={tech}
                      onChange={(e) => handleUpdateTechnician(idx, e.target.value)}
                      placeholder={`Technician ${idx + 1}`}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#0f0f0f',
                        color: '#fff',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    />
                    {buildingInfo.technicians.length > 1 && (
                      <button
                        onClick={() => handleRemoveTechnician(idx)}
                        style={{
                          padding: '10px',
                          backgroundColor: 'transparent',
                          border: '1px solid #DC143C',
                          borderRadius: '6px',
                          color: '#DC143C',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddTechnician}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                    border: '1px solid #DC143C',
                    borderRadius: '6px',
                    color: '#DC143C',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  Add Technician
                </button>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '12px' }}>
                  Sensors Used
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {sensorsOptions.map((sensor) => (
                    <label key={sensor} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={buildingInfo.sensorsUsed.includes(sensor)}
                        onChange={() => handleSensorToggle(sensor)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ color: '#fff', fontSize: '13px' }}>{sensor}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REPORT SCOPE & FORMAT */}
        {step === 3 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>
              Report Scope & Export Format
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '12px' }}>
                Report Scope
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.scopeType === 'entire'}
                    onChange={() => setReportScope({ ...reportScope, scopeType: 'entire' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>Entire Building</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.scopeType === 'phase'}
                    onChange={() => setReportScope({ ...reportScope, scopeType: 'phase' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>Specific Phase</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.scopeType === 'floor'}
                    onChange={() => setReportScope({ ...reportScope, scopeType: 'floor' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>Specific Floor</span>
                </label>
              </div>

              {reportScope.scopeType === 'phase' && (
                <div style={{ marginTop: '12px' }}>
                  <select
                    value={reportScope.selectedPhase || ''}
                    onChange={(e) => setReportScope({ ...reportScope, selectedPhase: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#0f0f0f',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select Phase</option>
                    {phases.map((phase) => (
                      <option key={phase} value={phase}>{phase}</option>
                    ))}
                  </select>
                </div>
              )}

              {reportScope.scopeType === 'floor' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <select
                    value={reportScope.selectedPhase || ''}
                    onChange={(e) => setReportScope({ ...reportScope, selectedPhase: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#0f0f0f',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select Phase</option>
                    {phases.map((phase) => (
                      <option key={phase} value={phase}>{phase}</option>
                    ))}
                  </select>
                  <select
                    value={reportScope.selectedFloor || ''}
                    onChange={(e) => setReportScope({ ...reportScope, selectedFloor: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#0f0f0f',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select Floor</option>
                    {floors.map((floor) => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '12px' }}>
                Imagery Type to Include
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.imageryType === 'rgb'}
                    onChange={() => setReportScope({ ...reportScope, imageryType: 'rgb' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>RGB Only</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.imageryType === 'thermal'}
                    onChange={() => setReportScope({ ...reportScope, imageryType: 'thermal' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>Thermal Only</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.imageryType === 'rgb-thermal'}
                    onChange={() => setReportScope({ ...reportScope, imageryType: 'rgb-thermal' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>RGB + Thermal</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.imageryType === 'rgb-thermal-zoom'}
                    onChange={() => setReportScope({ ...reportScope, imageryType: 'rgb-thermal-zoom' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>RGB + Thermal + Zoom</span>
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '12px' }}>
                Export Format
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.exportFormat === 'pdf'}
                    onChange={() => setReportScope({ ...reportScope, exportFormat: 'pdf' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>PDF</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={reportScope.exportFormat === 'excel'}
                    onChange={() => setReportScope({ ...reportScope, exportFormat: 'excel' })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>Excel</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        backgroundColor: '#0f0f0f',
        borderTop: '1px solid #333',
        padding: '16px 32px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 24px',
            backgroundColor: 'transparent',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#999',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
          }}
        >
          Cancel
        </button>
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              padding: '10px 24px',
              backgroundColor: 'transparent',
              border: '1px solid #DC143C',
              borderRadius: '6px',
              color: '#DC143C',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            Back
          </button>
        )}
        {step < 3 && (
          <button
            onClick={() => setStep(step + 1)}
            style={{
              padding: '10px 24px',
              backgroundColor: '#DC143C',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            Next
          </button>
        )}
        {step === 3 && (
          <button
            onClick={handleGenerate}
            style={{
              padding: '10px 24px',
              backgroundColor: '#22c55e',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            Generate Report
          </button>
        )}
      </div>
    </div>
  );
}

export default ReportConfig;