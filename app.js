(function () {
  const posts = Array.isArray(window.JOURNAL_POSTS) ? window.JOURNAL_POSTS : [];
  const postsListEl = document.getElementById("posts-list");
  const mainViewEl = document.getElementById("main-view");
  const postViewEl = document.getElementById("post-view");
  const postContentEl = document.getElementById("post-content");

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseInline(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|#[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );
  }

  function renderMarkdown(md) {
    const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inCode = false;
    let codeBuf = [];
    let inList = false;

    function closeList() {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    }

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        closeList();
        if (!inCode) {
          inCode = true;
          codeBuf = [];
        } else {
          html.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
          inCode = false;
        }
        continue;
      }
      if (inCode) {
        codeBuf.push(line);
        continue;
      }

      const t = line.trim();
      if (!t) {
        closeList();
        continue;
      }
      if (/^---+$/.test(t)) {
        closeList();
        html.push("<hr />");
        continue;
      }
      const h = t.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        closeList();
        const lvl = h[1].length;
        html.push(`<h${lvl}>${parseInline(h[2])}</h${lvl}>`);
        continue;
      }
      if (t.startsWith("> ")) {
        closeList();
        html.push(`<blockquote>${parseInline(t.slice(2))}</blockquote>`);
        continue;
      }
      if (t.startsWith("- ") || t.startsWith("* ")) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        html.push(`<li>${parseInline(t.slice(2))}</li>`);
        continue;
      }
      closeList();
      html.push(`<p>${parseInline(t)}</p>`);
    }
    closeList();
    return html.join("\n");
  }

  function renderList() {
    if (posts.length === 0) {
      postsListEl.innerHTML = '<p class="muted">No posts yet.</p>';
      return;
    }

    postsListEl.innerHTML = posts
      .map(
        (p) => `
        <div class="post-item">
          <span class="post-date">${escapeHtml(p.date)}</span>
          <a href="#post/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>
        </div>`
      )
      .join("");
  }

  function route() {
    const hash = window.location.hash || "";
    if (hash.startsWith("#post/")) {
      const slug = decodeURIComponent(hash.slice(6));
      const post = posts.find((p) => p.slug === slug);
      if (post) {
        mainViewEl.classList.add("hidden");
        postViewEl.classList.remove("hidden");
        postContentEl.innerHTML = `
          <h1>${escapeHtml(post.title)}</h1>
          <p class="muted">${escapeHtml(post.date)}</p>
          ${renderMarkdown(post.body)}
        `;
        window.scrollTo(0, 0);
        return;
      }
    }
    postViewEl.classList.add("hidden");
    mainViewEl.classList.remove("hidden");
  }

  window.addEventListener("hashchange", route);
  renderList();
  route();
})();
