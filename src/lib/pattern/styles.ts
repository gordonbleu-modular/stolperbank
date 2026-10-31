import type { ChannelId } from "./types";

export interface Voice {
  bars: string[];
  fill?: string;
  alt?: string;
}

export interface StyleDef {
  id: string;
  name: string;
  group: string;
  bpm: number;
  swing: number;
  blurb: string;
  hatChoke: boolean;
  chokeKick: boolean;
  voices: Record<ChannelId, Voice>;
}

const BEAT = /^[1+x.\-]{4}$/;

/** Four beats, each four 16ths. Alphabet: 1 anchor, + likely, x medium, . ghost, - off. */
export function bar(a: string, b: string, c: string, d: string) {
  for (const beat of [a, b, c, d]) {
    if (!BEAT.test(beat)) throw new Error(`Invalid beat: ${beat}`);
  }
  return a + b + c + d;
}

function voice(bars: string[], extra?: { fill?: string; alt?: string }): Voice {
  return { bars, fill: extra?.fill, alt: extra?.alt };
}

function style(
  def: Omit<StyleDef, "hatChoke" | "chokeKick" | "voices"> & {
    hatChoke?: boolean;
    chokeKick?: boolean;
    voices: Record<ChannelId, Voice>;
  },
): StyleDef {
  return {
    hatChoke: def.hatChoke ?? true,
    chokeKick: def.chokeKick ?? false,
    ...def,
  };
}

export const STYLES: StyleDef[] = [
  style({
    id: "techno",
    name: "Techno",
    group: "Techno",
    bpm: 130,
    swing: 8,
    blurb: "Four on the floor, offbeat hats, small fills in the fourth bar.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1---"), bar("1---", "1---", "1---", "1--.")], {
        fill: bar("1---", "1---", "1---", "11.1"),
      }),
      SNARE: voice([bar("----", "1---", "----", "1---"), bar("----", "1---", ".---", "1---")], {
        fill: bar("----", "1---", "----", "1.11"),
      }),
      HIHAT1: voice([
        bar("--1-", "--1-", "--1-", "--1-"),
        bar("1-1-", "1-1-", "1-1-", "1-1-"),
        bar("--1-", "--1-", "--1-", "1-1-"),
      ]),
      HIHAT2: voice([bar("----", "--1-", "----", "----"), bar("----", "--1-", "----", "--1-")]),
      PERC1: voice([
        bar("1---", "----", "----", "----"),
        bar("----", "--1-", "----", "----"),
        bar("----", "----", "----", "1---"),
      ]),
      PERC2: voice([
        bar("..1.", "..1.", "..1.", "..1."),
        bar("1.1.", "1.1.", "1.1.", "1.1."),
        bar(".1.1", ".1.1", ".1.1", ".1.1"),
      ]),
    },
  }),
  style({
    id: "minimal",
    name: "Minimal",
    group: "Techno",
    bpm: 122,
    swing: 6,
    blurb: "Few notes, lots of space. The kick stays, the rest drips.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1---"), bar("1---", "1---", "----", "1---")]),
      SNARE: voice([bar("----", "1---", "----", "----"), bar("----", "----", "----", "1---")]),
      HIHAT1: voice([bar("--1-", "----", "--1-", "----"), bar("--1-", "----", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "----", "----", "1---")]),
      PERC1: voice([bar("----", "--1-", "----", "----")]),
      PERC2: voice([bar("..1.", "----", "..1.", "----")]),
    },
  }),
  style({
    id: "hard",
    name: "Hard Techno",
    group: "Techno",
    bpm: 145,
    swing: 0,
    blurb: "Straight and dense, with a roll in the last bar.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1---")], { fill: bar("1---", "1---", "1-1-", "1111") }),
      SNARE: voice([bar("----", "1---", "----", "1---"), bar("----", "1--1", "----", "1--1")], {
        fill: bar("----", "1---", "----", "1111"),
      }),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-"), bar("x1x1", "x1x1", "x1x1", "x1x1")]),
      HIHAT2: voice([bar("----", "--1-", "----", "--1-")]),
      PERC1: voice([bar("1---", "----", "1---", "----")]),
      PERC2: voice([bar("x-x-", "x-x-", "x-x-", "x-x-")]),
    },
  }),
  style({
    id: "industrial",
    name: "Industrial",
    group: "Techno",
    bpm: 128,
    swing: 0,
    blurb: "Hard offbeats and gaps, not a smooth four-on-the-floor.",
    voices: {
      KICK: voice([
        bar("1---", "1---", "1---", "--1-"),
        bar("1--1", "1---", "1---", "1---"),
        bar("11--", "1---", "1---", "--1-"),
      ]),
      SNARE: voice([bar("----", "1---", "----", "1-1-"), bar("----", "----", "1---", "----")]),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-"), bar("11-1", "1-1-", "11-1", "-1--")]),
      HIHAT2: voice([bar("----", "--1-", "----", "1---")]),
      PERC1: voice([bar("1---", "----", "1---", "1---")]),
      PERC2: voice([bar("--1-", "1---", "1-1-", "--1-")]),
    },
  }),
  style({
    id: "trance",
    name: "Trance",
    group: "Techno",
    bpm: 138,
    swing: 4,
    blurb: "Driving offbeat, open hat on beat two.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1---")]),
      SNARE: voice([bar("----", "1---", "----", "1---")], { fill: bar("----", "1---", "----", "1.11") }),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----"), bar("----", "--1-", "----", "--1-")]),
      PERC1: voice([bar("----", "----", "----", "1---")]),
      PERC2: voice([bar("1.1.", "1.1.", "1.1.", "1.1.")]),
    },
  }),
  style({
    id: "ebm",
    name: "EBM",
    group: "Techno",
    bpm: 118,
    swing: 0,
    blurb: "Body music: eighths, an extra kick at the end of the bar, snare on the beats.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1--1"), bar("11--", "1---", "1---", "1---")]),
      SNARE: voice([bar("----", "1---", "1---", "1---"), bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----")]),
      PERC1: voice([bar("1---", "----", "1---", "--1-")]),
      PERC2: voice([bar("--11", "----", "11--", "--11")]),
    },
  }),
  style({
    id: "electro",
    name: "Electro",
    group: "Techno",
    bpm: 118,
    swing: 14,
    blurb: "808-like. The kick skips beats, the snare stays late.",
    voices: {
      KICK: voice([
        bar("1---", "----", "1---", "1---"),
        bar("1---", "1---", "--1-", "----"),
        bar("11--", "1---", "----", "1---"),
      ]),
      SNARE: voice([bar("----", "1---", "----", "1---"), bar("----", "1---", "1---", "1---")]),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "1-1-")]),
      HIHAT2: voice([bar("----", "----", "----", "1.1.")]),
      PERC1: voice([bar("----", "--1-", "----", "1---")]),
      PERC2: voice([bar("1.1.", "--1.", "1.1.", "--1.")]),
    },
  }),
  style({
    id: "house",
    name: "House",
    group: "House",
    bpm: 124,
    swing: 12,
    blurb: "Classic four-on-the-floor, clap on 2 and 4, hats on the ands.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1---")]),
      SNARE: voice([bar("----", "1---", "----", "1---")], { fill: bar("----", "1---", "----", "111.") }),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----"), bar("----", "----", "----", "--1-")]),
      PERC1: voice([bar("..1.", "----", "1...", "1...")]),
      PERC2: voice([bar(".1.1", ".1.1", ".1.1", ".1.1")]),
    },
  }),
  style({
    id: "deep",
    name: "Deep House",
    group: "House",
    bpm: 120,
    swing: 16,
    blurb: "Softer and more open than house. Open hat only at the end.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1---"), bar("1---", "1---", "----", "1---")]),
      SNARE: voice([bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("--1-", "----", "--1-", "--1-"), bar("--1-", "--1-", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "----", "----", "1---")]),
      PERC1: voice([bar("----", "--1-", "----", "--1-")]),
      PERC2: voice([bar("..1.", "..1.", "..1.", "..1.")]),
    },
  }),
  style({
    id: "acid",
    name: "Acid",
    group: "House",
    bpm: 126,
    swing: 8,
    blurb: "Straighter house pulse with an extra snare ghost at the end.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1---")]),
      SNARE: voice([bar("----", "1---", "----", "1--1")]),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("--1-", "----", "--1-", "----")]),
      PERC1: voice([bar("1---", "--1-", "----", "--1.")]),
      PERC2: voice([bar("--1-", "1-1-", "--1-", "1-1-")]),
    },
  }),
  style({
    id: "disco",
    name: "Disco",
    group: "House",
    bpm: 118,
    swing: 18,
    blurb: "Eighth-note hats and an open hat on every and.",
    voices: {
      KICK: voice([bar("1---", "1---", "1---", "1---")]),
      SNARE: voice([bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      PERC1: voice([bar("----", "--1-", "----", "--1-")]),
      PERC2: voice([bar("1.11", ".11.", "1.11", ".11.")]),
    },
  }),
  style({
    id: "funkyhouse",
    name: "Funky House",
    group: "House",
    bpm: 124,
    swing: 20,
    blurb: "House pulse with syncopated kicks and a shaker on the ands.",
    voices: {
      KICK: voice([bar("1---", "1---", "1--1", "1---"), bar("1---", "1---", "--1-", "1---")]),
      SNARE: voice([bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "--1.")]),
      PERC1: voice([bar("..1.", "..1.", ".1.1", "----")]),
      PERC2: voice([bar(".1.1", ".11.", "1.1.", "1.1.")]),
    },
  }),
  style({
    id: "hiphop",
    name: "Hip-Hop",
    group: "Hip-Hop",
    bpm: 92,
    swing: 24,
    blurb: "Kick around the one, snare on 2 and 4, eighth-note hats.",
    voices: {
      KICK: voice([
        bar("1---", "----", "1---", "1---"),
        bar("1---", "--1-", "--1-", "----"),
        bar("1---", "1---", "--1-", "----"),
        bar("1---", "----", "----", "1---"),
      ]),
      SNARE: voice([bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("----", "----", "----", "1---")]),
      PERC1: voice([bar("----", "--1-", "----", "----")]),
      PERC2: voice([bar("..1.", "..1.", "..1.", "..1.")]),
    },
  }),
  style({
    id: "boombap",
    name: "Boom Bap",
    group: "Hip-Hop",
    bpm: 90,
    swing: 36,
    blurb: "Dusty swing, kick variations, snare locked on 2 and 4.",
    voices: {
      KICK: voice([
        bar("1---", "----", "1-1-", "----"),
        bar("1---", "--1-", "----", "1---"),
        bar("1---", "1---", "----", "1-1-"),
      ]),
      SNARE: voice([bar("----", "1---", "----", "1---")], { fill: bar("----", "1---", "----", "1.1.") }),
      HIHAT1: voice([bar("1-1-", "1-1-", "1.1-", "1-1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----")]),
      PERC1: voice([bar("..1.", "----", "1---", "----")]),
      PERC2: voice([bar(".1..", "1...", "1.1.", "1...")]),
    },
  }),
  style({
    id: "trap",
    name: "Trap",
    group: "Hip-Hop",
    bpm: 140,
    swing: 8,
    blurb: "Halftime snare on 3, hi-hat rolls, kick around them.",
    chokeKick: true,
    voices: {
      KICK: voice(
        [
          bar("1---", "----", "----", "1---"),
          bar("1---", "----", "--1-", "-1--"),
          bar("1---", "----", "1---", "--1-"),
        ],
        { fill: bar("1---", "----", "--11", "1111") },
      ),
      SNARE: voice([bar("----", "----", "1---", "----")]),
      HIHAT1: voice([bar("1x1x", "1x1x", "1-11", "111x"), bar("1-1-", "1-1-", "1-11", "1111")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----"), bar("----", "----", "----", "1---")]),
      PERC1: voice([bar("----", "----", "----", "1.1.")]),
      PERC2: voice([bar("1---", "--1-", "----", "1---")]),
    },
  }),
  style({
    id: "drill",
    name: "Drill",
    group: "Hip-Hop",
    bpm: 142,
    swing: 4,
    blurb: "Sliding kicks, snare on 3, dense hats.",
    chokeKick: true,
    voices: {
      KICK: voice([
        bar("1---", "----", "1-1-", "----"),
        bar("1--1", "----", "1---", "-1--"),
        bar("1---", "--1-", "---1", "1---"),
      ]),
      SNARE: voice([bar("----", "----", "1---", "----")]),
      HIHAT1: voice([bar("1x1x", "1x1x", "1x1x", "1x1x")]),
      HIHAT2: voice([bar("----", "----", "--1-", "----")]),
      PERC1: voice([bar("----", "--1-", "----", "-11.")]),
      PERC2: voice([bar("--1-", "--1-", "--1-", "1-1-")]),
    },
  }),
  style({
    id: "grime",
    name: "Grime",
    group: "Hip-Hop",
    bpm: 140,
    swing: 4,
    blurb: "Angular kicks, snare on 2 and 4 or only late.",
    voices: {
      KICK: voice([
        bar("1---", "1---", "--1-", "----"),
        bar("11--", "1---", "----", "1--1"),
        bar("1---", "--1-", "--1-", "----"),
      ]),
      SNARE: voice([bar("----", "1---", "----", "1---"), bar("----", "----", "1---", "1---")]),
      HIHAT1: voice([bar("--1-", "1-1-", "--1-", "1-1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "1---")]),
      PERC1: voice([bar("1---", "----", "1---", "----")]),
      PERC2: voice([bar(".1.1", ".-1.", ".1.1", ".1.1")]),
    },
  }),
  style({
    id: "baile",
    name: "Baile Funk",
    group: "Hip-Hop",
    bpm: 130,
    swing: 10,
    blurb: "Rio beat: doubled kicks, offset snare, loud percussion.",
    hatChoke: false,
    voices: {
      KICK: voice([bar("1---", "1---", "1--1", "-1--"), bar("1--1", "1---", "1---", "1-1-")]),
      SNARE: voice([bar("----", "1--1", "----", "1---")]),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("--1-", "----", "1---", "--1-")]),
      PERC1: voice([bar("..1.", "1...", "1.1.", "1...")]),
      PERC2: voice([bar("111.", "11.1", "111.", "11.1")]),
    },
  }),
  style({
    id: "footwork",
    name: "Footwork",
    group: "Hip-Hop",
    bpm: 160,
    swing: 0,
    blurb: "Fast broken kicks and snare stutters.",
    hatChoke: false,
    voices: {
      KICK: voice([
        bar("1--1", "--1-", "1--1", "--1-"),
        bar("1-1-", "--1-", "1-1-", "--11"),
        bar("11-1", "-1--", "1-11", "-1--"),
      ]),
      SNARE: voice([bar("----", "1---", "--1-", "1---"), bar("----", "1--1", "----", "1--1")]),
      HIHAT1: voice([bar("1x1x", "1x1x", "1x1x", "1x1x")]),
      HIHAT2: voice([bar("--1-", "--1-", "---1", "--1-")]),
      PERC1: voice([bar("1...", "1...", "1..1", ".1.1")]),
      PERC2: voice([bar(".11.", "1.11", ".1.1", "1.1.")]),
    },
  }),
  style({
    id: "breakbeat",
    name: "Breakbeat",
    group: "Breaks",
    bpm: 130,
    swing: 14,
    blurb: "Amen-like on a 16th grid: the kick wanders, the snare can slip.",
    voices: {
      KICK: voice([
        bar("1---", "----", "1---", "----"),
        bar("1---", "--1-", "--1-", "----"),
        bar("1---", "1---", "--1-", "-1--"),
        bar("1---", "----", "----", "1-1-"),
      ]),
      SNARE: voice(
        [
          bar("----", "1---", "----", "1---"),
          bar("----", "-1--", "----", "1---"),
          bar("----", "1---", "---1", "----"),
        ],
        { fill: bar("----", "1---", "----", "1111") },
      ),
      HIHAT1: voice([bar("1-1-", "1-1-", "11-1", "1-1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "--1.")]),
      PERC1: voice([bar("----", "--1-", "----", "1---")]),
      PERC2: voice([bar("1.1.", "1..1", "1.1.", "1.1.")]),
    },
  }),
  style({
    id: "dnb",
    name: "Drum & Bass",
    group: "Breaks",
    bpm: 174,
    swing: 6,
    blurb: "Two-step kick, snare on 2 and 4, driving hats.",
    voices: {
      KICK: voice([
        bar("1---", "----", "--1-", "----"),
        bar("1---", "----", "1---", "----"),
        bar("1---", "----", "----", "1--1"),
        bar("1---", "---1", "-1--", "----"),
      ]),
      SNARE: voice([bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("--1-", "1-1-", "1-1-", "1-1-"), bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "--1-")]),
      PERC1: voice([bar("..1.", "----", "1...", "1...")]),
      PERC2: voice([bar("1.1.", "11.1", ".1.1", ".11.")]),
    },
  }),
  style({
    id: "jungle",
    name: "Jungle",
    group: "Breaks",
    bpm: 165,
    swing: 20,
    blurb: "Chopped break, the snare slips, ghosts between the beats.",
    voices: {
      KICK: voice([
        bar("1---", "----", "1-1-", "----"),
        bar("1---", "--1-", "----", "1---"),
        bar("1---", "1---", "----", "1---"),
      ]),
      SNARE: voice(
        [
          bar("----", "1---", "-1--", "1---"),
          bar("----", "1---", "---1", "1---"),
          bar("----", "-1--", "--1-", "--1-"),
        ],
        { fill: bar("----", "1---", "----", "1111") },
      ),
      HIHAT1: voice([bar("1.1.", "1.1.", "11.1", ".1.1")]),
      HIHAT2: voice([bar("----", "----", "1---", "1---")]),
      PERC1: voice([bar("..1.", "..1.", ".1..", "----")]),
      PERC2: voice([bar(".1.1", "1.1.", "1.1.", "1.1.")]),
    },
  }),
  style({
    id: "garage",
    name: "UK Garage",
    group: "Breaks",
    bpm: 132,
    swing: 34,
    blurb: "2-step: the kick skips beat three. Add shuffle in the preview.",
    voices: {
      KICK: voice([
        bar("1---", "1---", "----", "1---"),
        bar("1---", "----", "1---", "--1-"),
        bar("1---", "1---", "--1-", "----"),
      ]),
      SNARE: voice([bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("--1-", "--1-", "1-1-", "--1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----")]),
      PERC1: voice([bar("----", "--1-", "----", "--1-")]),
      PERC2: voice([bar(".1..", "1.1.", ".1.1", "..1.")]),
    },
  }),
  style({
    id: "dubstep",
    name: "Dubstep",
    group: "Breaks",
    bpm: 140,
    swing: 0,
    blurb: "Halftime. Snare on 3, kick before and after.",
    chokeKick: true,
    voices: {
      KICK: voice([
        bar("1---", "----", "1---", "----"),
        bar("1---", "----", "----", "1---"),
        bar("1---", "----", "--1-", "----"),
      ]),
      SNARE: voice([bar("----", "----", "1---", "----")]),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "----", "----", "1---")]),
      PERC1: voice([bar("----", "--1-", "----", "----")]),
      PERC2: voice([bar("..1.", "----", "1...", "1.1.")]),
    },
  }),
  style({
    id: "broken",
    name: "Broken Beat",
    group: "Breaks",
    bpm: 118,
    swing: 18,
    blurb: "Crooked kicks, snare not always on four. Good for switching.",
    voices: {
      KICK: voice([
        bar("1-1-", "---1", "--1-", "----"),
        bar("1---", "--1-", "----", "1---"),
        bar("1---", "----", "--1-", "----"),
      ]),
      SNARE: voice([bar("----", "1---", "-1--", "----"), bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("1.1.", "1.1.", "11.1", ".1..")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----")]),
      PERC1: voice([bar("----", "----", "--1-", "--1.")]),
      PERC2: voice([bar(".1.1", "..1.", "1.1.", ".1.1")]),
    },
  }),
  style({
    id: "funk",
    name: "Funk",
    group: "Groove",
    bpm: 104,
    swing: 22,
    blurb: "Syncopated kick, backbeat, ghosts around the snare.",
    hatChoke: false,
    voices: {
      KICK: voice([
        bar("1---", "1---", "--1-", "1---"),
        bar("1---", "--1-", "--1-", "----"),
        bar("1--1", "----", "1---", "1--1"),
        bar("1---", "1---", "1--1", "----"),
      ]),
      SNARE: voice([bar("----", "1---", "----", "1---"), bar(".--+", "1---", ".--+", "1---")], {
        fill: bar("----", "1---", "-1--", "1.1."),
      }),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("--1-", "----", "--1-", "----")]),
      PERC1: voice([bar("..1.", "..1.", ".1..", ".1..")]),
      PERC2: voice([bar(".1.1", ".1.1", ".1.1", ".11.")]),
    },
  }),
  style({
    id: "afrobeat",
    name: "Afrobeat",
    group: "Groove",
    bpm: 112,
    swing: 14,
    blurb: "Interlocking layers, a kick with a pickup, hats all the way through.",
    hatChoke: false,
    voices: {
      KICK: voice([
        bar("1---", "1---", "1---", "1-1-"),
        bar("1---", "1---", "--1-", "-1--"),
        bar("1--1", "-1--", "1---", "1---"),
      ]),
      SNARE: voice([bar("----", "1--1", "----", "1--1"), bar("----", "1---", "--1-", "1---")]),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("--1-", "----", "1---", "--1-")]),
      PERC1: voice([bar("..1.", "1...", "1.1.", "..1.")]),
      PERC2: voice([bar("1.11", ".1.1", "1.11", ".1.1")]),
    },
  }),
  style({
    id: "dub",
    name: "Dub",
    group: "Groove",
    bpm: 76,
    swing: 18,
    blurb: "Lots of space. Kick on 1 and 3, snare often only on 3.",
    voices: {
      KICK: voice([
        bar("1---", "----", "1---", "----"),
        bar("1---", "----", "----", "1---"),
        bar("1---", "----", "--1-", "----"),
      ]),
      SNARE: voice([bar("----", "----", "1---", "----"), bar("----", "1---", "----", "1---")]),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "----")]),
      HIHAT2: voice([bar("----", "----", "----", "1---")]),
      PERC1: voice([bar("----", "--1-", "----", "----")]),
      PERC2: voice([bar("..1.", "----", "1---", "----")]),
    },
  }),
  style({
    id: "reggae",
    name: "Reggae",
    group: "Groove",
    bpm: 80,
    swing: 12,
    blurb: "One drop: kick and snare together on 3, hats on the ands.",
    voices: {
      KICK: voice([bar("----", "----", "1---", "----"), bar("1---", "----", "1---", "----")]),
      SNARE: voice([bar("----", "----", "1---", "----")]),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----")]),
      PERC1: voice([bar("----", "--1-", "----", "----")]),
      PERC2: voice([bar("..1.", "..1.", "..1.", "..1.")]),
    },
  }),
  style({
    id: "samba",
    name: "Samba",
    group: "Latin",
    bpm: 108,
    swing: 0,
    blurb: "Surdo in the kick, caixa on the snare, a steady percussion bed.",
    hatChoke: false,
    voices: {
      KICK: voice([
        bar("1---", "1-1-", "1---", "1-1-"),
        bar("1--1", "--1-", "1--1", "----"),
        bar("----", "1---", "----", "1---"),
      ]),
      SNARE: voice([bar("x-x-", "1-x-", "x-x-", "1-x-"), bar("x1x1", "1xx1", "x1x1", "1x-1")]),
      HIHAT1: voice([bar("1.1.", "1.1.", "1.1.", "1.1.")]),
      HIHAT2: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      PERC1: voice([bar("1---", "1-1-", "--1-", "1---")]),
      PERC2: voice([bar("1x1x", "1x1x", "1x1x", "1x1x")]),
    },
  }),
  style({
    id: "bossa",
    name: "Bossa Nova",
    group: "Latin",
    bpm: 116,
    swing: 10,
    blurb: "Bass drum in the familiar bossa pattern, clave on perc 1.",
    voices: {
      KICK: voice([bar("1--1", "--1-", "--1-", "-1--")]),
      SNARE: voice([bar("..1.", ".1..", "1..1", ".1.."), bar("---1", "-1--", "-1-1", "----")]),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "----", "----", "1---")]),
      PERC1: voice([bar("1---", "--1-", "--1-", "----"), bar("----", "1---", "1---", "----")]),
      PERC2: voice([bar(".1.1", ".1.1", ".1.1", ".1.1")]),
    },
  }),
  style({
    id: "son",
    name: "Son Clave",
    group: "Latin",
    bpm: 100,
    swing: 8,
    blurb: "Tumbao in the kick, cascara on the snare, the 3-side of the clave on perc 1.",
    voices: {
      KICK: voice([bar("1--1", "--1-", "--1-", "-1--"), bar("1---", "--1-", "--1-", "-1--")]),
      SNARE: voice([bar("1--1", "-1--", "1-1-", "-1-1"), bar("1.1.", "1..1", "1.1.", "1.1.")]),
      HIHAT1: voice([bar("1-1-", "1-1-", "1-1-", "1-1-")]),
      HIHAT2: voice([bar("----", "1---", "----", "1---")]),
      PERC1: voice([bar("1---", "--1-", "--1-", "----"), bar("----", "1---", "1---", "----")]),
      PERC2: voice([bar("..1.", "1.1.", "..1.", "1.1.")]),
    },
  }),
  style({
    id: "cumbia",
    name: "Cumbia",
    group: "Latin",
    bpm: 96,
    swing: 6,
    blurb: "Guiro-like snare, kick on 1 and late, percussion in an eighth-note feel.",
    voices: {
      KICK: voice([bar("1---", "----", "1---", "1---"), bar("1---", "--1-", "--1-", "----")]),
      SNARE: voice([bar("----", "1--1", "----", "1--1")]),
      HIHAT1: voice([bar("--1-", "--1-", "--1-", "--1-")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----")]),
      PERC1: voice([bar("1...", "1...", "1...", "1...")]),
      PERC2: voice([bar("..11", "..11", "..11", "..11")]),
    },
  }),
  style({
    id: "jazz",
    name: "Jazz",
    group: "Other",
    bpm: 132,
    swing: 58,
    blurb: "Ride in spang-a-lang, a quiet kick. Turn the preview shuffle up.",
    voices: {
      KICK: voice([bar("1---", "----", "----", "1---"), bar("1---", "----", "1---", "----")]),
      SNARE: voice([bar("----", "1---", "----", "1---"), bar("x---", "1--x", "-x--", "1---")], {
        fill: bar("----", "1---", "----", "1xx1"),
      }),
      HIHAT1: voice([bar("1---", "1--1", "1---", "1--1")]),
      HIHAT2: voice([bar("----", "--1-", "----", "----")]),
      PERC1: voice([bar("----", "----", "----", "1---")]),
      PERC2: voice([bar("..1.", "----", "1---", "..1.")]),
    },
  }),
  style({
    id: "idm",
    name: "IDM",
    group: "Other",
    bpm: 124,
    swing: 10,
    blurb: "Deliberately crooked. Few anchors, lots of gaps and doubles.",
    voices: {
      KICK: voice([
        bar("1---", "--1-", "----", "1---"),
        bar("1--1", "----", "----", "1-1-"),
        bar("1---", "----", "1--1", "----"),
        bar("1---", "1-1-", "----", "--1-"),
      ]),
      SNARE: voice([
        bar("----", "1---", "---1", "----"),
        bar("----", "-1--", "--1-", "----"),
        bar("----", "---1", "----", "1--1"),
      ]),
      HIHAT1: voice([bar("1..1", "1.1.", "..1.", "11.1"), bar("11.1", ".1..", "11..", "1.1.")]),
      HIHAT2: voice([bar("----", "--1-", "----", "1..1")]),
      PERC1: voice([bar("1...", "1---", "--11", "----")]),
      PERC2: voice([bar(".1.1", "...1", "..1.", "1..1")]),
    },
  }),
  style({
    id: "ambient",
    name: "Ambient",
    group: "Other",
    bpm: 76,
    swing: 8,
    blurb: "Almost empty. One pulse, one snare, a few drops.",
    voices: {
      KICK: voice([bar("1---", "----", "----", "1---"), bar("1---", "----", "----", "----")]),
      SNARE: voice([bar("----", "----", "1---", "----"), bar("----", "----", "----", "1---")]),
      HIHAT1: voice([bar("--1-", "----", "--1-", "----")]),
      HIHAT2: voice([bar("----", "----", "----", "1---")]),
      PERC1: voice([bar("----", "--1-", "----", "----")]),
      PERC2: voice([bar("----", "1---", "----", "1---")]),
    },
  }),
];

const BY_ID = new Map(STYLES.map((entry) => [entry.id, entry]));

export function getStyle(id: string) {
  return BY_ID.get(id) ?? STYLES[0];
}

export function styleGroups() {
  const groups: string[] = [];
  for (const entry of STYLES) {
    if (!groups.includes(entry.group)) groups.push(entry.group);
  }
  return groups;
}

export function neighborStyle(styleId: string, rng: () => number) {
  const current = getStyle(styleId);
  const group = STYLES.filter((entry) => entry.group === current.group);
  const pick = group[Math.floor(rng() * group.length)] ?? current;
  return pick.id;
}
