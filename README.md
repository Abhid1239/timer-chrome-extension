# Timer - A Minimalist, Persistent Chrome Extension

![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-In_Review-yellow?style=for-the-badge&logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A no-nonsense, on-page timer designed for coding interviews, focused work, and anyone who needs to keep track of time without the clutter.

[Timer Demo](https://www.loom.com/share/085f9f9ede3a44288e413a81dd3c0a0f?sid=46c7adf5-0699-4d60-9070-641a8b916327)

---

## The "Why" Behind This Project

Ever hidden your taskbar for a coding interview on LeetCode and completely lost track of time? I have.

That's why I built Timer. While modern platforms have made their timers more complex, and other extensions disappear when you switch tabs, this tool brings back simple, persistent functionality. It's inspired by the clean, minimalist design of classic coding platform timers—it just works.

## ✨ Key Features

* **Always Visible & Persistent**: The timer stays on the page even when you switch tabs. It even remembers its state if you close and reopen your browser.
* **Real-Time Sync**: Start, stop, or reset the timer on one tab, and the state is instantly updated across all your other open tabs.
* **Minimalist UI**: A clean, simple interface with just the essentials: Start, Stop, and Reset. No distractions.
* **Collapsible Design**: Click the arrow to collapse the controls into a single, unobtrusive icon.
* **Fully Configurable**: Use the extension popup to:
    * Toggle the timer's visibility on and off.
    * Choose its position on the page (top-left, top-right, bottom-left, or bottom-right).

## 🚀 Installation

> **Note:** This extension is currently under review by the Chrome Web Store team. The official installation link will be added here once it's live. For now, you can install it directly from the source.

#### **Install from Source (for Developers)**

1.  **Download:** Download this repository as a `.zip` file from GitHub and unzip it.
2.  **Navigate:** Open Chrome and go to `chrome://extensions`.
3.  **Enable Developer Mode:** Turn on the "Developer mode" toggle in the top-right corner.
4.  **Load the Extension:** Click on the **"Load unpacked"** button and select the unzipped folder containing the project files.

## 🛠️ How to Use

* **Controls:** Use the Play, Pause, and Reset icons directly on the webpage to control the timer.
* **Collapse/Expand:** Click the arrow icon to collapse the timer, and click the timer icon to expand it again.
* **Settings:** Click the Timer icon in your Chrome toolbar (next to the address bar) to open the settings popup. From here, you can show/hide the timer and change its position.

## 💻 Tech Stack

* **Core:** JavaScript (ES6), HTML5, CSS3
* **Architecture:** Chrome Extension API (Manifest V3)
* **APIs:** `chrome.storage` for persistence and sync, `chrome.runtime` for communication.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page]([link-to-your-github-issues]).

## 📄 License

This project is licensed under the MIT License.
