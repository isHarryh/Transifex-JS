type ModelDialogOptions = {
  closeOnEsc?: boolean;
  closeOnOverlay?: boolean;
  overlayClassName?: string;
  panelClassName?: string;
};

export class ModelDialog {
  private readonly options: Required<ModelDialogOptions>;
  private readonly overlay: any;
  private readonly panel: any;
  private readonly contentHost: any;
  private readonly closeButton: any;
  private readonly eventNamespace: string;
  private opened = false;
  private readonly onDocumentKeydown: (event: KeyboardEvent) => void;

  constructor(options: ModelDialogOptions = {}) {
    this.options = {
      closeOnEsc: options.closeOnEsc ?? true,
      closeOnOverlay: options.closeOnOverlay ?? true,
      overlayClassName:
        options.overlayClassName ?? "transifex-js-modal-overlay",
      panelClassName: options.panelClassName ?? "transifex-js-modal",
    };
    this.overlay = $("<div></div>").addClass(this.options.overlayClassName);
    this.panel = $("<div></div>").addClass(this.options.panelClassName);
    this.closeButton = $('<button type="button"></button>')
      .addClass("transifex-js-modal-close")
      .attr("aria-label", "Close dialog")
      .text("x")
      .on("click", () => this.close());
    this.contentHost = $("<div></div>").addClass("transifex-js-modal-content");
    this.panel.append(this.closeButton, this.contentHost);
    this.overlay.attr("aria-hidden", "true");
    this.panel.attr("tabindex", "-1");
    this.eventNamespace = `.transifexDialog${Date.now()}${Math.floor(Math.random() * 10000)}`;
    this.onDocumentKeydown = (event: KeyboardEvent) => {
      if (this.options.closeOnEsc && event.key === "Escape") {
        this.close();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = this.panel
        .find(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        .filter(":visible")
        .toArray() as HTMLElement[];

      if (focusable.length === 0) {
        event.preventDefault();
        this.panel.trigger("focus");
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;
      const panelElement = this.panel.get(0) as HTMLElement | undefined;
      const isInsidePanel = !!(
        activeElement &&
        panelElement &&
        panelElement.contains(activeElement)
      );

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
      this.overlay.on("click", (event: Event) => {
        if (event.target === this.overlay.get(0)) {
          this.close();
        }
      });
    }
  }

  setContent(content: any) {
    this.contentHost.empty().append(content);
    return this;
  }

  open() {
    if (this.opened) {
      return this;
    }

    this.overlay
      .stop(true, true)
      .hide()
      .empty()
      .append(this.panel)
      .appendTo("body")
      .fadeIn(120);
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
