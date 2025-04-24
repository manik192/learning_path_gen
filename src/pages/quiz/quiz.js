import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./quiz.css";
import Header from "../../components/header/header";
import Loader from "../../components/loader/loader";
import { CircleCheck, CircleX } from "lucide-react";

const Question = ({ questionData, num, style }) => {
  const [attempted, setAttempted] = useState(false);
  return (
    <div className="question" style={style}>
      <h3>
        <span style={{ marginRight: "1ch" }}>{num + "."}</span>
        {questionData.question}
      </h3>
      <div className="flexbox options">
        {questionData.options.map((option, index) => (
          <div className="option" key={index}>
            <input
              type="radio"
              name={"ques" + (num + 1)}
              id={"ques" + (num + 1) + "index" + index}
              className={
                (index === questionData.answerIndex ? "correct" : "wrong") +
                " " +
                (attempted ? "attempted" : "")
              }
              onClick={(e) => {
                if (attempted) {
                  e.preventDefault();
                } else {
                  if (window.numAttmpt === window.numQues - 1) {
                    window.timeTaken = new Date().getTime() - window.startTime;
                  }
                  if (index === questionData.answerIndex) {
                    window.numCorrect++;
                  }
                  window.numAttmpt++;
                  setAttempted(true);
                }
              }}
            />
            <label htmlFor={"ques" + (num + 1) + "index" + index}>
              {option}
            </label>
            {index === questionData.answerIndex ? (
              <CircleCheck className="optionIcon" size={35} strokeWidth={1} color="#00FFE0" />
            ) : (
              <CircleX className="optionIcon" size={35} strokeWidth={1} color="#FF3D00" />
            )}
          </div>
        ))}
        <div className="reason" style={{ display: attempted ? "block" : "none" }}>
          {questionData.reason}
        </div>
      </div>
    </div>
  );
};

const QuizPage = () => {
  const [searchParams] = useSearchParams();
  const [subtopic, setSubtopic] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const course = searchParams.get("topic");
  const weekNum = searchParams.get("week");
  const subtopicNum = searchParams.get("subtopic");

  useEffect(() => {
    const topics = JSON.parse(localStorage.getItem("topics") || "{}");
    const roadmaps = JSON.parse(localStorage.getItem("roadmaps") || "{}");
    const roadmapData = roadmaps[course]?.roadmap || roadmaps[course];

    const weekKey = Object.keys(roadmapData)[weekNum - 1];
    const weekData = roadmapData[weekKey];
    const subtopicData = weekData?.subtopics?.[subtopicNum - 1];

    if (!weekData || !subtopicData) {
      alert("Week or subtopic data not found.");
      return navigate("/");
    }

    setTopic(weekData.topic);
    setSubtopic(subtopicData.subtopic || subtopicData);
    setDescription(subtopicData.description || subtopicData);
  }, [course, weekNum, subtopicNum]);

  useEffect(() => {
    if (!course || !topic || !subtopic || !description) return;

    console.log("📤 Sending to /api/quiz", { course, topic, subtopic, description });

    const quizzes = JSON.parse(localStorage.getItem("quizzes") || "{}");

    if (
      quizzes[course] &&
      quizzes[course][weekNum] &&
      quizzes[course][weekNum][subtopicNum]
    ) {
      setQuestions(quizzes[course][weekNum][subtopicNum]);
      window.numQues = quizzes[course][weekNum][subtopicNum].length;
      window.startTime = new Date().getTime();
      window.numAttmpt = 0;
      window.numCorrect = 0;
      setLoading(false);
      return;
    }

    axios.defaults.baseURL = "http://localhost:5050";
    axios
      .post("/api/quiz", { course, topic, subtopic, description })
      .then((res) => {
        const data = res.data.questions;
        quizzes[course] = quizzes[course] || {};
        quizzes[course][weekNum] = quizzes[course][weekNum] || {};
        quizzes[course][weekNum][subtopicNum] = data;
        localStorage.setItem("quizzes", JSON.stringify(quizzes));

        setQuestions(data);
        window.numQues = data.length;
        window.startTime = new Date().getTime();
        window.numAttmpt = 0;
        window.numCorrect = 0;
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching quiz:", err);
        alert("An error occurred while fetching the quiz.");
      });
  }, [course, topic, subtopic, description]);

  const SubmitButton = () => (
    <div className="submit">
      <button
        className="SubmitButton"
        onClick={() => {
          if (!window.timeTaken) {
            window.timeTaken = new Date().getTime() - window.startTime;
          }

          const quizStats = JSON.parse(localStorage.getItem("quizStats") || "{}");
          quizStats[course] = quizStats[course] || {};
          quizStats[course][weekNum] = quizStats[course][weekNum] || {};
          quizStats[course][weekNum][subtopicNum] = {
            numCorrect: window.numCorrect,
            numQues: window.numQues,
            timeTaken: window.timeTaken,
          };

          let hardnessIndex = parseFloat(localStorage.getItem("hardnessIndex")) || 1;
          hardnessIndex +=
            ((window.numQues - window.numCorrect) / (window.numQues * 2)) *
            (window.timeTaken / (5 * 60 * 1000 * window.numQues));

          localStorage.setItem("quizStats", JSON.stringify(quizStats));
          localStorage.setItem("hardnessIndex", hardnessIndex);
          navigate("/roadmap?topic=" + encodeURIComponent(course));
        }}
      >
        Submit
      </button>
    </div>
  );

  return (
    <div className="quiz_wrapper">
      <Header />
      <Loader style={{ display: loading ? "block" : "none" }}>
        Generating Personalized Questions for You ...
      </Loader>
      <div className="content">
        <h1>{subtopic}</h1>
        <h3 style={{ opacity: "0.61", fontWeight: "300", marginBottom: "2em" }}>
          {description}
        </h3>

        {Array.isArray(questions) ? (
          questions.map((question, index) => (
            <Question key={index} questionData={question} num={index + 1} />
          ))
        ) : (
          <p>No questions found.</p>
        )}

        <SubmitButton />
      </div>
    </div>
  );
};

export default QuizPage;
