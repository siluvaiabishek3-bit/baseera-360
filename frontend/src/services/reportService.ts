interface Defect {
  id: string;
  type: string;
  severity: string;
  description: string;
  location: string;
  defectType: string;
  phase?: string;
  floor?: string;
}

interface ReportScope {
  scopeType: 'entire' | 'phase' | 'floor';
  selectedPhase?: string;
  selectedFloor?: string;
}

export function filterDefectsByScope(defects: Defect[], scope: ReportScope): Defect[] {
  let filtered = [...defects];

  if (scope.scopeType === 'phase' && scope.selectedPhase) {
    filtered = filtered.filter((d) => d.phase === scope.selectedPhase);
  } else if (scope.scopeType === 'floor' && scope.selectedPhase && scope.selectedFloor) {
    filtered = filtered.filter(
      (d) => d.phase === scope.selectedPhase && d.floor === scope.selectedFloor
    );
  }

  return filtered;
}

export function getDefectStatistics(defects: Defect[]) {
  return {
    total: defects.length,
    critical: defects.filter((d) => d.severity === 'CRITICAL').length,
    high: defects.filter((d) => d.severity === 'HIGH').length,
    medium: defects.filter((d) => d.severity === 'MEDIUM').length,
    low: defects.filter((d) => d.severity === 'LOW').length,
  };
}

export function getDefectTypeDistribution(defects: Defect[]) {
  const distribution: Record<string, number> = {};
  defects.forEach((defect) => {
    distribution[defect.defectType] = (distribution[defect.defectType] || 0) + 1;
  });
  return distribution;
}

export function formatDefectForReport(defect: Defect) {
  return {
    ...defect,
    severityLabel: {
      CRITICAL: '🔴 CRITICAL',
      HIGH: '🟠 HIGH',
      MEDIUM: '🟡 MEDIUM',
      LOW: '🟢 LOW',
    }[defect.severity] || defect.severity,
  };
}