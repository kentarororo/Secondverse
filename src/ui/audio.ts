import type { BattleEvent } from "../sim";

class BattleAudioBoundary {
  private context: AudioContext | null = null;

  unlock(): void {
    if (typeof window === "undefined" || !("AudioContext" in window)) return;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") {
      void this.context.resume();
    }
  }

  cue(event: BattleEvent, muted: boolean): void {
    if (muted || !this.context || this.context.state !== "running") return;
    const frequency = this.frequencyFor(event);
    if (frequency === null) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.type = event.kind === "decisive_moment" ? "triangle" : "sine";
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
  }

  private frequencyFor(event: BattleEvent): number | null {
    if (event.kind === "intent_shown") return 245;
    if (event.kind === "damage_applied") return 150;
    if (event.kind === "healed" || event.kind === "guard_changed") return 480;
    if (event.kind === "signature_triggered") return 370;
    if (event.kind === "decisive_moment") return 285;
    if (event.kind === "battle_ended") return 330;
    return null;
  }
}

export const battleAudio = new BattleAudioBoundary();
