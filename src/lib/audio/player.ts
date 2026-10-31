import { CHANNELS, type ChannelId } from "../pattern/types";

export class DrumPlayer {
  bpm = 120;
  swing = 0;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private next = 0;
  private step = 0;
  private running = false;
  private queue: { step: number; time: number }[] = [];
  getHits: (step: number) => ChannelId[] = () => [];
  onStep: (step: number) => void = () => {};

  get isRunning() {
    return this.running;
  }

  async start() {
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
    this.running = true;
    this.step = 0;
    this.queue = [];
    this.next = ctx.currentTime + 0.05;
    this.pump();
  }

  stop() {
    this.running = false;
    window.clearTimeout(this.timer);
    this.queue = [];
    this.step = 0;
    this.onStep(-1);
  }

  private ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.78;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.16;
    master.connect(comp);
    comp.connect(ctx.destination);
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.ctx = ctx;
    this.master = master;
    this.noise = buffer;
    return ctx;
  }

  private pump = () => {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const sixteenth = 60 / Math.max(40, this.bpm) / 4;
    const horizon = ctx.currentTime + 0.16;
    while (this.next < horizon) {
      const delay = this.step % 2 === 1 ? sixteenth * (this.swing / 100) * 0.5 : 0;
      const time = this.next + delay;
      for (const hit of this.getHits(this.step)) this.voice(hit, time);
      this.queue.push({ step: this.step, time });
      this.next += sixteenth;
      this.step = (this.step + 1) % 64;
    }
    const now = ctx.currentTime;
    let last = -1;
    this.queue = this.queue.filter((event) => {
      if (event.time <= now + 0.016) {
        last = event.step;
        return false;
      }
      return true;
    });
    if (last >= 0) this.onStep(last);
    this.timer = window.setTimeout(this.pump, 25);
  };

  private voice(id: ChannelId, time: number) {
    const ctx = this.ctx;
    const dest = this.master;
    if (!ctx || !dest || !this.noise) return;
    if (id === "KICK") this.kick(ctx, dest, time);
    else if (id === "SNARE") this.snare(ctx, dest, time);
    else if (id === "HIHAT1") this.hat(ctx, dest, time, 0.04, 7600, 0.2);
    else if (id === "HIHAT2") this.hat(ctx, dest, time, 0.26, 5600, 0.26);
    else if (id === "PERC1") this.perc(ctx, dest, time);
    else this.tick(ctx, dest, time);
  }

  private env(ctx: AudioContext, time: number, peak: number, decay: number, attack = 0.003) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(decay, attack + 0.01));
    return gain;
  }

  private kick(ctx: AudioContext, dest: GainNode, time: number) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(168, time);
    osc.frequency.exponentialRampToValueAtTime(44, time + 0.09);
    const gain = this.env(ctx, time, 0.92, 0.34, 0.004);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.36);
    const click = ctx.createOscillator();
    click.type = "triangle";
    click.frequency.setValueAtTime(240, time);
    const clickGain = this.env(ctx, time, 0.12, 0.018, 0.001);
    click.connect(clickGain);
    clickGain.connect(dest);
    click.start(time);
    click.stop(time + 0.03);
  }

  private snare(ctx: AudioContext, dest: GainNode, time: number) {
    const noise = ctx.createBufferSource();
    noise.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1600;
    const gain = this.env(ctx, time, 0.5, 0.15, 0.002);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.18);
    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(190, time);
    body.frequency.exponentialRampToValueAtTime(120, time + 0.08);
    const bodyGain = this.env(ctx, time, 0.26, 0.11, 0.002);
    body.connect(bodyGain);
    bodyGain.connect(dest);
    body.start(time);
    body.stop(time + 0.14);
  }

  private hat(
    ctx: AudioContext,
    dest: GainNode,
    time: number,
    decay: number,
    freq: number,
    peak: number,
  ) {
    const noise = ctx.createBufferSource();
    noise.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = freq;
    const gain = this.env(ctx, time, peak, decay, 0.001);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + decay + 0.02);
  }

  private perc(ctx: AudioContext, dest: GainNode, time: number) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(348, time);
    osc.frequency.exponentialRampToValueAtTime(170, time + 0.06);
    const gain = this.env(ctx, time, 0.38, 0.09, 0.002);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.11);
    const noise = ctx.createBufferSource();
    noise.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1700;
    filter.Q.value = 0.8;
    const noiseGain = this.env(ctx, time, 0.16, 0.035, 0.001);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.05);
  }

  private tick(ctx: AudioContext, dest: GainNode, time: number) {
    const noise = ctx.createBufferSource();
    noise.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 4500;
    filter.Q.value = 0.55;
    const gain = this.env(ctx, time, 0.2, 0.028, 0.001);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.04);
  }
}

export function hitsAt(stepsByChannel: Record<ChannelId, boolean[]>, step: number, muted: Record<ChannelId, boolean>) {
  const hits: ChannelId[] = [];
  for (const channel of CHANNELS) {
    if (muted[channel.id]) continue;
    const steps = stepsByChannel[channel.id];
    const index = channel.bars === 1 ? step % 16 : step;
    if (steps[index]) hits.push(channel.id);
  }
  return hits;
}
