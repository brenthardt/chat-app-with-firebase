import React, { useState } from "react";
import "./App.css";
import SignIn from "./Components/SignIn";
import ChatRoom from "./Components/ChatRoom";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");

  const handleSignIn = (userId, userName) => {
    setCurrentUser(userId);
    setCurrentUserName(userName);
  };

  return (
    <div className="App">
      <section>
        {currentUser ? (
          <ChatRoom
            currentUser={currentUser}
            currentUserName={currentUserName}
          />
        ) : (
          <SignIn onSignIn={handleSignIn} />
        )}
      </section>
    </div>
  );
}

export default App;
