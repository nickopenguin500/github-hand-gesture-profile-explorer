async function fetchGitHubProfile(username) {
    const errorText = document.getElementById('error-message');
    const profileCard = document.getElementById('profile-card');
    const repoList = document.getElementById('repo-list'); 

    try {
        errorText.classList.add('hidden'); 
        const profileRes = await fetch(`https://api.github.com/users/${username}`);
        if (!profileRes.ok) throw new Error("User not found.");
        const profileData = await profileRes.json();

        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=4`);
        const reposData = await reposRes.json();

        document.getElementById('avatar').src = profileData.avatar_url;
        document.getElementById('name').innerText = profileData.name || profileData.login;
        document.getElementById('bio').innerText = profileData.bio || "No bio available.";
        
        repoList.innerHTML = ""; 
        reposData.forEach(repo => {
            // We store the repo data directly on the element as a 'data' attribute
            const repoDiv = document.createElement('div');
            repoDiv.className = 'repo-card';
            repoDiv.innerHTML = `
                <h4>${repo.name}</h4>
                <p>${repo.description || "No description."}</p>
                <small>💻 ${repo.language || "Mixed"}</small>
            `;
            
            // When clicked/pinched, show details
            repoDiv.addEventListener('click', () => showRepoDetails(repo));
            repoList.appendChild(repoDiv);
        });

        profileCard.classList.remove('hidden'); 
    } catch (error) {
        profileCard.classList.add('hidden');
        errorText.innerText = error.message;
        errorText.classList.remove('hidden');
    }
}

function showRepoDetails(repo) {
    document.getElementById('modal-repo-name').innerText = repo.name;
    document.getElementById('modal-repo-desc').innerText = repo.description || "No description.";
    document.getElementById('modal-repo-lang').innerText = `Language: ${repo.language || 'N/A'}`;
    document.getElementById('modal-repo-stars').innerText = `⭐ ${repo.stargazers_count}`;
    document.getElementById('modal-repo-forks').innerText = `🍴 ${repo.forks_count}`;
    document.getElementById('modal-repo-link').href = repo.html_url;
    
    document.getElementById('repo-modal').classList.remove('hidden');
}

// Global exposure
window.fetchGitHubProfile = fetchGitHubProfile;

// Close modal logic
document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('repo-modal').classList.add('hidden');
});