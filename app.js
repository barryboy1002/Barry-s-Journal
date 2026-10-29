(function () {
  "use strict";

  const postsListEl = document.getElementById("posts-list");
  const tagFilterBarEl = document.getElementById("tag-filter-bar");
  const searchInputEl = document.getElementById("post-search-input");
  const homeSectionsViewEl = document.getElementById("home-sections-view");
  const heroSectionEl = document.getElementById("hero-section");
  const postReaderViewEl = document.getElementById("post-reader-view");
  const postArticleContainerEl = document.getElementById("post-article-container");
  const readerPostPathEl = document.getElementById("reader-post-path");
  const backToJournalBtn = document.getElementById("back-to-journal-btn");
  const brandLink = document.getElementById("brand-link");
  const navLinks = document.querySelectorAll(".nav-link");

  let allPosts = Array.isArray(window.JOURNAL_POSTS) ? window.JOURNAL_POSTS : [];
  let activeTag = "all";
  let searchQuery = "";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseInlineMarkdown(text) {
    let out = escapeHtml(text);
    // Inline code `code`
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold **text**
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic *text*
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // Links [label](url)
    out = out.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|#[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return out;
  }

  function renderMarkdown(md) {
    const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inCodeBlock = false;
    let codeLang = "";
    let codeBuffer = [];
    let inList = false;
    let listType = "ul";

    function closeList() {
      if (inList) {
        html.push(`</${listType}>`);
        inList = false;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith("```")) {
        closeList();
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          const langAttr = codeLang ? ` data-lang="${escapeHtml(codeLang)}"` : "";
          html.push(
            `<pre${langAttr}><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`
          );
          inCodeBlock = false;
          codeLang = "";
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) {
        closeList();
        continue;
      }

      if (/^---+$/.test(trimmed)) {
        closeList();
        html.push("<hr />");
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        closeList();
        const level = headingMatch[1].length;
        html.push(`<h${level}>${parseInlineMarkdown(headingMatch[2])}</h${level}>`);
        continue;
      }

      if (trimmed.startsWith("> ")) {
        closeList();
        html.push(`<blockquote>${parseInlineMarkdown(trimmed.slice(2))}</blockquote>`);
        continue;
      }

      const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
      if (ulMatch) {
        if (!inList || listType !== "ul") {
          closeList();
          html.push("<ul>");
          inList = true;
          listType = "ul";
        }
        html.push(`<li>${parseInlineMarkdown(ulMatch[1])}</li>`);
        continue;
      }

      const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
      if (olMatch) {
        if (!inList || listType !== "ol") {
          closeList();
          html.push("<ol>");
          inList = true;
          listType = "ol";
        }
        html.push(`<li>${parseInlineMarkdown(olMatch[1])}</li>`);
        continue;
      }

      closeList();
      html.push(`<p>${parseInlineMarkdown(trimmed)}</p>`);
    }

    closeList();
    if (inCodeBlock) {
      html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
    }

    return html.join("\n");
  }

  function renderTags() {
    const tagSet = new Set();
    allPosts.forEach((post) => {
      (post.tags || []).forEach((t) => tagSet.add(t));
    });

    const tags = ["all", ...Array.from(tagSet)];
    tagFilterBarEl.innerHTML = tags
      .map((tag) => {
        const isActive = tag === activeTag ? "active" : "";
        const label = tag === "all" ? "ALL LOGS" : `#${tag}`;
        return `<button type="button" class="tag-btn ${isActive}" data-tag="${escapeHtml(
          tag
        )}">${escapeHtml(label)}</button>`;
      })
      .join("");

    tagFilterBarEl.querySelectorAll(".tag-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTag = btn.getAttribute("data-tag") || "all";
        renderTags();
        renderPostsList();
      });
    });
  }

  function renderPostsList() {
    const q = searchQuery.toLowerCase().trim();
    const filtered = allPosts.filter((post) => {
      const matchesTag =
        activeTag === "all" || (post.tags || []).includes(activeTag);
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        (post.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        (post.body || "").toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });

    if (filtered.length === 0) {
      postsListEl.innerHTML = `
        <div class="post-card" style="cursor: default;">
          <p class="mono-muted">NO MATCHING CHRONICLES FOUND IN ARCHIVE.</p>
        </div>
      `;
      return;
    }

    postsListEl.innerHTML = filtered
      .map((post) => {
        const tagsHtml = (post.tags || [])
          .map((t) => `<span class="post-tag">#${escapeHtml(t)}</span>`)
          .join("");
        return `
          <article class="post-card" data-slug="${escapeHtml(post.slug)}" tabindex="0" role="button" aria-label="Read ${escapeHtml(post.title)}">
            <div class="post-meta-row">
              <span class="post-date">${escapeHtml(post.date)}</span>
              <span>${escapeHtml(post.readingTime || "4 min read")}</span>
            </div>
            <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
            <p class="post-card-summary">${escapeHtml(post.summary)}</p>
            <div class="post-card-footer">
              <div class="post-tags">${tagsHtml}</div>
              <span class="read-more-link">Read Entry &rarr;</span>
            </div>
          </article>
        `;
      })
      .join("");

    postsListEl.querySelectorAll(".post-card[data-slug]").forEach((card) => {
      const openPost = () => {
        const slug = card.getAttribute("data-slug");
        window.location.hash = `#post/${slug}`;
      };
      card.addEventListener("click", openPost);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPost();
        }
      });
    });
  }

  function openPostBySlug(slug) {
    const post = allPosts.find((p) => p.slug === slug);
    if (!post) {
      closeReaderView();
      return;
    }

    homeSectionsViewEl.classList.add("hidden");
    heroSectionEl.classList.add("hidden");
    postReaderViewEl.classList.remove("hidden");

    readerPostPathEl.textContent = `posts/${post.slug}.md`;
    const tagsHtml = (post.tags || [])
      .map((t) => `<span class="post-tag">#${escapeHtml(t)}</span>`)
      .join(" ");

    postArticleContainerEl.innerHTML = `
      <header class="article-header">
        <div class="article-meta">
          <span class="post-date">${escapeHtml(post.date)}</span>
          <span>&bull;</span>
          <span>${escapeHtml(post.readingTime || "4 min read")}</span>
          <span>&bull;</span>
          <div class="post-tags">${tagsHtml}</div>
        </div>
        <h1 class="article-title">${escapeHtml(post.title)}</h1>
      </header>
      <div class="markdown-body">
        ${renderMarkdown(post.body)}
      </div>
    `;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeReaderView() {
    postReaderViewEl.classList.add("hidden");
    homeSectionsViewEl.classList.remove("hidden");
    heroSectionEl.classList.remove("hidden");
  }

  function handleHashChange() {
    const hash = window.location.hash || "";
    if (hash.startsWith("#post/")) {
      const slug = decodeURIComponent(hash.slice("#post/".length));
      openPostBySlug(slug);
    } else {
      closeReaderView();
      if (hash && hash !== "#top") {
        const target = document.querySelector(hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    }

    // Update active state in nav
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (hash.startsWith("#post/") && href === "#journal") {
        link.classList.add("active");
      } else if (hash === href) {
        link.classList.add("active");
      } else if (!hash && href === "#journal") {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  if (searchInputEl) {
    searchInputEl.addEventListener("input", (e) => {
      searchQuery = e.target.value || "";
      renderPostsList();
    });
  }

  if (backToJournalBtn) {
    backToJournalBtn.addEventListener("click", () => {
      window.location.hash = "#journal";
    });
  }

  if (brandLink) {
    brandLink.addEventListener("click", () => {
      closeReaderView();
    });
  }

  window.addEventListener("hashchange", handleHashChange);

  renderTags();
  renderPostsList();
  handleHashChange();
})();
