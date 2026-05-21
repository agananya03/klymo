export interface DailyChallenge {
    id: number;
    topic: string;
    emoji: string;
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
    { id: 1, topic: "What's one thing you'd change about the world?", emoji: "🌍" },
    { id: 2, topic: "Describe your perfect day in 3 sentences.", emoji: "☀️" },
    { id: 3, topic: "What's a skill you wish you had?", emoji: "🪄" },
    { id: 4, topic: "Hot take: share an opinion most people disagree with.", emoji: "🔥" },
    { id: 5, topic: "What's the most interesting place you've ever been?", emoji: "🧭" },
    { id: 6, topic: "If you could have dinner with any historical figure, who would it be?", emoji: "🍽️" },
    { id: 7, topic: "What's the best piece of advice you've ever received?", emoji: "💡" },
    { id: 8, topic: "If you could instantly speak any language, which would you choose?", emoji: "🗣️" },
    { id: 9, topic: "What's a book or movie that completely changed your perspective?", emoji: "📖" },
    { id: 10, topic: "If you could time travel, would you go to the past or the future?", emoji: "⏳" },
    { id: 11, topic: "What's your absolute favorite comfort food?", emoji: "🍕" },
    { id: 12, topic: "What's the most useless talent you have?", emoji: "🎭" },
    { id: 13, topic: "If you had to live in another decade, which one would you choose?", emoji: "📻" },
    { id: 14, topic: "What's the biggest risk you've ever taken?", emoji: "🎲" },
    { id: 15, topic: "Would you rather explore the deep ocean or outer space?", emoji: "🚀" },
    { id: 16, topic: "What's a song that always puts you in a good mood?", emoji: "🎵" },
    { id: 17, topic: "If you could only eat one meal for the rest of your life, what would it be?", emoji: "🍲" },
    { id: 18, topic: "What is your earliest childhood memory?", emoji: "🧸" },
    { id: 19, topic: "Would you rather have unlimited time or unlimited money?", emoji: "💵" },
    { id: 20, topic: "What's the most unusual job you can think of?", emoji: "💼" },
    { id: 21, topic: "What's something you're looking forward to this month?", emoji: "🗓️" },
    { id: 22, topic: "If you could become any animal for a day, which one and why?", emoji: "🦁" },
    { id: 23, topic: "What's a topic you could talk about for hours without getting tired?", emoji: "💬" },
    { id: 24, topic: "What's the coolest thing you've ever bought for under $50?", emoji: "🏷️" },
    { id: 25, topic: "Would you rather live in a bustling city or a quiet cabin?", emoji: "🏡" },
    { id: 26, topic: "What's your favorite way to unwind after a long day?", emoji: "🛁" },
    { id: 27, topic: "If you were to write a book, what genre would it be?", emoji: "✍️" },
    { id: 28, topic: "What's the most adventurous thing on your bucket list?", emoji: "⛰️" },
    { id: 29, topic: "What's something you believe is highly underrated?", emoji: "⭐" },
    { id: 30, topic: "If you could trade lives with anyone for a day, who would it be?", emoji: "👥" },
    { id: 31, topic: "What's a mystery you'd love to know the answer to?", emoji: "🔍" }
];

export const DAILY_GRADIENTS = [
    "from-yellow-300 to-pink-400",
    "from-cyan-300 to-blue-400",
    "from-green-300 to-yellow-300",
    "from-purple-300 to-pink-300",
    "from-red-300 to-orange-300",
    "from-teal-300 to-emerald-400",
    "from-orange-300 to-amber-400",
    "from-fuchsia-300 to-pink-400",
    "from-indigo-300 to-cyan-400",
    "from-rose-300 to-red-400"
];

export function getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime() + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

export function getDailyChallenge(date: Date = new Date()): DailyChallenge {
    const day = getDayOfYear(date);
    const year = date.getFullYear();
    const idx = (year + day) % DAILY_CHALLENGES.length;
    return DAILY_CHALLENGES[idx];
}

export function getDailyGradient(date: Date = new Date()): string {
    const day = getDayOfYear(date);
    const idx = day % DAILY_GRADIENTS.length;
    return DAILY_GRADIENTS[idx];
}

export function getCountdownToNextDayUTC(): string {
    const now = new Date();
    const nextDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
    const diffMs = nextDay.getTime() - now.getTime();
    
    if (diffMs <= 0) return "00:00:00";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
