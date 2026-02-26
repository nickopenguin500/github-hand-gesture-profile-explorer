const searchBtn = document.getElementById('search-btn');
const usernameInput = document.getElementById('username-input');
const closeBtn = document.getElementById('close-btn');
const repoLink = document.getElementById('modal-repo-link');
const modal = document.getElementById('repo-modal');

// --- 1. MOUSE CONTROLS (Working perfectly) ---
searchBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) fetchGitHubProfile(username);
});

// --- 2. GESTURE CONTROLS ---
document.addEventListener('hand-pinch', (event) => {
    const px = event.detail.x;
    const py = event.detail.y;
    
    // Check if the modal is covering the screen
    const isModalOpen = !modal.classList.contains('hidden');

    if (isModalOpen) {
        // --- MODAL IS OPEN ---
        
        // 1. Back Button Collision Check
        const closeRect = closeBtn.getBoundingClientRect();
        if (px >= closeRect.left && px <= closeRect.right && py >= closeRect.top && py <= closeRect.bottom) {
            console.log("Pinch hit: Back Button");
            window.closeModal();
            return;
        }

        // 2. View on GitHub Link Collision Check
        const linkRect = repoLink.getBoundingClientRect();
        if (px >= linkRect.left && px <= linkRect.right && py >= linkRect.top && py <= linkRect.bottom) {
            console.log("Pinch hit: GitHub Link");
            // Force the browser to open the link in a new tab securely
            window.open(repoLink.href, '_blank'); 
            return;
        }

    } else {
        // --- DASHBOARD IS OPEN ---
        
        // 3. Search Button Collision Check
        const searchRect = searchBtn.getBoundingClientRect();
        if (px >= searchRect.left && px <= searchRect.right && py >= searchRect.top && py <= searchRect.bottom) {
            console.log("Pinch hit: Search Button");
            const username = usernameInput.value.trim();
            if (username) fetchGitHubProfile(username);
            return;
        }

        // 4. Repository Cards Collision Check
        const cards = document.querySelectorAll('.repo-card');
        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            if (px >= cardRect.left && px <= cardRect.right && py >= cardRect.top && py <= cardRect.bottom) {
                console.log("Pinch hit: Repository Card");
                card.click();
            }
        });
    }
});