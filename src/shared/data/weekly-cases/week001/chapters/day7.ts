import { Chapter } from '../../../../types/game';

export const day7Chapter: Chapter = {
  dayNumber: 7,
  title: 'Judgment Day',
  intro: 'Sunday. The moment of truth.',
  storyText: `The investigation is complete. You've gathered all the evidence, interviewed all the witnesses, and uncovered the dark truth behind this murder.

Here's what you know:

- The victim was poisoned with a rare compound
- That compound was purchased and delivered to TrustedHelper
- TrustedHelper's alibi has a 3-hour gap during the time of death
- The victim was about to expose TrustedHelper's rule violations
- TrustedHelper had both motive and opportunity

The other suspects have solid alibis:
- RivalMod was verified at a conference
- NewMod2024 was streaming live
- BannedUser99 was IP banned and couldn't access the subreddit

It's time to make your accusation. Choose wisely - there's only one chance to bring the killer to justice.

WHO KILLED u/ModeratorSupreme?`,
  crimeSceneObjects: [],
  newClues: [],
  witnesses: [],
  suspectsRevealed: [],
  isAccusationDay: true,
};
