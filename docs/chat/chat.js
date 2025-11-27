let localConnection, remoteConnection;
let dataChannel;
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

// Simple signaling using localStorage (for demo - replace with actual signaling in production)
const signaling = {
    sendOffer: (offer) => localStorage.setItem('offer', JSON.stringify(offer)),
    getOffer: () => JSON.parse(localStorage.getItem('offer')),
    sendAnswer: (answer) => localStorage.setItem('answer', JSON.stringify(answer)),
    getAnswer: () => JSON.parse(localStorage.getItem('answer')),
    clear: () => { localStorage.removeItem('offer'); localStorage.removeItem('answer'); }
};

async function createRoom() {
    signaling.clear();
    localConnection = new RTCPeerConnection();
    dataChannel = localConnection.createDataChannel('chat');
    setupDataChannel(dataChannel);

    localConnection.onicecandidate = () => {
        signaling.sendOffer(localConnection.localDescription);
    };

    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);
}

async function joinRoom() {
    const offer = signaling.getOffer();
    if (!offer) return alert('No room found!');

    remoteConnection = new RTCPeerConnection();

    remoteConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel(dataChannel);
    };

    remoteConnection.onicecandidate = () => {
        signaling.sendAnswer(remoteConnection.localDescription);
    };

    await remoteConnection.setRemoteDescription(offer);
    const answer = await remoteConnection.createAnswer();
    await remoteConnection.setLocalDescription(answer);

    // Complete handshake for creator
    setTimeout(() => {
        const finalAnswer = signaling.getAnswer();
        if (finalAnswer) {
            localConnection.setRemoteDescription(finalAnswer);
        }
    }, 1000);
}

function setupDataChannel(channel) {
    channel.onopen = () => addMessage('System: Connected!');
    channel.onclose = () => addMessage('System: Disconnected');
    channel.onmessage = (event) => addMessage(`Peer: ${event.data}`);
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && dataChannel?.readyState === 'open') {
        dataChannel.send(message);
        addMessage(`You: ${message}`);
        messageInput.value = '';
    }
}

function addMessage(text) {
    messages.innerHTML += `<div>${text}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

// Enter key to send
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});