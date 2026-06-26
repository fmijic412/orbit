import * as THREE from "three";

const ARENA_HALF = 16;
const PICKUP_RADIUS = 1.1;

/** Radius within which an active Magnet power-up reels orbs toward the target. */
const MAGNET_RADIUS = 7;
/** Max distance, in world units/second, an orb is pulled while in magnet range. */
const MAGNET_PULL_SPEED = 16;

/** Base colour of a common orb; kept exported for callers that want a default. */
export const ORB_COLOR = 0xffcf5c;

/** The orb rarities, cheapest first. */
export type OrbTierName = "common" | "rare" | "bonus";

/**
 * Static description of an orb tier. `weight` biases the weighted spawn roll
 * (higher = more common); `life` is the lifetime in seconds before a spawned
 * orb of this tier re-rolls into a new one (null = it never expires).
 */
interface OrbTier {
  readonly name: OrbTierName;
  readonly value: number;
  readonly color: number;
  readonly emissive: number;
  /** Mesh scale relative to the shared base geometry, so tiers read by size. */
  readonly scale: number;
  readonly weight: number;
  readonly life: number | null;
}

/**
 * Three tiers: plentiful low-value commons, rarer 3-point orbs, and a scarce,
 * time-limited 5-point bonus that re-rolls if you don't grab it in time.
 */
const ORB_TIERS: readonly OrbTier[] = [
  { name: "common", value: 1, color: 0xffcf5c, emissive: 0xff9d2e, scale: 1.0, weight: 70, life: null },
  { name: "rare", value: 3, color: 0x5cd2ff, emissive: 0x2e9dff, scale: 1.28, weight: 24, life: null },
  { name: "bonus", value: 5, color: 0xff5cf0, emissive: 0xc12eff, scale: 1.55, weight: 6, life: 6 },
];

const TIER_WEIGHT_TOTAL = ORB_TIERS.reduce((sum, t) => sum + t.weight, 0);

/** A single orb picked up this frame: where, how much it's worth, its tint. */
export interface OrbPickup {
  readonly position: THREE.Vector3;
  readonly value: number;
  readonly color: number;
}

/** Runtime state for one orb: its mesh, material and current tier + lifetime. */
interface Orb {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.MeshStandardMaterial;
  tier: OrbTier;
  /** Remaining lifetime in seconds; Infinity for tiers that never expire. */
  life: number;
}

/**
 * Manages the glowing orbs the player collects. Each orb belongs to a tier
 * (common / rare / bonus) with its own colour, size and point value. When one
 * is picked up — or when a time-limited orb's lifetime lapses — it re-rolls a
 * new tier and respawns at a random location.
 */
export class Collectibles {
  readonly group = new THREE.Group();
  private readonly orbs: Orb[] = [];

  constructor(count: number) {
    const geometry = new THREE.IcosahedronGeometry(0.5, 1);
    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: ORB_COLOR,
        emissive: 0xff9d2e,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const orb: Orb = { mesh, material, tier: ORB_TIERS[0], life: Infinity };
      this.roll(orb);
      this.orbs.push(orb);
      this.group.add(mesh);
    }
  }

  /** Re-rolls every orb's tier and position (used on round restart). */
  reset(): void {
    for (const orb of this.orbs) {
      this.roll(orb);
    }
  }

  /** Picks a tier weighted by rarity. */
  private static pickTier(): OrbTier {
    let r = Math.random() * TIER_WEIGHT_TOTAL;
    for (const tier of ORB_TIERS) {
      r -= tier.weight;
      if (r < 0) return tier;
    }
    return ORB_TIERS[0];
  }

  /** Assigns a fresh tier (styling + value + lifetime) and a new position. */
  private roll(orb: Orb): void {
    const tier = Collectibles.pickTier();
    orb.tier = tier;
    orb.life = tier.life ?? Infinity;
    orb.material.color.setHex(tier.color);
    orb.material.emissive.setHex(tier.emissive);
    orb.mesh.scale.setScalar(tier.scale);
    orb.mesh.position.set(
      THREE.MathUtils.randFloatSpread(ARENA_HALF * 2),
      0.6,
      THREE.MathUtils.randFloatSpread(ARENA_HALF * 2),
    );
  }

  /**
   * Ticks every orb and returns the orbs picked up this frame (before they
   * re-roll). The caller sums the values for scoring and uses each position +
   * colour for the collect-particle burst.
   *
   * When `attract` is provided (an active Magnet power-up's target, usually the
   * player), orbs within `MAGNET_RADIUS` are steered toward it each frame so
   * they drift into reach.
   */
  update(
    dt: number,
    playerPos: THREE.Vector3,
    attract: THREE.Vector3 | null = null,
  ): OrbPickup[] {
    const picked: OrbPickup[] = [];
    for (const orb of this.orbs) {
      const mesh = orb.mesh;
      mesh.rotation.y += dt * 2;
      mesh.position.y = 0.6 + Math.sin(performance.now() * 0.003 + mesh.id) * 0.15;

      // Time-limited orbs (the bonus tier) re-roll when their lifetime lapses,
      // so a high-value orb you ignore won't sit there forever. They skip the
      // magnet/pickup checks this frame since they've just teleported.
      orb.life -= dt;
      if (orb.life <= 0) {
        this.roll(orb);
        continue;
      }

      if (attract) {
        const dx = attract.x - mesh.position.x;
        const dz = attract.z - mesh.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq > 1e-4 && distSq < MAGNET_RADIUS * MAGNET_RADIUS) {
          const dist = Math.sqrt(distSq);
          // Pull harder the closer the orb already is, capped at the orb's
          // remaining distance so it never overshoots the target.
          const pull = MAGNET_PULL_SPEED * (1 - dist / MAGNET_RADIUS);
          const step = Math.min(dist, pull * dt);
          mesh.position.x += (dx / dist) * step;
          mesh.position.z += (dz / dist) * step;
        }
      }

      if (mesh.position.distanceTo(playerPos) < PICKUP_RADIUS) {
        picked.push({
          position: mesh.position.clone(),
          value: orb.tier.value,
          color: orb.tier.color,
        });
        this.roll(orb);
      }
    }
    return picked;
  }
}
