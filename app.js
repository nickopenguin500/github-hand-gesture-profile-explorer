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
    
    // Reset and show the overlay
    errorText.classList.add('hidden');
    overlay.classList.remove('hidden');
    
    // Run the 3-second countdown
    for (let i = 3; i > 0; i--) {
        countdownText.innerText = i;
        statusText.innerText = "Get your paper ready...";
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update UI to show it's "processing"
    countdownText.innerText = "📸";
    statusText.innerText = "Scanning text... Keep still!";
    
    // Give the DOM a tiny fraction of a second to render the emoji
    await new Promise(resolve => setTimeout(resolve, 50));

    // Create a hidden canvas to take a snapshot of the raw video feed
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    try {
        // Pass the snapshot to Tesseract to extract English text
        const result = await Tesseract.recognize(canvas, 'eng');
        
        // Clean up the text. GitHub usernames only allow alphanumeric chars and hyphens.
        const rawText = result.data.text.trim();
        console.log("Raw text found by AI:", rawText);
        
        // Use a Regex to find the first continuous string that looks like a username
        const match = rawText.match(/[a-zA-Z0-9-]+/);
        
        overlay.classList.add('hidden');
        
        if (match && match[0]) {
            const username = match[0];
            document.getElementById('username-input').value = username;
            
            // Automatically search for the scanned username!
            fetchGitHubProfile(username);
        } else {
            errorText.innerText = "Could not read a valid username from the camera. Please try again.";
            errorText.classList.remove('hidden');
        }
        
    } catch (err) {
        console.error("OCR Error:", err);
        overlay.classList.add('hidden');
        errorText.innerText = "Image processing failed.";
        errorText.classList.remove('hidden');
    }
}