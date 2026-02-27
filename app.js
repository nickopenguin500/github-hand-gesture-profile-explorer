// --- 1. MOUSE & BUTTON CONTROLS ---
document.addEventListener('click', (event) => {
    if (event.target.id === 'search-btn') {
        const usernameInput = document.getElementById('username-input');
        if (usernameInput && usernameInput.value.trim()) {
            fetchGitHubProfile(usernameInput.value.trim());
        }
    } else if (event.target.id === 'scan-btn') {
        // Trigger the new OCR process
        startOcrProcess();
    }
});

// --- 2. GESTURE CONTROLS ---
document.addEventListener('hand-pinch', (event) => {
    const px = event.detail.x;
    const py = event.detail.y;
    
    let elementUnderPinch = document.elementFromPoint(px, py);
    
    if (elementUnderPinch) {
        console.log("Pinched on:", elementUnderPinch.tagName, elementUnderPinch.id || elementUnderPinch.className);
        
        const repoCard = elementUnderPinch.closest('.repo-card');
        if (repoCard) {
            elementUnderPinch = repoCard;
        }

        elementUnderPinch.click(); 
    }
});


// --- 3. OCR SCANNER LOGIC ---
async function startOcrProcess() {
    const overlay = document.getElementById('scan-overlay');
    const countdownText = document.getElementById('countdown-text');
    const statusText = document.getElementById('scan-status');
    const videoElement = document.getElementById('videoElement');
    const errorText = document.getElementById('error-message');
    
    errorText.classList.add('hidden');
    overlay.classList.remove('hidden');
    
    // Run the 3-second countdown
    for (let i = 3; i > 0; i--) {
        countdownText.innerText = i;
        statusText.innerText = "Hold paper steady and close to camera...";
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    countdownText.innerText = "📸";
    statusText.innerText = "Processing image...";
    await new Promise(resolve => setTimeout(resolve, 50));

    // Create canvas matching the new higher video resolution
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // --- NEW: MATCH THE VISUAL MIRROR STATE ---
    // If the camera is mirrored on screen, flip the canvas so Tesseract sees exactly what you see
    if (videoElement.classList.contains('mirrored')) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }

    // Draw the raw video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Reset the transform before doing our high-contrast pixel manipulation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // --- NEW: IMAGE PRE-PROCESSING (Grayscale & High Contrast) ---
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let pixels = imgData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i];
        let g = pixels[i+1];
        let b = pixels[i+2];
        
        // Convert to grayscale
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Binarize (Thresholding): If it's dark, make it pure black. If light, pure white.
        // You can adjust the '100' threshold value if your room is darker/brighter.
        let val = gray < 100 ? 0 : 255; 
        
        pixels[i] = val;     // Red
        pixels[i+1] = val;   // Green
        pixels[i+2] = val;   // Blue
    }
    ctx.putImageData(imgData, 0, 0);
    // -------------------------------------------------------------

    try {
        // Pass the highly-contrasted image to Tesseract
        const result = await Tesseract.recognize(canvas, 'eng');
        
        // Log the full output so you can see exactly what it thought it saw
        console.log("Full OCR Output:", result.data.text);
        
        // Clean up text and grab strings that are at least 3 characters long 
        // to avoid grabbing random background noise like "A" or "I"
        const rawText = result.data.text.trim();
        const matches = rawText.match(/[a-zA-Z0-9-]{3,}/g); 
        
        overlay.classList.add('hidden');
        
        if (matches && matches.length > 0) {
            // Pick the longest valid-looking string in case it reads background junk
            let bestMatch = matches.sort((a, b) => b.length - a.length)[0];
            
            document.getElementById('username-input').value = bestMatch;
            fetchGitHubProfile(bestMatch);
        } else {
            errorText.innerText = "No clear username detected. Try writing larger/darker!";
            errorText.classList.remove('hidden');
        }
        
    } catch (err) {
        console.error("OCR Error:", err);
        overlay.classList.add('hidden');
        errorText.innerText = "Image processing failed.";
        errorText.classList.remove('hidden');
    }
}

// --- 4. ZOOM CONTROLS ---
let currentZoom = 1.0;

document.addEventListener('pinch-zoom', (event) => {
    const zoomSpeed = 0.003; 
    currentZoom += (event.detail.delta * zoomSpeed);
    
    // Clamp the zoom so it doesn't get too crazy
    currentZoom = Math.max(0.5, Math.min(currentZoom, 2.5));
    
    // Inject the new zoom level into our CSS variable!
    document.documentElement.style.setProperty('--ui-zoom', currentZoom);
});