const stories = {
  jane: {
    label: "Jane",
    summary: "Jane the Pilot: literary aviation rescue fiction set on St. Jude's Head, Alaska.",
    works: {
      "chapter-1": {
        path: "manuscript/chapter-01-st-judes-head.md",
        kicker: "Jane · Chapter One",
        title: "St. Jude’s Head",
        description: "Jane enters the island during the Mercy Cove emergency."
      },
      "chapter-2": {
        path: "manuscript/chapter-02-the-paper-door.md",
        kicker: "Jane · Chapter Two",
        title: "Salt on the Struts",
        description: "The morning after Mercy Cove, Wade starts trying to understand what Jane actually is."
      }
    }
  },
  everett: {
    label: "Everett",
    summary: "Everett: a boy trained as an assassin by a Colorado steppe cult, trying to build a life in Maddie's house while the trial keeps moving toward him.",
    works: {
      "foundational-fragment": {
        path: "manuscript/everett-foundational-fragment.md",
        kicker: "Everett · Foundational Fragment",
        title: "Everett",
        description: "Mother Serene calls him from confinement; later, Everett tests whether the divine purpose will finally answer back."
      }
    }
  },
  oceanBridge: {
    label: "Ocean-Bridge",
    summary: "Ocean-Bridge World: steel spans over bad water, ferries under surveillance, maintenance politics, and checkpoint routines.",
    works: {}
  },
  arthur: {
    label: "Arthur",
    summary: "Arthur: scenes about perception, force, quiet surveillance, and the uneasy distance between being gifted and being owned.",
    works: {}
  }
};

const reader = document.getElementById("reader");
const target = document.getElementById("reader-content");
const kicker = document.getElementById("reader-kicker");
const heading = document.getElementById("reader-heading");
const note = document.getElementById("reader-note");
const storySummary = document.getElementById("story-summary");
const storyTabs = document.querySelectorAll("[data-story]");
const workList = document.getElementById("work-list");

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

function getFirstWorkId(storyId) {
  const workIds = Object.keys(stories[storyId]?.works || {});
  return workIds[0] || null;
}

function getStateFromHash() {
  const rawHash = window.location.hash.replace(/^#/, "");
  const [storyId, workId] = rawHash.split("/");

  if (stories[storyId]) {
    const resolvedWork = stories[storyId].works[workId] ? workId : getFirstWorkId(storyId);
    return { storyId, workId: resolvedWork };
  }

  return { storyId: "jane", workId: "chapter-1" };
}

function setActiveStory(storyId) {
  storyTabs.forEach((tab) => {
    const isActive = tab.dataset.story === storyId;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function renderWorkList(storyId, activeWorkId) {
  const story = stories[storyId];
  const workEntries = Object.entries(story.works);
  storySummary.textContent = story.summary;

  if (!workEntries.length) {
    workList.innerHTML = `
      <div class="empty-shelf">
        <strong>${escapeHtml(story.label)} shelf prepared</strong>
        <span>There are no posted pieces here yet, but the tab is ready.</span>
      </div>
    `;
    return;
  }

  workList.innerHTML = workEntries.map(([workId, work]) => `
    <a class="chapter-row ${workId === activeWorkId ? "active" : ""}" href="#${storyId}/${workId}" data-work="${escapeHtml(workId)}">
      <span class="chapter-number">${escapeHtml(story.label.slice(0, 2))}</span>
      <span>
        <strong>${escapeHtml(work.title)}</strong>
        <em>${escapeHtml(work.description)}</em>
      </span>
    </a>
  `).join("");
}

async function loadWork(storyId, workId, shouldScroll = true) {
  const story = stories[storyId] || stories.jane;
  const resolvedWorkId = story.works[workId] ? workId : getFirstWorkId(storyId);

  setActiveStory(storyId);
  renderWorkList(storyId, resolvedWorkId);

  if (!resolvedWorkId) {
    kicker.textContent = `${story.label} · Shelf`;
    heading.textContent = `${story.label}`;
    note.innerHTML = "This story tab is ready for future pieces.";
    target.innerHTML = `<p class="loading">No posted pieces yet.</p>`;
    if (shouldScroll) reader.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const work = story.works[resolvedWorkId];
  kicker.textContent = work.kicker;
  heading.textContent = work.title;
  note.innerHTML = `Loaded from <code>${escapeHtml(work.path)}</code>.`;
  target.innerHTML = `<p class="loading">Loading ${escapeHtml(work.title)}...</p>`;

  try {
    const response = await fetch(work.path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${work.path}`);
    const markdown = await response.text();
    target.innerHTML = markdownToPrettyHtml(markdown);
    if (shouldScroll) reader.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    target.innerHTML = `<p class="error">Could not load the piece automatically. You can still read it directly in <a href="${work.path}">Markdown</a>.</p>`;
    console.error(error);
  }
}

storyTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const storyId = tab.dataset.story;
    const workId = getFirstWorkId(storyId);
    history.pushState(null, "", workId ? `#${storyId}/${workId}` : `#${storyId}`);
    loadWork(storyId, workId);
  });
});

workList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-work]");
  if (!row) return;

  event.preventDefault();
  const { storyId } = getStateFromHash();
  const workId = row.dataset.work;
  history.pushState(null, "", `#${storyId}/${workId}`);
  loadWork(storyId, workId);
});

window.addEventListener("popstate", () => {
  const { storyId, workId } = getStateFromHash();
  loadWork(storyId, workId);
});

window.addEventListener("hashchange", () => {
  const { storyId, workId } = getStateFromHash();
  loadWork(storyId, workId);
});

const initialState = getStateFromHash();
loadWork(initialState.storyId, initialState.workId, false);
