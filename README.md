# Timer - A Minimalist, Persistent Chrome Extension

<!-- ![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Available-green?style=for-the-badge&logo=googlechrome&logoColor=white) -->

![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-In_Review-yellow?style=for-the-badge&logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-3.0-blue?style=for-the-badge)

A no-nonsense, on-page timer designed for coding interviews, focused work, and anyone who needs to keep track of time without the clutter.

[Timer Demo](https://www.youtube.com/watch?v=bpWk9TZDaTo)

---

## The "Why" Behind This Project

Ever hidden your taskbar for a coding interview on LeetCode and completely lost track of time? I have.

That's why I built Timer. While modern platforms have made their timers more complex, and other extensions disappear when you switch tabs, this tool brings back simple, persistent functionality. It's inspired by the clean, minimalist design of classic coding platform timers—it just works.

## ✨ Key Features

* **Always Visible & Persistent**: The timer stays on the page even when you switch tabs. It remembers its state across browser sessions.
* **Stopwatch & Timer Modes**: Count up (stopwatch) or count down (timer) based on your needs.
* **Timer Completion Alert**: Pulsing animation with red glow when countdown reaches zero.
* **Pause & Resume**: Pause and resume exactly where you left off.
* **Color Gradient**: Timer display changes color as time runs out (blue → red).
* **Real-Time Sync**: State syncs instantly across all open tabs.
* **Drag & Drop**: Position the timer anywhere on the page.
* **Minimalist UI**: Clean interface with Play/Pause, Reset, and Collapse.
* **Collapsible**: Minimize to a single icon when not needed.
* **Button Feedback**: Visual feedback on all button clicks.

## 🚀 Installation

> **Note:** This extension is currently under review by the Chrome Web Store team.

#### **Install from Source**

1. Download this repository as a `.zip` and unzip it
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the unzipped folder

## 🛠️ How to Use

### Stopwatch Mode (Default)
- **Play** → Start counting up
- **Pause** → Stop (time preserved)
- **Play** → Resume from paused time
- **Reset** → Back to 00:00:00

### Timer Mode
1. Click Timer icon in toolbar → Select **Timer** mode
2. Set hours/minutes/seconds → Click **Set Timer**
3. **Play** → Start countdown
4. Timer buzzes when complete → **Play** to restart or **Reset**

### Controls
- **Collapse**: Click arrow to minimize
- **Drag**: Click and drag to reposition
- **Settings**: Click toolbar icon for options

## 🆕 What's New in v3.0

* Timer mode with countdown up to 24 hours
* Pulsing completion alert with red glow
* True pause/resume (resumes from exact time)
* Color gradient as time runs out
* Button click feedback
* Page reload sync fix
* Accessibility improvements

## 💻 Tech Stack

* JavaScript (ES6), HTML5, CSS3
* Chrome Extension API (Manifest V3)
* Shadow DOM for style isolation

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

**MIT License with Commercial Use Restriction**

✅ Personal use, education, non-commercial projects  
❌ Commercial applications, paid products, business use

For commercial licensing: [your-email-here]
