# News Daily - Premium News Portal

A premium, responsive, feature-rich news web application built using semantic HTML5, modern CSS3 variables, and vanilla ES6 JavaScript.

## 📂 Folder Structure

```text
NEWS/
├── index.html        # Main news dashboard and layout shell
├── login.html        # Premium user login portal
├── signup.html       # Account registration with password validation
├── payment.html      # Premium plan subscription simulator
├── script.js         # Core application logic, features, and API handler
├── style.css         # Clean custom styling, themes, and layouts
├── logo.jpg          # Brand asset
└── README.md         # Documentation
```

## 🚀 Key Improvements & Refactoring

### 1. Visual & UI Redesign
* **Premium Typography**: Integrated Google Fonts (`Playfair Display` for serif news headers, `Inter` for modern sans-serif interface elements).
* **Color Palettes**: Built on modern slate, charcoal, crimson accents, and clean border values.
* **Sticky Navigation**: Implemented sticky header with animated bottom border underlines on hover.
* **Dark / Light Modes**: A fully responsive dark theme toggled directly via a header button and preserved in local storage.

### 2. Modernized Features
* **Trending & Breaking News**: Integrated a breaking news slide ticker and popular trending lists.
* **Interactive News Cards**: Built-in actions for Liking articles (with counters), Bookmarking, Copying Direct Links, and native Sharing.
* **Search Suggestions**: Instant drop-down matches for search queries.
* **Reading Progress & Est. Time**: Linear top bar scrolling progress indicator and estimated reading time.
* **Skeleton Loaders**: Provides a fluid placeholder grid layout while content is loading.
* **Toast Manager**: Custom elegant status indicators replacing blocking browser prompt alerts.

### 3. security & Performance
* **Sanitized Inputs**: Protects against basic XSS vectors by sanitizing user values before rendering.
* **Robust Authentication Flow**: LocalStorage values are handled securely. Added validation for email syntax and password strength.
* **Optimized Image Performance**: Configured `loading="lazy"` on all cards to save bandwidth and improve performance.

## 💻 Running the Project

You can run the project locally using any simple HTTP server:

```powershell
# Using Python
python -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080
```

Open **`http://localhost:8080`** in your browser.
