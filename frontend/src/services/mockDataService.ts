/**
 * Mock API Service - In-memory data management
 * Simulates backend API with proper data structure
 */

interface Annotation {
  id: string;
  projectId: string;
  mediaId: string;
  type: string;
  defectType: string;
  severity: string;
  description: string;
  phase: string;
  floor: string;
  remedialAction?: string;
  globalDefectNumber?: number;
  temperature?: any;
  temperatureData?: any;
  points?: any[];
  startPoint?: any;
  number?: number;
  annotatedImageData?: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  buildingName: string;
  clientName: string;
  jobNumber: string;
  facadeType: string;
  currentStage: string;
  status: string;
  createdAt: string;
}

interface CADFile {
  id: string;
  projectId: string;
  name: string;
  type: string;
  fileData: string;
  uploadedAt: string;
}

interface Annotation {
  id: string;
  projectId: string;
  mediaId: string;
  type: string;
  defectType: string;
  severity: string;
  description: string;
  temperature?: any;
  temperatureData?: any;
  points?: any[];
  startPoint?: any;
  number?: number;
  createdAt: string;
}

class MockAPI {
  private projects: Project[] = [
    {
      id: '1',
      name: 'Burj Khalifa Tower',
      description: 'High-rise facade inspection',
      buildingName: 'Burj Khalifa',
      clientName: 'Emaar Properties',
      jobNumber: 'JN-2026-001',
      facadeType: 'Curtain Wall',
      currentStage: 'Field Inspection',
      status: 'active',
      createdAt: '2026-01-15',
    },
    {
      id: '2',
      name: 'Downtown Tower Inspection',
      description: 'Downtown area tower assessment',
      buildingName: 'Downtown Tower',
      clientName: 'Downtown Development',
      jobNumber: 'JN-2026-002',
      facadeType: 'Masonry',
      currentStage: 'Planning',
      status: 'active',
      createdAt: '2026-02-01',
    },
    {
      id: '3',
      name: 'Marina Residences Check',
      description: 'Marina area residential complex',
      buildingName: 'Marina Residences',
      clientName: 'Marina Developers',
      jobNumber: 'JN-2026-003',
      facadeType: 'Glass Panel',
      currentStage: 'Annotation',
      status: 'active',
      createdAt: '2026-02-15',
    },
  ];

  private media: MediaItem[] = [];
  private cadFiles: CADFile[] = [];
  private annotations: Annotation[] = [];

  async delay(ms: number = 300) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ===== PROJECT METHODS =====
  async getProjects(): Promise<Project[]> {
    await this.delay();
    return this.projects;
  }

  async getProjectById(id?: string): Promise<Project | null> {
    await this.delay();
    return this.projects.find((p) => p.id === id) || null;
  }

  async createProject(data: any): Promise<Project> {
    await this.delay();
    const newProject: Project = {
      id: `project-${Date.now()}`,
      ...data,
    };
    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: string, data: any): Promise<Project> {
    await this.delay();
    const project = this.projects.find((p) => p.id === id);
    if (project) {
      Object.assign(project, data);
    }
    return project!;
  }

  async deleteProject(id: string): Promise<void> {
    await this.delay();
    this.projects = this.projects.filter((p) => p.id !== id);
    this.media = this.media.filter((m) => m.projectId !== id);
    this.annotations = this.annotations.filter((a) => a.projectId !== id);
  }

  // ===== MEDIA METHODS =====
  async getMedia(): Promise<MediaItem[]> {
    await this.delay();
    return this.media;
  }

  async getMediaByProject(projectId: string): Promise<MediaItem[]> {
    await this.delay();
    return this.media.filter((m) => m.projectId === projectId);
  }

  async getPhasesByProject(projectId: string): Promise<string[]> {
    await this.delay();
    const phases = [...new Set(this.media
      .filter((m) => m.projectId === projectId)
      .map((m) => m.phase))];
    return phases.sort();
  }

  async getFloorsByPhase(projectId: string, phase: string): Promise<string[]> {
    await this.delay();
    const floors = [...new Set(this.media
      .filter((m) => m.projectId === projectId && m.phase === phase)
      .map((m) => m.floor))];
    return floors.sort();
  }

  async getMediaByPhaseAndFloor(
    projectId: string,
    phase: string,
    floor: string
  ): Promise<MediaItem[]> {
    await this.delay();
    return this.media.filter(
      (m) => m.projectId === projectId && m.phase === phase && m.floor === floor
    );
  }

  async createMedia(data: any): Promise<MediaItem> {
    await this.delay();
    const newMedia: MediaItem = {
      id: `media-${Date.now()}-${Math.random()}`,
      timestamp: data.timestamp || Date.now(),
      hasRadiometricData: data.type === 'thermal' ? (data.hasRadiometricData === true) : false,
      ...data,
    };
    this.media.push(newMedia);
    console.log('Media created:', {
      id: newMedia.id,
      filename: newMedia.filename,
      type: newMedia.type,
      timestamp: newMedia.timestamp,
      hasRadiometricData: newMedia.hasRadiometricData,
    });
    return newMedia;
  }

  async updateMedia(id: string, data: any): Promise<MediaItem> {
    await this.delay();
    const media = this.media.find((m) => m.id === id);
    if (media) {
      Object.assign(media, data);
    }
    return media!;
  }

  async deleteMedia(id: string): Promise<void> {
    await this.delay();
    this.media = this.media.filter((m) => m.id !== id);
    this.annotations = this.annotations.filter((a) => a.mediaId !== id);
  }

  // ===== IMAGE PAIRING LOGIC - ORIGINAL WORKING VERSION =====
  async getImagePairs(projectId: string, phase: string, floor: string): Promise<any[]> {
  await this.delay();

  const mediaItems = this.media.filter(
    (m) => m.projectId === projectId && m.phase === phase && m.floor === floor
  );

  console.log(`\n=== PAIRING BY EXIF CAPTURE TIME ===`);
  console.log(`Phase: ${phase} | Floor: ${floor}`);
  console.log(`Total media items: ${mediaItems.length}\n`);

  // ✅ GROUP BY CAPTURE TIME ONLY
  // Images taken at same time = same pair
  const pairMap = new Map<number, Map<string, MediaItem>>();

  mediaItems.forEach((item) => {
    // Round to nearest second (within 1 second = same capture)
    const timeKey = Math.round(item.timestamp / 1000) * 1000;

    if (!pairMap.has(timeKey)) {
      pairMap.set(timeKey, new Map());
    }
    pairMap.get(timeKey)!.set(item.type, item);

    console.log(`  ${item.filename || item.id} (${item.type})`);
    console.log(`    Timestamp: ${item.timestamp}`);
    console.log(`    Date: ${new Date(item.timestamp).toLocaleString()}`);
  });

  console.log(`\n✅ Groups found by capture time: ${pairMap.size}\n`);

  // Create pairs
  const pairs = Array.from(pairMap.entries()).map(([timeKey, typeMap]) => {
    const rgb = typeMap.get('rgb');
    const thermal = typeMap.get('thermal');
    const zoom = typeMap.get('zoom');

    console.log(`Pair - ${new Date(timeKey).toLocaleString()}`);
    console.log(`  RGB: ${rgb ? `✓ ${rgb.filename}` : '✗'}`);
    console.log(`  Thermal: ${thermal ? `✓ ${thermal.filename}` : '✗'}`);
    console.log(`  Zoom: ${zoom ? `✓ ${zoom.filename}` : '✗'}\n`);

    return {
      id: `pair-${timeKey}`,
      timestamp: timeKey,
      rgb: rgb || null,
      thermal: thermal || null,
      zoom: zoom || null,
    };
  });

  pairs.sort((a, b) => a.timestamp - b.timestamp);

  console.log(`\n✅ FINAL: ${pairs.length} pairs created\n`);

  return pairs;
}

  // ===== CAD FILE METHODS =====
  async getCADFiles(): Promise<CADFile[]> {
    await this.delay();
    return this.cadFiles;
  }

  async getCADFilesByProject(projectId: string): Promise<CADFile[]> {
    await this.delay();
    return this.cadFiles.filter((c) => c.projectId === projectId);
  }

  async createCADFile(data: any): Promise<CADFile> {
    await this.delay();
    const newFile: CADFile = {
      id: `cad-${Date.now()}`,
      uploadedAt: new Date().toLocaleString(),
      ...data,
    };
    this.cadFiles.push(newFile);
    return newFile;
  }

  async deleteCADFile(id: string): Promise<void> {
    await this.delay();
    this.cadFiles = this.cadFiles.filter((c) => c.id !== id);
  }

  // ===== ANNOTATION METHODS =====
  async getAnnotations(): Promise<Annotation[]> {
    await this.delay();
    return this.annotations;
  }

  async getAnnotationsByMedia(mediaId: string): Promise<Annotation[]> {
    await this.delay();
    return this.annotations.filter((a) => a.mediaId === mediaId);
  }

  async getAnnotationsByProject(projectId: string): Promise<Annotation[]> {
    await this.delay();
    return this.annotations.filter((a) => a.projectId === projectId);
  }

  async createAnnotation(data: any): Promise<Annotation> {
  await this.delay();
  
  const mediaItem = this.media.find((m) => m.id === data.mediaId);
  
  const newAnnotation: Annotation = {
    id: `annotation-${Date.now()}-${Math.random()}`,
    createdAt: new Date().toLocaleString(),
    phase: mediaItem?.phase || data.phase || 'Unknown Phase',
    floor: mediaItem?.floor || data.floor || 'Unknown Floor',
    remedialAction: data.remedialAction || '',
    globalDefectNumber: data.globalDefectNumber,
    annotatedImageData: data.annotatedImageData || '', // ← PRESERVE ANNOTATED IMAGE
    ...data,
  };
  
  this.annotations.push(newAnnotation);
  return newAnnotation;
}

  async deleteAnnotation(id: string): Promise<void> {
    await this.delay();
    this.annotations = this.annotations.filter((a) => a.id !== id);
  }

  // ===== PROJECT STATS =====
  async getProjectStats(projectId: string): Promise<any> {
    await this.delay();
    const projectMedia = this.media.filter((m) => m.projectId === projectId);
    return {
      totalImages: projectMedia.length,
      rgbCount: projectMedia.filter((m) => m.type === 'rgb').length,
      thermalCount: projectMedia.filter((m) => m.type === 'thermal').length,
      zoomCount: projectMedia.filter((m) => m.type === 'zoom').length,
      phases: [...new Set(projectMedia.map((m) => m.phase))],
      floors: [...new Set(projectMedia.map((m) => m.floor))],
    };
  }

  // ===== EXPORT/IMPORT =====
  async exportData(): Promise<string> {
    await this.delay();
    return JSON.stringify(
      {
        projects: this.projects,
        media: this.media,
        cadFiles: this.cadFiles,
        annotations: this.annotations,
      },
      null,
      2
    );
  }

  async importData(data: string): Promise<void> {
    await this.delay();
    try {
      const parsed = JSON.parse(data);
      this.projects = parsed.projects || [];
      this.media = parsed.media || [];
      this.cadFiles = parsed.cadFiles || [];
      this.annotations = parsed.annotations || [];
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }

  async resetData(): Promise<void> {
    await this.delay();
    this.projects = [];
    this.media = [];
    this.cadFiles = [];
    this.annotations = [];
    console.log('All data reset');
  }
}
// ============================================
// 3D MODEL STORAGE (Local File System)
// ============================================

interface Model3D {
  id: string;
  projectId: string;
  fileName: string;
  fileFormat: 'OBJ' | 'FBX' | 'GLTF' | 'GLB';
  filePath: string;
  fileSize: number;
  phase: string;
  floor: string;
  uploadedAt: string;
  createdBy: string;
  defectPositions: {
    defectId: string;
    globalDefectNumber: number;
    position3D: {
      x: number;
      y: number;
      z: number;
    };
    defectType: string;
    severity: string;
  }[];
  metadata?: {
    boundingBox?: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
    };
    scale: number;
    cameraState?: {
      position: [number, number, number];
      target: [number, number, number];
    };
  };
}

const model3DStorage: Map<string, Model3D> = new Map();

export const model3DAPI = {
  async uploadModel(
    projectId: string,
    file: File,
    phase: string,
    floor: string,
    userId: string
  ): Promise<Model3D> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() as any;
    const validFormats = ['obj', 'fbx', 'gltf', 'glb'];

    if (!validFormats.includes(fileExtension)) {
      throw new Error(`Invalid format. Supported: ${validFormats.join(', ')}`);
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File too large. Max 100 MB');
    }

    const modelId = `model_${Date.now()}`;
    const filePath = `/models/${projectId}/${modelId}/${file.name}`;

    const fileDataUrl = await fileToDataUrl(file);
    localStorage.setItem(`model_file_${modelId}`, fileDataUrl);

    const model3D: Model3D = {
      id: modelId,
      projectId,
      fileName: file.name,
      fileFormat: fileExtension,
      filePath,
      fileSize: file.size,
      phase,
      floor,
      uploadedAt: new Date().toISOString(),
      createdBy: userId,
      defectPositions: [],
      metadata: {
        scale: 1,
      },
    };

    model3DStorage.set(modelId, model3D);
    console.log(`✅ Model uploaded: ${modelId}`);

    return model3D;
  },

  async getModelById(modelId: string): Promise<Model3D | null> {
    return model3DStorage.get(modelId) || null;
  },

  async getModelsByProject(projectId: string): Promise<Model3D[]> {
    return Array.from(model3DStorage.values()).filter(
      (m) => m.projectId === projectId
    );
  },

  async addDefectPosition(
    modelId: string,
    defectId: string,
    globalDefectNumber: number,
    position3D: { x: number; y: number; z: number },
    defectType: string,
    severity: string
  ): Promise<Model3D> {
    const model = model3DStorage.get(modelId);
    if (!model) throw new Error('Model not found');

    const existingIndex = model.defectPositions.findIndex(
      (d) => d.defectId === defectId
    );

    const position = {
      defectId,
      globalDefectNumber,
      position3D,
      defectType,
      severity,
    };

    if (existingIndex >= 0) {
      model.defectPositions[existingIndex] = position;
    } else {
      model.defectPositions.push(position);
    }

    model3DStorage.set(modelId, model);
    console.log(`✅ Defect positioned: ${defectId}`);

    return model;
  },

  async removeDefectPosition(
    modelId: string,
    defectId: string
  ): Promise<Model3D> {
    const model = model3DStorage.get(modelId);
    if (!model) throw new Error('Model not found');

    model.defectPositions = model.defectPositions.filter(
      (d) => d.defectId !== defectId
    );

    model3DStorage.set(modelId, model);
    console.log(`✅ Defect removed from model: ${defectId}`);

    return model;
  },

  async updateModelMetadata(
    modelId: string,
    updates: {
      phase?: string;
      floor?: string;
      cameraState?: any;
      boundingBox?: any;
      scale?: number;
    }
  ): Promise<Model3D> {
    const model = model3DStorage.get(modelId);
    if (!model) throw new Error('Model not found');

    if (updates.phase) model.phase = updates.phase;
    if (updates.floor) model.floor = updates.floor;
    if (updates.cameraState) {
      if (!model.metadata) model.metadata = {};
      model.metadata.cameraState = updates.cameraState;
    }
    if (updates.boundingBox) {
      if (!model.metadata) model.metadata = {};
      model.metadata.boundingBox = updates.boundingBox;
    }
    if (updates.scale !== undefined) {
      if (!model.metadata) model.metadata = {};
      model.metadata.scale = updates.scale;
    }

    model3DStorage.set(modelId, model);
    console.log(`✅ Model metadata updated: ${modelId}`);

    return model;
  },

  async getModelFile(modelId: string): Promise<Blob | null> {
    const fileDataUrl = localStorage.getItem(`model_file_${modelId}`);
    if (!fileDataUrl) return null;

    const response = await fetch(fileDataUrl);
    return response.blob();
  },

  async deleteModel(modelId: string): Promise<void> {
    model3DStorage.delete(modelId);
    localStorage.removeItem(`model_file_${modelId}`);
    console.log(`✅ Model deleted: ${modelId}`);
  },

  async exportModelData(modelId: string): Promise<string> {
    const model = model3DStorage.get(modelId);
    if (!model) throw new Error('Model not found');

    return JSON.stringify(model, null, 2);
  },
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export const mockAPI = new MockAPI();