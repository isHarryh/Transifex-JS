import "./style.css";
import { log, XHRSpy } from "./utils";
import {
  deleteGlossaryItem,
  editGlossaryNote,
  editGlossaryTranslationNote,
} from "./api";

type GlossaryItem = {
  term_id: number;
  term: string;
  term_variants: string[];
  translation: string;
  source_comment?: string;
  target_comment?: string;
  deleted?: boolean;
};

type GlossaryMatchResponse = {
  can_add_term: boolean;
  matches: GlossaryItem[];
};

const dataStore = {
  activeGlossaryItems: [] as GlossaryItem[],
};

function injectGlossaryArea() {
  function findGlossaryItemDivs() {
    const glossaryArea = $("#glossary-area");
    if (!glossaryArea.length) {
      log("Not found glossary area");
      return;
    }
    const glossaryListContainer = glossaryArea
      .find('div[region="glossary-list"]')
      .first();
    if (!glossaryListContainer.length) {
      log("Not found glossary list container");
      return;
    }
    const glossaryList = glossaryListContainer.find("div").first();
    if (!glossaryList.length) {
      log("Not found glossary list");
      return;
    }

    return glossaryList
      .children()
      .filter((_index: number, child: Element) => child.children.length > 0)
      .toArray()
      .map((child: Element) => $(child));
  }

  function injectGlossaryItem(itemDiv: any, glossaryItem: GlossaryItem) {
    if (itemDiv.find(".transifex-js-glossary-item-injection").length) {
      return;
    }
    if (glossaryItem.deleted) {
      return;
    }

    itemDiv.css("position", "relative");
    const firstChild = itemDiv.children().first();
    if (firstChild.length) {
      (firstChild.get(0) as HTMLElement).style.setProperty(
        "padding-bottom",
        "18px",
        "important",
      );
    }

    const newDiv = $("<div></div>")
      .addClass(
        "transifex-js-glossary-item-injection transifex-js-close-to-show",
      )
      .css({
        position: "absolute",
        bottom: "0",
        left: "12px",
        padding: "2px",
        zIndex: "2",
      });

    const button1 = $("<button></button>")
      .text("Delete Term")
      .addClass("transifex-js-mini-button transifex-js-danger")
      .on("click", () => {
        if (
          confirm(
            `Sure to delete the glossary term "${glossaryItem.term}" (ID: ${glossaryItem.term_id}) from the glossary?\nThis action is cannot be undone.`,
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
            itemDiv.css("color", "#88888888");
          });
        }
      });

    const button2 = $("<button></button>")
      .text("Delete Term Note")
      .addClass("transifex-js-mini-button transifex-js-danger")
      .on("click", () => {
        if (
          confirm(
            `Sure to delete the note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`,
          )
        ) {
          editGlossaryNote(glossaryItem.term_id, "", () => {
            // On success
            itemDiv.find("p").each((_idx: number, p: Element) => {
              const pElement = $(p);
              if (pElement.text() === glossaryItem.source_comment) {
                pElement.css({
                  textDecoration: "line-through",
                  color: "#88888888",
                });
              }
            });
          });
        }
      });

    const button3 = $("<button></button>")
      .text("Delete Translation Note")
      .addClass("transifex-js-mini-button transifex-js-danger")
      .on("click", () => {
        if (
          confirm(
            `Sure to delete the translation note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`,
          )
        ) {
          editGlossaryTranslationNote(glossaryItem.term_id, "", () => {
            // On success
            itemDiv.find("p").each((_idx: number, p: Element) => {
              const pElement = $(p);
              if (pElement.text() === glossaryItem.target_comment) {
                pElement.css({
                  textDecoration: "line-through",
                  color: "#88888888",
                });
              }
            });
          });
        }
      });

    newDiv.append(button1, button2, button3);

    itemDiv.prepend(newDiv);
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
        if (!(itemDiv.html() as string | undefined)?.includes(variant)) {
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

function receiveGlossaryMatch(json: GlossaryMatchResponse) {
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
    if (json && typeof json === "object" && "matches" in json) {
      receiveGlossaryMatch(json as GlossaryMatchResponse);
    }
  });
})();
