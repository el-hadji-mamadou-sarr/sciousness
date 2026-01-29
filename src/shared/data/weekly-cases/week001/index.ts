import { WeeklyCase, Suspect, Clue } from '../../../types/game';
import { day1Chapter } from './chapters/day1';
import { day2Chapter } from './chapters/day2';
import { day3Chapter } from './chapters/day3';
import { day4Chapter } from './chapters/day4';
import { day5Chapter } from './chapters/day5';
import { day6Chapter } from './chapters/day6';
import { day7Chapter } from './chapters/day7';

// All suspects for the weekly case
export const week001Suspects: Suspect[] = [
  {
    id: 'suspect_rival',
    name: 'u/RivalMod',
    description: 'A competing moderator who was passed over for promotion',
    alibi: 'I was at the moderation conference in another subreddit until 5 AM',
    isGuilty: false,
    dialogueOptions: [
      {
        id: 'rival_q1',
        text: 'Where were you the night of the murder?',
        response: 'At the moderation conference. You can check the logs.',
        nextOptions: ['rival_q1_2'],
      },
      {
        id: 'rival_q1_2',
        text: 'Anyone who can verify that?',
        response: 'Several other mods. We were discussing the new rules together.',
      },
      {
        id: 'rival_q2',
        text: 'Did you have any issues with the victim?',
        response: 'Sure, we disagreed on policy. But that is normal in moderation.',
        isSuspicious: false,
      },
    ],
  },
  {
    id: 'suspect_insider',
    name: 'u/TrustedHelper',
    description: 'A longtime helper who had access to all mod tools',
    alibi: 'I was home alone, working on a coding project',
    isGuilty: true,
    dialogueOptions: [
      {
        id: 'insider_q1',
        text: 'What is your relationship with the victim?',
        response: 'We worked together for years. They were like a mentor to me.',
        nextOptions: ['insider_q1_2'],
      },
      {
        id: 'insider_q1_2',
        text: 'So you were close?',
        response: 'Yes... very close. Maybe too close.',
        isSuspicious: true,
        unlocksClue: 'clue_relationship',
      },
      {
        id: 'insider_q2',
        text: 'Do you have an alibi?',
        response: 'I was home alone. Coding. No one can verify it.',
        isSuspicious: true,
      },
    ],
  },
  {
    id: 'suspect_outsider',
    name: 'u/BannedUser99',
    description: 'A former member who was permanently banned last month',
    alibi: 'I was banned! I could not even access the subreddit',
    isGuilty: false,
    dialogueOptions: [
      {
        id: 'outsider_q1',
        text: 'You were banned by the victim, correct?',
        response: 'Yes, and it was unfair! But I would never hurt anyone over Reddit.',
        nextOptions: ['outsider_q1_2'],
      },
      {
        id: 'outsider_q1_2',
        text: 'You seem angry about it',
        response: 'Of course I am! But there are proper channels. I filed an appeal.',
      },
      {
        id: 'outsider_q2',
        text: 'Could you have accessed the subreddit another way?',
        response: 'How? I was IP banned. It is impossible without mod help.',
        unlocksClue: 'clue_ip_log',
      },
    ],
  },
  {
    id: 'suspect_newcomer',
    name: 'u/NewMod2024',
    description: 'A recently promoted moderator, eager and ambitious',
    alibi: 'I was streaming on Twitch. Hundreds of viewers can confirm',
    isGuilty: false,
    dialogueOptions: [
      {
        id: 'newcomer_q1',
        text: 'You were just promoted. Happy about it?',
        response: 'Thrilled! The victim gave me my big break.',
        nextOptions: ['newcomer_q1_2'],
      },
      {
        id: 'newcomer_q1_2',
        text: 'So you had no reason to harm them?',
        response: 'None at all! They were helping me learn the ropes.',
      },
      {
        id: 'newcomer_q2',
        text: 'Where were you at the time of death?',
        response: 'Streaming! Check my VOD - I was live from 10 PM to 3 AM.',
      },
    ],
  },
];

// All clues for the weekly case
export const week001Clues: Clue[] = [
  // Day 1 clues
  {
    id: 'clue_poison_d1',
    name: 'Poison Residue',
    description: 'A toxic substance was found in the victim\'s coffee mug',
    found: false,
    linkedTo: 'suspect_insider',
  },
  {
    id: 'clue_message_d1',
    name: 'Last Message',
    description: 'The victim sent a message saying "I know what you did" before dying',
    found: false,
  },
  // Day 2 clues
  {
    id: 'clue_access_log',
    name: 'Access Log',
    description: 'Shows someone accessed mod tools at 2:47 AM',
    found: false,
    linkedTo: 'suspect_insider',
  },
  // Day 3 clues
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
  // Day 4 clues
  {
    id: 'clue_purchase',
    name: 'Suspicious Purchase',
    description: 'TrustedHelper bought chemicals online 3 days before the murder',
    found: false,
    linkedTo: 'suspect_insider',
  },
  // Day 5 clues
  {
    id: 'clue_false_alibi',
    name: 'Alibi Gap',
    description: 'TrustedHelper\'s coding project had no commits between 1-4 AM',
    found: false,
    linkedTo: 'suspect_insider',
  },
  // Day 6 clues
  {
    id: 'clue_motive',
    name: 'Hidden Motive',
    description: 'TrustedHelper was about to be exposed for rule violations by the victim',
    found: false,
    linkedTo: 'suspect_insider',
  },
];

export const week001Case: WeeklyCase = {
  id: 'weekly_001',
  weekNumber: 1,
  startDate: '2026-01-27',
  title: 'The Moderator\'s Final Ban',
  overallIntro: 'A beloved subreddit moderator has been found dead under mysterious circumstances. As the community reels from the loss, dark secrets begin to surface. You have one week to investigate and bring the killer to justice.',
  victimName: 'u/ModeratorSupreme',
  victimDescription: 'The head moderator of r/TrueDetective, known for their fair but firm moderation style',
  location: 'The Subreddit Mod Lounge',
  chapters: [
    day1Chapter,
    day2Chapter,
    day3Chapter,
    day4Chapter,
    day5Chapter,
    day6Chapter,
    day7Chapter,
  ],
  suspects: week001Suspects,
  allClues: week001Clues,
  guiltySubjectId: 'suspect_insider',
};
