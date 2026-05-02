/* Minimal markdown renderer used for the .md content panes. */
(function () {
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    return s;
  }
  function renderMarkdown(md) {
    md = md.replace(/\r\n/g, '\n');
    // Pull out code fences first
    const codes = [];
    md = md.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, body) => {
      codes.push(esc(body.replace(/\n$/, '')));
      return `\u0000CODE${codes.length - 1}\u0000`;
    });
    // Tables (GFM)
    md = md.replace(/(^\|.+\|\n\|[-: |]+\|\n(?:\|.*\|\n?)+)/gm, (block) => {
      const lines = block.trim().split('\n');
      const head = lines[0].split('|').slice(1, -1).map(s => s.trim());
      const rows = lines.slice(2).map(l => l.split('|').slice(1, -1).map(s => s.trim()));
      const headHtml = head.map(h => `<th>${inline(esc(h))}</th>`).join('');
      const bodyHtml = rows.map(r => `<tr>${r.map(c => `<td>${inline(esc(c))}</td>`).join('')}</tr>`).join('');
      return `\n\n<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>\n\n`;
    });
    // Headings
    md = md.replace(/^#### (.+)$/gm, (_, t) => `<h4>${inline(esc(t))}</h4>`);
    md = md.replace(/^### (.+)$/gm, (_, t) => `<h3>${inline(esc(t))}</h3>`);
    md = md.replace(/^## (.+)$/gm,  (_, t) => `<h2>${inline(esc(t))}</h2>`);
    md = md.replace(/^# (.+)$/gm,   (_, t) => `<h1>${inline(esc(t))}</h1>`);
    // HR
    md = md.replace(/^---+$/gm, '<hr/>');
    // Blockquotes (single-line)
    md = md.replace(/^> ?(.+)$/gm, (_, t) => `<blockquote>${inline(esc(t))}</blockquote>`);
    // Lists
    md = md.replace(/(?:^[-*] .+(?:\n[-*] .+)*)/gm, block => {
      const items = block.split('\n').map(l => l.replace(/^[-*] /, '')).map(l => `<li>${inline(esc(l))}</li>`).join('');
      return `<ul>${items}</ul>`;
    });
    md = md.replace(/(?:^\d+\. .+(?:\n\d+\. .+)*)/gm, block => {
      const items = block.split('\n').map(l => l.replace(/^\d+\. /, '')).map(l => `<li>${inline(esc(l))}</li>`).join('');
      return `<ol>${items}</ol>`;
    });
    // Paragraphs — split on blank lines
    md = md.split(/\n{2,}/).map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|table|blockquote|hr|pre|li)/i.test(block)) return block;
      if (block.startsWith('\u0000CODE')) return block;
      // Single-line text — escape and inline-format
      return `<p>${inline(esc(block.replace(/\n/g, ' ')))}</p>`;
    }).join('\n');
    // Restore code blocks
    md = md.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => `<pre><code>${codes[i]}</code></pre>`);
    return md;
  }
  window.renderMarkdown = renderMarkdown;
})();
