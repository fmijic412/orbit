import * as THREE from "three";

const ARENA_HALF = 16;
const PICKUP_RADIUS = 1.1;

/**
 * Manages the glowing orbs the player collects. When one is picked up,
 * it respawns at a new random location and the score increases.
 */
export class Collectibles {
  readonly group = new THREE.Group();
  private readonly orbs: THREE.Mesh[] = [];

  constructor(count: number) {
    const geometry = new THREE.IcosahedronGeometry(0.5, 1);
    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xffcf5c,
        emissive: 0xff9d2e,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const orb = new THREE.Mesh(geometry, material);
      this.randomize(orb);
      this.orbs.push(orb);
      this.group.add(orb);
    }
  }

  private randomize(orb: THREE.Mesh): void {
    orb.position.set(
      THREE.MathUtils.randFloatSpread(ARENA_HALF * 2),
      0.6,
      THREE.MathUtils.randFloatSpread(ARENA_HALF * 2),
    );
  }

  /** Returns the number of orbs collected this frame. */
  update(dt: number, playerPos: THREE.Vector3): number {
    let collected = 0;
    for (const orb of this.orbs) {
      orb.rotation.y += dt * 2;
      orb.position.y = 0.6 + Math.sin(performance.now() * 0.003 + orb.id) * 0.15;
      if (orb.position.distanceTo(playerPos) < PICKUP_RADIUS) {
        this.randomize(orb);
        collected++;
      }
    }
    return collected;
  }
}
