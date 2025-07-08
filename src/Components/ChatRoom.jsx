import React, { useState, useEffect } from "react";
import Rodal from "rodal";
import { firestore } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
import "rodal/lib/rodal.css";

function ChatRoom({ currentUser, currentUserName }) {
  const [formValue, setFormValue] = useState("");
  const [newChatroomName, setNewChatroomName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [chatrooms, setChatrooms] = useState([]);
  const [activeChatroom, setActiveChatroom] = useState(null);
  const [editingChatroom, setEditingChatroom] = useState(null);

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));
  const chatroomsRef = collection(firestore, "chatrooms");

  const [messages] = useCollectionData(messagesQuery, { idField: "id" });

  const fetchChatrooms = async () => {
    const chatroomsSnapshot = await getDocs(chatroomsRef);
    const chatroomsList = chatroomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setChatrooms(chatroomsList);
  };

  useEffect(() => {
    fetchChatrooms();
  }, []);

  const createChatroom = async () => {
    if (newChatroomName.trim() === "") {
      alert("Chatroom name cannot be empty.");
      return;
    }

    try {
      await addDoc(chatroomsRef, {
        name: newChatroomName,
        members: [],
        createdAt: serverTimestamp(),
      });

      fetchChatrooms();
      setNewChatroomName("");
      setShowModal(false);
      alert(`Chatroom "${newChatroomName}" created successfully.`);
    } catch (error) {
      console.error("Error creating chatroom:", error);
      alert("Failed to create chatroom. Please try again.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (formValue.trim()) {
      await addDoc(messagesRef, {
        text: formValue,
        createdAt: serverTimestamp(),
        senderId: currentUser,
        senderName: currentUserName,
        chatroomId: activeChatroom,
      });
      setFormValue("");
    }
  };

  const joinChatroom = async (chatroomId) => {
    const chatroomDocRef = doc(firestore, "chatrooms", chatroomId);
    try {
      await updateDoc(chatroomDocRef, {
        members: arrayUnion({ id: currentUser, name: currentUserName }),
      });
      fetchChatrooms();
    } catch (error) {
      console.error("Error joining chatroom:", error);
      alert("Failed to join chatroom.");
    }
  };

  const leaveChatroom = async (chatroomId) => {
    const chatroomDocRef = doc(firestore, "chatrooms", chatroomId);
    try {
      await updateDoc(chatroomDocRef, {
        members: arrayRemove({ id: currentUser, name: currentUserName }),
      });
      fetchChatrooms();
    } catch (error) {
      console.error("Error leaving chatroom:", error);
      alert("Failed to leave chatroom.");
    }
  };

  const removeUserFromChatroom = async (chatroomId, userId) => {
    const chatroomDocRef = doc(firestore, "chatrooms", chatroomId);
    const chatroom = chatrooms.find((room) => room.id === chatroomId);
    const user = chatroom?.members.find((member) => member.id === userId);

    if (!user) return;

    try {
      await updateDoc(chatroomDocRef, {
        members: arrayRemove(user),
      });
      fetchChatrooms();
    } catch (error) {
      console.error("Error removing user from chatroom:", error);
      alert("Failed to remove user.");
    }
  };

  const editChatroomName = async () => {
    if (newChatroomName.trim() === "") {
      alert("Chatroom name cannot be empty.");
      return;
    }

    const chatroomDocRef = doc(firestore, "chatrooms", editingChatroom.id);

    try {
      await updateDoc(chatroomDocRef, { name: newChatroomName });
      fetchChatrooms();
      setEditingChatroom(null);
      setNewChatroomName("");
    } catch (error) {
      console.error("Error editing chatroom name:", error);
      alert("Failed to update chatroom name.");
    }
  };

  const deleteChatroom = async (chatroomId) => {
    const chatroomDocRef = doc(firestore, "chatrooms", chatroomId);

    try {
      const chatroomMessagesQuery = query(
        collection(firestore, "messages"),
        where("chatroomId", "==", chatroomId)
      );

      const chatroomMessagesSnapshot = await getDocs(chatroomMessagesQuery);

      const batch = writeBatch(firestore);

      chatroomMessagesSnapshot.forEach((msgDoc) => {
        batch.delete(msgDoc.ref);
      });

      await batch.commit();
      await deleteDoc(chatroomDocRef);

      fetchChatrooms();
      alert("Chatroom and its messages have been deleted.");
    } catch (error) {
      console.error("Error deleting chatroom:", error);
      alert("Failed to delete chatroom.");
    }
  };

  const clearChatHistory = async () => {
    if (!activeChatroom) return;

    const chatroomMessagesQuery = query(
      messagesRef,
      where("chatroomId", "==", activeChatroom)
    );

    try {
      const chatroomMessagesSnapshot = await getDocs(chatroomMessagesQuery);

      const batch = writeBatch(firestore);

      chatroomMessagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      alert("Chat history cleared.");
    } catch (error) {
      console.error("Error clearing chat history:", error);
      alert("Failed to clear chat history.");
    }
  };

  return (
    <div className="chat-room-container">
      <div className="chatrooms-list">
        <h2>Chatrooms</h2>
        {chatrooms.map((chatroom) => {
          const isMember = (chatroom.members || []).some(
            (member) => member.id === currentUser
          );

          return (
            <div
              key={chatroom.id}
              className={`chatroom-item ${
                activeChatroom === chatroom.id ? "active" : ""
              }`}
              onClick={() => setActiveChatroom(chatroom.id)}
            >
              <div>
                {chatroom.name}{" "}
                <span>({(chatroom.members || []).length} members)</span>
              </div>

              {!isMember && (
                <button onClick={() => joinChatroom(chatroom.id)}>Join</button>
              )}
              {isMember && (
                <button onClick={() => leaveChatroom(chatroom.id)}>
                  Leave
                </button>
              )}

              {currentUserName === "admin" && (
                <div>
                  <button onClick={() => setEditingChatroom(chatroom)}>
                    Edit
                  </button>
                  <button onClick={() => deleteChatroom(chatroom.id)}>
                    Delete
                  </button>
                </div>
              )}

              {currentUserName === "admin" && (
                <div className="chatroom-members">
                  <h4>Members:</h4>
                  {(chatroom.members || []).map((member) => (
                    <div key={member.id} className="member-item">
                      {member.name}
                      <button
                        onClick={() =>
                          removeUserFromChatroom(chatroom.id, member.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="chat-room">
        {activeChatroom && (
          <>
            <h2>
              Active Chatroom:{" "}
              {chatrooms.find((room) => room.id === activeChatroom)?.name}
            </h2>
            <div className="messages">
              {messages &&
                messages
                  .filter((msg) => msg.chatroomId === activeChatroom)
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${
                        msg.senderId === currentUser ? "sent" : "received"
                      }`}
                    >
                      <strong>{msg.senderName}:</strong> <p>{msg.text}</p>
                    </div>
                  ))}
            </div>

            <form onSubmit={sendMessage}>
              <input
                type="text"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
            <button onClick={clearChatHistory}>Clear Chat History</button>
          </>
        )}
      </div>

      {showModal && (
        <Rodal visible={showModal} onClose={() => setShowModal(false)}>
          <h3>Create a Chatroom</h3>
          <input
            type="text"
            placeholder="Chatroom Name"
            value={newChatroomName}
            onChange={(e) => setNewChatroomName(e.target.value)}
          />
          <button onClick={createChatroom}>Create</button>
        </Rodal>
      )}

      {editingChatroom && (
        <Rodal
          visible={!!editingChatroom}
          onClose={() => setEditingChatroom(null)}
        >
          <h3>Edit Chatroom Name</h3>
          <input
            type="text"
            placeholder="New Chatroom Name"
            value={newChatroomName}
            onChange={(e) => setNewChatroomName(e.target.value)}
          />
          <button onClick={editChatroomName}>Update</button>
        </Rodal>
      )}

      <button onClick={() => setShowModal(true)}>Create Chatroom</button>
    </div>
  );
}

export default ChatRoom;
