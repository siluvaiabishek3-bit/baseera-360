import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Plus, Trash2, CheckCircle } from 'lucide-react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { mockAPI } from '@/services/mockDataService';

interface Defect {
  id: string;
  globalDefectNumber: number;
  defectType: string;
  severity: string;
}

interface FloorLevel {
  id: string;
  name: string;
  yHeight: number;
  rotationDegree: number;
  lineObject: THREE.Line | null;
  defectsOnFloor: {
    defectId: string;
    defectNumber: number;
    defectType: string;
    severity: string;
    xPos: number;
    yPos: number;
    zPos: number;
  }[];
}

// Severity color mapping
const getSeverityColor = (severity: string): number => {
  const severityMap: { [key: string]: number } = {
    'CRITICAL': 0xDC143C,  // Red
    'HIGH': 0xFF6600,       // Orange
    'MEDIUM': 0xFFC107,     // Yellow
    'LOW': 0x4CAF50,        // Green
  };
  return severityMap[severity.toUpperCase()] || 0xFF0000; // Default red
};

let threeScene: {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  model: THREE.Group | null;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
} | null = null;

export function ModelViewerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs to track state in click handler (closure fix)
  const placingFloorRef = useRef(false);
  const newFloorNameRef = useRef('');
  const screenFloorLinesRef = useRef<{ id: string; name: string; screenY: number; rotationDegree: number }[]>([]);
  const floorLevelsRef = useRef<FloorLevel[]>([]);
  const rotationStepRef = useRef(0);
  const selectedDefectToPlaceRef = useRef<Defect | null>(null);
  const allDefectsRef = useRef<Defect[]>([]);

  // State
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allDefects, setAllDefects] = useState<Defect[]>([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Rotation state (0-7 = 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
  const [rotationStep, setRotationStep] = useState(0);

  // Floor levels
  const [floorLevels, setFloorLevels] = useState<FloorLevel[]>([]);
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorHeight, setNewFloorHeight] = useState(0);
  const [showAddFloor, setShowAddFloor] = useState(false);

  // Defect placement
  const [placingOnFloor, setPlacingOnFloor] = useState<string | null>(null);
  const [selectedDefectToPlace, setSelectedDefectToPlace] = useState<Defect | null>(null);

  // Floor placement preview
  const [placingFloor, setPlacingFloor] = useState(false);
  const [previewLineObject, setPreviewLineObject] = useState<THREE.Line | null>(null);
  const [previewHeight, setPreviewHeight] = useState(0);
  
  // Screen floor lines (2D overlay)
  const [screenFloorLines, setScreenFloorLines] = useState<{
    id: string;
    name: string;
    screenY: number;
    rotationDegree: number;
  }[]>([]);

  // Defect detail popup
  const [selectedDefectPopup, setSelectedDefectPopup] = useState<Defect | null>(null);

  // Arrow position for pointing to defect on 3D model
  const [arrowPosition, setArrowPosition] = useState<{ x: number; y: number } | null>(null);

  // Messages
  const [message, setMessage] = useState('');

  // Initialize Three.js (LAZY - called when needed)
  const initThreeJs = () => {
    if (threeScene) {
      console.log('✅ Three.js already initialized');
      return true;
    }

    if (!containerRef.current) {
      console.error('❌ Container ref is null');
      return false;
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
      console.warn('⚠️ Container has zero dimensions, retrying:', width, 'x', height);
      // Retry after a small delay
      setTimeout(() => initThreeJs(), 200);
      return false;
    }

    console.log('🔧 Initializing Three.js with dimensions:', width, 'x', height);

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      scene.fog = new THREE.Fog(0x1a1a1a, 500, 2000);

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);
      camera.position.z = 100;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowShadowMap;

      // Clear container and add renderer
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(50, 50, 50);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Initialize instance
      threeScene = {
        scene,
        camera,
        renderer,
        model: null,
        raycaster: new THREE.Raycaster(),
        mouse: new THREE.Vector2(),
      };

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        if (threeScene) {
          renderer.render(threeScene.scene, threeScene.camera);
        }
      };
      animate();

      // Resize handler
      const handleResize = () => {
        if (!containerRef.current || !threeScene) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        threeScene.camera.aspect = w / h;
        threeScene.camera.updateProjectionMatrix();
        threeScene.renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // Mouse move
      const onMouseMove = (e: MouseEvent) => {
        if (!containerRef.current || !threeScene) return;
        const rect = containerRef.current.getBoundingClientRect();
        threeScene.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        threeScene.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };

      // Click to place floor line, place defect, or show defect details
      const onClick = (e: MouseEvent) => {
        if (!threeScene) return;

        // If placing floor, place line on screen at click position
        if (placingFloorRef.current) {
          console.log('[CLICK] Placing floor:', newFloorNameRef.current, 'at', rotationStepRef.current * 45, '°');
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const screenY = e.clientY - rect.top;
          
          const newFloorId = `floor_${Date.now()}`;
          const rotationDeg = rotationStepRef.current * 45;
          
          // Add to screen lines
          const updatedScreenLines = [...screenFloorLinesRef.current, {
            id: newFloorId,
            name: newFloorNameRef.current,
            screenY: screenY,
            rotationDegree: rotationDeg,
          }];
          setScreenFloorLines(updatedScreenLines);

          // Add to floor levels
          const newFloor: FloorLevel = {
            id: newFloorId,
            name: newFloorNameRef.current,
            yHeight: screenY,
            rotationDegree: rotationDeg,
            lineObject: null,
            defectsOnFloor: [],
          };
          const updatedFloors = [...floorLevelsRef.current, newFloor];
          setFloorLevels(updatedFloors);

          setPlacingFloor(false);
          setNewFloorName('');
          setShowAddFloor(false);
          setMessage(`✅ Added: ${newFloorNameRef.current} at ${rotationDeg}°`);
          setTimeout(() => setMessage(''), 2500);
          return;
        }

        // Place defect on click
        if (threeScene.model && selectedDefectToPlaceRef.current) {
          console.log('[CLICK] Placing defect:', selectedDefectToPlaceRef.current.globalDefectNumber);
          threeScene.raycaster.setFromCamera(threeScene.mouse, threeScene.camera);
          const intersects = threeScene.raycaster.intersectObject(threeScene.model, true);

          if (intersects.length > 0) {
            const point = intersects[0].point;
            const defect = selectedDefectToPlaceRef.current;
            
            // Find or create floor for current rotation
            const currentRotationDeg = rotationStepRef.current * 45;
            let floorIndex = floorLevelsRef.current.findIndex(f => f.rotationDegree === currentRotationDeg);
            
            if (floorIndex < 0) {
              console.log('[CLICK] No floor at', currentRotationDeg, '° - available floors:', floorLevelsRef.current.map(f => `${f.name}@${f.rotationDegree}°`));
              setMessage('⚠️ No floor at this rotation. Add a floor first.');
              setTimeout(() => setMessage(''), 3000);
              return;
            }
            
            console.log('[CLICK] Found floor at index:', floorIndex, 'Position:', point);
            setFloorLevels(prev => 
              prev.map((floor, idx) => {
                if (idx !== floorIndex) return floor;
                
                // Check if defect already on this floor
                const existingIndex = floor.defectsOnFloor.findIndex(d => d.defectId === defect.id);
                
                if (existingIndex >= 0) {
                  // Update existing defect position
                  const updated = [...floor.defectsOnFloor];
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    xPos: point.x,
                    yPos: point.y,
                    zPos: point.z,
                  };
                  console.log('[CLICK] Updated defect position:', point);
                  return { ...floor, defectsOnFloor: updated };
                } else {
                  // Add new defect
                  console.log('[CLICK] Added new defect to floor at:', point);
                  return {
                    ...floor,
                    defectsOnFloor: [
                      ...floor.defectsOnFloor,
                      {
                        defectId: defect.id,
                        defectNumber: defect.globalDefectNumber,
                        defectType: defect.defectType,
                        severity: defect.severity,
                        xPos: point.x,
                        yPos: point.y,
                        zPos: point.z,
                      }
                    ]
                  };
                }
              })
            );

            setMessage(`✅ Placed #${defect.globalDefectNumber}`);
            setTimeout(() => setMessage(''), 2500);
            
            // Auto-deselect after placement so it's saved
            setSelectedDefectToPlace(null);
          } else {
            setMessage('❌ Click on the 3D model surface');
          }
          return;
        }
      };

      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('click', onClick);

      console.log('✅ Three.js initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Three.js init error:', error);
      return false;
    }
  };

  // Update refs when state changes
  useEffect(() => {
    placingFloorRef.current = placingFloor;
  }, [placingFloor]);

  useEffect(() => {
    newFloorNameRef.current = newFloorName;
  }, [newFloorName]);

  useEffect(() => {
    screenFloorLinesRef.current = screenFloorLines;
  }, [screenFloorLines]);

  useEffect(() => {
    floorLevelsRef.current = floorLevels;
  }, [floorLevels]);

  useEffect(() => {
    rotationStepRef.current = rotationStep;
  }, [rotationStep]);

  useEffect(() => {
    selectedDefectToPlaceRef.current = selectedDefectToPlace;
  }, [selectedDefectToPlace]);

  useEffect(() => {
    allDefectsRef.current = allDefects;
  }, [allDefects]);

  // Render defect markers when floors or rotation changes
  useEffect(() => {
    if (modelLoaded) {
      renderDefectMarkers();
    }
  }, [floorLevels, rotationStep, modelLoaded]);

  // Fetch project & defects
  useEffect(() => {
    const fetch = async () => {
      try {
        const proj = await mockAPI.getProjectById(id);
        setProject(proj);
        const defs = await mockAPI.getAnnotationsByProject(id);
        setAllDefects(defs.filter((d: any) => d.globalDefectNumber) || []);

        // Load saved floors from localStorage
        const key = `baseera_3d_${id}`;
        const savedData = localStorage.getItem(key);
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            console.log(`✅ Loaded from localStorage: ${key}`, data);
            if (data.floorLevels && data.floorLevels.length > 0) {
              setFloorLevels(data.floorLevels);
              console.log(`✅ Restored ${data.floorLevels.length} floors`);
            }
            if (data.screenFloorLines && data.screenFloorLines.length > 0) {
              setScreenFloorLines(data.screenFloorLines);
              console.log(`✅ Restored ${data.screenFloorLines.length} screen lines`);
            }
          } catch (err) {
            console.error('Error parsing localStorage:', err);
          }
        } else {
          console.log(`ℹ️ No saved data for key: ${key}`);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Handle arrow keys and ESC
  useEffect(() => {
    if (!modelLoaded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        
        // Cancel floor placement
        if (placingFloor) {
          setPlacingFloor(false);
          setMessage('❌ Floor placement cancelled');
          setTimeout(() => setMessage(''), 2000);
          return;
        }
        
        // Cancel defect placement
        if (selectedDefectToPlace) {
          setSelectedDefectToPlace(null);
          setMessage('❌ Defect placement cancelled');
          setTimeout(() => setMessage(''), 2000);
          return;
        }
      }

      if (e.key === 'ArrowRight') {
        const newStep = (rotationStep + 1) % 8;
        setRotationStep(newStep);
        rotateModel(newStep);
        setMessage(`→ Rotated to ${newStep * 45}°`);
        setTimeout(() => setMessage(''), 1500);
      } else if (e.key === 'ArrowLeft') {
        const newStep = (rotationStep - 1 + 8) % 8;
        setRotationStep(newStep);
        rotateModel(newStep);
        setMessage(`← Rotated to ${newStep * 45}°`);
        setTimeout(() => setMessage(''), 1500);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotationStep, modelLoaded, placingFloor, selectedDefectToPlace]);

  const rotateModel = (step: number) => {
    if (!threeScene?.model) return;
    const angle = (step * 45 * Math.PI) / 180;
    threeScene.model.rotation.y = angle;
    fitCameraToModel();
  };

  const fitCameraToModel = () => {
    if (!threeScene?.model) return;
    const box = new THREE.Box3().setFromObject(threeScene.model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const fov = threeScene.camera.fov * (Math.PI / 180);
    const cameraZ = maxDim / 2 / Math.tan(fov / 2) * 1.5;
    
    threeScene.camera.position.set(center.x, center.y, center.z + cameraZ);
    threeScene.camera.lookAt(center);
    
    console.log('✅ Camera fitted to model');
  };

  const handleFileUpload = async (file: File) => {
    setMessage('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!['obj', 'glb', 'gltf', 'fbx'].includes(ext || '')) {
      setMessage('❌ Unsupported format (use OBJ, FBX, GLB, GLTF)');
      return;
    }

    try {
      setUploading(true);
      console.log('[UPLOAD] Starting upload of', file.name);

      // Properly dispose old Three.js resources
      if (threeScene) {
        console.log('[UPLOAD] Cleaning up old Three.js scene');
        if (threeScene.model) {
          threeScene.scene.remove(threeScene.model);
        }
        threeScene.renderer.dispose();
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        threeScene = null;
      }

      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initialize Three.js fresh (with retry)
      let initialized = initThreeJs();
      let retries = 0;
      
      // Retry if dimensions are still 0
      while (!initialized && retries < 5) {
        await new Promise(resolve => setTimeout(resolve, 200));
        initialized = initThreeJs();
        retries++;
      }

      if (!initialized || !threeScene) {
        console.error('[UPLOAD] Failed to initialize Three.js after retries');
        setMessage('❌ Failed to initialize 3D viewer');
        return;
      }

      console.log('[UPLOAD] Three.js initialized, loading model');
      setMessage('⏳ Loading model...');

      const url = URL.createObjectURL(file);
      let model: THREE.Object3D;

      if (ext === 'obj') {
        model = await new OBJLoader().loadAsync(url);
      } else if (ext === 'fbx') {
        model = await new FBXLoader().loadAsync(url);
      } else {
        const gltf = await new GLTFLoader().loadAsync(url);
        model = gltf.scene;
      }

      console.log('[UPLOAD] Model loaded successfully');

      // Clean old model if exists
      if (threeScene.model) {
        threeScene.scene.remove(threeScene.model);
      }

      const modelGroup = model instanceof THREE.Group ? model : new THREE.Group();
      if (!(model instanceof THREE.Group)) modelGroup.add(model);

      // Center model
      const box = new THREE.Box3().setFromObject(modelGroup);
      const center = box.getCenter(new THREE.Vector3());
      modelGroup.position.sub(center);

      // Set materials
      modelGroup.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) child.material.side = THREE.DoubleSide;
        }
      });

      threeScene.scene.add(modelGroup);
      threeScene.model = modelGroup;

      fitCameraToModel();
      URL.revokeObjectURL(url);

      setModelLoaded(true);
      setRotationStep(0);
      setMessage(`✅ Loaded: ${file.name}`);
      setTimeout(() => setMessage(''), 2500);

      console.log('[UPLOAD] Complete - model ready');
    } catch (err: any) {
      console.error('[UPLOAD] Error:', err);
      setMessage(`❌ ${err.message || 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  const addFloorLevel = () => {
    if (!newFloorName.trim()) {
      setMessage('⚠️ Enter floor name');
      return;
    }

    if (!threeScene?.model) {
      setMessage('⚠️ Load model first');
      return;
    }

    setPlacingFloor(true);
    setMessage('🎯 Click on the screen to place the floor line');
  };

  const deleteFloor = (floorId: string) => {
    setScreenFloorLines(prev => prev.filter(f => f.id !== floorId));
    setFloorLevels(prev => prev.filter(f => f.id !== floorId));
    setMessage('🗑️ Floor deleted');
    setTimeout(() => setMessage(''), 2000);
  };


  const renderDefectMarkers = () => {
    if (!threeScene || !threeScene.model || !threeScene.scene) return;

    // Remove old defect markers
    threeScene.scene.children.forEach((child: any) => {
      if (child.userData?.isDefectMarker) {
        threeScene.scene.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          child.material.dispose();
          if (child.material.map) child.material.map.dispose();
        }
      }
    });

    // Add new defect markers for current rotation
    const currentRotationDeg = rotationStep * 45;
    const currentFloor = floorLevels.find(f => f.rotationDegree === currentRotationDeg);
    
    if (currentFloor && currentFloor.defectsOnFloor.length > 0) {
      currentFloor.defectsOnFloor.forEach((defect) => {
        // Get severity color
        const severityColor = getSeverityColor(defect.severity);
        
        // Create canvas texture with defect number only (no circle)
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Number text in severity color
          ctx.fillStyle = '#' + severityColor.toString(16).padStart(6, '0');
          ctx.font = 'bold 200px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(defect.defectNumber), 128, 128);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ 
          map: texture, 
          side: THREE.DoubleSide,
          transparent: true,
        });
        const geometry = new THREE.PlaneGeometry(2.4, 2.4);
        const marker = new THREE.Mesh(geometry, material);
        
        // Position at exact click location
        marker.position.set(defect.xPos, defect.yPos, defect.zPos);
        marker.userData.isDefectMarker = true;
        marker.userData.defectNumber = defect.defectNumber;
        
        threeScene.scene.add(marker);
        console.log('[MARKER] Added defect', defect.defectNumber, 'at', {x: defect.xPos, y: defect.yPos, z: defect.zPos}, 'severity:', defect.severity);
      });
    }
  };

  const removeDefectFromFloor = (floorId: string, defectId: string) => {
    setFloorLevels(prev =>
      prev.map(floor =>
        floor.id === floorId
          ? {
              ...floor,
              defectsOnFloor: floor.defectsOnFloor.filter(d => d.defectId !== defectId),
            }
          : floor
      )
    );
  };

  const handleSave = () => {
    try {
      const data = {
        projectId: id,
        floorLevels: floorLevels,
        screenFloorLines: screenFloorLines,
        savedAt: new Date().toISOString(),
      };
      const key = `baseera_3d_${id}`;
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ Saved to localStorage: ${key}`, data);
      setMessage(`✅ Saved! ${floorLevels.length} floors`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setMessage('❌ Save failed');
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  const totalDefects = floorLevels.reduce((sum, f) => sum + f.defectsOnFloor.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
      {/* HEADER */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #ddd',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button onClick={() => navigate(`/projects/${id}`)} style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#666',
          fontWeight: '600',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          fontSize: '13px',
        }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>3D Floor Grid Inspector</h1>
        {modelLoaded && (
          <button onClick={handleSave} style={{
            background: '#DC143C',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}>
            <Save size={16} /> Save
          </button>
        )}
      </div>

      {/* MESSAGE */}
      {message && (
        <div style={{
          background: message.includes('❌') ? '#fee' : message.includes('⚠️') ? '#fef3cd' : '#efe',
          color: message.includes('❌') ? '#c33' : message.includes('⚠️') ? '#856404' : '#3c763d',
          padding: '10px 24px',
          borderBottom: '1px solid #ddd',
          fontWeight: '600',
          fontSize: '13px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          {message.includes('✅') && <CheckCircle size={16} />}
          {message}
        </div>
      )}

      {/* MAIN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', flex: 1, overflow: 'hidden' }}>
        
        {/* 3D VIEWER */}
        <div 
          style={{ position: 'relative', background: '#1a1a1a' }}
        >
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

          {/* Floor Lines Overlay (SVG) - Only show for current rotation */}
          {modelLoaded && screenFloorLines.length > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            >
              {screenFloorLines
                .filter(line => line.rotationDegree === rotationStep * 45)
                .map((line) => (
                <g key={line.id}>
                  {/* White horizontal line with 30% opacity */}
                  <line
                    x1="0"
                    y1={line.screenY}
                    x2={containerRef.current?.clientWidth || 500}
                    y2={line.screenY}
                    stroke="white"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                  {/* Floor name with rotation degree */}
                  <text
                    x={(containerRef.current?.clientWidth || 500) - 10}
                    y={line.screenY - 5}
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="end"
                    opacity="0.8"
                  >
                    {line.name} {line.rotationDegree}°
                  </text>
                </g>
              ))}
            </svg>
          )}

          {/* UPLOAD PROMPT */}
          {!modelLoaded && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
                <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '20px' }}>Upload 3D Model</h2>
                <p style={{ color: '#aaa', margin: '0 0 24px 0', fontSize: '13px' }}>OBJ, FBX, GLTF, GLB</p>
                <label style={{
                  background: '#DC143C',
                  color: 'white',
                  padding: '12px 28px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'inline-flex',
                  gap: '8px',
                  alignItems: 'center',
                  opacity: uploading ? 0.6 : 1,
                }}>
                  <Upload size={18} />
                  {uploading ? 'Loading...' : 'Choose File'}
                  <input 
                    type="file" 
                    hidden 
                    accept=".obj,.fbx,.gltf,.glb" 
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          )}

          {/* ROTATION HELP */}
          {modelLoaded && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(0,0,0,0.3)',
              color: '#FFC107',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: 5,
            }}>
              ◀ LEFT | RIGHT ▶ (45° steps) | Current: {rotationStep * 45}°
            </div>
          )}

          {/* PLACEMENT HINT */}
          {/* Removed overlay - user drags the visible line directly */}

          {placingOnFloor === null && placingOnFloor && selectedDefectToPlace && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.9)',
              color: '#FFC107',
              padding: '16px 32px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              zIndex: 5,
              pointerEvents: 'none',
            }}>
              🎯 Click on model to place defect
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{
          background: 'white',
          borderLeft: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          
          {/* ADD FLOOR SECTION */}
          {modelLoaded && (
            <div style={{ padding: '16px', borderBottom: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700' }}>📐 Add Floor Level</h3>
              {!showAddFloor && !placingFloor ? (
                <button onClick={() => setShowAddFloor(true)} style={{
                  width: '100%',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Plus size={14} /> New Floor
                </button>
              ) : placingFloor ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    background: '#FFC107',
                    color: '#000',
                    padding: '10px',
                    borderRadius: '4px',
                    fontWeight: '600',
                    fontSize: '11px',
                    textAlign: 'center',
                  }}>
                    🎯 Click on the screen to place floor
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => {
                      setPlacingFloor(false);
                      setNewFloorName('');
                    }} style={{
                      background: '#999',
                      color: 'white',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '11px',
                      flex: 1,
                    }}>
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    placeholder="Ground Floor"
                    autoFocus
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={addFloorLevel} style={{
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '11px',
                    }}>
                      Next
                    </button>
                    <button onClick={() => setShowAddFloor(false)} style={{
                      background: '#999',
                      color: 'white',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '11px',
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CREATED FLOORS DROPDOWN */}
          {modelLoaded && floorLevels.length > 0 && (
            <div style={{ padding: '16px', borderBottom: '1px solid #ddd' }}>
              <details style={{ width: '100%' }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#1a1a1a',
                  padding: '8px',
                  background: '#f0f7ff',
                  border: '1px solid #3B82F6',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  📍 Created Floors ({floorLevels.length})
                  <span style={{ fontSize: '14px' }}>▼</span>
                </summary>

                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {floorLevels.map((floor) => (
                    <div
                      key={floor.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f0f7ff',
                        border: '1px solid #3B82F6',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      <span>{floor.name} ({floor.rotationDegree}°)</span>
                      <button
                        onClick={() => deleteFloor(floor.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC143C',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontWeight: '600',
                          fontSize: '10px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* DEFECTS LIST */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700' }}>🔴 Defects ({allDefects.length})</h3>
            {allDefects.length === 0 ? (
              <p style={{ color: '#999', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
                No defects available
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {allDefects.map((defect: any) => {
                  // Find which floor this defect is on
                  let floorInfo = '';
                  let isPlaced = false;
                  floorLevels.forEach((floor) => {
                    const isOnFloor = floor.defectsOnFloor.some((d: any) => d.defectId === defect.id);
                    if (isOnFloor) {
                      floorInfo = ` - Floor: ${floor.name} (${floor.rotationDegree}°)`;
                      isPlaced = true;
                    }
                  });

                  return (
                    <div
                      key={defect.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px',
                        background: '#f0f7ff',
                        border: '1px solid #3B82F6',
                        padding: '10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      <button
                        onClick={() => {
                          setSelectedDefectPopup(defect);
                          // Calculate arrow position based on defect location on 3D model
                          if (isPlaced) {
                            setArrowPosition({ x: 50, y: 50 }); // Placeholder, will be updated
                          }
                        }}
                        style={{
                          flex: 1,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ color: '#1a1a1a' }}>#{defect.globalDefectNumber} - {defect.defectType}</div>
                        <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px', color: '#666' }}>
                          Phase: {defect.phase || 'N/A'}{floorInfo}
                        </div>
                      </button>

                      {/* Three dots menu - only for placed defects */}
                      {isPlaced && (
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => {
                              const menu = document.getElementById(`menu_${defect.id}`);
                              if (menu) {
                                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#3B82F6',
                            }}
                          >
                            ⋯
                          </button>

                          {/* Dropdown menu */}
                          <div
                            id={`menu_${defect.id}`}
                            style={{
                              display: 'none',
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              background: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              zIndex: 100,
                              minWidth: '160px',
                            }}
                          >
                            <button
                              onClick={() => {
                                setSelectedDefectToPlace(defect);
                                document.getElementById(`menu_${defect.id}`)!.style.display = 'none';
                                setMessage(`🔄 Re-fixing #${defect.globalDefectNumber} - Click on model`);
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#1a1a1a',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f0f7ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              🔧 Re-fix marked location
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RE-FIXING STATUS */}
          <div style={{ padding: '16px', borderTop: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedDefectToPlace && (
              <div style={{
                background: '#FFC107',
                color: '#000',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                textAlign: 'center',
              }}>
                🔄 Re-fixing #{selectedDefectToPlace.globalDefectNumber}
                <br />
                Click on 3D model | Press ESC to cancel
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEFECT DETAILS POPUP */}
      {selectedDefectPopup && (
        <>
          {/* Arrow pointing to defect on 3D model */}
          <div style={{
            position: 'fixed',
            width: '3px',
            height: '60px',
            background: '#FF0000',
            zIndex: 998,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'fixed',
            width: '0',
            height: '0',
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '15px solid #FF0000',
            zIndex: 998,
            left: '50%',
            top: 'calc(50% - 60px)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }} />

          {/* Dialog box */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            backdropFilter: 'blur(5px)',
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              position: 'relative',
            }}>
              {/* Close button */}
              <button
                onClick={() => setSelectedDefectPopup(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ✕
            </button>

            {/* Defect details */}
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
              Defect #{selectedDefectPopup.globalDefectNumber}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#666' }}>Type</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                    {selectedDefectPopup.defectType}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#666' }}>Severity</label>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#' + getSeverityColor(selectedDefectPopup.severity).toString(16).padStart(6, '0'),
                  }}>
                    {selectedDefectPopup.severity}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#666' }}>Phase</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                    {selectedDefectPopup.phase || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedDefectPopup.description && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#666' }}>Description</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#333', lineHeight: '1.4' }}>
                    {selectedDefectPopup.description}
                  </p>
                </div>
              )}

              {selectedDefectPopup.remedialAction && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#666' }}>Remedial Action</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#333', lineHeight: '1.4' }}>
                    {selectedDefectPopup.remedialAction}
                  </p>
                </div>
              )}

              {selectedDefectPopup.location && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#666' }}>Location</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#333', lineHeight: '1.4' }}>
                    {selectedDefectPopup.location}
                  </p>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedDefectPopup(null)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default ModelViewerPage;
