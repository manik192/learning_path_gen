from flask import Flask, request, jsonify
import roadmap
import quiz
import generativeResources
import google.generativeai as genai
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

api = Flask(__name__)
CORS(api)

@api.route("/api/roadmap", methods=["POST"])
def get_roadmap():
    print("📥 /api/roadmap endpoint hit")
    req = request.get_json()
    print("Request data:", req)

    response_body = roadmap.create_roadmap(
        topic=req.get("topic", "Machine Learning"),
        time=req.get("time", "4 weeks"),
        knowledge_level=req.get("knowledge_level", "Absolute Beginner"),
    )

    print("Generated roadmap:", response_body)
    return jsonify(response_body)

@api.route("/api/quiz", methods=["POST"])
def get_quiz():
    req = request.get_json()
    print("Incoming Quiz Request:", req)

    course = req.get("course")
    topic = req.get("topic")
    subtopic = req.get("subtopic")
    description = req.get("description")

    if not (course and topic and subtopic and description):
        return jsonify({"error": "Required Fields not provided"}), 400

    print("getting quiz...")
    response_body = quiz.get_quiz(course, topic, subtopic, description)
    
    return jsonify({"questions": response_body})


@api.route("/api/generate-resource", methods=["POST"])
def generative_resource():
    req = request.get_json()
    req_data = {
        "course": False,
        "knowledge_level": False,
        "description": False,
        "time": False,
    }
    for key in req_data.keys():
        req_data[key] = req.get(key)
        if not req_data[key]:
            return "Required Fields not provided", 400
    print(f"generative resources for {req_data['course']}")
    resources = generativeResources.generate_resources(**req_data)
    return resources

# ✅ New Gemini Chat Endpoint
@api.route('/api/chat', methods=['POST'])
def chat_with_gemini():
    try:
        user_input = request.json.get("message", "")
        if not user_input:
            return jsonify({"reply": "No input provided."}), 400

        model = genai.GenerativeModel("gemini-1.5-pro")
        chat_session = model.start_chat(history=[])

        response = chat_session.send_message(
            f"You are a casual, helpful classmate. Please answer this like a friend, be encouraging but correct.\n\nQuestion: {user_input}"
        )

        cleaned_reply = response.text.strip()
        return jsonify({"reply": cleaned_reply})

    except Exception as e:
        print("❌ Error chatting with Gemini:", e)
        return jsonify({"reply": "Oops, server error!"}), 500

@api.route("/ping")
def ping():
    return "pong"

if __name__ == "__main__":
    api.run(host="0.0.0.0", port=5050)
