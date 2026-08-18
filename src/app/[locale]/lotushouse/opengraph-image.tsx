import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { isLocale } from "@/i18n";
import { heroPhoto, pickPhoto } from "@/lib/photos";
import { LOTUS_HOUSE, propertyArea } from "@/lib/property";

/**
 * The share card for the property page, rather than the site-wide one.
 *
 * The site-wide card at src/app/opengraph-image.tsx is an owner pitch: "know if it's worth
 * it before you commit to it", feasibility and permission and management. Correct for the
 * homepage and for /how-it-works, and wrong on a listing -- pasting the property into a
 * guest group in LINE or Facebook showed a townhouse title above a feasibility-study
 * offer. Pasted links in groups are the lead-gen channel, so that mismatch is a conversion
 * problem rather than a cosmetic one.
 *
 * Airbnb and Booking both put the property photo on the card. We have 49 photos of this
 * house and the site-wide card used none of them, so this one leads with the hero.
 *
 * Deliberately language-neutral. Every word on it is a proper noun in Latin script -- the
 * house, the area, the city -- so the same card serves all three locales and no Thai or
 * Chinese glyph has to render. That matters because Satori needs raw font bytes and the
 * site's Thai and Chinese faces come from next/font/google, which would mean fetching a
 * font at build time purely for this card. The base card avoided that for the same reason.
 * Missing glyphs render as boxes, and a card full of boxes is worse than an English one.
 */

const INK = "#14141c";
const PRIMARY = "#0100dd";
const SECONDARY = "#fb5932";
const TEAL = "#00b4b1";

// Same path data as src/components/logo.tsx, the filed AgentSiam_icon_2026.svg wordmark.
const WORDMARK =
  "M2.58028 8.17239V6.16839H8.78428V8.17239H2.58028ZM7.36828 0.90039L11.4603 9.90039H8.80828L5.37628 1.95639H6.09628L2.65228 9.90039H0.000281251L4.09228 0.90039H7.36828ZM17.8163 8.17239V7.00839L17.9003 6.72039V5.04039L17.8163 4.78839V3.04839H20.2643V8.07639C20.2643 8.91639 20.0683 9.63639 19.6763 10.2364C19.2843 10.8364 18.7363 11.2924 18.0323 11.6044C17.3363 11.9164 16.5123 12.0724 15.5603 12.0724C14.9283 12.0724 14.3403 11.9884 13.7963 11.8204C13.2603 11.6604 12.7243 11.4204 12.1883 11.1004V9.25239C12.6843 9.62039 13.2043 9.88439 13.7483 10.0444C14.3003 10.2124 14.8523 10.2964 15.4043 10.2964C16.1883 10.2964 16.7843 10.1284 17.1923 9.79239C17.6083 9.45639 17.8163 8.91639 17.8163 8.17239ZM14.8763 9.18039C14.2283 9.18039 13.6523 9.04839 13.1483 8.78439C12.6443 8.52039 12.2443 8.15239 11.9482 7.68039C11.6603 7.20039 11.5163 6.64439 11.5163 6.01239C11.5163 5.37239 11.6603 4.81639 11.9482 4.34439C12.2443 3.87239 12.6443 3.50439 13.1483 3.24039C13.6523 2.97639 14.2283 2.84439 14.8763 2.84439C15.3563 2.84439 15.7963 2.92039 16.1963 3.07239C16.5963 3.21639 16.9523 3.41239 17.2643 3.66039C17.5763 3.90039 17.8363 4.16439 18.0443 4.45239C18.2603 4.73239 18.4243 5.01239 18.5363 5.29239C18.6483 5.57239 18.7043 5.82039 18.7043 6.03639C18.7043 6.33239 18.6163 6.66039 18.4403 7.02039C18.2723 7.38039 18.0243 7.72439 17.6963 8.05239C17.3683 8.38039 16.9643 8.65239 16.4843 8.86839C16.0123 9.07639 15.4763 9.18039 14.8763 9.18039ZM15.7043 7.51239C16.1763 7.51239 16.5963 7.38839 16.9643 7.14039C17.3323 6.89239 17.6443 6.51639 17.9003 6.01239C17.6363 5.50039 17.3203 5.12439 16.9523 4.88439C16.5843 4.63639 16.1683 4.51239 15.7043 4.51239C15.3523 4.51239 15.0443 4.57239 14.7803 4.69239C14.5243 4.81239 14.3283 4.98839 14.1923 5.22039C14.0563 5.44439 13.9883 5.70839 13.9883 6.01239C13.9883 6.30839 14.0563 6.57239 14.1923 6.80439C14.3283 7.02839 14.5243 7.20439 14.7803 7.33239C15.0363 7.45239 15.3443 7.51239 15.7043 7.51239ZM25.61 10.0924C24.778 10.0924 24.034 9.94039 23.378 9.63639C22.73 9.33239 22.218 8.90839 21.842 8.36439C21.466 7.81239 21.278 7.17239 21.278 6.44439C21.278 5.73239 21.458 5.10839 21.818 4.57239C22.178 4.02839 22.67 3.60439 23.294 3.30039C23.926 2.99639 24.638 2.84439 25.43 2.84439C26.254 2.84439 26.954 3.02439 27.53 3.38439C28.114 3.73639 28.562 4.23639 28.874 4.88439C29.194 5.53239 29.354 6.29639 29.354 7.17639H23.258V5.70039H27.974L27.17 6.21639C27.138 5.86439 27.05 5.56839 26.906 5.32839C26.762 5.08039 26.57 4.89239 26.33 4.76439C26.098 4.63639 25.818 4.57239 25.49 4.57239C25.13 4.57239 24.822 4.64439 24.566 4.78839C24.31 4.93239 24.11 5.13239 23.966 5.38839C23.822 5.63639 23.75 5.92839 23.75 6.26439C23.75 6.69639 23.846 7.06439 24.038 7.36839C24.238 7.66439 24.526 7.89239 24.902 8.05239C25.286 8.21239 25.754 8.29239 26.306 8.29239C26.81 8.29239 27.31 8.22839 27.806 8.10039C28.31 7.96439 28.766 7.77639 29.174 7.53639V9.09639C28.702 9.41639 28.162 9.66439 27.554 9.84039C26.954 10.0084 26.306 10.0924 25.61 10.0924ZM30.0433 3.04839H32.5033L32.9473 5.78439V9.90039H30.4993V5.41239L30.0433 3.04839ZM35.4673 2.84439C36.1233 2.84439 36.6833 2.97639 37.1473 3.24039C37.6113 3.50439 37.9633 3.87639 38.2033 4.35639C38.4513 4.83639 38.5753 5.40439 38.5753 6.06039V9.90039H36.1273V6.42039C36.1273 5.90839 35.9953 5.51639 35.7313 5.24439C35.4753 4.97239 35.1033 4.83639 34.6153 4.83639C34.2793 4.83639 33.9833 4.90839 33.7273 5.05239C33.4793 5.19639 33.2873 5.40039 33.1513 5.66439C33.0153 5.92839 32.9473 6.24039 32.9473 6.60039L32.1913 6.20439C32.2873 5.47639 32.4913 4.86439 32.8033 4.36839C33.1153 3.86439 33.4993 3.48439 33.9553 3.22839C34.4113 2.97239 34.9153 2.84439 35.4673 2.84439ZM39.1306 4.86039V3.79239L40.5226 3.22839L41.5786 1.20039H42.9706V3.04839H45.8506V4.86039H42.9706V6.87639C42.9706 7.37239 43.0706 7.72039 43.2706 7.92039C43.4706 8.12039 43.8346 8.22039 44.3626 8.22039C44.6986 8.22039 44.9946 8.19239 45.2506 8.13639C45.5146 8.07239 45.7546 7.99239 45.9706 7.89639V9.74439C45.7306 9.83239 45.4146 9.91239 45.0226 9.98439C44.6306 10.0564 44.2266 10.0924 43.8106 10.0924C43.0506 10.0924 42.4266 9.97639 41.9386 9.74439C41.4586 9.51239 41.1026 9.18039 40.8706 8.74839C40.6386 8.30839 40.5226 7.79639 40.5226 7.21239V4.86039H39.1306ZM46.5804 6.94839H49.1124C49.1524 7.19639 49.2684 7.41239 49.4604 7.59639C49.6524 7.78039 49.9084 7.92439 50.2284 8.02839C50.5564 8.12439 50.9404 8.17239 51.3804 8.17239C51.9884 8.17239 52.4684 8.09639 52.8204 7.94439C53.1724 7.78439 53.3484 7.55239 53.3484 7.24839C53.3484 7.01639 53.2484 6.83639 53.0484 6.70839C52.8484 6.58039 52.4644 6.48839 51.8964 6.43239L50.2164 6.27639C48.9764 6.16439 48.0764 5.88439 47.5164 5.43639C46.9564 4.98039 46.6764 4.36839 46.6764 3.60039C46.6764 2.97639 46.8564 2.44839 47.2164 2.01639C47.5844 1.58439 48.0964 1.26039 48.7524 1.04439C49.4164 0.82039 50.1884 0.70839 51.0684 0.70839C51.9324 0.70839 52.7004 0.83239 53.3724 1.08039C54.0444 1.32039 54.5764 1.66439 54.9684 2.11239C55.3684 2.56039 55.5844 3.08039 55.6164 3.67239H53.0964C53.0644 3.45639 52.9604 3.27239 52.7844 3.12039C52.6164 2.96039 52.3844 2.84039 52.0884 2.76039C51.7924 2.67239 51.4364 2.62839 51.0204 2.62839C50.4604 2.62839 50.0164 2.70439 49.6884 2.85639C49.3604 3.00039 49.1964 3.21639 49.1964 3.50439C49.1964 3.71239 49.2924 3.88039 49.4844 4.00839C49.6844 4.13639 50.0404 4.22439 50.5524 4.27239L52.3404 4.45239C53.1964 4.53239 53.8804 4.67239 54.3924 4.87239C54.9044 5.06439 55.2764 5.33239 55.5084 5.67639C55.7404 6.02039 55.8564 6.44839 55.8564 6.96039C55.8564 7.59239 55.6684 8.14439 55.2924 8.61639C54.9164 9.08039 54.3884 9.44439 53.7084 9.70839C53.0284 9.96439 52.2364 10.0924 51.3324 10.0924C50.4044 10.0924 49.5844 9.96439 48.8724 9.70839C48.1684 9.44439 47.6164 9.07639 47.2164 8.60439C46.8164 8.12439 46.6044 7.57239 46.5804 6.94839ZM56.8868 2.94039L58.1228 3.18039L59.3468 2.94039V9.90039H56.8868V2.94039ZM58.1108 2.37639C57.6868 2.37639 57.3428 2.27239 57.0788 2.06439C56.8148 1.84839 56.6828 1.55639 56.6828 1.18839C56.6828 0.82839 56.8148 0.54039 57.0788 0.32439C57.3428 0.10839 57.6868 0.000390053 58.1108 0.000390053C58.5508 0.000390053 58.8988 0.10839 59.1548 0.32439C59.4188 0.54039 59.5508 0.82839 59.5508 1.18839C59.5508 1.55639 59.4188 1.84839 59.1548 2.06439C58.8988 2.27239 58.5508 2.37639 58.1108 2.37639ZM66.8874 9.90039L66.5754 7.42839L66.8994 6.48039L66.5754 5.53239L66.8874 3.04839H69.4314L68.9994 6.46839L69.4314 9.90039H66.8874ZM67.4634 6.48039C67.3514 7.20039 67.1274 7.83239 66.7914 8.37639C66.4634 8.92039 66.0434 9.34439 65.5314 9.64839C65.0274 9.94439 64.4514 10.0924 63.8034 10.0924C63.1314 10.0924 62.5394 9.94439 62.0274 9.64839C61.5234 9.34439 61.1274 8.92039 60.8394 8.37639C60.5514 7.82439 60.4074 7.19239 60.4074 6.48039C60.4074 5.75239 60.5514 5.11639 60.8394 4.57239C61.1274 4.02839 61.5234 3.60439 62.0274 3.30039C62.5394 2.99639 63.1314 2.84439 63.8034 2.84439C64.4514 2.84439 65.0274 2.99639 65.5314 3.30039C66.0434 3.59639 66.4674 4.01639 66.8034 4.56039C67.1394 5.09639 67.3594 5.73639 67.4634 6.48039ZM62.8914 6.48039C62.8914 6.81639 62.9594 7.11639 63.0954 7.38039C63.2394 7.64439 63.4354 7.85239 63.6834 8.00439C63.9314 8.14839 64.2154 8.22039 64.5354 8.22039C64.8714 8.22039 65.1874 8.14839 65.4834 8.00439C65.7794 7.85239 66.0394 7.64439 66.2634 7.38039C66.4874 7.11639 66.6554 6.81639 66.7674 6.48039C66.6554 6.13639 66.4874 5.83239 66.2634 5.56839C66.0394 5.30439 65.7794 5.09639 65.4834 4.94439C65.1874 4.79239 64.8714 4.71639 64.5354 4.71639C64.2154 4.71639 63.9314 4.79239 63.6834 4.94439C63.4354 5.09639 63.2394 5.30439 63.0954 5.56839C62.9594 5.83239 62.8914 6.13639 62.8914 6.48039ZM70.2855 3.04839H72.7455L73.1895 5.78439V9.90039H70.7415V5.41239L70.2855 3.04839ZM75.5535 2.84439C76.1855 2.84439 76.7215 2.97639 77.1615 3.24039C77.6015 3.50439 77.9375 3.87639 78.1695 4.35639C78.4015 4.83639 78.5175 5.40439 78.5175 6.06039V9.90039H76.0695V6.42039C76.0695 5.90839 75.9535 5.51639 75.7215 5.24439C75.4895 4.97239 75.1535 4.83639 74.7135 4.83639C74.4015 4.83639 74.1295 4.90839 73.8975 5.05239C73.6735 5.19639 73.4975 5.40039 73.3695 5.66439C73.2495 5.92839 73.1895 6.24039 73.1895 6.60039L72.4335 6.20439C72.5295 5.47639 72.7255 4.86439 73.0215 4.36839C73.3175 3.86439 73.6815 3.48439 74.1135 3.22839C74.5535 2.97239 75.0335 2.84439 75.5535 2.84439ZM80.8695 2.84439C81.5015 2.84439 82.0375 2.97639 82.4775 3.24039C82.9255 3.50439 83.2655 3.87639 83.4975 4.35639C83.7295 4.83639 83.8455 5.40439 83.8455 6.06039V9.90039H81.3975V6.42039C81.3975 5.90839 81.2815 5.51639 81.0495 5.24439C80.8175 4.97239 80.4815 4.83639 80.0415 4.83639C79.7295 4.83639 79.4575 4.90839 79.2255 5.05239C79.0015 5.19639 78.8255 5.40039 78.6975 5.66439C78.5775 5.92839 78.5175 6.24039 78.5175 6.60039L77.7615 6.20439C77.8575 5.47639 78.0495 4.86439 78.3375 4.36839C78.6335 3.86439 79.0015 3.48439 79.4415 3.22839C79.8815 2.97239 80.3575 2.84439 80.8695 2.84439Z";

export const alt = `${LOTUS_HOUSE.title}, a private townhouse in Chiang Mai, book direct`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The hero, as a data URI.
 *
 * Satori cannot resolve a Next static import or a relative path, so the bytes have to be
 * inlined. Read from src/photos rather than a hardcoded filename so that re-rating the
 * gallery moves this card with it -- heroPhoto() returns whatever the manifest currently
 * leads with.
 */
/**
 * Which frame the card leads with, in order of preference, falling back to whatever the
 * manifest currently rates first. Change the fragment, not the layout, to change the card.
 *
 * Today the list is empty, so the card uses the gallery hero. That is the terrace at
 * sunset, which is the strongest image in the set and also the one open question: it shows
 * a man in the tub and a beer on the table. Fine as the ninth photo in a gallery someone
 * chose to open; a different proposition as the auto-preview that appears unbidden in a
 * LINE group. Paul's call, and it is one line here.
 */
const CARD_PHOTO_PREFERENCE: string[] = [];

async function heroDataUri(): Promise<string | undefined> {
  const hero =
    CARD_PHOTO_PREFERENCE.map((fragment) => pickPhoto(LOTUS_HOUSE.slug, fragment)).find(
      Boolean,
    ) ?? heroPhoto(LOTUS_HOUSE.slug);
  if (!hero) return undefined;
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "src/photos", LOTUS_HOUSE.slug, hero.file),
    );
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    // A missing file must not fail the build. Falls back to the flat brand panel below,
    // which is the same treatment the gallery uses when a photo set is empty.
    return undefined;
  }
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });

  const photo = await heroDataUri();
  const area = propertyArea(LOTUS_HOUSE);
  const place = [area?.name, "Chiang Mai"].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: photo ? INK : PRIMARY,
        }}
      >
        {photo ? (
          <img
            src={photo}
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
            alt=""
          />
        ) : null}

        {/* Scrim. Without it the wordmark and the title sit on whatever the photo happens
            to be doing at that corner, which at sunset is a bright sky. */}
        <div
          style={{
            // Explicit box rather than `inset: 0`: Satori does not implement the shorthand,
            // so the scrim collapsed to zero size and rendered nothing at all. The output
            // PNG was byte-identical with and without it, which is how this was caught.
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            // backgroundImage, not the `background` shorthand: Satori ignores a gradient
            // passed through the shorthand and renders nothing, silently. The first cut of
            // this card did exactly that and the white title sat on a pale wooden floor.
            backgroundImage:
              "linear-gradient(to bottom, rgba(20,20,28,0.46) 0%, rgba(20,20,28,0.03) 26%, rgba(20,20,28,0.06) 52%, rgba(20,20,28,0.62) 82%, rgba(20,20,28,0.93) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px 0 72px",
          }}
        >
          <svg width="296" height="46" viewBox="0 0 84 13" fill="none">
            <path d={WORDMARK} fill="#ffffff" />
          </svg>

          <div style={{ display: "flex", flexDirection: "column", paddingBottom: 56 }}>
            <div
              style={{
                fontSize: 30,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.82)",
              }}
            >
              {place}
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 82,
                lineHeight: 1.05,
                fontWeight: 700,
                color: "#ffffff",
                maxWidth: 940,
              }}
            >
              {LOTUS_HOUSE.title}
            </div>
          </div>
        </div>

        {/* Same three-accent rule as the site-wide card, so the two read as one family. */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            display: "flex",
            height: 12,
            width: "100%",
          }}
        >
          <div style={{ flex: 1, background: PRIMARY }} />
          <div style={{ flex: 1, background: SECONDARY }} />
          <div style={{ flex: 1, background: TEAL }} />
        </div>
      </div>
    ),
    size,
  );
}
