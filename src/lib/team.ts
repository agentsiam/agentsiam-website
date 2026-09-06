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

import type { Dictionary } from "@/i18n";

export type TeamMember = {
  /** Fragment of the filename in src/photos/team/. */
  match: string;
  name: string;
  /**
   * Dictionary key for the job title, not the title itself. The four roles were English
   * literals here and rendered as English under Thai and Chinese portraits; typing the
   * field as a key of Dictionary means a role that is not translated is a compile error.
   */
  role: keyof Dictionary;
};

export const TEAM: TeamMember[] = [
  { match: "Paul_b", name: "Paul", role: "hwRoleFounder" },
  { match: "Nils_m", name: "Nils", role: "hwRoleFounder" },
  { match: "Patthanapong_p", name: "Patthanapong", role: "hwRoleAppraisal" },
  { match: "Phakkaya_jen_k", name: "Jen", role: "hwRoleDigital" },
  { match: "thicha_maseng", name: "Thicha", role: "hwRoleCoordination" },
];
