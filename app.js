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
    
    // We grab the elements right when the pinch happens so they are never 'null'
    const modal = document.getElementById('repo-modal');
    const searchBtn = document.getElementById('search-btn');
    const closeBtn = document.getElementById('close-btn');
    const repoLink = document.getElementById('modal-repo-link');
    const usernameInput = document.getElementById('username-input');

    // Safety check: is the modal currently active?
    const isModalOpen = modal && !modal.classList.contains('hidden');

    if (isModalOpen) {
        // --- SCENARIO A: MODAL IS OPEN ---
        
        // 1. Back Button Check
        if (closeBtn) {
            const closeRect = closeBtn.getBoundingClientRect();
            if (px >= closeRect.left && px <= closeRect.right && py >= closeRect.top && py <= closeRect.bottom) {
                console.log("Pinch hit: Back Button");
                window.closeModal();
                return;
            }
        }

        // 2. View on GitHub Link Check
        if (repoLink) {
            const linkRect = repoLink.getBoundingClientRect();
            if (px >= linkRect.left && px <= linkRect.right && py >= linkRect.top && py <= linkRect.bottom) {
                console.log("Pinch hit: GitHub Link");
                window.open(repoLink.href, '_blank'); 
                return;
            }
        }

    } else {
        // --- SCENARIO B: DASHBOARD IS OPEN ---
        
        // 3. Search Button Check
        if (searchBtn) {
            const searchRect = searchBtn.getBoundingClientRect();
            if (px >= searchRect.left && px <= searchRect.right && py >= searchRect.top && py <= searchRect.bottom) {
                console.log("Pinch hit: Search Button");
                const username = usernameInput ? usernameInput.value.trim() : '';
                if (username) fetchGitHubProfile(username);
                return;
            }
        }

        // 4. Repository Cards Check
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