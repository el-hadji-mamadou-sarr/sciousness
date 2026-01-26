import { navigateTo, context, requestExpandedMode } from '@devvit/web/client';
import type { InitGameResponse } from '../../shared/types/game';

const docsLink = document.getElementById('docs-link') as HTMLDivElement;
const playtestLink = document.getElementById('playtest-link') as HTMLDivElement;
const discordLink = document.getElementById('discord-link') as HTMLDivElement;
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const titleElement = document.getElementById('title') as HTMLHeadingElement;
const caseBadge = document.getElementById('case-badge') as HTMLDivElement;
const caseTitle = document.getElementById('case-title') as HTMLParagraphElement;
const caseDesc = document.getElementById('case-desc') as HTMLParagraphElement;

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

async function loadCaseData(): Promise<void> {
  try {
    const response = await fetch('/api/game/init');
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = (await response.json()) as InitGameResponse;
    const currentCase = data.currentCase;

    // Update case badge with day number
    const dayNum = String(currentCase.dayNumber).padStart(3, '0');
    caseBadge.textContent = `CASE #${dayNum}`;

    // Update case title and description
    caseTitle.textContent = currentCase.title;
    caseDesc.textContent = currentCase.intro;
  } catch (error) {
    console.error('Failed to load case data:', error);
    caseBadge.textContent = 'CASE #???';
    caseTitle.textContent = 'Mystery Awaits';
    caseDesc.textContent = 'A new case is waiting for you to investigate...';
  }
}

function init() {
  titleElement.textContent = 'REDDIT NOIR';
  void loadCaseData();
}

init();
