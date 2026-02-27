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
let lastPalmX = null; // NEW: Track previous X for scrolling
let lastPalmY = null; // NEW: Track previous Y for scrolling

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 0, 
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        let pinchPoints = [];
        let openPalmDetected = false; 
        let currentPalmX = null;
        let currentPalmY = null;
        
        results.multiHandLandmarks.forEach((landmarks, index) => {
            const indexFinger = landmarks[8];
            const thumb = landmarks[4];
            const wrist = landmarks[0];

            let rawX = indexFinger.x;
            if (isMirrored) rawX = 1.0 - rawX; 

            const screenX = rawX * window.innerWidth;
            const screenY = indexFinger.y * window.innerHeight;

            // Primary hand logic
            if (index === 0) {
                cursorX = screenX;
                cursorY = screenY;
                cursor.style.left = `${cursorX}px`;
                cursor.style.top = `${cursorY}px`;
                
                // --- SCROLL DETECTION MATH ---
                // Helper to measure distance between two landmarks
                const getDist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
                
                // Check if all four fingertips are further from the wrist than their knuckles
                const isIndexOpen = getDist(landmarks[8], wrist) > getDist(landmarks[5], wrist);
                const isMiddleOpen = getDist(landmarks[12], wrist) > getDist(landmarks[9], wrist);
                const isRingOpen = getDist(landmarks[16], wrist) > getDist(landmarks[13], wrist);
                const isPinkyOpen = getDist(landmarks[20], wrist) > getDist(landmarks[17], wrist);
                
                if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
                    openPalmDetected = true;
                    
                    // Track Landmark 9 (middle knuckle) for smooth panning
                    let palmRawX = landmarks[9].x;
                    if (isMirrored) palmRawX = 1.0 - palmRawX;
                    currentPalmX = palmRawX * window.innerWidth;
                    currentPalmY = landmarks[9].y * window.innerHeight;
                }
            }

            const dx = indexFinger.x - thumb.x;
            const dy = indexFinger.y - thumb.y;
            const pinchDist = Math.sqrt(dx * dx + dy * dy);

            if (pinchDist < 0.05) {
                pinchPoints.push({ x: screenX, y: screenY, handIndex: index });
            }
        });

        // --- TWO-HANDED ZOOM LOGIC ---
        if (pinchPoints.length === 2) {
            const p1 = pinchPoints[0];
            const p2 = pinchPoints[1];
            const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

            if (dualPinchBaseDist === null) {
                dualPinchBaseDist = currentDist;
            } else {
                const distChange = currentDist - dualPinchBaseDist;
                document.dispatchEvent(new CustomEvent('pinch-zoom', { detail: { delta: distChange } }));
                dualPinchBaseDist = currentDist;
            }

            if (isPinching) {
                isPinching = false;
                cursor.classList.remove('pinching');
            }
            lastPalmX = null; // Cancel scrolling while zooming

        } else {
            dualPinchBaseDist = null;

            // --- SINGLE-HAND CLICK LOGIC ---
            if (pinchPoints.length === 1 && pinchPoints[0].handIndex === 0) {
                if (!isPinching) {
                    isPinching = true;
                    cursor.classList.add('pinching');
                    document.dispatchEvent(new CustomEvent('hand-pinch', { detail: { x: pinchPoints[0].x, y: pinchPoints[0].y } }));
                }
                lastPalmX = null; // Cancel scrolling while clicking
            } else {
                if (isPinching) {
                    isPinching = false;
                    cursor.classList.remove('pinching');
                }
                
                // --- OPEN PALM SCROLLING LOGIC ---
                if (openPalmDetected) {
                    if (lastPalmX !== null && lastPalmY !== null) {
                        let moveX = currentPalmX - lastPalmX;
                        let moveY = currentPalmY - lastPalmY;
                        
                        // Deadzone: Require at least 2 pixels of movement to prevent micro-jitters
                        if (Math.abs(moveX) > 2 || Math.abs(moveY) > 2) {
                            document.dispatchEvent(new CustomEvent('hand-scroll', { 
                                detail: { dx: moveX, dy: moveY } 
                            }));
                        }
                    }
                    lastPalmX = currentPalmX;
                    lastPalmY = currentPalmY;
                    
                    // Visual feedback: Orange and bigger when scrolling!
                    cursor.style.backgroundColor = '#f0883e'; 
                    cursor.style.transform = 'scale(1.5)';
                } else {
                    lastPalmX = null;
                    lastPalmY = null;
                    cursor.style.backgroundColor = ''; 
                    cursor.style.transform = '';
                }
            }
        }
    } else {
        dualPinchBaseDist = null;
        lastPalmX = null;
        lastPalmY = null;
        if (isPinching) {
            isPinching = false;
            cursor.classList.remove('pinching');
        }
        cursor.style.backgroundColor = '';
        cursor.style.transform = '';
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