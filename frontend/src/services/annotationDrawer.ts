/**
 * Draws annotation markers on images
 * Returns annotated image as base64
 */

export interface AnnotationMarker {
  x: number;
  y: number;
  label: string;
  severity: string;
}

const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    CRITICAL: '#DC143C',
    HIGH: '#FF6600',
    MEDIUM: '#FFC107',
    LOW: '#4CAF50',
  };
  return colors[severity] || '#0066CC';
};

export const drawAnnotationsOnImage = (
  imageData: string,
  annotations: AnnotationMarker[]
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Draw annotations
        annotations.forEach((annotation) => {
          const markerSize = Math.max(img.width, img.height) * 0.03; // 3% of image

          // Circle outline
          ctx.strokeStyle = getSeverityColor(annotation.severity);
          ctx.lineWidth = markerSize * 0.4;
          ctx.beginPath();
          ctx.arc(annotation.x, annotation.y, markerSize, 0, 2 * Math.PI);
          ctx.stroke();

          // Center dot
          ctx.fillStyle = getSeverityColor(annotation.severity);
          ctx.beginPath();
          ctx.arc(annotation.x, annotation.y, markerSize * 0.3, 0, 2 * Math.PI);
          ctx.fill();

          // Label background
          ctx.font = `bold ${Math.max(14, markerSize * 0.8)}px Arial`;
          const textMetrics = ctx.measureText(annotation.label);
          const textWidth = textMetrics.width;
          const textHeight = markerSize * 1.2;
          const labelX = annotation.x - textWidth / 2;
          const labelY = annotation.y - markerSize - 15;

          // Label box background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(labelX - 5, labelY - textHeight + 5, textWidth + 10, textHeight);

          // Label text
          ctx.fillStyle = getSeverityColor(annotation.severity);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(annotation.label, annotation.x, labelY - textHeight / 2 + 5);
        });

        // Convert to base64
        const annotatedImage = canvas.toDataURL('image/jpeg', 0.95);
        resolve(annotatedImage);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.crossOrigin = 'anonymous';
    img.src = imageData;
  });
};