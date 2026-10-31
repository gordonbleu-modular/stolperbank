export const CHANNELS = [
  { id: "KICK", label: "KICK", hint: "Bass drum", bars: 4 },
  { id: "SNARE", label: "SNARE", hint: "Snare", bars: 4 },
  { id: "HIHAT1", label: "HIHAT 1", hint: "Closed hat", bars: 1 },
  { id: "HIHAT2", label: "HIHAT 2", hint: "Open hat", bars: 1 },
  { id: "PERC1", label: "PERC 1", hint: "Accent", bars: 1 },
  { id: "PERC2", label: "PERC 2", hint: "Layer", bars: 1 },
] as const;

export type ChannelId = (typeof CHANNELS)[number]["id"];

export const PATTERN_COUNT = 24;
export const STEPS_PER_BAR = 16;

export interface LaneParams {
  styleId: string;
  density: number;
  complexity: number;
  variation: number;
}

export interface LaneState extends LaneParams {
  steps: boolean[];
  locked: boolean;
  useOwn: boolean;
}

export interface PatternState extends LaneParams {
  channels: Record<ChannelId, LaneState>;
}

export function channelMeta(id: ChannelId) {
  return CHANNELS.find((channel) => channel.id === id) ?? CHANNELS[0];
}

export function stepCount(id: ChannelId) {
  return channelMeta(id).bars * STEPS_PER_BAR;
}

export function bankFilename(bankNumber: number) {
  const n = Math.min(63, Math.max(0, Math.round(bankNumber)));
  return `PatternBank${String(n).padStart(3, "0")}.txt`;
}
