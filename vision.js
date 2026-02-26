const videoElement = document.getElementById('videoElement');
const cursor = document.getElementById('cursor');

let isPinching = false;
let cursorX = 0;
let cursorY = 0;

// Initialize MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

// The loop that processes every webcam frame
hands.onResults((results) => {
    console.log("AI is running...", results.multiHandLandmarks);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Landmark 8 is Index tip, Landmark 4 is Thumb tip
        const indexFinger = landmarks[8];
        const thumb = landmarks[4];

        // Map webcam coordinates to browser window size
        cursorX = indexFinger.x * window.innerWidth;
        cursorY = indexFinger.y * window.innerHeight;

        // Move the visual blue dot
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;

        // Calculate distance using Pythagorean theorem
        const dx = indexFinger.x - thumb.x;
        const dy = indexFinger.y - thumb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If distance is small, trigger the pinch state
        if (distance < 0.05 && !isPinching) {
            isPinching = true;
            cursor.classList.add('pinching'); 
            
            // Broadcast the pinch event to the rest of the app
            document.dispatchEvent(new CustomEvent('hand-pinch', { 
                detail: { x: cursorX, y: cursorY } 
            }));
        } 
        else if (distance > 0.08 && isPinching) {
            isPinching = false;
            cursor.classList.remove('pinching'); 
        }
    }
});

// Turn on the webcam
// --- THE NEW NATIVE CAMERA LOGIC ---
// This replaces the buggy MediaPipe Camera utility.

async function processVideo() {
    // SECURITY CHECK: Only send the frame to the AI if the video is fully loaded and playing.
    // readyState 2 or higher means the browser has enough data to render the frame.
    if (videoElement.readyState >= 2 && !videoElement.paused) { 
        await hands.send({image: videoElement});
    }
    
    // Loop this function continuously (like onStep in Python cmu_graphics)
    requestAnimationFrame(processVideo);
}

async function processVideo() {
    if (videoElement.readyState >= 2 && !videoElement.paused) { 
        try {
            await hands.send({image: videoElement});
        } catch (e) {
            console.warn("AI busy, skipping frame...");
        }
    }
    requestAnimationFrame(processVideo);
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        videoElement.srcObject = stream;
        
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            // ADDED: Wait 2 seconds for the ML model to "warm up" before sending frames
            console.log("Waiting for AI warm-up...");
            setTimeout(() => {
                console.log("AI starting now!");
                processVideo();
            }, 2000); 
        };
    } catch (err) {
        console.error("Camera failed:", err);
    }
}

startCamera();