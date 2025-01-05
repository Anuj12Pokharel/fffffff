import React, { useState } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (query.trim() === "") return;

    try {
      const res = await axios.post("http://localhost:5000/query", { query });
      const chatbotResponse = res.data.response;
      setHistory([...history, { query, response: chatbotResponse }]);
      setQuery("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeywordClick = (keyword) => {
    setQuery(keyword);
  };

  return (
    <div className="app-container">
      <div className="chatbox">
        <div className="chat-header">Chatbot</div>
        <div className="chat-history">
          {history.map((entry, index) => (
            <div className="chat-entry" key={index}>
              <div className="message-bubble user-message">
                <span className="user-bubble">{entry.query}</span>
              </div>
              <div className="message-bubble bot-message">
                <span className="bot-bubble">{entry.response}</span>
                <img src="https://t3.ftcdn.net/jpg/03/41/40/60/360_F_341406021_lQP9gx9iyBGin6pIsuMClxkWETEnzcjb.jpg" alt="Bot Logo" className="bot-logo" />
              </div>
            </div>
          ))}
        </div>

        <div className="query-suggestions">
          <button className="suggestion-item" onClick={() => handleKeywordClick("Do you want to book an appointment?")}>
            Do you want to book an appointment?
          </button>
          <button className="suggestion-item" onClick={() => handleKeywordClick("Would you want to call them?")}>
            Would you want to call them?
          </button>
        </div>

        <form className="chat-form" onSubmit={handleQuerySubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question"
          />
          <button type="submit">Ask</button>
        </form>
      </div>
    </div>
  );
}

export default App;
