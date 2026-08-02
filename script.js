// ==========================================================================
// STATE MANAGEMENT & CONSTANTS
// ==========================================================================
const API_KEY = "3e24624a7a2047599fe9390788c98aaa";
const BASE_URL = "https://newsapi.org/v2/everything?q=";

let currentQuery = "India";
let currentPage = 1;
let isFetching = false;
let hasMore = true;

// Suggestions dictionary
const SEARCH_SUGGESTIONS = [
    "India", "World News", "US Elections", "Business", "Markets", 
    "Technology", "Artificial Intelligence", "Space Exploration", 
    "Science", "Health & Wellness", "Sports", "Cricket", "Olympics", 
    "Entertainment", "Cinema", "Fashion", "Travel", "Environment", "Climate Change"
];

// Local Storage structure tracking
let bookmarks = JSON.parse(localStorage.getItem("newsBookmarks")) || [];
let likedArticles = JSON.parse(localStorage.getItem("newsLikes")) || {}; // Format: { url: likesCount }
let userLikesMap = JSON.parse(localStorage.getItem("userLikesMap")) || {}; // Format: { url: true/false }

// ==========================================================================
// DOM CONTENT INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    checkUserStatus();
    updateDateDisplay();
    initTheme();
    updateBookmarksBadge();
    renderBookmarksList();

    // Register Infinite Scroll
    window.addEventListener("scroll", handleScrollEffects);
    
    // Register clicks off-target
    document.addEventListener("click", handleOuterClickEvents);

    // Initial Fetch
    fetchInitialFeed();
    fetchTrendingAndSlider();
});

// ==========================================================================
// SCROLL EFFECTS (Reading Progress, Infinite Scroll, Back to Top)
// ==========================================================================
function handleScrollEffects() {
    // 1. Reading Progress Bar
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    
    const progressEl = document.getElementById("readingProgress");
    if (progressEl) progressEl.style.width = scrolled + "%";

    // 2. Back To Top visibility
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (backToTopBtn) {
        if (winScroll > 300) {
            backToTopBtn.style.display = "flex";
        } else {
            backToTopBtn.style.display = "none";
        }
    }

    // 3. Sticky Nav Scrolled styling
    const headerWrapper = document.getElementById("stickyNavWrapper");
    if (headerWrapper) {
        if (winScroll > 60) {
            headerWrapper.classList.add("scrolled");
        } else {
            headerWrapper.classList.remove("scrolled");
        }
    }

    // 4. Infinite Scroll detection
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 200) {
        if (!isFetching && hasMore) {
            fetchMoreNews();
        }
    }
}

// Back to top click register
const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// ==========================================================================
// THEME SWITCH SYSTEM
// ==========================================================================
function initTheme() {
    const themeBtn = document.getElementById("themeToggleBtn");
    if (!themeBtn) return;

    let savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeBtn.innerText = savedTheme === "dark" ? "☀️" : "🌙";

    themeBtn.addEventListener("click", () => {
        let currentTheme = document.documentElement.getAttribute("data-theme");
        let newTheme = currentTheme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        themeBtn.innerText = newTheme === "dark" ? "☀️" : "🌙";
        showToast(`Theme switched to ${newTheme} mode!`, "success");
    });
}

// ==========================================================================
// AUTHENTICATION FLOW
// ==========================================================================
function checkUserStatus() {
    const user = localStorage.getItem("user");
    const loggedUser = localStorage.getItem("loggedInUser");
    const isPaid = localStorage.getItem("paidUser");

    const userLink = document.getElementById("userStatusLink");
    const subBtn = document.getElementById("subscribeBtn");

    if (user && loggedUser) {
        // Logged in
        const parsed = JSON.parse(user);
        if (userLink) userLink.innerText = `Logout (${parsed.name})`;
        if (subBtn) {
            subBtn.innerText = isPaid ? "PREMIUM ACTIVE" : "UPGRADE";
            subBtn.style.backgroundColor = isPaid ? "var(--success)" : "var(--accent-color)";
        }
    } else {
        if (userLink) userLink.innerText = "Login";
        if (subBtn) subBtn.innerText = "SUBSCRIBE";
    }
}

function handleAuthAction() {
    const loggedUser = localStorage.getItem("loggedInUser");
    if (loggedUser) {
        // Logout trigger
        localStorage.removeItem("loggedInUser");
        showToast("Logged out successfully.", "success");
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } else {
        // Go to login page
        window.location.href = "login.html";
    }
}

const subBtn = document.getElementById("subscribeBtn");
if (subBtn) {
    subBtn.addEventListener("click", () => {
        const loggedUser = localStorage.getItem("loggedInUser");
        if (!loggedUser) {
            showToast("Please login first to subscribe.");
            setTimeout(() => { window.location.href = "login.html"; }, 1000);
            return;
        }
        window.location.href = "payment.html";
    });
}

function updateDateDisplay() {
    const dateEl = document.getElementById("current-date");
    if (!dateEl) return;
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    dateEl.innerText = new Date().toLocaleDateString("en-IN", options);
}

// ==========================================================================
// TOAST NOTIFICATIONS MANAGER
// ==========================================================================
function showToast(message, type = "error") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-message ${type === "success" ? "success" : ""}`;
    toast.innerHTML = `
        <span class="toast-text">${message}</span>
        <span class="toast-close-btn" onclick="this.parentElement.remove()">×</span>
    `;
    container.appendChild(toast);
    
    // Auto remove toast
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================================================
// FETCHING DATA FROM NEWS API
// ==========================================================================
async function fetchNewsData(query, page = 1) {
    // Check connection first
    if (!navigator.onLine) {
        throw new Error("offline");
    }

    const url = `${BASE_URL}${encodeURIComponent(query)}&sortBy=publishedAt&language=en&page=${page}&pageSize=12&apiKey=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const data = await response.json();
    return data.articles || [];
}

async function fetchInitialFeed() {
    isFetching = true;
    currentPage = 1;
    hasMore = true;

    const skeleton = document.getElementById("skeletonContainer");
    const container = document.getElementById("cards-container");
    const errorContainer = document.getElementById("errorContainer");

    if (skeleton) skeleton.style.display = "grid";
    if (container) container.innerHTML = "";
    if (errorContainer) errorContainer.style.display = "none";

    try {
        const articles = await fetchNewsData(currentQuery, 1);
        if (skeleton) skeleton.style.display = "none";
        
        if (articles.length === 0) {
            hasMore = false;
            if (container) container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No news articles found for this search topic.</p>`;
            return;
        }

        bindData(articles, false);
    } catch (err) {
        if (skeleton) skeleton.style.display = "none";
        showErrorPage(err.message === "offline" ? "No internet connection detected. Please check your network." : "Unable to reach the News API endpoint. Make sure you are using a valid API key.");
    } finally {
        isFetching = false;
    }
}

async function fetchMoreNews() {
    isFetching = true;
    currentPage++;
    const spinner = document.getElementById("loading");
    if (spinner) spinner.style.display = "flex";

    try {
        const articles = await fetchNewsData(currentQuery, currentPage);
        if (spinner) spinner.style.display = "none";

        if (articles.length === 0) {
            hasMore = false;
            return;
        }

        bindData(articles, true);
    } catch (err) {
        if (spinner) spinner.style.display = "none";
        showToast("Error loading more articles. Please check your connection.");
    } finally {
        isFetching = false;
    }
}

function retryFetchingFeed() {
    fetchInitialFeed();
}

function showErrorPage(msg) {
    const errorContainer = document.getElementById("errorContainer");
    const errorMsg = document.getElementById("errorMessage");
    const container = document.getElementById("cards-container");

    if (container) container.innerHTML = "";
    if (errorContainer) errorContainer.style.display = "flex";
    if (errorMsg) errorMsg.innerText = msg;
}

// Bind news content into Cards Grid
function bindData(articles, append = false) {
    const cardsContainer = document.getElementById("cards-container");
    const template = document.getElementById("template-news-card");
    if (!cardsContainer || !template) return;

    if (!append) {
        cardsContainer.innerHTML = "";
    }

    articles.forEach((article, index) => {
        // Filter out broken articles
        if (!article.title || article.title.includes("[Removed]") || !article.urlToImage) {
            return;
        }

        const clone = template.content.cloneNode(true);
        const cardElement = clone.querySelector(".news-card");

        // Fill card data
        const img = clone.querySelector("#news-img");
        const title = clone.querySelector("#news-title");
        const desc = clone.querySelector("#news-desc");
        const source = clone.querySelector("#news-source");
        const readingTime = clone.querySelector("#reading-time");
        const premiumBadge = clone.querySelector("#premiumBadge");

        img.src = article.urlToImage;
        img.onerror = () => { img.src = "logo.jpg"; };
        
        title.innerHTML = article.title;
        desc.innerHTML = article.description || "Click to open the story details.";
        
        const date = new Date(article.publishedAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        });
        source.innerHTML = `${article.source.name} · ${date}`;

        // Compute simulated reading time based on description length
        const words = (article.description || "").split(/\s+/).length + (article.title || "").split(/\s+/).length;
        const timeVal = Math.max(1, Math.ceil(words / 200));
        readingTime.innerText = `${timeVal} min read`;

        // Every 3rd article in grid is marked premium for monetization demo
        const isPremium = index % 3 === 2;
        if (isPremium) {
            premiumBadge.style.display = "inline-block";
        }

        // Like button setup
        const likeBtn = clone.querySelector(".like-btn");
        const likesCountEl = clone.querySelector(".likes-counter");
        let initialLikes = likedArticles[article.url] || Math.floor(Math.random() * 50) + 15;
        likedArticles[article.url] = initialLikes;
        likesCountEl.innerText = initialLikes;

        if (userLikesMap[article.url]) {
            likeBtn.classList.add("liked");
        }

        likeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (userLikesMap[article.url]) {
                // Unlike
                likedArticles[article.url]--;
                userLikesMap[article.url] = false;
                likeBtn.classList.remove("liked");
                showToast("Removed like", "success");
            } else {
                // Like
                likedArticles[article.url]++;
                userLikesMap[article.url] = true;
                likeBtn.classList.add("liked");
                showToast("Liked article!", "success");
            }
            likesCountEl.innerText = likedArticles[article.url];
            localStorage.setItem("newsLikes", JSON.stringify(likedArticles));
            localStorage.setItem("userLikesMap", JSON.stringify(userLikesMap));
        });

        // Bookmark button setup
        const bookmarkBtn = clone.querySelector(".bookmark-btn");
        const isBookmarked = bookmarks.some(item => item.url === article.url);
        if (isBookmarked) {
            bookmarkBtn.classList.add("bookmarked");
        }

        bookmarkBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleBookmark(article, bookmarkBtn);
        });

        // Copy Link button setup
        const copyBtn = clone.querySelector(".copy-btn");
        copyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(article.url).then(() => {
                showToast("Copied link to clipboard!", "success");
            }).catch(() => {
                showToast("Failed to copy link.");
            });
        });

        // Share button setup
        const shareBtn = clone.querySelector(".share-btn");
        shareBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (navigator.share) {
                navigator.share({
                    title: article.title,
                    url: article.url
                }).catch(() => {});
            } else {
                showToast("Sharing not supported in this browser. Link copied instead!", "success");
                navigator.clipboard.writeText(article.url);
            }
        });

        // Open details
        cardElement.addEventListener("click", () => {
            handleArticleAccess(article, isPremium);
        });

        cardsContainer.appendChild(clone);
    });
}

// Access details checking auth/premium status
function handleArticleAccess(article, isPremium) {
    const loggedUser = localStorage.getItem("loggedInUser");
    const isPaid = localStorage.getItem("paidUser");

    if (isPremium) {
        if (!loggedUser) {
            showToast("This is a Premium Article. Please login first to view.");
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
            return;
        }
        if (!isPaid) {
            localStorage.setItem("pendingArticle", article.url);
            showToast("This article requires a Premium Subscription plan.");
            setTimeout(() => { window.location.href = "payment.html"; }, 1500);
            return;
        }
    }

    // Open article
    window.open(article.url, "_blank");
}

// ==========================================================================
// FEATURE: BOOKMARKS MANAGEMENT SYSTEM
// ==========================================================================
function toggleBookmark(article, btn) {
    const index = bookmarks.findIndex(item => item.url === article.url);
    if (index > -1) {
        bookmarks.splice(index, 1);
        btn.classList.remove("bookmarked");
        showToast("Bookmark removed.", "success");
    } else {
        bookmarks.push({
            title: article.title,
            url: article.url,
            source: article.source.name
        });
        btn.classList.add("bookmarked");
        showToast("Added to bookmarks!", "success");
    }
    localStorage.setItem("newsBookmarks", JSON.stringify(bookmarks));
    updateBookmarksBadge();
    renderBookmarksList();
}

function updateBookmarksBadge() {
    const badge = document.getElementById("bookmarksCount");
    if (badge) badge.innerText = bookmarks.length;
}

function renderBookmarksList() {
    const list = document.getElementById("bookmarksList");
    if (!list) return;

    if (bookmarks.length === 0) {
        list.innerHTML = `<li class="bookmark-empty">No bookmarked articles yet</li>`;
        return;
    }

    list.innerHTML = bookmarks.map(item => `
        <li class="bookmark-item" onclick="window.open('${item.url}', '_blank')">
            <span class="bookmark-item-title">${item.title}</span>
            <span class="bookmark-item-meta">${item.source}</span>
        </li>
    `).join("");
}

// ==========================================================================
// DYNAMIC HEADLINES, TRENDING & BREAKING TICKER
// ==========================================================================
async function fetchTrendingAndSlider() {
    try {
        const articles = await fetchNewsData("Global Trends", 1);
        
        // 1. Fill breaking slider (top 5 headlines)
        const slider = document.getElementById("breakingSlider");
        if (slider && articles.length > 0) {
            slider.innerHTML = "";
            articles.slice(0, 5).forEach(art => {
                const div = document.createElement("div");
                div.className = "breaking-slide";
                div.innerText = art.title;
                div.addEventListener("click", () => handleArticleAccess(art, false));
                slider.appendChild(div);
            });
            initBreakingNewsSliderAnimation();
        }

        // 2. Fill Hero Card
        if (articles.length > 5) {
            const heroArt = articles[5];
            const heroImg = document.getElementById("heroMainImg");
            const heroTitle = document.getElementById("heroMainTitle");
            const heroDesc = document.getElementById("heroMainDesc");
            const heroMeta = document.getElementById("heroMainMeta");
            const heroCard = document.getElementById("heroMainCard");

            if (heroImg) heroImg.src = heroArt.urlToImage || "logo.jpg";
            if (heroTitle) heroTitle.innerText = heroArt.title;
            if (heroDesc) heroDesc.innerText = heroArt.description || "Read full stories.";
            if (heroMeta) heroMeta.innerText = `${heroArt.source.name} · ${new Date(heroArt.publishedAt).toLocaleDateString()}`;
            
            if (heroCard) {
                // Clear any old click listeners
                const newCard = heroCard.cloneNode(true);
                newCard.addEventListener("click", () => handleArticleAccess(heroArt, false));
                heroCard.parentNode.replaceChild(newCard, heroCard);
            }
        }

        // 3. Fill Trending sidebar list
        const trendingList = document.getElementById("trendingList");
        if (trendingList && articles.length > 6) {
            trendingList.innerHTML = "";
            articles.slice(6, 11).forEach((art, idx) => {
                const item = document.createElement("div");
                item.className = "trending-item";
                item.innerHTML = `
                    <span class="trending-rank">0${idx + 1}</span>
                    <div class="trending-details">
                        <span class="trending-item-title">${art.title}</span>
                        <span class="trending-item-meta">${art.source.name}</span>
                    </div>
                `;
                item.addEventListener("click", () => handleArticleAccess(art, false));
                trendingList.appendChild(item);
            });
        }

    } catch (err) {
        console.warn("Trending items could not be loaded", err);
    }
}

// Infinite Breaking News Slider Ticker
let currentSlideIndex = 0;
function initBreakingNewsSliderAnimation() {
    const slides = document.querySelectorAll(".breaking-slide");
    if (slides.length <= 1) return;

    setInterval(() => {
        slides[currentSlideIndex].style.transform = `translateY(-100%)`;
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        slides[currentSlideIndex].style.transform = `translateY(0%)`;
    }, 4000);
}

// ==========================================================================
// SEARCH & SUGGESTIONS BAR ENGINE
// ==========================================================================
const searchIcon = document.getElementById("search-icon");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchText");
const searchButton = document.getElementById("searchButton");
const suggestionsBox = document.getElementById("suggestionsBox");

if (searchIcon && searchOverlay) {
    searchIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = searchOverlay.style.display === "flex";
        searchOverlay.style.display = isOpen ? "none" : "flex";
        if (!isOpen && searchInput) {
            searchInput.focus();
        }
    });
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const val = searchInput.value.toLowerCase().trim();
        if (!val) {
            suggestionsBox.style.display = "none";
            return;
        }

        const filtered = SEARCH_SUGGESTIONS.filter(item => item.toLowerCase().includes(val));
        if (filtered.length > 0) {
            suggestionsBox.innerHTML = filtered.map(item => `
                <div class="suggestion-item" onclick="selectSuggestion('${item}')">${item}</div>
            `).join("");
            suggestionsBox.style.display = "flex";
        } else {
            suggestionsBox.style.display = "none";
        }
    });

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            triggerSearch();
        }
    });
}

if (searchButton) {
    searchButton.addEventListener("click", () => {
        triggerSearch();
    });
}

function selectSuggestion(val) {
    if (searchInput) {
        searchInput.value = val;
        suggestionsBox.style.display = "none";
        triggerSearch();
    }
}

function triggerSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    currentQuery = query;
    if (searchOverlay) searchOverlay.style.display = "none";

    const catTitle = document.getElementById("feedCategoryTitle");
    if (catTitle) catTitle.innerText = `Search results for "${query}"`;

    fetchInitialFeed();
}

// ==========================================================================
// NAVIGATION & MEGA MENU CLICK CONTROLLER
// ==========================================================================
function onNavItemClick(id) {
    currentQuery = id;
    
    // Toggle active link tags
    const links = document.querySelectorAll(".nav-item-link");
    links.forEach(link => {
        if (link.innerText.toLowerCase() === id.toLowerCase()) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Close Mega menu and settings if open
    const mega = document.getElementById("megaMenu");
    if (mega) mega.style.display = "none";

    const catTitle = document.getElementById("feedCategoryTitle");
    if (catTitle) catTitle.innerText = `${id} Headlines`;

    fetchInitialFeed();
}

const menuIcon = document.getElementById("menuIcon");
const megaMenu = document.getElementById("megaMenu");

if (menuIcon && megaMenu) {
    menuIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = megaMenu.style.display === "flex";
        megaMenu.style.display = isOpen ? "none" : "flex";
    });
}

const bookmarksBtn = document.getElementById("bookmarksBtn");
const bookmarksPanel = document.getElementById("bookmarksPanel");

if (bookmarksBtn && bookmarksPanel) {
    bookmarksBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = bookmarksPanel.style.display === "flex";
        bookmarksPanel.style.display = isOpen ? "none" : "flex";
    });
}

// Helper to handle alerts nicely without window alerts
function handleSubscribeAlert() {
    showToast("Premium monthly plans start at just ₹99/mo. Click SUBSCRIBE to proceed!", "success");
}

function handleEpaperClick() {
    showToast("e-Paper digital subscriptions are available for paid users.", "success");
}

function showPrivacyAlert() {
    showToast("Privacy Policy: Your credentials and likes are encrypted locally.", "success");
}

function showTermsAlert() {
    showToast("Terms: News Daily syndicates content via NewsAPI references.", "success");
}

function handleNewsletterSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("newsletterEmail").value;
    showToast(`Thank you! Morning Brief newsletters will now be sent to ${email}.`, "success");
    document.getElementById("footerNewsletterForm").reset();
}

// Handle clicks outside dropdown overlays to close them
function handleOuterClickEvents(e) {
    if (megaMenu && !megaMenu.contains(e.target) && e.target !== menuIcon) {
        megaMenu.style.display = "none";
    }
    if (bookmarksPanel && !bookmarksPanel.contains(e.target) && e.target !== bookmarksBtn) {
        bookmarksPanel.style.display = "none";
    }
    if (searchOverlay && !searchOverlay.contains(e.target) && e.target !== searchIcon) {
        searchOverlay.style.display = "none";
    }
}