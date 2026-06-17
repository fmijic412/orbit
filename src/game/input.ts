/**
 * Tracks which movement keys are currently held.
 * Supports WASD and arrow keys.
 */
export class Input {
  private readonly held = new Set<string>();

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

  /** Horizontal axis: -1 (left) .. 1 (right). */
  get moveX(): number {
    let x = 0;
    if (this.held.has("KeyA") || this.held.has("ArrowLeft")) x -= 1;
    if (this.held.has("KeyD") || this.held.has("ArrowRight")) x += 1;
    return x;
  }

  /** Forward axis: -1 (back) .. 1 (forward, into the screen). */
  get moveZ(): number {
    let z = 0;
    if (this.held.has("KeyW") || this.held.has("ArrowUp")) z += 1;
    if (this.held.has("KeyS") || this.held.has("ArrowDown")) z -= 1;
    return z;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
