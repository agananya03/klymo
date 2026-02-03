
// Simple heuristic-based toxicity detection (Simulating AI model)
// In production, this would use TensorFlow.js or an API

const TOXIC_PATTERNS = [
    /\b(hate|kill|stupid|idiot|ugly|fat|die)\b/i,
    /\b(fuck|shit|bitch|ass|cunt)\b/i,
    // Add more patterns as needed for demo
];

export const analyzeToxicity = async (text: string): Promise<{ isToxic: boolean; score: number; reason?: string }> => {
    // Simulate async AI processing
    await new Promise(resolve => setTimeout(resolve, 50));

    for (const pattern of TOXIC_PATTERNS) {
        if (pattern.test(text)) {
            return {
                isToxic: true,
                score: 0.9,
                reason: "Potential offensive language detected"
            };
        }
    }

    return { isToxic: false, score: 0.1 };
};
