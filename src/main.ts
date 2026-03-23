import "./style.css";
import "./icons.css";
import { icon, log, ModelDialog, XHRSpy } from "./utils";
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

function showGlossaryModal(
  itemDiv: any,
  glossaryItem: GlossaryItem,
  actionBar: any,
) {
  const titleId = `transifex-js-dialog-title-${glossaryItem.term_id}`;
  const termText = glossaryItem.term?.trim() || "-";
  const sourceNoteText = glossaryItem.source_comment?.trim() || "-";
  const targetNoteText = glossaryItem.target_comment?.trim() || "-";

  const dialog = new ModelDialog({ closeOnEsc: true, closeOnOverlay: true });
  const modal = $("<div></div>").attr({
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": titleId,
  });
  const title = $("<h3></h3>")
    .addClass("transifex-js-modal-title")
    .attr("id", titleId)
    .text("Transifex-JS: Edit Glossary Term");
  const meta = $("<p></p>")
    .addClass("transifex-js-modal-meta")
    .text(`ID: ${glossaryItem.term_id}`);

  const table = $("<table></table>").addClass("transifex-js-modal-table");
  const body = $("<tbody></tbody>");
  const closeModal = () => {
    dialog.close();
  };

  const deleteTermButton = $('<button type="button"></button>')
    .append(icon("delete", 22))
    .append("<span>Delete</span>")
    .addClass("transifex-js-button transifex-js-button-danger")
    .on("click", () => {
      if (
        confirm(
          `Sure to delete the glossary term "${glossaryItem.term}" (ID: ${glossaryItem.term_id}) from the glossary?\nThis action is cannot be undone.`,
        )
      ) {
        deleteGlossaryItem(glossaryItem.term_id, () => {
          for (const item of dataStore.activeGlossaryItems) {
            if (item.term_id === glossaryItem.term_id) {
              item.deleted = true;
            }
          }
          actionBar.remove();
          itemDiv.css("color", "#88888888");
          closeModal();
        });
      }
    });

  const clearSourceNoteButton = $('<button type="button"></button>')
    .append(icon("clear", 24))
    .append("<span>Clear</span>")
    .addClass("transifex-js-button transifex-js-button-danger")
    .on("click", () => {
      if (
        confirm(
          `Sure to delete the note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`,
        )
      ) {
        const oldSourceComment = glossaryItem.source_comment;
        editGlossaryNote(glossaryItem.term_id, "", () => {
          glossaryItem.source_comment = "";
          itemDiv.find("p").each((_idx: number, p: Element) => {
            const pElement = $(p);
            if (oldSourceComment && pElement.text() === oldSourceComment) {
              pElement.css({
                textDecoration: "line-through",
                color: "#88888888",
              });
            }
          });
          closeModal();
        });
      }
    });

  const clearTargetNoteButton = $('<button type="button"></button>')
    .append(icon("clear", 24))
    .append("<span>Clear</span>")
    .addClass("transifex-js-button transifex-js-button-danger")
    .on("click", () => {
      if (
        confirm(
          `Sure to delete the translation note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`,
        )
      ) {
        const oldTargetComment = glossaryItem.target_comment;
        editGlossaryTranslationNote(glossaryItem.term_id, "", () => {
          glossaryItem.target_comment = "";
          itemDiv.find("p").each((_idx: number, p: Element) => {
            const pElement = $(p);
            if (oldTargetComment && pElement.text() === oldTargetComment) {
              pElement.css({
                textDecoration: "line-through",
                color: "#88888888",
              });
            }
          });
          closeModal();
        });
      }
    });

  body.append(
    $("<tr></tr>").append(
      $("<th></th>").text("Term"),
      $("<td></td>").text(termText),
      $("<td></td>")
        .addClass("transifex-js-modal-action-cell")
        .append(deleteTermButton),
    ),
    $("<tr></tr>").append(
      $("<th></th>").text("Source Note"),
      $("<td></td>").text(sourceNoteText),
      $("<td></td>")
        .addClass("transifex-js-modal-action-cell")
        .append(clearSourceNoteButton),
    ),
    $("<tr></tr>").append(
      $("<th></th>").text("Translation Note"),
      $("<td></td>").text(targetNoteText),
      $("<td></td>")
        .addClass("transifex-js-modal-action-cell")
        .append(clearTargetNoteButton),
    ),
  );

  table.append(body);
  modal.append(title, meta, table);
  dialog.setContent(modal).open();
}

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
        bottom: "-2px",
        left: "12px",
        padding: "2px",
        zIndex: "2",
      });

    const editButton = $('<button type="button"></button>')
      .addClass("transifex-js-mini-button transifex-js-icon-button")
      .append(icon("edit", 24))
      .append("<span>Edit</span>")
      .on("click", () => {
        showGlossaryModal(itemDiv, glossaryItem, newDiv);
      });

    newDiv.append(editButton);

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
