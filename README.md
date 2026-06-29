# BigQuery Release Insights & X (Twitter) Composer

A premium, interactive web application built with **Python Flask** and **Vanilla HTML/CSS/JS** that fetches, parses, and displays Google Cloud BigQuery release notes. It also features a real-time **X (Twitter) Post Composer** with a live visual mock preview card.

## 🚀 Features

- **Automated XML Feeding**: Fetches the official [BigQuery Release Notes Atom Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml) dynamically.
- **Sub-entry Parsing**: Splits daily entries into individual release items categorized by type (`Feature`, `Change`, `Announcement`, `Breaking`, `Issue`).
- **Interactive Feed UI**: Groups and displays notes chronologically with custom styling, color-coded badges, and live search keyword highlighting.
- **X (Twitter) Share Composer**: Select any release note to generate a draft tweet pre-populated with summaries, official links, and relevant hashtags.
- **Live Tweet Card Preview**: Real-time visualization matching Twitter's dark mode UI, highlighting hashtags (`#`), handles (`@`), and URLs in blue with interactive link previews.
- **File Caching & Refresh**: Locally caches fetched items to ensure fast loads and offline fallback capability, with a spinner-animated manual refresh.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.14+, Flask
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Icons & Typography**: FontAwesome 6, Google Fonts (Inter)
- **Styling Guide**: Modern dark mode, CSS custom variables, smooth transitions

---

## 📁 Project Structure

```text
bq-release-notes/
├── app.py              # Flask server, Atom feed parsing, and cache manager
├── requirements.txt    # Python dependencies
├── .gitignore          # Excludes local caches, environments, and editor files
├── README.md           # Project documentation
├── templates/
│   └── index.html      # Responsive single-page layout
└── static/
    ├── css/
    │   └── index.css   # Theme colors, timeline layout, and mock tweet CSS
    └── js/
        └── app.js      # Client state, filters, searches, and intent handler
```

---

## 🏁 Getting Started

### Prerequisites
- Python 3.x installed
- Git (optional, for version control)

### Setup & Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd C:/Users/BC-Tech/agy-cli-projects/bq-release-notes
   ```

2. **Create a Python virtual environment**:
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Flask server**:
   ```bash
   python app.py
   ```

6. **Access the Web Dashboard**:
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## 📬 GitHub Integration

To push new updates to the remote repository `Antigravity-event-talks-app` using GitHub CLI:

1. **Authenticate**:
   ```bash
   gh auth login
   ```
2. **Push Branch**:
   ```bash
   git push origin main
   ```
