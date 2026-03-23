import { log, XHRSender } from "./utils";

type ProjectSettings = {
  project: string;
  glossaryName: string;
  sourceLanguage: string;
};

const projectSettings: ProjectSettings = {
  project: "",
  glossaryName: "",
  sourceLanguage: "",
};

function getApiMapping(key: string): string | null {
  if (
    Transifex &&
    Transifex.objects &&
    Transifex.objects.urls &&
    Transifex.objects.urls.attributes
  ) {
    return Transifex.objects.urls.attributes[key];
  }
  return null;
}

function getSourceLanguage(): string | null {
  if (Transifex && Transifex.objects && Transifex.objects.GA4EventsData) {
    return Transifex.objects.GA4EventsData.source_language ?? null;
  }
  return null;
}

function getTargetLanguage(): string | null {
  if (
    Transifex &&
    Transifex.objects &&
    Transifex.objects.state &&
    Transifex.objects.state.attributes
  ) {
    return Transifex.objects.state.attributes.lang_code ?? null;
  }
  return null;
}

function getProjectName(): string | null {
  if (
    Transifex &&
    Transifex.objects &&
    Transifex.objects.state &&
    Transifex.objects.state.attributes
  ) {
    return Transifex.objects.state.attributes.resource_slug ?? null;
  }
  return null;
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp("(^| )csrftoken=([^;]+)"));
  if (match) {
    return match[2];
  }
  return null;
}

export function setGlossaryConfig(
  project: string,
  glossaryName: string,
  sourceLanguage: string,
) {
  projectSettings.project = project;
  projectSettings.glossaryName = glossaryName;
  projectSettings.sourceLanguage = sourceLanguage;
}

// export function addGlossaryItem(_) {
//   // POST /_/glossary/ajax/{project}/{glossary_name}/glossary_term/
// }

export function deleteGlossaryItem(entityId: number, onSuccess?: () => void) {
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
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    log("Warning no CSRF token");
  }

  const deleteSourceApi = createGlossaryApi
    .replace(
      "/glossary_term",
      `/string_operation/${sourceLanguage}/deletesource`,
    )
    .replace("/_/glossary", "/_/editor");
  const payload = `data=${encodeURIComponent(
    JSON.stringify([{ source_entity__id: entityId }]),
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
    csrfToken ? { "x-csrftoken": csrfToken } : {},
  );
}

export function editGlossaryNote(
  entityId: number,
  newValue: string,
  onSuccess?: () => void,
) {
  // POST /_/glossary/ajax/{project}/translation_metadata/{source_language}/{id}
  // Payload: {note: "new note value string"} // as normal json
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
    (_data: unknown) => {
      log("Edited glossary note success");
      onSuccess && onSuccess();
    },
    csrfToken ? { "x-csrftoken": csrfToken } : {},
  );
}

export function editGlossaryTranslationNote(
  entityId: number,
  newValue: string,
  onSuccess?: () => void,
) {
  // POST /_/glossary/ajax/{project}/translation_metadata/{target_language}/{id}
  // Payload: {note: "new note value string"} // as normal json
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
    (_data: unknown) => {
      log("Edited glossary translation note success");
      onSuccess && onSuccess();
    },
    csrfToken ? { "x-csrftoken": csrfToken } : {},
  );
}
