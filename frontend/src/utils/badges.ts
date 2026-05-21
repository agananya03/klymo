export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  criteria: string;
}

export interface KlymoStats {
  totalChats: number;
  totalMessages: number;
  chattedInterests: string[];
  ratingsCountOfFive: number;
  hasCompletedNightChat: boolean;
  hasChattedDifferentRegion: boolean;
  dailyChallengesCompleted: number;
}

export const BADGES: Badge[] = [
  {
    id: 'conversationalist',
    name: 'Conversationalist',
    emoji: '🗣️',
    description: 'Complete 10 total chats',
    criteria: 'Complete 10 chats (each lasting at least 2 minutes)'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    emoji: '🦉',
    description: 'Complete a chat between 12am–4am local time',
    criteria: 'Complete a chat where the local time is between 12:00 AM and 4:00 AM'
  },
  {
    id: 'topic_explorer',
    name: 'Topic Explorer',
    emoji: '🧭',
    description: 'Chat with 5 different interest tags',
    criteria: 'Complete chats with 5 unique interest tags selected'
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    emoji: '🔥',
    description: 'Reach a 10-chat weekly streak',
    criteria: 'Reach a 10-chat weekly streak'
  },
  {
    id: 'highly_rated',
    name: 'Highly Rated',
    emoji: '⭐',
    description: 'Receive 5-star rating 3 times',
    criteria: 'Receive a 5-star rating from partners 3 times'
  },
  {
    id: 'globe_trotter',
    name: 'Globe Trotter',
    emoji: '🌍',
    description: 'Chat with someone from a different language/region',
    criteria: 'Chat with a partner who has a different browser language/region'
  },
  {
    id: 'first_timer',
    name: 'First Timer',
    emoji: '🎯',
    description: 'Complete your very first chat',
    criteria: 'Complete your first ever chat session (lasting at least 2 minutes)'
  },
  {
    id: 'chatterbox',
    name: 'Chatterbox',
    emoji: '💬',
    description: 'Send 100 total messages',
    criteria: 'Send a total of 100 messages across all chats'
  },
  {
    id: 'daily_challenger',
    name: 'Daily Challenger',
    emoji: '📅',
    description: 'Complete 3 daily challenge chats',
    criteria: 'Complete 3 chats started from the Daily Challenge card (each lasting at least 2 minutes)'
  }
];

export function getInitialStats(): KlymoStats {
  return {
    totalChats: 0,
    totalMessages: 0,
    chattedInterests: [],
    ratingsCountOfFive: 0,
    hasCompletedNightChat: false,
    hasChattedDifferentRegion: false,
    dailyChallengesCompleted: 0
  };
}

export function loadStats(): KlymoStats {
  if (typeof window === 'undefined') return getInitialStats();
  const raw = localStorage.getItem('klymo_stats');
  if (!raw) return getInitialStats();
  try {
    const parsed = JSON.parse(raw);
    return {
      ...getInitialStats(),
      ...parsed
    };
  } catch (e) {
    console.error("Failed to parse klymo_stats", e);
    return getInitialStats();
  }
}

export function saveStats(stats: KlymoStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('klymo_stats', JSON.stringify(stats));
}

export function loadBadges(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('klymo_badges');
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch (e) {
    console.error("Failed to parse klymo_badges", e);
    return [];
  }
}

export function saveBadges(badges: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('klymo_badges', JSON.stringify(badges));
}

export function evaluateBadges(stats: KlymoStats, currentStreak: number): string[] {
  const earned: string[] = [];

  // 1. Conversationalist
  if (stats.totalChats >= 10) {
    earned.push('conversationalist');
  }

  // 2. Night Owl
  if (stats.hasCompletedNightChat) {
    earned.push('night_owl');
  }

  // 3. Topic Explorer
  if (stats.chattedInterests.length >= 5) {
    earned.push('topic_explorer');
  }

  // 4. Streak Master
  if (currentStreak >= 10) {
    earned.push('streak_master');
  }

  // 5. Highly Rated
  if (stats.ratingsCountOfFive >= 3) {
    earned.push('highly_rated');
  }

  // 6. Globe Trotter
  if (stats.hasChattedDifferentRegion) {
    earned.push('globe_trotter');
  }

  // 7. First Timer
  if (stats.totalChats >= 1) {
    earned.push('first_timer');
  }

  // 8. Chatterbox
  if (stats.totalMessages >= 100) {
    earned.push('chatterbox');
  }

  // 9. Daily Challenger
  if (stats.dailyChallengesCompleted >= 3) {
    earned.push('daily_challenger');
  }

  return earned;
}
