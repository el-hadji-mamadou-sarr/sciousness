import { Case, CrimeSceneObject, Clue, Suspect, DialogueOption } from '../../../../shared/types/game';

// Case 1: The Moderator's Last Ban
// A senior Reddit moderator is found dead in their home office

// Crime Scene Objects - positions are percentages (0-100)
// Mobile-optimized: larger hit areas, better spacing
export const case1Objects: CrimeSceneObject[] = [
  {
    id: 'obj_desk',
    name: 'Desk',
    x: 50,
    y: 30,
    width: 35,
    height: 20,
    description: 'A large wooden desk covered in papers and Reddit printouts. Ban logs are scattered everywhere.',
    clueId: 'clue_threat_letter',
  },
  {
    id: 'obj_computer',
    name: 'Computer',
    x: 50,
    y: 18,
    width: 20,
    height: 15,
    description: 'The monitor displays an unsent message: "I know about the vote manipulation..."',
    clueId: 'clue_message',
  },
  {
    id: 'obj_coffee',
    name: 'Coffee Mug',
    x: 75,
    y: 32,
    width: 15,
    height: 15,
    description: 'A cold coffee mug with a strange residue at the bottom. Smells oddly bitter.',
    clueId: 'clue_poison',
  },
  {
    id: 'obj_plant',
    name: 'Plant',
    x: 15,
    y: 25,
    width: 18,
    height: 22,
    description: 'A wilting houseplant. Some leaves appear to have been recently cut.',
    clueId: 'clue_plant',
  },
  {
    id: 'obj_body',
    name: 'Victim',
    x: 50,
    y: 70,
    width: 25,
    height: 22,
    description: 'u/ModeratorMax lies motionless. No visible wounds. Face shows signs of distress.',
  },
  {
    id: 'obj_muddy_prints',
    name: 'Mud Tracks',
    x: 25,
    y: 85,
    width: 20,
    height: 12,
    description: 'Muddy footprints leading from the door. Contains traces of fertilizer.',
    clueId: 'clue_mud',
  },
  {
    id: 'obj_bookshelf',
    name: 'Bookshelf',
    x: 85,
    y: 45,
    width: 18,
    height: 35,
    description: 'A bookshelf filled with coding manuals. One book about "Reddit Moderation" seems well-worn.',
  },
  {
    id: 'obj_window',
    name: 'Window',
    x: 15,
    y: 55,
    width: 18,
    height: 25,
    description: 'The window is slightly ajar. Overlooks a community garden below.',
  },
];

// Clues for Case 1
export const case1Clues: Clue[] = [
  {
    id: 'clue_threat_letter',
    name: 'Threatening Letter',
    description: 'A crumpled letter: "Unban me or else... you\'ll regret it. -BF"',
    found: false,
    linkedTo: 'suspect_banned',
  },
  {
    id: 'clue_message',
    name: 'Unsent Message',
    description: 'Draft about exposing vote manipulation by another moderator.',
    found: false,
    linkedTo: 'suspect_comod',
  },
  {
    id: 'clue_poison',
    name: 'Poisoned Coffee',
    description: 'The coffee contains traces of digitalis - a heart-stopping poison derived from foxglove plants.',
    found: false,
  },
  {
    id: 'clue_plant',
    name: 'Cut Foxglove',
    description: 'This is a foxglove plant - source of digitalis poison. Fresh cuts indicate recent harvesting.',
    found: false,
    linkedTo: 'suspect_comod',
  },
  {
    id: 'clue_mud',
    name: 'Garden Fertilizer',
    description: 'The mud contains a unique organic fertilizer only used in the community garden.',
    found: false,
    linkedTo: 'suspect_comod',
  },
];

// Dialogue options for suspects
const bannedForeverDialogue: DialogueOption[] = [
  {
    id: 'banned_1',
    text: 'Where were you last night?',
    response: 'At O\'Malley\'s Bar drowning my sorrows. Got banned from my favorite subreddit, you know? The bartender can vouch for me.',
    nextOptions: ['banned_2a', 'banned_2b'],
  },
  {
    id: 'banned_2a',
    text: 'Why did you send that threatening letter?',
    response: 'Look, I was angry! But I\'d never actually hurt anyone. Those were just words. I was drunk when I wrote it.',
    isSuspicious: true,
  },
  {
    id: 'banned_2b',
    text: 'How well did you know the victim?',
    response: 'Only online. Never met in person. They banned me for "harassment" but I was just passionate about my posts!',
  },
  {
    id: 'banned_3',
    text: 'Do you know anything about poison?',
    response: 'Poison? What? No! I\'m a software developer, not a chemist! This is crazy!',
  },
];

const coModeratorDialogue: DialogueOption[] = [
  {
    id: 'comod_1',
    text: 'What was your relationship with the victim?',
    response: 'We were co-moderators for 3 years. Best friends, really. I... I can\'t believe they\'re gone.',
    nextOptions: ['comod_2a', 'comod_2b'],
  },
  {
    id: 'comod_2a',
    text: 'I heard about vote manipulation accusations...',
    response: '*nervous* That\'s... that\'s ridiculous! Max was paranoid. Always seeing conspiracies. There was no manipulation!',
    isSuspicious: true,
    unlocksClue: 'clue_message',
  },
  {
    id: 'comod_2b',
    text: 'Do you have a garden?',
    response: 'Yes, I tend the community garden. Helps me relax. Mostly vegetables and... flowers.',
    isSuspicious: true,
  },
  {
    id: 'comod_3',
    text: 'Where were you last night?',
    response: 'Home. Asleep. Alone. I... I don\'t have anyone who can confirm that.',
    isSuspicious: true,
  },
];

const exPartnerDialogue: DialogueOption[] = [
  {
    id: 'ex_1',
    text: 'How did your relationship end?',
    response: 'Mutually. We\'re still friends actually. Had dinner together last week. No hard feelings.',
    nextOptions: ['ex_2a', 'ex_2b'],
  },
  {
    id: 'ex_2a',
    text: 'Where were you last night?',
    response: 'At the cinema. Watched the new Marvel movie. Still have my ticket stub somewhere.',
  },
  {
    id: 'ex_2b',
    text: 'Did Max have any enemies?',
    response: 'Plenty of angry banned users, but one person stood out - Sam, the co-mod. They\'d been arguing about something for weeks.',
    unlocksClue: 'clue_message',
  },
  {
    id: 'ex_3',
    text: 'Do you know anything about gardening?',
    response: 'Me? No way. I kill every plant I touch. Black thumb, they call me.',
  },
];

// Suspects for Case 1
export const case1Suspects: Suspect[] = [
  {
    id: 'suspect_banned',
    name: 'u/BannedForever',
    description: 'A bitter user who was permanently banned last week for harassment.',
    alibi: 'Claims to have been at a bar all night. Bartender confirms.',
    isGuilty: false,
    dialogueOptions: bannedForeverDialogue,
  },
  {
    id: 'suspect_comod',
    name: 'u/CoModeratorSam',
    description: 'Fellow moderator and supposedly the victim\'s best friend. Tends the community garden.',
    alibi: 'Says they were home alone. No witnesses.',
    isGuilty: true,
    dialogueOptions: coModeratorDialogue,
  },
  {
    id: 'suspect_ex',
    name: 'u/ExPartner',
    description: 'The victim\'s ex-partner. Claims they ended on good terms.',
    alibi: 'At a movie. Has ticket stub.',
    isGuilty: false,
    dialogueOptions: exPartnerDialogue,
  },
];

// Complete Case 1 definition
export const case1: Case = {
  id: 'case_001',
  title: "The Moderator's Last Ban",
  dayNumber: 1,
  intro: `A tragedy has struck the Reddit community. u/ModeratorMax, a beloved senior moderator known for their fair but firm approach, has been found dead in their home office.

The cause appears to be poisoning. Your task: examine the crime scene, interrogate the suspects, and bring the killer to justice.

Remember: You only get ONE chance to make an accusation. Choose wisely, detective.`,
  victimName: 'u/ModeratorMax',
  victimDescription: 'Senior moderator of r/AskReddit with over 1 million karma. Known for banning rule-breakers without mercy, but always explaining why.',
  location: 'Home Office',
  crimeSceneObjects: case1Objects,
  suspects: case1Suspects,
  clues: case1Clues,
};

// Export mobile-optimized crime scene layout hints
export const case1MobileLayout = {
  // Suggested object sizes for mobile (minimum touch-friendly sizes)
  minObjectWidth: 50,  // pixels
  minObjectHeight: 45, // pixels
  // Spacing between objects
  objectSpacing: 15,   // pixels
  // Scene area margins
  topMargin: 60,       // for header
  bottomMargin: 110,   // for info panel + nav
  sidePadding: 10,
};
