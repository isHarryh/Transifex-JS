import { log } from "./log";

export class XHRSender {
  static debug = false;

  static get(url: string, callback: (data: unknown) => void) {
    if (this.debug) {
      log(`GET ${url}`);
      callback("");
      return;
    }
    $.ajax({
      type: "GET",
      url,
      async: true,
      success: (data: unknown) => {
        callback(data);
      },
      error: (_xhr: unknown, _options: unknown, err: unknown) => {
        log("Request sending failed", err);
      },
    });
  }

  static post(
    url: string,
    payload: string,
    callback: (data: unknown) => void,
    additionalHeaders: Record<string, string> = {},
  ) {
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
      beforeSend: (xhr: XMLHttpRequest) => {
        for (const [key, value] of Object.entries(additionalHeaders)) {
          xhr.setRequestHeader(key, value);
        }
      },
      success: (data: unknown) => {
        callback(data);
      },
      error: (_xhr: unknown, _options: unknown, err: unknown) => {
        log("Request sending failed", err);
      },
    });
  }
}
