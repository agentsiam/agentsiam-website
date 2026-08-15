import Image from "next/image";
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
 * before each one is big enough to read a face in.
 *
 * Renders nothing when src/photos/team/ is empty, so the page stays whole either way.
 */
export function TeamRow({ heading }: { heading: string }) {
  const members = TEAM.map((member) => ({
    ...member,
    photo: pickPhoto("team", member.match),
  })).filter((member) => member.photo);

  if (members.length === 0) return null;

  return (
    <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
      <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{heading}</h2>
      <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
        {members.map((member) => (
          <li key={member.match}>
            <div className="relative aspect-square overflow-hidden rounded-panel bg-surface">
              <Image
                src={member.photo!.src}
                alt={member.photo!.alt}
                placeholder="blur"
                fill
                sizes="(min-width: 1024px) 200px, (min-width: 640px) 320px, 45vw"
                className="object-cover"
              />
            </div>
            <p className="mt-3 font-display text-[17px] font-bold tracking-[-0.015em]">
              {member.name}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted">{member.role}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
