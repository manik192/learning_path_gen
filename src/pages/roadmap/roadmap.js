import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./roadmap.css";
import Header from "../../components/header/header";
import Loader from "../../components/loader/loader";
import Modal from "../../components/modal/modal";
import { ChevronRight } from "lucide-react";
import Markdown from "react-markdown";
import ConfettiExplosion from "react-confetti-explosion";

const RoadmapPage = () => {
  const [resources, setResources] = useState(null);
  const [resourceParam, setResourceParam] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [roadmap, setRoadmap] = useState({});
  const [topicDetails, setTopicDetails] = useState({});
  const [quizStats, setQuizStats] = useState({});
  const [confettiExplode, setConfettiExplode] = useState(false);
  const navigate = useNavigate();
  const topic = searchParams.get("topic");

  useEffect(() => {
    if (!topic) return navigate("/");
    const topics = JSON.parse(localStorage.getItem("topics") || "{}");
    const roadmaps = JSON.parse(localStorage.getItem("roadmaps") || "{}");
    if (!roadmaps[topic] || !topics[topic]) return navigate("/");
    setTopicDetails(topics[topic]);
    let rawRoadmap = roadmaps[topic].roadmap || roadmaps[topic];
    if (Array.isArray(rawRoadmap)) {
      const converted = {};
      rawRoadmap.forEach((entry, index) => {
        converted[`week ${index + 1}`] = {
          topic: entry.topic,
          subtopics: (entry.subtopics || []).map((s) => {
            if (typeof s === "string") {
              return {
                subtopic: s.split(":")[0]?.trim() || "Untitled",
                description: s,
                time: "1 hour",
              };
            }
            return s;
          }),
        };
      });
      rawRoadmap = converted;
    }
    setRoadmap(rawRoadmap);
      const stats = JSON.parse(localStorage.getItem("quizStats") || "{}");
    setQuizStats(stats[topic] || {});
  }, [topic]);

  const colors = ["#D14EC4", "#4ED1B1", "#D14E4E", "#4EAAD1", "#D1854E", "#904ED1", "#AFD14E"];

  const Subtopic = ({ subtopic, number, weekNum, quizStats }) => {
    const timeStr = subtopic?.time || "0 minute";
    const parsedTime = parseFloat(timeStr.replace(/^\D+/g, "")) || 0;
    const timeUnit = timeStr.replace(/[0-9]/g, "") || "minute";
    const hardnessIndex = parseFloat(localStorage.getItem("hardnessIndex")) || 1;
  
    return (
      <div className="flexbox subtopic" style={{ justifyContent: "space-between" }}>
        <h1 className="number">{number}</h1>
        <div className="detail">
          <h3 style={{ fontWeight: "600", textTransform: "capitalize" }}>{subtopic.subtopic}</h3>
          <p className="time">{(parsedTime * hardnessIndex).toFixed(1)} {timeUnit}</p>
          <p style={{ fontWeight: "300", opacity: "61%", marginTop: "1em" }}>{subtopic.description}</p>
        </div>
        <div className="flexbox buttons" style={{ flexDirection: "column" }}>
          <button className="resourcesButton" onClick={() => {
            setModalOpen(true);
            setResources(null); // reset content
            setResourceParam({
              subtopic: subtopic.subtopic,
              description: subtopic.description,
              time: subtopic.time,
              course: topic,
              knowledge_level: topicDetails.knowledge_level
            });
          }}>
            Resources
          </button>
          {quizStats?.timeTaken ? (
            <div className="quiz_completed">
              {((quizStats.numCorrect * 100) / quizStats.numQues).toFixed(1)}% Correct in {(quizStats.timeTaken / 1000).toFixed(0)}s
            </div>
          ) : (
            <button
              className="quizButton"
              onClick={() => {
                navigate(`/quiz?topic=${topic}&week=${weekNum}&subtopic=${number}`);
              }}
            >
              Start Quiz
            </button>
          )}
        </div>
      </div>
    );
  };
  

  const TopicBar = ({ week, topic, color, subtopics = [], weekNum, quizStats }) => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <div className="topic-bar" style={{ "--clr": color }}>
          <div className="topic-bar-title">
            <h3 className="week">{week}</h3>
            <h2 style={{ color: "white" }}>{topic}</h2>
          </div>
          <button className="plus" onClick={() => setOpen(!open)}>
            <ChevronRight size={50} strokeWidth={2} color={color} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }} />
          </button>
          {open && subtopics.map((sub, i) => (
            <Subtopic key={`sub-${i}`} subtopic={sub} number={i + 1} weekNum={weekNum} quizStats={quizStats[i + 1] || {}} />
          ))}
        </div>
      </div>
    );
  };

  const ResourcesSection = () => {
    useEffect(() => {
      if (!resourceParam?.subtopic) return;

      const cacheKey = `${topic}-${resourceParam.subtopic}`;
      const cached = JSON.parse(localStorage.getItem("resources") || "{}");

      if (cached[cacheKey]) {
        setResources(
          <div className="res">
            <h2 className="res-heading">{resourceParam.subtopic}</h2>
            <Markdown>{cached[cacheKey]}</Markdown>
          </div>
        );
        return;
      }

      setLoading(true);
      axios.defaults.baseURL = "http://localhost:5050";

      axios.post("/api/generate-resource", {
        subtopic: resourceParam.subtopic,
        description: resourceParam.description,
        time: resourceParam.time,
        course: resourceParam.course,
        knowledge_level: resourceParam.knowledge_level,
      }).then(res => {
        setLoading(false);
        const markdown = res.data;
        cached[cacheKey] = markdown;
        localStorage.setItem("resources", JSON.stringify(cached));
        setResources(
          <div className="res">
            <h2 className="res-heading">{resourceParam.subtopic}</h2>
            <Markdown>{markdown}</Markdown>
          </div>
        );
        setTimeout(() => setConfettiExplode(true), 500);
      }).catch(err => {
        setLoading(false);
        console.error("Failed to generate resource:", err);
        alert("Error generating resources.");
      });
    }, [resourceParam?.subtopic]);

    return (
      <div className="flexbox resources">
        {!resources ? (
          <div className="generativeFill">
            <p style={{ color: "white", fontStyle: "italic" }}>
              Generating AI resource automatically...
            </p>
          </div>
        ) : resources}
      </div>
    );
  };

  return (
    <div className="roadmap_wrapper">
      <Modal key={resourceParam.subtopic} open={modalOpen} onClose={() => {
        setModalOpen(false);
        setResources(null);
      }}>
        {!resources ? <ResourcesSection /> : (
          <>
            {confettiExplode && <ConfettiExplosion zIndex={10000} />}
            {resources}
          </>
        )}
      </Modal>
      <Header />
      <Loader style={{ display: loading ? "block" : "none" }}>Generating Resource...</Loader>
      <div className="content">
        <div className="flexbox topic">
          <h1>{topic}</h1>
          <h2 style={{ color: "#B6B6B6" }}>{topicDetails.time}</h2>
        </div>
        <div className="roadmap">
          {Object.keys(roadmap).map((week, i) => (
            <TopicBar
              key={`week-${i}`}
              weekNum={i + 1}
              week={week}
              topic={roadmap[week].topic}
              subtopics={roadmap[week].subtopics}
              color={colors[i % colors.length]}
              quizStats={quizStats[i + 1] || {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;
