import { useState, useRef, useEffect } from "react";
import { Bot, User } from "lucide-react";
import "./chatbot.css";

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hey there! 👋 I'm Faraday, your study buddy! Ask me anything!" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingDots, setTypingDots] = useState(".");
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    let interval;
    if (isTyping) {
      interval = setInterval(() => {
        setTypingDots((prev) => (prev.length < 3 ? prev + "." : "."));
      }, 500);
    } else {
      setTypingDots(".");
    }
    return () => clearInterval(interval);
  }, [isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    scrollToBottom();
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:5050/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const botText = data?.reply || "Sorry, I couldn't understand that.";

      setMessages((prev) => [...prev, { type: "bot", text: botText }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { type: "bot", text: "Oops! Server error. 😅" }]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div>
      <div className={`chatbot-wrapper ${open ? "open" : ""}`}>
        <div className="chatbot-header">
          <h3>Faraday 🤖</h3>
          <button onClick={() => setOpen(false)}>✖</button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.type}`}>
              {msg.type === "bot" ? (
                <Bot size={20} style={{ marginRight: "8px" }} />
              ) : (
                <User size={20} style={{ marginRight: "8px" }} />
              )}
              <span>{msg.text}</span>
            </div>
          ))}

          {isTyping && (
            <div className="message bot">
              <Bot size={20} style={{ marginRight: "8px" }} />
              <span>Typing{typingDots}</span>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div className="chatbot-input">
          <input
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>

      {!open && (
        <button className="chatbot-fab" onClick={() => setOpen(true)}>
          💬
        </button>
      )}
    </div>
  );
};

export default Chatbot;
