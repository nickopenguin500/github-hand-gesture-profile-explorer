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
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});
camera.start();