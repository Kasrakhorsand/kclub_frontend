"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { studioEnvironment } from "./studio";
import { beachRacket, hand, padelRacket, tennisBall, volleyball } from "./sportModels";

export type SportKind = "padel" | "tennis" | "volley";
export type SportStageHandle = { hit: () => void };

/**
 * One 3D card model: a racket with ball, or a hand with a volleyball.
 * Idles and follows the pointer; `hit()` plays the strike animation.
 */
const SportStage = forwardRef<SportStageHandle, { kind: SportKind; index: number; onFail?: () => void }>(function SportStage(
  { kind, index, onFail },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef(-1);
  useImperativeHandle(ref, () => ({ hit: () => (hitRef.current = 0) }), []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const T = THREE;
    let R: THREE.WebGLRenderer;
    try {
      R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    } catch {
      onFail?.();
      return;
    }
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.outputColorSpace = T.SRGBColorSpace;
    R.toneMapping = T.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.1;
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
    cam.position.set(0, 0, 12);
    scene.environment = studioEnvironment(R);
    const key = new T.DirectionalLight(0xfff3dc, 2.2);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const rim = new T.DirectionalLight(0xc9a45c, 2.4);
    rim.position.set(5, -1, -5);
    scene.add(rim);
    scene.add(new T.AmbientLight(0xffffff, 0.3));

    const root = new T.Group();
    scene.add(root);
    let obj: THREE.Object3D, ball: THREE.Object3D, pivot: THREE.Group | null = null;
    let ballBase: THREE.Vector3;
    if (kind === "volley") {
      obj = hand();
      obj.position.set(0, -1.6, 0);
      obj.rotation.set(0.45, 1.15, 0.12);
      root.add(obj);
      ball = volleyball(1.05);
      ballBase = new T.Vector3(-0.15, 0.55, 0.1);
    } else {
      const r = kind === "padel" ? padelRacket() : beachRacket();
      pivot = new T.Group();
      pivot.position.y = r.pivotY;
      r.group.position.y = -r.pivotY;
      pivot.add(r.group);
      obj = new T.Group();
      obj.add(pivot);
      obj.position.set(-0.25, -0.05, 0);
      obj.scale.setScalar(0.9);
      obj.rotation.set(0, 0.35, 0.28);
      root.add(obj);
      ball = kind === "tennis" ? tennisBall(0.3, "#F6A23A", "#FFF6E4") : tennisBall(0.3, "#D5EC3C", "#F6F7EE");
      ballBase = new T.Vector3(1.5, 1.1, 0.9);
    }
    ball.position.copy(ballBase);
    root.add(ball);

    const card = cv.closest(".pk3") as HTMLElement;
    let mx = 0, my = 0, cx = 0, cy = 0, hover = 0, hv = 0;
    const onMove = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      hover = 1;
    };
    const onLeave = () => { mx = 0; my = 0; hover = 0; };
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    const size = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w) return;
      R.setSize(w, h, false);
      cam.aspect = w / h;
      cam.position.z = w / h < 0.8 ? 14 : 12;
      cam.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    let raf = 0, last = performance.now(), t = index * 1.3;
    const t0 = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const intro = Math.min(1, (now - t0) / 900);
      cx += (mx - cx) * 0.08;
      cy += (my - cy) * 0.08;
      hv += (hover - hv) * 0.08;
      root.rotation.y = cx * 0.8 + Math.sin(t * 0.6) * 0.18 * (1 - hv * 0.6);
      root.rotation.x = cy * 0.4;
      root.position.y = Math.sin(t * 1.2) * 0.12 + (1 - ease(intro)) * -2.5;
      root.scale.setScalar(0.85 + 0.15 * ease(intro));
      if (hitRef.current >= 0) hitRef.current += dt;
      const a = hitRef.current;
      if (kind === "volley") {
        if (a < 0) {
          ball.position.y = ballBase.y + Math.abs(Math.sin(t * 2.2)) * 0.35 * (0.4 + hv);
          ball.rotation.y += dt * 0.6;
        } else {
          obj.position.y = -1.6 + (a < 0.18 ? (-a / 0.18) * 0.45 : a < 0.32 ? -0.45 + ((a - 0.18) / 0.14) * 1.1 : 0.65 - (a - 0.32) * 0.6);
          obj.rotation.x = 0.45 + (a < 0.18 ? -0.15 : a < 0.32 ? 0.35 : 0.2);
          if (a > 0.2) {
            const b = a - 0.2;
            ball.position.set(ballBase.x + b * 1.2, ballBase.y + b * 11 - b * b * 4, ballBase.z + b * 2);
            ball.rotation.x += dt * 14;
          }
        }
      } else if (pivot) {
        if (a < 0) {
          pivot.rotation.z = Math.sin(t * 1.6) * 0.06 * hv;
          ball.position.set(ballBase.x, ballBase.y + Math.sin(t * 2.4) * 0.2, ballBase.z);
          ball.rotation.y += dt;
        } else {
          pivot.rotation.z = a < 0.18 ? (a / 0.18) * 0.55 : a < 0.34 ? 0.55 - ((a - 0.18) / 0.16) * 1.75 : -1.2 + Math.min(1, (a - 0.34) / 0.5) * 1.2;
          pivot.rotation.x = a < 0.34 ? 0 : -0.25 * Math.min(1, (a - 0.34) / 0.2);
          if (a > 0.26) {
            const b = a - 0.26;
            ball.position.set(ballBase.x - b * 1.5, ballBase.y + b * 6.5 - b * b * 2, ballBase.z + b * 16);
            ball.rotation.x -= dt * 20;
          }
        }
      }
      R.render(scene, cam);
      if (!reduce || hitRef.current >= 0 || intro < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      R.dispose();
    };
  }, [kind, index, onFail]);

  return <canvas ref={canvasRef} className="sc3" aria-hidden="true" />;
});

export default SportStage;
