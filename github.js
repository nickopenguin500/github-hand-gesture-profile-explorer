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
            const repoDiv = document.createElement('div');
            repoDiv.className = 'repo-card';
            
            // Cleaned up the mini cards (No emojis)
            repoDiv.innerHTML = `
                <h4>${repo.name}</h4>
                <p>${repo.description || "No description provided."}</p>
                <small>Language: ${repo.language || "Mixed"}</small>
            `;
            
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
    document.getElementById('modal-repo-desc').innerText = repo.description || "No detailed description provided by the author.";
    
    // Richer data points (No emojis)
    document.getElementById('modal-repo-lang').innerHTML = `Language: <span>${repo.language || 'N/A'}</span>`;
    document.getElementById('modal-repo-stars').innerHTML = `Stars: <span>${repo.stargazers_count}</span>`;
    document.getElementById('modal-repo-forks').innerHTML = `Forks: <span>${repo.forks_count}</span>`;
    document.getElementById('modal-repo-issues').innerHTML = `Open Issues: <span>${repo.open_issues_count}</span>`;
    
    // Format the date nicely
    const updateDate = new Date(repo.updated_at).toLocaleDateString();
    document.getElementById('modal-repo-updated').innerText = `Last Updated: ${updateDate}`;
    
    document.getElementById('modal-repo-link').href = repo.html_url;
    
    document.getElementById('repo-modal').classList.remove('hidden');
}

// Global exposure
window.fetchGitHubProfile = fetchGitHubProfile;

// Close modal logic (Mouse Click)
document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('repo-modal').classList.add('hidden');
});