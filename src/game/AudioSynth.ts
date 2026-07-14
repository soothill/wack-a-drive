type AudioContextConstructor = typeof AudioContext;

export class AudioSynth {
  private context?: AudioContext;
  private muted = false;

  async unlock(): Promise<void> {
    if (!this.context) {
      const AudioContextClass = (
        window as typeof window & { webkitAudioContext?: AudioContextConstructor }
      ).AudioContext ??
        (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;

      if (!AudioContextClass) return;
      this.context = new AudioContextClass();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  toggleMuted(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  playStart(): void {
    this.tone(190, 0.08, "square", 0.035, 0);
    this.tone(285, 0.1, "square", 0.035, 0.08);
    this.tone(430, 0.14, "sine", 0.045, 0.16);
  }

  playHit(combo: number): void {
    const lift = Math.min(180, combo * 7);
    this.tone(520 + lift, 0.07, "square", 0.045, 0);
    this.tone(760 + lift, 0.09, "sine", 0.035, 0.035);
  }

  playEnd(): void {
    this.tone(360, 0.12, "triangle", 0.04, 0);
    this.tone(280, 0.13, "triangle", 0.04, 0.12);
    this.tone(180, 0.2, "sine", 0.05, 0.25);
  }

  private tone(
    frequency: number,
    durationSeconds: number,
    type: OscillatorType,
    volume: number,
    delaySeconds: number,
  ): void {
    if (!this.context || this.muted || this.context.state !== "running") return;

    const startAt = this.context.currentTime + delaySeconds;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + durationSeconds + 0.01);
  }
}
