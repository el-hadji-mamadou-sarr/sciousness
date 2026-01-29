import { Chapter } from '../../../../types/game';

export const day1Chapter: Chapter = {
  dayNumber: 1,
  title: 'The Discovery',
  intro: 'Monday morning. The subreddit is in chaos.',
  storyText: `The body was discovered at 6:12 AM by the overnight AutoMod.

u/ModeratorSupreme, the most respected moderator on r/TrueDetective, was found slumped over their keyboard in the virtual Mod Lounge. The coffee mug beside them had tipped over, its contents spilled across the desk.

Initial reports suggest foul play. The victim's last activity was at 3:47 AM - a cryptic modmail that simply read: "I know what you did."

The subreddit has been locked pending investigation. Community members are demanding answers.

Your investigation begins now. Examine the crime scene carefully - every detail matters.`,
  crimeSceneObjects: [
    {
      id: 'obj_body_d1',
      name: 'The Victim',
      x: 50,
      y: 30,
      width: 20,
      height: 25,
      description: 'u/ModeratorSupreme lies motionless. Their expression suggests they knew their attacker.',
      clueId: 'clue_poison_d1',
    },
    {
      id: 'obj_coffee_d1',
      name: 'Coffee Mug',
      x: 70,
      y: 35,
      width: 10,
      height: 10,
      description: 'A half-empty coffee mug with an unusual residue at the bottom.',
      clueId: 'clue_poison_d1',
    },
    {
      id: 'obj_screen_d1',
      name: 'Computer Screen',
      x: 50,
      y: 55,
      width: 25,
      height: 20,
      description: 'The screen shows an unsent modmail: "I know what you did."',
      clueId: 'clue_message_d1',
    },
  ],
  newClues: [
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
  ],
  witnesses: [
    {
      id: 'witness_automod',
      name: 'AutoModerator',
      description: 'The automated system that discovered the body',
      availableOnDay: 1,
      dialogueOptions: [
        {
          id: 'automod_q1',
          text: 'What exactly did you observe?',
          response: 'At 06:12:33 I detected no moderator activity for 3 hours. Protocol required a wellness check. The user was unresponsive.',
          nextOptions: ['automod_q1_2'],
        },
        {
          id: 'automod_q1_2',
          text: 'Did you log any unusual activity before that?',
          response: 'Affirmative. At 02:47:19, mod tools were accessed from an unusual session. At 03:47:02, the victim sent their final modmail.',
          unlocksClue: 'clue_message_d1',
        },
        {
          id: 'automod_q2',
          text: 'Who else was active that night?',
          response: 'Three moderators were logged in between midnight and 4 AM. I can provide session logs.',
        },
      ],
    },
  ],
  suspectsRevealed: [],
  isAccusationDay: false,
};
