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

export default function CoolerModel({ lowPower = false }) {
  const host = useRef(null);
  const [status, setStatus] = useState('Loading 3D model');
  const [failed, setFailed] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const root = host.current;
    if (!root) return undefined;
    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: '160px' });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = host.current;
    if (!root || !nearViewport) return undefined;

    let disposed = false;
    let frame = 0;
    let timer = 0;
    let model = null;
    let controls = null;
    let resizeObserver = null;
    let renderer = null;
    let fitModel = null;
    let visible = true;
    let intersectionObserver = null;
    let lastDraw = 0;
    const frameInterval = lowPower ? 1000 / 24 : 1000 / 30;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowPower,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 0.85 : 1.35));
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
      controls.autoRotateSpeed = lowPower ? 0.2 : 0.32;
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
          fitModel = () => {
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
          };
          fitModel();
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

      const scheduleDraw = () => {
        if (disposed || !visible || document.hidden || frame || timer) return;
        const delay = Math.max(0, frameInterval - (performance.now() - lastDraw));
        timer = window.setTimeout(() => {
          timer = 0;
          frame = requestAnimationFrame(draw);
        }, delay);
      };
      const draw = (now) => {
        frame = 0;
        if (disposed || !visible || document.hidden) return;
        lastDraw = now;
        controls.update();
        renderer.render(scene, camera);
        scheduleDraw();
      };
      const onVisibilityChange = () => {
        if (document.hidden) {
          window.clearTimeout(timer);
          timer = 0;
          cancelAnimationFrame(frame);
          frame = 0;
        } else {
          scheduleDraw();
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      scheduleDraw();

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || !root.clientWidth || !root.clientHeight) return;
        renderer.setSize(root.clientWidth, root.clientHeight);
        camera.aspect = root.clientWidth / root.clientHeight;
        camera.updateProjectionMatrix();
        fitModel?.();
        scheduleDraw();
      });
      resizeObserver.observe(root);
      intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) scheduleDraw();
        else {
          window.clearTimeout(timer);
          timer = 0;
          cancelAnimationFrame(frame);
          frame = 0;
        }
      }, { rootMargin: '100px' });
      intersectionObserver.observe(root);

      return () => {
        disposed = true;
        window.clearTimeout(timer);
        cancelAnimationFrame(frame);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
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
        window.clearTimeout(timer);
        cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        controls?.dispose();
        disposeModel(model);
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    }
  }, [lowPower, nearViewport]);

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
