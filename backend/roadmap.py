import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables (ensure .env contains GEMINI_API_KEY)
load_dotenv()

# Configure Gemini API key
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def create_roadmap(topic, time, knowledge_level):
    # Define generation config
    generation_config = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
    }

    # Safety settings
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    ]

    # Initialize model
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        generation_config=generation_config,
        safety_settings=safety_settings,
        system_instruction=(
            "You are an AI that generates a weekly roadmap in valid JSON. Each week should include a topic "
            "and subtopics list. Respond strictly in JSON format with lowercase keys only, and avoid wrapping in markdown or commentary."
        ),
    )

    # Start chat session
    chat_session = model.start_chat(history=[])

    # Compose the request message
    message = (
        f"Suggest a roadmap for learning {topic} in {time}. "
        f"My knowledge level is {knowledge_level}. I can spend 16 hours per week. "
        "Only return the response as valid JSON."
    )

    # Get Gemini response
    response = chat_session.send_message(message, stream=False)

    print("🔵 Gemini Raw Response:")
    print(response.text)

    # Clean Markdown triple backticks if present
    def clean_response(text):
        return re.sub(r"^```json\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE | re.MULTILINE).strip()

    cleaned_text = clean_response(response.text)

    try:
        parsed_result = json.loads(cleaned_text)
        print("✅ Parsed JSON Output:")
        print(parsed_result)
        # If Gemini returns a list, wrap it in a "roadmap" key
        if isinstance(parsed_result, list):
            return {"roadmap": parsed_result}

        # If Gemini already returned with a "roadmap" key, return as is
        if isinstance(parsed_result, dict) and "roadmap" in parsed_result:
            return parsed_result

# Fallback
        return {"error": "Unexpected response format from Gemini", "raw": cleaned_text}

    except json.JSONDecodeError as e:
        print("❌ JSON Decode Error:", e)
        return {"error": "Invalid JSON from Gemini", "raw": cleaned_text}
