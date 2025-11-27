let socket = null;
let currentRoom = 'lobby';

// Connect to WebSocket server
function connect() {
    const room = document.getElementById('roomInput').value || 'lobby';
    currentRoom = room;

    // Use a free public WebSocket echo server (replace with your own server)
    socket = new WebSocket('ws://localhost:8774');

    socket.onopen = () => {
        console.log('✅ Connected to server');
        addMessage('System: Connected to room "' + room + '"');
    };

    socket.onmessage = (event) => {
        addMessage('Other: ' + event.data);
    };

    socket.onclose = () => {
        console.log('❌ Disconnected from server');
        addMessage('System: Disconnected');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        addMessage('System: Connection error');
    };
}

// Disconnect from server
function disconnect() {
    if (socket) {
        socket.close();
        socket = null;
    }
}

// Send message
function sendMessage() {
    const message = document.getElementById('messageInput').value;
    if (message && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
        addMessage('You: ' + message);
        document.getElementById('messageInput').value = '';
    }
}

// Add message to display
function addMessage(text) {
    const messages = document.getElementById('messages');
    messages.innerHTML += '<div>' + text + '</div>';
    messages.scrollTop = messages.scrollHeight;
}

// Enter key to send
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Auto-connect
connect();