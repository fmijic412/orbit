import * as THREE from "three";
import type { Input } from "./input";

const SPEED = 8; // world units per second
const ARENA_HALF = 18; // keep the player inside the arena

/**
 * The player avatar: a glowing cube the user drives around the arena.
 */
export class Player {
  readonly mesh: THREE.Mesh;

  constructor() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4fa3ff,
      emissive: 0x1b3a66,
      metalness: 0.3,
      roughness: 0.4,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0.5, 0);
    this.mesh.castShadow = true;
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  /** Returns the player to the arena centre (used on round restart). */
  reset(): void {
    this.mesh.position.set(0, 0.5, 0);
  }

  update(dt: number, input: Input): void {
    const dir = new THREE.Vector3(input.moveX, 0, -input.moveZ);
    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(SPEED * dt);
      this.mesh.position.add(dir);
      this.mesh.position.x = THREE.MathUtils.clamp(
        this.mesh.position.x,
        -ARENA_HALF,
        ARENA_HALF,
      );
      this.mesh.position.z = THREE.MathUtils.clamp(
        this.mesh.position.z,
        -ARENA_HALF,
        ARENA_HALF,
      );
    }
    // A gentle spin so the cube feels alive.
    this.mesh.rotation.y += dt * 1.5;
  }
}
