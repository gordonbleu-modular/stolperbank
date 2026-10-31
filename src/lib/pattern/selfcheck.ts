import factoryText from "./factory-bank.txt?raw";
import { parseBank, serializeBank } from "./bank";
import { regeneratePattern } from "./generate";
import { STYLES } from "./styles";
import { CHANNELS, stepCount, type ChannelId } from "./types";

function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

function norm(text: string) {
  return text.replace(/\r\n/g, "\n").trimEnd();
}

export function run() {
  for (const style of STYLES) {
    for (const channel of CHANNELS) {
      const voice = style.voices[channel.id];
      const bars = [...voice.bars, voice.fill, voice.alt].filter((bar): bar is string => Boolean(bar));
      for (const pattern of bars) {
        assert(pattern.length === 16, `${style.id} ${channel.id} length ${pattern.length}: ${pattern}`);
        assert(/^[1+x.\-]+$/.test(pattern), `${style.id} ${channel.id} Zeichen: ${pattern}`);
      }
    }
  }

  const factoryBank = factoryText.replace(/^\uFEFF/, "");
  const parsed = parseBank(factoryBank);
  assert(parsed.recognized === 144, `erwartet 144 Zeilen, bekam ${parsed.recognized}`);
  assert(parsed.errors.length === 0, parsed.errors.join(" | "));
  const round = norm(serializeBank(parsed.patterns));
  const original = norm(factoryBank);
  if (round !== original) {
    for (let i = 0; i < Math.max(round.length, original.length); i++) {
      if (round[i] !== original[i]) {
        throw new Error(`Roundtrip bei ${i}: ${JSON.stringify(original.slice(Math.max(0, i - 40), i + 40))} vs ${JSON.stringify(round.slice(Math.max(0, i - 40), i + 40))}`);
      }
    }
  }

  const techno = regeneratePattern(
    {
      ...parsed.patterns[0],
      styleId: "techno",
      density: 80,
      complexity: 0,
      variation: 0,
      channels: Object.fromEntries(
        CHANNELS.map((channel) => [
          channel.id,
          { ...parsed.patterns[0].channels[channel.id], locked: false, useOwn: false },
        ]),
      ) as (typeof parsed.patterns)[0]["channels"],
    },
    1,
  );
  assert(
    techno.channels.KICK.steps.slice(0, 16).map((step) => (step ? "1" : "0")).join("") === "1000100010001000",
    "Techno-Kick sollte Four-on-the-floor sein",
  );
  assert(techno.channels.KICK.steps.length === 64, "kick length");
  assert(techno.channels.HIHAT1.steps.length === 16, "hat length");

  const house = regeneratePattern(
    {
      ...techno,
      styleId: "house",
      density: 90,
      complexity: 0,
      variation: 0,
    },
    2,
  );
  const overlap = house.channels.HIHAT1.steps.some((on, index) => on && house.channels.HIHAT2.steps[index]);
  assert(!overlap, "House: open hat should clear the closed hat on the same step");

  const lockedKick = techno.channels.KICK.steps.slice();
  const kept = regeneratePattern(
    {
      ...techno,
      styleId: "samba",
      channels: {
        ...techno.channels,
        KICK: { ...techno.channels.KICK, locked: true },
      },
    },
    99,
  );
  assert(
    kept.channels.KICK.steps.every((step, index) => step === lockedKick[index]),
    "A locked kick must not be overwritten",
  );

  const again = regeneratePattern(parsed.patterns[3], 42, ["SNARE"]);
  const same = regeneratePattern(parsed.patterns[3], 42, ["SNARE"]);
  assert(
    again.channels.SNARE.steps.every((step, index) => step === same.channels.SNARE.steps[index]),
    "Gleicher Seed muss gleich bleiben",
  );
  for (const channel of CHANNELS) {
    assert(again.channels[channel.id].steps.length === stepCount(channel.id), channel.id);
  }

  const ids = new Set<string>();
  for (const style of STYLES) {
    assert(!ids.has(style.id), `doppelte Id ${style.id}`);
    ids.add(style.id);
  }
  assert(STYLES.length >= 24, "too few styles");

  const used: ChannelId[] = ["KICK", "SNARE", "HIHAT1", "HIHAT2", "PERC1", "PERC2"];
  assert(used.length === 6, "channels");
  console.log(`selfcheck ok · ${STYLES.length} stile · factory roundtrip`);
}
