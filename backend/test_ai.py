import google.generativeai as genai
import os
import sys

print("--------------------------------------------------")
print("DIAGNOSTIC TEST START")
print("--------------------------------------------------")

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in environment")
    sys.exit(1)

print(f"API Key found: {api_key[:5]}...{api_key[-5:]}")

try:
    genai.configure(api_key=api_key)
    print("GenAI Configured. Listing models...")
    
    found_any = False
    for m in genai.list_models():
        print(f"Found Model: {m.name}")
        print(f" - Supported Methods: {m.supported_generation_methods}")
        
        if 'generateContent' in m.supported_generation_methods:
            print(f" -> Testing generateContent on {m.name}...")
            try:
                model = genai.GenerativeModel(m.name)
                # Synchronous generation for testing
                response = model.generate_content("Hello")
                print(f" -> SUCCESS! {m.name} is working.")
                print(f" -> Response: {response.text}")
                found_any = True
            except Exception as e:
                print(f" -> FAILED: {m.name} - Error: {e}")
        else:
            print(f" -> Skipping (generateContent not supported)")
        print("---")

    if not found_any:
        print("CRITICAL: No working models found for generateContent.")

except Exception as e:
    print(f"CRITICAL ERROR: {e}")

print("--------------------------------------------------")
print("DIAGNOSTIC TEST END")
print("--------------------------------------------------")
