import "./style.css";
import { log, XHRSpy } from "./utils.js";
import {
  deleteGlossaryItem,
  editGlossaryNote,
  editGlossaryTranslationNote,
} from "./api.js";

const dataStore = {
  activeGlossaryItems: [],
};

function injectGlossaryArea() {
  function findGlossaryItemDivs() {
    const glossaryArea = document.querySelector("#glossary-area");
    if (!glossaryArea) {
      log("Not found glossary area");
      return;
    }
    const glossaryListContainer = glossaryArea.querySelector(
      'div[region="glossary-list"]'
    );
    if (!glossaryListContainer) {
      log("Not found glossary list container");
      return;
    }
    const glossaryList = glossaryListContainer.querySelector("div");
    if (!glossaryList) {
      log("Not found glossary list");
      return;
    }

    let itemDivs = [];
    for (const child of glossaryList.children) {
      if (child.children.length) {
        itemDivs.push(child);
      }
    }

    return itemDivs;
  }

  function injectGlossaryItem(itemDiv, glossaryItem) {
    if (itemDiv.querySelector(".transifex-js-glossary-item-injection")) {
      return;
    }
    if (glossaryItem.deleted) {
      return;
    }

    itemDiv.style.position = "relative";
    itemDiv.children[0].style.setProperty(
      "padding-bottom",
      "18px",
      "important"
    );

    const newDiv = document.createElement("div");
    newDiv.classList =
      "transifex-js-glossary-item-injection transifex-js-close-to-show";
    newDiv.style.position = "absolute";
    newDiv.style.bottom = "0";
    newDiv.style.left = "12px";
    newDiv.style.padding = "2px";
    newDiv.style.zIndex = "2";

    const button1 = document.createElement("button");
    button1.textContent = "Delete Term";
    button1.classList = "transifex-js-mini-button transifex-js-danger";
    button1.onclick = () => {
      if (
        confirm(
          `Sure to delete the glossary term "${glossaryItem.term}" (ID: ${glossaryItem.term_id}) from the glossary?\nThis action is cannot be undone.`
        )
      ) {
        deleteGlossaryItem(glossaryItem.term_id, () => {
          // On success
          for (const item of dataStore.activeGlossaryItems) {
            if (item.term_id === glossaryItem.term_id) {
              item.deleted = true;
            }
          }
          newDiv.remove();
          itemDiv.style.color = "#88888888";
        });
      }
    };

    const button2 = document.createElement("button");
    button2.textContent = "Delete Term Note";
    button2.classList = "transifex-js-mini-button transifex-js-danger";
    button2.onclick = () => {
      if (
        confirm(
          `Sure to delete the note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`
        )
      ) {
        editGlossaryNote(glossaryItem.term_id, "", () => {
          // On success
          for (const p of itemDiv.querySelectorAll("p")) {
            if (p.textContent === glossaryItem.source_comment) {
              p.style.textDecoration = "line-through";
              p.style.color = "#88888888";
            }
          }
        });
      }
    };

    const button3 = document.createElement("button");
    button3.textContent = "Delete Translation Note";
    button3.classList = "transifex-js-mini-button transifex-js-danger";
    button3.onclick = () => {
      if (
        confirm(
          `Sure to delete the translation note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`
        )
      ) {
        editGlossaryTranslationNote(glossaryItem.term_id, "", () => {
          // On success
          for (const p of itemDiv.querySelectorAll("p")) {
            if (p.textContent === glossaryItem.target_comment) {
              p.style.textDecoration = "line-through";
              p.style.color = "#88888888";
            }
          }
        });
      }
    };

    newDiv.appendChild(button1);
    newDiv.appendChild(button2);
    newDiv.appendChild(button3);

    itemDiv.insertBefore(newDiv, itemDiv.firstChild);
  }

  const itemDivs = findGlossaryItemDivs();
  const activeGlossaryItems = dataStore.activeGlossaryItems;
  if (
    !itemDivs ||
    !activeGlossaryItems ||
    itemDivs.length * activeGlossaryItems.length === 0
  ) {
    return;
  }
  if (itemDivs.length === activeGlossaryItems.length) {
    for (let i = 0; i < itemDivs.length; i++) {
      const itemDiv = itemDivs[i];
      const glossaryItem = dataStore.activeGlossaryItems[i];
      for (const variant of glossaryItem.term_variants) {
        if (!itemDiv.innerHTML.includes(variant)) {
          log("Inconsistent glossary item content");
          return;
        }
      }
    }
  } else {
    log("Inconsistent glossary item count");
    return;
  }

  log("Updating glossary items...");

  for (let i = 0; i < itemDivs.length; i++) {
    injectGlossaryItem(itemDivs[i], activeGlossaryItems[i]);
  }
}

function receiveGlossaryMatch(json) {
  /*
  json = {
    can_add_term: true,
    matches: [
      {
        term_id: 123456789,
        term: "frame||frames",
        term_variants: ["frame", "frames"],
        matching_source_variants: ["frame"],
        part_of_speech: "n",
        source_comment: "",
        translation: "框体",
        variants: ["框体"],
        target_comment: "",
        is_case_sensitive: false,
        term_url:
          "/{project}/{glossary_name}/translate/#{language}/{glossary_name}/123456789",
      },
    ],
  };
  */
  for (const match of json.matches) {
    log(`Glossary match: ${match.term} -> ${match.translation}`);
  }
  dataStore.activeGlossaryItems = json.matches;
}

(() => {
  setInterval(() => {
    injectGlossaryArea();
  }, 500);

  const glossaryMatchApi =
    /\/_\/editor\/ajax\/(.+)\/(.+)\/glossary_match\/.+\/(\d+)\/.+/g; // org_name, project_name, string_id

  XHRSpy.add(glossaryMatchApi, (json) => {
    receiveGlossaryMatch(json);
  });
})();
