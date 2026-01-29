import { Chapter } from '../../../../types/game';

export const day3Chapter: Chapter = {
  dayNumber: 3,
  title: 'Alibis and Lies',
  intro: 'Wednesday. Cracks begin to show.',
  storyText: `You've spent the day verifying alibis. Some hold up. Others... don't.

u/RivalMod's conference alibi checks out - multiple witnesses confirm their presence until 5 AM.

u/NewMod2024's streaming alibi is rock solid - the VOD shows them live the entire night.

u/BannedUser99's IP ban appears genuine - they truly couldn't access the subreddit.

But u/TrustedHelper's alibi is weak. They claim to have been coding alone, but you found no evidence of work during the critical hours.

A witness has come forward with troubling information about the relationship between the victim and TrustedHelper. It seems there was more to their "mentorship" than meets the eye.`,
  crimeSceneObjects: [
    {
      id: 'obj_chat_d3',
      name: 'Private Messages',
      x: 40,
      y: 40,
      width: 18,
      height: 14,
      description: 'Recovered DMs between victim and TrustedHelper. The tone is... complicated.',
      clueId: 'clue_relationship',
    },
    {
      id: 'obj_ban_log_d3',
      name: 'Ban Records',
      x: 65,
      y: 55,
      width: 15,
      height: 12,
      description: 'Complete ban records showing BannedUser99 was IP banned across all devices.',
      clueId: 'clue_ip_log',
    },
  ],
  newClues: [
    {
      id: 'clue_relationship',
      name: 'Secret Relationship',
      description: 'Evidence of a complicated relationship between victim and TrustedHelper',
      found: false,
      linkedTo: 'suspect_insider',
    },
    {
      id: 'clue_ip_log',
      name: 'IP Access Log',
      description: 'BannedUser99 could not have accessed the subreddit - IP ban was effective',
      found: false,
    },
  ],
  witnesses: [
    {
      id: 'witness_friend',
      name: 'u/VictimsFriend',
      description: 'A close friend of the deceased moderator',
      availableOnDay: 3,
      dialogueOptions: [
        {
          id: 'friend_q1',
          text: 'How well did you know the victim?',
          response: 'We talked every day. They confided in me about... everything.',
          nextOptions: ['friend_q1_2'],
        },
        {
          id: 'friend_q1_2',
          text: 'What about their relationship with TrustedHelper?',
          response: 'It was complicated. They were close once, but lately things had soured. Something about trust being broken.',
          isSuspicious: true,
          unlocksClue: 'clue_relationship',
        },
        {
          id: 'friend_q2',
          text: 'Did the victim mention any threats?',
          response: 'Not threats exactly, but they said they discovered something that would "change everything."',
        },
      ],
    },
  ],
  suspectsRevealed: [],
  isAccusationDay: false,
};
