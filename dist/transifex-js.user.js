// ==UserScript==
// @name         Transifex-JS
// @namespace    https://app.transifex.com/
// @version      0.1.0
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

  const d=new Set;const importCSS = async e=>{d.has(e)||(d.add(e),(t=>{typeof GM_addStyle=="function"?GM_addStyle(t):document.head.appendChild(document.createElement("style")).append(t);})(e));};

  const styleCss = ".transifex-js-danger{color:#fe5d65}.transifex-js-danger:focus,.transifex-js-danger:hover{color:#fe444d}.transifex-js-mini-button{cursor:pointer;font-size:10px;padding:0 2px;margin:0 2px;text-decoration:none}.transifex-js-glossary-item-injection,.transifex-js-glossary-item-injection *{transition:opacity .2s}.transifex-js-close-to-show{opacity:.2}.transifex-js-close-to-show:focus,.transifex-js-close-to-show:hover{opacity:1}.transifex-js-mini-button:focus,.transifex-js-mini-button:hover{text-decoration:underline}";
  importCSS(styleCss);
  function log(msg) {
    console.log(`[Transifex-JS] ${msg}`);
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
        beforeSend: (xhr) => {
        },
        success: (data, status, xhr) => {
          callback(data);
        },
        error: (xhr, options, err) => {
          log("Request sending failed", e);
        }
      });
    }
    static post(url, payload, callback) {
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
        },
        success: (data, status, xhr) => {
          callback(data);
        },
        error: (xhr, options, err) => {
          log("Request sending failed", e);
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
          let url = new URL(xhr.responseURL);
          if (url.pathname.match(pathRegex)) {
            let json;
            try {
              json = JSON.parse(xhr.responseText);
            } catch (err) {
              log("Response parsing failed");
            }
            try {
              handler(json, url);
            } catch (err) {
              log("Response handling failed");
            }
          }
        }
      });
    }
  }
  function getApiMapping(key) {
    if (window.Transifex && window.Transifex.objects && window.Transifex.objects.urls && window.Transifex.objects.urls.attributes) {
      return window.Transifex.objects.urls.attributes[key];
    }
    return null;
  }
  function getSourceLanguage() {
    if (window.Transifex && window.Transifex.objects && window.Transifex.objects.GA4EventsData) {
      return window.Transifex.objects.GA4EventsData.source_language;
    }
    return null;
  }
  function getTargetLanguage() {
    if (window.Transifex && window.Transifex.objects && window.Transifex.objects.state && window.Transifex.objects.state.attributes) {
      return window.Transifex.objects.state.attributes.lang_code;
    }
    return null;
  }
  function getProjectName() {
    if (window.Transifex && window.Transifex.objects && window.Transifex.objects.state && window.Transifex.objects.state.attributes) {
      return window.Transifex.objects.state.attributes.resource_slug;
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
    const deleteSourceApi = createGlossaryApi.replace(
      "/glossary_term",
      `/string_operation/${sourceLanguage}/deletesource`
    ).replace("/_/glossary", "/_/editor");
    const payload = `data=${encodeURIComponent(
    JSON.stringify([{ source_entity__id: entityId }])
  )}`;
    log(`Deleting glossary item ${entityId} via ${deleteSourceApi}`);
    XHRSender.post(deleteSourceApi, payload, (data) => {
      if (data && data.includes("ok")) {
        log("Deleted glossary item success");
        onSuccess && onSuccess();
      } else {
        log(`Deleting glossary item failed: ${JSON.stringify(data)}`);
      }
    });
  }
  function editGlossaryNote(entityId, newValue, onSuccess) {
    const projectName = getProjectName();
    if (!projectName) {
      log("Cannot determine glossary API");
      return;
    }
    const sourceLanguage = getSourceLanguage();
    if (!sourceLanguage) {
      log("Cannot determine source language");
      return;
    }
    const editNoteApi = `/_/glossary/ajax/${projectName}/translation_metadata/${sourceLanguage}/${entityId}`;
    const payload = JSON.stringify({ note: newValue });
    log(`Editing glossary note ${entityId} via ${editNoteApi}`);
    XHRSender.post(editNoteApi, payload, (_data) => {
      log("Edited glossary note success");
      onSuccess && onSuccess();
    });
  }
  function editGlossaryTranslationNote(entityId, newValue, onSuccess) {
    const projectName = getProjectName();
    if (!projectName) {
      log("Cannot determine glossary API");
      return;
    }
    const targetLanguage = getTargetLanguage();
    if (!targetLanguage) {
      log("Cannot determine target language");
      return;
    }
    const editNoteApi = `/_/glossary/ajax/${projectName}/translation_metadata/${targetLanguage}/${entityId}`;
    const payload = JSON.stringify({ note: newValue });
    log(`Editing glossary translation note ${entityId} via ${editNoteApi}`);
    XHRSender.post(editNoteApi, payload, (_data) => {
      log("Edited glossary translation note success");
      onSuccess && onSuccess();
    });
  }
  const dataStore = {
    activeGlossaryItems: []
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
      let itemDivs2 = [];
      for (const child of glossaryList.children) {
        if (child.children.length) {
          itemDivs2.push(child);
        }
      }
      return itemDivs2;
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
      newDiv.classList = "transifex-js-glossary-item-injection transifex-js-close-to-show";
      newDiv.style.position = "absolute";
      newDiv.style.bottom = "0";
      newDiv.style.left = "12px";
      newDiv.style.padding = "2px";
      newDiv.style.zIndex = "2";
      const button1 = document.createElement("button");
      button1.textContent = "Delete Term";
      button1.classList = "transifex-js-mini-button transifex-js-danger";
      button1.onclick = () => {
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
            itemDiv.style.color = "#88888888";
          });
        }
      };
      const button2 = document.createElement("button");
      button2.textContent = "Delete Term Note";
      button2.classList = "transifex-js-mini-button transifex-js-danger";
      button2.onclick = () => {
        if (confirm(
          `Sure to delete the note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`
        )) {
          editGlossaryNote(glossaryItem.term_id, "", () => {
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
        if (confirm(
          `Sure to delete the translation note of "${glossaryItem.term}" (ID: ${glossaryItem.term_id})?`
        )) {
          editGlossaryTranslationNote(glossaryItem.term_id, "", () => {
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
    if (!itemDivs || !activeGlossaryItems || itemDivs.length * activeGlossaryItems.length === 0) {
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
    XHRSpy.add(glossaryMatchApi, (json, url) => {
      log(`Response JSON: ${JSON.stringify(json)}`);
      receiveGlossaryMatch(json);
    });
  })();

})();