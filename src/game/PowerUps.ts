import * as THREE from "three";

/** How far from arena centre, on each axis, a power-up may appear. */
const ARENA_HALF = 16;
/** Distance at which the player collects a power-up pickup. */
const PICKUP_RADIUS = 1.2;
/** Hover height of a pickup before its idle bob is applied. */
const PICKUP_Y = 0.7;

/** Min/max delay, in seconds, between one pickup despawning and the next. */
const SPAWN_MIN = 8;
const SPAWN_MAX = 14;

/** The two kinds of power-up the player can collect. */
export type PowerUpType = "speed" | "magnet";

/** Accent colour per type; reused for the HUD and the collect-particle burst. */
export const POWERUP_COLOR: Record<PowerUpType, number> = {
  speed: 0x66ff99,
  magnet: 0xc56bff,
};

/** Iterable list of the types, so we can build/iterate without re-listing. */
const TYPES: readonly PowerUpType[] = ["speed", "magnet"];

/**
 * Spawns and animates power-up pickups. At most one pickup exists at a time:
 * a spawn timer counts down while the arena is empty, then a random type
 * appears. The pickup bobs and spins until the player touches it, at which
 * point `update()` reports the collected type and re-arms the spawn timer.
 *
 * Created in Game's constructor, added to the scene via `group`, ticked from
 * Game.update(), and reset on round restart.
 */
export class PowerUps {
  readonly group = new THREE.Group();

  private readonly meshes: Record<PowerUpType, THREE.Mesh>;
  /** The type currently present in the arena, or null when none is spawned. */
  private active: PowerUpType | null = null;
  /** Seconds until the next pickup spawns (only counts down while inactive). */
  private spawnTimer: number;

  constructor() {
    this.meshes = {
      speed: this.makeMesh("speed"),
      magnet: this.makeMesh("magnet"),
    };
    for (const type of TYPES) {
      this.meshes[type].visible = false;
      this.group.add(this.meshes[type]);
    }
    this.spawnTimer = PowerUps.nextSpawnDelay();
  }

  /** A distinct mesh per type so the player can read them at a glance. */
  private makeMesh(type: PowerUpType): THREE.Mesh {
    const geometry =
      type === "speed"
        ? new THREE.OctahedronGeometry(0.55, 0)
        : new THREE.TorusGeometry(0.45, 0.16, 12, 24);
    const color = POWERUP_COLOR[type];
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.7,
      metalness: 0.1,
      roughness: 0.25,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  private static nextSpawnDelay(): number {
    return THREE.MathUtils.randFloat(SPAWN_MIN, SPAWN_MAX);
  }

  /** Places a random pickup somewhere in the arena and marks it active. */
  private spawn(): void {
    const type: PowerUpType = Math.random() < 0.5 ? "speed" : "magnet";
    const mesh = this.meshes[type];
    mesh.position.set(
      THREE.MathUtils.randFloatSpread(ARENA_HALF * 2),
      PICKUP_Y,
      THREE.MathUtils.randFloatSpread(ARENA_HALF * 2),
    );
    mesh.visible = true;
    this.active = type;
  }

  /**
   * Ticks the spawn timer and the live pickup's idle animation. Returns the
   * type collected this frame (despawning it and re-arming the timer), or null
   * if nothing was collected.
   */
  update(dt: number, playerPos: THREE.Vector3): PowerUpType | null {
    if (this.active === null) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn();
      }
      return null;
    }

    const mesh = this.meshes[this.active];
    mesh.rotation.y += dt * 1.6;
    mesh.rotation.x += dt * 0.8;
    mesh.position.y = PICKUP_Y + Math.sin(performance.now() * 0.004) * 0.18;

    if (mesh.position.distanceTo(playerPos) < PICKUP_RADIUS) {
      const collected = this.active;
      mesh.visible = false;
      this.active = null;
      this.spawnTimer = PowerUps.nextSpawnDelay();
      return collected;
    }
    return null;
  }

  /** Hides any live pickup and re-arms the spawn timer (round restart). */
  reset(): void {
    if (this.active !== null) {
      this.meshes[this.active].visible = false;
    }
    this.active = null;
    this.spawnTimer = PowerUps.nextSpawnDelay();
  }
}
