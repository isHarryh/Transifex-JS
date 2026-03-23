/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
//// <reference types="vite-plugin-monkey/global" />
/// <reference types="vite-plugin-monkey/style" />

declare const $: {
  (selector: string | Element): any;
  ajax: (options: {
    type: "GET" | "POST";
    url: string;
    data?: string;
    processData?: boolean;
    async?: boolean;
    beforeSend?: (xhr: XMLHttpRequest) => void;
    success?: (data: unknown) => void;
    error?: (xhr: unknown, options: unknown, err: unknown) => void;
  }) => void;
};

declare const Transifex:
  | {
      objects?: {
        urls?: {
          attributes?: Record<string, string>;
        };
        GA4EventsData?: {
          source_language?: string;
        };
        state?: {
          attributes?: {
            lang_code?: string;
            resource_slug?: string;
          };
        };
      };
    }
  | undefined;
