// Profile Charts with Quiz + Resource Completion based on Weeks + Enhanced Color Contrast
import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import "./profile.css";
import Header from "../../components/header/header";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const colors = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#14B8A6"
];

const getStats = (roadmaps, quizStats, resourceStats) => {
  const stats = { progress: {}, detailed: {}, resource: {} };

  for (let topic in roadmaps) {
    let totalWeeks = Object.keys(roadmaps[topic] || {}).length;
    let completedWeeks = 0;

    const roadmap = quizStats[topic] || {};
    Object.keys(roadmap).forEach((weekKey) => {
      const weekData = roadmap[weekKey];
      const hasQuizCompleted = Object.values(weekData || {}).some(
        (quiz) => quiz?.numCorrect > 0
      );
      if (hasQuizCompleted) completedWeeks++;
    });

    stats.progress[topic] = { total: totalWeeks || 1, completed: completedWeeks };
  }

  for (let topic in resourceStats) {
    const entries = Object.entries(resourceStats[topic] || {});
    const completedCount = entries.filter(([_, read]) => read === true).length;
    stats.resource[topic] = {
      total: entries.length || 1,
      completed: completedCount,
    };
  }

  for (let topic in quizStats) {
    const detailedList = [];
    const roadmap = quizStats[topic];
    Object.entries(roadmap).forEach(([weekKey, weekData]) => {
      Object.entries(weekData).forEach(([subtopicKey, quiz]) => {
        if (quiz) {
          const score = quiz.numCorrect || 0;
          const totalQs = quiz.numQues || 1;
          detailedList.push({
            label: `Q${detailedList.length + 1}`,
            score,
            total: totalQs,
          });
        }
      });
    });
    stats.detailed[topic] = detailedList;
  }

  return stats;
};

const TopicButton = ({ children }) => {
  const navigate = useNavigate();
  return (
    <button className="SubmitButton" onClick={() => navigate("/topic")}>{children}</button>
  );
};

const ProfilePage = () => {
  const [topicsState, setTopicsState] = useState(
    JSON.parse(localStorage.getItem("topics")) || {}
  );
  const [stats, setStats] = useState({});
  const [percentCompletedData, setPercentCompletedData] = useState({});
  const [detailedStatsData, setDetailedStatsData] = useState({});

  useEffect(() => {
    const roadmaps = JSON.parse(localStorage.getItem("roadmaps")) || {};
    const quizStats = JSON.parse(localStorage.getItem("quizStats")) || {};
    const resourceStats = JSON.parse(localStorage.getItem("resourceProgress")) || {};
    const stats = getStats(roadmaps, quizStats, resourceStats);
    setStats(stats);
  }, [topicsState]);

  useEffect(() => {
    const progress = stats.progress || {};
    const resource = stats.resource || {};
    const detailed = stats.detailed || {};
    const allTopics = Object.keys(topicsState);

    console.log("📊 Progress Data:", progress);
    console.log("📚 Resource Data:", resource);
    console.log("📌 Topics List:", allTopics);

    const labels = allTopics;
    const quizCompletion = allTopics.map((topic) => {
      const p = progress[topic] || { completed: 0, total: 1 };
      return Math.round((p.completed * 100) / p.total);
    });

    const resourceCompletion = allTopics.map((topic) => {
      const r = resource[topic] || { completed: 0, total: 1 };
      return Math.round((r.completed * 100) / r.total);
    });

    setPercentCompletedData({
      labels,
      datasets: [
        {
          label: "% Weeks Completed",
          data: quizCompletion,
          backgroundColor: "rgba(59, 130, 246, 0.7)",
        },
        {
          label: "% Resources Read",
          data: resourceCompletion,
          backgroundColor: "rgba(16, 185, 129, 0.7)",
        },
      ],
    });

    const perTopic = {};
    allTopics.forEach((topic, index) => {
      const raw = detailed[topic] || [];
      const labels = raw.map((r) => r.label);
      const scores = raw.map((r) => Number(((r.score * 100) / r.total).toFixed(1)));
      if (labels.length && scores.length) {
        perTopic[topic] = {
          labels,
          datasets: [
            {
              label: "Score %",
              data: scores,
              backgroundColor: "rgba(30, 58, 138, 0.2)",
              borderColor: "rgba(30, 58, 138, 1)",
              pointBackgroundColor: "rgba(30, 58, 138, 1)",
              pointBorderColor: "#fff",
            },
          ],
        };
      }
    });

    setDetailedStatsData(perTopic);
  }, [stats, topicsState]);

  const deleteCourse = (courseName) => {
    if (!window.confirm(`Delete "${courseName}"?`)) return;
    ["topics", "roadmaps", "quizStats", "quizzes", "resourceProgress"].forEach((key) => {
      const data = JSON.parse(localStorage.getItem(key)) || {};
      delete data[courseName];
      localStorage.setItem(key, JSON.stringify(data));
    });
    const updated = { ...topicsState };
    delete updated[courseName];
    setTopicsState(updated);
  };

  const [userName, setUserName] = useState("User");

useEffect(() => {
  const storedName = localStorage.getItem("username");
  if (storedName) {
    setUserName(storedName);
  }
}, []);


  return (
    <div className="profile_wrapper">
      <Header />
      <div className="flexbox content">
        <div className="flexbox info">
          <img src="/avatar.jpg" alt="Avatar" className="avatar" />
          <div className="flexbox text">
            
          <h1>{userName}</h1>

            <h3>Ongoing Courses: <b>{Object.keys(topicsState).length}</b></h3>
            <h3>Hardness Index: <b>{(parseFloat(localStorage.getItem("hardnessIndex")) || 1).toFixed(3)}</b></h3>
          </div>
        </div>

        <div className="newTopic">
          <TopicButton>
            <h2>
              <Plus size={25} style={{ marginRight: "1ch", scale: "1.2" }} />
              Learn Something New
            </h2>
          </TopicButton>
        </div>

        <div className="courses">
          <h2 className="heading">Continue Learning</h2>
          <div className="flexbox">
            {Object.keys(topicsState).map((course, i) => (
              <NavLink key={course} className="link" to={`/roadmap?topic=${encodeURI(course)}`}>
                <div
                  className="card"
                  style={{
                    backgroundColor: colors[i % colors.length],
                    color: "white",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    position: "relative",
                  }}
                >
                  <div className="title">{course}</div>
                  <div className="time">{topicsState[course].time}</div>
                  <div className="knowledge_level">{topicsState[course].knowledge_level}</div>
                  <ArrowRight size={50} className="arrow" />
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
            {Object.keys(percentCompletedData).length > 0 && (
              <div
                className="chartWrapper"
                style={{
                  maxWidth: "800px",
                  height: "400px",
                  margin: "2rem auto",
                  backgroundColor: "#111827",
                  padding: "20px",
                  borderRadius: "12px",
                }}
              >
                <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>Overall Progress</h3>
                <Bar
                  data={percentCompletedData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    scales: {
                      x: {
                        min: 0,
                        max: 100,
                        ticks: {
                          color: "white",
                          callback: (val) => `${val}%`,
                        },
                      },
                      y: { ticks: { color: "white" } },
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.raw}% completed`,
                        },
                      },
                      legend: { labels: { color: "white" } },
                    },
                  }}
                />
              </div>
            )}

            {Object.keys(detailedStatsData).map((topic) => {
              const chart = detailedStatsData[topic];
              const hasData = chart?.datasets?.[0]?.data?.length > 0;
              return hasData ? (
                <div key={topic} className="chartWrapper">
                  <h3 style={{ textAlign: "center" }}>{topic} - Quiz Scores</h3>
                  <Radar
                    data={chart}
                    options={{
                      scales: {
                        r: {
                          suggestedMin: 0,
                          suggestedMax: 100,
                          angleLines: { color: "rgba(255,255,255,0.1)" },
                          grid: { color: "rgba(255,255,255,0.2)" },
                          pointLabels: { color: "#fff" },
                          ticks: {
                            color: "#fff",
                            backdropColor: "transparent",
                            showLabelBackdrop: false,
                            display: true,
                            callback: (value) => value.toString(),
                          },
                        },
                      },
                      plugins: {
                        legend: { labels: { color: "#fff" } },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.label}: ${context.raw}%`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : null;
            })}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
