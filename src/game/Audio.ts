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
  private readonly masterLevel = 0.5;
  private muted = false;

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

  /** Toggles mute and returns the new muted state. */
  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Sets the muted state by ramping the master gain to/from silence. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    const now = this.ctx.currentTime;
    const target = muted ? 0 : this.masterLevel;
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
