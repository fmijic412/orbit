import * as THREE from "three";
import { Input } from "./input";
import { Player } from "./Player";
import { Collectibles } from "./Collectibles";
import { Particles } from "./Particles";
import { Audio } from "./Audio";
import { Hazards } from "./Hazards";
import { PowerUps, POWERUP_COLOR, type PowerUpType } from "./PowerUps";
import { Trail } from "./Trail";
import { Skybox } from "./Skybox";
import { Joystick } from "./Joystick";
import { Settings } from "./Settings";
import { HighScores } from "./HighScores";
import { formatEntryDate } from "./leaderboard";
import { COUNTDOWN_SECONDS, countdownLabel, tickCountdown } from "./countdown";
import { flawlessBonus } from "./bonus";
import { GRADE_COLOR, gradeFor } from "./grade";
import {
  COMBO_WINDOW,
  applyHazardPenalty,
  decayCombo,
  nextMultiplier,
  pointsFor,
} from "./scoring";

/** Length of a single round, in seconds. */
const ROUND_SECONDS = 60;

/** How long "Go!" lingers after the countdown before live play begins. */
const GO_HOLD_SECONDS = 0.45;

/** Points deducted when the player touches a hazard cube. */
const HAZARD_PENALTY = 5;
/** Colour of the burst played when a hazard hits the player. */
const HAZARD_BURST_COLOR = 0xff3b3b;
/** Seconds of post-hit invulnerability so one bump is not a chain of hits. */
const IFRAMES_SECONDS = 1.2;

/** Colour of the celebratory burst played when a flawless round is rewarded. */
const FLAWLESS_BURST_COLOR = 0x5cffb0;

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

// --- Difficulty ramp ---------------------------------------------------------
// The round is divided into fixed-length "levels". Each level beyond the first
// adds hazards and scales their speed, so pressure builds steadily toward the
// final seconds. All ramp values live here so the curve is easy to tune.

/** Seconds of play before the difficulty steps up to the next level. */
const LEVEL_SECONDS = 15;
/** Hazards live at level 1 (also the floor Hazards.reset() returns to). */
const HAZARDS_BASE = 4;
/** Extra hazards activated per level beyond the first. */
const HAZARDS_PER_LEVEL = 1;
/** Hard cap on simultaneous hazards (the size of the pre-built pool). */
const HAZARDS_MAX = 10;
/** Added to the hazard speed multiplier for each level beyond the first. */
const HAZARD_SPEED_PER_LEVEL = 0.15;

type GameState = "menu" | "countdown" | "playing" | "paused" | "ended";

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
  private readonly joystick = new Joystick();
  private readonly player = new Player();
  private readonly collectibles = new Collectibles(6);
  private readonly particles = new Particles();
  private readonly trail = new Trail();
  private readonly hazards = new Hazards(HAZARDS_BASE, HAZARDS_MAX);
  private readonly powerups = new PowerUps();
  private readonly skybox = new Skybox();
  private readonly audio = new Audio();
  private readonly settings = new Settings();
  private readonly highScores = new HighScores();

  /** Set once the first user gesture has unblocked + started audio. */
  private audioStarted = false;

  private score = 0;
  /** Seeded from the persisted leaderboard so "Best" survives a reload. */
  private bestScore = this.highScores.best();
  private timeLeft = ROUND_SECONDS;
  /** Current difficulty level (1-based), derived from elapsed round time. */
  private level = 1;
  // The game opens on the main menu; nothing simulates until Start is pressed.
  private state: GameState = "menu";

  /** Remaining pre-round countdown time, in seconds (only used in "countdown"). */
  private countdown = 0;
  /** Remaining "Go!" hold after the countdown hits zero, before play begins. */
  private goHold = 0;

  /** Current combo multiplier (1 = no active combo). */
  private multiplier = 1;
  /** Time remaining, in seconds, before the combo lapses. */
  private comboTimer = 0;

  /** Remaining invulnerability time after a hazard hit (0 = vulnerable). */
  private iFrames = 0;
  /** Number of hazard hits taken this round; 0 at round end == a flawless run. */
  private hitCount = 0;

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
  private readonly levelEl = document.getElementById("level");
  private readonly comboEl = document.getElementById("combo");
  private readonly comboMultEl = document.getElementById("combo-mult");
  private readonly comboBarFillEl = document.getElementById("combo-bar-fill");
  private readonly endScreenEl = document.getElementById("end-screen");
  private readonly finalScoreEl = document.getElementById("final-score");
  private readonly newBestEl = document.getElementById("new-best");
  private readonly flawlessBonusEl = document.getElementById("flawless-bonus");
  private readonly gradeEl = document.getElementById("grade");
  private readonly leaderboardListEl = document.getElementById(
    "leaderboard-list",
  );
  private readonly leaderboardEmptyEl = document.getElementById(
    "leaderboard-empty",
  );
  private readonly playAgainEl = document.getElementById("play-again");
  private readonly pauseScreenEl = document.getElementById("pause-screen");
  private readonly resumeEl = document.getElementById("resume");
  private readonly countdownScreenEl = document.getElementById("countdown-screen");
  private readonly countdownLabelEl = document.getElementById("countdown-label");
  private readonly menuScreenEl = document.getElementById("menu-screen");
  private readonly startGameEl = document.getElementById("start-game");
  private readonly settingsGameEl = document.getElementById("settings-game");
  private readonly toMenuEl = document.getElementById("to-menu");
  private readonly settingsScreenEl = document.getElementById("settings-screen");
  private readonly closeSettingsEl = document.getElementById("close-settings");
  private readonly volumeSliderEl = document.getElementById(
    "volume-slider",
  ) as HTMLInputElement;
  private readonly sensitivitySliderEl = document.getElementById(
    "sensitivity-slider",
  ) as HTMLInputElement;
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
    this.scene.add(this.skybox.mesh);
    this.scene.add(this.player.mesh);
    this.scene.add(this.trail.group);
    this.scene.add(this.collectibles.group);
    this.scene.add(this.hazards.group);
    this.scene.add(this.powerups.group);
    this.scene.add(this.particles.group);

    this.playAgainEl?.addEventListener("click", this.restart);
    this.resumeEl?.addEventListener("click", this.resume);
    this.startGameEl?.addEventListener("click", this.restart);
    this.settingsGameEl?.addEventListener("click", this.showSettings);
    this.closeSettingsEl?.addEventListener("click", this.hideSettings);
    this.toMenuEl?.addEventListener("click", this.toMenu);
    this.volumeSliderEl?.addEventListener("input", this.onVolumeChange);
    this.sensitivitySliderEl?.addEventListener("input", this.onSensitivityChange);
    // Audio must be unblocked by a user gesture; the first keypress or the
    // Play again button kicks the context and starts the ambience loop.
    window.addEventListener("keydown", this.onKeyDown);
    this.updateHud();
    this.updateAudioHud();
    this.applySettings();

    this.onResize();
    window.addEventListener("resize", this.onResize);
  }

  /** First-gesture audio bootstrap, the "M" mute toggle and Esc pause. */
  private onKeyDown = (e: KeyboardEvent): void => {
    this.ensureAudioStarted();
    if (e.code === "KeyM") {
      this.audio.toggleMute();
      this.updateAudioHud();
    } else if (e.code === "Escape") {
      this.togglePause();
    }
  };

  /** Esc toggles pause, but only mid-round (never on the end screen). */
  private togglePause(): void {
    if (this.state === "playing") {
      this.pause();
    } else if (this.state === "paused") {
      this.resume();
    }
  }

  /** Freezes the round and shows the pause overlay; ducks the audio mix. */
  private pause(): void {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.audio.setDucked(true);
    this.pauseScreenEl?.classList.remove("hidden");
  }

  /** Resumes a paused round exactly where it left off. */
  private resume = (): void => {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.audio.setDucked(false);
    this.pauseScreenEl?.classList.add("hidden");
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
    // Fallback clear colour; in practice the animated Skybox dome covers it.
    this.scene.background = new THREE.Color(0x0a0d18);
    // Fog colour is tuned toward the skybox horizon so distant fogged geometry
    // dissolves into the gradient rather than a mismatched flat band.
    this.scene.fog = new THREE.Fog(0x18233d, 30, 70);

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
    // The sky animates continuously and follows the camera on every frame —
    // even on the menu or while paused — so the background always feels alive.
    this.skybox.update(dt, this.camera.position);

    if (this.state === "paused" || this.state === "menu") {
      // Fully frozen: the loop keeps re-rendering the current frame, but no
      // simulation, scoring, audio, particles or camera motion advances. For
      // "paused" this means resuming continues exactly where it left off; for
      // "menu" the scene sits idle behind the start overlay until Start is
      // pressed. (dt is already clamped in the loop, so no spike accumulates.)
      return;
    }

    if (this.state === "countdown") {
      // Pre-round hold: the simulation is frozen (clock, hazards, orbs and
      // scoring are all untouched) but the skybox animates and the camera eases
      // in behind the player so the scene stays alive while the player gets set.
      const { remaining, done } = tickCountdown(this.countdown, dt);
      this.countdown = remaining;
      this.updateCountdownHud();
      this.updateCamera(dt);
      if (done) {
        // The countdown has reached "Go!"; hold that frame briefly (still
        // frozen) so it's readable, then hand off to live play.
        this.goHold = Math.max(0, this.goHold - dt);
        if (this.goHold <= 0) {
          this.beginPlay();
        }
      }
      return;
    }

    // Particles and the trail keep animating even after the round ends so any
    // in-flight bursts and ghost segments fade out cleanly. The player can't
    // move once frozen, so no new ghosts are dropped.
    this.particles.update(dt);
    this.trail.update(dt, this.player.position);

    if (this.state !== "playing") {
      // Round over: keep rendering but ignore input, scoring and the clock. An
      // in-flight shake still decays so it doesn't freeze mid-jolt.
      this.updateCamera(dt);
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.tickComboWindow(dt);
    this.updateLevel();

    // Apply active power-up effects for this frame, then bleed their timers.
    const speedScale = this.speedTimer > 0 ? SPEED_BOOST_SCALE : 1;
    const attract = this.magnetTimer > 0 ? this.player.position : null;

    // Blend the on-screen joystick (touch) into the keyboard axis before moving.
    this.input.setAxis(this.joystick.x, this.joystick.y);
    // Apply sensitivity multiplier alongside power-up speed boost.
    const sensitivityScale = this.settings.getSensitivity();
    this.player.update(dt, this.input, speedScale * sensitivityScale);
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
    this.multiplier = nextMultiplier(this.multiplier, this.comboTimer > 0);
    this.score += pointsFor(value, this.multiplier);
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
      this.score = applyHazardPenalty(this.score, HAZARD_PENALTY);
      // A hit breaks any active combo and forfeits the flawless-round bonus.
      this.multiplier = 1;
      this.comboTimer = 0;
      this.hitCount += 1;
      this.iFrames = IFRAMES_SECONDS;
      this.particles.burst(this.player.position, HAZARD_BURST_COLOR);
      this.audio.hit();
      this.shake(HAZARD_SHAKE);
    }
  }

  /**
   * Derives the current level from elapsed round time and, when it steps up,
   * applies the new difficulty (more and faster hazards). Level is 1-based and
   * advances every LEVEL_SECONDS of play.
   */
  private updateLevel(): void {
    const elapsed = ROUND_SECONDS - this.timeLeft;
    const next = Math.floor(elapsed / LEVEL_SECONDS) + 1;
    if (next !== this.level) {
      this.level = next;
      this.applyLevel();
    }
  }

  /** Scales hazard count and speed for the current level via tuning constants. */
  private applyLevel(): void {
    const steps = this.level - 1;
    const count = Math.min(HAZARDS_MAX, HAZARDS_BASE + steps * HAZARDS_PER_LEVEL);
    this.hazards.setActiveCount(count);
    this.hazards.setSpeedScale(1 + steps * HAZARD_SPEED_PER_LEVEL);
  }

  /** Counts the combo window down; resets the multiplier when it lapses. */
  private tickComboWindow(dt: number): void {
    const { comboTimer, lapsed } = decayCombo(this.comboTimer, dt);
    this.comboTimer = comboTimer;
    if (lapsed) {
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

  /** Refreshes the big centered "3 · 2 · 1 · Go!" label during the countdown. */
  private updateCountdownHud(): void {
    if (!this.countdownLabelEl) return;
    const label = countdownLabel(this.countdown);
    // Re-trigger the per-tick pop animation only when the label actually
    // changes, so the number doesn't restart its animation every frame.
    if (this.countdownLabelEl.textContent !== label) {
      this.countdownLabelEl.textContent = label;
      this.countdownLabelEl.classList.remove("pop");
      // Force a reflow so removing + re-adding the class restarts the animation.
      void this.countdownLabelEl.offsetWidth;
      this.countdownLabelEl.classList.add("pop");
    }
  }

  /** Transitions from the pre-round countdown into live play. */
  private beginPlay(): void {
    this.countdown = 0;
    this.state = "playing";
    this.countdownScreenEl?.classList.add("hidden");
  }

  private updateHud(): void {
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score}`;
    if (this.bestEl) this.bestEl.textContent = `Best: ${this.bestScore}`;
    if (this.timeEl) {
      this.timeEl.textContent = `Time: ${Math.ceil(this.timeLeft)}`;
    }
    if (this.levelEl) this.levelEl.textContent = `Level: ${this.level}`;
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

    // Reward a flawless round (no hazard hits) *before* deciding best/rank, so
    // the bonus counts toward "New best!" and the leaderboard entry. Idle,
    // scoreless rounds don't qualify (see flawlessBonus).
    const bonus = flawlessBonus(this.hitCount, this.level, this.score);
    if (bonus > 0) {
      this.score += bonus;
      this.particles.burst(this.player.position, FLAWLESS_BURST_COLOR);
    }
    if (this.flawlessBonusEl) {
      this.flawlessBonusEl.textContent = `Flawless round! +${bonus}`;
    }
    this.flawlessBonusEl?.classList.toggle("hidden", bonus <= 0);

    // Compare against the old best *before* submitting, otherwise the round we
    // just recorded would always tie itself.
    const isNewBest = this.score > this.bestScore;
    // Scoreless rounds are not recorded, so submit() returns rank 0 for them.
    const rank = this.highScores.submit(this.score, this.level);
    if (isNewBest) {
      this.bestScore = this.score;
    }

    if (this.finalScoreEl) {
      this.finalScoreEl.textContent = `Final score: ${this.score}`;
    }
    // Grade the run from its final score (after any flawless bonus) so the
    // player gets a single at-a-glance verdict, tinted by tier.
    if (this.gradeEl) {
      const grade = gradeFor(this.score);
      this.gradeEl.textContent = grade;
      this.gradeEl.style.color = GRADE_COLOR[grade];
      // Restart the pop animation so it replays on every round, not just the
      // first render — remove the class, force a reflow, then re-add it.
      this.gradeEl.classList.remove("pop");
      void this.gradeEl.offsetWidth;
      this.gradeEl.classList.add("pop");
    }
    this.newBestEl?.classList.toggle("hidden", !isNewBest);
    this.renderLeaderboard(rank);
    this.endScreenEl?.classList.remove("hidden");
    this.updateHud();
  }

  /**
   * Rebuilds the top-5 table on the end screen. `highlightRank` is the 1-based
   * rank of the round that just finished (0 when it didn't place), which marks
   * that row so the player can spot their result at a glance.
   */
  private renderLeaderboard(highlightRank: number): void {
    const entries = this.highScores.list;
    this.leaderboardEmptyEl?.classList.toggle("hidden", entries.length > 0);

    const list = this.leaderboardListEl;
    if (!list) return;
    list.replaceChildren();

    entries.forEach((entry, i) => {
      const row = document.createElement("li");
      row.classList.toggle("current", i + 1 === highlightRank);

      const rank = document.createElement("span");
      rank.className = "lb-rank";
      rank.textContent = `${i + 1}.`;

      const score = document.createElement("span");
      score.className = "lb-score";
      score.textContent = `${entry.score}`;

      const meta = document.createElement("span");
      meta.className = "lb-meta";
      meta.textContent = `L${entry.level} · ${formatEntryDate(entry.date)}`;

      row.append(rank, score, meta);
      list.append(row);
    });
  }

  /** Resets score, timer and orbs and starts a fresh round. */
  private restart = (): void => {
    this.score = 0;
    this.timeLeft = ROUND_SECONDS;
    this.level = 1;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.iFrames = 0;
    this.hitCount = 0;
    this.trauma = 0;
    this.speedTimer = 0;
    this.magnetTimer = 0;
    this.player.reset();
    this.player.mesh.visible = true;
    this.collectibles.reset();
    // Returns hazard count/speed to their level-1 floor for a clean new round.
    this.hazards.reset();
    this.powerups.reset();
    this.particles.reset();
    this.trail.reset();
    this.endScreenEl?.classList.add("hidden");
    this.pauseScreenEl?.classList.add("hidden");
    this.menuScreenEl?.classList.add("hidden");
    this.audio.setDucked(false);
    this.updateHud();

    // Open on a short "3 · 2 · 1 · Go!" hold before live play begins. The round
    // clock, hazards and scoring stay frozen until the countdown reaches "Go!".
    this.countdown = COUNTDOWN_SECONDS;
    this.goHold = GO_HOLD_SECONDS;
    this.updateCountdownHud();
    this.countdownScreenEl?.classList.remove("hidden");
    this.state = "countdown";

    // Clicking "Start"/"Play again" is itself a user gesture, so (re)start audio
    // here — this is where a fresh AudioContext is unblocked from the menu.
    this.ensureAudioStarted();
    void this.audio.resume();
    this.audio.startAmbience();
  };

  /**
   * Returns to the main menu from the end-of-round screen. The round stays
   * frozen (state "menu") behind the overlay until the player presses Start,
   * which runs restart() for a clean fresh round.
   */
  private toMenu = (): void => {
    this.state = "menu";
    this.audio.stopAmbience();
    this.audio.setDucked(false);
    this.endScreenEl?.classList.add("hidden");
    this.pauseScreenEl?.classList.add("hidden");
    this.countdownScreenEl?.classList.add("hidden");
    this.menuScreenEl?.classList.remove("hidden");
    this.settingsScreenEl?.classList.add("hidden");
  };

  /** Shows the settings overlay and hides the menu. */
  private showSettings = (): void => {
    this.menuScreenEl?.classList.add("hidden");
    this.settingsScreenEl?.classList.remove("hidden");
    this.updateSettingsUI();
  };

  /** Hides the settings overlay and shows the menu. */
  private hideSettings = (): void => {
    this.settingsScreenEl?.classList.add("hidden");
    this.menuScreenEl?.classList.remove("hidden");
  };

  /** Updates the slider UI to reflect current settings. */
  private updateSettingsUI(): void {
    if (this.volumeSliderEl) {
      const volume = this.settings.getVolume();
      this.volumeSliderEl.value = (volume * 100).toString();
      const volumeValueEl = document.getElementById("volume-value");
      if (volumeValueEl) {
        volumeValueEl.textContent = `${Math.round(volume * 100)}%`;
      }
    }
    if (this.sensitivitySliderEl) {
      const sensitivity = this.settings.getSensitivity();
      this.sensitivitySliderEl.value = sensitivity.toString();
      const sensitivityValueEl = document.getElementById("sensitivity-value");
      if (sensitivityValueEl) {
        sensitivityValueEl.textContent = `${sensitivity.toFixed(1)}×`;
      }
    }
  }

  /** Handles volume slider changes. */
  private onVolumeChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    const volume = parseFloat(input.value) / 100;
    this.settings.setVolume(volume);
    this.audio.setVolume(volume);
    const valueEl = document.getElementById("volume-value");
    if (valueEl) {
      valueEl.textContent = `${Math.round(volume * 100)}%`;
    }
  };

  /** Handles sensitivity slider changes. */
  private onSensitivityChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    const sensitivity = parseFloat(input.value);
    this.settings.setSensitivity(sensitivity);
    const valueEl = document.getElementById("sensitivity-value");
    if (valueEl) {
      valueEl.textContent = `${sensitivity.toFixed(1)}×`;
    }
  };

  /** Applies persisted settings to the game systems. */
  private applySettings(): void {
    this.audio.setVolume(this.settings.getVolume());
  }

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
