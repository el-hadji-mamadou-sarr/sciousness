import { Case } from '../types/game';

// Sample case for MVP
export const CASE_001: Case = {
  id: 'case_001',
  title: "The Moderator's Last Ban",
  dayNumber: 1,
  intro:
    "A prominent subreddit moderator has been found dead in their home office. The community is in shock. As the detective assigned to this case, you must examine the crime scene, interrogate the suspects, and find the killer.",
  victimName: 'u/ModeratorMax',
  victimDescription:
    'Senior moderator of r/MysteryLovers, known for strict rule enforcement',
  location: 'Home Office',
  crimeSceneObjects: [
    {
      id: 'obj_desk',
      name: 'Desk',
      x: 50,
      y: 60,
      width: 30,
      height: 15,
      description:
        'A cluttered desk with multiple monitors. Papers are scattered everywhere.',
      clueId: 'clue_threat_letter',
    },
    {
      id: 'obj_keyboard',
      name: 'Broken Keyboard',
      x: 45,
      y: 55,
      width: 12,
      height: 5,
      description:
        'A mechanical keyboard, clearly smashed. Some keys are missing. The last typed message reads: "I know what you did in..."',
      clueId: 'clue_message',
    },
    {
      id: 'obj_coffee',
      name: 'Coffee Mug',
      x: 65,
      y: 50,
      width: 6,
      height: 8,
      description:
        'A cold cup of coffee. There appears to be an unusual residue at the bottom. Poison?',
      clueId: 'clue_poison',
    },
    {
      id: 'obj_phone',
      name: 'Smartphone',
      x: 75,
      y: 58,
      width: 5,
      height: 10,
      description:
        "The victim's phone. The last call was from an unknown number at 11:47 PM.",
      clueId: 'clue_phone',
    },
    {
      id: 'obj_window',
      name: 'Window',
      x: 85,
      y: 30,
      width: 12,
      height: 25,
      description:
        'The window is slightly open. Fresh mud tracks lead from outside to the desk.',
      clueId: 'clue_mudtracks',
    },
    {
      id: 'obj_body',
      name: 'Victim',
      x: 35,
      y: 70,
      width: 15,
      height: 20,
      description:
        'The victim lies slumped over. No visible wounds, but their face shows signs of distress.',
    },
  ],
  suspects: [
    {
      id: 'suspect_banned',
      name: 'u/BannedForever',
      description:
        'A user who was permanently banned last week for harassment. Has been sending angry DMs.',
      alibi: 'Claims to have been at a bar with friends until midnight.',
      isGuilty: false,
      dialogueOptions: [
        {
          id: 'banned_1',
          text: 'Where were you last night?',
          response:
            "I was at O'Malley's Bar until midnight. You can check with the bartender, Jake. He knows me.",
          nextOptions: ['banned_2', 'banned_3'],
        },
        {
          id: 'banned_2',
          text: "You sent threatening messages to the victim. Why?",
          response:
            "Yeah, I was angry about the ban. But sending mean DMs is different from killing someone! I just wanted to vent.",
          unlocksClue: 'clue_threats',
          nextOptions: ['banned_4'],
        },
        {
          id: 'banned_3',
          text: 'Did you know about the victim\'s "secret"?',
          response:
            "What secret? I just knew they were a power-tripping mod who banned anyone they didn't like.",
        },
        {
          id: 'banned_4',
          text: 'Would you kill over a Reddit ban?',
          response:
            "What? No! It's just a website. I made a new account anyway. Why would I risk prison over fake internet points?",
        },
      ],
    },
    {
      id: 'suspect_comod',
      name: 'u/CoModeratorSam',
      description:
        'Fellow moderator who had a public disagreement with the victim about moderation policies.',
      alibi: 'Says they were asleep at home, alone.',
      isGuilty: true,
      dialogueOptions: [
        {
          id: 'comod_1',
          text: 'Where were you last night?',
          response:
            'I was home, asleep by 10 PM. I had a long day of... moderating. You know how it is.',
          isSuspicious: true,
          nextOptions: ['comod_2', 'comod_3'],
        },
        {
          id: 'comod_2',
          text: 'I heard you argued with the victim recently.',
          response:
            "Just a minor disagreement about automod rules. Nothing serious. We were colleagues, not enemies.",
          nextOptions: ['comod_4'],
        },
        {
          id: 'comod_3',
          text: 'Do you own any gardening supplies?',
          response:
            'I... yes, I have a small garden. Why do you ask? What does that have to do with anything?',
          isSuspicious: true,
          unlocksClue: 'clue_garden',
        },
        {
          id: 'comod_4',
          text: 'The victim was about to reveal something. What was it?',
          response:
            "I don't know what you're talking about. Max was paranoid, always thinking people were out to get them.",
          isSuspicious: true,
          unlocksClue: 'clue_secret',
        },
      ],
    },
    {
      id: 'suspect_ex',
      name: 'u/ExPartner_2019',
      description: "The victim's ex-partner from 3 years ago. Recently reconnected.",
      alibi: 'Was at a movie theater watching the late show.',
      isGuilty: false,
      dialogueOptions: [
        {
          id: 'ex_1',
          text: 'Where were you last night?',
          response:
            "At the Cineplex watching that new horror movie. I have the ticket stub if you need it. The 11 PM showing.",
          nextOptions: ['ex_2', 'ex_3'],
        },
        {
          id: 'ex_2',
          text: 'Why did you reconnect with the victim?',
          response:
            'We ended on good terms years ago. Max reached out last month wanting to talk about something important. We were supposed to meet this weekend.',
          unlocksClue: 'clue_meeting',
        },
        {
          id: 'ex_3',
          text: 'What was your relationship like?',
          response:
            "We dated for 2 years in college. Grew apart, no drama. Max was always obsessed with Reddit though. I couldn't compete with r/all.",
        },
      ],
    },
  ],
  clues: [
    {
      id: 'clue_threat_letter',
      name: 'Threatening Letter',
      description:
        'A printed letter on the desk reads: "You will pay for what you did. Your time as mod is over." No signature.',
      found: false,
    },
    {
      id: 'clue_message',
      name: 'Last Message',
      description:
        'The broken keyboard shows a partial message: "I know what you did in the mod logs..."',
      found: false,
      linkedTo: 'suspect_comod',
    },
    {
      id: 'clue_poison',
      name: 'Poisoned Coffee',
      description:
        'Lab analysis confirms the coffee contained a plant-based toxin. Someone with botanical knowledge prepared this.',
      found: false,
      linkedTo: 'suspect_comod',
    },
    {
      id: 'clue_phone',
      name: 'Last Phone Call',
      description:
        'Phone records show the last call came from a burner phone. Duration: 3 minutes.',
      found: false,
    },
    {
      id: 'clue_mudtracks',
      name: 'Mud Tracks',
      description:
        'Fresh mud near the window. The mud contains traces of fertilizer commonly used in home gardens.',
      found: false,
      linkedTo: 'suspect_comod',
    },
    {
      id: 'clue_threats',
      name: 'Angry DMs',
      description:
        "Screenshots of threatening DMs from u/BannedForever. Angry but no specific plans mentioned.",
      found: false,
    },
    {
      id: 'clue_garden',
      name: 'Garden Connection',
      description:
        'u/CoModeratorSam has a garden with plants that could produce the toxin found in the coffee.',
      found: false,
      linkedTo: 'suspect_comod',
    },
    {
      id: 'clue_secret',
      name: "The Victim's Secret",
      description:
        'The victim discovered that u/CoModeratorSam was secretly manipulating vote counts and was about to report them.',
      found: false,
      linkedTo: 'suspect_comod',
    },
    {
      id: 'clue_meeting',
      name: 'Planned Meeting',
      description:
        'The victim had planned to meet their ex to share concerns about another moderator.',
      found: false,
    },
  ],
};

export const ALL_CASES: Case[] = [CASE_001];

export const getCurrentCase = (): Case => {
  // For MVP, always return the first case
  return CASE_001;
};
