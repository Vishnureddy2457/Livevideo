import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const Viewer = () => {
    const [roomId, setRoomId] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);

    const iceServers = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    useEffect(() => {
        socket.on('stream-started', async (hostId) => {
            console.log('Live stream started by:', hostId);
            await joinAsViewer();
        });

        socket.on('offer', async (offer) => {
            await handleOffer(offer);
        });

        socket.on('answer', async (answer) => {
            await handleAnswer(answer);
        });

        socket.on('ice-candidate', async (candidate) => {
            await handleCandidate(candidate);
        });

        return () => {
            socket.off('stream-started');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
        };
    }, []);

    const startLiveStream = async () => {
        if (!roomId) return alert('Enter Room ID');

        setIsHost(true);
        setStreaming(true);
        socket.emit('start-stream', roomId);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideoRef.current.srcObject = stream;

            peerConnection.current = new RTCPeerConnection(iceServers);
            stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) socket.emit('ice-candidate', roomId, event.candidate);
            };

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit('offer', roomId, offer);
        } catch (error) {
            console.error('Error starting live stream:', error);
        }
    };

    const joinAsViewer = async () => {
        peerConnection.current = new RTCPeerConnection(iceServers);

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) socket.emit('ice-candidate', roomId, event.candidate);
        };

        peerConnection.current.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        socket.emit('join-room', roomId);
    };

    const handleOffer = async (offer) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('answer', roomId, answer);
    };

    const handleAnswer = async (answer) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleCandidate = async (candidate) => {
        try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate', error);
        }
    };

    return (
        <div>
            <h2>Live Stream</h2>
            {!streaming ? (
                <div>
                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button onClick={startLiveStream}>Start Live Stream</button>
                </div>
            ) : (
                <div>
                    {isHost ? (
                        <video ref={localVideoRef} autoPlay muted style={{ width: '500px', border: '2px solid black' }} />
                    ) : (
                        <video ref={remoteVideoRef} autoPlay style={{ width: '500px', border: '2px solid red' }} />
                    )}
                </div>
            )}
        </div>
    );
};

export default Viewer;
