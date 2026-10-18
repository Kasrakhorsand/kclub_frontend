"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { studioEnvironment } from "./studio";
import PARTS from "@/lib/geometry/logo-parts.json";

/** Traced outline: outer ring `o` and holes `h`, as [x, y] points. */
type Shape = { o: number[][]; h: number[][][] };
const KPARTS = PARTS as Record<"stem" | "arm" | "head" | "leg" | "ball", Shape[]>;

/**
 * The K Club emblem as a real 3D model: each piece is extruded from the
 * traced logo outline and textured with the original artwork, then
 * assembled with a fly-in animation and left floating, following the pointer.
 */
export default function Logo3D() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const T = THREE;
    const canvas = document.createElement("canvas");
    canvas.className = "k3c";
    el.appendChild(canvas);
    let R: THREE.WebGLRenderer;
    try {
      R = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      canvas.remove();
      setFailed(true);
      return;
    }
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.outputColorSpace = T.SRGBColorSpace;
    R.toneMapping = T.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.05;

    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(30, 1, 0.1, 100);
    cam.position.set(0, 0, 22);
    scene.environment = studioEnvironment(R);
    const key = new T.DirectionalLight(0xfff1d6, 2.2);
    key.position.set(-4, 6, 8);
    scene.add(key);
    const rim = new T.DirectionalLight(0xe0b866, 3);
    rim.position.set(6, -2, -6);
    scene.add(rim);
    scene.add(new T.AmbientLight(0xffffff, 0.5));

    const tex = new T.TextureLoader().load("/brand/k-emblem.webp");
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = R.capabilities.getMaxAnisotropy();
    const cap = new T.MeshStandardMaterial({ map: tex, metalness: 0.35, roughness: 0.42, envMapIntensity: 0.6 });
    const sideColor = { stem: 0x2c3137, arm: 0x8d939b, head: 0xb08a45, leg: 0xc39b55, ball: 0xc39b55 };
    const SZ = 10.5;
    const V = ([x, y]: number[]) => new T.Vector2(x, 1 - y);
    const make = (nm: keyof typeof KPARTS, depth: number) => {
      const g = new T.Group();
      const side = new T.MeshStandardMaterial({ color: sideColor[nm], metalness: 0.9, roughness: 0.45 });
      KPARTS[nm].forEach((sh) => {
        const s = new T.Shape(sh.o.map(V));
        sh.h.forEach((h) => s.holes.push(new T.Path(h.map(V))));
        const geo = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
        geo.translate(-0.5, -0.5, -depth / 2);
        geo.scale(SZ, SZ, SZ);
        g.add(new T.Mesh(geo, [cap, side]));
      });
      return g;
    };
    const root = new T.Group();
    scene.add(root);
    const parts = [
      { o: make("stem", 0.05), from: [-9, 1.5, -14], rot: [0, -2.4, -0.5], d: 0 },
      { o: make("arm", 0.04), from: [9, 8, -10], rot: [1.8, 0, -1.4], d: 0.18 },
      { o: make("leg", 0.04), from: [-7, -9, 8], rot: [-2, 0, 0.8], d: 0.36 },
      { o: make("head", 0.036), from: [10, 3, -16], rot: [0, 3.4, 0.6], d: 0.54 },
      { o: make("ball", 0.06), from: [0, 12, 6], rot: [0, 0, 0], d: 1.05, drop: true },
    ];
    parts.forEach((p) => root.add(p.o));

    const ease = (t: number) => 1 - Math.pow(1 - t, 4);
    const back = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
    const bounce = (t: number) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skip = still || sessionStorage.getItem("kclub-logo") === "1";
    let t0: number | null = null;
    let raf = 0;
    let mx = 0, my = 0, cmx = 0, cmy = 0;
    const hero = (el.closest(".hero3") as HTMLElement) ?? el;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => { mx = 0; my = 0; };
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    const size = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w) return;
      R.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const frame = () => {
      if (t0 === null) {
        R.compile(scene, cam);
        t0 = performance.now() - (skip ? 99999 : 0);
      }
      const t = (performance.now() - t0) / 1000;
      parts.forEach((p) => {
        if (p.drop) {
          const k = Math.min(1, Math.max(0, (t - p.d) / 1.1));
          p.o.position.set(0, (1 - bounce(k)) * p.from[1], (1 - ease(k)) * p.from[2]);
          p.o.rotation.set(0, (1 - k) * 6, (1 - k) * -4);
          p.o.visible = k > 0;
          return;
        }
        const k = Math.min(1, Math.max(0, (t - p.d) / 1.35));
        const e = back(k), q = 1 - ease(k);
        p.o.position.set((1 - e) * p.from[0], (1 - e) * p.from[1], q * p.from[2]);
        p.o.rotation.set(q * p.rot[0], q * p.rot[1], q * p.rot[2]);
        p.o.visible = k > 0;
      });
      if (t > 2.3) {
        sessionStorage.setItem("kclub-logo", "1");
        el.classList.add("built");
      }
      cmx += (mx - cmx) * 0.06;
      cmy += (my - cmy) * 0.06;
      const idle = Math.max(0, Math.min(1, (t - 1.8) / 1.5));
      root.rotation.y = Math.sin(t * 0.55) * 0.38 * idle + cmx * 0.9 + (1 - ease(Math.min(1, t / 2))) * -0.6;
      root.rotation.x = Math.sin(t * 0.4) * 0.07 * idle + cmy * 0.5;
      root.position.y = Math.sin(t * 0.9) * 0.12 * idle;
      key.position.x = -4 + Math.sin(t * 0.6) * 4;
      R.render(scene, cam);
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      R.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div className="klogo3" ref={host} role="img" aria-label="لوگوی سه‌بعدی کی کلاب">
      {failed && <img className="kflat" src="/brand/k-emblem.webp" alt="" />}
    </div>
  );
}
