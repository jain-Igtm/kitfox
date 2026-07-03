const chapterPath = "manuscript/chapter-01-st-judes-head.md";
const target = document.getElementById("chapter-content");

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

async function loadChapter() {
  try {
    const response = await fetch(chapterPath, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${chapterPath}`);
    const markdown = await response.text();
    target.innerHTML = markdownToPrettyHtml(markdown);
  } catch (error) {
    target.innerHTML = `<p class="error">Could not load the chapter automatically. You can still read it directly in <a href="${chapterPath}">Markdown</a>.</p>`;
    console.error(error);
  }
}

loadChapter();
