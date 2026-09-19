/** Small original procedural sound palette; no external audio requests. */
export class Soundscape {
  private context?: AudioContext;
  private master?: GainNode;
  private ambience?: GainNode;
  enabled = true;
  async unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? 0.32 : 0;
      this.master.connect(this.context.destination);
      this.ambience = this.context.createGain();
      this.ambience.gain.value = 0.035;
      this.ambience.connect(this.master);
      for (const [i, f] of [55, 82.41, 110.3].entries()) {
        const o = this.context.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = i * 3;
        o.connect(this.ambience);
        o.start();
      }
    }
    await this.context.resume();
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? 0.32 : 0,
        this.context!.currentTime,
        0.15,
      );
  }
  play(type: string) {
    const c = this.context,
      m = this.master;
    if (!c || !m || !this.enabled) return;
    const now = c.currentTime;
    const gain = c.createGain();
    gain.connect(m);
    const tonal = ["heal", "block", "spell", "cleave", "turn"].includes(type);
    const duration = tonal ? 0.42 : 0.18;
    gain.gain.setValueAtTime(tonal ? 0.18 : 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    if (tonal) {
      const o = c.createOscillator();
      o.type = type === "heal" ? "sine" : "triangle";
      o.frequency.setValueAtTime(
        type === "heal" ? 440 : type === "block" ? 210 : 150,
        now,
      );
      o.frequency.exponentialRampToValueAtTime(
        type === "heal" ? 880 : type === "block" ? 90 : 650,
        now + duration,
      );
      o.connect(gain);
      o.start();
      o.stop(now + duration);
    } else {
      const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const source = c.createBufferSource();
      source.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = type === "poison" ? 1100 : 1800;
      source.connect(filter);
      filter.connect(gain);
      source.start();
    }
  }
}
