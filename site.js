const chapters = {
  "1": {
    path: "manuscript/chapter-01-st-judes-head.md",
    kicker: "Chapter One",
    title: "St. Jude’s Head"
  },
  "2": {
    path: "manuscript/chapter-02-the-paper-door.md",
    kicker: "Chapter Two",
    title: "The Paper Door"
  }
};

const target = document.getElementById("chapter-content");
const kicker = document.getElementById("chapter-kicker");
const heading = document.getElementById("chapter-heading");
const chapterRows = document.querySelectorAll("[data-chapter]");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function markdownToPrettyHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    if (text) blocks.push(`<p>${escapeHtml(text)}</p>`);
    paragraph = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph();
      blocks.push(`<h1>${escapeHtml(trimmed.slice(2).trim())}</h1>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      blocks.push(`<h2>${escapeHtml(trimmed.slice(3).trim())}</h2>`);
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      flushParagraph();
      blocks.push("<hr />");
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  return blocks.join("\n");
}

function getChapterIdFromHash() {
  const match = window.location.hash.match(/^#chapter-(\d+)$/);
  return match && chapters[match[1]] ? match[1] : "1";
}

function setActiveChapter(chapterId) {
  chapterRows.forEach((row) => {
    row.classList.toggle("active", row.dataset.chapter === chapterId);
  });
}

async function loadChapter(chapterId = getChapterIdFromHash()) {
  const chapter = chapters[chapterId] || chapters["1"];
  setActiveChapter(chapterId);
  kicker.textContent = chapter.kicker;
  heading.textContent = chapter.title;
  target.innerHTML = `<p class="loading">Loading ${escapeHtml(chapter.kicker.toLowerCase())}...</p>`;

  try {
    const response = await fetch(chapter.path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${chapter.path}`);
    const markdown = await response.text();
    target.innerHTML = markdownToPrettyHtml(markdown);
    document.getElementById("chapter").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    target.innerHTML = `<p class="error">Could not load the chapter automatically. You can still read it directly in <a href="${chapter.path}">Markdown</a>.</p>`;
    console.error(error);
  }
}

chapterRows.forEach((row) => {
  row.addEventListener("click", (event) => {
    event.preventDefault();
    const chapterId = row.dataset.chapter;
    history.pushState(null, "", `#chapter-${chapterId}`);
    loadChapter(chapterId);
  });
});

window.addEventListener("popstate", () => loadChapter());
window.addEventListener("hashchange", () => loadChapter());

loadChapter();
