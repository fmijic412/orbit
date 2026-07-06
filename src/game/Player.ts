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

  /**
   * Moves the player from input. `speedScale` (default 1) multiplies the base
   * move speed so an active Speed power-up can make the cube dash.
   */
  update(dt: number, input: Input, speedScale = 1): void {
    const dir = new THREE.Vector3(input.moveX, 0, -input.moveZ);
    const len = dir.length();
    if (len > 0) {
      // Clamp the vector to a max length of 1 rather than always normalizing:
      // keyboard cardinals (len 1) are unchanged, keyboard diagonals (len ~1.41)
      // get capped so diagonal isn't faster, and a partially-tilted analog
      // joystick (len < 1) keeps its magnitude so it moves proportionally slower.
      if (len > 1) {
        dir.divideScalar(len);
      }
      dir.multiplyScalar(SPEED * speedScale * dt);
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
