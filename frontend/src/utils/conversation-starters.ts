
export const CONVERSATION_STARTERS = [
    "If you could travel anywhere right now, where would you go?",
    "What's the weirdest food you've ever eaten?",
    "Do you believe in aliens?",
    "What's your favorite movie of all time?",
    "If you had a superpower, what would it be?",
    "Cats or Dogs? And why?",
    "What's the last song you listened to?",
    "If you won the lottery tomorrow, what's the first thing you'd buy?",
    "What's a hobby you've always wanted to pick up?",
    "Pineapple on pizza: Yes or No?"
];

export const getRandomStarter = (): string => {
    return CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];
};
