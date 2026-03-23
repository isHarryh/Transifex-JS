export function log(...messages: unknown[]) {
  console.log("[Transifex-JS]", ...messages);
}

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
      url: url,
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

export class XHRSpy {
  static listeners: Array<(xhr: XMLHttpRequest) => void> = [];
  static originalSend = XMLHttpRequest.prototype.send;
  static replacedSend = (XMLHttpRequest.prototype.send = function (...args) {
    const xhr = this;
    xhr.addEventListener("readystatechange", () =>
      XHRSpy.listeners.forEach((l) => l(xhr)),
    );
    return XHRSpy.originalSend.apply(xhr, args);
  });

  static add(pathRegex: RegExp, handler: (json: unknown, url: URL) => void) {
    XHRSpy.listeners.push(function (xhr) {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        const url = new URL(xhr.responseURL);
        if (url.pathname.match(pathRegex)) {
          let json: unknown;
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
