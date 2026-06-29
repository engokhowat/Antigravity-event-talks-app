// State Management
let allReleases = [];
let selectedRelease = null;
let currentCategory = 'all';
let searchQuery = '';

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const filterTags = document.querySelectorAll('.filter-tag');
const resultsCountEl = document.getElementById('results-count');
const loadingIndicator = document.getElementById('loading-indicator');
const errorState = document.getElementById('error-state');
const errorMessageEl = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const releasesContainer = document.getElementById('releases-container');

// Composer DOM Elements
const composerPrompt = document.getElementById('composer-prompt');
const composerActiveContent = document.getElementById('composer-active-content');
const tweetTextArea = document.getElementById('tweet-text');
const charCounter = document.getElementById('char-counter');
const resetComposerBtn = document.getElementById('reset-composer-btn');
const copyBtn = document.getElementById('copy-btn');
const tweetBtn = document.getElementById('tweet-btn');

// Preview DOM Elements
const previewText = document.getElementById('preview-text');
const previewDate = document.getElementById('preview-date');
const previewLinkCard = document.getElementById('preview-link-card');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toast-message');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh feed
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    retryBtn.addEventListener('click', () => fetchReleases(true));

    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
        renderFeed();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderFeed();
        searchInput.focus();
    });

    // Category filters
    filterTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            filterTags.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.getAttribute('data-category');
            renderFeed();
        });
    });

    // Real-time tweet text updates
    tweetTextArea.addEventListener('input', updateTweetPreview);

    // Reset Composer to default template
    resetComposerBtn.addEventListener('click', () => {
        if (selectedRelease) {
            generateDefaultTweet(selectedRelease);
        }
    });

    // Copy tweet to clipboard
    copyBtn.addEventListener('click', copyTweetToClipboard);

    // Post to Twitter Intent
    tweetBtn.addEventListener('click', postToX);
}

// Fetch Releases API Call
async function fetchReleases(forceRefresh = false) {
    showLoading(true);
    
    // Rotate refresh icon if refreshing
    if (forceRefresh) {
        refreshIcon.classList.add('fa-spin');
    }

    try {
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allReleases = data;
        
        showError(false);
        renderFeed();
    } catch (error) {
        console.error('Error fetching release notes:', error);
        errorMessageEl.textContent = 'Could not retrieve release notes. Please check your internet connection and try again.';
        showError(true);
    } finally {
        showLoading(false);
        refreshIcon.classList.remove('fa-spin');
    }
}

// Render Feed View
function renderFeed() {
    releasesContainer.innerHTML = '';
    
    // Filter releases
    const filtered = allReleases.filter(release => {
        const categoryMatch = currentCategory === 'all' || 
            release.category.toLowerCase() === currentCategory.toLowerCase();
        
        const plainContent = stripHtml(release.content).toLowerCase();
        const searchMatch = !searchQuery || 
            release.date.toLowerCase().includes(searchQuery) ||
            release.category.toLowerCase().includes(searchQuery) ||
            plainContent.includes(searchQuery);
            
        return categoryMatch && searchMatch;
    });

    resultsCountEl.textContent = filtered.length;

    if (filtered.length === 0) {
        releasesContainer.innerHTML = `
            <div class="loading-state">
                <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <p>No release notes found matching your filters.</p>
            </div>
        `;
        return;
    }

    // Group releases by Date
    const groups = {};
    filtered.forEach(release => {
        if (!groups[release.date]) {
            groups[release.date] = [];
        }
        groups[release.date].push(release);
    });

    // Render groups
    Object.keys(groups).forEach(date => {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'timeline-date-group';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'timeline-date-header';
        dateHeader.textContent = date;
        groupContainer.appendChild(dateHeader);
        
        groups[date].forEach(release => {
            const card = createReleaseCard(release);
            groupContainer.appendChild(card);
        });
        
        releasesContainer.appendChild(groupContainer);
    });
}

// Create Card DOM Element
function createReleaseCard(release) {
    const isSelected = selectedRelease && selectedRelease.id === release.id;
    
    const card = document.createElement('div');
    card.className = `release-card category-${release.category.toLowerCase()} ${isSelected ? 'selected' : ''}`;
    card.setAttribute('data-id', release.id);
    
    // Highlight matching query in description content
    let contentHtml = release.content;
    if (searchQuery) {
        contentHtml = highlightText(contentHtml, searchQuery);
    }
    
    card.innerHTML = `
        <div class="card-checkbox">
            <div class="checkbox-circle">
                <i class="fa-solid fa-check"></i>
            </div>
        </div>
        <div class="card-main">
            <div class="card-header-row">
                <span class="category-tag ${release.category.toLowerCase()}">${release.category}</span>
                <span class="card-date">${release.date}</span>
            </div>
            <div class="card-body-content">
                ${contentHtml}
            </div>
        </div>
        <a href="${release.link}" target="_blank" class="card-link-out" title="Open official release notes page">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
    `;

    // Handle Selection click
    card.addEventListener('click', (e) => {
        // Prevent trigger if they click an anchor link inside the card
        if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('a')) {
            return;
        }
        selectRelease(release);
    });
    
    return card;
}

// Select Release Note
function selectRelease(release) {
    // If already selected, do nothing
    if (selectedRelease && selectedRelease.id === release.id) {
        return;
    }
    
    selectedRelease = release;
    
    // Update active classes on cards
    document.querySelectorAll('.release-card').forEach(card => {
        if (card.getAttribute('data-id') === release.id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    // Open Composer
    composerPrompt.style.display = 'none';
    composerActiveContent.style.display = 'block';
    
    // Update link card domain in preview
    const linkObj = parseUrl(release.link);
    document.querySelector('.x-link-domain').textContent = linkObj.hostname || 'cloud.google.com';

    // Generate Default Tweet Text
    generateDefaultTweet(release);
}

// Generate Default Template Tweet
function generateDefaultTweet(release) {
    const rawText = stripHtml(release.content);
    
    // Clean up double newlines and extra spaces
    let cleanSnippet = rawText.replace(/\s+/g, ' ').trim();
    
    // We want to extract a sensible portion of the release notes for a tweet
    // Let's cap the snippet length to leave room for headers, link, and tags
    const targetLength = 140;
    if (cleanSnippet.length > targetLength) {
        cleanSnippet = cleanSnippet.substring(0, targetLength - 3) + '...';
    }
    
    const tweet = `Google Cloud BigQuery Update! 🚀\n\n[${release.category}] ${cleanSnippet}\n\nRead details: ${release.link}\n\n#BigQuery #GoogleCloud`;
    
    tweetTextArea.value = tweet;
    updateTweetPreview();
}

// Update live tweet card and count character lengths
function updateTweetPreview() {
    const text = tweetTextArea.value;
    const count = text.length;
    
    charCounter.textContent = `${count} / 280`;
    
    // Color states based on limits
    if (count > 280) {
        charCounter.className = 'char-count-badge error';
        tweetBtn.disabled = true;
    } else if (count > 250) {
        charCounter.className = 'char-count-badge warning';
        tweetBtn.disabled = false;
    } else {
        charCounter.className = 'char-count-badge';
        tweetBtn.disabled = false;
    }

    // Format text for X Preview: highlight hashtags, handles, and URLs
    let formattedText = escapeHtml(text);
    
    // Highlight URLs
    formattedText = formattedText.replace(/https?:\/\/[^\s]+/g, (url) => {
        return `<span class="x-link">${url}</span>`;
    });
    
    // Highlight Hashtags
    formattedText = formattedText.replace(/#[a-zA-Z0-9_]+/g, (tag) => {
        return `<span class="x-hashtag">${tag}</span>`;
    });
    
    // Highlight Handles
    formattedText = formattedText.replace(/@[a-zA-Z0-9_]+/g, (handle) => {
        return `<span class="x-hashtag">${handle}</span>`;
    });

    previewText.innerHTML = formattedText || 'Select an update to preview...';
    
    // Calculate custom preview time
    if (selectedRelease) {
        previewDate.textContent = selectedRelease.date;
        previewLinkCard.style.display = 'block';
    } else {
        previewDate.textContent = '1m';
        previewLinkCard.style.display = 'none';
    }
}

// Copy draft to clipboard
function copyTweetToClipboard() {
    const text = tweetTextArea.value;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Text copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy to clipboard', true);
    });
}

// Share Tweet via Web Intent
function postToX() {
    const text = tweetTextArea.value;
    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(twitterUrl, '_blank');
}

// Show loading states
function showLoading(isLoading) {
    loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    if (isLoading) {
        releasesContainer.innerHTML = '';
        errorState.style.display = 'none';
    }
}

// Show error states
function showError(hasError) {
    errorState.style.display = hasError ? 'block' : 'none';
    if (hasError) {
        releasesContainer.innerHTML = '';
        loadingIndicator.style.display = 'none';
    }
}

// Toast manager
function showToast(message, isError = false) {
    toastMessageEl.textContent = message;
    
    const icon = toastEl.querySelector('.toast-icon');
    if (isError) {
        toastEl.style.borderColor = 'var(--gcp-red)';
        icon.className = 'fa-solid fa-circle-xmark toast-icon';
        icon.style.color = 'var(--gcp-red)';
    } else {
        toastEl.style.borderColor = 'var(--border-active)';
        icon.className = 'fa-solid fa-circle-check toast-icon';
        icon.style.color = 'var(--gcp-green)';
    }

    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// Helper Utilities
function stripHtml(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function highlightText(html, query) {
    if (!query) return html;
    
    // We want to highlight query words inside text nodes without breaking HTML tags
    const reg = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    highlightNode(temp, reg);
    
    return temp.innerHTML;
}

function highlightNode(node, regex) {
    if (node.nodeType === 3) { // Text node
        const val = node.nodeValue;
        if (regex.test(val)) {
            const span = document.createElement('span');
            span.innerHTML = val.replace(regex, '<span class="highlight">$1</span>');
            node.parentNode.replaceChild(span, node);
        }
    } else if (node.nodeType === 1 && node.childNodes && !/(style|script)/i.test(node.tagName)) {
        for (let i = 0; i < node.childNodes.length; i++) {
            highlightNode(node.childNodes[i], regex);
        }
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseUrl(url) {
    try {
        return new URL(url);
    } catch (e) {
        return { hostname: 'cloud.google.com' };
    }
}
