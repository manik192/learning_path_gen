import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def clean_response(text):
    """Remove any markdown-style code blocks or formatting."""
    return re.sub(r"^```json\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE | re.MULTILINE).strip()

def get_quiz(course, topic, subtopic, description):
    generation_config = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
        "response_mime_type": "application/json",
    }

    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    ]

    prompt = f"""
    You are an AI assistant that generates multiple-choice quizzes.
    Each quiz should test the user's understanding of a subtopic.
    Use the topic and its description to generate meaningful, challenging questions.

    Course: {course}
    Topic: {topic}
    Subtopic: {subtopic}
    Description: {description}

    Each question must include:
    - "question": a string,
    - "options": an array of 4 strings,
    - "answerIndex": the index (0–3) of the correct option,
    - "reason": a short explanation for the correct answer.

    Output strictly in this JSON format:
    {{
      "questions": [
        {{
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "answerIndex": 0,
          "reason": "..."
        }}
      ]
    }}

    Do NOT include any markdown, headings, or code blocks.
    """

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        safety_settings=safety_settings,
        generation_config=generation_config,
        system_instruction="You are a quiz-generating AI. Always respond with well-structured JSON, no markdown formatting."
    )

    chat_session = model.start_chat(history=[])

    response = chat_session.send_message(prompt, stream=False)

    print("📥 Raw Gemini Response:")
    print(response.text)

    cleaned = clean_response(response.text)

    try:
        parsed = json.loads(cleaned)
        if "questions" in parsed and isinstance(parsed["questions"], list):
            return parsed["questions"]
        else:
            print("❗ Unexpected structure in response. Returning raw object.")
            return [parsed]
    except json.JSONDecodeError as e:
        print("❌ JSON Decode Error:", e)
        return [{
            "question": "Failed to generate quiz due to an error.",
            "options": ["Try again later", "Try again later", "Try again later", "Try again later"],
            "answerIndex": 0,
            "reason": "Gemini returned an invalid format. Try refreshing the page."
        }]
