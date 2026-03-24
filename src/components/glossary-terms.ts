import { icon, log, ModelDialog, XHRSpy } from "../utils";
import {
  deleteGlossaryItem,
  editGlossaryNote,
  editGlossaryTranslationNote,
} from "../api";

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

function createNoteRow(
  label: string,
  initialNote: string | undefined,
  onSave: (newValue: string, callback: () => void) => void,
) {
  const tr = $("<tr></tr>");
  const th = $("<th></th>").text(label);
  const tdContent = $("<td></td>");
  const tdActions = $("<td></td>")
    .addClass("transifex-js-modal-action-cell")
    .css("white-space", "nowrap");

  let isEditing = false;
  let currentNote = initialNote?.trim() || "";

  const renderContent = () => {
    tdContent.empty();
    tdActions.empty();

    if (isEditing) {
      const textarea = $("<textarea></textarea>")
        .addClass("transifex-js-input")
        .val(currentNote);
      tdContent.append(textarea);

      const saveBtn = $('<button type="button"></button>')
        .addClass("transifex-js-button transifex-js-button-primary")
        .append(icon("done", 24))
        .append("<span>Save</span>")
        .on("click", () => {
          const newVal = (textarea.val() as string).trim();
          saveBtn.prop("disabled", true);
          onSave(newVal, () => {
            currentNote = newVal;
            isEditing = false;
            renderContent();
          });
        });

      const cancelBtn = $('<button type="button"></button>')
        .addClass("transifex-js-button")
        .append(icon("cancel", 24))
        .append("<span>Cancel</span>")
        .css("margin-left", "4px")
        .on("click", () => {
          isEditing = false;
          renderContent();
        });

      tdActions.append(saveBtn, cancelBtn);
    } else {
      tdContent.text(currentNote || "-");

      const editBtn = $('<button type="button"></button>')
        .addClass("transifex-js-button")
        .append(icon("edit", 24))
        .append("<span>Edit</span>")
        .on("click", () => {
          isEditing = true;
          renderContent();
        });

      const clearBtn = $('<button type="button"></button>')
        .addClass("transifex-js-button transifex-js-button-danger")
        .append(icon("clear", 24))
        .append("<span>Clear</span>")
        .css("margin-left", "4px")
        .on("click", () => {
          if (confirm(`Sure to clear the ${label.toLowerCase()}?`)) {
            clearBtn.prop("disabled", true);
            onSave("", () => {
              currentNote = "";
              renderContent();
            });
          }
        });

      tdActions.append(editBtn, clearBtn);
    }
  };

  renderContent();
  tr.append(th, tdContent, tdActions);
  return tr;
}

function updateItemDivText(
  itemDiv: any,
  oldVal: string | undefined,
  newVal: string,
) {
  let found = false;
  if (oldVal) {
    itemDiv.find("p").each((_idx: number, p: Element) => {
      const pElement = $(p);
      if (pElement.text() === oldVal) {
        found = true;
        pElement.text(newVal);
        pElement.css({ textDecoration: "", color: "" });
        if (!newVal) {
          pElement.css({ textDecoration: "line-through", color: "#88888888" });
        }
      }
    });
  }
  if (!found && newVal) {
    const firstChild = itemDiv.children().first();
    if (firstChild.length) {
      firstChild.append($("<p></p>").text(newVal));
    }
  }
}

function showGlossaryModal(
  itemDiv: any,
  glossaryItem: GlossaryItem,
  actionBar: any,
) {
  const titleId = `transifex-js-dialog-title-${glossaryItem.term_id}`;
  const termText = glossaryItem.term?.trim() || "-";

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

  const sourceNoteRow = createNoteRow(
    "Source Note",
    glossaryItem.source_comment,
    (newValue, callback) => {
      const oldVal = glossaryItem.source_comment;
      editGlossaryNote(glossaryItem.term_id, newValue, () => {
        glossaryItem.source_comment = newValue;
        updateItemDivText(itemDiv, oldVal, newValue);
        callback();
      });
    },
  );

  const targetNoteRow = createNoteRow(
    "Translation Note",
    glossaryItem.target_comment,
    (newValue, callback) => {
      const oldVal = glossaryItem.target_comment;
      editGlossaryTranslationNote(glossaryItem.term_id, newValue, () => {
        glossaryItem.target_comment = newValue;
        updateItemDivText(itemDiv, oldVal, newValue);
        callback();
      });
    },
  );

  body.append(
    $("<tr></tr>").append(
      $("<th></th>").text("Term"),
      $("<td></td>").text(termText),
      $("<td></td>")
        .addClass("transifex-js-modal-action-cell")
        .css("white-space", "nowrap")
        .append(deleteTermButton),
    ),
    sourceNoteRow,
    targetNoteRow,
  );

  table.append(body);
  modal.append(title, meta, table);
  dialog.setContent(modal).open();
}

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
      "24px",
      "important",
    );
  }

  const actionBar = $("<div></div>")
    .addClass("transifex-js-glossary-item-injection transifex-js-close-to-show")
    .css({
      position: "absolute",
      bottom: "0px",
      left: "12px",
      padding: "2px",
      zIndex: "2",
    });

  const editButton = $('<button type="button"></button>')
    .addClass("transifex-js-mini-button transifex-js-icon-button")
    .append(icon("edit", 24))
    .append("<span>Edit</span>")
    .on("click", () => {
      showGlossaryModal(itemDiv, glossaryItem, actionBar);
    });

  actionBar.append(editButton);
  itemDiv.prepend(actionBar);
}

function injectGlossaryArea() {
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
  for (const match of json.matches) {
    log(`Glossary match: ${match.term} -> ${match.translation}`);
  }
  dataStore.activeGlossaryItems = json.matches;
}

export function initGlossaryTermsComponent() {
  setInterval(() => {
    injectGlossaryArea();
  }, 500);

  const glossaryMatchApi =
    /\/_\/editor\/ajax\/(.+)\/(.+)\/glossary_match\/.+\/(\d+)\/.+/g;

  XHRSpy.add(glossaryMatchApi, (json) => {
    if (json && typeof json === "object" && "matches" in json) {
      receiveGlossaryMatch(json as GlossaryMatchResponse);
    }
  });
}
