# AI Chat Downloader (Poe Edition)

[English](#english) · [中文说明](#中文说明)

一个专注于 **Poe** 平台的浏览器扩展，可将当前对话一键导出为 **Markdown / HTML / 纯文本**，全程本地处理、无任何外部网络请求，适合跨模型上下文交接与本地归档。

A browser extension focused on **Poe** that exports the current conversation as **Markdown / HTML / Plaintext** — fully local, zero external requests, ideal for cross-model context handoff and local archiving.

---

<a name="中文说明"></a>
## 中文说明

### 项目简介

本项目重构自两年前停更的开源浏览器插件 [aichatdl](https://github.com/fmuk/aichatdl)。原版基于 Manifest V2（现已被 Chrome 停用），且各大 AI 平台前端频繁改版，原版 `content.js` 中的 DOM 选择器早已失效。

本分支对底层代码进行了大量重写：升级到 **Manifest V3**，并全面适配最新版 Poe 网页端 DOM。**当前主要专注于支持 [Poe](https://poe.com/) 平台的对话下载与导出**，所有数据处理均在浏览器本地完成，确保隐私安全。

### 核心特性

- **专注 Poe 平台**：针对最新版 Poe 网页端 DOM 结构进行持续适配与重写。
- **多格式导出**：支持保存为 Markdown、HTML、纯文本（Plaintext）。
- **高保真还原**：完整还原表格（含列对齐）、代码块（含语言标识与动态围栏）、嵌套/有序列表、任务列表、引用块、脚注、删除线，并提取用户上传的文件与图片附件。
- **本地处理**：零外部网络请求，所有解析与导出均在本机浏览器内完成。
- **Manifest V3**：兼容 Chrome 110+ 及 Chromium 系浏览器（Chrome、Edge、Brave 等）。

### 平台支持状态

| 平台 | 状态 | 说明 |
| :--- | :---: | :--- |
| **Poe** | ✅ **完全支持** | 已重写并持续适配最新网页 DOM 选择器 |
| **ChatGPT** | ⚠️ 暂未维护 | 继承自旧版代码，DOM 选择器已过时 |
| **Claude** | ⚠️ 暂未维护 | 继承自旧版代码，DOM 选择器已过时 |

### 安装指南

#### Google Chrome / Microsoft Edge

1. 下载本仓库最新代码（或克隆到本地）。
2. 打开浏览器，在地址栏输入 `chrome://extensions/`（Edge 输入 `edge://extensions/`）。
3. 开启右上角 **“开发者模式” (Developer mode)**。
4. 点击左上角 **“加载已解压的扩展程序” (Load unpacked)**。
5. 选择包含 `manifest.json` 的插件文件夹。
6. 插件将出现在扩展程序列表和浏览器工具栏中。

#### Mozilla Firefox

> ⚠️ 当前版本使用 `background.service_worker`，Firefox 尚不支持，暂无法直接加载；如需 Firefox 支持，需另行提供 Manifest V2 版本。

### 使用方法

1. 在浏览器中打开 [Poe](https://poe.com/) 并进入任意对话页面。
2. 点击工具栏中的 **AI Chat Downloader (Poe Edition)** 插件图标。
3. 选择导出格式（Markdown、HTML 或 Plaintext）。
4. 点击 **“Extract Conversation”** 即可将当前对话保存到本地。

### 开源协议与致谢

- 本项目基于 [fmuk/aichatdl](https://github.com/fmuk/aichatdl) 重构，感谢原作者的基础工作。
- 本项目同样遵循 **GNU General Public License v3.0 (GPLv3)** 开源。详情见 [GNU GPLv3 License](https://www.gnu.org/licenses/gpl-3.0.en.html)。

---

<a name="english"></a>
## English

### Description

This project is a heavily refactored fork of the abandoned [aichatdl](https://github.com/fmuk/aichatdl) browser extension. The original was built on Manifest V2 (now discontinued by Chrome), and its `content.js` DOM selectors had become outdated due to web UI changes. This fork rewrites the core scraping logic and upgrades it to **Manifest V3**.

It currently focuses on downloading and exporting conversations from [Poe](https://poe.com/), working entirely locally in your browser to keep your data private and secure.

### Features

- **Poe Focused**: Updated `content.js` DOM selectors tailored for the current Poe web interface.
- **Multiple Formats**: Export chats as Markdown, HTML, or Plaintext.
- **High-Fidelity Rendering**: Preserves tables (with column alignment), fenced code blocks (with language labels), nested/ordered lists, task lists, blockquotes, footnotes, and strikethrough, and extracts uploaded file/image attachments.
- **100% Local**: All processing happens in your browser with zero external server requests.
- **Manifest V3**: Compatible with Chrome 110+ and Chromium-based browsers (Chrome, Edge, Brave, etc.).

### Platform Support Status

| Platform | Status | Notes |
| :--- | :---: | :--- |
| **Poe** | ✅ **Supported** | Actively maintained with updated DOM selectors. |
| **ChatGPT** | ⚠️ Deprecated | Legacy selectors from the original repo (likely broken). |
| **Claude** | ⚠️ Deprecated | Legacy selectors from the original repo (likely broken). |

### Installation

#### For Google Chrome / Microsoft Edge

1. Download or clone the latest code from this repository.
2. Navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **“Developer mode”** in the top right corner.
4. Click **“Load unpacked”** in the top left corner.
5. Select the folder containing `manifest.json`.
6. The extension will appear in your extensions list and browser toolbar.

#### For Mozilla Firefox

> ⚠️ The current build uses `background.service_worker`, which Firefox does not yet support; a separate Manifest V2 build would be required for Firefox support.

### Usage

1. Open [Poe](https://poe.com/) and navigate to the conversation you wish to save.
2. Click the **AI Chat Downloader (Poe Edition)** icon in your browser toolbar.
3. Select your preferred export format (Markdown, HTML, or Plaintext).
4. Click **“Extract Conversation”** to download the chat.

### Privacy

- The extension makes no external internet requests.
- All extraction and formatting occur locally in your browser.
- No conversation data is ever sent to or stored on external servers.

### Contributing & Issues

If Poe updates its UI and breaks the downloader, or if you'd like to help update the DOM selectors for ChatGPT/Claude, feel free to open an Issue or submit a Pull Request.

### License & Credits

- Originally created by [fmuk](https://github.com/fmuk/aichatdl).
- Licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [GNU GPLv3 License](https://www.gnu.org/licenses/gpl-3.0.en.html) for details.

### Disclaimer

This extension is an independent project and is not officially affiliated with Poe, Quora, OpenAI, or Anthropic. Use at your own discretion and in accordance with the terms of service of the respective platforms.
