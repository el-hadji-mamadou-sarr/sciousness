import { Case, CrimeSceneObject, Clue, Suspect, DialogueOption } from '../../../../shared/types/game';

// Case 3: Parasocial Fallout
// A beloved streamer is found dead after fans uncover contradictions in their “wholesome” persona

// Crime Scene Objects
export const case3Objects: CrimeSceneObject[] = [
  {
    id: 'obj_ringlight',
    name: 'Ring Light',
    x: 62,
    y: 18,
    width: 20,
    height: 16,
    description: 'A ring light still turned on. Chat reflections are visible in the glass.',
    clueId: 'clue_stream_chat',
  },
  {
    id: 'obj_pc',
    name: 'Streaming PC',
    x: 38,
    y: 22,
    width: 30,
    height: 20,
    description: 'OBS is paused mid-stream. The title reads: “I owe you the truth.”',
    clueId: 'clue_draft_confession',
  },
  {
    id: 'obj_phone',
    name: 'Phone',
    x: 70,
    y: 42,
    width: 18,
    height: 16,
    description: 'Hundreds of missed notifications. Several are donation messages.',
    clueId: 'clue_donation_logs',
  },
  {
    id: 'obj_body',
    name: 'Victim',
    x: 50,
    y: 75,
    width: 26,
    height: 22,
    description: 'u/SunnySideSam lies slumped in their streaming chair. Cause of death: poisoning.',
  },
  {
    id: 'obj_notebook',
    name: 'Notebook',
    x: 20,
    y: 60,
    width: 20,
    height: 16,
    description: 'Handwritten notes tracking subscriber counts and “emotional beats.”',
    clueId: 'clue_manipulation_notes',
  },
  {
    id: 'obj_cup',
    name: 'Energy Drink',
    x: 58,
    y: 60,
    width: 14,
    height: 14,
    description: 'An unopened can next to an empty glass that smells faintly bitter.',
    clueId: 'clue_poison',
  },
];

// Clues
export const case3Clues: Clue[] = [
  {
    id: 'clue_stream_chat',
    name: 'Stream Chat Logs',
    description: 'Messages show fans begging the victim not to “abandon them” minutes before death.',
    found: false,
    linkedTo: 'suspect_superfan',
  },
  {
    id: 'clue_draft_confession',
    name: 'Draft Confession',
    description: 'A text file admitting several viral stories were exaggerated or entirely fake.',
    found: false,
    linkedTo: 'suspect_victim',
  },
  {
    id: 'clue_donation_logs',
    name: 'Donation Logs',
    description: 'Private messages tied to donations promise personal attention in return.',
    found: false,
    linkedTo: 'suspect_manager',
  },
  {
    id: 'clue_manipulation_notes',
    name: 'Manipulation Notes',
    description: 'Detailed plans on how to cry on cue, trigger sympathy, and maximize engagement.',
    found: false,
    linkedTo: 'suspect_victim',
  },
  {
    id: 'clue_poison',
    name: 'Poisoned Glass',
    description: 'Traces of a fast-acting toxin mixed with a flavor enhancer.',
    found: false,
    linkedTo: 'suspect_superfan',
  },
];

// Dialogue

const superfanDialogue: DialogueOption[] = [
  {
    id: 'fan_1',
    text: 'You donated a lot of money, didn’t you?',
    response: 'They needed me. And I needed them. It was mutual.',
    isSuspicious: true,
  },
  {
    id: 'fan_2',
    text: 'What did you mean by “don’t leave us” in chat?',
    response: 'They promised they wouldn’t disappear. Then they said they were lying.',
    isSuspicious: true,
  },
  {
    id: 'fan_3',
    text: 'How did poison get into the glass?',
    response: 'I just brought them a drink. Like always.',
    isSuspicious: true,
    unlocksClue: 'clue_poison',
  },
];

const managerDialogue: DialogueOption[] = [
  {
    id: 'manager_1',
    text: 'Did you know the stories were fake?',
    response: '“Enhanced.” Audiences want authenticity. This was… optimized.',
    isSuspicious: true,
  },
  {
    id: 'manager_2',
    text: 'Why hide the donation messages?',
    response: 'Because screenshots go viral. And nuance never does.',
    isSuspicious: true,
    unlocksClue: 'clue_donation_logs',
  },
];

const collaboratorDialogue: DialogueOption[] = [
  {
    id: 'collab_1',
    text: 'Were they planning to expose themselves?',
    response: 'They were panicking. Said the internet was turning.',
  },
  {
    id: 'collab_2',
    text: 'Did you argue that night?',
    response: 'Everyone argues before a cancellation.',
  },
];

// Suspects
export const case3Suspects: Suspect[] = [
  {
    id: 'suspect_victim',
    name: 'u/SunnySideSam',
    description: 'A relentlessly positive streamer with a fiercely loyal fanbase.',
    alibi: 'N/A',
    isGuilty: false,
    dialogueOptions: [],
  },
  {
    id: 'suspect_superfan',
    name: 'u/ForeverForSam',
    description: 'A top donor and constant presence in chat.',
    alibi: 'Visited the victim shortly before the stream.',
    isGuilty: true,
    dialogueOptions: superfanDialogue,
  },
  {
    id: 'suspect_manager',
    name: 'Alex Reed',
    description: 'The victim’s off-platform manager and brand strategist.',
    alibi: 'On calls with sponsors.',
    isGuilty: false,
    dialogueOptions: managerDialogue,
  },
  {
    id: 'suspect_collaborator',
    name: 'u/CozyCollab',
    description: 'A fellow streamer who recently distanced themselves.',
    alibi: 'Streaming live at the time of death.',
    isGuilty: false,
    dialogueOptions: collaboratorDialogue,
  },
];

// Case Definition
export const case3: Case = {
  id: 'case_003',
  title: 'Parasocial Fallout',
  dayNumber: 3,
  intro: `They said this stream would “change everything.”  
Fans gathered. Donations poured in. Emotions ran high.

But the truth never went live.

u/SunnySideSam is dead — poisoned just before confessing that their online life was a carefully managed lie.

Was this a business decision gone wrong… or a fan who couldn’t survive the fantasy ending?`,
  victimName: 'u/SunnySideSam',
  victimDescription: 'A feel-good streamer whose authenticity became their brand.',
  location: 'Streaming Studio Apartment',
  crimeSceneObjects: case3Objects,
  suspects: case3Suspects,
  clues: case3Clues,
};

// Mobile layout hints
export const case3MobileLayout = {
  minObjectWidth: 50,
  minObjectHeight: 45,
  objectSpacing: 15,
  topMargin: 60,
  bottomMargin: 110,
  sidePadding: 10,
};
