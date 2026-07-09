/**
 * Manages user settings (volume and sensitivity) with localStorage persistence.
 * Settings are applied in Game's update() and can be changed from the Settings
 * menu overlay.
 */
export class Settings {
  /** Master volume as a fraction (0-1); applied to Audio.masterLevel. */
  private volume = 1.0;
  /** Input sensitivity multiplier (0.5-2.0); applied to player move speed. */
  private sensitivity = 1.0;

  /** Initialize Settings and load from localStorage if available. */
  constructor() {
    this.load();
  }

  /** Get the current volume (0-1). */
  getVolume(): number {
    return this.volume;
  }

  /** Set volume (0-1) and persist to localStorage. */
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    this.save();
  }

  /** Get the current sensitivity multiplier (0.5-2.0). */
  getSensitivity(): number {
    return this.sensitivity;
  }

  /** Set sensitivity multiplier (0.5-2.0) and persist to localStorage. */
  setSensitivity(value: number): void {
    this.sensitivity = Math.max(0.5, Math.min(2.0, value));
    this.save();
  }

  /** Load settings from localStorage. */
  private load(): void {
    try {
      const storedVolume = localStorage.getItem("settings:volume");
      if (storedVolume !== null) {
        this.volume = parseFloat(storedVolume);
      }
      const storedSensitivity = localStorage.getItem("settings:sensitivity");
      if (storedSensitivity !== null) {
        this.sensitivity = parseFloat(storedSensitivity);
      }
    } catch {
      // localStorage might be unavailable; ignore and keep defaults.
    }
  }

  /** Persist settings to localStorage. */
  private save(): void {
    try {
      localStorage.setItem("settings:volume", this.volume.toString());
      localStorage.setItem("settings:sensitivity", this.sensitivity.toString());
    } catch {
      // localStorage might be unavailable; silently continue with in-memory only.
    }
  }
}
