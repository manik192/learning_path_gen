import { NavLink } from "react-router-dom";
import "./header.css";
import { CircleUser, Home } from "lucide-react";
import { translateLocalStorage } from "../../translate/translate";
import Chatbot from "../chatbot/Chatbot";

const Header = () => {
  return (
    <header>
      <img src="logo_2.png" alt="Neural Nomads" height={40} className="logo" />
      <NavLink to="/profile" className={"Home"}>
        <Home size={40} strokeWidth={1} color="white"></Home>
      </NavLink>
      <NavLink to="/profile" className={"ProfileAvatar"}>
        <CircleUser size={50} strokeWidth={1} color="white"></CircleUser>
      </NavLink>
      <Chatbot />
    </header>
  );
};

export default Header;
