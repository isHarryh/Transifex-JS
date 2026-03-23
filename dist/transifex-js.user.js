// ==UserScript==
// @name         Transifex-JS
// @namespace    https://app.transifex.com/
// @version      0.2.0
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

  const styleCss = ".transifex-js-danger{color:#fe5d65}.transifex-js-danger:focus,.transifex-js-danger:hover{color:#fe444d}.transifex-js-mini-button{cursor:pointer;font-size:10px;padding:0 2px;margin:0 2px;text-decoration:none}.transifex-js-glossary-item-injection,.transifex-js-glossary-item-injection *{transition:opacity .2s}.transifex-js-close-to-show{opacity:.2}.transifex-js-close-to-show:focus,.transifex-js-close-to-show:hover{opacity:1}.transifex-js-mini-button:focus,.transifex-js-mini-button:hover{text-decoration:underline}";
  importCSS(styleCss);
  function log(...messages) {
    console.log("[Transifex-JS]", ...messages);
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
        () => XHRSpy.listeners.forEach((l) => l(xhr))
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
  function injectGlossaryArea() {
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
          "18px",
          "important"
        );
      }
      const newDiv = $("<div></div>").addClass(
        "transifex-js-glossary-item-injection transifex-js-close-to-show"
      ).css({
        position: "absolute",
        bottom: "0",
        left: "12px",
        padding: "2px",
        zIndex: "2"
      });
      const button1 = $("<button></button>").text("Delete Term").addClass("transifex-js-mini-button transifex-js-danger").on("click", () => {
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
            newDiv.remove();
            itemDiv.css("color", "#88888888");
          });
        }
      });
      const button2 = $("<button></button>").text("Delete Term Note").addClass("transifex-js-mini-button transifex-js-danger").on("click", () => {
        if (confirm(
          `Sure to delete the note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`
        )) {
          editGlossaryNote(glossaryItem.term_id, "", () => {
            itemDiv.find("p").each((_idx, p) => {
              const pElement = $(p);
              if (pElement.text() === glossaryItem.source_comment) {
                pElement.css({
                  textDecoration: "line-through",
                  color: "#88888888"
                });
              }
            });
          });
        }
      });
      const button3 = $("<button></button>").text("Delete Translation Note").addClass("transifex-js-mini-button transifex-js-danger").on("click", () => {
        if (confirm(
          `Sure to delete the translation note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`
        )) {
          editGlossaryTranslationNote(glossaryItem.term_id, "", () => {
            itemDiv.find("p").each((_idx, p) => {
              const pElement = $(p);
              if (pElement.text() === glossaryItem.target_comment) {
                pElement.css({
                  textDecoration: "line-through",
                  color: "#88888888"
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
  (() => {
    setInterval(() => {
      injectGlossaryArea();
    }, 500);
    const glossaryMatchApi = /\/_\/editor\/ajax\/(.+)\/(.+)\/glossary_match\/.+\/(\d+)\/.+/g;
    XHRSpy.add(glossaryMatchApi, (json) => {
      if (json && typeof json === "object" && "matches" in json) {
        receiveGlossaryMatch(json);
      }
    });
  })();

})();