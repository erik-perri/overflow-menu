import { FontFaceSet } from 'css-font-loading-module';
import { OverflowMenuInterface } from './OverflowMenu';

export default class ResizeMonitor {
  private readonly window: Window;

  private readonly documentFonts?: FontFaceSet;

  private readonly headObservers: MutationObserver[] = [];

  private readonly overflowMenus: OverflowMenuInterface[] = [];

  private readonly bindings: {
    refreshSizes: () => void;
    onWindowResize: () => void;
    onDomChanges: MutationCallback;
  };

  constructor(windowElement?: Window, documentFonts?: FontFaceSet) {
    this.window = windowElement || window;
    this.documentFonts = documentFonts || this.window?.document?.fonts;

    this.bindings = {
      refreshSizes: this.refreshSizes.bind(this),
      onWindowResize: this.onWindowResize.bind(this),
      onDomChanges: this.onDomChanges.bind(this),
    };
  }

  // noinspection JSUnusedGlobalSymbols
  public getMenus(): OverflowMenuInterface[] {
    return this.overflowMenus;
  }

  public addMenu(menu: OverflowMenuInterface): void {
    this.overflowMenus.push(menu);
  }

  // noinspection JSUnusedGlobalSymbols
  public removeMenu(menu: OverflowMenuInterface): void {
    const index = this.overflowMenus.indexOf(menu);
    if (index !== -1) {
      this.overflowMenus.splice(index, 1);
    }
  }

  public start(): void {
    const { readyState } = this.window.document;

    if (readyState === 'complete') {
      // If we are already loaded we can go ahead and refresh.
      this.refreshSizes();
    } else {
      // Otherwise refresh the breakpoints when the dom is ready and when everything is loaded.
      if (readyState !== 'interactive') {
        this.window.addEventListener('DOMContentLoaded', this.bindings.refreshSizes);
      }

      this.window.addEventListener('load', this.bindings.refreshSizes);
    }

    this.window.addEventListener('resize', this.bindings.onWindowResize);

    // Monitor the head element for changes to detect any stylesheets that are added after load.
    const headNode = this.window.document.querySelector('head');
    if (headNode !== null) {
      this.monitorDom(headNode);
    }

    // Listen for fonts to be ready in case the size changes when they do.
    this.monitorFonts();
  }

  public stop(): void {
    this.window.removeEventListener('resize', this.bindings.onWindowResize);
    this.window.removeEventListener('DOMContentLoaded', this.bindings.refreshSizes);
    this.window.removeEventListener('load', this.bindings.refreshSizes);

    this.headObservers.forEach((observer) => observer.disconnect());
  }

  public refreshSizes(): void {
    this.overflowMenus.forEach((menu) => {
      menu.refreshSizes();
      menu.refreshItems();
    });
  }

  private onWindowResize(): void {
    this.overflowMenus.forEach((menu) => menu.refreshItems());
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
          this.refreshSizes();
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
      this.documentFonts.ready.then(this.bindings.refreshSizes);
    }
  }
}
