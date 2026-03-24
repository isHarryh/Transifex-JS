// ==UserScript==
// @name         Transifex-JS
// @namespace    https://app.transifex.com/
// @version      0.3.0
// @author       Harry Huang
// @description  My Tampermonkey Script for Transifex
// @license      MIT
// @source       https://github.com/isHarryh/Transifex-JS
// @match        https://app.transifex.com/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  const d=new Set;const importCSS = async e=>{d.has(e)||(d.add(e),(t=>{typeof GM_addStyle=="function"?GM_addStyle(t):(document.head||document.documentElement).appendChild(document.createElement("style")).append(t);})(e));};

  const styleCss = ".transifex-js-danger{color:#fe5d65}.transifex-js-danger:focus,.transifex-js-danger:hover{color:#fe444d}.transifex-js-mini-button{cursor:pointer;font-size:11px;padding:0 2px;margin:0 2px;text-decoration:none}.transifex-js-glossary-item-injection,.transifex-js-glossary-item-injection *{transition:opacity .2s}.transifex-js-close-to-show{opacity:.6}.transifex-js-close-to-show:focus,.transifex-js-close-to-show:hover{opacity:1}.transifex-js-mini-button:focus,.transifex-js-mini-button:hover{text-decoration:underline}.transifex-js-button{display:inline-flex;align-items:center;gap:4px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#1f2937;font-size:13px;line-height:1.3;padding:4px 8px;cursor:pointer}.transifex-js-button:hover,.transifex-js-button:focus{background:#f9fafb;border-color:#9ca3af}.transifex-js-button-danger{color:#b91c1c;border-color:#fecaca;background:#fef2f2}.transifex-js-button-danger:hover,.transifex-js-button-danger:focus{color:#991b1b;border-color:#fca5a5;background:#fee2e2}.transifex-js-icon-button{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;color:#889}.transifex-js-icon{width:12px;height:12px;fill:currentColor}.transifex-js-modal-overlay{position:fixed;inset:0;background:#14141873;z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px}.transifex-js-modal{position:relative;width:min(560px,100%);max-height:min(78vh,720px);overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;box-shadow:0 14px 40px #0003;color:#1f2937}.transifex-js-modal-close{position:absolute;top:8px;right:8px;border:0;width:24px;height:24px;border-radius:4px;background:transparent;color:#6b7280;cursor:pointer;font-size:18px;line-height:1}.transifex-js-modal-close:hover,.transifex-js-modal-close:focus{background:#f3f4f6;color:#111827}.transifex-js-modal-content{padding-top:4px}.transifex-js-modal-title{margin:0;font-size:16px;line-height:1.3}.transifex-js-modal-meta{margin:4px 0 10px;color:#6b7280;font-size:13px}.transifex-js-modal-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px}.transifex-js-modal-table th,.transifex-js-modal-table td{border-top:1px solid #e5e7eb;padding:8px 6px;text-align:left;vertical-align:top}.transifex-js-modal-table th{width:140px;color:#374151}.transifex-js-modal-action-cell{width:140px;text-align:right}.transifex-js-modal-table td{word-break:break-word}";
  importCSS(styleCss);
  const iconsCss = '.transifex-js-icon-clear path{d:path("M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z")}.transifex-js-icon-delete path{d:path("M14.12 10.47L12 12.59l-2.13-2.12-1.41 1.41L10.59 14l-2.12 2.12 1.41 1.41L12 15.41l2.12 2.12 1.41-1.41L13.41 14l2.12-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9z")}.transifex-js-icon-edit path{d:path("M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z")}';
  importCSS(iconsCss);
  function log(...messages) {
    console.log("[Transifex-JS]", ...messages);
  }
  function icon(iconName, viewBoxSize = 24) {
    return `<svg class="transifex-js-icon transifex-js-icon-${iconName}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" aria-hidden="true"><path /></svg>`;
  }
  class XHRSender {
    static debug = false;
    static get(url, callback) {
      if (this.debug) {
        log(`GET ${url}`);
        callback("");
        return;
      }
      $.ajax({
        type: "GET",
        url,
        async: true,
        success: (data) => {
          callback(data);
        },
        error: (_xhr, _options, err) => {
          log("Request sending failed", err);
        }
      });
    }
    static post(url, payload, callback, additionalHeaders = {}) {
      if (this.debug) {
        log(`POST ${url} with payload ${JSON.stringify(payload)}`);
        callback("");
        return;
      }
      $.ajax({
        type: "POST",
        url,
        data: payload,
        processData: false,
        async: true,
        beforeSend: (xhr) => {
          for (const [key, value] of Object.entries(additionalHeaders)) {
            xhr.setRequestHeader(key, value);
          }
        },
        success: (data) => {
          callback(data);
        },
        error: (_xhr, _options, err) => {
          log("Request sending failed", err);
        }
      });
    }
  }
  class XHRSpy {
    static listeners = [];
    static originalSend = XMLHttpRequest.prototype.send;
    static replacedSend = XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      xhr.addEventListener(
        "readystatechange",
        () => XHRSpy.listeners.forEach((listener) => listener(xhr))
      );
      return XHRSpy.originalSend.apply(xhr, args);
    };
    static add(pathRegex, handler) {
      XHRSpy.listeners.push(function(xhr) {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          const url = new URL(xhr.responseURL);
          if (url.pathname.match(pathRegex)) {
            let json;
            try {
              json = JSON.parse(xhr.responseText);
            } catch (err) {
              log("Response parsing failed", err);
            }
            try {
              handler(json, url);
            } catch (err) {
              log("Response handling failed", err);
            }
          }
        }
      });
    }
  }
  class ModelDialog {
    options;
    overlay;
    panel;
    contentHost;
    closeButton;
    eventNamespace;
    opened = false;
    onDocumentKeydown;
    constructor(options = {}) {
      this.options = {
        closeOnEsc: options.closeOnEsc ?? true,
        closeOnOverlay: options.closeOnOverlay ?? true,
        overlayClassName: options.overlayClassName ?? "transifex-js-modal-overlay",
        panelClassName: options.panelClassName ?? "transifex-js-modal"
      };
      this.overlay = $("<div></div>").addClass(this.options.overlayClassName);
      this.panel = $("<div></div>").addClass(this.options.panelClassName);
      this.closeButton = $('<button type="button"></button>').addClass("transifex-js-modal-close").attr("aria-label", "Close dialog").text("x").on("click", () => this.close());
      this.contentHost = $("<div></div>").addClass("transifex-js-modal-content");
      this.panel.append(this.closeButton, this.contentHost);
      this.overlay.attr("aria-hidden", "true");
      this.panel.attr("tabindex", "-1");
      this.eventNamespace = `.transifexDialog${Date.now()}${Math.floor(Math.random() * 1e4)}`;
      this.onDocumentKeydown = (event) => {
        if (this.options.closeOnEsc && event.key === "Escape") {
          this.close();
          return;
        }
        if (event.key !== "Tab") {
          return;
        }
        const focusable = this.panel.find(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ).filter(":visible").toArray();
        if (focusable.length === 0) {
          event.preventDefault();
          this.panel.trigger("focus");
          return;
        }
        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        const activeElement = document.activeElement;
        const panelElement = this.panel.get(0);
        const isInsidePanel = !!(activeElement && panelElement && panelElement.contains(activeElement));
        if (event.shiftKey) {
          if (!isInsidePanel || activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
          return;
        }
        if (!isInsidePanel || activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      };
      if (this.options.closeOnOverlay) {
        this.overlay.on("click", (event) => {
          if (event.target === this.overlay.get(0)) {
            this.close();
          }
        });
      }
    }
    setContent(content) {
      this.contentHost.empty().append(content);
      return this;
    }
    open() {
      if (this.opened) {
        return this;
      }
      this.overlay.stop(true, true).hide().empty().append(this.panel).appendTo("body").fadeIn(120);
      this.panel.stop(true, true).hide().fadeIn(160);
      this.overlay.attr("aria-hidden", "false");
      this.opened = true;
      setTimeout(() => {
        this.panel.trigger("focus");
      }, 0);
      $(document).on(`keydown${this.eventNamespace}`, this.onDocumentKeydown);
      return this;
    }
    close() {
      if (!this.opened) {
        return;
      }
      $(document).off(`keydown${this.eventNamespace}`);
      this.opened = false;
      this.overlay.attr("aria-hidden", "true");
      this.overlay.stop(true, true).fadeOut(120, () => {
        this.overlay.remove();
      });
    }
  }
  function getApiMapping(key) {
    if (Transifex && Transifex.objects && Transifex.objects.urls && Transifex.objects.urls.attributes) {
      return Transifex.objects.urls.attributes[key];
    }
    return null;
  }
  function getSourceLanguage() {
    if (Transifex && Transifex.objects && Transifex.objects.GA4EventsData) {
      return Transifex.objects.GA4EventsData.source_language ?? null;
    }
    return null;
  }
  function getTargetLanguage() {
    if (Transifex && Transifex.objects && Transifex.objects.state && Transifex.objects.state.attributes) {
      return Transifex.objects.state.attributes.lang_code ?? null;
    }
    return null;
  }
  function getProjectName() {
    if (Transifex && Transifex.objects && Transifex.objects.state && Transifex.objects.state.attributes) {
      return Transifex.objects.state.attributes.resource_slug ?? null;
    }
    return null;
  }
  function getCsrfToken() {
    const match = document.cookie.match(new RegExp("(^| )csrftoken=([^;]+)"));
    if (match) {
      return match[2];
    }
    return null;
  }
  function deleteGlossaryItem(entityId, onSuccess) {
    const createGlossaryApi = getApiMapping("glossary_create_term");
    if (!createGlossaryApi) {
      log("Cannot determine glossary API");
      return;
    }
    const sourceLanguage = getSourceLanguage();
    if (!sourceLanguage) {
      log("Cannot determine source language");
      return;
    }
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      log("Warning no CSRF token");
    }
    const deleteSourceApi = createGlossaryApi.replace(
      "/glossary_term",
      `/string_operation/${sourceLanguage}/deletesource`
    ).replace("/_/glossary", "/_/editor");
    const payload = `data=${encodeURIComponent(
    JSON.stringify([{ source_entity__id: entityId }])
  )}`;
    log(`Deleting glossary item ${entityId} via ${deleteSourceApi}`);
    XHRSender.post(
      deleteSourceApi,
      payload,
      (data) => {
        if (typeof data === "string" && data.includes("ok")) {
          log("Deleted glossary item success");
          onSuccess && onSuccess();
        } else {
          log(`Deleting glossary item failed: ${JSON.stringify(data)}`);
        }
      },
      csrfToken ? { "x-csrftoken": csrfToken } : {}
    );
  }
  function editGlossaryNote(entityId, newValue, onSuccess) {
    const projectName = getProjectName();
    if (!projectName) {
      log("Cannot determine project name");
      return;
    }
    const sourceLanguage = getSourceLanguage();
    if (!sourceLanguage) {
      log("Cannot determine source language");
      return;
    }
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      log("Warning no CSRF token");
    }
    const editNoteApi = `/_/glossary/ajax/${projectName}/translation_metadata/${sourceLanguage}/${entityId}`;
    const payload = JSON.stringify({ note: newValue });
    log(`Editing glossary note ${entityId} via ${editNoteApi}`);
    XHRSender.post(
      editNoteApi,
      payload,
      (_data) => {
        log("Edited glossary note success");
        onSuccess && onSuccess();
      },
      csrfToken ? { "x-csrftoken": csrfToken } : {}
    );
  }
  function editGlossaryTranslationNote(entityId, newValue, onSuccess) {
    const projectName = getProjectName();
    if (!projectName) {
      log("Cannot determine project name");
      return;
    }
    const targetLanguage = getTargetLanguage();
    if (!targetLanguage) {
      log("Cannot determine target language");
      return;
    }
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      log("Warning no CSRF token");
    }
    const editNoteApi = `/_/glossary/ajax/${projectName}/translation_metadata/${targetLanguage}/${entityId}`;
    const payload = JSON.stringify({ note: newValue });
    log(`Editing glossary translation note ${entityId} via ${editNoteApi}`);
    XHRSender.post(
      editNoteApi,
      payload,
      (_data) => {
        log("Edited glossary translation note success");
        onSuccess && onSuccess();
      },
      csrfToken ? { "x-csrftoken": csrfToken } : {}
    );
  }
  const dataStore = {
    activeGlossaryItems: []
  };
  function showGlossaryModal(itemDiv, glossaryItem, actionBar) {
    const titleId = `transifex-js-dialog-title-${glossaryItem.term_id}`;
    const termText = glossaryItem.term?.trim() || "-";
    const sourceNoteText = glossaryItem.source_comment?.trim() || "-";
    const targetNoteText = glossaryItem.target_comment?.trim() || "-";
    const dialog = new ModelDialog({ closeOnEsc: true, closeOnOverlay: true });
    const modal = $("<div></div>").attr({
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": titleId
    });
    const title = $("<h3></h3>").addClass("transifex-js-modal-title").attr("id", titleId).text("Transifex-JS: Edit Glossary Term");
    const meta = $("<p></p>").addClass("transifex-js-modal-meta").text(`ID: ${glossaryItem.term_id}`);
    const table = $("<table></table>").addClass("transifex-js-modal-table");
    const body = $("<tbody></tbody>");
    const closeModal = () => {
      dialog.close();
    };
    const deleteTermButton = $('<button type="button"></button>').append(icon("delete", 22)).append("<span>Delete</span>").addClass("transifex-js-button transifex-js-button-danger").on("click", () => {
      if (confirm(
        `Sure to delete the glossary term "${glossaryItem.term}" (ID: ${glossaryItem.term_id}) from the glossary?
This action is cannot be undone.`
      )) {
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
    const clearSourceNoteButton = $('<button type="button"></button>').append(icon("clear", 24)).append("<span>Clear</span>").addClass("transifex-js-button transifex-js-button-danger").on("click", () => {
      if (confirm(
        `Sure to delete the note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`
      )) {
        const oldSourceComment = glossaryItem.source_comment;
        editGlossaryNote(glossaryItem.term_id, "", () => {
          glossaryItem.source_comment = "";
          itemDiv.find("p").each((_idx, p) => {
            const pElement = $(p);
            if (oldSourceComment && pElement.text() === oldSourceComment) {
              pElement.css({
                textDecoration: "line-through",
                color: "#88888888"
              });
            }
          });
          closeModal();
        });
      }
    });
    const clearTargetNoteButton = $('<button type="button"></button>').append(icon("clear", 24)).append("<span>Clear</span>").addClass("transifex-js-button transifex-js-button-danger").on("click", () => {
      if (confirm(
        `Sure to delete the translation note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`
      )) {
        const oldTargetComment = glossaryItem.target_comment;
        editGlossaryTranslationNote(glossaryItem.term_id, "", () => {
          glossaryItem.target_comment = "";
          itemDiv.find("p").each((_idx, p) => {
            const pElement = $(p);
            if (oldTargetComment && pElement.text() === oldTargetComment) {
              pElement.css({
                textDecoration: "line-through",
                color: "#88888888"
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
        $("<td></td>").addClass("transifex-js-modal-action-cell").append(deleteTermButton)
      ),
      $("<tr></tr>").append(
        $("<th></th>").text("Source Note"),
        $("<td></td>").text(sourceNoteText),
        $("<td></td>").addClass("transifex-js-modal-action-cell").append(clearSourceNoteButton)
      ),
      $("<tr></tr>").append(
        $("<th></th>").text("Translation Note"),
        $("<td></td>").text(targetNoteText),
        $("<td></td>").addClass("transifex-js-modal-action-cell").append(clearTargetNoteButton)
      )
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
    const glossaryListContainer = glossaryArea.find('div[region="glossary-list"]').first();
    if (!glossaryListContainer.length) {
      log("Not found glossary list container");
      return;
    }
    const glossaryList = glossaryListContainer.find("div").first();
    if (!glossaryList.length) {
      log("Not found glossary list");
      return;
    }
    return glossaryList.children().filter((_index, child) => child.children.length > 0).toArray().map((child) => $(child));
  }
  function injectGlossaryItem(itemDiv, glossaryItem) {
    if (itemDiv.find(".transifex-js-glossary-item-injection").length) {
      return;
    }
    if (glossaryItem.deleted) {
      return;
    }
    itemDiv.css("position", "relative");
    const firstChild = itemDiv.children().first();
    if (firstChild.length) {
      firstChild.get(0).style.setProperty(
        "padding-bottom",
        "24px",
        "important"
      );
    }
    const actionBar = $("<div></div>").addClass("transifex-js-glossary-item-injection transifex-js-close-to-show").css({
      position: "absolute",
      bottom: "0px",
      left: "12px",
      padding: "2px",
      zIndex: "2"
    });
    const editButton = $('<button type="button"></button>').addClass("transifex-js-mini-button transifex-js-icon-button").append(icon("edit", 24)).append("<span>Edit</span>").on("click", () => {
      showGlossaryModal(itemDiv, glossaryItem, actionBar);
    });
    actionBar.append(editButton);
    itemDiv.prepend(actionBar);
  }
  function injectGlossaryArea() {
    const itemDivs = findGlossaryItemDivs();
    const activeGlossaryItems = dataStore.activeGlossaryItems;
    if (!itemDivs || !activeGlossaryItems || itemDivs.length * activeGlossaryItems.length === 0) {
      return;
    }
    if (itemDivs.length === activeGlossaryItems.length) {
      for (let i = 0; i < itemDivs.length; i++) {
        const itemDiv = itemDivs[i];
        const glossaryItem = dataStore.activeGlossaryItems[i];
        for (const variant of glossaryItem.term_variants) {
          if (!itemDiv.html()?.includes(variant)) {
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
    for (const match of json.matches) {
      log(`Glossary match: ${match.term} -> ${match.translation}`);
    }
    dataStore.activeGlossaryItems = json.matches;
  }
  function initGlossaryTermsComponent() {
    setInterval(() => {
      injectGlossaryArea();
    }, 500);
    const glossaryMatchApi = /\/_\/editor\/ajax\/(.+)\/(.+)\/glossary_match\/.+\/(\d+)\/.+/g;
    XHRSpy.add(glossaryMatchApi, (json) => {
      if (json && typeof json === "object" && "matches" in json) {
        receiveGlossaryMatch(json);
      }
    });
  }
  (() => {
    initGlossaryTermsComponent();
  })();

})();