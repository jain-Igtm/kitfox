const collections = {
  jane: {
    label: "Jane",
    note: "Jane the Pilot / Kitfox",
    stories: {
      "1": {
        path: "manuscript/chapter-01-st-judes-head.md",
        number: "01",
        kicker: "Jane / Chapter One",
        title: "St. Jude’s Head",
        summary: "Jane enters the island during the Mercy Cove emergency."
      },
      "2": {
        path: "manuscript/chapter-02-the-paper-door.md",
        number: "02",
        kicker: "Jane / Chapter Two",
        title: "Salt on the Struts",
        summary: "The morning after Mercy Cove, Wade starts trying to understand what Jane actually is."
      }
    }
  },
  everett: {
    label: "Everett",
    note: "Colorado steppe / New Mercy aftermath",
    stories: {
      "1": {
        path: "stories/everett/01-the-dry-well.md",
        number: "01",
        kicker: "Everett / Story One",
        title: "The Dry Well",
        summary: "Inside New Mercy, water, inspection, obedience, and the first shape of necessary violence."
      },
      "2": {
        path: "stories/everett/02-county-hours.md",
        number: "02",
        kicker: "Everett / Story Two",
        title: "County Hours",
        summary: "After the fire, the county tries to process Everett as both a child and a weapon."
      },
      "3": {
        path: "stories/everett/03-madelines-porch.md",
        number: "03",
        kicker: "Everett / Story Three",
        title: "Madeline’s Porch",
        summary: "Madeline’s first night with Everett, where kindness has to move carefully."
      },
      "4": {
        path: "stories/everett/04-the-night-room.md",
        number: "04",
        kicker: "Everett / Story Four",
        title: "The Night Room",
        summary: "The first morning in Madeline’s house begins with a nightmare the county cannot neatly categorize."
      }
    }
  }
};

const target = document.getElementById("chapter-content");
const kicker = document.getElementById("chapter-kicker");
const heading = document.getElementById("chapter-heading");
const note = document.getElementById("chapter-note");
const storyList = document.getElementById("story-list");
const collectionTabs = document.querySelectorAll("[data-collection-tab]");

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

function getSelectionFromHash() {
  const rawHash = window.location.hash.replace(/^#/, "");

  if (!rawHash) {
    return { collectionKey: "jane", storyId: "1" };
  }

  const legacyChapter = rawHash.match(/^chapter-(\d+)$/);
  if (legacyChapter) {
    const storyId = legacyChapter[1];
    return {
      collectionKey: "jane",
      storyId: collections.jane.stories[storyId] ? storyId : "1"
    };
  }

  const match = rawHash.match(/^([a-z]+)-(\d+)$/);
  if (!match) {
    return { collectionKey: "jane", storyId: "1" };
  }

  const collectionKey = collections[match[1]] ? match[1] : "jane";
  const storyId = collections[collectionKey].stories[match[2]] ? match[2] : "1";
  return { collectionKey, storyId };
}

function setActiveCollection(collectionKey) {
  collectionTabs.forEach((tab) => {
    const active = tab.dataset.collectionTab === collectionKey;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

function renderStoryList(collectionKey, activeStoryId) {
  const collection = collections[collectionKey];
  storyList.innerHTML = Object.entries(collection.stories)
    .map(([storyId, story]) => {
      const activeClass = storyId === activeStoryId ? " active" : "";
      return `
        <a class="chapter-row${activeClass}" href="#${collectionKey}-${storyId}" data-story-link="${collectionKey}-${storyId}">
          <span class="chapter-number">${escapeHtml(story.number)}</span>
          <span>
            <strong>${escapeHtml(story.title)}</strong>
            <em>${escapeHtml(story.summary)}</em>
          </span>
        </a>
      `;
    })
    .join("");

  storyList.querySelectorAll("[data-story-link]").forEach((row) => {
    row.addEventListener("click", (event) => {
      event.preventDefault();
      const [nextCollectionKey, nextStoryId] = row.dataset.storyLink.split("-");
      history.pushState(null, "", `#${nextCollectionKey}-${nextStoryId}`);
      loadStory(nextCollectionKey, nextStoryId);
    });
  });
}

async function loadStory(collectionKey, storyId) {
  const collection = collections[collectionKey] || collections.jane;
  const story = collection.stories[storyId] || collection.stories["1"];
  const resolvedStoryId = collection.stories[storyId] ? storyId : "1";

  setActiveCollection(collectionKey);
  renderStoryList(collectionKey, resolvedStoryId);

  kicker.textContent = story.kicker;
  heading.textContent = story.title;
  note.textContent = `Loaded from ${story.path}.`;
  target.innerHTML = `<p class="loading">Loading ${escapeHtml(story.title)}...</p>`;

  try {
    const response = await fetch(story.path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${story.path}`);
    const markdown = await response.text();
    target.innerHTML = markdownToPrettyHtml(markdown);
    document.getElementById("chapter").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    target.innerHTML = `<p class="error">Could not load the story automatically. You can still read it directly in <a href="${story.path}">Markdown</a>.</p>`;
    console.error(error);
  }
}

function loadFromHash() {
  const { collectionKey, storyId } = getSelectionFromHash();
  loadStory(collectionKey, storyId);
}

collectionTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const collectionKey = tab.dataset.collectionTab;
    history.pushState(null, "", `#${collectionKey}-1`);
    loadStory(collectionKey, "1");
  });
});

window.addEventListener("popstate", loadFromHash);
window.addEventListener("hashchange", loadFromHash);

loadFromHash();