const appendMessage = function ({ participant, timestamp, text }) {
  const currentParticipant = window.localStorage.getItem("participant");

  const messageClass = currentParticipant == participant ? "message--own" : "";
  const messageHTML = `<div class="message-container">
    <div class="message ${messageClass}">
      <div class="message__author">${participant}</div>
      <div class="message__content">${text}</div>
      <div class="message__timestamp">${timestamp}</div>
    </div>
  </div>`;
  const messagesContainer = document.getElementById("messages-container");
  messagesContainer.insertAdjacentHTML("beforeend", messageHTML);
};

const activateChatRoom = function (room) {
  const roomJoined = document.getElementById("room-joined");
  roomJoined.insertAdjacentHTML(
    "beforeend",
    `<span>Messages for room: ${room}</span>`
  );

  document.getElementById("chat-container").style.display = "initial";
  document.getElementById("join-room-form").style.display = "none";
};

const restoreForm = function () {
  const room = window.localStorage.getItem("room");
  const participant = window.localStorage.getItem("participant");
  if (room) {
    document.getElementById("room-name").value = room;
  }
  if (participant) {
    document.getElementById("participant-name").value = participant;
  }
};

// Global variable to hold the chat websocket
let SOCKET;
const setupWebSocket = function (room, participant) {
  // Create WebSocket connection.
  SOCKET = new WebSocket("ws://localhost:3000/events");
  // Connection opened
  SOCKET.addEventListener("open", function (event) {
    SOCKET.send(JSON.stringify({ meta: "join", room, participant }));
  });

  // Listen for messages
  SOCKET.addEventListener("message", function (event) {
    console.log("Message from server ", event.data);

    const message = JSON.parse(event.data);

    switch (message.meta) {
      case "room-joined":
        activateChatRoom(message.room);
        break;
      case "send-message":
        appendMessage(message.payload);
        break;
      default:
        console.error(`Can't handle unknown message type ${message.meta}`);
        break;
    }
  });

  SOCKET.addEventListener("close", function () {
    // websocket is closed.
    console.log("Connection closed...");
  });
};

const sendMessage = function (text) {
  const room = window.localStorage.getItem("room");
  const participant = window.localStorage.getItem("participant");
  SOCKET.send(
    JSON.stringify({
      meta: "send-message",
      room,
      payload: { participant, text, timestamp: new Date() },
    })
  );
};

const setupChat = function () {
  restoreForm();

  const joinRoomForm = document.getElementById("join-room-form");
  joinRoomForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const room = document.getElementById("room-name").value;
    const participant = document.getElementById("participant-name").value;

    if (room && participant) {
      window.localStorage.setItem("room", room);
      window.localStorage.setItem("participant", participant);
      setupWebSocket(room, participant);
    }
  });

  const sendMessageForm = document.getElementById("send-message-form");
  sendMessageForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const messageInput = document.getElementById("message-text");
    const message = messageInput.value;

    if (message) {
      sendMessage(message);
      messageInput.value = "";
    }
  });
};
