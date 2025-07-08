
import React, { useState } from "react";
import { auth, firestore } from "../firebase/firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function SignIn({ onSignIn }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (name.trim() === "") {
      alert("Please enter a name");
      return;
    }

    setLoading(true);

    try {
      await signInAnonymously(auth);
      const user = auth.currentUser;

      await setDoc(doc(firestore, "users", user.uid), {
        name: name,
        uid: user.uid,
      });

      onSignIn(user.uid, name);
    } catch (error) {
      console.error("Error signing in anonymously", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Sign In</h2>
      <input
        type="text"
        className="form-control mb-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button
        className="btn btn-primary"
        onClick={handleSignIn}
        disabled={loading}
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>
    </div>
  );
}

export default SignIn;
