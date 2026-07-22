/**
 * Lightweight game audio built entirely on the Web Audio API — no external
 * asset files. Synthesizes short SFX with oscillator + gain envelopes and runs
 * a gentle looped ambience pad for the duration of a round.
 *
 * Browsers block autoplay until a user gesture, so the underlying
 * `AudioContext` is created lazily/suspended and must be kicked with
 * `resume()` from the first keypress (or a menu Start button). A single master
 * gain sits in front of the destination so `setMuted()` can silence everything
 * in one place.
 *
 * Created in Game's constructor; `resume()` on first gesture, `pickup()` when
 * an orb is collected, and `startAmbience()` / `stopAmbience()` around a round.
 */
export class Audio {
  private readonly ctx: AudioContext;
  private readonly master: GainNode;

  /** Pre-mute master level, restored when unmuting. */
  private masterLevel = 0.5;
  /** Fraction of the master level kept while ducked (e.g. while paused). */
  private readonly duckScale = 0.25;
  private muted = false;
  /** True while audio is ducked (lowered, not silenced) — used when paused. */
  private ducked = false;

  /** Live ambience nodes while a loop is running (null when stopped). */
  private ambience: {
    readonly oscillators: OscillatorNode[];
    readonly gain: GainNode;
    readonly lfo: OscillatorNode;
  } | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterLevel;
    this.master.connect(this.ctx.destination);
  }

  /**
   * Resumes the audio context. Safe to call repeatedly; only the first call
   * after a user gesture actually unblocks playback. Returns the resume promise
   * so callers may await it if they wish.
   */
  resume(): Promise<void> {
    if (this.ctx.state === "suspended") {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  /** Whether audio is currently muted. */
  get isMuted(): boolean {
    return this.muted;
  }

  /** Get the current master volume level (0-1). */
  getVolume(): number {
    return this.masterLevel / 0.5; // Normalize from internal 0-0.5 to 0-1
  }

  /** Set the master volume level (0-1) and apply immediately. */
  setVolume(volume: number): void {
    this.masterLevel = Math.max(0, Math.min(1, volume)) * 0.5;
    this.applyMasterGain();
  }

  /** Toggles mute and returns the new muted state. */
  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Sets the muted state by ramping the master gain to/from silence. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMasterGain();
  }

  /**
   * Ducks (lowers) or restores the master volume without touching the mute
   * state. Used to soften the mix while the game is paused; unducking returns
   * to whatever the mute state dictates.
   */
  setDucked(ducked: boolean): void {
    this.ducked = ducked;
    this.applyMasterGain();
  }

  /**
   * Ramps the master gain to the level implied by the current mute + duck
   * state, so the two effects compose in one place: muted wins (silence),
   * otherwise ducking scales the normal level down.
   */
  private applyMasterGain(): void {
    const now = this.ctx.currentTime;
    let target = this.muted ? 0 : this.masterLevel;
    if (this.ducked) target *= this.duckScale;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + 0.08);
  }

  /**
   * Plays a short ascending "blip" for an orb pickup. `step` (0+) nudges the
   * pitch up so chained combo pickups feel like a rising scale.
   */
  pickup(step = 0): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    // Pentatonic-ish steps so rapid combos stay pleasant.
    const semitones = [0, 3, 5, 7, 10][Math.min(step, 4)];
    const base = 523.25; // C5
    const freq = base * Math.pow(2, semitones / 12);
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.12);

    // Fast attack, short exponential decay.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Plays a short, harsh "buzz" for hitting a hazard: a descending sawtooth
   * tone so a penalty reads as clearly negative against the bright pickup blip.
   */
  hit(): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Plays a bright rising arpeggio for collecting a power-up, so it reads as a
   * clearly positive, more significant event than a normal orb blip.
   */
  powerup(): void {
    const now = this.ctx.currentTime;
    // C5, E5, G5, C6 — a major arpeggio rolled quickly.
    const notes = [523.25, 659.25, 783.99, 1046.5];
    for (let i = 0; i < notes.length; i++) {
      const t = now + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(notes[i], t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.24);
    }
  }

  /**
   * Plays a short, soft "tick" for each second remaining once the round enters
   * its final countdown (see `lowTime.ts`). A plain sine blip that builds
   * urgency without being as harsh as the hazard `hit()` buzz or as bright as
   * the `pickup()`/`powerup()` cues, so it reads as a clock, not an event.
   */
  tick(): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Starts the looped ambience pad: two slightly detuned oscillators through a
   * lowpass filter, with a slow LFO breathing the gain. Idempotent — a second
   * call while already running is a no-op.
   */
  startAmbience(): void {
    if (this.ambience) return;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.linearRampToValueAtTime(0.12, now + 1.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.Q.value = 0.7;
    filter.connect(gain);
    gain.connect(this.master);

    // Low root + a fifth above, slightly detuned for movement.
    const freqs = [110, 110 * 1.5];
    const detunes = [-6, 6];
    const oscillators: OscillatorNode[] = [];
    for (let i = 0; i < freqs.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freqs[i];
      osc.detune.value = detunes[i];
      osc.connect(filter);
      osc.start(now);
      oscillators.push(osc);
    }

    // Slow tremolo on the pad gain via an LFO.
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start(now);

    this.ambience = { oscillators, gain, lfo };
  }

  /** Fades out and tears down the ambience loop if it is running. */
  stopAmbience(): void {
    const a = this.ambience;
    if (!a) return;
    this.ambience = null;

    const now = this.ctx.currentTime;
    a.gain.gain.cancelScheduledValues(now);
    a.gain.gain.setValueAtTime(a.gain.gain.value, now);
    a.gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);

    const stopAt = now + 0.45;
    for (const osc of a.oscillators) {
      osc.stop(stopAt);
    }
    a.lfo.stop(stopAt);
  }
}
