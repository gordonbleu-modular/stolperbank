import {
  CHANNELS,
  PATTERN_COUNT,
  type ChannelId,
  type LaneState,
  type PatternState,
  channelMeta,
  stepCount,
} from "./types";

export const DEFAULT_PARAMS = {
  styleId: "techno",
  density: 62,
  complexity: 40,
  variation: 35,
};

export function makePattern(styleId = DEFAULT_PARAMS.styleId): PatternState {
  const channels = {} as Record<ChannelId, LaneState>;
  for (const channel of CHANNELS) {
    channels[channel.id] = {
      styleId,
      density: DEFAULT_PARAMS.density,
      complexity: DEFAULT_PARAMS.complexity,
      variation: DEFAULT_PARAMS.variation,
      locked: false,
      useOwn: false,
      steps: Array.from({ length: channel.bars * 16 }, () => false),
    };
  }
  return {
    styleId,
    density: DEFAULT_PARAMS.density,
    complexity: DEFAULT_PARAMS.complexity,
    variation: DEFAULT_PARAMS.variation,
    channels,
  };
}

export function emptyBank(): PatternState[] {
  return Array.from({ length: PATTERN_COUNT }, () => makePattern());
}

function clampNum(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function parseBank(text: string): {
  patterns: PatternState[];
  recognized: number;
  errors: string[];
} {
  const patterns = emptyBank();
  const errors: string[] = [];
  let recognized = 0;
  const lineRe =
    /^(KICK|SNARE|HIHAT1|HIHAT2|PERC1|PERC2)\s*>\s*PTN(\d{1,2})\s*:\s*([01]{16}(?:\s*,\s*[01]{16})*)\s*;?\s*$/;

  for (const rawLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = lineRe.exec(line);
    if (!match) {
      if (errors.length < 3) errors.push(line.slice(0, 80));
      continue;
    }
    const id = match[1] as ChannelId;
    const index = Number(match[2]);
    if (index < 0 || index >= PATTERN_COUNT) {
      if (errors.length < 3) errors.push(`PTN${index} is outside 0–23`);
      continue;
    }
    const bits = match[3].split(/\s*,\s*/).join("");
    const steps = patterns[index].channels[id].steps;
    const limit = Math.min(steps.length, bits.length);
    for (let i = 0; i < limit; i++) steps[i] = bits[i] === "1";
    recognized += 1;
  }

  return { patterns, recognized, errors };
}

export function barBits(steps: boolean[], bar: number) {
  return steps
    .slice(bar * 16, bar * 16 + 16)
    .map((step) => (step ? "1" : "0"))
    .join("");
}

export function serializeBank(patterns: PatternState[]) {
  const lines: string[] = [];
  CHANNELS.forEach((channel, channelIndex) => {
    for (let index = 0; index < PATTERN_COUNT; index++) {
      const steps = patterns[index]?.channels[channel.id].steps ?? [];
      const parts: string[] = [];
      for (let bar = 0; bar < channel.bars; bar++) {
        const slice = steps.slice(bar * 16, bar * 16 + 16);
        const padded = slice.concat(Array.from({ length: Math.max(0, 16 - slice.length) }, () => false));
        parts.push(padded.map((step) => (step ? "1" : "0")).join(""));
      }
      lines.push(`${channel.id} > PTN${index}: ${parts.join(", ")};`);
    }
    if (channelIndex < CHANNELS.length - 1) lines.push("");
  });
  return `${lines.join("\n")}\n`;
}

export function triggerCount(pattern: PatternState) {
  return CHANNELS.reduce(
    (sum, channel) => sum + pattern.channels[channel.id].steps.filter(Boolean).length,
    0,
  );
}

export function sanitizePatterns(data: unknown): PatternState[] | null {
  if (!Array.isArray(data) || data.length !== PATTERN_COUNT) return null;
  try {
    return data.map((entry) => coercePattern(entry));
  } catch {
    return null;
  }
}

function coercePattern(entry: unknown): PatternState {
  if (!entry || typeof entry !== "object") throw new Error("pattern");
  const raw = entry as Partial<PatternState>;
  const pattern = makePattern();
  pattern.styleId = typeof raw.styleId === "string" ? raw.styleId : pattern.styleId;
  pattern.density = clampNum(raw.density, pattern.density);
  pattern.complexity = clampNum(raw.complexity, pattern.complexity);
  pattern.variation = clampNum(raw.variation, pattern.variation);
  for (const channel of CHANNELS) {
    const lane = raw.channels?.[channel.id];
    if (!lane || !Array.isArray(lane.steps) || lane.steps.length !== stepCount(channel.id)) {
      throw new Error(channel.id);
    }
    pattern.channels[channel.id] = {
      styleId: typeof lane.styleId === "string" ? lane.styleId : pattern.styleId,
      density: clampNum(lane.density, pattern.density),
      complexity: clampNum(lane.complexity, pattern.complexity),
      variation: clampNum(lane.variation, pattern.variation),
      locked: Boolean(lane.locked),
      useOwn: Boolean(lane.useOwn),
      steps: lane.steps.map((step) => Boolean(step)),
    };
  }
  return pattern;
}

export function channelLabel(id: ChannelId) {
  return channelMeta(id).label;
}
