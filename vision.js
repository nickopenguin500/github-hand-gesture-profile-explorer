const videoElement = document.getElementById('videoElement');
const cursor = document.getElementById('cursor');
const mirrorBtn = document.getElementById('mirror-btn'); // New button

let isPinching = false;
let cursorX = 0;
let cursorY = 0;
let lastProcessTime = 0;
const FRAME_RATE = 15; 

// --- NEW MIRROR LOGIC ---
let isMirrored = true; // Default to true
videoElement.classList.add('mirrored'); // Flip visually on load

mirrorBtn.addEventListener('click', () => {
    isMirrored = !isMirrored;
    if (isMirrored) {
        videoElement.classList.add('mirrored');
        mirrorBtn.innerText = "Mirror Camera: ON";
    } else {
        videoElement.classList.remove('mirrored');
        mirrorBtn.innerText = "Mirror Camera: OFF";
    }
});
// ------------------------

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

// Add this variable near the top with your other variables
let dualPinchBaseDist = null;

hands.setOptions({
    maxNumHands: 2, // UPGRADED TO 2 HANDS!
    modelComplexity: 0, 
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        let pinchPoints = [];
        
        // Loop through all detected hands (up to 2)
        results.multiHandLandmarks.forEach((landmarks, index) => {
            const indexFinger = landmarks[8];
            const thumb = landmarks[4];

            let rawX = indexFinger.x;
            if (isMirrored) rawX = 1.0 - rawX; 

            const screenX = rawX * window.innerWidth;
            const screenY = indexFinger.y * window.innerHeight;

            // Only move the cursor dot with the FIRST hand detected
            // This prevents having two cursors fighting each other
            if (index === 0) {
                cursorX = screenX;
                cursorY = screenY;
                cursor.style.left = `${cursorX}px`;
                cursor.style.top = `${cursorY}px`;
            }

            const dx = indexFinger.x - thumb.x;
            const dy = indexFinger.y - thumb.y;
            // Calculate pinch distance using MediaPipe's normalized coordinates
            const pinchDist = Math.sqrt(dx * dx + dy * dy);

            // If this specific hand is pinching, save its screen coordinates
            if (pinchDist < 0.05) {
                pinchPoints.push({ x: screenX, y: screenY, handIndex: index });
            }
        });

        // --- TWO-HANDED ZOOM LOGIC ---
        if (pinchPoints.length === 2) {
            const p1 = pinchPoints[0];
            const p2 = pinchPoints[1];
            
            // Calculate the distance in pixels between your left hand and right hand
            const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

            if (dualPinchBaseDist === null) {
                // Just started the dual pinch, lock in the starting distance
                dualPinchBaseDist = currentDist;
            } else {
                // Compare current distance to the distance from the previous frame
                const distChange = currentDist - dualPinchBaseDist;
                
                // Tell the app to zoom!
                document.dispatchEvent(new CustomEvent('pinch-zoom', { detail: { delta: distChange } }));
                
                // Update the base distance for the next frame so it zooms continuously
                dualPinchBaseDist = currentDist;
            }

            // Suppress single-pinch clicking while zooming
            if (isPinching) {
                isPinching = false;
                cursor.classList.remove('pinching');
            }

        } else {
            // Not dual pinching
            dualPinchBaseDist = null;

            // --- SINGLE-HAND CLICK LOGIC ---
            // Only click if exactly one hand is pinching AND it's the primary hand (index 0)
            if (pinchPoints.length === 1 && pinchPoints[0].handIndex === 0) {
                if (!isPinching) {
                    isPinching = true;
                    cursor.classList.add('pinching');
                    document.dispatchEvent(new CustomEvent('hand-pinch', { detail: { x: pinchPoints[0].x, y: pinchPoints[0].y } }));
                }
            } else {
                if (isPinching) {
                    isPinching = false;
                    cursor.classList.remove('pinching');
                }
            }
        }
    } else {
        // No hands detected at all
        dualPinchBaseDist = null;
        if (isPinching) {
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
            // INCREASED RESOLUTION HERE
            video: { width: 1280, height: 720 } 
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