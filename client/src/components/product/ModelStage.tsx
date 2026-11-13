import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type CameraView = "front" | "back" | "left" | "right" | "top";

export interface ModelStageHandle {
  setView: (view: CameraView) => void;
  zoom: (factor: number) => void;
  reset: () => void;
  setAutoRotate: (value: boolean) => void;
}

interface ModelStageProps {
  src: string;
  alt: string;
  onProgress?: (percent: number) => void;
  onLoaded?: () => void;
  onError?: () => void;
}

const VIEW_DIRECTIONS: Record<CameraView, Vector3> = {
  front: new Vector3(0, 0.15, 1),
  back: new Vector3(0, 0.15, -1),
  left: new Vector3(-1, 0.15, 0),
  right: new Vector3(1, 0.15, 0),
  top: new Vector3(0, 1, 0.001),
};

const disposeObject = (root: Object3D) => {
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material: Material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof Texture) value.dispose();
      });
      material.dispose();
    });
  });
};

const ModelStage = forwardRef<ModelStageHandle, ModelStageProps>(function ModelStage({ src, alt, onProgress, onLoaded, onError }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const api = useRef<ModelStageHandle | null>(null);
  const [webglMissing, setWebglMissing] = useState(false);

  useImperativeHandle(ref, () => ({
    setView: (view) => api.current?.setView(view),
    zoom: (factor) => api.current?.zoom(factor),
    reset: () => api.current?.reset(),
    setAutoRotate: (value) => api.current?.setAutoRotate(value),
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setWebglMissing(true);
      onError?.();
      return;
    }

    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !coarse;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", alt);
    renderer.domElement.style.touchAction = "none";
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const envTexture = pmrem.fromScene(environment, 0.04).texture;
    scene.environment = envTexture;

    const camera = new PerspectiveCamera(35, 1, 0.01, 1000);
    const hemisphere = new HemisphereLight(new Color("#ffffff"), new Color("#cbd5e1"), 0.6);
    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 4);
    key.castShadow = !coarse;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0005;
    scene.add(hemisphere, key);

    const floor = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ opacity: 0.18 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 1.2;

    const pivot = new Group();
    scene.add(pivot);
    let modelRadius = 1;
    let disposed = false;
    let frame = 0;
    let needsRender = true;
    let tween: { from: Vector3; to: Vector3; start: number } | null = null;

    const fitDistance = () => modelRadius / Math.sin((camera.fov * Math.PI) / 360) * 1.3;

    const placeCamera = (direction: Vector3, animate: boolean) => {
      const target = direction.clone().normalize().multiplyScalar(fitDistance());
      if (animate && !reducedMotion) tween = { from: camera.position.clone(), to: target, start: performance.now() };
      else camera.position.copy(target);
      controls.target.set(0, 0, 0);
      needsRender = true;
    };

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      needsRender = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    controls.addEventListener("change", () => {
      needsRender = true;
    });
    const stopAutoRotate = () => {
      controls.autoRotate = false;
    };
    renderer.domElement.addEventListener("pointerdown", stopAutoRotate);

    const tick = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(tick);
      if (document.visibilityState !== "visible") return;
      if (tween) {
        const progress = Math.min(1, (time - tween.start) / 650);
        const eased = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(tween.from, tween.to, eased);
        if (progress >= 1) tween = null;
        needsRender = true;
      }
      const moved = controls.update();
      if (moved || needsRender || controls.autoRotate) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    };
    frame = requestAnimationFrame(tick);

    const loader = new GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        const model = gltf.scene;
        model.traverse((child) => {
          const mesh = child as Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = !coarse;
          mesh.receiveShadow = !coarse;
          const material = mesh.material as MeshStandardMaterial;
          if (material && "envMapIntensity" in material) material.envMapIntensity = 1;
        });
        const box = new Box3().setFromObject(model);
        const size = box.getSize(new Vector3());
        const center = box.getCenter(new Vector3());
        model.position.sub(center);
        pivot.add(model);
        modelRadius = Math.max(size.length() / 2, 0.001);
        floor.scale.setScalar(modelRadius * 6);
        floor.position.y = -size.y / 2 - modelRadius * 0.001;
        key.position.set(modelRadius * 3, modelRadius * 5, modelRadius * 4);
        key.shadow.camera.left = -modelRadius * 2;
        key.shadow.camera.right = modelRadius * 2;
        key.shadow.camera.top = modelRadius * 2;
        key.shadow.camera.bottom = -modelRadius * 2;
        key.shadow.camera.far = modelRadius * 20;
        key.shadow.camera.updateProjectionMatrix();
        camera.near = modelRadius / 100;
        camera.far = modelRadius * 100;
        camera.updateProjectionMatrix();
        controls.minDistance = modelRadius * 1.2;
        controls.maxDistance = modelRadius * 8;
        placeCamera(VIEW_DIRECTIONS.front, false);
        onLoaded?.();
      },
      (event) => {
        if (event.lengthComputable && event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
      () => {
        if (!disposed) onError?.();
      },
    );

    api.current = {
      setView: (view) => {
        controls.autoRotate = false;
        placeCamera(VIEW_DIRECTIONS[view], true);
      },
      zoom: (factor) => {
        controls.autoRotate = false;
        const distance = camera.position.length() * factor;
        const clamped = Math.min(controls.maxDistance, Math.max(controls.minDistance, distance));
        tween = { from: camera.position.clone(), to: camera.position.clone().setLength(clamped), start: performance.now() };
      },
      reset: () => placeCamera(VIEW_DIRECTIONS.front, true),
      setAutoRotate: (value) => {
        controls.autoRotate = value && !reducedMotion;
        needsRender = true;
      },
    };

    return () => {
      disposed = true;
      api.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", stopAutoRotate);
      controls.dispose();
      disposeObject(scene);
      envTexture.dispose();
      pmrem.dispose();
      environment.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [src, alt]);

  if (webglMissing) return null;
  return <div ref={hostRef} className="absolute inset-0" />;
});

export default ModelStage;
