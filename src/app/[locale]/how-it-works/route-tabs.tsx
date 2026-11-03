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
 * The four routes as a tabbed block on an ink ground, Paul's direction 03/11/2026, taking the
 * design of the "one platform, every task handled" block on Lodgify's home page.
 *
 * Its numbers, measured off that page at a 1440 viewport, are the ones used here: block radius
 * 28px, content 1120 wide inside it, 80px of air above the heading and below the panel;
 * heading 40px/700 uppercase at 1.2 and tracking 0, capped at 762px; standfirst 16px/400 at
 * 1.5 and -0.013em, capped at 675px; the bar white, 50 tall, radius 999px, 4px of padding,
 * each tab radius 40px with 12px of padding and its label 16px/500 at -0.037em; the panel two
 * columns at 0.43 and 0.57 with a 20px gap; the left column's statement 34px/500 at 1.17 and
 * its body 14px/400 at 1.5; the image 5:4.
 *
 * One number is deliberately not taken. Its heading is #FFF65B, an acid yellow that is not an
 * AgentSiam colour, and the guardrails forbid a new brand colour without updating the token
 * table and design-system.html. This uses --color-gold-on-ink, the gold the system already
 * defines for exactly this job, type on an ink ground.
 *
 * Three behaviours are also not copied. Its tabs are plain divs with no role, no aria-selected
 * and no keyboard route in; these are buttons in a tablist with arrow, Home and End. Its panels
 * are a flex track that slides and, on two separate loads, the marker moved while the panels
 * did not follow; one panel renders at a time here. And the marker is positioned from the
 * active button's measured box: two attempts at arithmetic on the bar's width drifted, because
 * the grid tracks and the rendered buttons are different widths, and measuring also survives
 * the labels being dictionary strings, since Thai runs wider than English.
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

  // Measured from the rects, not offsetLeft: offsetLeft is relative to the offsetParent's
  // padding edge and the marker is pinned to the border edge, so the two disagreed by the
  // bar's own 4px of padding and the marker sat a hair left of the pill.
  const measure = useCallback(() => {
    const node = tabs.current[active];
    const element = bar.current;
    if (!node || !element) return;
    const box = node.getBoundingClientRect();
    setMarker({
      left: box.left - element.getBoundingClientRect().left,
      width: box.width,
      measured: true,
    });
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
    <>
      {/* The bar. Below 640px the four stack and the active one carries its own fill, because
          one sliding marker cannot follow a wrapped row, and a 2x2 grid of the two-line Thai
          labels reads as four labels crammed in a box rather than as a bar.

          No `.hit` on these buttons, deliberately, though most controls on the site carry it.
          It is a tap-target expander, `padding: 6px 4px; margin: -6px -4px`, and that negative
          margin pulled each button 4px past its grid track: it cancelled the bar's own 4px of
          padding, so the active pill sat hard against the bar's edge, and it made every button
          8px wider than its track, which is what made the first two attempts at the sliding
          marker drift. These are already 48px tall, so they need no expanding.

          The pill is `rounded-full` rather than their 40px. At their 42px tall a 40px radius is
          effectively round; at ours it is not, and a part-round pill inside a fully round bar
          reads as colliding with the end cap. */}
      <div
        ref={bar}
        role="tablist"
        aria-label={panelLabel}
        className="relative mt-14 grid grid-cols-1 gap-1 rounded-panel bg-bg p-1 sm:grid-cols-4 sm:rounded-full"
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
            className={`relative z-10 min-w-0 rounded-full p-3 text-center text-[16px] leading-[1.12] font-medium tracking-[-0.037em] transition-colors duration-200 outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary sm:bg-transparent ${
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
        className="mt-10 grid animate-[panel-in_260ms_ease-out] gap-5 sm:grid-cols-[0.43fr_0.57fr]"
      >
        <div className="rounded-[24px] bg-bg p-6 sm:p-7.5">
          <IconChip name={route.icon} tone="sand" />
          <p className="mt-5 font-display text-[clamp(24px,3.1vw,34px)] leading-[1.17] font-medium text-ink">
            {route.take}
          </p>
          <p className="mt-4 text-[14px] leading-[1.5] tracking-[-0.014em] text-muted">
            {route.why}
          </p>
        </div>

        {/* The image slot. A brand gradient ground at the card's own radius is the design
            system's treatment for a slot with no photograph, not a grey rectangle and not
            stock, and the hue is the same on all four routes so it cannot be read as a verdict
            on the route it sits beside. It carries no caption: a visible "photograph to come"
            would be a fifth string needing Thai and Chinese, and the gradient ground is already
            the honest treatment on its own. The frame wanted here is 5:4, so 1060x848 at 2x. */}
        <div className="rounded-[24px] bg-bg p-3">
          <div aria-hidden="true" className="grad-blue aspect-5/4 rounded-[16px]" />
        </div>
      </div>
    </>
  );
}
