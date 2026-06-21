import * as THREE from "three";

/** Total particles kept alive in the pool (shared across all bursts). */
const POOL_SIZE = 160;
/** How many particles each burst() spawns. */
const PARTICLES_PER_BURST = 16;
/** Downward acceleration applied to particles, in units/s^2. */
const GRAVITY = 9;
/** Velocity damping per second (1 = none); keeps motion from feeling floaty. */
const DRAG = 3.5;

interface Particle {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.MeshBasicMaterial;
  readonly velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

/**
 * Pooled particle-burst effect. Spawns a short-lived spray of glowing shards at
 * a point in world space (e.g. where an orb was collected). Particles are
 * recycled from a fixed pool, so a steady stream of bursts allocates nothing
 * after construction.
 *
 * Created in Game's constructor; `update(dt)` is ticked every frame and
 * `burst(position, color)` is called when something should pop.
 */
export class Particles {
  readonly group = new THREE.Group();
  private readonly pool: Particle[] = [];
  /** Round-robin cursor so reused particles spread across the pool. */
  private cursor = 0;

  constructor() {
    // One shared geometry; per-particle materials so each can fade/tint alone.
    const geometry = new THREE.IcosahedronGeometry(0.12, 0);
    for (let i = 0; i < POOL_SIZE; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({
        mesh,
        material,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
      });
    }
  }

  /** Emits a burst of particles at `position`, tinted with `color`. */
  burst(position: THREE.Vector3, color: THREE.ColorRepresentation): void {
    for (let i = 0; i < PARTICLES_PER_BURST; i++) {
      const p = this.acquire();

      // Spray outward in a random horizontal direction with an upward kick.
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const up = 2 + Math.random() * 3;
      p.velocity.set(
        Math.cos(angle) * speed,
        up,
        Math.sin(angle) * speed,
      );

      p.maxLife = 0.45 + Math.random() * 0.35;
      p.life = p.maxLife;
      p.active = true;

      p.material.color.set(color);
      p.material.opacity = 1;

      p.mesh.position.copy(position);
      p.mesh.scale.setScalar(1);
      p.mesh.visible = true;
    }
  }

  /** Advances every live particle; recycles those whose life has run out. */
  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        p.material.opacity = 0;
        continue;
      }

      // Integrate motion: gravity, drag, then position.
      p.velocity.y -= GRAVITY * dt;
      const damp = Math.max(0, 1 - DRAG * dt);
      p.velocity.multiplyScalar(damp);
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Fade and shrink over the particle's remaining life.
      const t = p.life / p.maxLife;
      p.material.opacity = t;
      p.mesh.scale.setScalar(0.3 + t * 0.7);
    }
  }

  /** Deactivates and hides every particle (used on round restart). */
  reset(): void {
    for (const p of this.pool) {
      p.active = false;
      p.mesh.visible = false;
      p.material.opacity = 0;
    }
  }

  /** Grabs the next pool slot, overwriting the oldest if all are busy. */
  private acquire(): Particle {
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.pool.length;
    return p;
  }
}
