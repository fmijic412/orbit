import * as THREE from "three";
import { Input } from "./input";
import { Player } from "./Player";
import { Collectibles } from "./Collectibles";
import { Particles } from "./Particles";
import { Audio } from "./Audio";
import { Hazards } from "./Hazards";
import { PowerUps, POWERUP_COLOR, type PowerUpType } from "./PowerUps";
import { Trail } from "./Trail";

/** Length of a single round, in seconds. */
const ROUND_SECONDS = 60;

/** Base points awarded per orb before the combo multiplier is applied. */
const BASE_POINTS = 1;
/** Seconds you have after a pickup to chain the next one and keep the combo. */
const COMBO_WINDOW = 2;
/** Upper bound on the combo multiplier. */
const MAX_MULTIPLIER = 9;

/** Points deducted when the player touches a hazard cube. */
const HAZARD_PENALTY = 5;
/** Colour of the burst played when a hazard hits the player. */
const HAZARD_BURST_COLOR = 0xff3b3b;
/** Seconds of post-hit invulnerability so one bump is not a chain of hits. */
const IFRAMES_SECONDS = 1.2;

/** Trauma added by a hazard hit (0..1). Kept subtle to avoid discomfort. */
const HAZARD_SHAKE = 0.6;
/** How quickly trauma bleeds back to 0, in trauma-units per second. */
const TRAUMA_DECAY = 1.6;
/** Peak positional offset, in world units, at full trauma. */
const SHAKE_MAX_OFFSET = 0.7;

/** How long a Speed power-up lasts, in seconds. */
const SPEED_BOOST_SECONDS = 6;
/** Move-speed multiplier applied while a Speed power-up is active. */
const SPEED_BOOST_SCALE = 1.6;
/** How long a Magnet power-up lasts, in seconds. */
const MAGNET_SECONDS = 6;

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
  private readonly trail = new Trail();
  private readonly hazards = new Hazards(4);
  private readonly powerups = new PowerUps();
  private readonly audio = new Audio();

  /** Set once the first user gesture has unblocked + started audio. */
  private audioStarted = false;

  private score = 0;
  private bestScore = 0;
  private timeLeft = ROUND_SECONDS;
  private state: GameState = "playing";

  /** Current combo multiplier (1 = no active combo). */
  private multiplier = 1;
  /** Time remaining, in seconds, before the combo lapses. */
  private comboTimer = 0;

  /** Remaining invulnerability time after a hazard hit (0 = vulnerable). */
  private iFrames = 0;

  /** Remaining Speed power-up time, in seconds (0 = inactive). */
  private speedTimer = 0;
  /** Remaining Magnet power-up time, in seconds (0 = inactive). */
  private magnetTimer = 0;

  /** Current camera trauma (0 = still, 1 = max shake); decays every frame. */
  private trauma = 0;
  /** The offset added to the camera last frame, removed before re-following. */
  private readonly shakeOffset = new THREE.Vector3();

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
  private readonly audioEl = document.getElementById("audio");
  private readonly puSpeedEl = document.getElementById("pu-speed");
  private readonly puMagnetEl = document.getElementById("pu-magnet");

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
    this.scene.add(this.trail.group);
    this.scene.add(this.collectibles.group);
    this.scene.add(this.hazards.group);
    this.scene.add(this.powerups.group);
    this.scene.add(this.particles.group);

    this.playAgainEl?.addEventListener("click", this.restart);
    // Audio must be unblocked by a user gesture; the first keypress or the
    // Play again button kicks the context and starts the ambience loop.
    window.addEventListener("keydown", this.onKeyDown);
    this.updateHud();
    this.updateAudioHud();

    this.onResize();
    window.addEventListener("resize", this.onResize);
  }

  /** First-gesture audio bootstrap plus the "M" mute toggle. */
  private onKeyDown = (e: KeyboardEvent): void => {
    this.ensureAudioStarted();
    if (e.code === "KeyM") {
      this.audio.toggleMute();
      this.updateAudioHud();
    }
  };

  /** Resumes the audio context and starts ambience on the first gesture. */
  private ensureAudioStarted(): void {
    if (this.audioStarted) return;
    this.audioStarted = true;
    void this.audio.resume();
    if (this.state === "playing") {
      this.audio.startAmbience();
    }
    this.updateAudioHud();
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

  /**
   * Adds trauma to the camera. Trauma is clamped to [0, 1] so repeated hits
   * intensify the shake without ever exceeding the (subtle) cap.
   */
  private shake(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  private updateCamera(dt: number): void {
    // Undo last frame's shake so the follow lerp works from the clean position
    // and the offset can never accumulate.
    this.camera.position.sub(this.shakeOffset);
    this.shakeOffset.set(0, 0, 0);

    // Smoothly follow the player from behind and above.
    const target = this.player.position;
    const desired = new THREE.Vector3(target.x, 14, target.z + 16);
    this.camera.position.lerp(desired, 0.08);
    this.camera.lookAt(target.x, 0.5, target.z);

    // Bleed trauma down and apply a fresh randomized offset on top of the
    // follow position. Squaring trauma makes small amounts gentle.
    this.trauma = Math.max(0, this.trauma - TRAUMA_DECAY * dt);
    if (this.trauma > 0) {
      const power = this.trauma * this.trauma * SHAKE_MAX_OFFSET;
      this.shakeOffset.set(
        (Math.random() * 2 - 1) * power,
        (Math.random() * 2 - 1) * power,
        (Math.random() * 2 - 1) * power,
      );
      this.camera.position.add(this.shakeOffset);
    }
  }

  private update(dt: number): void {
    // Particles and the trail keep animating even after the round ends so any
    // in-flight bursts and ghost segments fade out cleanly. The player can't
    // move once frozen, so no new ghosts are dropped.
    this.particles.update(dt);
    this.trail.update(dt, this.player.position);

    if (this.state !== "playing") {
      // Frozen: keep rendering but ignore input, scoring and the clock. An
      // in-flight shake still decays so it doesn't freeze mid-jolt.
      this.updateCamera(dt);
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.decayCombo(dt);

    // Apply active power-up effects for this frame, then bleed their timers.
    const speedScale = this.speedTimer > 0 ? SPEED_BOOST_SCALE : 1;
    const attract = this.magnetTimer > 0 ? this.player.position : null;

    this.player.update(dt, this.input, speedScale);
    const picked = this.collectibles.update(dt, this.player.position, attract);
    if (picked.length > 0) {
      // Burst each orb in its own tier colour and sum the points it's worth so
      // rarer orbs score more — all routed through addScore for the multiplier.
      let value = 0;
      for (const orb of picked) {
        this.particles.burst(orb.position, orb.color);
        value += orb.value;
      }
      this.addScore(value);
      // Pitch the pickup blip up with the combo so chains feel like a scale.
      this.audio.pickup(this.multiplier - 1);
    }

    const grabbed = this.powerups.update(dt, this.player.position);
    if (grabbed) {
      this.activatePowerUp(grabbed);
    }
    this.tickPowerTimers(dt);

    this.hazards.update(dt);
    this.updateHazards(dt);

    this.updateHud();
    this.updateCamera(dt);

    if (this.timeLeft <= 0) {
      this.endRound();
    }
  }

  /**
   * Awards points for orbs picked up this frame, applying — and extending —
   * the combo multiplier. `value` is the summed point value of those orbs (so
   * rarer, higher-tier orbs score more). All scoring is routed through here so
   * the multiplier is applied in exactly one place.
   */
  private addScore(value: number): void {
    // A pickup while the window is still open chains the combo and bumps the
    // multiplier; otherwise this pickup starts a fresh combo at x1.
    if (this.comboTimer > 0) {
      this.multiplier = Math.min(this.multiplier + 1, MAX_MULTIPLIER);
    } else {
      this.multiplier = 1;
    }
    this.score += value * BASE_POINTS * this.multiplier;
    this.comboTimer = COMBO_WINDOW;
  }

  /**
   * Resolves hazard contact and the post-hit invulnerability window. While
   * invulnerable the player cube blinks; a fresh hit (only possible once the
   * window lapses) deducts points, breaks the combo and plays a buzz.
   */
  private updateHazards(dt: number): void {
    if (this.iFrames > 0) {
      this.iFrames = Math.max(0, this.iFrames - dt);
      // Blink a few times per second while invulnerable.
      this.player.mesh.visible = Math.floor(this.iFrames * 10) % 2 === 0;
      if (this.iFrames === 0) {
        this.player.mesh.visible = true;
      }
      return;
    }

    if (this.hazards.collides(this.player.position)) {
      this.score = Math.max(0, this.score - HAZARD_PENALTY);
      // A hit breaks any active combo.
      this.multiplier = 1;
      this.comboTimer = 0;
      this.iFrames = IFRAMES_SECONDS;
      this.particles.burst(this.player.position, HAZARD_BURST_COLOR);
      this.audio.hit();
      this.shake(HAZARD_SHAKE);
    }
  }

  /** Counts the combo window down; resets the multiplier when it lapses. */
  private decayCombo(dt: number): void {
    if (this.comboTimer <= 0) return;
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) {
      this.multiplier = 1;
    }
  }

  /**
   * Activates a collected power-up. Picking up the same type again simply
   * refreshes its timer to full, so effects can be re-acquired before they
   * expire.
   */
  private activatePowerUp(type: PowerUpType): void {
    if (type === "speed") {
      this.speedTimer = SPEED_BOOST_SECONDS;
    } else {
      this.magnetTimer = MAGNET_SECONDS;
    }
    this.particles.burst(this.player.position, POWERUP_COLOR[type]);
    this.audio.powerup();
  }

  /** Bleeds the active power-up timers toward 0 each frame. */
  private tickPowerTimers(dt: number): void {
    if (this.speedTimer > 0) {
      this.speedTimer = Math.max(0, this.speedTimer - dt);
    }
    if (this.magnetTimer > 0) {
      this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    }
  }

  private updateHud(): void {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score}`;
    if (this.bestEl) this.bestEl.textContent = `Best: ${this.bestScore}`;
    if (this.timeEl) {
      this.timeEl.textContent = `Time: ${Math.ceil(this.timeLeft)}`;
    }
    this.updateComboHud();
    this.updatePowerUpHud();
  }

  /** Shows/hides each power-up indicator and refreshes its countdown. */
  private updatePowerUpHud(): void {
    this.setPowerUpIndicator(this.puSpeedEl, this.speedTimer);
    this.setPowerUpIndicator(this.puMagnetEl, this.magnetTimer);
  }

  private setPowerUpIndicator(el: HTMLElement | null, timer: number): void {
    if (!el) return;
    const active = timer > 0;
    el.classList.toggle("hidden", !active);
    if (active) {
      const timeEl = el.querySelector(".pu-time");
      if (timeEl) {
        timeEl.textContent = `${Math.ceil(timer)}s`;
      }
    }
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

  /** Reflects the current mute state in the HUD audio indicator. */
  private updateAudioHud(): void {
    if (!this.audioEl) return;
    this.audioEl.textContent = this.audio.isMuted ? "♪ Muted (M)" : "♪ Sound (M)";
    this.audioEl.classList.toggle("muted", this.audio.isMuted);
  }

  private endRound(): void {
    this.state = "ended";
    this.audio.stopAmbience();

    // Don't leave the cube mid-blink if the round ends during i-frames.
    this.iFrames = 0;
    this.player.mesh.visible = true;

    // Clear any active power-up effects so their HUD indicators don't linger.
    this.speedTimer = 0;
    this.magnetTimer = 0;

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
    this.iFrames = 0;
    this.trauma = 0;
    this.speedTimer = 0;
    this.magnetTimer = 0;
    this.player.reset();
    this.player.mesh.visible = true;
    this.collectibles.reset();
    this.hazards.reset();
    this.powerups.reset();
    this.particles.reset();
    this.trail.reset();
    this.endScreenEl?.classList.add("hidden");
    this.updateHud();
    this.state = "playing";

    // Clicking "Play again" is itself a gesture, so (re)start audio here.
    this.ensureAudioStarted();
    void this.audio.resume();
    this.audio.startAmbience();
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
