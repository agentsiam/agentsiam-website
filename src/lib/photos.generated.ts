// GENERATED FILE -- do not edit by hand.
// Written by scripts/build-photo-manifest.mjs, which runs automatically before
// `npm run dev` and `npm run build`. To regenerate on demand: `npm run photos`.
//
// Add or change photos in src/photos/<set>/. Captions come from the file's
// own metadata, so edit the Description in Photos.app rather than editing this file.

import type { StaticImageData } from "next/image";

import lotushouse_0 from "@/photos/lotushouse/Terrace/IMG_4991_editedfinal.jpg";
import lotushouse_1 from "@/photos/lotushouse/Bed - 1st Floor/IMG_5578_edited.jpg";
import lotushouse_2 from "@/photos/lotushouse/Bed - 2nd Floor/IMG_5687_edited.jpg";
import lotushouse_3 from "@/photos/lotushouse/Kitchen/IMG_5724_edited.jpg";
import lotushouse_4 from "@/photos/lotushouse/Living Room/20240411_052358_edited.jpg";
import lotushouse_5 from "@/photos/lotushouse/Bed - 1st Floor/IMG_5582_edited.jpg";
import lotushouse_6 from "@/photos/lotushouse/Bed - 2nd Floor/IMG_5689_edited.jpg";
import lotushouse_7 from "@/photos/lotushouse/Exterior/lotus_exterior_1.jpg";
import lotushouse_8 from "@/photos/lotushouse/Kitchen/20240412_035206_edited.jpg";
import lotushouse_9 from "@/photos/lotushouse/Living Room/20240411_051748_edited.jpg";
import lotushouse_10 from "@/photos/lotushouse/Living Room/IMG_5525_edited.jpg";
import lotushouse_11 from "@/photos/lotushouse/Terrace/20250413_100343 (2).jpg";
import lotushouse_12 from "@/photos/lotushouse/Terrace/IMG_4982_edited.jpg";
import lotushouse_13 from "@/photos/lotushouse/Terrace/IMG_5359_edited.jpg";
import lotushouse_14 from "@/photos/lotushouse/Terrace/lotus_patio_2.jpg";
import lotushouse_15 from "@/photos/lotushouse/Bed - 1st Floor/20240411_043128_edited.jpg";
import lotushouse_16 from "@/photos/lotushouse/Bed - 1st Floor/20240411_074844_edited.jpg";
import lotushouse_17 from "@/photos/lotushouse/Bed - 1st Floor/20240411_075316_edited.jpg";
import lotushouse_18 from "@/photos/lotushouse/Bed - 1st Floor/IMG_5445_edited.jpg";
import lotushouse_19 from "@/photos/lotushouse/Bed - 1st Floor/lotus_bedroom2_4.jpg";
import lotushouse_20 from "@/photos/lotushouse/Bed - 2nd Floor/20240410_175659_edited.jpg";
import lotushouse_21 from "@/photos/lotushouse/Bed - 2nd Floor/20240411_083357_edited.jpg";
import lotushouse_22 from "@/photos/lotushouse/Bed - 2nd Floor/20240411_085747_edited.jpg";
import lotushouse_23 from "@/photos/lotushouse/Bed - 2nd Floor/20240411_090809_edited.jpg";
import lotushouse_24 from "@/photos/lotushouse/Bed - 2nd Floor/20240411_091214_edited.jpg";
import lotushouse_25 from "@/photos/lotushouse/Bed - 2nd Floor/IMG_5651_edited.jpg";
import lotushouse_26 from "@/photos/lotushouse/Bed - 2nd Floor/IMG_5659_edited.jpg";
import lotushouse_27 from "@/photos/lotushouse/Exterior/20240402_052729_edited.jpg";
import lotushouse_28 from "@/photos/lotushouse/Exterior/20240402_053731_edited.jpg";
import lotushouse_29 from "@/photos/lotushouse/Exterior/20240402_053738_edited_resized.jpg";
import lotushouse_30 from "@/photos/lotushouse/Exterior/mainstree_exterior_lotushouse.jpg";
import lotushouse_31 from "@/photos/lotushouse/Exterior/Parking House.jpg";
import lotushouse_32 from "@/photos/lotushouse/Exterior/Parking zone Street.jpg";
import lotushouse_33 from "@/photos/lotushouse/Kitchen/20240412_040311_edited.jpg";
import lotushouse_34 from "@/photos/lotushouse/Living Room/20240405_162330_edited.jpg";
import lotushouse_35 from "@/photos/lotushouse/Living Room/20240411_045027_edited.jpg";
import lotushouse_36 from "@/photos/lotushouse/Living Room/20240411_052817_edited.jpg";
import lotushouse_37 from "@/photos/lotushouse/Living Room/20240411_053018_edited.jpg";
import lotushouse_38 from "@/photos/lotushouse/Terrace/891b0e74-8666-4bef-8723-685261955329.jpg";
import lotushouse_39 from "@/photos/lotushouse/Bed - 1st Floor/20240411_044832_edited.jpg";
import lotushouse_40 from "@/photos/lotushouse/Bed - 2nd Floor/20240411_091311_edited.jpg";
import lotushouse_41 from "@/photos/lotushouse/Floor Plan/Lotus House Layout Fl-1.jpg";
import lotushouse_42 from "@/photos/lotushouse/Floor Plan/Lotus House Layout Fl-2.jpg";
import lotushouse_43 from "@/photos/lotushouse/Floor Plan/Lotus House Layout Fl-3.jpg";
import lotushouse_44 from "@/photos/lotushouse/Kitchen/kitchen_with_people.jpg";
import lotushouse_45 from "@/photos/lotushouse/Terrace/asian_couple_terrace_sunset_3900px.jpg";
import lotushouse_46 from "@/photos/lotushouse/Terrace/Gemini_Generated_Image_m2gl4om2gl4om2gl.jpg";
import lotushouse_47 from "@/photos/lotushouse/Terrace/terrace_people.jpg";
import lotushouse_48 from "@/photos/lotushouse/Terrace/two_men_terrace_sunset_1280.jpg";
import team_0 from "@/photos/team/Nils_m_portrait_as_Co-founder.jpeg";
import team_1 from "@/photos/team/Paul_b__portrait_as_Co-founder.jpg";
import team_2 from "@/photos/team/Patthanapong_p_portrait_Appraisal_&_RealEstate_Specialist_as.jpg";
import team_3 from "@/photos/team/Phakkaya_jen_k__portrait_as_Digital_&_Creative_Consultant.jpg";
import team_4 from "@/photos/team/thicha_maseng_portrait_as_Project_Coordinator.jpg";

export type Photo = {
  src: StaticImageData;
  /** Path inside the set, e.g. "Terrace/IMG_4991.jpg". Used to pick one out. */
  file: string;
  /** From the photo's own Description field. Empty when the photographer left it blank. */
  alt: string;
  /** The subfolder it came from, e.g. "Terrace". Groups the lightbox. */
  room?: string;
  title?: string;
};

/** Keyed by set name -- the folder under src/photos. An empty set is simply absent. */
export const PHOTOS: Record<string, Photo[]> = {
  "lotushouse": [
    { src: lotushouse_0, file: "Terrace/IMG_4991_editedfinal.jpg", alt: "The soaking tub and a wicker lounger on the roof terrace at sunset", room: "Terrace" },
    { src: lotushouse_1, file: "Bed - 1st Floor/IMG_5578_edited.jpg", alt: "King bed in the first-floor bedroom, under a framed bonsai painting, with tree-stump bedside tables", room: "Bed - 1st Floor" },
    { src: lotushouse_2, file: "Bed - 2nd Floor/IMG_5687_edited.jpg", alt: "King bed in the second-floor bedroom, under a framed Thai silk panel between two brass wall lights", room: "Bed - 2nd Floor" },
    { src: lotushouse_3, file: "Kitchen/IMG_5724_edited.jpg", alt: "The kitchen from the entry hall, with the island and stools, the arched door to the yard and the stairs on the right", room: "Kitchen" },
    { src: lotushouse_4, file: "Living Room/20240411_052358_edited.jpg", alt: "Living room with a navy sofa and horseshoe armchair, opening onto the balcony through full-height windows", room: "Living Room" },
    { src: lotushouse_5, file: "Bed - 1st Floor/IMG_5582_edited.jpg", alt: "The first-floor bedroom seen across the desk, with the king bed and white coffered ceiling behind", room: "Bed - 1st Floor" },
    { src: lotushouse_6, file: "Bed - 2nd Floor/IMG_5689_edited.jpg", alt: "The second-floor bedroom, with the bed, towel ladder and the desk by the window", room: "Bed - 2nd Floor" },
    { src: lotushouse_7, file: "Exterior/lotus_exterior_1.jpg", alt: "The front of Lotus House from the carport, with the balcony above and the LOTUS HOUSE sign", room: "Exterior" },
    { src: lotushouse_8, file: "Kitchen/20240412_035206_edited.jpg", alt: "Entry hall with a gallery wall of framed prints, floating shelves and a shoe bench", room: "Kitchen" },
    { src: lotushouse_9, file: "Living Room/20240411_051748_edited.jpg", alt: "The living room with the navy sofa, coffee table and the staircase up to the terrace", room: "Living Room" },
    { src: lotushouse_10, file: "Living Room/IMG_5525_edited.jpg", alt: "Dining table and chairs beside the television and armchair in the living room", room: "Living Room" },
    { src: lotushouse_11, file: "Terrace/20250413_100343 (2).jpg", alt: "Outdoor table and wicker chairs on the roof terrace, under the rain tree", room: "Terrace" },
    { src: lotushouse_12, file: "Terrace/IMG_4982_edited.jpg", alt: "Soaking in the tub on the roof terrace at sunset, with the mountains on the horizon", room: "Terrace" },
    { src: lotushouse_13, file: "Terrace/IMG_5359_edited.jpg", alt: "Yoga on the roof terrace under the shade sail, with the rain tree behind the railing", room: "Terrace" },
    { src: lotushouse_14, file: "Terrace/lotus_patio_2.jpg", alt: "The back terrace, with the soaking tub, outdoor shower and two loungers", room: "Terrace" },
    { src: lotushouse_15, file: "Bed - 1st Floor/20240411_043128_edited.jpg", alt: "Vanity in the first-floor bathroom, with a backlit mirror cabinet above a fluted wood cabinet", room: "Bed - 1st Floor" },
    { src: lotushouse_16, file: "Bed - 1st Floor/20240411_074844_edited.jpg", alt: "Desk in the first-floor bedroom, with sliding doors onto the cactus planter in the back yard", room: "Bed - 1st Floor" },
    { src: lotushouse_17, file: "Bed - 1st Floor/20240411_075316_edited.jpg", alt: "Open clothes rail and oval mirror in the first-floor bedroom, beside the bathroom door", room: "Bed - 1st Floor" },
    { src: lotushouse_18, file: "Bed - 1st Floor/IMG_5445_edited.jpg", alt: "The first-floor bathroom, with the open shower area beside the vanity and toilet", room: "Bed - 1st Floor" },
    { src: lotushouse_19, file: "Bed - 1st Floor/lotus_bedroom2_4.jpg", alt: "Shower in the first-floor bathroom, with a rain head, hand shower and instant water heater", room: "Bed - 1st Floor" },
    { src: lotushouse_20, file: "Bed - 2nd Floor/20240410_175659_edited.jpg", alt: "Washing machine built in under the vanity in the second-floor bathroom", room: "Bed - 2nd Floor" },
    { src: lotushouse_21, file: "Bed - 2nd Floor/20240411_083357_edited.jpg", alt: "Clothes rail and oval mirror in the second-floor bedroom, looking towards the bed", room: "Bed - 2nd Floor" },
    { src: lotushouse_22, file: "Bed - 2nd Floor/20240411_085747_edited.jpg", alt: "Rain shower and hand shower in the second-floor bathroom, with towels on the rail", room: "Bed - 2nd Floor" },
    { src: lotushouse_23, file: "Bed - 2nd Floor/20240411_090809_edited.jpg", alt: "Basin and backlit mirror in the second-floor bathroom, with the washing machine below the counter", room: "Bed - 2nd Floor" },
    { src: lotushouse_24, file: "Bed - 2nd Floor/20240411_091214_edited.jpg", alt: "The second-floor bathroom, with the vanity and washing machine on the left and the shower beyond", room: "Bed - 2nd Floor" },
    { src: lotushouse_25, file: "Bed - 2nd Floor/IMG_5651_edited.jpg", alt: "Desk under the window in the second-floor bedroom", room: "Bed - 2nd Floor" },
    { src: lotushouse_26, file: "Bed - 2nd Floor/IMG_5659_edited.jpg", alt: "Desk and lamp in the second-floor bedroom, under a framed botanical print", room: "Bed - 2nd Floor" },
    { src: lotushouse_27, file: "Exterior/20240402_052729_edited.jpg", alt: "The lane outside the house, looking along the soi towards the trees", room: "Exterior" },
    { src: lotushouse_28, file: "Exterior/20240402_053731_edited.jpg", alt: "The gated carport at number 42, with the arched front door behind", room: "Exterior" },
    { src: lotushouse_29, file: "Exterior/20240402_053738_edited_resized.jpg", alt: "A car parked in the covered carport, with the front door and window to the right", room: "Exterior" },
    { src: lotushouse_30, file: "Exterior/mainstree_exterior_lotushouse.jpg", alt: "The street the house sits on, with neighbouring townhouses along it", room: "Exterior" },
    { src: lotushouse_31, file: "Exterior/Parking House.jpg", alt: "The carport gate open at number 42, with the car parked inside", room: "Exterior" },
    { src: lotushouse_32, file: "Exterior/Parking zone Street.jpg", alt: "The lane outside, with off-street parking beside the house", room: "Exterior" },
    { src: lotushouse_33, file: "Kitchen/20240412_040311_edited.jpg", alt: "Open shelf under the kitchen island, stacked with crockery and pans below the induction hob", room: "Kitchen" },
    { src: lotushouse_34, file: "Living Room/20240405_162330_edited.jpg", alt: "Wine and snacks on the glass coffee table in front of the navy sofa", room: "Living Room" },
    { src: lotushouse_35, file: "Living Room/20240411_045027_edited.jpg", alt: "The black steel staircase, with afternoon light falling across the wall", room: "Living Room" },
    { src: lotushouse_36, file: "Living Room/20240411_052817_edited.jpg", alt: "Sideboard in the living room, with a vase and carved wood pieces on top", room: "Living Room" },
    { src: lotushouse_37, file: "Living Room/20240411_053018_edited.jpg", alt: "The navy sofa, horseshoe chair and glass coffee table in the living room", room: "Living Room" },
    { src: lotushouse_38, file: "Terrace/891b0e74-8666-4bef-8723-685261955329.jpg", alt: "Sunset over the mountains, seen from the roof terrace", room: "Terrace" },
    { src: lotushouse_39, file: "Bed - 1st Floor/20240411_044832_edited.jpg", alt: "Bidet sprayer beside the toilet in the first-floor bathroom", room: "Bed - 1st Floor" },
    { src: lotushouse_40, file: "Bed - 2nd Floor/20240411_091311_edited.jpg", alt: "Shower gel and shampoo on the rack in the second-floor shower", room: "Bed - 2nd Floor" },
    { src: lotushouse_41, file: "Floor Plan/Lotus House Layout Fl-1.jpg", alt: "First floor plan: garage, kitchen, second bedroom and the back yard", room: "Floor Plan" },
    { src: lotushouse_42, file: "Floor Plan/Lotus House Layout Fl-2.jpg", alt: "Second floor plan: living room and the main bedroom", room: "Floor Plan" },
    { src: lotushouse_43, file: "Floor Plan/Lotus House Layout Fl-3.jpg", alt: "Third floor plan: the front and back roof patios", room: "Floor Plan" },
    { src: lotushouse_44, file: "Kitchen/kitchen_with_people.jpg", alt: "Four people around the kitchen island, with the arched door and the staircase behind", room: "Kitchen" },
    { src: lotushouse_45, file: "Terrace/asian_couple_terrace_sunset_3900px.jpg", alt: "Two people on loungers beside the tub on the roof terrace at sunset", room: "Terrace" },
    { src: lotushouse_46, file: "Terrace/Gemini_Generated_Image_m2gl4om2gl4om2gl.jpg", alt: "The soaking tub and loungers on the roof terrace at sunset", room: "Terrace" },
    { src: lotushouse_47, file: "Terrace/terrace_people.jpg", alt: "Four people on the roof terrace at sunset, one of them in the tub", room: "Terrace" },
    { src: lotushouse_48, file: "Terrace/two_men_terrace_sunset_1280.jpg", alt: "Two men on the roof terrace at sunset, one on a lounger beside the tub", room: "Terrace" },
  ],
  "team": [
    { src: team_0, file: "Nils_m_portrait_as_Co-founder.jpeg", alt: "Nils, co-founder of AgentSiam" },
    { src: team_1, file: "Paul_b__portrait_as_Co-founder.jpg", alt: "Paul, co-founder of AgentSiam" },
    { src: team_2, file: "Patthanapong_p_portrait_Appraisal_&_RealEstate_Specialist_as.jpg", alt: "Patthanapong, appraisal and real estate specialist at AgentSiam" },
    { src: team_3, file: "Phakkaya_jen_k__portrait_as_Digital_&_Creative_Consultant.jpg", alt: "Jen, digital and creative consultant at AgentSiam" },
    { src: team_4, file: "thicha_maseng_portrait_as_Project_Coordinator.jpg", alt: "Thicha, project coordinator at AgentSiam" },
  ],
};
