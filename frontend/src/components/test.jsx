import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AWS from 'aws-sdk';
import Hls from 'hls.js';

const LiveStream = () => {
    const videoRef = useRef(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState('');
    const socket = useRef(null);

    useEffect(() => {
        // Initialize WebSocket connection for live chat
        socket.current = io('http://localhost:5000');
        socket.current.on('message', (msg) => {
            setChatMessages((prevMessages) => [...prevMessages, msg]);
        });

        // Initialize AWS Media Services
        AWS.config.update({
            region: 'us-west-2',
            accessKeyId: 'YOUR_ACCESS_KEY_ID',
            secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
        });

        // Initialize HLS.js for video playback
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource('https://path/to/your/hls/stream.m3u8');
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoRef.current.play();
            });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = 'https://path/to/your/hls/stream.m3u8';
            videoRef.current.addEventListener('loadedmetadata', () => {
                videoRef.current.play();
            });
        }

        return () => {
            socket.current.disconnect();
        };
    }, []);

    const handleSendMessage = () => {
        socket.current.emit('message', message);
        setMessage('');
    };

    return (
        <div>
            <video ref={videoRef} controls style={{ width: '100%' }} />
            <div>
                <h2>Live Chat</h2>
                <div>
                    {chatMessages.map((msg, index) => (
                        <div key={index}>{msg}</div>
                    ))}
                </div>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default LiveStream;