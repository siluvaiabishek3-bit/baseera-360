// SEVERITY COLOR MAPPING
export const SEVERITY_COLORS = {
  CRITICAL: {
    color: '#DC143C',  // Red
    rgb: { r: 220, g: 20, b: 60 },
  },
  HIGH: {
    color: '#FF6600',  // Orange
    rgb: { r: 255, g: 102, b: 0 },
  },
  MEDIUM: {
    color: '#FFC107',  // Yellow
    rgb: { r: 255, g: 193, b: 7 },
  },
  LOW: {
    color: '#4CAF50',  // Green
    rgb: { r: 76, g: 175, b: 80 },
  },
};

// Global counter per project
const globalDefectCounters = new Map<string, number>();

export function getNextDefectNumber(projectId: string): number {
  const current = globalDefectCounters.get(projectId) || 0;
  const next = current + 1;
  globalDefectCounters.set(projectId, next);
  return next;
}

export function resetDefectCounter(projectId: string): void {
  globalDefectCounters.delete(projectId);
}

// Draw annotation on canvas
export function drawAnnotationOnCanvas(
  ctx: CanvasRenderingContext2D,
  annotation: any
) {
  if (!annotation || !annotation.points || annotation.points.length === 0) {
    return;
  }

  const color = SEVERITY_COLORS[annotation.severity as keyof typeof SEVERITY_COLORS]?.color || '#999';
  const lineWidth = 3;
  const fontSize = 24;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = 1;

  if (annotation.type === 'polygon') {
    // Draw polygon
    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
    for (let i = 1; i < annotation.points.length; i++) {
      ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Find center for number
    let sumX = 0, sumY = 0;
    for (const p of annotation.points) {
      sumX += p.x;
      sumY += p.y;
    }
    const centerX = sumX / annotation.points.length;
    const centerY = sumY / annotation.points.length;

    // Draw number
    drawNumber(ctx, annotation.globalDefectNumber, centerX, centerY, color, fontSize);
  } else if (annotation.type === 'point') {
    const p = annotation.points[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    drawNumber(ctx, annotation.globalDefectNumber, p.x, p.y, color, fontSize);
  } else if (annotation.type === 'circle') {
    const center = annotation.points[0];
    const edge = annotation.points[1];
    const radius = Math.sqrt(
      Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
    );
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    drawNumber(ctx, annotation.globalDefectNumber, center.x, center.y, color, fontSize);
  } else if (annotation.type === 'rectangle') {
    const start = annotation.points[0];
    const end = annotation.points[1];
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    const centerX = start.x + (end.x - start.x) / 2;
    const centerY = start.y + (end.y - start.y) / 2;
    drawNumber(ctx, annotation.globalDefectNumber, centerX, centerY, color, fontSize);
  } else if (annotation.type === 'freehand') {
    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
    for (let i = 1; i < annotation.points.length; i++) {
      ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
    }
    ctx.stroke();
    const mid = Math.floor(annotation.points.length / 2);
    drawNumber(ctx, annotation.globalDefectNumber, annotation.points[mid].x, annotation.points[mid].y, color, fontSize);
  }
}

function drawNumber(
  ctx: CanvasRenderingContext2D,
  number: number | string,
  x: number,
  y: number,
  color: string,
  fontSize: number
) {
  const text = String(number);
  const padding = 8;

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const width = metrics.width + padding * 2;
  const height = fontSize + padding;

  // White background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(x - width / 2, y - height / 2, width, height);

  // Color border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - width / 2, y - height / 2, width, height);

  // Number text
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}