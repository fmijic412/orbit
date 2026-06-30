import * as THREE from "three";

/** How far from arena centre, on each axis, a hazard may roam. */
const ARENA_HALF = 16;
/** Edge of a hazard cube (it is a cube of this full side length). */
const HAZARD_SIZE = 1.2;
/** Half a hazard's side, used both for bounce bounds and collision. */
const HAZARD_HALF = HAZARD_SIZE / 2;
/** Hover height so hazards sit at roughly player height. */
const HAZARD_Y = 0.6;

const HAZARD_COLOR = 0xff3b3b;

/** Min/max per-axis speed (world units/second) of a roaming hazard. */
const MIN_SPEED = 3;
const MAX_SPEED = 6;

/**
 * Manages a set of red cubes that roam the arena along straight paths, bouncing
 * off the arena edges. They never leave the bounds, so the player can always
 * read and dodge them.
 *
 * A full pool of `maxCount` cubes is created up front, but only the first
 * `activeCount` are simulated, drawn and collided. The difficulty system grows
 * `activeCount` and scales the per-frame speed as the round progresses (see
 * `setActiveCount` / `setSpeedScale`), so later levels feel busier and faster
 * without ever allocating new geometry mid-round.
 *
 * Created in Game's constructor, ticked from Game.update(), and queried with
 * `collides()` to apply a points penalty when the player is touched.
 */
export class Hazards {
  readonly group = new THREE.Group();

  private readonly cubes: THREE.Mesh[] = [];
  private readonly velocities: THREE.Vector3[] = [];

  /** Cubes initially active at round start; the floor `reset()` returns to. */
  private readonly baseCount: number;
  /** How many cubes are currently live (simulated, drawn and collided). */
  private activeCount: number;
  /** Multiplier applied to every hazard's travel speed (1 = base). */
  private speedScale = 1;

  constructor(count: number, maxCount: number = count) {
    this.baseCount = Math.min(count, maxCount);
    this.activeCount = this.baseCount;

    const geometry = new THREE.BoxGeometry(HAZARD_SIZE, HAZARD_SIZE, HAZARD_SIZE);
    for (let i = 0; i < maxCount; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: HAZARD_COLOR,
        emissive: 0x7a0000,
        emissiveIntensity: 0.6,
        metalness: 0.2,
        roughness: 0.5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true;
      cube.visible = i < this.activeCount;
      this.cubes.push(cube);
      this.velocities.push(new THREE.Vector3());
      this.randomize(cube, this.velocities[i]);
      this.group.add(cube);
    }
  }

  /**
   * Sets how many hazards are live, clamped to [0, pool size]. Cubes that
   * become newly active are re-seeded to a fresh position/heading so they don't
   * pop in on top of the player; deactivated cubes are simply hidden.
   */
  setActiveCount(count: number): void {
    const next = THREE.MathUtils.clamp(count, 0, this.cubes.length);
    if (next > this.activeCount) {
      for (let i = this.activeCount; i < next; i++) {
        this.randomize(this.cubes[i], this.velocities[i]);
      }
    }
    this.activeCount = next;
    for (let i = 0; i < this.cubes.length; i++) {
      this.cubes[i].visible = i < this.activeCount;
    }
  }

  /** Scales the travel speed of every hazard (1 = base speed). */
  setSpeedScale(scale: number): void {
    this.speedScale = Math.max(0, scale);
  }

  /** Re-seeds every hazard and returns difficulty to its round-start floor. */
  reset(): void {
    this.speedScale = 1;
    for (let i = 0; i < this.cubes.length; i++) {
      this.randomize(this.cubes[i], this.velocities[i]);
    }
    this.setActiveCount(this.baseCount);
  }

  private randomize(cube: THREE.Mesh, velocity: THREE.Vector3): void {
    cube.position.set(
      THREE.MathUtils.randFloatSpread(ARENA_HALF * 2),
      HAZARD_Y,
      THREE.MathUtils.randFloatSpread(ARENA_HALF * 2),
    );
    const angle = Math.random() * Math.PI * 2;
    const speed = THREE.MathUtils.randFloat(MIN_SPEED, MAX_SPEED);
    velocity.set(Math.cos(angle) * speed, 0, Math.sin(angle) * speed);
  }

  /** Moves each active hazard, bouncing it back inside the arena at the edges. */
  update(dt: number): void {
    const bound = ARENA_HALF - HAZARD_HALF;
    const step = dt * this.speedScale;
    for (let i = 0; i < this.activeCount; i++) {
      const cube = this.cubes[i];
      const vel = this.velocities[i];

      cube.position.x += vel.x * step;
      cube.position.z += vel.z * step;

      if (cube.position.x > bound) {
        cube.position.x = bound;
        vel.x = -Math.abs(vel.x);
      } else if (cube.position.x < -bound) {
        cube.position.x = -bound;
        vel.x = Math.abs(vel.x);
      }
      if (cube.position.z > bound) {
        cube.position.z = bound;
        vel.z = -Math.abs(vel.z);
      } else if (cube.position.z < -bound) {
        cube.position.z = -bound;
        vel.z = Math.abs(vel.z);
      }

      // A little tumble so they read as dangerous, not inert.
      cube.rotation.x += dt * 1.2;
      cube.rotation.y += dt * 0.8;
    }
  }

  /**
   * Returns true if the player (a unit cube, ~0.5 half-extent) overlaps any
   * hazard. Uses a generous circular test in the XZ plane combining both half
   * sizes so contact feels fair rather than pixel-perfect.
   */
  collides(playerPos: THREE.Vector3, playerHalf = 0.5): boolean {
    const reach = HAZARD_HALF + playerHalf;
    const reachSq = reach * reach;
    for (let i = 0; i < this.activeCount; i++) {
      const cube = this.cubes[i];
      const dx = cube.position.x - playerPos.x;
      const dz = cube.position.z - playerPos.z;
      if (dx * dx + dz * dz < reachSq) {
        return true;
      }
    }
    return false;
  }
}
