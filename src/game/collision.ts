/**
 * Pure collision & bounce math shared by the gameplay systems, kept free of
 * three.js and the DOM so it can be unit-tested with plain numbers. The hazard
 * system delegates its overlap test and its edge bounce here.
 */

/**
 * True when two points in the XZ plane are within `reach` of each other. Compares
 * squared distances so there is no per-call `sqrt`; `reach` is typically the sum
 * of the two objects' half-extents. The test is strict (`<`), matching the
 * original inline check.
 */
export function withinRangeXZ(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  reach: number,
): boolean {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz < reach * reach;
}

/** Result of a 1-D bounce: the clamped position and the (maybe flipped) velocity. */
export interface Bounce {
  readonly pos: number;
  readonly vel: number;
}

/**
 * Bounces a 1-D coordinate off the range `[-bound, bound]`. If `pos` is past a
 * wall it is clamped back onto the wall and the velocity is flipped to point
 * inward (toward the centre); when in-bounds, position and velocity pass through
 * unchanged.
 */
export function bounce1D(pos: number, vel: number, bound: number): Bounce {
  if (pos > bound) return { pos: bound, vel: -Math.abs(vel) };
  if (pos < -bound) return { pos: -bound, vel: Math.abs(vel) };
  return { pos, vel };
}
