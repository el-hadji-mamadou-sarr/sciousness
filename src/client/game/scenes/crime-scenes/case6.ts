import { Case, CrimeSceneObject, Clue, Suspect, DialogueOption } from '../../../../shared/types/game';

// Case 6: Cherry Blossom Secrets (Thursday)
// An art gallery curator dies at their most controversial exhibit opening

// Crime Scene Objects
export const case6Objects: CrimeSceneObject[] = [
  {
    id: 'obj_altar',
    name: 'Memory Altar',
    x: 30,
    y: 25,
    width: 40,
    height: 25,
    description: 'A shrine with childhood photos. Center photo shows victim with two other children, torn.',
    clueId: 'clue_torn_photo',
  },
  {
    id: 'obj_body',
    name: 'Victim',
    x: 55,
    y: 65,
    width: 26,
    height: 22,
    description: 'Natsuki Sato. Died from allergic reaction. EpiPen found nearby, empty.',
  },
  {
    id: 'obj_champagne',
    name: 'Champagne Glass',
    x: 70,
    y: 30,
    width: 12,
    height: 12,
    description: 'Half-drunk. Smells like cherries and almonds.',
    clueId: 'clue_poisoned_drink',
  },
  {
    id: 'obj_letter',
    name: 'Burned Letter',
    x: 85,
    y: 50,
    width: 18,
    height: 14,
    description: 'Partially burned. "I know what you did to Aiko..." signed with cherry blossom stamp.',
    clueId: 'clue_burned_letter',
  },
  {
    id: 'obj_purse',
    name: 'Designer Purse',
    x: 20,
    y: 60,
    width: 20,
    height: 15,
    description: 'Open. Contains prescription for severe nut allergy. And a positive pregnancy test.',
    clueId: 'clue_pregnancy_test',
  },
  {
    id: 'obj_guestbook',
    name: 'Guestbook',
    x: 75,
    y: 75,
    width: 22,
    height: 18,
    description: 'Last signature: "For Aiko" with a cherry blossom drawn beside it.',
    clueId: 'clue_guestbook_message',
  },
  {
    id: 'obj_painting',
    name: 'Controversial Painting',
    x: 40,
    y: 45,
    width: 35,
    height: 20,
    description: '"The Three Blossoms" - depicts three girls. One face has been slashed with red paint.',
    clueId: 'clue_defaced_painting',
  },
  {
    id: 'obj_camera',
    name: 'Security Camera',
    x: 15,
    y: 20,
    width: 15,
    height: 12,
    description: 'Angle shows only the victim\'s back. Someone disabled it for 5 minutes.',
  },
];

// Clues
export const case6Clues: Clue[] = [
  {
    id: 'clue_torn_photo',
    name: 'Torn Childhood Photo',
    description: 'Three girls at cherry blossom festival. Torn through the middle girl. Back reads: "Natsuki, Aiko, Yumi - forever sisters".',
    found: false,
    linkedTo: 'suspect_sister',
  },
  {
    id: 'clue_poisoned_drink',
    name: 'Cherry Pit Extract',
    description: 'The champagne contains cyanide from cherry pits. Same substance found in Yumi\'s art supplies.',
    found: false,
    linkedTo: 'suspect_artist',
  },
  {
    id: 'clue_burned_letter',
    name: 'Blackmail Letter',
    description: 'Threatens to expose a hit-and-run from 15 years ago. Victim was driving. Aiko died.',
    found: false,
    linkedTo: 'suspect_sister',
  },
  {
    id: 'clue_pregnancy_test',
    name: 'Positive Test',
    description: 'Victim was 8 weeks pregnant. Bloodwork shows the father isn\'t her husband.',
    found: false,
    linkedTo: 'suspect_husband',
  },
  {
    id: 'clue_guestbook_message',
    name: '"For Aiko" Message',
    description: 'Handwriting matches Aiko\'s sister. She visits the gallery every year on Aiko\'s death anniversary.',
    found: false,
    linkedTo: 'suspect_sister',
  },
  {
    id: 'clue_defaced_painting',
    name: 'Slashed Painting',
    description: 'Red paint matches Yumi\'s signature pigment. She was painting live during the murder.',
    found: false,
    linkedTo: 'suspect_artist',
  },
  {
    id: 'clue_empty_epipen',
    name: 'Sabotaged EpiPen',
    description: 'Victim\'s emergency EpiPen was drained beforehand. Only her husband knew where she kept it.',
    found: false,
    linkedTo: 'suspect_husband',
  },
  {
    id: 'clue_art_supply',
    name: 'Cyanide in Studio',
    description: 'Yumi uses cherry pit extract in her pigments. But her supply is untouched.',
    found: false,
    linkedTo: 'suspect_artist',
  },
];

// Dialogue

const husbandDialogue: DialogueOption[] = [
  {
    id: 'hus_1',
    text: 'You knew about the pregnancy?',
    response: 'Yes. But the baby wasn\'t mine. We were separating.',
    isSuspicious: true,
  },
  {
    id: 'hus_2',
    text: 'You had access to her EpiPen.',
    response: 'Everyone knew about her allergy. She showed it at parties for attention.',
    isSuspicious: true,
  },
  {
    id: 'hus_3',
    text: 'Who was the father?',
    response: 'Ask Yumi. They were "collaborating" a lot lately.',
    unlocksClue: 'clue_pregnancy_test',
  },
  {
    id: 'hus_4',
    text: 'What happened 15 years ago?',
    response: 'A tragic accident. Natsuki never forgave herself. Some people never let her forget.',
  },
];

const sisterDialogue: DialogueOption[] = [
  {
    id: 'sis_1',
    text: 'You lost a sister too.',
    response: 'Aiko was my twin. Natsuki took her from me. Then became famous with her story.',
    isSuspicious: true,
  },
  {
    id: 'sis_2',
    text: 'You wrote "For Aiko" in the guestbook.',
    response: 'I come every year. To remind Natsuki what she did. This year was the anniversary.',
    isSuspicious: true,
  },
  {
    id: 'sis_3',
    text: 'You were blackmailing her.',
    response: 'I wanted the truth to come out. The exhibit was built on my sister\'s bones.',
    unlocksClue: 'clue_burned_letter',
  },
  {
    id: 'sis_4',
    text: 'Did you poison her drink?',
    response: 'I wanted her exposed, not dead. Now she dies a martyr instead of a murderer.',
  },
];

const artistDialogue: DialogueOption[] = [
  {
    id: 'art_1',
    text: 'You and Natsuki were close.',
    response: 'We were everything. Then she married for money. I was her dirty secret.',
    isSuspicious: true,
  },
  {
    id: 'art_2',
    text: 'The baby was yours.',
    response: 'She was leaving him for me. The exhibit was our fresh start.',
    isSuspicious: true,
  },
  {
    id: 'art_3',
    text: 'Your paint matches the slashed canvas.',
    response: 'I was angry. She kept delaying our plans. I painted my frustration.',
    isSuspicious: true,
  },
  {
    id: 'art_4',
    text: 'You work with cherry pit extract.',
    response: 'For my pigments. But mine is locked. Someone took it.',
    unlocksClue: 'clue_art_supply',
  },
];

const rivalDialogue: DialogueOption[] = [
  {
    id: 'riv_1',
    text: 'You wanted her gallery.',
    response: 'She stole my concept. My life\'s work. I just wanted what was mine.',
  },
  {
    id: 'riv_2',
    text: 'You argued before she died.',
    response: 'I told her she was a fraud. Living off a dead girl\'s memory.',
    isSuspicious: true,
  },
  {
    id: 'riv_3',
    text: 'Where were you during the murder?',
    response: 'Getting air. The hypocrisy was suffocating.',
  },
];

// Suspects
export const case6Suspects: Suspect[] = [
  {
    id: 'suspect_victim',
    name: 'Natsuki Sato',
    description: 'Celebrated gallery curator. Built career on tragic personal story.',
    alibi: 'N/A',
    isGuilty: false,
    dialogueOptions: [],
  },
  {
    id: 'suspect_husband',
    name: 'Kenji Tanaka',
    description: 'Wealthy investor. Marriage was business arrangement. Humiliated by affair.',
    alibi: 'Schmoozing donors across room.',
    isGuilty: false,
    dialogueOptions: husbandDialogue,
  },
  {
    id: 'suspect_sister',
    name: 'Emi (Aiko\'s Twin)',
    description: 'Surviving sister of the victim\'s childhood friend. Has haunted victim for years.',
    alibi: 'At bar, drinking alone.',
    isGuilty: false,
    dialogueOptions: sisterDialogue,
  },
  {
    id: 'suspect_artist',
    name: 'Yumi Chen',
    description: 'Brilliant painter. Victim\'s secret lover and collaborator. Pregnant with her child.',
    alibi: 'Painting live on stage.',
    isGuilty: true,
    dialogueOptions: artistDialogue,
  },
  {
    id: 'suspect_rival',
    name: 'Maya Rodriguez',
    description: 'Rival curator. Believes victim stole her exhibition concept.',
    alibi: 'On balcony, witnessed by staff.',
    isGuilty: false,
    dialogueOptions: rivalDialogue,
  },
];

// Case Definition
export const case6: Case = {
  id: 'case_006',
  title: 'Cherry Blossom Secrets',
  dayNumber: 6,
  intro: `Natsuki Sato's exhibit was her masterpiece—a shrine to childhood tragedy that made her famous.

But someone turned the opening into a crime scene.

Allergic reaction. Empty EpiPen. Poisoned champagne.

Three women connected by one death fifteen years ago. One secret that couldn't stay buried.

Who killed the curator at her own altar?`,
  victimName: 'Natsuki Sato',
  victimDescription: 'Gallery curator living in the shadow of a childhood tragedy.',
  location: 'Sato Gallery',
  crimeSceneObjects: case6Objects,
  suspects: case6Suspects,
  clues: case6Clues,
};

// Mobile layout hints
export const case6MobileLayout = {
  minObjectWidth: 50,
  minObjectHeight: 45,
  objectSpacing: 15,
  topMargin: 60,
  bottomMargin: 110,
  sidePadding: 10,
};