import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

interface DefectMarker {
  id: string;
  position: THREE.Vector3;
  severity: string;
  number: number;
  object3D: THREE.Object3D;
  size: number;
}

export function useThreeViewer(containerRef: React.RefObject<HTMLDivElement>) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const markersRef = useRef<Map<string, DefectMarker>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const modelRotationRef = useRef<number>(0);
  const initializingRef = useRef<boolean>(false);
  const [wireframe, setWireframe] = useState(false);
  const [defectMarkers, setDefectMarkers] = useState<DefectMarker[]>([]);
  const [markerSize, setMarkerSize] = useState(1);
  const animationFrameRef = useRef<number | null>(null);

  const onModelClickRef = useRef<((position: THREE.Vector3) => void) | null>(null);
  const onMarkerClickRef = useRef<((markerId: string) => void) | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initializingRef.current) {
      console.log('⏳ Already initializing...');
      return;
    }

    if (!containerRef.current) {
      console.warn('⚠️ Container ref not available yet');
      return;
    }

    initializingRef.current = true;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    console.log(`✅ Container found! Size: ${width} x ${height}`);

    if (width === 0 || height === 0) {
      console.error('❌ Container has zero dimensions! Check your CSS layout.');
      initializingRef.current = false;
      return;
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera - positioned to view model from front
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    console.log('✅ Three.js initialized successfully!');

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(15, 15, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);

    // Animation loop with LEFT-RIGHT only rotation
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (modelRef.current) {
        modelRotationRef.current += 0.003;
        modelRef.current.rotation.y = modelRotationRef.current;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse controls - rotation only
    let isDragging = false;
    let previousMousePosition = { x: 0 };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        isDragging = true;
        previousMousePosition.x = event.clientX;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging && modelRef.current) {
        const deltaX = event.clientX - previousMousePosition.x;
        modelRotationRef.current += deltaX * 0.01;
        modelRef.current.rotation.y = modelRotationRef.current;
        previousMousePosition.x = event.clientX;
      }

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Click handler
    const handleCanvasClick = (event: MouseEvent) => {
      if (isDragging) return;

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      if (modelRef.current) {
        const intersects = raycasterRef.current.intersectObject(modelRef.current, true);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          if (onModelClickRef.current) {
            onModelClickRef.current(point);
          }
        }
      }

      const markerObjects = Array.from(markersRef.current.values()).map((m) => m.object3D);
      const markerIntersects = raycasterRef.current.intersectObjects(markerObjects, true);
      if (markerIntersects.length > 0) {
        const clickedObject = markerIntersects[0].object;
        const marker = Array.from(markersRef.current.values()).find(
          (m) => m.object3D === clickedObject || m.object3D.children.some(c => c === clickedObject)
        );
        if (marker && onMarkerClickRef.current) {
          onMarkerClickRef.current(marker.id);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('click', handleCanvasClick);
    renderer.domElement.style.cursor = 'grab';

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up Three.js resources...');
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      initializingRef.current = false;
    };
  }, []);

  // Load model
  const loadModel = async (file: File): Promise<void> => {
    let attempts = 0;
    while ((!sceneRef.current || !cameraRef.current || !rendererRef.current) && attempts < 20) {
      console.log(`⏳ Waiting for Three.js (${attempts + 1}/20)...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) {
      throw new Error('Three.js failed to initialize - container may not be visible');
    }

    console.log('✅ Scene ready! Loading model...');

    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
    }

    const fileUrl = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      let model: THREE.Group | THREE.Object3D;

      switch (ext) {
        case 'obj':
          model = await new OBJLoader().loadAsync(fileUrl);
          break;
        case 'glb':
        case 'gltf':
          const gltf = await new GLTFLoader().loadAsync(fileUrl);
          model = gltf.scene;
          break;
        case 'fbx':
          model = await new FBXLoader().loadAsync(fileUrl);
          break;
        default:
          throw new Error(`Unsupported format: ${ext}`);
      }

      const modelGroup = model instanceof THREE.Group ? model : new THREE.Group();
      if (!(model instanceof THREE.Group)) {
        modelGroup.add(model);
      }

      const box = new THREE.Box3().setFromObject(modelGroup);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 15 / maxDim;

      modelGroup.position.sub(center);
      modelGroup.scale.multiplyScalar(scale);

      modelGroup.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.side = THREE.DoubleSide;
          }
        }
      });

      sceneRef.current!.add(modelGroup);
      modelRef.current = modelGroup;

      cameraRef.current!.position.set(0, 0, 25);
      cameraRef.current!.lookAt(0, 0, 0);

      URL.revokeObjectURL(fileUrl);
      console.log('✅ Model loaded and fitted to screen!');
    } catch (error) {
      console.error('Model load error:', error);
      URL.revokeObjectURL(fileUrl);
      throw error;
    }
  };

  // Add defect marker
  const addMarker = (id: string, position: THREE.Vector3, severity: string, number: number): void => {
    if (!sceneRef.current || !modelRef.current) return;

    if (markersRef.current.has(id)) {
      const existing = markersRef.current.get(id);
      if (existing) {
        modelRef.current.remove(existing.object3D);
      }
    }

    const colorMap: Record<string, number> = {
      CRITICAL: 0xdc143c,
      HIGH: 0xff6600,
      MEDIUM: 0xffc107,
      LOW: 0x4caf50,
    };
    const color = colorMap[severity] || 0x666666;

    const group = new THREE.Group();
    group.position.copy(position);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 32, 32),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
    );
    sphere.castShadow = true;
    group.add(sphere);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.1, 32, 32),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
    );
    ring.rotation.x = Math.PI / 4;
    group.add(ring);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 256, 256);

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) })
    );
    sprite.scale.set(2, 2, 1);
    sprite.position.z = 1;
    group.add(sprite);

    modelRef.current.add(group);

    const marker: DefectMarker = {
      id,
      position: position.clone(),
      severity,
      number,
      object3D: group,
      size: 1,
    };
    markersRef.current.set(id, marker);
  };

  // Remove marker
  const removeMarker = (id: string): void => {
    const marker = markersRef.current.get(id);
    if (marker && modelRef.current) {
      modelRef.current.remove(marker.object3D);
      markersRef.current.delete(id);
    }
  };

  // Resize marker
  const updateAllMarkerSizes = (size: number): void => {
    setMarkerSize(size);
    markersRef.current.forEach((marker) => {
      marker.object3D.scale.set(size, size, size);
      marker.size = size;
    });
  };

  // Clear markers
  const clearMarkers = (): void => {
    if (modelRef.current) {
      markersRef.current.forEach((marker) => {
        modelRef.current!.remove(marker.object3D);
      });
    }
    markersRef.current.clear();
  };

  // Toggle wireframe
  const toggleWireframe = (): void => {
    if (modelRef.current) {
      modelRef.current.traverse((child: any) => {
        if (child.isMesh) {
          child.material.wireframe = !wireframe;
        }
      });
      setWireframe(!wireframe);
    }
  };

  const setOnModelClick = (callback: (position: THREE.Vector3) => void) => {
    onModelClickRef.current = callback;
  };

  const setOnMarkerClick = (callback: (markerId: string) => void) => {
    onMarkerClickRef.current = callback;
  };

  // Add Phase/Floor marker
  const addPhaseFloorMarker = (id: string, position: THREE.Vector3, phase: string, floor: string): void => {
    if (!sceneRef.current || !modelRef.current) return;

    const group = new THREE.Group();
    group.position.copy(position);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 32, 32),
      new THREE.MeshStandardMaterial({ 
        color: 0x3B82F6, 
        emissive: 0x3B82F6, 
        emissiveIntensity: 0.5 
      })
    );
    sphere.castShadow = true;
    group.add(sphere);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.08, 32, 32),
      new THREE.MeshStandardMaterial({ 
        color: 0x3B82F6, 
        emissive: 0x3B82F6, 
        emissiveIntensity: 0.3 
      })
    );
    ring.rotation.x = Math.PI / 4;
    group.add(ring);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(phase, 20, 20);
    ctx.fillStyle = '#3B82F6';
    ctx.font = 'bold 80px Arial';
    ctx.fillText(floor, 20, 130);

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) })
    );
    sprite.scale.set(5, 2.5, 1);
    sprite.position.z = 1;
    group.add(sprite);

    modelRef.current.add(group);
    markersRef.current.set(id, { 
      id, 
      position: position.clone(), 
      severity: 'INFO', 
      number: 0, 
      object3D: group,
      size: 1,
    });
  };

  // Remove Phase/Floor marker
  const removePhaseFloorMarker = (id: string): void => {
    const marker = markersRef.current.get(id);
    if (marker && modelRef.current) {
      modelRef.current.remove(marker.object3D);
      markersRef.current.delete(id);
    }
  };

  return {
    loadModel,
    addMarker,
    removeMarker,
    updateAllMarkerSizes,
    addPhaseFloorMarker,
    removePhaseFloorMarker,
    clearMarkers,
    toggleWireframe,
    setOnModelClick,
    setOnMarkerClick,
    wireframe,
    defectMarkers,
    markerSize,
  };
}