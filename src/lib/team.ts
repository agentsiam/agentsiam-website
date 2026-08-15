/**
 * Who works at AgentSiam.
 *
 * Name and role live here rather than being parsed out of the filename: a filename is a
 * place to put a file, not a place to store someone's job title, and "Phakkaya_jen_k__
 * portrait_as_Digital_&_Creative_Consultant" is not a string anyone should be splitting on.
 *
 * `match` is any fragment of the photo's path inside src/photos/team/. Someone whose photo
 * has not been supplied yet simply does not render -- the row shows whoever has one.
 */

export type TeamMember = {
  /** Fragment of the filename in src/photos/team/. */
  match: string;
  name: string;
  role: string;
};

export const TEAM: TeamMember[] = [
  { match: "Paul_b", name: "Paul", role: "Co-founder" },
  { match: "Nils_m", name: "Nils", role: "Co-founder" },
  { match: "Patthanapong_p", name: "Patthanapong", role: "Appraisal & real estate" },
  { match: "Phakkaya_jen_k", name: "Jen", role: "Digital & creative" },
  { match: "thicha_maseng", name: "Thicha", role: "Project coordination" },
];
