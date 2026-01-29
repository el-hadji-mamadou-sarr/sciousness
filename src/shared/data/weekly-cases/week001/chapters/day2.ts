import { Chapter } from '../../../../types/game';

export const day2Chapter: Chapter = {
  dayNumber: 2,
  title: 'The Suspects Emerge',
  intro: 'Tuesday. The investigation deepens.',
  storyText: `The toxicology report is in. The poison was a rare compound - not something you could simply buy at a store. Whoever did this had knowledge and access.

You've identified four individuals with potential motive and opportunity:

- u/RivalMod: A competing moderator passed over for promotion
- u/TrustedHelper: A longtime helper with full mod tool access
- u/BannedUser99: Recently permabanned by the victim
- u/NewMod2024: An ambitious newcomer the victim was mentoring

The mod access logs from that night have been recovered. Someone accessed the tools at 2:47 AM - but who?

Today you can begin interrogating the suspects. Choose your questions carefully.`,
  crimeSceneObjects: [
    {
      id: 'obj_logs_d2',
      name: 'Access Logs',
      x: 30,
      y: 45,
      width: 15,
      height: 12,
      description: 'Server logs showing mod tool access at 2:47 AM. The IP is partially masked.',
      clueId: 'clue_access_log',
    },
    {
      id: 'obj_calendar_d2',
      name: 'Mod Calendar',
      x: 75,
      y: 50,
      width: 15,
      height: 12,
      description: 'A moderation schedule. The victim had a meeting planned with TrustedHelper the next morning.',
    },
  ],
  newClues: [
    {
      id: 'clue_access_log',
      name: 'Access Log',
      description: 'Shows someone accessed mod tools at 2:47 AM',
      found: false,
      linkedTo: 'suspect_insider',
    },
  ],
  witnesses: [
    {
      id: 'witness_cleaner',
      name: 'u/NightOwlMod',
      description: 'A moderator who works the late night shift',
      availableOnDay: 2,
      dialogueOptions: [
        {
          id: 'cleaner_q1',
          text: 'Were you active that night?',
          response: 'Yes, I was handling the late night queue. Left around 2 AM - everything seemed normal.',
          nextOptions: ['cleaner_q1_2'],
        },
        {
          id: 'cleaner_q1_2',
          text: 'Did you see anyone else?',
          response: 'I saw TrustedHelper online when I logged off. They said they were working on something important.',
          isSuspicious: true,
        },
        {
          id: 'cleaner_q2',
          text: 'How was the victim that night?',
          response: 'Seemed stressed. Mentioned they had discovered something troubling about a trusted member.',
          unlocksClue: 'clue_access_log',
        },
      ],
    },
  ],
  suspectsRevealed: ['suspect_rival', 'suspect_insider', 'suspect_outsider', 'suspect_newcomer'],
  isAccusationDay: false,
};
