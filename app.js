// --- 1. MOUSE & BUTTON CONTROLS ---
document.addEventListener('click', (event) => {
    if (event.target.id === 'search-btn') {
        const usernameInput = document.getElementById('username-input');
        if (usernameInput && usernameInput.value.trim()) {
            fetchGitHubProfile(usernameInput.value.trim());
        }
    } else if (event.target.id === 'scan-btn') {
        startOcrProcess();
    } else if (event.target.id === 'repo-modal') {
        closeModal();
    } else if (event.target.id === 'help-btn') {
        // OPEN HELP MODAL
        document.getElementById('help-modal').classList.remove('hidden');
    } else if (event.target.id === 'close-help-btn' || event.target.id === 'help-modal') {
        // CLOSE HELP MODAL (Button or Background click)
        document.getElementById('help-modal').classList.add('hidden');
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

        // Close Repo Modal on background pinch
        if (elementUnderPinch.id === 'repo-modal') {
            closeModal();
            return; 
        }
        
        // Close Help Modal on background pinch
        if (elementUnderPinch.id === 'help-modal') {
            document.getElementById('help-modal').classList.add('hidden');
            return;
        }

        const closeBtn = elementUnderPinch.closest('#close-btn');
        if (closeBtn) {
            closeModal();
            return;
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
    
    for (let i = 3; i > 0; i--) {
        countdownText.innerText = i;
        statusText.innerText = "Hold paper steady and close to camera...";
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    countdownText.innerText = "📸";
    statusText.innerText = "Processing image...";
    await new Promise(resolve => setTimeout(resolve, 50));

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // --- NEW: THE CONFIDENCE TOURNAMENT ---
    let bestText = "";
    let highestConfidence = 0;
    
    // Run both normal AND flipped passes every time
    for (let isFlipped of [false, true]) {
        // Reset the canvas transformation for each pass
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        if (isFlipped) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        } 
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // High contrast filter
        let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let pixels = imgData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            let r = pixels[i], g = pixels[i+1], b = pixels[i+2];
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            let val = gray < 100 ? 0 : 255; 
            pixels[i] = val; pixels[i+1] = val; pixels[i+2] = val;   
        }
        ctx.putImageData(imgData, 0, 0);

        try {
            const result = await Tesseract.recognize(canvas, 'eng');
            console.log(`Pass (Flipped: ${isFlipped}) Confidence: ${result.data.confidence}%`);
            console.log(`Pass (Flipped: ${isFlipped}) Text:`, result.data.text.trim());
            
            // Keep the text that Tesseract is most confident about
            if (result.data.confidence > highestConfidence) {
                highestConfidence = result.data.confidence;
                bestText = result.data.text;
            }
        } catch (err) {
            console.error("OCR Error on pass:", err);
        }
    }
    // ----------------------------------------

    overlay.classList.add('hidden');
    
    // Now we extract the username from the WINNING text
    const rawText = bestText.trim();
    const matches = rawText.match(/[a-zA-Z0-9-]{3,}/g); 
    
    if (matches && matches.length > 0) {
        let bestMatch = matches.sort((a, b) => b.length - a.length)[0];
        document.getElementById('username-input').value = bestMatch;
        fetchGitHubProfile(bestMatch);
    } else {
        errorText.innerText = "No clear username detected. Try writing larger/darker!";
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

// --- 5. SCROLL CONTROLS ---
document.addEventListener('hand-scroll', (event) => {
    const scrollSensitivity = -2.5; 
    
    const modal = document.getElementById('repo-modal');
    const isModalOpen = modal && !modal.classList.contains('hidden');
    
    if (isModalOpen) {
        // SCROLL THE DARK OVERLAY INSTEAD OF THE CONTENT BOX
        modal.scrollBy({
            left: event.detail.dx * scrollSensitivity,
            top: event.detail.dy * scrollSensitivity,
            behavior: 'auto' 
        });
    } else {
        // SCROLL THE MAIN WEBSITE
        window.scrollBy({
            left: event.detail.dx * scrollSensitivity,
            top: event.detail.dy * scrollSensitivity,
            behavior: 'auto' 
        });
    }
});