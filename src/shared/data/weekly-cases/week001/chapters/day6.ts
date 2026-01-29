import { Chapter } from '../../../../types/game';

export const day6Chapter: Chapter = {
  dayNumber: 6,
  title: 'The Motive Revealed',
  intro: 'Saturday. The final piece falls into place.',
  storyText: `You've discovered the motive.

Deep in the victim's private files, you found a draft report. It was scheduled to be published Monday morning - the day after the murder.

The report detailed extensive rule violations by TrustedHelper: vote manipulation, abusing mod powers for personal gain, and harassment of users under alt accounts. The evidence was damning. TrustedHelper would have been not just removed from the mod team, but likely banned from Reddit entirely.

The victim had given TrustedHelper a chance to come clean. That meeting scheduled for Monday? It was an ultimatum: confess or be exposed.

TrustedHelper chose a third option.

Tomorrow is your chance to make the accusation. Review all evidence carefully before Sunday.`,
  crimeSceneObjects: [
    {
      id: 'obj_report_d6',
      name: 'Draft Report',
      x: 50,
      y: 35,
      width: 20,
      height: 18,
      description: 'A detailed report documenting TrustedHelper\'s rule violations. Never published.',
      clueId: 'clue_motive',
    },
    {
      id: 'obj_email_d6',
      name: 'Private Email',
      x: 30,
      y: 55,
      width: 18,
      height: 14,
      description: 'An email from victim to TrustedHelper: "We need to talk. Monday. Last chance."',
    },
  ],
  newClues: [
    {
      id: 'clue_motive',
      name: 'Hidden Motive',
      description: 'TrustedHelper was about to be exposed for rule violations by the victim',
      found: false,
      linkedTo: 'suspect_insider',
    },
  ],
  witnesses: [
    {
      id: 'witness_admin',
      name: 'u/RedditAdmin',
      description: 'A Reddit administrator who received a copy of the report',
      availableOnDay: 6,
      dialogueOptions: [
        {
          id: 'admin_q1',
          text: 'Did you receive the victim\'s report?',
          response: 'A draft was sent to us the night before the murder. It detailed serious violations.',
          nextOptions: ['admin_q1_2'],
        },
        {
          id: 'admin_q1_2',
          text: 'What kind of violations?',
          response: 'Vote manipulation, harassment, abuse of power. Enough for a permanent sitewide ban.',
          isSuspicious: true,
          unlocksClue: 'clue_motive',
        },
        {
          id: 'admin_q2',
          text: 'Did TrustedHelper know about the report?',
          response: 'The victim told us they\'d given the accused a chance to confess first. They knew.',
        },
      ],
    },
  ],
  suspectsRevealed: [],
  isAccusationDay: false,
};
