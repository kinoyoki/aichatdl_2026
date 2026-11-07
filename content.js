const browserAPI = typeof chrome !== 'undefined' ? chrome : browser;

const PLATFORMS = {
  CLAUDE: 'Claude',
  CHATGPT: 'ChatGPT',
  POE: 'Poe',
  UNKNOWN: 'Unknown'
};

const FORMAT_HANDLERS = {
  markdown: {
    convert: htmlToMarkdown,
    fileExtension: 'md',
    formatMetadata: (url, platform) => `# Conversation extracted from ${url}\n**Platform:** ${platform}\n**Format:** markdown\n\n`,
    formatMessage: (speaker, text) => `## ${speaker}:\n${text}\n\n`
  },
  html: {
    convert: simplifyHtml,
    fileExtension: 'html',
    formatMetadata: (url, platform) => `<h1>Conversation extracted from ${url}</h1><p><strong>Platform:</strong> ${platform}</p><p><strong>Format:</strong> html</p>`,
    formatMessage: (speaker, text) => `<h2>${speaker}:</h2><div>${text}</div>`
  },
  plaintext: {
    convert: htmlToPlaintext,
    fileExtension: 'txt',
    formatMetadata: (url, platform) => `Conversation extracted from ${url}\nPlatform: ${platform}\nFormat: plaintext\n\n`,
    formatMessage: (speaker, text) => `${speaker}:\n${text}\n\n`
  }
};

function extractConversation(format) {
  const logs = [];
  const log = message => {
    console.log(message);
    logs.push(message);
  };

  try {
    const platform = detectPlatform();
    log(`Platform detected: ${platform}`);
    log(`Format selected: ${format}`);
    
    const messages = extractConversationFromPlatform(platform, format);
    
    if (messages.length > 0) {
      const content = formatConversation(platform, messages, format);
      const downloadStatus = downloadConversation(content, format);
      return { platform, messageCount: messages.length, downloadInitiated: true, logs };
    } else {
      return { error: "No messages found in the conversation.", logs };
    }
  } catch (error) {
    return { error: `Extraction failed: ${error.message}`, logs };
  }
}

function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname === 'chatgpt.com' || hostname.endsWith('.chatgpt.com')) return PLATFORMS.CHATGPT;
  if (hostname === 'claude.ai' || hostname.endsWith('.claude.ai')) return PLATFORMS.CLAUDE;
  if (hostname === 'poe.com' || hostname.endsWith('.poe.com')) return PLATFORMS.POE;
  return PLATFORMS.UNKNOWN;
}

function extractConversationFromPlatform(platform, format) {
  const extractors = {
    [PLATFORMS.CHATGPT]: extractChatGPTConversation,
    [PLATFORMS.CLAUDE]: extractClaudeConversation,
    [PLATFORMS.POE]: extractPoeConversation
  };

  return extractors[platform] ? extractors[platform](format) : [];
}

function extractChatGPTConversation(format) {
  return Array.from(document.querySelectorAll('div.group\\/conversation-turn'))
    .map(turn => {
      const speaker = turn.querySelector('.agent-turn') ? "AI" : "User";
      const contentDiv = turn.querySelector('.min-h-8.text-message, .min-h-\\[20px\\].text-message');
      
      if (contentDiv) {
        return [speaker, extractContent(contentDiv, format)];
      }
      return null;
    })
    .filter(message => message && message[1].length > 1);
}

function extractClaudeConversation(format) {
  return Array.from(document.querySelectorAll('div.font-user-message, div.font-claude-message'))
    .map(container => {
      const speaker = container.classList.contains('font-user-message') ? "User" : "AI";
      const contentElement = speaker === "AI" ? container.querySelector('div') : container;
      return [speaker, extractContent(contentElement, format)];
    })
    .filter(([, text]) => text.length > 1);
}

function extractPoeConversation(format) {
  return Array.from(document.querySelectorAll('[class*="ChatMessage_chatMessage"]'))
    .map(messageEl => {
      const isUser = !!messageEl.querySelector('[class*="rightSideMessageWrapper"]');
      const speaker = isUser ? "User" : "AI";
      const contentEl = messageEl.querySelector('[class*="Markdown_markdownContainer"]');
      if (!contentEl) return null;
      const text = extractContent(contentEl, format);
      return text.length > 1 ? [speaker, text] : null;
    })
    .filter(message => message !== null);
}

function extractContent(element, format) {
  return FORMAT_HANDLERS[format].convert(element.innerHTML);
}

function formatConversation(platform, messages, format) {
  const { formatMetadata, formatMessage } = FORMAT_HANDLERS[format];
  let content = formatMetadata(window.location.href, platform);
  messages.forEach(([speaker, text]) => {
    content += formatMessage(speaker, text);
  });
  return content;
}

function downloadConversation(content, format) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation_${new Date().toISOString().replace(/[:.]/g, '-')}.${FORMAT_HANDLERS[format].fileExtension}`;
  a.click();
  URL.revokeObjectURL(url);
  return 'File download initiated';
}

function htmlToMarkdown(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return childrenToMarkdown(template.content)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Convert all child nodes of a DOM node into markdown text.
function childrenToMarkdown(parent) {
  let out = '';
  for (let i = 0; i < parent.childNodes.length; i++) {
    out += nodeToMarkdown(parent.childNodes[i]);
  }
  return out;
}

function nodeToMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tag = node.tagName.toLowerCase();
  const inner = () => childrenToMarkdown(node);

  switch (tag) {
    case 'br':
      return '\n';
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
      return '\n' + '#'.repeat(Number(tag[1])) + ' ' + inner().trim() + '\n';
    case 'p':
      return inner() + '\n';
    case 'ul':
    case 'ol':
      return '\n' + listToMarkdown(node) + '\n';
    case 'strong':
    case 'b':
      return '**' + inner() + '**';
    case 'em':
    case 'i':
      return '*' + inner() + '*';
    case 'code':
      return '`' + inner() + '`';
    case 'pre':
      return '\n```\n' + inner() + '\n```\n';
    case 'a': {
      const href = node.getAttribute('href') || '';
      return '[' + inner() + '](' + href + ')';
    }
    case 'img': {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      return '![' + alt + '](' + src + ')';
    }
    case 'blockquote':
      return '\n> ' + inner().replace(/\n/g, '\n> ') + '\n';
    case 'hr':
      return '\n---\n';
    default:
      return inner();
  }
}

function listToMarkdown(list) {
  return Array.from(list.children)
    .filter(child => child.tagName.toLowerCase() === 'li')
    .map(liToMarkdown)
    .join('\n');
}

function liToMarkdown(li) {
  const inner = childrenToMarkdown(li)
    .replace(/\n{2,}/g, '\n')
    .trim();
  return '- ' + inner.replace(/\n/g, '\n  ');
}

function htmlToPlaintext(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return childrenToPlaintext(template.content)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function childrenToPlaintext(parent) {
  let out = '';
  for (let i = 0; i < parent.childNodes.length; i++) {
    out += nodeToPlaintext(parent.childNodes[i]);
  }
  return out;
}

function nodeToPlaintext(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tag = node.tagName.toLowerCase();
  const inner = () => childrenToPlaintext(node);

  switch (tag) {
    case 'br':
      return '\n';
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
      return '\n' + inner().trim() + '\n';
    case 'p':
      return inner() + '\n';
    case 'ul':
    case 'ol':
      return '\n' + plainListToText(node) + '\n';
    case 'li':
      return '- ' + inner() + '\n';
    case 'blockquote':
      return '\n> ' + inner().replace(/\n/g, '\n> ') + '\n';
    case 'hr':
      return '\n---\n';
    case 'img':
      return node.getAttribute('alt') || '';
    default:
      return inner();
  }
}

function plainListToText(list) {
  return Array.from(list.children)
    .filter(child => child.tagName.toLowerCase() === 'li')
    .map(plainLiToText)
    .join('\n');
}

function plainLiToText(li) {
  const inner = childrenToPlaintext(li)
    .replace(/\n{2,}/g, '\n')
    .trim();
  return '- ' + inner.replace(/\n/g, '\n  ');
}

function simplifyHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  // Keep only semantic attributes; drop class/style/id/data-*/aria-* etc.
  const keep = ['href', 'src', 'alt', 'title'];
  template.content.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (!keep.includes(attr.name.toLowerCase())) {
        el.removeAttribute(attr.name);
      }
    }
  });

  // Serialize and add newlines after block-level tags for readability.
  return template.content.innerHTML
    .replace(/<br\s*\/?>/gi, '<br>\n')
    .replace(/<\/(p|h[1-6]|li|ul|ol|blockquote|pre|table|tr|div)>/gi, '</$1>\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    sendResponse(extractConversation(request.format));
  } else if (request.action === "detectPlatform") {
    sendResponse({ platform: detectPlatform() });
  }
});
