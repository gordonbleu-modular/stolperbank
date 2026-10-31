import { useRef } from "react";
import { barBits } from "@/lib/pattern/bank";
import { channelMeta, type ChannelId } from "@/lib/pattern/types";

const SUBS = ["down", "e", "and", "a"] as const;

function beatIndices(index: number) {
  const start = index - (index % 4);
  return [start, start + 1, start + 2, start + 3];
}

export function LaneGrid({
  channel,
  steps,
  activeIndex,
  onEdit,
}: {
  channel: ChannelId;
  steps: boolean[];
  activeIndex: number;
  onEdit: (indices: number[], value: boolean, phase: "start" | "move") => void;
}) {
  const meta = channelMeta(channel);
  const drag = useRef<{ value: boolean; moved: boolean; start: number } | null>(null);
  const suppressClick = useRef(false);
  const last = useRef<number | null>(null);

  function stepFromPoint(x: number, y: number) {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-step]");
    if (!el) return null;
    const index = Number(el.dataset.step);
    return Number.isNaN(index) ? null : index;
  }

  return (
    <div
      className="bars"
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        const index = stepFromPoint(event.clientX, event.clientY);
        if (index == null) return;
        drag.current = { value: !steps[index], moved: false, start: index };
        last.current = index;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const stroke = drag.current;
        if (!stroke || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const index = stepFromPoint(event.clientX, event.clientY);
        if (index == null || index === last.current) return;
        const shift = event.shiftKey;
        if (!stroke.moved) {
          stroke.moved = true;
          const first = shift ? beatIndices(stroke.start) : [stroke.start];
          onEdit(first, stroke.value, "start");
        }
        last.current = index;
        onEdit(shift ? beatIndices(index) : [index], stroke.value, "move");
      }}
      onPointerUp={(event) => {
        const stroke = drag.current;
        if (stroke && !stroke.moved) {
          const indices = event.shiftKey ? beatIndices(stroke.start) : [stroke.start];
          onEdit(indices, stroke.value, "start");
          suppressClick.current = true;
        } else {
          suppressClick.current = Boolean(stroke?.moved);
        }
        drag.current = null;
        last.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
    >
      {Array.from({ length: meta.bars }, (_, bar) => {
        const barActive = activeIndex >= 0 && Math.floor(activeIndex / 16) === bar;
        return (
          <div className="bar" key={bar}>
            {meta.bars > 1 ? (
              <div className="bar-label">{barActive ? `Bar ${bar + 1} · playing` : `Bar ${bar + 1}`}</div>
            ) : null}
            <div className="beats">
              {[0, 1, 2, 3].map((beat) => {
                const beatStart = bar * 16 + beat * 4;
                const beatHot = activeIndex >= beatStart && activeIndex < beatStart + 4;
                return (
                  <div className={beatHot ? "beat is-now" : "beat"} key={beat}>
                    <div className="beat-no">{beat + 1}</div>
                    <div className="subs">
                      {[0, 1, 2, 3].map((sub) => {
                        const index = beatStart + sub;
                        const on = Boolean(steps[index]);
                        const play = activeIndex === index;
                        return (
                          <button
                            key={index}
                            type="button"
                            className={["led", on ? "is-on" : "", play ? "is-play" : "", sub === 0 ? "is-down" : ""]
                              .filter(Boolean)
                              .join(" ")}
                            data-step={index}
                            aria-pressed={on}
                            aria-label={`${meta.label}, bar ${bar + 1}, beat ${beat + 1} ${SUBS[sub]}, ${on ? "on" : "off"}`}
                            onClick={(event) => {
                              if (suppressClick.current) {
                                suppressClick.current = false;
                                return;
                              }
                              const indices = event.shiftKey ? beatIndices(index) : [index];
                              onEdit(indices, !on, "start");
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <code className="bits">{barBits(steps, bar)}</code>
          </div>
        );
      })}
    </div>
  );
}
