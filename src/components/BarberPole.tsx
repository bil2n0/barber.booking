import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Interactive 3D barber pole — procedural geometry + shader-free stripe texture.
 * Auto-spins; horizontal drag adds spin with inertia; pointer parallax tilts the rig.
 */

const CREAM = "#ffcea3";
const RED = "#ed3e35";
const NAVY = "#274068";
const BRASS = 0xc9975c;

function makeStripeTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, w, h);

  // Diagonal repeating stripes — red / cream / navy / cream
  const stripe = 64;
  const band = stripe * 4;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 5.5);
  ctx.translate(-w, -h);
  for (let y = 0; y < h * 2 + band; y += band) {
    ctx.fillStyle = RED;
    ctx.fillRect(-w, y, w * 3, stripe);
    ctx.fillStyle = NAVY;
    ctx.fillRect(-w, y + stripe * 2, w * 3, stripe);
  }
  ctx.restore();

  // Soft edge shading baked into the texture for depth
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.42)");
  grad.addColorStop(0.28, "rgba(0,0,0,0)");
  grad.addColorStop(0.72, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function brassCap(radius: number, flip: boolean): THREE.Group {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({
    color: BRASS,
    metalness: 0.95,
    roughness: 0.32,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x2a1a10,
    metalness: 0.7,
    roughness: 0.45,
  });

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.16, radius * 1.16, 0.16, 48), dark);
  collar.position.y = 0.08;
  g.add(collar);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.18, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), brass);
  dome.scale.y = 0.85;
  dome.position.y = 0.16;
  g.add(dome);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 24), brass);
  stem.position.y = 0.16 + radius * 1.0 + 0.1;
  g.add(stem);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), brass);
  finial.position.y = stem.position.y + 0.2;
  g.add(finial);

  if (flip) g.rotation.x = Math.PI;
  return g;
}

export default function BarberPole({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "pan-y"; // vertical scroll stays native
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.1, 8.8);

    // ── Lighting: dark studio, warm key, red rim ──
    scene.add(new THREE.AmbientLight(0xffcea3, 0.18));
    const key = new THREE.SpotLight(0xffd9ae, 90, 40, Math.PI / 5, 0.45, 1.6);
    key.position.set(-4, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xed3e35, 26, 30, 1.7);
    rim.position.set(4.2, 1.2, -2.5);
    scene.add(rim);
    const fill = new THREE.PointLight(0x4a5f8a, 12, 30, 1.8);
    fill.position.set(3.5, -3, 4);
    scene.add(fill);

    // ── The pole ──
    const rig = new THREE.Group();
    scene.add(rig);
    const pole = new THREE.Group();
    rig.add(pole);

    const R = 0.82;
    const H = 3.1;

    const stripeTex = makeStripeTexture();
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, H, 64, 1, false),
      new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.55, metalness: 0.05 }),
    );
    pole.add(core);

    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 1.07, R * 1.07, H + 0.04, 64, 1, false),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.06,
        transmission: 0.92,
        thickness: 0.25,
        ior: 1.45,
        transparent: true,
        envMapIntensity: 1.2,
      }),
    );
    pole.add(glass);

    const top = brassCap(R, false);
    top.position.y = H / 2;
    pole.add(top);
    const bottom = brassCap(R, true);
    bottom.position.y = -H / 2;
    pole.add(bottom);

    // (Wall mount omitted — the pole floats free in the studio light.)

    rig.rotation.z = 0.04;

    // ── Interaction state ──
    let spin = 0.005; // idle spin speed (rad/frame)
    let vel = 0; // drag velocity
    let dragging = false;
    let lastX = 0;
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetTiltY = nx * 0.22;
      targetTiltX = ny * 0.12;
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      vel = dx * 0.0045;
      pole.rotation.y += vel;
    };
    const onUp = () => {
      dragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);

      if (!dragging) {
        pole.rotation.y += spin * (dt * 60) + vel;
        vel *= 0.94; // inertia decay
      }
      // Stripe crawl (classic rising illusion), tied to spin
      stripeTex.offset.y -= (spin + vel * 0.6) * 0.55 * (dt * 60);

      // Parallax tilt eases toward target
      tiltX += (targetTiltX - tiltX) * 0.05;
      tiltY += (targetTiltY - tiltY) * 0.05;
      rig.rotation.x = tiltX;
      rig.rotation.y = tiltY;
      rig.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.05;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
        }
      });
      stripeTex.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
