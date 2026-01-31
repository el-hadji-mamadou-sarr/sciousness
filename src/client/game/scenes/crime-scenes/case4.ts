import { Case, CrimeSceneObject, Clue, Suspect, DialogueOption } from '../../../../shared/types/game';

// Case 4: Ink and Blood (Tuesday)
// An investigative journalist dies before publishing their biggest exposé

// Crime Scene Objects
export const case4Objects: CrimeSceneObject[] = [
  {
    id: 'obj_desk',
    name: 'Desk',
    x: 35,
    y: 25,
    width: 40,
    height: 25,
    description: `Covered in papers. Front page draft: "Mayor's Secret Deal with Developer."`,
    clueId: 'clue_article_draft',
  },
  {
    id: 'obj_body',
    name: 'Victim',
    x: 50,
    y: 65,
    width: 26,
    height: 22,
    description: 'Sam "Inkwell" Rivera. Head trauma from heavy bookend. No signs of struggle.',
  },
  {
    id: 'obj_bookend',
    name: 'Bloody Bookend',
    x: 75,
    y: 30,
    width: 14,
    height: 14,
    description: 'Marble bookend. Clean prints wiped. Tiny red fiber caught in corner.',
    clueId: 'clue_red_fiber',
  },
  {
    id: 'obj_computer',
    name: 'Computer',
    x: 20,
    y: 40,
    width: 22,
    height: 18,
    description: 'Article auto-saved at 1:47 AM. Deleted at 1:52 AM from admin account.',
    clueId: 'clue_deleted_files',
  },
  {
    id: 'obj_safe',
    name: 'Wall Safe',
    x: 80,
    y: 60,
    width: 16,
    height: 12,
    description: 'Open and empty. Photo inside shows victim with mayor, both looking tense.',
    clueId: 'clue_safe_photo',
  },
  {
    id: 'obj_window',
    name: 'Window',
    x: 15,
    y: 70,
    width: 18,
    height: 25,
    description: 'Unlocked. Fire escape below has fresh scuff marks.',
    clueId: 'clue_fire_escape',
  },
  {
    id: 'obj_phone',
    name: 'Cell Phone',
    x: 65,
    y: 50,
    width: 12,
    height: 10,
    description: `Last call: "Unknown" at 1:30 AM. Last text: "We need to talk. Don't publish yet."`,
    clueId: 'clue_last_text',
  },
  {
    id: 'obj_notebook',
    name: 'Notebook',
    x: 85,
    y: 45,
    width: 12,
    height: 12,
    description: 'Code names: "Gavel" = Mayor, "Crane" = Developer, "Songbird" = Informant.',
    clueId: 'clue_code_names',
  },
];

// Clues
export const case4Clues: Clue[] = [
  {
    id: 'clue_article_draft',
    name: 'Article Draft',
    description: 'Details $50M land deal, kickbacks, falsified environmental reports. Names mayor and developer.',
    found: false,
    linkedTo: 'suspect_mayor',
  },
  {
    id: 'clue_red_fiber',
    name: 'Red Carpet Fiber',
    description: 'Matches exclusive carpet in mayor\'s office. Not available commercially.',
    found: false,
    linkedTo: 'suspect_mayor',
  },
  {
    id: 'clue_deleted_files',
    name: 'Deleted Files',
    description: 'Files deleted using victim\'s credentials. Login from IP at city hall.',
    found: false,
    linkedTo: 'suspect_mayor',
  },
  {
    id: 'clue_safe_photo',
    name: 'Incriminating Photo',
    description: 'Mayor handing envelope to developer. Both look nervous. Date matches land deal.',
    found: false,
    linkedTo: 'suspect_mayor',
  },
  {
    id: 'clue_fire_escape',
    name: 'Fire Escape Marks',
    description: 'Boot prints match security guard size 10. Same brand issued to building security.',
    found: false,
    linkedTo: 'suspect_guard',
  },
  {
    id: 'clue_last_text',
    name: 'Mystery Text',
    description: 'Sent from burner phone. Tower ping places sender near victim\'s building.',
    found: false,
    linkedTo: 'suspect_dev',
  },
  {
    id: 'clue_code_names',
    name: 'Code Names',
    description: '"Songbird" circled. Note: "Wants protection. Afraid of Crane."',
    found: false,
    linkedTo: 'suspect_informant',
  },
  {
    id: 'clue_alibi_fake',
    name: 'Fake Alibi',
    description: 'Mayor\'s "charity event" ended at midnight. Security footage shows him leaving at 11:30 PM.',
    found: false,
    linkedTo: 'suspect_mayor',
  },
];

// Dialogue

const mayorDialogue: DialogueOption[] = [
  {
    id: 'may_1',
    text: 'The article mentions you.',
    response: 'Fake news. Sam had a grudge. Lost a libel case to me last year.',
    isSuspicious: true,
  },
  {
    id: 'may_2',
    text: 'Your carpet fiber was found.',
    response: 'Impossible. Unless... Sam visited my office yesterday. For an interview.',
    isSuspicious: true,
  },
  {
    id: 'may_3',
    text: 'Your alibi doesn\'t match.',
    response: 'I left early. Headache. My driver can confirm.',
    unlocksClue: 'clue_alibi_fake',
  },
  {
    id: 'may_4',
    text: 'What was in the envelope?',
    response: 'Campaign donation. Perfectly legal. Sam twisted everything.',
  },
];

const developerDialogue: DialogueOption[] = [
  {
    id: 'dev_1',
    text: 'You stand to lose $50M.',
    response: 'My reputation is worth more. The deal was clean.',
    isSuspicious: true,
  },
  {
    id: 'dev_2',
    text: 'You sent the last text.',
    response: 'I wanted to reason with him. Not threaten.',
    isSuspicious: true,
  },
  {
    id: 'dev_3',
    text: 'Who is "Songbird"?',
    response: 'No idea. Maybe a disgruntled employee trying to cause trouble.',
    unlocksClue: 'clue_code_names',
  },
  {
    id: 'dev_4',
    text: 'Did you visit him?',
    response: 'At 1 AM? No. I have security at my penthouse all night.',
  },
];

const guardDialogue: DialogueOption[] = [
  {
    id: 'guard_1',
    text: 'Your boots match the prints.',
    response: 'Standard issue. Half the building has them.',
  },
  {
    id: 'guard_2',
    text: 'You let someone in after hours.',
    response: 'The mayor has 24/7 access. He came by around midnight.',
    isSuspicious: true,
  },
  {
    id: 'guard_3',
    text: 'You saw the mayor leave?',
    response: 'He looked upset. Said he forgot something in his office earlier.',
    isSuspicious: true,
  },
  {
    id: 'guard_4',
    text: 'You deleted security footage.',
    response: 'Camera 3 was down for maintenance. Coincidence.',
    isSuspicious: true,
  },
];

const informantDialogue: DialogueOption[] = [
  {
    id: 'inf_1',
    text: 'You\'re "Songbird".',
    response: 'Was. Now I\'m a dead woman walking. Sam promised protection.',
    isSuspicious: true,
  },
  {
    id: 'inf_2',
    text: 'You worked for the developer.',
    response: 'Accountant. Saw the fake invoices. They were laundering through the land deal.',
    isSuspicious: true,
  },
  {
    id: 'inf_3',
    text: 'Who killed Sam?',
    response: 'The mayor. Sam had the photo. The safe was empty when I checked.',
    unlocksClue: 'clue_safe_photo',
  },
  {
    id: 'inf_4',
    text: 'Why come forward now?',
    response: 'Sam\'s dead. I\'m next unless you catch them.',
  },
];

// Suspects
export const case4Suspects: Suspect[] = [
  {
    id: 'suspect_victim',
    name: 'Sam "Inkwell" Rivera',
    description: 'Award-winning journalist. Known for exposing corruption.',
    alibi: 'N/A',
    isGuilty: false,
    dialogueOptions: [],
  },
  {
    id: 'suspect_mayor',
    name: 'Mayor Richard Vance',
    description: 'Up for re-election. Clean image. Secretly corrupt.',
    alibi: 'Charity event until midnight.',
    isGuilty: false,
    dialogueOptions: mayorDialogue,
  },
  {
    id: 'suspect_dev',
    name: 'Karl Finch',
    description: 'Real estate developer. Has history of bribing officials.',
    alibi: 'Home with wife.',
    isGuilty: false,
    dialogueOptions: developerDialogue,
  },
  {
    id: 'suspect_guard',
    name: 'Mick Dobbs',
    description: 'Building security. Former cop. Owes mayor favors.',
    alibi: 'At front desk all night.',
    isGuilty: true,
    dialogueOptions: guardDialogue,
  },
  {
    id: 'suspect_informant',
    name: 'Elena Santos',
    description: 'Whistleblower. Provided evidence to victim. In hiding.',
    alibi: 'Witness protection hotel.',
    isGuilty: false,
    dialogueOptions: informantDialogue,
  },
];

// Case Definition
export const case4: Case = {
  id: 'case_004',
  title: 'Ink and Blood',
  dayNumber: 4,
  intro: `Sam Rivera was about to publish the story that would end a mayor's career.

The evidence was locked in a safe. The article was ready for print.

At 1:47 AM, Sam saved the final draft.
At 1:52 AM, someone deleted it.
At 2:15 AM, a neighbor heard a thump.

Now a journalist is dead, a safe is empty, and the truth is missing.

Who killed the messenger?`,
  victimName: 'Sam "Inkwell" Rivera',
  victimDescription: 'Investigative journalist who specialized in political corruption.',
  location: 'Newsroom Office',
  crimeSceneObjects: case4Objects,
  suspects: case4Suspects,
  clues: case4Clues,
};

// Mobile layout hints
export const case4MobileLayout = {
  minObjectWidth: 50,
  minObjectHeight: 45,
  objectSpacing: 15,
  topMargin: 60,
  bottomMargin: 110,
  sidePadding: 10,
};