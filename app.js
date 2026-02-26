document.addEventListener('hand-pinch', (event) => {
    const pinchX = event.detail.x;
    const pinchY = event.detail.y;

    // 1. Check the Search Button
    checkCollision(document.getElementById('search-btn'), () => {
        const username = document.getElementById('username-input').value.trim();
        if (username) fetchGitHubProfile(username);
    }, pinchX, pinchY);

    // 2. Check the "Back" Button (if modal is open)
    checkCollision(document.getElementById('close-btn'), () => {
        document.getElementById('repo-modal').classList.add('hidden');
    }, pinchX, pinchY);

    // 3. Check every Repo Card
    const cards = document.querySelectorAll('.repo-card');
    cards.forEach(card => {
        checkCollision(card, () => card.click(), pinchX, pinchY);
    });
});

// Helper function to keep code clean
function checkCollision(element, action, x, y) {
    if (element.classList.contains('hidden')) return;
    const rect = element.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        action();
    }
}