import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  className?: string;
};

export default function ThreeScrollBackground({ className }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.2, 3.6);

    const group = new THREE.Group();
    scene.add(group);

    const geometry = new THREE.IcosahedronGeometry(1.0, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.25,
      roughness: 0.35,
      transparent: true,
      opacity: 0.14,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.12 })
    );
    group.add(wire);

    const lightA = new THREE.DirectionalLight(0xffffff, 1.1);
    lightA.position.set(2, 2, 3);
    scene.add(lightA);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    host.appendChild(renderer.domElement);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const onScroll = () => {
      const y = window.scrollY || 0;
      const scrollT = Math.min(y / 900, 1.6);
      group.rotation.y = scrollT * 0.9;
      group.rotation.x = 0.25 + scrollT * 0.25;
      group.position.y = -scrollT * 0.25;
    };

    resize();
    onScroll();

    let raf = 0;
    const tick = () => {
      mesh.rotation.z += 0.0015;
      wire.rotation.z += 0.001;
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.cancelAnimationFrame(raf);

      renderer.dispose();
      geometry.dispose();
      material.dispose();
      (wire.material as THREE.Material).dispose();
      wire.geometry.dispose();

      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className={className} />;
}

