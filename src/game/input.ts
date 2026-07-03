/** Clamps a value into the [-1, 1] range. */
function clamp1(v: number): number {
  return v < -1 ? -1 : v > 1 ? 1 : v;
}

/**
 * Tracks which movement keys are currently held and blends in an optional
 * analog axis (e.g. an on-screen joystick).
 *
 * Supports WASD and arrow keys. The analog channel is set via `setAxis` and is
 * summed with the keyboard, so gameplay code reads a single source-agnostic
 * axis. Each component is only clamped to [-1, 1] (not renormalized here), so a
 * partially-tilted joystick yields a shorter vector that the player treats as a
 * slower move.
 */
export class Input {
  private readonly held = new Set<string>();

  /** Analog axis from a joystick/pointer: x = right(+), z = forward(+). */
  private axisX = 0;
  private axisZ = 0;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.held.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.held.delete(e.code);
  };

  /**
   * Sets the analog movement axis from an external source (the joystick).
   * Both components are expected in [-1, 1]; forward is positive z.
   */
  setAxis(x: number, z: number): void {
    this.axisX = x;
    this.axisZ = z;
  }

  /** Horizontal axis: -1 (left) .. 1 (right); keyboard + analog combined. */
  get moveX(): number {
    let x = this.axisX;
    if (this.held.has("KeyA") || this.held.has("ArrowLeft")) x -= 1;
    if (this.held.has("KeyD") || this.held.has("ArrowRight")) x += 1;
    return clamp1(x);
  }

  /** Forward axis: -1 (back) .. 1 (forward, into the screen). */
  get moveZ(): number {
    let z = this.axisZ;
    if (this.held.has("KeyW") || this.held.has("ArrowUp")) z += 1;
    if (this.held.has("KeyS") || this.held.has("ArrowDown")) z -= 1;
    return clamp1(z);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
