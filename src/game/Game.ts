import * as THREE from "three";
import { Input } from "./input";
import { Player } from "./Player";
import { Collectibles, ORB_COLOR } from "./Collectibles";
import { Particles } from "./Particles";

/** Length of a single round, in seconds. */
const ROUND_SECONDS = 60;

/** Base points awarded per orb before the combo multiplier is applied. */
const BASE_POINTS = 1;
/** Seconds you have after a pickup to chain the next one and keep the combo. */
const COMBO_WINDOW = 2;
/** Upper bound on the combo multiplier. */
const MAX_MULTIPLIER = 9;

type GameState = "playing" | "ended";

/**
 * Top-level game controller: owns the renderer, scene, camera and the
 * fixed-timestep-ish animation loop. New gameplay systems should be
 * created in the constructor and ticked from update().
 */
export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();

  private readonly input = new Input();
  private readonly player = new Player();
  private readonly collectibles = new Collectibles(6);
  private readonly particles = new Particles();

  private score = 0;
  private bestScore = 0;
  private timeLeft = ROUND_SECONDS;
  private state: GameState = "playing";

  /** Current combo multiplier (1 = no active combo). */
  private multiplier = 1;
  /** Time remaining, in seconds, before the combo lapses. */
  private comboTimer = 0;

  private readonly scoreEl = document.getElementById("score");
  private readonly bestEl = document.getElementById("best");
  private readonly timeEl = document.getElementById("time");
  private readonly comboEl = document.getElementById("combo");
  private readonly comboMultEl = document.getElementById("combo-mult");
  private readonly comboBarFillEl = document.getElementById("combo-bar-fill");
  private readonly endScreenEl = document.getElementById("end-screen");
  private readonly finalScoreEl = document.getElementById("final-score");
  private readonly newBestEl = document.getElementById("new-best");
  private readonly playAgainEl = document.getElementById("play-again");

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );

    this.buildWorld();
    this.scene.add(this.player.mesh);
    this.scene.add(this.collectibles.group);
    this.scene.add(this.particles.group);

    this.playAgainEl?.addEventListener("click", this.restart);
    this.updateHud();

    this.onResize();
    window.addEventListener("resize", this.onResize);
  }

  private buildWorld(): void {
    this.scene.background = new THREE.Color(0x05060a);
    this.scene.fog = new THREE.Fog(0x05060a, 30, 70);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 48),
      new THREE.MeshStandardMaterial({ color: 0x121828, roughness: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(48, 48, 0x2a3550, 0x1a2236);
    this.scene.add(grid);

    const ambient = new THREE.AmbientLight(0x6677aa, 0.6);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(10, 18, 8);
    key.castShadow = true;
    this.scene.add(key);
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private updateCamera(): void {
    // Smoothly follow the player from behind and above.
    const target = this.player.position;
    const desired = new THREE.Vector3(target.x, 14, target.z + 16);
    this.camera.position.lerp(desired, 0.08);
    this.camera.lookAt(target.x, 0.5, target.z);
  }

  private update(dt: number): void {
    // Particles keep animating even after the round ends so in-flight bursts
    // finish cleanly.
    this.particles.update(dt);

    if (this.state !== "playing") {
      // Frozen: keep rendering but ignore input, scoring and the clock.
      this.updateCamera();
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.decayCombo(dt);

    this.player.update(dt, this.input);
    const picked = this.collectibles.update(dt, this.player.position);
    if (picked.length > 0) {
      for (const pos of picked) {
        this.particles.burst(pos, ORB_COLOR);
      }
      this.addScore(picked.length);
    }
    this.updateHud();
    this.updateCamera();

    if (this.timeLeft <= 0) {
      this.endRound();
    }
  }

  /**
   * Awards points for orbs picked up this frame, applying — and extending —
   * the combo multiplier. All scoring is routed through here so the multiplier
   * is applied in exactly one place.
   */
  private addScore(orbs: number): void {
    // A pickup while the window is still open chains the combo and bumps the
    // multiplier; otherwise this pickup starts a fresh combo at x1.
    if (this.comboTimer > 0) {
      this.multiplier = Math.min(this.multiplier + 1, MAX_MULTIPLIER);
    } else {
      this.multiplier = 1;
    }
    this.score += orbs * BASE_POINTS * this.multiplier;
    this.comboTimer = COMBO_WINDOW;
  }

  /** Counts the combo window down; resets the multiplier when it lapses. */
  private decayCombo(dt: number): void {
    if (this.comboTimer <= 0) return;
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) {
      this.multiplier = 1;
    }
  }

  private updateHud(): void {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score}`;
    if (this.bestEl) this.bestEl.textContent = `Best: ${this.bestScore}`;
    if (this.timeEl) {
      this.timeEl.textContent = `Time: ${Math.ceil(this.timeLeft)}`;
    }
    this.updateComboHud();
  }

  private updateComboHud(): void {
    const active = this.multiplier > 1 && this.comboTimer > 0;
    this.comboEl?.classList.toggle("hidden", !active);
    if (!active) return;
    if (this.comboMultEl) this.comboMultEl.textContent = `x${this.multiplier}`;
    if (this.comboBarFillEl) {
      const pct = Math.max(0, Math.min(1, this.comboTimer / COMBO_WINDOW));
      this.comboBarFillEl.style.width = `${pct * 100}%`;
    }
  }

  private endRound(): void {
    this.state = "ended";

    const isNewBest = this.score > this.bestScore;
    if (isNewBest) {
      this.bestScore = this.score;
    }

    if (this.finalScoreEl) {
      this.finalScoreEl.textContent = `Final score: ${this.score}`;
    }
    this.newBestEl?.classList.toggle("hidden", !isNewBest);
    this.endScreenEl?.classList.remove("hidden");
    this.updateHud();
  }

  /** Resets score, timer and orbs and starts a fresh round. */
  private restart = (): void => {
    this.score = 0;
    this.timeLeft = ROUND_SECONDS;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.player.reset();
    this.collectibles.reset();
    this.particles.reset();
    this.endScreenEl?.classList.add("hidden");
    this.updateHud();
    this.state = "playing";
  };

  private loop = (): void => {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };

  start(): void {
    this.loop();
  }
}
