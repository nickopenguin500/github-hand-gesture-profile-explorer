const videoElement = document.getElementById('videoElement');
const cursor = document.getElementById('cursor');

let isPinching = false;
let cursorX = 0;
let cursorY = 0;
let lastProcessTime = 0;
const FRAME_RATE = 15; // Only process 15 frames per second to prevent "AI busy" spam

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // 0 is faster/lighter for web use
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexFinger = landmarks[8];
        const thumb = landmarks[4];

        // Map coordinates to window
        cursorX = indexFinger.x * window.innerWidth;
        cursorY = indexFinger.y * window.innerHeight;

        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;

        const dx = indexFinger.x - thumb.x;
        const dy = indexFinger.y - thumb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.05 && !isPinching) {
            isPinching = true;
            cursor.classList.add('pinching');
            document.dispatchEvent(new CustomEvent('hand-pinch', { detail: { x: cursorX, y: cursorY } }));
        } else if (distance > 0.08 && isPinching) {
            isPinching = false;
            cursor.classList.remove('pinching');
        }
    }
});

async function processVideo(now) {
    // Only send to AI if enough time has passed (throttling)
    if (now - lastProcessTime > (1000 / FRAME_RATE)) {
        if (videoElement.readyState >= 2 && !videoElement.paused) { 
            await hands.send({image: videoElement});
            lastProcessTime = now;
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
            setTimeout(() => {
                requestAnimationFrame(processVideo);
            }, 1000); 
        };
    } catch (err) {
        console.error("Camera failed:", err);
    }
}

startCamera();