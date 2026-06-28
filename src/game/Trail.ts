import * as THREE from "three";

/** Number of ghost segments in the pool (also the cap on visible trail). */
const POOL_SIZE = 24;
/** How long each ghost lives before it has fully faded, in seconds. */
const SEGMENT_LIFE = 0.5;
/** Minimum distance the player must travel before a new ghost is dropped. */
const MIN_STEP = 0.45;
/** Opacity of a freshly spawned ghost (it fades from here to 0). */
const START_OPACITY = 0.5;
/** Scale of a freshly spawned ghost relative to the player cube. */
const START_SCALE = 0.9;

interface Segment {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.MeshBasicMaterial;
  life: number;
  active: boolean;
}

/**
 * A fading motion trail behind the player cube. Drops a short-lived "ghost"
 * cube at the player's position whenever it has moved far enough, then fades
 * and shrinks each ghost over its lifetime. Ghosts are recycled from a fixed
 * pool, so the trail never grows without bound and allocates nothing after
 * construction.
 *
 * Created in Game's constructor; `update(dt, playerPosition)` is ticked every
 * frame. Because new ghosts are only dropped while the player is moving, the
 * trail naturally fades away when the player stands still.
 */
export class Trail {
  readonly group = new THREE.Group();
  private readonly pool: Segment[] = [];
  /** Round-robin cursor so reused ghosts spread across the pool. */
  private cursor = 0;
  /** Last position a ghost was dropped at; null until the first drop. */
  private lastDrop: THREE.Vector3 | null = null;

  constructor(color: THREE.ColorRepresentation = 0x4fa3ff) {
    // One shared geometry; per-ghost materials so each fades independently.
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < POOL_SIZE; i++) {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({ mesh, material, life: 0, active: false });
    }
  }

  /**
   * Advances live ghosts and, if the player has moved far enough since the
   * last drop, emits a fresh ghost at its position.
   */
  update(dt: number, playerPosition: THREE.Vector3): void {
    if (this.lastDrop === null) {
      this.lastDrop = playerPosition.clone();
    } else if (playerPosition.distanceTo(this.lastDrop) >= MIN_STEP) {
      this.drop(playerPosition);
      this.lastDrop.copy(playerPosition);
    }

    for (const s of this.pool) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        s.mesh.visible = false;
        s.material.opacity = 0;
        continue;
      }
      const t = s.life / SEGMENT_LIFE;
      s.material.opacity = START_OPACITY * t;
      s.mesh.scale.setScalar(START_SCALE * t);
    }
  }

  /** Hides and recycles every ghost; called on round restart. */
  reset(): void {
    for (const s of this.pool) {
      s.active = false;
      s.mesh.visible = false;
      s.material.opacity = 0;
    }
    this.lastDrop = null;
  }

  /** Spawns a ghost at `position`, reusing the oldest pool slot. */
  private drop(position: THREE.Vector3): void {
    const s = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.pool.length;

    s.life = SEGMENT_LIFE;
    s.active = true;
    s.material.opacity = START_OPACITY;
    s.mesh.position.copy(position);
    s.mesh.scale.setScalar(START_SCALE);
    s.mesh.visible = true;
  }
}
