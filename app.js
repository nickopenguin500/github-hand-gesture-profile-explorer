// --- 1. MOUSE CONTROLS ---
// We use event delegation here to ensure it finds the button even if it loads late
document.addEventListener('click', (event) => {
    if (event.target.id === 'search-btn') {
        const usernameInput = document.getElementById('username-input');
        if (usernameInput && usernameInput.value.trim()) {
            fetchGitHubProfile(usernameInput.value.trim());
        }
    }
});

// --- 2. GESTURE CONTROLS ---
document.addEventListener('hand-pinch', (event) => {
    const px = event.detail.x;
    const py = event.detail.y;
    
    // Grab the exact DOM element directly underneath the cursor coordinates
    let elementUnderPinch = document.elementFromPoint(px, py);
    
    if (elementUnderPinch) {
        console.log("Pinched on:", elementUnderPinch.tagName, elementUnderPinch.id || elementUnderPinch.className);
        
        // If the user pinches text inside the repo card, we want to click the card itself
        const repoCard = elementUnderPinch.closest('.repo-card');
        if (repoCard) {
            elementUnderPinch = repoCard;
        }

        // Trigger a standard native click event on whatever you pinched!
        elementUnderPinch.click(); 
    }
});