# AI Chat Downloader (Poe Edition)

[English](#english) | [中文说明](#中文说明)

---

<a name="中文说明"></a>
## 中文说明

### 项目简介
本项目重构自两年前停更的开源浏览器插件 [aichatdl](https://github.com/fmuk/aichatdl)。原版基于 Manifest V2（现已被 Chrome 停用），且各大 AI 平台前端页面频繁改版，原版插件 `content.js` 中的 DOM 选择器早已失效。

我对底层代码进行了大量重写：升级到 Manifest V3，并更新了最新的 DOM 解析逻辑。**当前版本为 v1.4.0，主要专注于支持 [Poe](https://poe.com/) 平台的对话下载与导出**。所有数据处理均在浏览器本地完成，确保您的隐私安全。

### 核心特性
- **专注 Poe 平台**：针对最新版 Poe 网页端 DOM 结构进行了全面适配与重写。
- **多格式导出**：支持将对话保存为 Markdown、HTML 和纯文本 (Plaintext) 格式。
- **本地处理**：无任何外部网络请求，所有数据解析与导出均在本地浏览器中完成，保护隐私。
- **Manifest V3**：已升级至 Manifest V3，兼容 Chrome 110+ 及 Chromium 系浏览器（Chrome、Edge、Brave 等）。Firefox 暂不支持（其 MV3 尚不支持 `background.service_worker`）。

### 平台支持状态
| 平台 | 状态 | 说明 |
| :--- | :---: | :--- |
| **Poe** | ✅ **完全支持** | 已重写并适配最新的网页 DOM 选择器 |
| **ChatGPT** | ⚠️ 暂未维护 | 继承自旧版代码，DOM 选择器已过时，可能无法正常工作 |
| **Claude** | ⚠️ 暂未维护 | 继承自旧版代码，DOM 选择器已过时，可能无法正常工作 |

### 安装指南

#### Google Chrome / Microsoft Edge:
1. 从本项目的 [GitHub 仓库](https://github.com/kinoyoki/aichatdl_2026) 下载最新代码（或克隆到本地）。
2. 打开浏览器，在地址栏输入 `chrome://extensions/`（Edge 浏览器输入 `edge://extensions/`）。
3. 开启右上角的 **“开发者模式” (Developer mode)**。
4. 点击左上角的 **“加载已解压的扩展程序” (Load unpacked)**。
5. 选择你下载并解压后的插件文件夹。
6. 插件将出现在你的扩展程序列表和浏览器工具栏中。

#### Mozilla Firefox:
> ⚠️ 当前 Manifest V3 版本使用了 `background.service_worker`，Firefox 尚不支持，因此暂无法直接加载。如需 Firefox 支持，需另行提供 Manifest V2 版本。

### 使用方法
1. 在浏览器中打开 [Poe](https://poe.com/) 并进入任意对话页面。
2. 点击浏览器工具栏中的 **AI Chat Downloader (Poe Edition)** 插件图标。
3. 选择你需要的导出格式（Markdown、HTML 或 Plaintext）。
4. 点击 **"Extract Conversation"** 按钮即可将当前对话保存到本地。

### 开源协议与致谢
- 本项目基于 [fmuk/aichatdl](https://github.com/fmuk/aichatdl) 重构，感谢原作者的基础工作。
- 本仓库地址：[github.com/kinoyoki/aichatdl_2026](https://github.com/kinoyoki/aichatdl_2026)
- 本项目同样遵循 **GNU General Public License v3.0 (GPLv3)** 协议开源。详情请参阅 [GNU GPLv3 License](https://www.gnu.org/licenses/gpl-3.0.en.html)。

---

<a name="english"></a>
## English

### Description
This project is a heavily refactored fork of the abandoned [aichatdl](https://github.com/fmuk/aichatdl) browser extension (last updated two years ago). The original was built on Manifest V2 (now discontinued by Chrome), and its DOM selectors in `content.js` had become completely outdated due to web UI updates. This fork rewrites the core scraping logic and upgrades it to Manifest V3.

Currently (v1.4.0), **this fork focuses on supporting and maintaining conversation downloads for [Poe](https://poe.com/)**. It works entirely locally within your browser to ensure your data remains private and secure.

### Features
- **Poe Focused**: Updated and rewritten `content.js` DOM selectors specifically tailored for the current Poe web interface.
- **Multiple Format Options**: Export your chats to Markdown, HTML, or Plaintext.
- **100% Local Processing**: All data is handled directly within your browser with zero external server requests.
- **Manifest V3**: Upgraded to Manifest V3, compatible with Chrome 110+ and Chromium-based browsers (Chrome, Edge, Brave, etc.). Firefox is not yet supported (its MV3 does not support `background.service_worker`).

### Platform Support Status
| Platform | Status | Notes |
| :--- | :---: | :--- |
| **Poe** | ✅ **Supported** | Actively maintained with updated DOM selectors. |
| **ChatGPT** | ⚠️ Deprecated | Legacy selectors from the original repo (likely broken). |
| **Claude** | ⚠️ Deprecated | Legacy selectors from the original repo (likely broken). |

### Installation

#### For Google Chrome / Microsoft Edge:
1. Download or clone the extension files from this [GitHub repository](https://github.com/kinoyoki/aichatdl_2026).
2. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **"Developer mode"** by toggling the switch in the top right corner.
4. Click on **"Load unpacked"** in the top left corner.
5. Select the folder containing the downloaded extension files.

#### For Mozilla Firefox:
> ⚠️ The current Manifest V3 build uses `background.service_worker`, which Firefox does not yet support, so it cannot be loaded directly. A separate Manifest V2 build would be required for Firefox support.

### Usage
1. Navigate to [Poe](https://poe.com/) and open the conversation you wish to save.
2. Click on the **AI Chat Downloader (Poe Edition)** extension icon in your browser toolbar.
3. Select your preferred export format (Markdown, HTML, or Plaintext).
4. Click **"Extract Conversation"** to download the chat.

### Privacy
- The extension makes no external internet requests.
- All data extraction and formatting occur locally in your browser.
- No conversation data is ever sent to or stored on external servers.

### Contributing & Issues
If Poe updates its UI and breaks the downloader, or if you want to help update the DOM selectors for ChatGPT/Claude, feel free to open an Issue or submit a Pull Request at [github.com/kinoyoki/aichatdl_2026](https://github.com/kinoyoki/aichatdl_2026).

### License & Credits
- Originally created by [fmuk](https://github.com/fmuk/aichatdl).
- Repository: [github.com/kinoyoki/aichatdl_2026](https://github.com/kinoyoki/aichatdl_2026)
- This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [GNU GPLv3 License](https://www.gnu.org/licenses/gpl-3.0.en.html) for more details.

### Disclaimer
This extension is an independent project and is not officially affiliated with Poe, Quora, OpenAI, or Anthropic. Use at your own discretion and in accordance with the terms of service of the respective platforms.