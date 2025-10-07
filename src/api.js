import { log, XHRSender } from "./utils.js";

function getApiMapping(key) {
  if (
    window.Transifex &&
    window.Transifex.objects &&
    window.Transifex.objects.urls &&
    window.Transifex.objects.urls.attributes
  ) {
    return window.Transifex.objects.urls.attributes[key];
  }
  return null;
}

function getSourceLanguage() {
  if (
    window.Transifex &&
    window.Transifex.objects &&
    window.Transifex.objects.GA4EventsData
  ) {
    return window.Transifex.objects.GA4EventsData.source_language;
  }
  return null;
}

function getTargetLanguage() {
  if (
    window.Transifex &&
    window.Transifex.objects &&
    window.Transifex.objects.state &&
    window.Transifex.objects.state.attributes
  ) {
    return window.Transifex.objects.state.attributes.lang_code;
  }
  return null;
}

function getProjectName() {
  if (
    window.Transifex &&
    window.Transifex.objects &&
    window.Transifex.objects.state &&
    window.Transifex.objects.state.attributes
  ) {
    return window.Transifex.objects.state.attributes.resource_slug;
  }
  return null;
}

export function setGlossaryConfig(project, glossaryName, sourceLanguage) {
  projectSettings.project = project;
  projectSettings.glossaryName = glossaryName;
  projectSettings.sourceLanguage = sourceLanguage;
}

// export function addGlossaryItem(_) {
//   // POST /_/glossary/ajax/{project}/{glossary_name}/glossary_term/
// }

export function deleteGlossaryItem(entityId, onSuccess) {
  // POST /_/editor/ajax/{project}/{glossary_name}/string_operation/{source_language}/deletesource/
  // Payload: data=[{"source_entity__id":number_id}] // should be URL encoded
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

  const deleteSourceApi = createGlossaryApi
    .replace(
      "/glossary_term",
      `/string_operation/${sourceLanguage}/deletesource`
    )
    .replace("/_/glossary", "/_/editor");
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

export function editGlossaryNote(entityId, newValue, onSuccess) {
  // POST /_/glossary/ajax/{project}/translation_metadata/{source_language}/{id}
  // Payload: {note: "new note value string"} // as normal json
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

export function editGlossaryTranslationNote(entityId, newValue, onSuccess) {
  // POST /_/glossary/ajax/{project}/translation_metadata/{target_language}/{id}
  // Payload: {note: "new note value string"} // as normal json
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
