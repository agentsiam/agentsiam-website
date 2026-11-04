import Image from "next/image";
import type { Dictionary } from "@/i18n";
import { pickPhoto } from "@/lib/photos";
import { TEAM } from "@/lib/team";

/**
 * The people, on the page that claims there are people.
 *
 * `/how-it-works` argues "we live here", "we visit the properties", "someone local reads
 * the message at 11pm". Every one of those is a claim about a person, and until this block
 * existed the page made them all without showing anyone.
 *
 * Square crops rather than a 16:9 band, because that is the shape the portraits are shot in
 * (1024px square) and cropping a head-and-shoulders portrait to landscape either cuts the
 * head off or leaves it swimming. If landscape portraits ever arrive, revisit this.
 *
 * The grid goes to five across only at lg: five 1:1 tiles need about a thousand pixels
 * before each one is big enough to read a face in. Five columns rather than the four of the
 * value-prop block above it, because there are five people; the treatment is the same, the
 * count is not.
 *
 * Restyled 04/11/2026, Paul's direction, to the measurements of the "a real co-host" block on
 * Lodgify's home page, which the value props above already use: heading 40px/700 uppercase at
 * line-height 1.2, centred and capped at 816px; a 20px grid gap; each tile a square panel at
 * radius 24px above a 20px heading and a 14px line at 1.5 and -0.014em. Their panels hold an
 * illustration floating on a gradient; ours hold a photograph, so the photograph fills the
 * panel and the gradient is only what shows if one ever fails to load.
 *
 * Renders nothing when src/photos/team/ is empty, so the page stays whole either way.
 *
 * `member.role` is a dictionary key rather than a job title, so the row is resolved against
 * the caller's locale here instead of shipping four English titles to every reader.
 */
export function TeamRow({ t, heading }: { t: Dictionary; heading: string }) {
  const members = TEAM.map((member) => ({
    ...member,
    photo: pickPhoto("team", member.match),
  })).filter((member) => member.photo);

  if (members.length === 0) return null;

  return (
    <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
      <h2 className="mx-auto max-w-[816px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase">
        {heading}
      </h2>
      <ul className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {members.map((member) => (
          <li key={member.match}>
            <div className="grad-sand relative aspect-square overflow-hidden rounded-[24px]">
              <Image
                src={member.photo!.src}
                alt={member.photo!.alt}
                lang="en"
                placeholder="blur"
                fill
                sizes="(min-width: 1024px) 200px, (min-width: 640px) 320px, 45vw"
                className="object-cover"
              />
            </div>
            <p className="mt-5 font-display text-[20px] leading-[1.2] font-semibold">
              {member.name}
            </p>
            <p className="mt-2.5 text-[14px] leading-[1.5] tracking-[-0.014em] text-muted">
              {t[member.role]}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
