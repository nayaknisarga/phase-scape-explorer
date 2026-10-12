import { useEffect, useRef } from 'react';
import type { PhaseKey } from '@/lib/phases';

export default function CycleScene({ phase }: { phase: PhaseKey }) {
  const host = useRef<HTMLDivElement>(null);
  const active = useRef(phase);
  useEffect(() => { active.current = phase; }, [phase]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let dispose = () => {};
    let stopped = false;
    void import('three').then((THREE) => {
      if (stopped) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
      camera.position.set(0, 0, 14);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0, 0);
      container.appendChild(renderer.domElement);
      const root = getComputedStyle(document.documentElement);
      const keys: PhaseKey[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];
      const group = new THREE.Group();
      scene.add(group);
      const arcs = keys.map((key, i) => {
        const material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(root.getPropertyValue(`--scene-${key}`).trim()), roughness: 0.3, metalness: 0.04, clearcoat: 0.6 });
        const mesh = new THREE.Mesh(new THREE.TorusGeometry(2.52, 0.49, 40, 100, Math.PI / 2 - 0.07), material);
        mesh.rotation.z = i * Math.PI / 2 + 0.035;
        group.add(mesh);
        return mesh;
      });
      group.rotation.set(0.43, -0.24, -0.35);
      scene.add(new THREE.AmbientLight(0xffffff, 2.3));
      const light = new THREE.DirectionalLight(0xffffff, 4);
      light.position.set(-3, 5, 8);
      scene.add(light);
      const rim = new THREE.DirectionalLight(0xffffff, 1.4);
      rim.position.set(5, -3, 2); scene.add(rim);
      const resize = () => {
        const width = container.clientWidth; const height = container.clientHeight;
        renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize); observer.observe(container); resize();
      let pointerX = 0; let pointerY = 0;
      const move = (e: PointerEvent) => { const r = container.getBoundingClientRect(); pointerX = (e.clientX - r.left) / r.width - 0.5; pointerY = (e.clientY - r.top) / r.height - 0.5; };
      const leave = () => { pointerX = 0; pointerY = 0; };
      container.addEventListener('pointermove', move); container.addEventListener('pointerleave', leave);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const t = clock.getElapsedTime();
        if (!reduced) { group.rotation.x += (0.43 + pointerY * 0.2 - group.rotation.x) * 0.035; group.rotation.y += (-0.24 + pointerX * 0.25 - group.rotation.y) * 0.035; group.position.y = Math.sin(t * 0.8) * 0.055; }
        arcs.forEach((arc, i) => { const target = keys[i] === active.current ? 1.025 : 1; arc.scale.lerp(new THREE.Vector3(target, target, target), 0.05); });
        renderer.render(scene, camera);
      });
      dispose = () => { observer.disconnect(); renderer.setAnimationLoop(null); container.removeEventListener('pointermove', move); container.removeEventListener('pointerleave', leave); arcs.forEach(a => { a.geometry.dispose(); a.material.dispose(); }); renderer.dispose(); renderer.domElement.remove(); };
    });
    return () => { stopped = true; dispose(); };
  }, []);
  return <div ref={host} className="cycle-canvas" role="img" aria-label={`Interactive 3D cycle ring, exploring the ${phase} phase`} />;
}