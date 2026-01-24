import { navigateTo, context, requestExpandedMode } from '@devvit/web/client';

const docsLink = document.getElementById('docs-link') as HTMLDivElement;
const playtestLink = document.getElementById('playtest-link') as HTMLDivElement;
const discordLink = document.getElementById('discord-link') as HTMLDivElement;
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const titleElement = document.getElementById('title') as HTMLHeadingElement;

startButton.addEventListener('click', (e) => {
  void requestExpandedMode(e, 'game');
});

docsLink.addEventListener('click', () => {
  navigateTo('https://developers.reddit.com/docs');
});

playtestLink.addEventListener('click', () => {
  navigateTo('https://www.reddit.com/r/Devvit');
});

discordLink.addEventListener('click', () => {
  navigateTo('https://discord.com/invite/R7yu2wh9Qz');
});

function init() {
  titleElement.textContent = 'REDDIT NOIR';

  // Personalize the badge with detective name
  const username = context.username;
  if (username) {
    const badge = document.querySelector('.badge');
    if (badge) {
      badge.textContent = `DETECTIVE ${username.toUpperCase()}`;
    }
  }
}

init();
