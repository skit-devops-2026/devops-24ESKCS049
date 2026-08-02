// ==========================================================================
// STATE MANAGEMENT & CONSTANTS (GitHub Pages Compatible API Engine)
// ==========================================================================
// Saurav.tech NewsAPI Mirror (Free, Open CORS, No localhost restriction, 100% GitHub Pages compatible)
const SAURAV_NEWS_API_BASE = "https://saurav.tech/NewsAPI/top-headlines/category/";

// Backup offline news articles dataset ensuring ZERO site failures even on network outage
const BACKUP_ARTICLES = [
    {
        title: "Global Tech Summit 2026 Focuses on Next-Gen Artificial Intelligence & Ethics",
        description: "Industry leaders, researchers, and policymakers gathered at the international tech forum to establish unified safety guidelines and computational benchmarks for general AI systems.",
        url: "https://techcrunch.com",
        urlToImage: "https://picsum.photos/800/400?random=1",
        publishedAt: new Date().toISOString(),
        source: { name: "Tech Daily" }
    },
    {
        title: "Central Banks Announce Coordinated Rate Adjustments Amid Economic Stabilization",
        description: "Global financial authorities have unveiled new monetary policy frameworks aimed at bolstering sustainable economic growth and curbing inflation spikes across emerging markets.",
        url: "https://bloomberg.com",
        urlToImage: "https://picsum.photos/800/400?random=2",
        publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        source: { name: "Financial Post" }
    },
    {
        title: "Breakthrough Discovery in Deep Space Telescope Observations Revealed",
        description: "Astronomers using next-generation spectral imaging have detected atmospheric water vapor signatures on exoplanets situated in habitable orbital zones.",
        url: "https://nasa.gov",
        urlToImage: "https://picsum.photos/800/400?random=3",
        publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        source: { name: "Science Journal" }
    },
    {
        title: "National Cricket Team Secures Thrilling Victory in Championship Final",
        description: "In a tense final overs finish, the squad clinched the series trophy with outstanding all-round performances and clutch fielding in front of a packed stadium.",
        url: "https://espncricinfo.com",
        urlToImage: "https://picsum.photos/800/400?random=4",
        publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        source: { name: "Sports World" }
    },
    {
        title: "Renewable Energy Capacity Surpasses Key Milestones Across Solar Grid Operations",
        description: "Solar and wind energy installations have achieved unprecedented output levels this quarter, significantly reducing global grid reliance on fossil fuel backups.",
        url: "https://reuters.com",
        urlToImage: "https://picsum.photos/800/400?random=5",
        publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        source: { name: "Eco Report" }
    },
    {
        title: "Medical Researchers Unveil Promising Clinical Trial Results for New Vaccine",
        description: "Advanced phase 3 clinical trials demonstrate high efficacy rates in targeted immunotherapies, offering new avenues for preventive healthcare.",
        url: "https://medicalnewstoday.com",
        urlToImage: "https://picsum.photos/800/400?random=6",
        publishedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        source: { name: "Health Digest" }
    }
];

let currentCategory = "general";
let currentSearchKeyword = "";
let fetchedArticlesStore = [];
let displayedCount = 0;
const ARTICLES_PER_PAGE = 6;
let isFetching = false;
let hasMore = true;

// Suggestions dictionary
const SEARCH_SUGGESTIONS = [
    "Tech", "Artificial Intelligence", "Business", "Markets", 
    "Space", "Science", "Cricket", "Health", "Climate", "Energy"
];

// Local Storage tracking
let bookmarks = JSON.parse(localStorage.getItem("newsBookmarks")) || [];
let likedArticles = JSON.parse(localStorage.getItem("newsLikes")) || {};
let userLikesMap = JSON.parse(localStorage.getItem("userLikesMap")) || {};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    checkUserStatus();
    updateDateDisplay();
    initTheme();
    updateBookmarksBadge();
    renderBookmarksList();

    // Scroll handlers
    window.addEventListener("scroll", handleScrollEffects);
    document.addEventListener("click", handleOuterClickEvents);

    // Initial Fetch
    fetchInitialFeed();
});

// ==========================================================================
// SCROLL EFFECTS & INFINITE SCROLL
// ==========================================================================
function handleScrollEffects() {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    
    const progressEl = document.getElementById("readingProgress");
    if (progressEl) progressEl.style.width = scrolled + "%";

    const backToTopBtn = document.getElementById("backToTopBtn");
    if (backToTopBtn) {
        backToTopBtn.style.display = winScroll > 300 ? "flex" : "none";
    }

    const headerWrapper = document.getElementById("stickyNavWrapper");
    if (headerWrapper) {
        if (winScroll > 60) {
            headerWrapper.classList.add("scrolled");
        } else {
            headerWrapper.classList.remove("scrolled");
        }
    }

    // Infinite Scroll trigger
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 250) {
        if (!isFetching && hasMore) {
            loadMoreArticlesFromStore();
        }
    }
}

const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// ==========================================================================
// THEME CONTROLLER
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
// AUTHENTICATION LOGIC
// ==========================================================================
function checkUserStatus() {
    const user = localStorage.getItem("user");
    const loggedUser = localStorage.getItem("loggedInUser");
    const isPaid = localStorage.getItem("paidUser");

    const userLink = document.getElementById("userStatusLink");
    const subBtn = document.getElementById("subscribeBtn");

    if (user && loggedUser) {
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
        localStorage.removeItem("loggedInUser");
        showToast("Logged out successfully.", "success");
        setTimeout(() => { window.location.reload(); }, 1000);
    } else {
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
// TOAST NOTIFICATION CONTROLLER
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
    
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================================================
// API FETCH ENGINE (CORS-Friendly Mirror + Backup Fallback)
// ==========================================================================
async function fetchNewsFromAPI(category = "general") {
    const validCategory = ["business", "entertainment", "general", "health", "science", "sports", "technology"].includes(category.toLowerCase()) 
        ? category.toLowerCase() 
        : "general";

    const targetUrl = `${SAURAV_NEWS_API_BASE}${validCategory}/in.json`;

    // Fetch with timeout fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("HTTP Status " + res.status);
        const data = await res.json();
        
        if (data && data.articles && data.articles.length > 0) {
            return data.articles;
        }
        return BACKUP_ARTICLES;
    } catch (err) {
        clearTimeout(timeoutId);
        console.warn("API request failed or timed out. Falling back to local dataset.", err);
        return BACKUP_ARTICLES;
    }
}

async function fetchInitialFeed() {
    isFetching = true;
    displayedCount = 0;
    hasMore = true;

    const skeleton = document.getElementById("skeletonContainer");
    const container = document.getElementById("cards-container");
    const errorContainer = document.getElementById("errorContainer");

    if (skeleton) skeleton.style.display = "grid";
    if (container) container.innerHTML = "";
    if (errorContainer) errorContainer.style.display = "none";

    try {
        let rawArticles = await fetchNewsFromAPI(currentCategory);
        
        // Filter out bad entries
        fetchedArticlesStore = rawArticles.filter(art => art && art.title && !art.title.includes("[Removed]"));

        // If search keyword is active, filter articles client side
        if (currentSearchKeyword) {
            const kw = currentSearchKeyword.toLowerCase();
            fetchedArticlesStore = fetchedArticlesStore.filter(art => 
                (art.title && art.title.toLowerCase().includes(kw)) || 
                (art.description && art.description.toLowerCase().includes(kw))
            );
        }

        if (skeleton) skeleton.style.display = "none";

        if (fetchedArticlesStore.length === 0) {
            hasMore = false;
            if (container) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                        <h3>No matching news articles found</h3>
                        <p>Try searching for a different keyword or select another category.</p>
                    </div>
                `;
            }
            return;
        }

        // Render Hero & Trending components
        renderHeroAndTrending(fetchedArticlesStore);

        // Render initial batch of cards in feed
        loadMoreArticlesFromStore();
    } catch (err) {
        if (skeleton) skeleton.style.display = "none";
        showErrorPage("Failed to load news articles. Please check network connection.");
    } finally {
        isFetching = false;
    }
}

function loadMoreArticlesFromStore() {
    if (displayedCount >= fetchedArticlesStore.length) {
        hasMore = false;
        return;
    }

    isFetching = true;
    const spinner = document.getElementById("loading");
    if (spinner && displayedCount > 0) spinner.style.display = "flex";

    const nextBatch = fetchedArticlesStore.slice(displayedCount, displayedCount + ARTICLES_PER_PAGE);
    bindData(nextBatch, displayedCount > 0);
    displayedCount += nextBatch.length;

    if (displayedCount >= fetchedArticlesStore.length) {
        hasMore = false;
    }

    if (spinner) spinner.style.display = "none";
    isFetching = false;
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

// Render Hero featured card & Trending list
function renderHeroAndTrending(articles) {
    if (articles.length === 0) return;

    // 1. Breaking slider
    const slider = document.getElementById("breakingSlider");
    if (slider) {
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

    // 2. Hero featured main card
    const heroArt = articles[0];
    const heroImg = document.getElementById("heroMainImg");
    const heroTitle = document.getElementById("heroMainTitle");
    const heroDesc = document.getElementById("heroMainDesc");
    const heroMeta = document.getElementById("heroMainMeta");
    const heroCard = document.getElementById("heroMainCard");

    if (heroImg) heroImg.src = heroArt.urlToImage || "logo.jpg";
    if (heroTitle) heroTitle.innerText = heroArt.title;
    if (heroDesc) heroDesc.innerText = heroArt.description || "Read full stories and in-depth reporting.";
    if (heroMeta) heroMeta.innerText = `${heroArt.source ? heroArt.source.name : 'News Daily'} · ${new Date(heroArt.publishedAt || Date.now()).toLocaleDateString()}`;

    if (heroCard) {
        const newCard = heroCard.cloneNode(true);
        newCard.addEventListener("click", () => handleArticleAccess(heroArt, false));
        heroCard.parentNode.replaceChild(newCard, heroCard);
    }

    // 3. Trending list
    const trendingList = document.getElementById("trendingList");
    if (trendingList && articles.length > 1) {
        trendingList.innerHTML = "";
        articles.slice(1, 6).forEach((art, idx) => {
            const item = document.createElement("div");
            item.className = "trending-item";
            item.innerHTML = `
                <span class="trending-rank">0${idx + 1}</span>
                <div class="trending-details">
                    <span class="trending-item-title">${art.title}</span>
                    <span class="trending-item-meta">${art.source ? art.source.name : 'News Daily'}</span>
                </div>
            `;
            item.addEventListener("click", () => handleArticleAccess(art, false));
            trendingList.appendChild(item);
        });
    }
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
        const clone = template.content.cloneNode(true);
        const cardElement = clone.querySelector(".news-card");

        const img = clone.querySelector("#news-img");
        const title = clone.querySelector("#news-title");
        const desc = clone.querySelector("#news-desc");
        const source = clone.querySelector("#news-source");
        const readingTime = clone.querySelector("#reading-time");
        const premiumBadge = clone.querySelector("#premiumBadge");

        img.src = article.urlToImage || "logo.jpg";
        img.onerror = () => { img.src = "logo.jpg"; };
        
        title.innerHTML = article.title;
        desc.innerHTML = article.description || "Click to open full news report.";
        
        const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        }) : "Today";
        source.innerHTML = `${article.source ? article.source.name : 'News Daily'} · ${date}`;

        const words = (article.description || "").split(/\s+/).length + (article.title || "").split(/\s+/).length;
        const timeVal = Math.max(1, Math.ceil(words / 200));
        readingTime.innerText = `${timeVal} min read`;

        const isPremium = index % 3 === 2;
        if (isPremium) {
            premiumBadge.style.display = "inline-block";
        }

        // Like button setup
        const likeBtn = clone.querySelector(".like-btn");
        const likesCountEl = clone.querySelector(".likes-counter");
        let initialLikes = likedArticles[article.url] || Math.floor(Math.random() * 40) + 10;
        likedArticles[article.url] = initialLikes;
        likesCountEl.innerText = initialLikes;

        if (userLikesMap[article.url]) {
            likeBtn.classList.add("liked");
        }

        likeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (userLikesMap[article.url]) {
                likedArticles[article.url]--;
                userLikesMap[article.url] = false;
                likeBtn.classList.remove("liked");
                showToast("Removed like", "success");
            } else {
                likedArticles[article.url]++;
                userLikesMap[article.url] = true;
                likeBtn.classList.add("liked");
                showToast("Liked article!", "success");
            }
            likesCountEl.innerText = likedArticles[article.url];
            localStorage.setItem("newsLikes", JSON.stringify(likedArticles));
            localStorage.setItem("userLikesMap", JSON.stringify(userLikesMap));
        });

        // Bookmark setup
        const bookmarkBtn = clone.querySelector(".bookmark-btn");
        const isBookmarked = bookmarks.some(item => item.url === article.url);
        if (isBookmarked) {
            bookmarkBtn.classList.add("bookmarked");
        }

        bookmarkBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleBookmark(article, bookmarkBtn);
        });

        // Copy Link setup
        const copyBtn = clone.querySelector(".copy-btn");
        copyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(article.url).then(() => {
                showToast("Copied link to clipboard!", "success");
            }).catch(() => {
                showToast("Failed to copy link.");
            });
        });

        // Share setup
        const shareBtn = clone.querySelector(".share-btn");
        shareBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (navigator.share) {
                navigator.share({
                    title: article.title,
                    url: article.url
                }).catch(() => {});
            } else {
                showToast("Link copied to clipboard!", "success");
                navigator.clipboard.writeText(article.url);
            }
        });

        cardElement.addEventListener("click", () => {
            handleArticleAccess(article, isPremium);
        });

        cardsContainer.appendChild(clone);
    });
}

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

    window.open(article.url, "_blank");
}

// ==========================================================================
// BOOKMARKS SYSTEM
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
            source: article.source ? article.source.name : "News Daily"
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
// BREAKING NEWS SLIDER ANIMATION
// ==========================================================================
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
// SEARCH & SUGGESTIONS BAR ENGINE (Includes Empty Validation)
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
    if (!query) {
        showToast("Please enter a search keyword.");
        return;
    }

    currentSearchKeyword = query;
    if (searchOverlay) searchOverlay.style.display = "none";

    const catTitle = document.getElementById("feedCategoryTitle");
    if (catTitle) catTitle.innerText = `Search results for "${query}"`;

    fetchInitialFeed();
}

// ==========================================================================
// NAVIGATION & CATEGORIES CONTROLLER
// ==========================================================================
function onNavItemClick(id) {
    currentCategory = id;
    currentSearchKeyword = ""; // reset search filter on category click
    if (searchInput) searchInput.value = "";

    const links = document.querySelectorAll(".nav-item-link");
    links.forEach(link => {
        if (link.getAttribute("onclick") && link.getAttribute("onclick").includes(`'${id}'`)) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    const mega = document.getElementById("megaMenu");
    if (mega) mega.style.display = "none";

    const catTitle = document.getElementById("feedCategoryTitle");
    if (catTitle) catTitle.innerText = `${id.toUpperCase()} Headlines`;

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

function handleSubscribeAlert() {
    showToast("Premium monthly plans start at just ₹99/mo. Click SUBSCRIBE to proceed!", "success");
}

function handleEpaperClick() {
    showToast("e-Paper digital subscriptions are available for paid users.", "success");
}

function showPrivacyAlert() {
    showToast("Privacy Policy: Credentials are encrypted locally.", "success");
}

function showTermsAlert() {
    showToast("Terms: News Daily syndicates verified content references.", "success");
}

function handleNewsletterSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("newsletterEmail").value;
    showToast(`Morning Brief newsletters will be sent to ${email}.`, "success");
    document.getElementById("footerNewsletterForm").reset();
}

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