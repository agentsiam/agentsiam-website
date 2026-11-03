"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { IconChip } from "@/components/icon";

/**
 * The four routes as a tabbed panel on an ink ground, Paul's direction 03/11/2026, after the
 * same block on Lodgify's home page.
 *
 * Three things are deliberately not copied from it. Theirs marks the selected tab by text
 * colour alone on a plain `div`, with no `role`, no `aria-selected` and no keyboard route in,
 * so the block cannot be used without a mouse; these are real buttons in a tablist with
 * arrow-key navigation. Theirs slides a flex track of panels sideways and, on two separate
 * loads, the pill animated while the panels did not follow; one panel renders at a time here,
 * so there is no track to desynchronise. And its heading is set in caps, which this one is
 * not: the brand reads formal without being cold, and the route titles are sentences.
 *
 * The marker is positioned from the active button's measured box, not from a percentage of
 * the bar. Two attempts at the arithmetic drifted, because the grid's own gaps have to appear
 * in both the width and the step and the measured pitch did not match the measured width.
 * Measuring also survives what arithmetic could not: the four labels are dictionary strings
 * and Thai runs longer than English, so the columns are not the same width in every locale.
 *
 * The ground is the ink panel, which is the design system's own treatment for an image slot
 * with no photograph yet rather than a stopgap. A dark photograph drops in behind it when one
 * is shot, at 2160x1920 for desktop and a portrait crop for phones.
 */

type Route = {
  icon: ComponentProps<typeof IconChip>["name"];
  when: string;
  take: string;
  why: string;
};

export function RouteTabs({ routes, panelLabel }: { routes: Route[]; panelLabel: string }) {
  const [active, setActive] = useState(0);
  const [marker, setMarker] = useState({ left: 0, width: 0, measured: false });
  const bar = useRef<HTMLDivElement | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const measure = useCallback(() => {
    const node = tabs.current[active];
    if (!node) return;
    setMarker({ left: node.offsetLeft, width: node.offsetWidth, measured: true });
  }, [active]);

  useEffect(() => {
    measure();
    const element = bar.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  function move(to: number) {
    const next = (to + routes.length) % routes.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") move(index + 1);
    else if (event.key === "ArrowLeft") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(routes.length - 1);
    else return;
    event.preventDefault();
  }

  const route = routes[active];

  return (
    <div className="mt-8">
      {/* The pill bar. Below 640px the four stack and each active button carries its own fill,
          because one sliding marker cannot follow a wrapped row. Stacked rather than two by
          two: these labels are dictionary strings and the Thai ones run to two lines each, so
          a 2x2 grid of them reads as four labels crammed in a box rather than as a bar. */}
      <div
        ref={bar}
        role="tablist"
        aria-label={panelLabel}
        className="relative grid grid-cols-1 gap-1 rounded-panel bg-bg p-1 sm:grid-cols-4 sm:rounded-full"
      >
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-0 hidden rounded-full bg-ink transition-transform duration-300 ease-out sm:block"
          style={{
            width: `${marker.width}px`,
            transform: `translateX(${marker.left}px)`,
            opacity: marker.measured ? 1 : 0,
          }}
        />
        {routes.map((item, index) => (
          <button
            key={item.when}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`route-tab-${index}`}
            aria-selected={index === active}
            aria-controls={`route-panel-${index}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`hit relative z-10 min-w-0 rounded-full px-3.5 py-2 text-center text-[13px] font-semibold leading-snug transition-colors duration-200 sm:bg-transparent ${
              index === active ? "bg-ink text-white sm:text-white" : "text-ink hover:text-primary"
            }`}
          >
            {item.when}
          </button>
        ))}
      </div>

      {/* One panel at a time, keyed on the index so the fade replays on every change. */}
      <div
        key={active}
        role="tabpanel"
        id={`route-panel-${active}`}
        aria-labelledby={`route-tab-${active}`}
        tabIndex={0}
        className="mt-4 animate-[panel-in_260ms_ease-out] rounded-panel bg-bg p-5.5 sm:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] sm:gap-9">
          <div className="flex items-start gap-3">
            <IconChip name={route.icon} tone="sand" />
            <p className="font-display text-[17px] font-bold leading-snug tracking-[-0.015em] text-primary">
              {route.take}
            </p>
          </div>
          <p className="text-[14.5px] leading-relaxed text-body">{route.why}</p>
        </div>
      </div>
    </div>
  );
}
