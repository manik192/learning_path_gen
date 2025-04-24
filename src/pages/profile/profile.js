import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import "./profile.css";
import Header from "../../components/header/header";
import Loader from "../../components/loader/loader";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

const getStats = (roadmaps, quizStats) => {
  const stats = {};
  stats.progress = {};

  for (let topic in quizStats) {
    let numWeightage = 0;
    let completedWeightage = 0;

    const roadmap = roadmaps[topic];
    if (!roadmap) continue;

    Object.keys(roadmap).forEach((week, i) => {
      const subtopics = roadmap[week]?.subtopics;
      if (!Array.isArray(subtopics)) return;

      subtopics.forEach((subtopic, j) => {
        const timeValue = parseInt(subtopic.time?.replace(/^\D+/g, "") || 1);
        numWeightage += timeValue;

        const quiz = quizStats[topic]?.[i + 1]?.[j + 1];
        if (quiz) {
          completedWeightage += timeValue;
        }
      });
    });

    stats.progress[topic] = {
      total: numWeightage,
      completed: completedWeightage,
    };
  }

  console.log("📊 Calculated Stats:", stats);
  return stats;
};


const TopicButton = ({ children }) => {
  const navigate = useNavigate();
  return (
    <button
      className="SubmitButton"
      onClick={() => {
        navigate("/topic");
      }}
    >
      {children}
    </button>
  );
};

const ProfilePage = (props) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const [topicsState, setTopicsState] = useState(
    JSON.parse(localStorage.getItem("topics")) || {}
  );
  const colors = [
  "#1F2937", // slate-800
  "#374151", // gray-700
  "#4B5563", // gray-600
  "#6B7280", // gray-500
  "#9CA3AF", // gray-400
  "#111827", // dark background fallback
  "#1E3A8A", // indigo-900
];

  const [stats, setStats] = useState({});
  const [percentCompletedData, setPercentCompletedData] = useState({});

  const deleteCourse = (courseName) => {
    if (!window.confirm(`Are you sure you want to delete "${courseName}"?`)) return;

    let topics = JSON.parse(localStorage.getItem("topics")) || {};
    let roadmaps = JSON.parse(localStorage.getItem("roadmaps")) || {};
    let quizStats = JSON.parse(localStorage.getItem("quizStats")) || {};
    let quizzes = JSON.parse(localStorage.getItem("quizzes")) || {};

    delete topics[courseName];
    delete roadmaps[courseName];
    delete quizStats[courseName];
    delete quizzes[courseName];

    localStorage.setItem("topics", JSON.stringify(topics));
    localStorage.setItem("roadmaps", JSON.stringify(roadmaps));
    localStorage.setItem("quizStats", JSON.stringify(quizStats));
    localStorage.setItem("quizzes", JSON.stringify(quizzes));

    setTopicsState({ ...topics });
  };

  useEffect(() => {
    const roadmaps = JSON.parse(localStorage.getItem("roadmaps")) || {};
    const quizStats = JSON.parse(localStorage.getItem("quizStats")) || {};
    setStats(getStats(roadmaps, quizStats));
  }, [topicsState]);

  useEffect(() => {
    let allTopics = Object.keys(topicsState);
    let progress = stats.progress || {};

    let labels = allTopics;
    let data = allTopics.map((topic) => {
      const topicProgress = progress[topic] || { completed: 0, total: 1 };
      return (topicProgress.completed * 100) / topicProgress.total;
    });

    let backgroundColors = allTopics.map(
      (_, index) => colors[index % colors.length]
    );

    setPercentCompletedData({
      labels: labels,
      datasets: [
        {
          label: "% Completed",
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    });
  }, [stats]);

  return (
    <div className="profile_wrapper">
      <Header></Header>
      <div className="flexbox content">
        <div className="flexbox info">
          <img src="/avatar.jpg" alt="Avatar" className="avatar" />
          <div className="flexbox text">
            <h1>Manikanta</h1>
            <h3>
              Ongoing Courses: <b>{Object.keys(topicsState).length}</b>
            </h3>
            <h3>
              Hardness Index: {" "}
              <b>
                {(
                  parseFloat(localStorage.getItem("hardnessIndex")) || 1
                ).toFixed(3)}
              </b>
            </h3>
          </div>
        </div>

        <div className="newTopic">
          <TopicButton>
            <h2>
              <Plus
                size={25}
                strokeWidth={2}
                style={{ marginRight: "1ch", scale: "1.2" }}
              ></Plus>
              Learn Something New
            </h2>
          </TopicButton>
        </div>

        <div className="courses">
          <h2 className="heading">Continue Learning</h2>
          <div className="flexbox">
            {Object.keys(topicsState).map((course, i) => (
              <NavLink
                key={course}
                className="link"
                to={"/roadmap?topic=" + encodeURI(course)}
              >
                <div
                  className="card"
                  style={{
  backgroundColor: colors[i % colors.length],
  color: "white",
  borderRadius: "16px",
  padding: "1.5rem",
  position: "relative"
}}
                >
                  <div className="title">{course}</div>
                  <div className="time">{topicsState[course].time}</div>
                  <div className="knowledge_level">
                    {topicsState[course].knowledge_level}
                  </div>
                  <ArrowRight size={50} strokeWidth={2} className="arrow" />
                  <Trash2
                    size={22}
                    color="white"
                    style={{ position: "absolute", top: 10, right: 10, cursor: "pointer" }}
                    onClick={(e) => {
                      e.preventDefault();
                      deleteCourse(course);
                    }}
                  />
                </div>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="progress">
          <h2 className="heading">Progress</h2>
          <div className="charts">
            {Object.keys(percentCompletedData).length ? (
              <div
                className="bar"
                style={{
  maxWidth: "700px",
  minHeight: "500px",
  backgroundColor: "#111827",
  borderRadius: "16px",
  padding: "24px",
  margin: "auto"
}}
              >
                <Bar
                  data={percentCompletedData}
                  options={{
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    scales: {
                      x: {
                        min: 0,
                        max: 100,
                        ticks: {
                          color: "white",
                          callback: function (val) {
                            return val + "%";
                          },
                        },
                      },
                      y: {
                        ticks: {
                          color: "white",
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: "white",
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
