import { FontFaceSet } from 'css-font-loading-module';

export default class ResizeMonitor {
  private readonly window: Window;

  private readonly documentFonts?: FontFaceSet;

  private readonly headObservers: MutationObserver[] = [];

  private recalculateCallbacks: { (): void }[] = [];

  private resizeCallbacks: { (): void }[] = [];

  private started = false;

  private readonly bindings: {
    processRecalculate: () => void;
    processResize: () => void;
    onDomChanges: MutationCallback;
  };

  constructor(windowElement?: Window, documentFonts?: FontFaceSet) {
    this.window = windowElement || window;
    this.documentFonts = documentFonts || this.window?.document?.fonts;

    this.bindings = {
      processRecalculate: this.processRecalculate.bind(this),
      processResize: this.processResize.bind(this),
      onDomChanges: this.onDomChanges.bind(this),
    };
  }

  public start(): void {
    if (this.started) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('ResizeMonitor already monitored');
      }
      return;
    }
    this.started = true;

    const { readyState } = this.window.document;

    if (readyState === 'complete') {
      // If we are already loaded we can go ahead and refresh.
      this.processRecalculate();
    } else {
      // Otherwise recalculate when the dom is ready and when everything is loaded.
      if (readyState !== 'interactive') {
        this.window.addEventListener(
          'DOMContentLoaded',
          this.bindings.processRecalculate
        );
      }

      this.window.addEventListener('load', this.bindings.processRecalculate);
    }

    this.window.addEventListener('resize', this.bindings.processResize);

    // Monitor the head element for changes to detect any stylesheets that are added after load.
    const headNode = this.window.document.querySelector('head');
    if (headNode !== null) {
      this.monitorDom(headNode);
    }

    // Listen for fonts to be ready in case the size changes when they do.
    this.monitorFonts();
  }

  public stop(): void {
    this.started = false;

    this.window.removeEventListener('resize', this.bindings.processResize);
    this.window.removeEventListener(
      'DOMContentLoaded',
      this.bindings.processRecalculate
    );
    this.window.removeEventListener('load', this.bindings.processRecalculate);

    this.headObservers.forEach((observer) => observer.disconnect());
  }

  public onRecalculateSizes(callback: () => void): void {
    this.recalculateCallbacks.push(callback);
  }

  private processRecalculate(): void {
    this.recalculateCallbacks.forEach((callback) => callback());
  }

  public onResize(callback: () => void): void {
    this.resizeCallbacks.push(callback);
  }

  private processResize(): void {
    this.resizeCallbacks.forEach((callback) => callback());
  }

  // noinspection JSMethodCanBeStatic
  private onDomChanges(mutations: MutationRecord[]): void {
    mutations.forEach((mutation) => {
      if (mutation.type !== 'childList') {
        return;
      }

      mutation.addedNodes.forEach((node) => {
        if (!['link', 'style'].includes(node.nodeName.toLowerCase())) {
          return;
        }

        // If a link or style tag are added we wait for them to load to refresh.  We also need to
        // re-listen for font loading in case the stylesheet loaded new items
        node.addEventListener('load', () => {
          this.processRecalculate();
          this.monitorFonts();
        });
      });
    });
  }

  private monitorDom(element: Element): void {
    const observer = new MutationObserver(this.bindings.onDomChanges);
    observer.observe(element, { childList: true, subtree: true });

    this.headObservers.push(observer);
  }

  private monitorFonts(): void {
    if (this.documentFonts && this.documentFonts.status !== 'loaded') {
      this.documentFonts.ready.then(this.bindings.processRecalculate);
    }
  }
}
