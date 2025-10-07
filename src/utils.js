export function log(msg) {
  console.log(`[Transifex-JS] ${msg}`);
}

export class XHRSender {
  static debug = false;

  static get(url, callback) {
    if (this.debug) {
      log(`GET ${url}`);
      callback("");
      return;
    }
    $.ajax({
      type: "GET",
      url: url,
      async: true,
      beforeSend: (xhr) => {},
      success: (data, status, xhr) => {
        callback(data);
      },
      error: (xhr, options, err) => {
        log("Request sending failed", e);
      },
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
      url: url,
      data: payload,
      processData: false,
      async: true,
      beforeSend: (xhr) => {},
      success: (data, status, xhr) => {
        callback(data);
      },
      error: (xhr, options, err) => {
        log("Request sending failed", e);
      },
    });
  }
}

export class XHRSpy {
  static listeners = [];
  static originalSend = XMLHttpRequest.prototype.send;
  static replacedSend = (XMLHttpRequest.prototype.send = function (...args) {
    const xhr = this;
    xhr.addEventListener("readystatechange", () =>
      XHRSpy.listeners.forEach((l) => l(xhr))
    );
    return XHRSpy.originalSend.apply(xhr, args);
  });

  static add(pathRegex, handler) {
    XHRSpy.listeners.push(function (xhr) {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        let url = new URL(xhr.responseURL);
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
