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

function extractConversation(format, includeAttachments = true) {
  const logs = [];
  const log = message => {
    console.log(message);
    logs.push(message);
  };

  try {
    const platform = detectPlatform();
    log(`Platform detected: ${platform}`);
    log(`Format selected: ${format}`);
    log(`Include attachments: ${includeAttachments}`);
    
    const messages = extractConversationFromPlatform(platform, format, includeAttachments);
    
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

function extractConversationFromPlatform(platform, format, includeAttachments = true) {
  const extractors = {
    [PLATFORMS.CHATGPT]: extractChatGPTConversation,
    [PLATFORMS.CLAUDE]: extractClaudeConversation,
    [PLATFORMS.POE]: extractPoeConversation
  };

  return extractors[platform] ? extractors[platform](format, includeAttachments) : [];
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

function extractPoeAttachments(messageEl, format) {
  const attachContainer = messageEl.querySelector('[class*="Attachments_attachments"]');
  if (!attachContainer) return '';

  const parts = [];

  // 1. File attachments (e.g., .txt, .md, .pdf, .docx)
  const fileLinks = Array.from(attachContainer.querySelectorAll('[class*="FileInfo_fileInfo"]'));
  fileLinks.forEach(fileEl => {
    const titleEl = fileEl.querySelector('[class*="FileInfo_title"]');
    const metaEl = fileEl.querySelector('[class*="FileInfo_metadata"]');
    const name = (titleEl ? titleEl.textContent : fileEl.getAttribute('alt') || 'Attachment').trim();
    const meta = metaEl ? metaEl.textContent.replace(/\s+/g, ' ').trim() : '';
    const href = fileEl.getAttribute('href') || '';
    const metaSuffix = meta ? ` (${meta})` : '';

    if (format === 'markdown') {
      parts.push(href ? `> **Attachment:** [${name}](${href})${metaSuffix}` : `> **Attachment:** ${name}${metaSuffix}`);
    } else if (format === 'html') {
      parts.push(href
        ? `<p><strong>Attachment:</strong> <a href="${href}">${name}</a>${metaSuffix}</p>`
        : `<p><strong>Attachment:</strong> ${name}${metaSuffix}</p>`);
    } else {
      parts.push(`[Attachment: ${name}${metaSuffix}]`);
    }
  });

  // 2. Image attachments (excluding file-type preview icons inside FileInfo)
  const images = Array.from(attachContainer.querySelectorAll('img'))
    .filter(img => !img.closest('[class*="FileInfo_fileInfo"]') && !(img.className || '').includes('FileInfo_fileTypePreviewIcon'));
  images.forEach(img => {
    const alt = (img.getAttribute('alt') || 'Attached Image').trim();
    const src = img.getAttribute('src') || '';
    if (format === 'markdown') {
      parts.push(`![${alt}](${src})`);
    } else if (format === 'html') {
      parts.push(`<p><img src="${src}" alt="${alt}"></p>`);
    } else {
      parts.push(`[Attached Image: ${alt}]`);
    }
  });

  return parts.join('\n');
}

function extractPoeConversation(format, includeAttachments = true) {
  return Array.from(document.querySelectorAll('[class*="ChatMessage_chatMessage"]'))
    .map(messageEl => {
      const isUser = !!messageEl.querySelector('[class*="rightSideMessageWrapper"]');
      const speaker = isUser ? "User" : "AI";
      const contentEl = messageEl.querySelector('[class*="Markdown_markdownContainer"]');
      const bodyText = contentEl ? extractContent(contentEl, format) : '';
      const attachText = includeAttachments ? extractPoeAttachments(messageEl, format) : '';

      const combined = [bodyText, attachText].filter(Boolean).join('\n\n').trim();
      return combined.length > 0 ? [speaker, combined] : null;
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

function prepareTemplate(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  // 1. Remove Poe's collapsible "Thinking" UI container/header so it doesn't leak "Thinking" at the top of AI turns
  template.content.querySelectorAll('[class*="MarkdownThinkingBlock_root"], [class*="MarkdownThinkingBlock_header"]').forEach(el => el.remove());

  // 2. For Poe code blocks (`MarkdownCodeBlock_container`), capture the explicit header language name
  //     onto `<pre data-explicit-lang="...">` and remove the header/footer UI bars (`javascript`, `Run`, `Copy` buttons).
  template.content.querySelectorAll('[class*="MarkdownCodeBlock_container"]').forEach(container => {
    const langEl = container.querySelector('[class*="MarkdownCodeBlock_languageName"]');
    const explicitLang = langEl ? langEl.textContent.trim() : '';
    const preEl = container.querySelector('pre');
    if (preEl) {
      preEl.setAttribute('data-explicit-lang', explicitLang);
    }
    container.querySelectorAll('[class*="MarkdownCodeBlock_codeHeader"], [class*="MarkdownCodeBlock_codeFooter"]').forEach(el => el.remove());
  });

  // 3. Remove decorative canvas placeholders next to images
  template.content.querySelectorAll('canvas[class*="MarkdownImage_placeholder"]').forEach(el => el.remove());

  return template;
}

function htmlToMarkdown(html) {
  const template = prepareTemplate(html);
  return childrenToMarkdown(template.content)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Convert all child nodes of a DOM node into markdown text.
function childrenToMarkdown(parent) {
  let out = '';
  let lastWasBr = false;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i];
    if (child.nodeType === Node.COMMENT_NODE) {
      continue;
    }
    let chunk = nodeToMarkdown(child);
    if (lastWasBr && child.nodeType === Node.TEXT_NODE) {
      // Strip single SSR newline immediately after <br> (e.g. `<br>\n<!-- -->text`)
      chunk = chunk.replace(/^\r?\n/, '');
    }
    out += chunk;
    lastWasBr = (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'br');
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
      if ((node.className || '').includes('sr-only')) return '';
      return '\n\n' + '#'.repeat(Number(tag[1])) + ' ' + inner().trim() + '\n\n';
    case 'p':
      return inner() + '\n\n';
    case 'ul':
    case 'ol':
      return '\n' + listToMarkdown(node) + '\n';
    case 'table':
      return '\n\n' + tableToMarkdown(node) + '\n\n';
    case 'strong':
    case 'b':
      return '**' + inner() + '**';
    case 'em':
    case 'i':
      return '*' + inner() + '*';
    case 'del':
    case 's':
      return '~~' + inner() + '~~';
    case 'sup': {
      const text = inner().trim();
      if (/^\d+$/.test(text) || node.querySelector('a[href*="fn"]')) {
        return `[^${text}]`;
      }
      return `<sup>${text}</sup>`;
    }
    case 'section': {
      if (node.hasAttribute('data-footnotes') || (node.className || '').includes('footnotes')) {
        return '\n\n' + footnotesToMarkdown(node) + '\n\n';
      }
      return inner();
    }
    case 'input':
      if (node.getAttribute('type') === 'checkbox') {
        return (node.hasAttribute('checked') || node.checked) ? '[x] ' : '[ ] ';
      }
      return '';
    case 'code':
      return '`' + inner() + '`';
    case 'pre': {
      const codeEl = node.querySelector('code');
      let lang = '';
      if (node.hasAttribute('data-explicit-lang')) {
        lang = node.getAttribute('data-explicit-lang') || '';
      } else {
        const classStr = (codeEl && codeEl.className) || node.className || '';
        const langMatch = String(classStr).match(/language-([a-zA-Z0-9_-]+)/);
        lang = langMatch ? langMatch[1] : '';
        if (lang === 'text') lang = '';
      }
      const rawCode = (codeEl ? codeEl.textContent : node.textContent).replace(/\n$/, '');
      const tickRuns = (rawCode.match(/`+/g) || []).map(s => s.length);
      const fenceLen = Math.max(3, ...tickRuns.map(n => n + 1));
      const fence = '`'.repeat(fenceLen);
      return '\n\n' + fence + lang + '\n' + rawCode + '\n' + fence + '\n\n';
    }
    case 'a': {
      const href = node.getAttribute('href') || '';
      const title = node.getAttribute('title');
      const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
      return '[' + inner() + '](' + href + titlePart + ')';
    }
    case 'img': {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      return '![' + alt + '](' + src + ')';
    }
    case 'blockquote': {
      const trimmed = inner().replace(/\n{3,}/g, '\n\n').trim();
      if (!trimmed) return '';
      const quoted = trimmed
        .split('\n')
        .map(line => (line.trim() === '' ? '>' : '> ' + line))
        .join('\n');
      return '\n\n' + quoted + '\n\n';
    }
    case 'hr':
      return '\n\n---\n\n';
    default:
      return inner();
  }
}

function footnotesToMarkdown(section) {
  const items = Array.from(section.querySelectorAll('ol > li'));
  return items.map((li, idx) => {
    const idAttr = li.getAttribute('id') || '';
    const m = idAttr.match(/fn-(\S+)$/);
    const fnId = m ? m[1] : String(idx + 1);
    const text = childrenToMarkdown(li)
      .replace(/\s*↩\s*$/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    return `[^${fnId}]: ${text}`;
  }).join('\n');
}

function listToMarkdown(list) {
  const isOrdered = list.tagName.toLowerCase() === 'ol';
  const start = isOrdered ? (parseInt(list.getAttribute('start'), 10) || 1) : 1;
  return Array.from(list.children)
    .filter(child => child.tagName.toLowerCase() === 'li')
    .map((li, idx) => liToMarkdown(li, isOrdered ? `${start + idx}. ` : '- '))
    .join('\n');
}

function liToMarkdown(li, prefix = '- ') {
  // Check if this li contains multiple <p> children vs nested lists
  const directPs = Array.from(li.children).filter(c => c.tagName.toLowerCase() === 'p');
  const hasMultiplePs = directPs.length > 1;

  let inner = childrenToMarkdown(li).trim();
  // Clean up extra space after task-list checkbox `[x]  text` -> `[x] text`
  inner = inner.replace(/^(\[[ xX]\])\s+/, '$1 ');

  if (hasMultiplePs) {
    inner = inner.replace(/\n{3,}/g, '\n\n');
  } else {
    inner = inner.replace(/\n{2,}/g, '\n');
  }

  const indent = ' '.repeat(prefix.length);
  return prefix + inner.split('\n').map((line, i) => (i === 0 ? line : (line.trim() ? indent + line : ''))).join('\n');
}

function getColumnAlignment(cell) {
  const style = (cell.getAttribute('style') || '').toLowerCase();
  const align = (cell.getAttribute('align') || '').toLowerCase();
  if (style.includes('text-align:center') || style.includes('text-align: center') || align === 'center') {
    return ':---:';
  }
  if (style.includes('text-align:right') || style.includes('text-align: right') || align === 'right') {
    return '---:';
  }
  if (style.includes('text-align:left') || style.includes('text-align: left') || align === 'left') {
    return ':---';
  }
  return '---';
}

function escapeTablePipes(str) {
  // Escape `|` outside of inline `...` code spans
  const parts = str.split(/(`+[^`]*`+)/g);
  return parts.map(part => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return part.replace(/\|/g, '\\|');
    }
    return part.replace(/\|/g, '\\|');
  }).join('');
}

function tableToMarkdown(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return '';
  const mdRows = [];
  rows.forEach((tr, rowIdx) => {
    const rawCells = Array.from(tr.children).filter(el => {
      const t = el.tagName.toLowerCase();
      return t === 'th' || t === 'td';
    });
    if (rawCells.length === 0) return;

    const cells = rawCells.map(cell => {
      const text = childrenToMarkdown(cell)
        .replace(/\s*\n+\s*/g, ' ')
        .trim();
      return escapeTablePipes(text);
    });

    mdRows.push('| ' + cells.join(' | ') + ' |');
    if (rowIdx === 0) {
      const aligns = rawCells.map(getColumnAlignment);
      mdRows.push('| ' + aligns.join(' | ') + ' |');
    }
  });
  return mdRows.join('\n');
}

function htmlToPlaintext(html) {
  const template = prepareTemplate(html);
  return childrenToPlaintext(template.content)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function childrenToPlaintext(parent) {
  let out = '';
  let lastWasBr = false;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i];
    if (child.nodeType === Node.COMMENT_NODE) {
      continue;
    }
    let chunk = nodeToPlaintext(child);
    if (lastWasBr && child.nodeType === Node.TEXT_NODE) {
      chunk = chunk.replace(/^\r?\n/, '');
    }
    out += chunk;
    lastWasBr = (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'br');
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
      if ((node.className || '').includes('sr-only')) return '';
      return '\n\n' + inner().trim() + '\n\n';
    case 'p':
      return inner() + '\n\n';
    case 'ul':
    case 'ol':
      return '\n' + plainListToText(node) + '\n';
    case 'li':
      return '- ' + inner() + '\n';
    case 'input':
      if (node.getAttribute('type') === 'checkbox') {
        return (node.hasAttribute('checked') || node.checked) ? '[x] ' : '[ ] ';
      }
      return '';
    case 'table':
      return '\n\n' + tableToPlaintext(node) + '\n\n';
    case 'pre': {
      const codeEl = node.querySelector('code');
      const rawCode = (codeEl ? codeEl.textContent : node.textContent).replace(/\n$/, '');
      return '\n\n' + rawCode + '\n\n';
    }
    case 'blockquote': {
      const trimmed = inner().replace(/\n{3,}/g, '\n\n').trim();
      if (!trimmed) return '';
      const quoted = trimmed
        .split('\n')
        .map(line => (line.trim() === '' ? '>' : '> ' + line))
        .join('\n');
      return '\n\n' + quoted + '\n\n';
    }
    case 'hr':
      return '\n\n---\n\n';
    case 'img':
      return node.getAttribute('alt') || '';
    default:
      return inner();
  }
}

function plainListToText(list) {
  const isOrdered = list.tagName.toLowerCase() === 'ol';
  const start = isOrdered ? (parseInt(list.getAttribute('start'), 10) || 1) : 1;
  return Array.from(list.children)
    .filter(child => child.tagName.toLowerCase() === 'li')
    .map((li, idx) => plainLiToText(li, isOrdered ? `${start + idx}. ` : '- '))
    .join('\n');
}

function plainLiToText(li, prefix = '- ') {
  let inner = childrenToPlaintext(li)
    .replace(/\n{2,}/g, '\n')
    .trim();
  inner = inner.replace(/^(\[[ xX]\])\s+/, '$1 ');
  const indent = ' '.repeat(prefix.length);
  return prefix + inner.replace(/\n/g, '\n' + indent);
}

function tableToPlaintext(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return '';
  return rows
    .map(tr => Array.from(tr.children)
      .filter(el => {
        const t = el.tagName.toLowerCase();
        return t === 'th' || t === 'td';
      })
      .map(cell => childrenToPlaintext(cell).replace(/\s*\n+\s*/g, ' ').trim())
      .join(' | '))
    .filter(Boolean)
    .join('\n');
}

function simplifyHtml(html) {
  const template = prepareTemplate(html);

  // Keep only semantic attributes; drop class/style/id/data-*/aria-*/node="[object Object]" etc.
  const keep = ['href', 'src', 'alt', 'title', 'start', 'checked', 'type'];
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
    sendResponse(extractConversation(request.format, request.includeAttachments !== false));
  } else if (request.action === "detectPlatform") {
    sendResponse({ platform: detectPlatform() });
  }
});