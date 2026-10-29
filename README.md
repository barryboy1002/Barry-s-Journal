# Barry's Journal — Systems Engineering Blog & Portfolio

Personal systems engineering journal and project portfolio for **Barry Odoro**, hosted on GitHub Pages.

- **Live Website**: [https://barryboy1002.github.io/Barry-s-Journal/](https://barryboy1002.github.io/Barry-s-Journal/)
- **Repository**: `git@github.com:barryboy1002/Barry-s-Journal.git`

---

## How to Publish a New Blog Post

All blog posts live as standard Markdown (`.md`) files inside the [`posts/`](./posts) directory. You can publish new posts in two ways:

### Option 1: Using the Helper Scripts (Fastest Local Workflow)

1. **Create a new post template**:
   ```bash
   ./new-post.sh "My New Kernel Post Title" "osdev, x86, c"
   ```
   This creates `posts/YYYY-MM-DD-my-new-kernel-post-title.md` with pre-filled frontmatter.

2. **Write your post** in that `.md` file using your favorite editor (`nvim`, VS Code, etc.):
   ```markdown
   ---
   title: My New Kernel Post Title
   date: 2026-10-29
   tags: osdev, x86, c
   summary: A short one-line summary shown on the main card.
   ---

   Your Markdown content goes here!
   ```

3. **Build & Publish to GitHub Pages in one command**:
   ```bash
   ./publish.sh "Add post on x86 paging"
   ```
   (`publish.sh` runs `python3 build.py` to compile `posts/*.md` into `posts/posts.js`, commits your changes, and pushes to `origin main`.)

---

### Option 2: Manual / Direct Git Workflow

1. Create any `.md` file inside `posts/` (e.g. `posts/2026-11-01-pic-remapping.md`) with the `---` frontmatter header at the top.
2. Run the zero-dependency build script:
   ```bash
   python3 build.py
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "Publish new blog post"
   git push origin main
   ```

*(Note: Even if you create or edit a `.md` file directly on the GitHub web UI without running `python3 build.py` locally, the included GitHub Actions workflow `.github/workflows/deploy.yml` will automatically run `python3 build.py` when deploying via GitHub Actions).*

---

## Previewing Locally

Because `build.py` bundles your posts into `posts/posts.js`, you can preview the site either by:
- Opening `index.html` directly in your browser, OR
- Running a quick local HTTP server:
  ```bash
  python3 -m http.server 8000
  ```
  and visiting `http://localhost:8000`.

---

## Adding More Projects Later

To add a new project to the **§ II. Forged Systems & Projects** section, open [`index.html`](./index.html), locate `<div class="projects-grid">`, and duplicate the `<article class="project-card">...</article>` block with your new repository's details.
