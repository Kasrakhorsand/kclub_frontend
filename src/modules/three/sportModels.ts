/**
 * Procedural three.js models for the sport picker: photo-textured rackets,
 * tennis balls, a volleyball and a hand. Units are scene units (~1 = 10 cm).
 */
import * as THREE from "three";
import PADEL from "@/modules/three/geometry/padel-shape.json";
import BEACH from "@/modules/three/geometry/beach-shape.json";

/** Racket outline traced from the photo: size `w`×`h` and shapes with outer ring `o` and holes `h`, in 0–1 UV space. */
type Outline = { w: number; h: number; s: { o: number[][]; h: number[][][] }[] };

/** Racket extruded from its photo outline (holes cut through) and textured with the photo. */
export function photoRacket(img: string, shape: Outline, height: number) {
  const T = THREE;
  const Hn = height, Wn = (Hn * shape.w) / shape.h, G = new T.Group();
  const V = ([u, v]: number[]) => new T.Vector2((u - 0.5) * Wn, (0.5 - v) * Hn);
  const tex = new T.TextureLoader().load(img);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(1 / Wn, 1 / Hn);
  tex.offset.set(0.5, 0.5);
  const cap = new T.MeshStandardMaterial({ map: tex, roughness: 0.38, metalness: 0.2, envMapIntensity: 0.65 });
  const side = new T.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.85, metalness: 0.1, envMapIntensity: 0.2 });
  shape.s.forEach((sh) => {
    const s = new T.Shape(sh.o.map(V));
    sh.h.forEach((h) => s.holes.push(new T.Path(h.map(V))));
    const g = new T.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 });
    g.translate(0, 0, -0.13);
    G.add(new T.Mesh(g, [cap, side]));
  });
  G.position.y = 0.1;
  return { group: G, pivotY: -Hn / 2 + 0.1 };
}
export const padelRacket = () => photoRacket("/models/padel-racket.webp", PADEL as Outline, 4.7);
export const beachRacket = () => photoRacket("/models/beach-racket.webp", BEACH as Outline, 4.6);

/** Felt tennis ball with the classic curved seam. */
/** Felt ball of radius `r` with a seam stripe; colours are CSS hex strings. */
export function tennisBall(r: number, base: string, seam: string) {
  const T = THREE;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const x = c.getContext("2d")!;
  x.fillStyle = base;
  x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 9000; i++) {
    x.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.08})`;
    x.fillRect(Math.random() * 512, Math.random() * 256, 1.5, 1.5);
  }
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  const G = new T.Group();
  G.add(new T.Mesh(new T.SphereGeometry(r, 48, 32), new T.MeshStandardMaterial({ map: tex, bumpMap: new T.CanvasTexture(c), bumpScale: 0.02, roughness: 0.95 })));
  const pts: THREE.Vector3[] = [];
  const a = 0.68, b = 0.32;
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI * 2;
    pts.push(new T.Vector3(a * Math.cos(t) + b * Math.cos(3 * t), a * Math.sin(t) - b * Math.sin(3 * t), 2 * Math.sqrt(a * b) * Math.sin(2 * t)).normalize().multiplyScalar(r * 1.004));
  }
  G.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 240, r * 0.045, 8, true), new T.MeshStandardMaterial({ color: seam, roughness: 0.7 })));
  return G;
}

/** Volleyball: the product photo projected onto a sphere. */
/** Panelled volleyball of radius `r`. */
export function volleyball(r: number) {
  const T = THREE;
  const g = new T.SphereGeometry(r, 64, 48);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / r, y = pos.getY(i) / r, z = pos.getZ(i) / r;
    const sx = z >= 0 ? x : -x;
    uv.setXY(i, 0.5 + sx * 0.5 * 0.985, 0.5 + y * 0.5 * 0.985);
  }
  uv.needsUpdate = true;
  const tex = new T.TextureLoader().load("/models/volleyball.jpg");
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 8;
  return new T.Mesh(g, new T.MeshStandardMaterial({ map: tex, roughness: 0.5, envMapIntensity: 0.5 }));
}

/** Stylised hand with a K Club wristband. */
/** Stylised open hand that "sets" the volleyball. */
export function hand() {
  const T = THREE;
  const G = new T.Group();
  const skin = new T.MeshStandardMaterial({ color: 0x7e4b30, roughness: 0.7, envMapIntensity: 0.3 });
  const arm = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 3.2, 32), skin);
  arm.position.set(0, -2.2, 0);
  G.add(arm);
  const band = new T.Mesh(new T.TorusGeometry(0.47, 0.13, 16, 40), new T.MeshStandardMaterial({ color: 0x121214, roughness: 0.85 }));
  band.rotation.x = Math.PI / 2;
  band.position.y = -0.85;
  G.add(band);
  const stripe = new T.Mesh(new T.TorusGeometry(0.48, 0.03, 8, 40), new T.MeshStandardMaterial({ color: 0xc9a45c, metalness: 1, roughness: 0.25 }));
  stripe.rotation.x = Math.PI / 2;
  stripe.position.y = -0.85;
  G.add(stripe);
  const palm = new T.Mesh(new T.SphereGeometry(1, 40, 28), skin);
  palm.scale.set(0.78, 0.34, 0.82);
  palm.position.set(0, -0.3, 0);
  G.add(palm);
  const finger = (x: number, z: number, len: number, ang: number, rad = 0.13) => {
    const f = new T.Group();
    const c = new T.Mesh(new T.CylinderGeometry(rad, rad * 0.92, len, 16), skin);
    c.position.y = len / 2;
    f.add(c);
    const tip = new T.Mesh(new T.SphereGeometry(rad * 0.92, 16, 12), skin);
    tip.position.y = len;
    f.add(tip);
    f.add(new T.Mesh(new T.SphereGeometry(rad, 16, 12), skin));
    f.position.set(x, -0.22, z);
    f.rotation.set(ang, 0, 0);
    return f;
  };
  ([[-0.48, 0.95], [-0.16, 1.08], [0.16, 1.05], [0.46, 0.86]] as const).forEach(([x, l], i) => G.add(finger(x, -0.55, l, -1.25, 0.13 - i * 0.006)));
  const th = finger(0.72, 0.05, 0.82, -0.5, 0.15);
  th.rotation.z = -1.0;
  G.add(th);
  return G;
}
