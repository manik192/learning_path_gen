// src/pages/LoginPage.js

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username.trim() && password.trim()) {
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);
      navigate("/profile");
    } else {
      alert("Please enter both username and password");
    }
  };

  return (
    <div className="login_wrapper">
      <div className="login_card">
        <img
          src="/logo_2.png"
          alt="Logo"
          className="login_logo_small"
          style={{ width: "350px", height: "100px", marginBottom: "1rem" }}
        />
        <h1 className="login_title">Welcome to your Learning Platform</h1>
        <input
          className="login_input"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="login_input"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginTop: "1rem" }}
        />
        <button className="login_button" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
};

export default LoginPage;