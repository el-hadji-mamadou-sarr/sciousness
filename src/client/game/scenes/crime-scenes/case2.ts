import { Case, CrimeSceneObject, Clue, Suspect, DialogueOption } from '../../../../shared/types/game';

// Case 2: The Viral Victim
// A Redditor who gained massive sympathy is found dead after inconsistencies emerge

// Crime Scene Objects
export const case2Objects: CrimeSceneObject[] = [
  {
    id: 'obj_phone',
    name: 'Phone',
    x: 65,
    y: 28,
    width: 18,
    height: 16,
    description: 'The victim’s phone is unlocked. Reddit notifications are flooding in.',
    clueId: 'clue_screenshot_metadata',
  },
  {
    id: 'obj_laptop',
    name: 'Laptop',
    x: 40,
    y: 22,
    width: 28,
    height: 18,
    description: 'A laptop displaying a now-deleted post titled: "My life was destroyed. Please help."',
    clueId: 'clue_deleted_post',
  },
  {
    id: 'obj_printouts',
    name: 'Printed Screenshots',
    x: 30,
    y: 38,
    width: 22,
    height: 15,
    description: 'Printed screenshots of DMs. Red circles and angry notes cover them.',
    clueId: 'clue_inconsistent_fonts',
  },
  {
    id: 'obj_body',
    name: 'Victim',
    x: 50,
    y: 72,
    width: 26,
    height: 22,
    description: 'u/ThrowRAJusticeNow lies face down. Signs of blunt force trauma.',
  },
  {
    id: 'obj_trash',
    name: 'Trash Bin',
    x: 15,
    y: 70,
    width: 18,
    height: 18,
    description: 'Discarded USB sticks and shredded papers.',
    clueId: 'clue_usb',
  },
  {
    id: 'obj_door',
    name: 'Door',
    x: 85,
    y: 55,
    width: 15,
    height: 30,
    description: 'The door shows no signs of forced entry.',
  },
  {
    id: 'obj_whiteboard',
    name: 'Whiteboard',
    x: 80,
    y: 30,
    width: 18,
    height: 22,
    description: 'A timeline of events. Several timestamps are crossed out and rewritten.',
    clueId: 'clue_timeline',
  },
];

// Clues
export const case2Clues: Clue[] = [
  {
    id: 'clue_deleted_post',
    name: 'Deleted Viral Post',
    description: 'The post reached 120k upvotes and multiple awards before being quietly removed by mods.',
    found: false,
  },
  {
    id: 'clue_screenshot_metadata',
    name: 'Screenshot Metadata',
    description: 'Image metadata shows the screenshots were edited minutes before posting.',
    found: false,
    linkedTo: 'suspect_victim_friend',
  },
  {
    id: 'clue_inconsistent_fonts',
    name: 'Inconsistent Fonts',
    description: 'The DM screenshots use two different system fonts in the same conversation.',
    found: false,
    linkedTo: 'suspect_victim',
  },
  {
    id: 'clue_usb',
    name: 'USB Drive',
    description: 'Contains raw image files and Photoshop project backups.',
    found: false,
    linkedTo: 'suspect_victim_friend',
  },
  {
    id: 'clue_timeline',
    name: 'Altered Timeline',
    description: 'Events were rearranged to exaggerate harassment and hide earlier messages.',
    found: false,
    linkedTo: 'suspect_victim',
  },
];

// Dialogue

const closeFriendDialogue: DialogueOption[] = [
  {
    id: 'friend_1',
    text: 'You helped them with the post, didn’t you?',
    response: 'I just proofread. They were distraught. I wanted to help them be heard.',
    isSuspicious: true,
  },
  {
    id: 'friend_2',
    text: 'Why are Photoshop files on your USB?',
    response: 'For… privacy. Cropping. Everyone edits screenshots.',
    isSuspicious: true,
    unlocksClue: 'clue_usb',
  },
  {
    id: 'friend_3',
    text: 'Did you know the screenshots were fake?',
    response: 'Fake is a strong word. The message was real… the order maybe wasn’t.',
    isSuspicious: true,
  },
];

const accusedUserDialogue: DialogueOption[] = [
  {
    id: 'accused_1',
    text: 'Did you harass the victim?',
    response: 'No. We argued once, weeks ago. That’s it.',
  },
  {
    id: 'accused_2',
    text: 'The screenshots show threats.',
    response: 'They’re edited. I’ve never used those words in my life.',
  },
  {
    id: 'accused_3',
    text: 'Where were you when the victim died?',
    response: 'At work. My coworkers can confirm.',
  },
];

const moderatorDialogue: DialogueOption[] = [
  {
    id: 'mod_1',
    text: 'Why was the post removed?',
    response: 'We noticed inconsistencies. The evidence didn’t add up.',
  },
  {
    id: 'mod_2',
    text: 'Why not leave a public explanation?',
    response: 'Backlash. People don’t like being told they were fooled.',
  },
];

// Suspects
export const case2Suspects: Suspect[] = [
  {
    id: 'suspect_victim',
    name: 'u/ThrowRAJusticeNow',
    description: 'The victim. Claimed to be the target of an intense harassment campaign.',
    alibi: 'N/A',
    isGuilty: true,
    dialogueOptions: [],
  },
  {
    id: 'suspect_victim_friend',
    name: 'u/HelpfulAlly',
    description: 'A close friend who helped draft the viral post and manage screenshots.',
    alibi: 'Was with the victim earlier that night.',
    isGuilty: false,
    dialogueOptions: closeFriendDialogue,
  },
  {
    id: 'suspect_accused',
    name: 'u/ActuallyInnocent',
    description: 'The user publicly accused in the viral post.',
    alibi: 'At work. Multiple witnesses.',
    isGuilty: false,
    dialogueOptions: accusedUserDialogue,
  },
  {
    id: 'suspect_mod',
    name: 'u/QuietModTeam',
    description: 'A moderator involved in removing the viral post.',
    alibi: 'Moderating from home.',
    isGuilty: false,
    dialogueOptions: moderatorDialogue,
  },
];

// Case Definition
export const case2: Case = {
  id: 'case_002',
  title: 'The Viral Victim',
  dayNumber: 2,
  intro: `A heartbreaking story took Reddit by storm. Awards poured in. Accusations flew. A villain was chosen.

Now u/ThrowRAJusticeNow is dead.

Was this murder the result of online harassment… or did the truth die with the post?

In this case, you must decide whether Reddit’s outrage machine was aimed at the wrong target — and who finally snapped.`,
  victimName: 'u/ThrowRAJusticeNow',
  victimDescription: 'A throwaway account that rose to instant fame through an emotionally charged post.',
  location: 'Small Apartment',
  crimeSceneObjects: case2Objects,
  suspects: case2Suspects,
  clues: case2Clues,
};

// Mobile layout hints
export const case2MobileLayout = {
  minObjectWidth: 50,
  minObjectHeight: 45,
  objectSpacing: 15,
  topMargin: 60,
  bottomMargin: 110,
  sidePadding: 10,
};
