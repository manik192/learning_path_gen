from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load API Key
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message", "")

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    model = genai.GenerativeModel("gemini-2.0-pro")

    try:
        response = model.generate_content(
            f"You are a helpful and friendly classmate. Reply casually and informally.\n\nUser: {user_input}\n\nResponse:"
        )
        text = response.text.strip()
        return jsonify({"reply": text})
    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": "Failed to generate response"}), 500

if __name__ == "__main__":
    app.run(port=5050)
