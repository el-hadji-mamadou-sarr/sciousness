import { Case, CrimeSceneObject, Clue, Suspect, DialogueOption } from '../../../../shared/types/game';

// Case 4: Synthetic Outrage
// A creator is destroyed by a viral deepfake — then found dead before it's debunked

// Crime Scene Objects
export const case4Objects: CrimeSceneObject[] = [
  {
    id: 'obj_monitor',
    name: 'Paused Video Feed',
    x: 42,
    y: 20,
    width: 32,
    height: 20,
    description: 'Video titled: "I Never Said This" — paused at frame showing obvious digital artifacts in the reflection. Comments flooding in: "Delete your account."',
    clueId: 'clue_video_artifacts',
  },
  {
    id: 'obj_server',
    name: 'AI Training Server',
    x: 18,
    y: 30,
    width: 22,
    height: 26,
    description: 'Custom-built rig with three GPUs. Logs show recent unauthorized access.',
    clueId: 'clue_breached_logs',
  },
  {
    id: 'obj_phone',
    name: 'Shattered Phone',
    x: 70,
    y: 36,
    width: 18,
    height: 16,
    description: 'Screen cracked. Last notification: "Your verification video is processing." Never posted.',
    clueId: 'clue_unfinished_rebuttal',
  },
  {
    id: 'obj_body',
    name: 'Victim',
    x: 52,
    y: 76,
    width: 26,
    height: 22,
    description: 'Danielle "DevDan" Park at stairwell base. Bruising suggests pushed, not just fell. Sedative detected in system.',
  },
  {
    id: 'obj_notepad',
    name: 'Torn Notes',
    x: 65,
    y: 60,
    width: 18,
    height: 14,
    description: 'Handwritten: "The lie has 10M views. The truth buffers forever." Torn page beneath reads: "They threatened to expose—"',
    clueId: 'clue_blackmail_fragment',
  },
  {
    id: 'obj_router',
    name: 'Network Router',
    x: 85,
    y: 24,
    width: 14,
    height: 14,
    description: 'VPN logs show connections to an anonymous hosting service at 3:17 AM.',
    clueId: 'clue_midnight_upload',
  },
  {
    id: 'obj_glass',
    name: 'Whiskey Glass',
    x: 38,
    y: 68,
    width: 12,
    height: 12,
    description: 'Residue of Lorazepam mixed with whiskey. Only one set of fingerprints.',
    clueId: 'clue_spiked_drink',
  },
  {
    id: 'obj_projector',
    name: 'Old Projector',
    x: 80,
    y: 50,
    width: 20,
    height: 16,
    description: 'Home movie from 5 years ago showing victim with someone who looks like Mira. Caption: "Camp Turing — before everything changed."',
    clueId: 'clue_past_connection',
  },
];

// Clues
export const case4Clues: Clue[] = [
  {
    id: 'clue_video_artifacts',
    name: 'Digital Fingerprints',
    description: 'The deepfake has a unique compression signature matching Mira\'s "Synthetic Studio" software, but the rendering pipeline shows amateur modifications.',
    found: false,
    linkedTo: 'suspect_ai_artist',
  },
  {
    id: 'clue_breached_logs',
    name: 'Server Breach Logs',
    description: 'Someone accessed Mira\'s training models using DevDan\'s old credentials (likely phished). The breach happened two days before the video surfaced.',
    found: false,
    linkedTo: 'suspect_mob_leader',
  },
  {
    id: 'clue_unfinished_rebuttal',
    name: 'Unfinished Rebuttal',
    description: 'DevDan recorded a live debunking showing how the deepfake was made, but the file was corrupted during upload — possibly intentionally interrupted.',
    found: false,
    linkedTo: 'suspect_coworker',
  },
  {
    id: 'clue_blackmail_fragment',
    name: 'Blackmail Fragment',
    description: 'The torn note matches u/NoMoreExcuses\'s handwriting from leaked screenshots. Threatens to expose DevDan\'s past if they didn\'t "confess."',
    found: false,
    linkedTo: 'suspect_mob_leader',
  },
  {
    id: 'clue_midnight_upload',
    name: '3:17 AM Upload',
    description: 'The video was first posted from a VPN, but router logs show DevDan\'s own home IP accessing the same VPN at that time — someone was in the house.',
    found: false,
    linkedTo: 'suspect_mob_leader',
  },
  {
    id: 'clue_spiked_drink',
    name: 'Spiked Drink',
    description: 'Lorazepam prescribed to Jamie Lin. Glass has Jamie\'s fingerprints, but Jamie claims they haven\'t visited in weeks.',
    found: false,
    linkedTo: 'suspect_coworker',
  },
  {
    id: 'clue_past_connection',
    name: 'Camp Turing Photo',
    description: 'DevDan and Mira attended the same AI ethics workshop years ago. Public records show Mira\'s startup was denied funding after DevDan gave a critical review.',
    found: false,
    linkedTo: 'suspect_ai_artist',
  },
  {
    id: 'clue_discord_bot',
    name: 'Discord Bot Code',
    description: 'u/NoMoreExcuses didn\'t just share the video — they built an automated harassment bot that doxed DevDan\'s address and flooded their inbox.',
    found: false,
    linkedTo: 'suspect_mob_leader',
  },
];

// Dialogue

const aiArtistDialogue: DialogueOption[] = [
  {
    id: 'ai_1',
    text: 'You two knew each other from Camp Turing.',
    response: 'We were different people then. She gave my startup a one-star review without trying the demo.',
  },
  {
    id: 'ai_2',
    text: 'Your software made the deepfake.',
    response: 'My tools are open-source. Anyone could have used them. Including her.',
    isSuspicious: true,
  },
  {
    id: 'ai_3',
    text: 'Did you access her server?',
    response: 'I wouldn\'t need to. My models are better. But someone did — and left my signature as a calling card.',
    isSuspicious: true,
  },
  {
    id: 'ai_4',
    text: 'You had motive to ruin her.',
    response: 'Ruination? No. But I wanted her to feel what it\'s like when your reputation is synthetic. I never wanted her dead.',
    unlocksClue: 'clue_past_connection',
  },
];

const mobLeaderDialogue: DialogueOption[] = [
  {
    id: 'mob_1',
    text: 'You doxxed her address.',
    response: 'Transparency isn\'t doxxing. The public deserves to know who they\'re listening to.',
    isSuspicious: true,
  },
  {
    id: 'mob_2',
    text: 'You were in her house at 3 AM.',
    response: 'She invited me. Said she wanted to confess. I recorded it for accountability.',
    isSuspicious: true,
  },
  {
    id: 'mob_3',
    text: 'The glass has your fingerprints.',
    response: '...That\'s impossible. Unless she kept it from last time. We drank together once, months ago.',
    isSuspicious: true,
    unlocksClue: 'clue_spiked_drink',
  },
  {
    id: 'mob_4',
    text: 'You built a harassment bot.',
    response: 'I built a truth amplification system. If she hadn\'t lied in the first place, she\'d have nothing to fear.',
    isSuspicious: true,
    unlocksClue: 'clue_discord_bot',
  },
];

const coworkerDialogue: DialogueOption[] = [
  {
    id: 'coworker_1',
    text: 'You prescribed sedatives.',
    response: 'For my anxiety. I didn\'t even know they were missing until today.',
  },
  {
    id: 'coworker_2',
    text: 'You corrupted her rebuttal video.',
    response: 'I was trying to help her upload it! The file was too large, the connection dropped...',
    isSuspicious: true,
  },
  {
    id: 'coworker_3',
    text: 'You distanced yourself immediately.',
    response: 'My husband told me to. He said associating with her would ruin my career too. He was right.',
  },
  {
    id: 'coworker_4',
    text: 'Were you in love with her?',
    response: '...We were partners. Before the fame. Before she forgot who helped her start.',
    unlocksClue: 'clue_unfinished_rebuttal',
  },
];

const victimDialogue: DialogueOption[] = [
  {
    id: 'victim_1',
    text: 'Why keep the torn note?',
    response: 'Evidence. I knew this would happen. I just didn\'t think they\'d come to my home.',
  },
  {
    id: 'victim_2',
    text: 'You knew who made the deepfake.',
    response: 'I recognized the artifacts. Mira\'s signature is in every synthetic pixel. But the distribution? That was someone else.',
  },
];

// Suspects
export const case4Suspects: Suspect[] = [
  {
    id: 'suspect_victim',
    name: 'Danielle "DevDan" Park',
    description: 'Brilliant but controversial developer. Rose to fame debunking tech scams, then became the target of one.',
    alibi: 'N/A',
    isGuilty: false,
    dialogueOptions: victimDialogue,
    notes: 'Posthumous dialogue represents journal entries and saved voice memos.',
  },
  {
    id: 'suspect_ai_artist',
    name: 'Dr. Mira Kovács',
    description: 'Pioneering synthetic media researcher. Her career never recovered after DevDan\'s critical review.',
    alibi: 'Giving a virtual keynote — but presentation was pre-recorded.',
    isGuilty: false,
    dialogueOptions: aiArtistDialogue,
    notes: 'Created the deepfake tools, but didn\'t deploy them. Wanted humiliation, not death.',
  },
  {
    id: 'suspect_mob_leader',
    name: 'Alex Vance / u/NoMoreExcuses',
    description: 'Former journalist turned "accountability activist." Believes any means justify exposing "truth."',
    alibi: 'Livestreaming a "watch party" of the video — but stream could have been looped.',
    isGuilty: true,
    dialogueOptions: mobLeaderDialogue,
    notes: 'Breached Mira\'s server, made the deepfake using her tools, then weaponized his following. Killed DevDan when she threatened to expose him.',
  },
  {
    id: 'suspect_coworker',
    name: 'Jamie Lin',
    description: 'DevDan\'s former coding partner and ex-romantic partner. Quietly resentful of being left behind.',
    alibi: 'Home with spouse — who is also their alibi witness.',
    isGuilty: false,
    dialogueOptions: coworkerDialogue,
    notes: 'Knew about the sedatives, possibly planted evidence, but didn\'t commit murder.',
  },
];

// Case Definition
export const case4: Case = {
  id: 'case_004',
  title: 'Synthetic Outrage',
  dayNumber: 4,
  intro: `The video dropped at 3:17 AM.  
By dawn, 10 million people hated Danielle Park.

The deepfake was perfect — her voice, her face, confessing to every scam she'd ever exposed.  
Her debunking video failed to upload seven times.

Then the doxxing started.  
Then the threats arrived at her door.

They found her at the base of her stairs, a shattered phone in her hand,  
the truth still buffering.

In an age where authenticity is optional,  
who decides what's real enough to destroy a life?`,
  victimName: 'Danielle "DevDan" Park',
  victimDescription: 'Developer martyred by the outrage machine she tried to dismantle.',
  location: 'Her Townhouse Office',
  crimeSceneObjects: case4Objects,
  suspects: case4Suspects,
  clues: case4Clues,
  caseNotes: `TWIST: The mob leader (Alex) is the killer, but Mira created the tools and Jamie provided access. All three are complicit in different ways. The victim saw it coming but couldn't prove it fast enough.`,
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