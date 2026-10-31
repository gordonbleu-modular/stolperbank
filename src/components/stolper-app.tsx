import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  Dices,
  Download,
  Lock,
  LockOpen,
  Play,
  Redo2,
  Square,
  Trash2,
  Undo2,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { DrumPlayer, hitsAt } from "@/lib/audio/player";
import {
  emptyBank,
  makePattern,
  parseBank,
  sanitizePatterns,
  serializeBank,
  triggerCount,
} from "@/lib/pattern/bank";
import { draftBankPattern, regeneratePattern } from "@/lib/pattern/generate";
import { getStyle, styleGroups, STYLES } from "@/lib/pattern/styles";
import {
  bankFilename,
  CHANNELS,
  PATTERN_COUNT,
  channelMeta,
  type ChannelId,
  type PatternState,
} from "@/lib/pattern/types";
import { LaneGrid } from "@/components/lane-grid";

const STORAGE_KEY = "stolperbank-v2";

type Mutes = Record<ChannelId, boolean>;

interface Persisted {
  v: 1;
  bankNumber: number;
  patternIndex: number;
  patterns: PatternState[];
  bpm: number;
  swing: number;
  mutes: Mutes;
  bankStyle: string;
  bankDensity: number;
  bankComplexity: number;
  bankVariation: number;
  mix: boolean;
}

function blankMutes(): Mutes {
  return { KICK: false, SNARE: false, HIHAT1: false, HIHAT2: false, PERC1: false, PERC2: false };
}

function StyleSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (id: string) => void;
  id: string;
}) {
  return (
    <select id={id} className="select" value={getStyle(value).id} onChange={(event) => onChange(event.target.value)}>
      {styleGroups().map((group) => (
        <optgroup key={group} label={group}>
          {STYLES.filter((style) => style.group === group).map((style) => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function Fader({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="field">
      <span className="fader-top">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>
      <input
        className="fader"
        type="range"
        min={min}
        max={max}
        value={value}
        style={{ "--fill": `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function StolperApp() {
  const [patterns, setPatterns] = useState<PatternState[]>(() => emptyBank());
  const [patternIndex, setPatternIndex] = useState(0);
  const [bankNumber, setBankNumber] = useState(0);
  const [bpm, setBpm] = useState(130);
  const [swing, setSwing] = useState(8);
  const [mutes, setMutes] = useState<Mutes>(blankMutes);
  const [playhead, setPlayhead] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("Empty bank 000, pattern 00. Click steps, or generate a style.");
  const [arm, setArm] = useState<null | "empty" | "bank" | "clear">(null);
  const [mix, setMix] = useState(true);
  const [bankStyle, setBankStyle] = useState("techno");
  const [bankDensity, setBankDensity] = useState(62);
  const [bankComplexity, setBankComplexity] = useState(40);
  const [bankVariation, setBankVariation] = useState(55);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [ready, setReady] = useState(false);
  const [offer, setOffer] = useState<null | { name: string; text: string; href: string }>(null);

  const past = useRef<PatternState[][]>([]);
  const future = useRef<PatternState[][]>([]);
  const patternsRef = useRef(patterns);
  const fileRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const playerRef = useRef<DrumPlayer | null>(null);
  const liveRef = useRef({ patterns, patternIndex, mutes });
  patternsRef.current = patterns;
  liveRef.current = { patterns, patternIndex, mutes };

  const pattern = patterns[patternIndex] ?? makePattern();
  const style = getStyle(pattern.styleId);
  const filename = bankFilename(bankNumber);

  function markHistory() {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  }

  function remember() {
    past.current.push(structuredClone(patternsRef.current));
    if (past.current.length > 40) past.current.shift();
    future.current = [];
    markHistory();
  }

  function undo() {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(structuredClone(patternsRef.current));
    setPatterns(prev);
    markHistory();
    setStatus("Undone.");
  }

  function redo() {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(structuredClone(patternsRef.current));
    setPatterns(next);
    markHistory();
    setStatus("Redone.");
  }

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  useEffect(() => {
    const player = new DrumPlayer();
    player.getHits = (step) => {
      const live = liveRef.current;
      const current = live.patterns[live.patternIndex];
      if (!current) return [];
      const steps = {} as Record<ChannelId, boolean[]>;
      for (const channel of CHANNELS) steps[channel.id] = current.channels[channel.id].steps;
      return hitsAt(steps, step, live.mutes);
    };
    player.onStep = (step) => setPlayhead(step);
    playerRef.current = player;
    return () => player.stop();
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.bpm = bpm;
    player.swing = swing;
  }, [bpm, swing]);

  useEffect(() => {
    try {
      localStorage.removeItem("stolperbank-v1");
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Persisted>;
        const next = sanitizePatterns(saved.patterns);
        if (next) {
          setPatterns(next);
          if (typeof saved.bankNumber === "number") setBankNumber(Math.min(63, Math.max(0, saved.bankNumber)));
          if (typeof saved.patternIndex === "number") {
            setPatternIndex(Math.min(PATTERN_COUNT - 1, Math.max(0, saved.patternIndex)));
          }
          if (typeof saved.bpm === "number") setBpm(saved.bpm);
          if (typeof saved.swing === "number") setSwing(saved.swing);
          if (saved.mutes) setMutes({ ...blankMutes(), ...saved.mutes });
          if (typeof saved.bankStyle === "string") setBankStyle(saved.bankStyle);
          if (typeof saved.bankDensity === "number") setBankDensity(saved.bankDensity);
          if (typeof saved.bankComplexity === "number") setBankComplexity(saved.bankComplexity);
          if (typeof saved.bankVariation === "number") setBankVariation(saved.bankVariation);
          if (typeof saved.mix === "boolean") setMix(saved.mix);
          setStatus("Restored the last bank from this browser.");
        }
      }
    } catch {
      setStatus("Saved bank could not be read. Starting from an empty bank.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload: Persisted = {
      v: 1,
      bankNumber,
      patternIndex,
      patterns,
      bpm,
      swing,
      mutes,
      bankStyle,
      bankDensity,
      bankComplexity,
      bankVariation,
      mix,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    ready,
    bankNumber,
    patternIndex,
    patterns,
    bpm,
    swing,
    mutes,
    bankStyle,
    bankDensity,
    bankComplexity,
    bankVariation,
    mix,
  ]);

  useEffect(() => {
    if (!arm) return;
    const timer = window.setTimeout(() => setArm(null), 2800);
    return () => window.clearTimeout(timer);
  }, [arm]);

  const toggleRef = useRef<() => void>(() => {});

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        toggleRef.current();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redoRef.current();
        else undoRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function togglePlay() {
    const player = playerRef.current;
    if (!player) return;
    if (player.isRunning) {
      player.stop();
      setPlaying(false);
      setPlayhead(-1);
      return;
    }
    player.bpm = bpm;
    player.swing = swing;
    await player.start();
    setPlaying(true);
  }
  toggleRef.current = () => {
    void togglePlay();
  };

  function updatePattern(index: number, recipe: (pattern: PatternState) => PatternState) {
    setPatterns((prev) => prev.map((pattern, i) => (i === index ? recipe(pattern) : pattern)));
  }

  function editSteps(id: ChannelId, indices: number[], value: boolean, phase: "start" | "move") {
    if (phase === "start") remember();
    updatePattern(patternIndex, (current) => {
      const lane = current.channels[id];
      const steps = lane.steps.slice();
      for (const index of indices) {
        if (index >= 0 && index < steps.length) steps[index] = value;
      }
      return { ...current, channels: { ...current.channels, [id]: { ...lane, steps } } };
    });
  }

  function generateOne(id: ChannelId) {
    remember();
    const seed = Math.floor(Math.random() * 1_000_000_000);
    updatePattern(patternIndex, (current) => regeneratePattern(current, seed, [id]));
    const lane = patternsRef.current[patternIndex]?.channels[id];
    const used = lane?.useOwn ? getStyle(lane.styleId).name : style.name;
    setStatus(`${channelMeta(id).label} in PTN ${patternIndex} regenerated · ${used}.`);
  }

  function generateCurrent() {
    remember();
    const seed = Math.floor(Math.random() * 1_000_000_000);
    updatePattern(patternIndex, (current) => regeneratePattern(current, seed));
    setStatus(`PTN ${patternIndex} generated · ${style.name}. Locked tracks stay.`);
  }

  function generateBank() {
    if (arm !== "bank") {
      setArm("bank");
      setStatus("Tap again to overwrite all 24 patterns. You can undo afterwards.");
      return;
    }
    setArm(null);
    remember();
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const settings = {
      styleId: bankStyle,
      density: bankDensity,
      complexity: bankComplexity,
      variation: bankVariation,
      mix,
    };
    setPatterns((prev) => prev.map((pattern, index) => draftBankPattern(pattern, index, settings, seed)));
    const name = getStyle(bankStyle).name;
    setStatus(mix ? `Bank generated · ${name} and neighbouring styles.` : `Bank generated · all ${name}.`);
  }

  function clearPattern() {
    if (arm !== "clear") {
      setArm("clear");
      return;
    }
    setArm(null);
    remember();
    updatePattern(patternIndex, (current) => {
      const channels = { ...current.channels };
      for (const channel of CHANNELS) {
        channels[channel.id] = {
          ...channels[channel.id],
          steps: channels[channel.id].steps.map(() => false),
        };
      }
      return { ...current, channels };
    });
    setStatus(`PTN ${patternIndex} cleared.`);
  }

  function loadEmpty() {
    if (arm !== "empty") {
      setArm("empty");
      return;
    }
    setArm(null);
    remember();
    setPatterns(emptyBank());
    setStatus("Empty bank. 24 patterns, every step off.");
  }

  function copyNext() {
    if (patternIndex >= PATTERN_COUNT - 1) return;
    remember();
    const target = patternIndex + 1;
    setPatterns((prev) => prev.map((pattern, index) => (index === target ? structuredClone(prev[patternIndex]) : pattern)));
    setPatternIndex(target);
    setStatus(`Copied PTN ${patternIndex} to PTN ${target}.`);
  }

  async function ingest(file: File) {
    const text = await file.text();
    const result = parseBank(text);
    if (result.recognized === 0) {
      setStatus("No pattern lines found. Expected something like: KICK > PTN0: 1000100010001000, …;");
      return;
    }
    remember();
    setPatterns(result.patterns);
    const match = file.name.match(/PatternBank(\d{1,3})/i);
    if (match) setBankNumber(Math.min(63, Number(match[1])));
    const warn = result.errors.length ? ` Note: “${result.errors[0]}” ignored.` : "";
    setStatus(`${result.recognized} lines loaded from ${file.name}.${warn}`);
  }

  function download(anchor: HTMLAnchorElement) {
    const text = serializeBank(patternsRef.current);
    const blob = new Blob([text], { type: "application/octet-stream" });
    const href = URL.createObjectURL(blob);
    const previous = blobUrlRef.current;
    blobUrlRef.current = href;
    if (previous) window.setTimeout(() => URL.revokeObjectURL(previous), 60_000);
    anchor.href = href;
    anchor.download = filename;
    setOffer({ name: filename, text, href });
    setStatus(`Download started: ${filename}. That is bank ${bankNumber + 1} on the module.`);
  }

  async function copyText() {
    const text = serializeBank(patternsRef.current);
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${filename} copied to the clipboard.`);
    } catch {
      setStatus("Clipboard is not available. Use the download instead.");
    }
  }

  const allLocked = CHANNELS.every((channel) => pattern.channels[channel.id].locked);

  return (
    <div className="bench">
      <div
        className={dropping ? "plate is-drop" : "plate"}
        onDragOver={(event) => {
          event.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDropping(false);
          const file = event.dataTransfer.files[0];
          if (file) void ingest(file);
        }}
      >
        <header className="mast">
          <div className="mast-row">
            <div>
              <p className="eyebrow">Eurorack · Pattern bank</p>
              <h1>STOLPERBANK</h1>
              <p className="lede">Draw steps, generate grooves, export a text file for Stolperbeats.</p>
            </div>
            <div className="readouts">
              <div className="screen">
                <span>Bank</span>
                <strong>{String(bankNumber).padStart(3, "0")}</strong>
              </div>
              <div className="screen">
                <span>PTN</span>
                <strong>{String(patternIndex).padStart(2, "0")}</strong>
              </div>
            </div>
          </div>
          <div className="transport">
            <button type="button" className={playing ? "play is-on" : "play"} onClick={() => void togglePlay()}>
              {playing ? <Square size={16} /> : <Play size={16} />}
              {playing ? "Stop" : "Start"}
            </button>
            <Fader label="Tempo" min={50} max={200} value={bpm} onChange={setBpm} />
            <Fader label="Preview shuffle" value={swing} max={68} onChange={setSwing} />
            <div className="screen step">
              <span>Step</span>
              <strong>{playhead < 0 ? "—" : String(playhead + 1).padStart(2, "0")}</strong>
            </div>
          </div>
        </header>

        <div className="layout">
          <aside className="side">
            <p className="kicker">Patterns · 0–23</p>
            <div className="matrix" role="listbox" aria-label="Choose pattern">
              {patterns.map((entry, index) => {
                const hits = triggerCount(entry);
                return (
                  <button
                    key={index}
                    type="button"
                    role="option"
                    aria-selected={index === patternIndex}
                    className={["ptn", index === patternIndex ? "is-current" : "", hits > 0 ? "has" : ""].filter(Boolean).join(" ")}
                    onClick={() => setPatternIndex(index)}
                  >
                    {String(index).padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            <div className="stack">
              <div className="btn-row">
                <button type="button" className="btn" onClick={undo} disabled={!canUndo}>
                  <Undo2 size={16} /> Undo
                </button>
                <button type="button" className="btn" onClick={redo} disabled={!canRedo}>
                  <Redo2 size={16} /> Redo
                </button>
              </div>

              <div className="bank-line">
                <label className="field">
                  <span className="field-label">
                    <span>File</span>
                  </span>
                  <input
                    className="num"
                    type="number"
                    min={0}
                    max={63}
                    value={bankNumber}
                    onChange={(event) => setBankNumber(Math.min(63, Math.max(0, Number(event.target.value) || 0)))}
                    aria-label="Bank number 0 to 63"
                  />
                </label>
                <p className="note">
                  {filename} is bank {bankNumber + 1} on the module.
                </p>
              </div>

              <div className="btn-row">
                <a
                  className="btn btn-primary"
                  href={offer?.href ?? "#"}
                  download={filename}
                  onClick={(event) => download(event.currentTarget)}
                >
                  <Download size={16} /> Export
                </a>
                <button type="button" className="btn" onClick={() => void copyText()}>
                  <Copy size={16} /> Copy
                </button>
                <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} /> Import
                </button>
              </div>
              <input
                ref={fileRef}
                className="sr"
                type="file"
                accept=".txt,text/plain"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void ingest(file);
                  event.target.value = "";
                }}
              />

              <div className="btn-row">
                <button type="button" className={arm === "empty" ? "btn is-armed" : "btn"} onClick={loadEmpty}>
                  {arm === "empty" ? "Really clear?" : "Empty bank"}
                </button>
              </div>

              <p className="kicker">Generate whole bank</p>
              <div className="field">
                <label className="field-label" htmlFor="bank-style">
                  Bank style
                </label>
                <StyleSelect id="bank-style" value={bankStyle} onChange={setBankStyle} />
              </div>
              <Fader label="Density" value={bankDensity} onChange={setBankDensity} />
              <Fader label="Complexity" value={bankComplexity} onChange={setBankComplexity} />
              <Fader label="Spread" value={bankVariation} onChange={setBankVariation} />
              <label className="check">
                <input type="checkbox" checked={mix} onChange={(event) => setMix(event.target.checked)} />
                Mix neighbouring styles
              </label>
              <button type="button" className="btn" onClick={() => {
                setBankStyle(pattern.styleId);
                setBankDensity(pattern.density);
                setBankComplexity(pattern.complexity);
                setBankVariation(pattern.variation);
              }}>
                Use current pattern
              </button>
              <button type="button" className={arm === "bank" ? "btn btn-primary is-armed" : "btn btn-primary"} onClick={generateBank}>
                <Dices size={16} />
                {arm === "bank" ? "Really all 24?" : "Generate 24 patterns"}
              </button>
              <p className="hint">Locked tracks stay. Tracks with their own settings use those.</p>

              <details className="help">
                <summary>Onto the SD card</summary>
                <p>
                  Stolperbeats reads PatternBank000.txt through PatternBank063.txt. 000 is bank 1, so {filename} is bank{" "}
                  {bankNumber + 1}.
                </p>
                <p>
                  Power the module off before you pull the card. Copy the file, then in MachineConfig.txt set digit{" "}
                  {bankNumber + 1} of PATTERNBANK_ACTIVE to 1. Otherwise the bank is skipped when you browse.
                </p>
                <p>
                  Kick and snare are 4 bars of 16 steps. The other tracks are one bar, which loops four times. Shuffle, timing
                  and feel are not stored in the file — the module sets those. Playback here is only for checking.
                </p>
                <p>Space starts playback. Shift-click sets a whole beat. Drag paints several steps.</p>
              </details>
            </div>
          </aside>

          <main className="stage">
            <p className="status" role="status">
              {status}
            </p>
            <div className="toolbar">
              <div className="toolbar-grid">
                <div className="field">
                  <label className="field-label" htmlFor="pattern-style">
                    Style of this pattern
                  </label>
                  <StyleSelect
                    id="pattern-style"
                    value={pattern.styleId}
                    onChange={(styleId) => updatePattern(patternIndex, (current) => ({ ...current, styleId }))}
                  />
                </div>
                <Fader
                  label="Density"
                  value={pattern.density}
                  onChange={(density) => updatePattern(patternIndex, (current) => ({ ...current, density }))}
                />
                <Fader
                  label="Complexity"
                  value={pattern.complexity}
                  onChange={(complexity) => updatePattern(patternIndex, (current) => ({ ...current, complexity }))}
                />
                <Fader
                  label="Variation"
                  value={pattern.variation}
                  onChange={(variation) => updatePattern(patternIndex, (current) => ({ ...current, variation }))}
                />
              </div>
              <p className="blurb">
                {style.blurb} Suggested {style.bpm} BPM, shuffle {style.swing}. Variation 0 repeats the bars.
              </p>
              <div className="btn-row">
                <button type="button" className="btn btn-primary" onClick={generateCurrent}>
                  <Dices size={16} /> Generate pattern
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setBpm(style.bpm);
                    setSwing(style.swing);
                  }}
                >
                  Tempo from style
                </button>
                <button type="button" className="btn" onClick={copyNext} disabled={patternIndex === PATTERN_COUNT - 1}>
                  <Copy size={16} /> To next
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    updatePattern(patternIndex, (current) => {
                      const channels = { ...current.channels };
                      for (const channel of CHANNELS) {
                        channels[channel.id] = { ...channels[channel.id], locked: !allLocked };
                      }
                      return { ...current, channels };
                    })
                  }
                >
                  {allLocked ? <LockOpen size={16} /> : <Lock size={16} />}
                  {allLocked ? "Unlock all" : "Lock all"}
                </button>
                <button type="button" className={arm === "clear" ? "btn is-armed" : "btn"} onClick={clearPattern}>
                  <Trash2 size={16} />
                  {arm === "clear" ? "Really clear?" : "Clear pattern"}
                </button>
              </div>
            </div>

            <p className="legend">One bar, four beats, four steps each. Lit means a trigger. The digits underneath are exactly the file.</p>

            {CHANNELS.map((channel) => {
              const lane = pattern.channels[channel.id];
              const hits = lane.steps.filter(Boolean).length;
              const active = playhead < 0 ? -1 : channel.bars === 1 ? playhead % 16 : playhead;
              return (
                <section className="strip" key={channel.id} aria-label={channel.label}>
                  <div className="strip-head">
                    <div className="strip-id">
                      <button
                        type="button"
                        className={lane.locked ? "lock is-on" : "lock"}
                        aria-pressed={lane.locked}
                        aria-label={lane.locked ? `Unlock ${channel.label}` : `Protect ${channel.label} from the generator`}
                        onClick={() =>
                          updatePattern(patternIndex, (current) => ({
                            ...current,
                            channels: {
                              ...current.channels,
                              [channel.id]: { ...current.channels[channel.id], locked: !lane.locked },
                            },
                          }))
                        }
                      >
                        {lane.locked ? <Lock size={16} /> : <LockOpen size={16} />}
                      </button>
                      <div>
                        <h2>{channel.label}</h2>
                        <p>
                          {channel.hint} · {channel.bars * 16} steps · {hits} on
                          {lane.locked ? " · locked" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="btn-row">
                      <button
                        type="button"
                        className={mutes[channel.id] ? "icon-btn is-on" : "icon-btn"}
                        aria-pressed={mutes[channel.id]}
                        aria-label={mutes[channel.id] ? `Unmute ${channel.label} in the preview` : `Mute ${channel.label} in the preview`}
                        onClick={() => setMutes((prev) => ({ ...prev, [channel.id]: !prev[channel.id] }))}
                      >
                        {mutes[channel.id] ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <button type="button" className="btn" onClick={() => generateOne(channel.id)} disabled={lane.locked}>
                        <Dices size={16} /> Track
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          remember();
                          updatePattern(patternIndex, (current) => ({
                            ...current,
                            channels: {
                              ...current.channels,
                              [channel.id]: {
                                ...current.channels[channel.id],
                                steps: current.channels[channel.id].steps.map(() => false),
                              },
                            },
                          }));
                        }}
                      >
                        <Trash2 size={16} /> Clear
                      </button>
                    </div>
                  </div>

                  <label className="check own">
                    <input
                      type="checkbox"
                      checked={lane.useOwn}
                      onChange={(event) =>
                        updatePattern(patternIndex, (current) => ({
                          ...current,
                          channels: {
                            ...current.channels,
                            [channel.id]: { ...current.channels[channel.id], useOwn: event.target.checked },
                          },
                        }))
                      }
                    />
                    Own settings, only for this track in this pattern
                  </label>

                  {lane.useOwn ? (
                    <div className="params own">
                      <div className="field">
                        <label className="field-label" htmlFor={`${channel.id}-style`}>
                          Track style
                        </label>
                        <StyleSelect
                          id={`${channel.id}-style`}
                          value={lane.styleId}
                          onChange={(styleId) =>
                            updatePattern(patternIndex, (current) => ({
                              ...current,
                              channels: {
                                ...current.channels,
                                [channel.id]: { ...current.channels[channel.id], styleId },
                              },
                            }))
                          }
                        />
                      </div>
                      <Fader
                        label="Density"
                        value={lane.density}
                        onChange={(density) =>
                          updatePattern(patternIndex, (current) => ({
                            ...current,
                            channels: {
                              ...current.channels,
                              [channel.id]: { ...current.channels[channel.id], density },
                            },
                          }))
                        }
                      />
                      <Fader
                        label="Complexity"
                        value={lane.complexity}
                        onChange={(complexity) =>
                          updatePattern(patternIndex, (current) => ({
                            ...current,
                            channels: {
                              ...current.channels,
                              [channel.id]: { ...current.channels[channel.id], complexity },
                            },
                          }))
                        }
                      />
                      <Fader
                        label="Variation"
                        value={lane.variation}
                        onChange={(variation) =>
                          updatePattern(patternIndex, (current) => ({
                            ...current,
                            channels: {
                              ...current.channels,
                              [channel.id]: { ...current.channels[channel.id], variation },
                            },
                          }))
                        }
                      />
                    </div>
                  ) : null}

                  <LaneGrid channel={channel.id} steps={lane.steps} activeIndex={active} onEdit={(indices, value, phase) => editSteps(channel.id, indices, value, phase)} />
                </section>
              );
            })}
          </main>
        </div>
      </div>
      {offer
        ? createPortal(
            <div className="export-sheet" role="dialog" aria-modal="true" aria-labelledby="export-title">
              <div className="export-card">
                <p className="kicker">File</p>
                <h2 id="export-title">{offer.name}</h2>
                <p className="hint">
                  The download should start now. The preview sometimes swallows the file — then copy the text and save it as{" "}
                  {offer.name}.
                </p>
                <div className="btn-row">
                  <a className="btn btn-primary" href={offer.href} download={offer.name}>
                    <Download size={16} /> Download again
                  </a>
                  <button type="button" className="btn" onClick={() => void copyText()}>
                    <Copy size={16} /> Copy
                  </button>
                  <button type="button" className="btn" onClick={() => setOffer(null)}>
                    Close
                  </button>
                </div>
                <pre className="export-text" tabIndex={0}>
                  {offer.text}
                </pre>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
