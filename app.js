const searchBtn = document.getElementById('search-btn');
const usernameInput = document.getElementById('username-input');
const closeBtn = document.getElementById('close-btn');
const repoLink = document.getElementById('modal-repo-link');
const modal = document.getElementById('repo-modal');

// --- 1. MOUSE CONTROLS (For Testing) ---
searchBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) fetchGitHubProfile(username);
});


// --- 2. WEBCAM GESTURE CONTROLS ---
document.addEventListener('hand-pinch', (event) => {
    const px = event.detail.x;
    const py = event.detail.y;

    // Check if the screen is currently dimmed by the modal
    const isModalOpen = !modal.classList.contains('hidden');

    if (isModalOpen) {
        // SCENARIO A: MODAL IS OPEN
        
        // 1. Back Button Collision Check
        const closeRect = closeBtn.getBoundingClientRect();
        if (px >= closeRect.left && px <= closeRect.right && py >= closeRect.top && py <= closeRect.bottom) {
            window.closeModal(); // Call the global function
            return; 
        }

        // 2. View on GitHub Link Collision Check
        const linkRect = repoLink.getBoundingClientRect();
        if (px >= linkRect.left && px <= linkRect.right && py >= linkRect.top && py <= linkRect.bottom) {
            repoLink.click(); // Triggers the link to open in a new tab
            return;
        }

    } else {
        // SCENARIO B: DASHBOARD IS OPEN
        
        // 3. Search Button Collision Check
        const searchRect = searchBtn.getBoundingClientRect();
        if (px >= searchRect.left && px <= searchRect.right && py >= searchRect.top && py <= searchRect.bottom) {
            const username = usernameInput.value.trim();
            if (username) fetchGitHubProfile(username);
            return;
        }

        // 4. Repository Cards Collision Check
        const cards = document.querySelectorAll('.repo-card');
        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            if (px >= cardRect.left && px <= cardRect.right && py >= cardRect.top && py <= cardRect.bottom) {
                card.click();
            }
        });
    }
});