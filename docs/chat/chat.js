let peerConnection, dataChannel;
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
const isOffer = params.get('role') === 'offer';

function createRoom() {
    const roomId = Math.random().toString(36).substring(2, 8);
    window.location.search = `?room=${roomId}&role=offer`;
}

function joinRoom() {
    const roomId = prompt('Enter room ID:');
    if (roomId) window.location.search = `?room=${roomId}&role=answer`;
}

function initializeConnection() {
    if (!roomId) return;

    peerConnection = new RTCPeerConnection();

    if (isOffer) {
        dataChannel = peerConnection.createDataChannel('chat');
        setupDataChannel();

        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                localStorage.setItem(`offer-${roomId}`, JSON.stringify(peerConnection.localDescription));
                console.log('Offer created. Room ID:', roomId);
                checkForAnswer();
            });
    } else {
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel();
        };
        checkForOffer();
    }

    setupIceCandidates();
}

function setupDataChannel() {
    dataChannel.onopen = () => console.log('✅ Data channel ready!');
    dataChannel.onmessage = (event) => console.log('💬 Peer:', event.data);
}

function checkForOffer() {
    const interval = setInterval(() => {
        const offer = localStorage.getItem(`offer-${roomId}`);
        if (offer) {
            clearInterval(interval);
            peerConnection.setRemoteDescription(JSON.parse(offer))
                .then(() => peerConnection.createAnswer())
                .then(answer => peerConnection.setLocalDescription(answer))
                .then(() => {
                    localStorage.setItem(`answer-${roomId}`, JSON.stringify(peerConnection.localDescription));
                    console.log('Answer sent');
                });
        }
    }, 1000);
}

function checkForAnswer() {
    const interval = setInterval(() => {
        const answer = localStorage.getItem(`answer-${roomId}`);
        if (answer) {
            clearInterval(interval);
            peerConnection.setRemoteDescription(JSON.parse(answer));
            console.log('Answer received');
        }
    }, 1000);
}

function setupIceCandidates() {
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            const key = `ice-${roomId}-${isOffer ? 'offer' : 'answer'}`;
            const candidates = JSON.parse(localStorage.getItem(key) || '[]');
            candidates.push(event.candidate);
            localStorage.setItem(key, JSON.stringify(candidates));
        }
    };

    setInterval(() => {
        const remoteKey = `ice-${roomId}-${isOffer ? 'answer' : 'offer'}`;
        const remoteCandidates = JSON.parse(localStorage.getItem(remoteKey) || '[]');
        remoteCandidates.forEach(candidate => {
            peerConnection.addIceCandidate(candidate).catch(() => { });
        });
    }, 2000);
}

function sendMessage() {
    const message = document.getElementById('messageInput').value;
    if (dataChannel && dataChannel.readyState === 'open' && message) {
        dataChannel.send(message);
        console.log('📤 You:', message);
        document.getElementById('messageInput').value = '';
    } else {
        console.log('❌ Not ready or empty message');
    }
}

// Auto-initialize if room is in URL
if (roomId) initializeConnection();