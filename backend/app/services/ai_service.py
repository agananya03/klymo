try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    logger.warning("google.generativeai package not found. AI features disabled.")

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.model = None
        self._initialize()

    def _initialize(self):
        if settings.GEMINI_API_KEY and HAS_GENAI:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                
                # Try verified working models first
                candidates = [
                    'models/gemini-2.5-flash-lite',
                    'models/gemma-3-27b-it',
                    'models/gemini-flash-latest',
                    'models/gemini-2.5-flash',
                ]
                
                for model_name in candidates:
                    try:
                        self.model = genai.GenerativeModel(model_name)
                        pass
                    except:
                        continue

                # Default to a lightweight model
                self.model_name = 'models/gemini-2.5-flash-lite' 
                self.model = genai.GenerativeModel(self.model_name)
                
                logger.info("AIService: Gemini configured.")
            except Exception as e:
                logger.error(f"AIService: Failed to initialize Gemini: {e}")
        else:
            logger.warning("AIService: GEMINI_API_KEY not found or package missing.")

    async def generate_response(self, user_message: str, history: list = None, interests: str = "") -> str:
        if not self.model:
            return "I'm currently offline (API Key missing). Please check back later!"

        # List of backups to try in order
        backups = [
            'models/gemini-2.5-flash-lite',
            'models/gemma-3-27b-it',
            'models/gemini-flash-latest',
            'models/gemini-2.5-flash'
        ]

        for model_name in backups:
            try:
                return await self._generate_attempt(user_message, interests, model_name)
            except Exception as e:
                logger.warning(f"Model {model_name} failed: {e}. Trying next...")
                continue
        
        return "Sorry, I'm overloaded right now (All AI quotas exceeded). Please try again in a minute!"

    async def _generate_attempt(self, user_message: str, interests: str, model_name: str) -> str:
        model = genai.GenerativeModel(model_name)
        
        system_prompt = (
            f"You are a friendly, engaging chat partner. "
            f"The user is interested in: {interests}. "
            f"Your goal is to have a natural, fun conversation based on these interests. "
            f"Keep your responses concise (under 2-3 sentences usually) and informal, like a real text chat. "
            f"Don't be too robotic. Use emojis occasionally."
        )
        
        full_prompt = f"{system_prompt}\n\nUser: {user_message}"
        response = await model.generate_content_async(full_prompt)
        return response.text.strip()


ai_service = AIService()
