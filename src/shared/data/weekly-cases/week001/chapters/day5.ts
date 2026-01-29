import { Chapter } from '../../../../types/game';

export const day5Chapter: Chapter = {
  dayNumber: 5,
  title: 'The Alibi Crumbles',
  intro: 'Friday. The truth emerges.',
  storyText: `TrustedHelper claimed to be coding all night. But code doesn't lie.

You've obtained access to their GitHub activity. Between 1 AM and 4 AM on the night of the murder, there wasn't a single commit, push, or pull request. Three hours of supposed "intense coding" with no digital footprint.

When confronted, TrustedHelper changed their story. "I was debugging," they claimed. "No commits needed."

But the timestamps tell a different story. Their last keystroke was at 1:02 AM. They didn't touch their computer again until 4:17 AM - after the estimated time of death.

The evidence is mounting. But is it enough?`,
  crimeSceneObjects: [
    {
      id: 'obj_github_d5',
      name: 'GitHub Activity',
      x: 45,
      y: 40,
      width: 20,
      height: 16,
      description: 'A timeline of coding activity. There is a suspicious gap from 1-4 AM.',
      clueId: 'clue_false_alibi',
    },
    {
      id: 'obj_keystroke_d5',
      name: 'Keystroke Log',
      x: 70,
      y: 55,
      width: 15,
      height: 12,
      description: 'Computer activity logs. Last activity: 1:02 AM. Next activity: 4:17 AM.',
    },
  ],
  newClues: [
    {
      id: 'clue_false_alibi',
      name: 'Alibi Gap',
      description: 'TrustedHelper\'s coding project had no commits between 1-4 AM',
      found: false,
      linkedTo: 'suspect_insider',
    },
  ],
  witnesses: [
    {
      id: 'witness_tech',
      name: 'u/TechForensics',
      description: 'A digital forensics expert',
      availableOnDay: 5,
      dialogueOptions: [
        {
          id: 'tech_q1',
          text: 'What does the evidence show?',
          response: 'The gap in activity is highly suspicious. Three hours with no digital footprint during claimed work.',
          nextOptions: ['tech_q1_2'],
        },
        {
          id: 'tech_q1_2',
          text: 'Could they have been working offline?',
          response: 'Possible but unlikely. Modern coding tools leave traces. This looks like they weren\'t at their computer.',
          isSuspicious: true,
          unlocksClue: 'clue_false_alibi',
        },
        {
          id: 'tech_q2',
          text: 'Any signs of evidence tampering?',
          response: 'Yes - someone tried to modify timestamps on several files last night. Amateur job.',
        },
      ],
    },
  ],
  suspectsRevealed: [],
  isAccusationDay: false,
};
