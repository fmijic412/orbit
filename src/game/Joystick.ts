/**
 * An on-screen virtual joystick for touch devices.
 *
 * It owns a small DOM overlay (a base ring + a knob) mounted inside a
 * lower-left "active zone". Dragging inside the zone moves the knob and emits a
 * normalized analog axis in [-1, 1] on each of x (screen right) and y (screen
 * down). Gameplay maps that onto the movement plane; releasing snaps the axis
 * back to zero.
 *
 * The joystick only activates on coarse-pointer / touch devices. On a
 * mouse-only desktop it stays fully inert (its zone ignores pointer events) so
 * it never interferes with the cursor, buttons or the keyboard controls.
 */

/** Radius of the knob's travel from the base centre, in CSS pixels. */
const KNOB_RADIUS = 52;
/** A tiny dead-zone (fraction of KNOB_RADIUS) to swallow jitter near centre. */
const DEAD_ZONE = 0.12;

export class Joystick {
  /** The active-zone element that captures touches (lower-left of screen). */
  private readonly zone: HTMLDivElement;
  private readonly base: HTMLDivElement;
  private readonly knob: HTMLDivElement;

  /** Whether this device should show the joystick at all. */
  private readonly enabled: boolean;

  /** The pointer currently driving the stick (null when released). */
  private pointerId: number | null = null;
  /** Screen-space origin of the current drag (where the base is centred). */
  private originX = 0;
  private originY = 0;

  /** Latest normalized axis: x = right(+), y = down(+), each in [-1, 1]. */
  private axisX = 0;
  private axisY = 0;

  constructor() {
    this.enabled =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)").matches === true ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0);

    this.zone = document.createElement("div");
    this.zone.id = "joystick-zone";
    this.zone.classList.toggle("enabled", this.enabled);

    this.base = document.createElement("div");
    this.base.className = "joy-base hidden";

    this.knob = document.createElement("div");
    this.knob.className = "joy-knob";
    this.base.appendChild(this.knob);
    this.zone.appendChild(this.base);
    document.body.appendChild(this.zone);

    if (this.enabled) {
      this.zone.addEventListener("pointerdown", this.onPointerDown);
      this.zone.addEventListener("pointermove", this.onPointerMove);
      this.zone.addEventListener("pointerup", this.onPointerUp);
      this.zone.addEventListener("pointercancel", this.onPointerUp);
    }
  }

  /** Horizontal axis (screen right positive), in [-1, 1]. */
  get x(): number {
    return this.axisX;
  }

  /**
   * Vertical axis (screen up positive), in [-1, 1]. Screen "up" is negative in
   * DOM coordinates, so this flips the internal down-positive value to match
   * the game's "up = forward" convention.
   */
  get y(): number {
    return -this.axisY;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    this.zone.setPointerCapture(e.pointerId);
    this.originX = e.clientX;
    this.originY = e.clientY;
    this.base.style.left = `${e.clientX}px`;
    this.base.style.top = `${e.clientY}px`;
    this.base.classList.remove("hidden");
    this.updateFrom(e.clientX, e.clientY);
    e.preventDefault();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    this.updateFrom(e.clientX, e.clientY);
    e.preventDefault();
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    if (this.zone.hasPointerCapture(e.pointerId)) {
      this.zone.releasePointerCapture(e.pointerId);
    }
    this.pointerId = null;
    this.axisX = 0;
    this.axisY = 0;
    this.base.classList.add("hidden");
    this.knob.style.transform = "translate(-50%, -50%)";
  };

  /** Recomputes the axis and knob position from a pointer's screen coords. */
  private updateFrom(clientX: number, clientY: number): void {
    let dx = clientX - this.originX;
    let dy = clientY - this.originY;
    const dist = Math.hypot(dx, dy);
    if (dist > KNOB_RADIUS) {
      const scale = KNOB_RADIUS / dist;
      dx *= scale;
      dy *= scale;
    }

    let nx = dx / KNOB_RADIUS;
    let ny = dy / KNOB_RADIUS;
    if (Math.hypot(nx, ny) < DEAD_ZONE) {
      nx = 0;
      ny = 0;
    }
    this.axisX = nx;
    this.axisY = ny;
    this.knob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
  }

  dispose(): void {
    if (this.enabled) {
      this.zone.removeEventListener("pointerdown", this.onPointerDown);
      this.zone.removeEventListener("pointermove", this.onPointerMove);
      this.zone.removeEventListener("pointerup", this.onPointerUp);
      this.zone.removeEventListener("pointercancel", this.onPointerUp);
    }
    this.zone.remove();
  }
}
