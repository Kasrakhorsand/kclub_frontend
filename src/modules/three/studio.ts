import * as THREE from "three";

/** Small soft-box studio used as the environment map for metallic materials. */
export function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x0a0a0b, side: THREE.BackSide })));
  const boxes: [number, number, number, number, number, number, number][] = [
    [0, 9, 0, 14, 0.4, 14, 10],
    [-11, 2, 3, 0.4, 10, 8, 6],
    [11, 3, -2, 0.4, 8, 10, 5],
    [0, -2, -12, 16, 6, 0.4, 2.5],
    [4, -9, 6, 10, 0.4, 6, 1.4],
    [-6, 6, 10, 6, 3, 0.4, 4],
  ];
  for (const [x, y, z, w, h, d, k] of boxes) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k * 0.95, k * 0.88) }));
    m.position.set(x, y, z);
    env.add(m);
  }
  const tex = pm.fromScene(env, 0.04).texture;
  pm.dispose();
  return tex;
}
