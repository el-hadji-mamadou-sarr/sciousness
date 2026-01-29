import { Chapter } from '../../../../shared/types/game';

export const day1Chapter: Chapter = {
  dayNumber: 1,
  title: 'The Fallen Influencer',
  intro: 'Monday morning. A tech influencer lies dead in their smart home.',
  storyText: `The body was discovered at 7:23 AM when the AI assistant stopped responding to commands.

u/TechGuru_Max, the most followed tech reviewer on r/GadgetAddicts with over 2 million subscribers, was found dead in their state-of-the-art smart home studio. The elaborate setup - worth over $500,000 in sponsored equipment - now stands silent.

The victim was known for their brutally honest reviews. Their latest video, scheduled to upload at midnight, was titled "The Scam That Cost Me Everything." It never went live.

Police found the front door unlocked but no signs of forced entry. The smart home logs show someone disabled the security cameras at 2:14 AM. The victim's last tweet, sent at 1:47 AM, simply read: "Some secrets aren't worth keeping."

The tech community is in shock. Rival reviewers, scorned sponsors, and jealous creators all had reasons to want TechGuru_Max silenced permanently.

Examine the crime scene carefully. In this world of gadgets and sponsorships, nothing is as it seems.`,
  crimeSceneObjects: [
    {
      id: 'obj_body_d1',
      name: 'The Victim',
      x: 45,
      y: 35,
      width: 18,
      height: 22,
      description: 'u/TechGuru_Max lies slumped in their gaming chair. No visible wounds - the cause of death is unclear.',
      clueId: 'clue_no_wounds_d1',
    },
    {
      id: 'obj_energy_drink_d1',
      name: 'Energy Drink Can',
      x: 68,
      y: 40,
      width: 8,
      height: 12,
      description: 'A half-finished energy drink from sponsor "VoltBoost". The can feels oddly warm.',
      clueId: 'clue_tampered_drink_d1',
    },
    {
      id: 'obj_computer_d1',
      name: 'Recording Setup',
      x: 25,
      y: 50,
      width: 22,
      height: 18,
      description: 'The video editing software shows a file named "EXPOSÉ_FINAL.mp4" - but the file has been corrupted.',
      clueId: 'clue_deleted_video_d1',
    },
    {
      id: 'obj_phone_d1',
      name: 'Victim\'s Phone',
      x: 75,
      y: 55,
      width: 10,
      height: 8,
      description: 'The phone is locked. Recent notifications show 47 missed calls from someone saved as "DO NOT ANSWER".',
      clueId: 'clue_harassment_d1',
    },
  ],
  newClues: [
    {
      id: 'clue_no_wounds_d1',
      name: 'No Visible Injuries',
      description: 'The victim shows no signs of physical trauma. This suggests poisoning or another subtle method.',
      found: false,
    },
    {
      id: 'clue_tampered_drink_d1',
      name: 'Suspicious Beverage',
      description: 'The energy drink can shows signs of tampering - someone may have added something to it.',
      found: false,
      linkedTo: 'suspect_sponsor',
    },
    {
      id: 'clue_deleted_video_d1',
      name: 'Corrupted Video File',
      description: 'The exposé video was deliberately corrupted. Someone wanted to suppress this content.',
      found: false,
    },
    {
      id: 'clue_harassment_d1',
      name: 'Persistent Caller',
      description: 'Someone desperately tried to reach the victim before their death - 47 missed calls.',
      found: false,
    },
  ],
  witnesses: [
    {
      id: 'witness_ai_assistant',
      name: 'HomeAI System',
      description: 'The smart home AI that monitors all activity in the house',
      availableOnDay: 1,
      dialogueOptions: [
        {
          id: 'ai_q1',
          text: 'What activity did you record last night?',
          response: 'Normal activity until 02:14:07. At that moment, my security protocols were overridden using administrator credentials. Camera feeds went dark.',
          nextOptions: ['ai_q1_2'],
        },
        {
          id: 'ai_q1_2',
          text: 'Who has administrator access?',
          response: 'Only four individuals: the victim, their manager Alexis, their ex-partner Jordan, and the security installer from SmartShield Inc.',
          unlocksClue: 'clue_deleted_video_d1',
        },
        {
          id: 'ai_q2',
          text: 'Did anyone enter the house?',
          response: 'The front door was unlocked remotely at 02:17:22 using the victim\'s phone authentication. However, I detected no motion sensors being triggered inside.',
        },
        {
          id: 'ai_q3',
          text: 'What was the victim doing before the cameras went dark?',
          response: 'Recording video content from 11:47 PM until 01:58 AM. The victim appeared agitated during the final recording session.',
        },
      ],
    },
  ],
  suspectsRevealed: ['suspect_manager'],
  isAccusationDay: false,
};
