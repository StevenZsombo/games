let peerConnection, dataChannel;

// Simple localStorage signaling
const signaling = {
    send: (type, data) => {
        const message = { type, ...data, timestamp: Date.now() };
        localStorage.setItem('p2p-signal', JSON.stringify(message));
        console.log('📤 Signal sent:', type);
    },

    listen: (callback) => {
        window.addEventListener('storage', (e) => {
            if (e.key === 'p2p-signal' && e.newValue) {
                const message = JSON.parse(e.newValue);
                callback(message);
            }
        });
    },

    clear: () => localStorage.removeItem('p2p-signal')
};

// Listen for signals
signaling.listen(handleSignal);

function handleSignal(message) {
    console.log('📨 Signal received:', message.type);

    switch (message.type) {
        case 'offer': handleOffer(message.offer); break;
        case 'answer': handleAnswer(message.answer); break;
        case 'ice-candidate': handleIceCandidate(message.candidate); break;
    }
}

// Room management
async function createRoom() {
    const roomId = Math.random().toString(36).substring(2, 6);
    document.getElementById('roomInput').value = roomId;

    signaling.clear();
    initPeerConnection();

    dataChannel = peerConnection.createDataChannel('chat');
    setupDataChannel(dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    signaling.send('offer', { offer, roomId });
    console.log('🏠 Room created:', roomId);
}

async function joinRoom() {
    const roomId = document.getElementById('roomInput').value;
    if (!roomId) return;

    initPeerConnection();

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel(dataChannel);
    };

    console.log('🔗 Joining room:', roomId);
}

// WebRTC setup
function initPeerConnection() {
    peerConnection = new RTCPeerConnection();

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            signaling.send('ice-candidate', { candidate: event.candidate });
        }
    };

    peerConnection.onconnectionstatechange = () => {
        console.log('🔌 Connection state:', peerConnection.connectionState);
    };
}

function setupDataChannel(channel) {
    channel.onopen = () => console.log('✅ Data channel opened');
    channel.onclose = () => console.log('❌ Data channel closed');
    channel.onmessage = (event) => {
        console.log('💬 Peer:', event.data);
    };
}

// WebRTC handlers
async function handleOffer(offer) {
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    signaling.send('answer', { answer });
}

async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(answer);
}

async function handleIceCandidate(candidate) {
    await peerConnection.addIceCandidate(candidate);
}

// Message sending
function sendMessage() {
    const message = document.getElementById('messageInput').value.trim();
    if (message && dataChannel?.readyState === 'open') {
        dataChannel.send(message);
        console.log('📤 You:', message);
        document.getElementById('messageInput').value = '';
    } else {
        console.log('❌ Cannot send - not connected');
    }
}

// Enter key support
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

console.log('💻 Serverless P2P Console Chat Ready');
console.log('Open this page in two browser tabs/windows');
console.log('Click "Create Room" in first tab, then "Join Room" in second tab');