"use client";

import { useEffect } from "react";

/**
 * Publishes the sticky header's real height as `--nav-h`, which the sticky filter bar on
 * /properties sits under.
 *
 * It was a media-query constant and could not be right. The header wraps when the nav labels
 * stop fitting, and the labels are a different length in English, Thai and Chinese, so the
 * height depends on the locale as well as the width. Measured 09/11/2026: 96.25px in English
 * at 640px wide and 66px in Chinese at the same width, against a published 66px for both.
 * That is the gap the filter bar was overlapped by.
 *
 * globals.css keeps the constant, which is now only what the first paint uses: this corrects
 * it on mount and then follows the header. The value is the header's full box including its
 * bottom hairline, which is the line the bar should sit under.
 *
 * Rounded DOWN, deliberately. The header is a fractional height at most widths, 97.25px in
 * English at 640, and rounding up puts the bar three quarters of a pixel below the header,
 * which is a gap the page scrolls through and reads as a flickering hairline. Rounding down
 * tucks the bar's top edge up to a pixel behind the header instead, where it cannot be seen:
 * the bar has a bottom border and no top one.
 *
 * Renders nothing. It is in the layout beside the header rather than inside it so the header
 * itself stays a server component.
 */
export function NavHeight() {
  useEffect(() => {
    const header = document.querySelector("[data-nav-root]");
    if (!header) return;

    const publish = () => {
      const height = Math.floor(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--nav-h", `${height}px`);
    };

    publish();

    // Catches the wrap at every width, the web fonts landing after hydration, and a locale
    // switch, none of which a breakpoint knows about.
    const observer = new ResizeObserver(publish);
    observer.observe(header);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--nav-h");
    };
  }, []);

  return null;
}
