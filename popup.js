let debugLog = [];

const browserAPI = typeof chrome !== 'undefined' ? chrome : browser;

const log = message => {
  debugLog.push(`${new Date().toISOString()}: ${message}`);
  updateDebugLogDisplay();
};

const updateDebugLogDisplay = () => {
  const debugLogElement = document.getElementById('debugLog');
  debugLogElement.textContent = debugLog.join('\n');
  debugLogElement.scrollTop = debugLogElement.scrollHeight;
};

const getCurrentSite = () => {
  browserAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        const siteMap = {
          'chatgpt.com': 'chatgpt',
          'claude.ai': 'claude',
          'poe.com': 'poe'
        };
        const detectedSite = siteMap[url.hostname] || 'unknown';
        log(`Current detected site: ${detectedSite}`);
      } catch (e) {
        log('Unable to parse current tab URL');
      }
    } else {
      log('No active tab found');
    }
  });
};

document.addEventListener('DOMContentLoaded', getCurrentSite);

const handleExtractResponse = (response, format) => {
  if (response) {
    response.logs?.forEach(logMessage => log(logMessage));
    if (response.error) {
      log(`Extraction failed: ${response.error}`);
    } else {
      log(`Extraction completed. ${response.messageCount} messages found.`);
      log(`Platform detected: ${response.platform}`);
      log(`Format used: ${format}`);
      log(response.downloadInitiated ? 'File download initiated.' : 'File download failed to start.');
    }
  } else {
    log('Extraction failed: No response from content script');
  }
};

document.getElementById('extractBtn').addEventListener('click', () => {
  debugLog = [];
  log('Starting conversation extraction...');
  
  const format = document.querySelector('input[name="format"]:checked').value;
  const includeAttachmentsEl = document.getElementById('includeAttachments');
  const includeAttachments = includeAttachmentsEl ? includeAttachmentsEl.checked : true;

  log(`Selected format: ${format}`);
  log(`Include attachments: ${includeAttachments}`);

  browserAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs[0]) {
      log('Error: No active tab found.');
      return;
    }
    const tabId = tabs[0].id;
    log(`Current URL: ${tabs[0].url}`);

    const payload = { action: "extract", format, includeAttachments };

    browserAPI.tabs.sendMessage(tabId, payload, response => {
      if (browserAPI.runtime.lastError) {
        const errMsg = browserAPI.runtime.lastError.message || '';
        // If the extension was reloaded while the tab stayed open, dynamically re-inject content.js and retry
        if (
          errMsg.includes("Receiving end does not exist") ||
          errMsg.includes("Could not establish connection")
        ) {
          if (browserAPI.scripting && browserAPI.scripting.executeScript) {
            log('Content script not active in this tab. Auto-injecting content.js...');
            browserAPI.scripting.executeScript(
              { target: { tabId }, files: ['content.js'] },
              () => {
                if (browserAPI.runtime.lastError) {
                  log(`Error: ${browserAPI.runtime.lastError.message}`);
                  log("Make sure you're on a chatgpt.com, claude.ai, or poe.com page and refresh if necessary.");
                  return;
                }
                log('Re-injected content.js successfully. Retrying extraction...');
                browserAPI.tabs.sendMessage(tabId, payload, retryResponse => {
                  if (browserAPI.runtime.lastError) {
                    log(`Error: ${browserAPI.runtime.lastError.message}`);
                  } else {
                    handleExtractResponse(retryResponse, format);
                  }
                });
              }
            );
            return;
          }
        }

        log(`Error: ${errMsg}`);
        if (
          errMsg.includes("Cannot access contents of url") ||
          errMsg.includes("Could not establish connection")
        ) {
          log("Make sure you're on a chatgpt.com, claude.ai, or poe.com page and refresh if necessary.");
        }
      } else {
        handleExtractResponse(response, format);
      }
    });
  });
});

document.getElementById('copyDebugBtn').addEventListener('click', () => {
  const logText = debugLog.join('\n');
  navigator.clipboard.writeText(logText)
    .then(() => log('Debug log copied to clipboard.'))
    .catch(err => log('Failed to copy debug log: ' + err));
});