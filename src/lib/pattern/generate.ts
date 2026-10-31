import { getStyle, neighborStyle, type StyleDef, type Voice } from "./styles";
import {
  CHANNELS,
  type ChannelId,
  type PatternState,
  channelMeta,
} from "./types";

const WEIGHT: Record<string, number> = {
  "1": 1,
  "+": 0.8,
  x: 0.5,
  ".": 0.22,
  "-": 0,
};

export interface GenInput {
  styleId: string;
  density: number;
  complexity: number;
  variation: number;
  seed: number;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function probability(weight: number, density: number, complexity: number) {
  if (weight >= 0.99) return density < 0.08 ? Math.min(1, density * 4) : 1;
  if (weight <= 0) return complexity * density * 0.04;
  const exp = weight >= 0.7 ? 0.55 : weight >= 0.4 ? 0.9 : 1.35;
  const shaped = Math.pow(density, exp);
  const ceiling = weight >= 0.7 ? 0.96 : weight >= 0.4 ? 0.84 : 0.25 + 0.55 * complexity;
  const gate = weight >= 0.45 ? 1 : 0.3 + 0.7 * complexity;
  return Math.min(ceiling, ceiling * shaped * gate);
}

function pickTemplate(voice: Voice, barIndex: number, long: boolean, variation: number, rng: () => number) {
  if (!long || variation < 0.04) return voice.bars[0];
  if (barIndex === 3 && voice.fill && rng() < 0.35 + variation * 0.55) return voice.fill;
  if (barIndex === 2 && voice.alt && rng() < 0.3 + variation * 0.4) return voice.alt;
  if (barIndex > 0 && voice.bars.length > 1 && rng() < variation * 0.65) {
    return voice.bars[Math.floor(rng() * voice.bars.length)] ?? voice.bars[0];
  }
  return voice.bars[0];
}

export function generateLane(channel: ChannelId, input: GenInput) {
  const style = getStyle(input.styleId);
  const voice = style.voices[channel];
  const meta = channelMeta(channel);
  const rng = mulberry32((input.seed + hashId(channel)) >>> 0);
  const density = clamp(input.density / 100, 0, 1);
  const complexity = clamp(input.complexity / 100, 0, 1);
  const variation = clamp(input.variation / 100, 0, 1);
  const steps: boolean[] = [];
  for (let barIndex = 0; barIndex < meta.bars; barIndex++) {
    const template = pickTemplate(voice, barIndex, meta.bars > 1, variation, rng);
    const complexityHere =
      meta.bars > 1 && barIndex === 3 ? Math.min(1, complexity + variation * 0.2) : complexity;
    for (const symbol of template) {
      const weight = WEIGHT[symbol] ?? 0;
      steps.push(rng() < probability(weight, density, complexityHere));
    }
  }
  return steps;
}

function laneParams(pattern: PatternState, id: ChannelId): GenInput {
  const lane = pattern.channels[id];
  const source = lane.useOwn ? lane : pattern;
  return {
    styleId: source.styleId,
    density: source.density,
    complexity: source.complexity,
    variation: source.variation,
    seed: 0,
  };
}

/** Regenerates unlocked lanes. Open hat clears the closed hat on the same step when the style chokes. */
export function regeneratePattern(pattern: PatternState, seed: number, only?: ChannelId[]) {
  const targets = (only ?? CHANNELS.map((channel) => channel.id)).filter(
    (id) => !pattern.channels[id].locked,
  );
  const channels = { ...pattern.channels };
  for (const id of targets) {
    const params = laneParams(pattern, id);
    channels[id] = { ...channels[id], steps: generateLane(id, { ...params, seed }) };
  }

  const hatStyle = getStyle(laneParams(pattern, "HIHAT1").styleId);
  if (hatStyle.hatChoke && targets.includes("HIHAT1")) {
    const open = channels.HIHAT2.steps;
    channels.HIHAT1 = {
      ...channels.HIHAT1,
      steps: channels.HIHAT1.steps.map((on, index) => (on && open[index % 16] ? false : on)),
    };
  }

  const drumStyle = getStyle(laneParams(pattern, "KICK").styleId);
  if (drumStyle.chokeKick && targets.includes("KICK") && targets.includes("SNARE")) {
    const snare = channels.SNARE.steps;
    channels.KICK = {
      ...channels.KICK,
      steps: channels.KICK.steps.map((on, index) => (on && snare[index] && index % 16 !== 0 ? false : on)),
    };
  }

  return { ...pattern, channels };
}

export function jitter(value: number, variation: number, rng: () => number, spread: number) {
  const next = value + (rng() - 0.5) * 2 * (variation / 100) * spread;
  return Math.round(clamp(next, 0, 100));
}

export function draftBankPattern(
  pattern: PatternState,
  index: number,
  bank: { styleId: string; density: number; complexity: number; variation: number; mix: boolean },
  seed: number,
) {
  const rng = mulberry32((seed + index * 997) >>> 0);
  const styleId = bank.mix && rng() < 0.55 ? neighborStyle(bank.styleId, rng) : bank.styleId;
  const drift = Math.round(((index / 23) - 0.35) * (bank.variation / 100) * 18);
  const density = clamp(jitter(bank.density, bank.variation, rng, 34) + drift, 0, 100);
  const complexity = jitter(bank.complexity, bank.variation, rng, 32);
  const drafted: PatternState = {
    ...pattern,
    styleId,
    density,
    complexity,
    variation: bank.variation,
  };
  return regeneratePattern(drafted, seed + index * 997);
}

export function styleOf(id: string): StyleDef {
  return getStyle(id);
}
