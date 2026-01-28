import { Case, CrimeSceneObject, Clue, Suspect, DialogueOption } from '../../../../shared/types/game';

// Case 5: Synthetic Outrage (Wednesday)
// A creator is destroyed by a viral deepfake

// Crime Scene Objects
export const case5Objects: CrimeSceneObject[] = [
  {
    id: 'obj_monitor',
    name: 'Monitor',
    x: 42,
    y: 20,
    width: 32,
    height: 20,
    description: 'A deepfake video paused. Comments flooding in with hate.',
    clueId: 'clue_video_artifacts',
  },
  {
    id: 'obj_server',
    name: 'Server',
    x: 18,
    y: 30,
    width: 22,
    height: 26,
    description: 'AI training rig. Logs show unauthorized access.',
    clueId: 'clue_breached_logs',
  },
  {
    id: 'obj_phone',
    name: 'Phone',
    x: 70,
    y: 36,
    width: 18,
    height: 16,
    description: 'Shattered screen. "Verification video processing" notification.',
    clueId: 'clue_unfinished_rebuttal',
  },
  {
    id: 'obj_body',
    name: 'Victim',
    x: 52,
    y: 76,
    width: 26,
    height: 22,
    description: 'Danielle "DevDan" Park. Bruising suggests a push. Sedative in system.',
  },
  {
    id: 'obj_notepad',
    name: 'Notepad',
    x: 65,
    y: 60,
    width: 18,
    height: 14,
    description: 'Note: "The lie has 10M views. Truth buffers forever."',
    clueId: 'clue_blackmail_fragment',
  },
  {
    id: 'obj_router',
    name: 'Router',
    x: 85,
    y: 24,
    width: 14,
    height: 14,
    description: 'VPN logs show 3:17 AM upload from this IP.',
    clueId: 'clue_midnight_upload',
  },
  {
    id: 'obj_glass',
    name: 'Glass',
    x: 38,
    y: 68,
    width: 12,
    height: 12,
    description: 'Whiskey glass with sedative residue. One set of prints.',
    clueId: 'clue_spiked_drink',
  },
  {
    id: 'obj_projector',
    name: 'Projector',
    x: 80,
    y: 50,
    width: 20,
    height: 16,
    description: 'Old photo: victim with Mira. "Camp Turing" caption.',
    clueId: 'clue_past_connection',
  },
];

// Clues
export const case5Clues: Clue[] = [
  {
    id: 'clue_video_artifacts',
    name: 'Video Artifacts',
    description: 'Deepfake signature matches Mira\'s software, but with amateur edits.',
    found: false,
    linkedTo: 'suspect_ai_artist',
  },
  {
    id: 'clue_breached_logs',
    name: 'Breached Logs',
    description: 'Mira\'s AI models accessed using victim\'s old credentials.',
    found: false,
    linkedTo: 'suspect_mob_leader',
  },
  {
    id: 'clue_unfinished_rebuttal',
    name: 'Failed Rebuttal',
    description: 'Victim\'s debunking video was corrupted during upload.',
    found: false,
    linkedTo: 'suspect_coworker',
  },
  {
    id: 'clue_blackmail_fragment',
    name: 'Torn Note',
    description: 'Matches u/NoMoreExcuses\'s handwriting. Threatens exposure.',
    found: false,
    linkedTo: 'suspect_mob_leader',
  },
  {
    id: 'clue_midnight_upload',
    name: '3:17 AM Upload',
    description: 'Video uploaded from victim\'s home while victim was sedated.',
    found: false,
    linkedTo: 'suspect_mob_leader',
  },
  {
    id: 'clue_spiked_drink',
    name: 'Spiked Drink',
    description: 'Sedative matches Jamie\'s prescription. Jamie\'s fingerprints on glass.',
    found: false,
    linkedTo: 'suspect_coworker',
  },
  {
    id: 'clue_past_connection',
    name: 'Old Photo',
    description: 'Victim and Mira knew each other. Mira\'s startup failed after victim\'s review.',
    found: false,
    linkedTo: 'suspect_ai_artist',
  },
  {
    id: 'clue_discord_bot',
    name: 'Harassment Bot',
    description: 'u/NoMoreExcuses created a bot that doxed the victim.',
    found: false,
    linkedTo: 'suspect_mob_leader',
  },
];

// Dialogue

const aiArtistDialogue: DialogueOption[] = [
  {
    id: 'ai_1',
    text: 'You knew the victim?',
    response: 'We met at Camp Turing. She gave my startup a bad review.',
  },
  {
    id: 'ai_2',
    text: 'Your software made the deepfake.',
    response: 'My tools are open-source. Anyone could have used them.',
    isSuspicious: true,
  },
  {
    id: 'ai_3',
    text: 'Did you access her server?',
    response: 'No. Someone else did, and left my signature.',
    isSuspicious: true,
  },
  {
    id: 'ai_4',
    text: 'You wanted revenge?',
    response: 'I wanted her to feel humiliation. Not death.',
    unlocksClue: 'clue_past_connection',
  },
];

const mobLeaderDialogue: DialogueOption[] = [
  {
    id: 'mob_1',
    text: 'You doxxed her.',
    response: 'Transparency isn\'t doxxing. People deserve to know.',
    isSuspicious: true,
  },
  {
    id: 'mob_2',
    text: 'You were in her house at 3 AM.',
    response: 'She invited me. Wanted to confess.',
    isSuspicious: true,
  },
  {
    id: 'mob_3',
    text: 'Your prints are on the glass.',
    response: 'Impossible. Unless she kept it from months ago.',
    isSuspicious: true,
    unlocksClue: 'clue_spiked_drink',
  },
  {
    id: 'mob_4',
    text: 'You built a harassment bot.',
    response: 'I built a truth system. She had nothing to fear.',
    isSuspicious: true,
    unlocksClue: 'clue_discord_bot',
  },
];

const coworkerDialogue: DialogueOption[] = [
  {
    id: 'coworker_1',
    text: 'Your sedatives are missing.',
    response: 'I didn\'t know they were gone. For my anxiety.',
  },
  {
    id: 'coworker_2',
    text: 'You corrupted her video.',
    response: 'I was helping! The connection dropped.',
    isSuspicious: true,
  },
  {
    id: 'coworker_3',
    text: 'You distanced yourself.',
    response: 'My husband said it would ruin my career too.',
  },
  {
    id: 'coworker_4',
    text: 'You loved her once?',
    response: 'We were partners. Before she forgot me.',
    unlocksClue: 'clue_unfinished_rebuttal',
  },
];

const victimDialogue: DialogueOption[] = [
  {
    id: 'victim_1',
    text: 'Why keep the note?',
    response: 'Evidence. I knew this would happen.',
  },
  {
    id: 'victim_2',
    text: 'You knew the deepfake maker.',
    response: 'Mira\'s signature is there. But distribution was someone else.',
  },
];

// Suspects
export const case5Suspects: Suspect[] = [
  {
    id: 'suspect_victim',
    name: 'Danielle "DevDan" Park',
    description: 'Famous developer who debunked scams. Targeted by one.',
    alibi: 'N/A',
    isGuilty: false,
    dialogueOptions: victimDialogue,
  },
  {
    id: 'suspect_ai_artist',
    name: 'Mira Kovács',
    description: 'AI researcher. Career hurt by victim\'s review.',
    alibi: 'Virtual keynote (pre-recorded).',
    isGuilty: false,
    dialogueOptions: aiArtistDialogue,
  },
  {
    id: 'suspect_mob_leader',
    name: 'Alex Vance / u/NoMoreExcuses',
    description: 'Activist who exposes "truth" by any means.',
    alibi: 'Livestreaming (could be looped).',
    isGuilty: true,
    dialogueOptions: mobLeaderDialogue,
  },
  {
    id: 'suspect_coworker',
    name: 'Jamie Lin',
    description: 'Victim\'s ex-partner. Quietly resentful.',
    alibi: 'Home with spouse.',
    isGuilty: false,
    dialogueOptions: coworkerDialogue,
  },
];

// Case Definition
export const case5: Case = {
  id: 'case_005',
  title: 'Synthetic Outrage',
  dayNumber: 5,
  intro: `A deepfake destroyed Danielle Park's life overnight. The video spread faster than truth.

Her rebuttal never uploaded. Threats arrived at her door. Now she's dead at her stairs, phone shattered.

In a world where seeing isn't believing, who killed her?`,
  victimName: 'Danielle "DevDan" Park',
  victimDescription: 'Developer undone by a viral deepfake.',
  location: 'Townhouse Office',
  crimeSceneObjects: case5Objects,
  suspects: case5Suspects,
  clues: case5Clues,
};

// Mobile layout hints
export const case5MobileLayout = {
  minObjectWidth: 50,
  minObjectHeight: 45,
  objectSpacing: 15,
  topMargin: 60,
  bottomMargin: 110,
  sidePadding: 10,
};