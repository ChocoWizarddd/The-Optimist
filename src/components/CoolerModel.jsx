import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function disposeModel(root) {
  root?.traverse((object) => {
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
}

export default function CoolerModel() {
  const host = useRef(null);
  const [status, setStatus] = useState('Loading 3D model');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const root = host.current;
    if (!root) return undefined;

    let disposed = false;
    let frame = 0;
    let model = null;
    let controls = null;
    let resizeObserver = null;
    let renderer = null;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.setSize(root.clientWidth, root.clientHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.domElement.className = 'cooler-canvas';
      renderer.domElement.setAttribute('aria-label', 'Interactive 3D cooler model. Drag to rotate and scroll to zoom.');
      root.prepend(renderer.domElement);

      const scene = new THREE.Scene();
      // No scene background: the dashboard remains visible through the canvas.
      const camera = new THREE.PerspectiveCamera(34, root.clientWidth / root.clientHeight, 0.01, 100);
      camera.position.set(5, 3.5, 7);

      scene.add(new THREE.HemisphereLight(0xe4f4ff, 0x424b54, 1.8));
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      const key = new THREE.DirectionalLight(0xffffff, 2.8);
      key.position.set(4, 7, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xb9e3ff, 1.5);
      fill.position.set(-5, 2, -4);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 1.1);
      rim.position.set(-3, 4, 5);
      scene.add(rim);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.32;
      controls.minDistance = 0.6;
      controls.maxDistance = 30;
      controls.target.set(0, 0, 0);

      new GLTFLoader().load(
        '/models/cooler3Dmodel1.glb',
        (gltf) => {
          if (disposed) {
            disposeModel(gltf.scene);
            return;
          }

          model = gltf.scene;
          model.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const longestSide = Math.max(size.x, size.y, size.z);
          const scale = longestSide > 0 ? 4.4 / longestSide : 1;
          model.scale.setScalar(scale);
          model.position.copy(center).multiplyScalar(-scale);
          model.traverse((object) => {
            if (object.isMesh) {
              object.castShadow = false;
              object.receiveShadow = false;
            }
          });
          scene.add(model);

          const modelBounds = new THREE.Box3().setFromObject(model);
          const sphere = modelBounds.getBoundingSphere(new THREE.Sphere());
          const verticalFov = THREE.MathUtils.degToRad(camera.fov);
          const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
          const fitDistance = Math.max(
            sphere.radius / Math.sin(verticalFov / 2),
            sphere.radius / Math.sin(horizontalFov / 2),
          ) * 1.12;
          const viewDirection = new THREE.Vector3(0.58, 0.34, 0.74).normalize();
          camera.position.copy(viewDirection.multiplyScalar(fitDistance));
          camera.near = Math.max(0.01, fitDistance / 100);
          camera.far = fitDistance * 30;
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.minDistance = fitDistance * 0.42;
          controls.maxDistance = fitDistance * 3.2;
          controls.update();
          setStatus('INTERACTIVE 3D MODEL');
        },
        (event) => {
          if (event.total && !disposed) setStatus(`Loading model · ${Math.round((event.loaded / event.total) * 100)}%`);
        },
        () => {
          if (!disposed) {
            setFailed(true);
            setStatus('Model could not be loaded');
          }
        },
      );

      const draw = () => {
        if (disposed) return;
        frame = requestAnimationFrame(draw);
        controls.update();
        renderer.render(scene, camera);
      };
      draw();

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || !root.clientWidth || !root.clientHeight) return;
        renderer.setSize(root.clientWidth, root.clientHeight);
        camera.aspect = root.clientWidth / root.clientHeight;
        camera.updateProjectionMatrix();
      });
      resizeObserver.observe(root);

      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        controls?.dispose();
        disposeModel(model);
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch {
      setFailed(true);
      setStatus('WebGL is unavailable in this browser');
      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        controls?.dispose();
        disposeModel(model);
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    }
  }, []);

  return (
    <section className={`cooler-model panel ${failed ? 'model-error' : ''}`}>
      <div className="model-heading">
        <div><small>VISUALIZATION</small><b>OPT-001 · Cold storage unit</b></div>
        <span className="model-live"><i />{status}</span>
      </div>
      <div className="model-stage" ref={host}>
        {failed && <div className="model-fallback"><span>3D PREVIEW UNAVAILABLE</span><small>Check WebGL support or refresh the model asset.</small></div>}
        <div className="model-caption">Auto-rotating <span>·</span> Drag to rotate <span>·</span> Scroll to zoom</div>
      </div>
    </section>
  );
}
