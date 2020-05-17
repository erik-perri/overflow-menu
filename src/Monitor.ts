interface MonitorBreakpoint {
  element: HTMLElement;
  index: number;
  maxWidth: number;
}

interface FontFaceSetInterface {
  status: string;
  ready: Promise<void>;
}

interface DocumentInterface {
  fonts?: FontFaceSetInterface;
}

interface WindowInterface {
  MutationObserver?: MutationObserver;
}

export default class Monitor {
  private readonly rootMenuElement: HTMLElement;

  private rootMenuElementIsHidden: boolean;

  private readonly menuItemSelector: string;

  private readonly overflowMenuItemElement: HTMLElement;

  private overflowMenuItemWidth: number;

  private readonly overflowItemContainerElement?: HTMLElement;

  private readonly window: Window;

  private readonly documentFonts?: FontFaceSetInterface;

  private headObserver?: MutationObserver;

  private breakpoints: MonitorBreakpoint[] = [];

  private readonly bindings: {
    refresh: () => void;
    resizeCallback: () => void;
    headChangesCallback: MutationCallback;
  };

  constructor(
    rootMenuElement: HTMLElement,
    menuItemSelector: string,
    overflowMenuItemElement: HTMLElement,
    overflowItemContainerElement: HTMLElement,
    windowElement?: Window,
    documentFonts?: FontFaceSetInterface,
  ) {
    this.rootMenuElement = rootMenuElement;
    this.rootMenuElementIsHidden = rootMenuElement.offsetWidth === 0;
    this.menuItemSelector = menuItemSelector;
    this.overflowMenuItemElement = overflowMenuItemElement;
    this.overflowMenuItemWidth = 0;

    if (overflowItemContainerElement) {
      this.overflowItemContainerElement = overflowItemContainerElement;
    } else {
      const foundOverflowMenu = overflowMenuItemElement.querySelector(`${rootMenuElement.tagName}`);
      this.overflowItemContainerElement = foundOverflowMenu as HTMLElement;
    }

    if (this.overflowItemContainerElement === null) {
      throw new Error(`Failed to find overflow menu items container using selector "${rootMenuElement.tagName}"`);
    }

    this.window = windowElement || window;
    this.documentFonts = documentFonts || (this.window?.document as DocumentInterface)?.fonts;

    this.bindings = {
      refresh: this.refresh.bind(this),
      resizeCallback: this.resizeCallback.bind(this),
      headChangesCallback: this.headChangesCallback.bind(this),
    };
  }

  start(): void {
    this.window.addEventListener('resize', this.bindings.resizeCallback);

    const { readyState } = document;

    if (readyState === 'complete') {
      // If we are already loaded we can go ahead and refresh
      this.refresh();
    } else {
      // Otherwise refresh the breakpoints when the dom is ready and when everything is loaded
      if (readyState !== 'interactive') {
        this.window.addEventListener('DOMContentLoaded', this.bindings.refresh);
      }

      this.window.addEventListener('load', this.bindings.refresh);
    }

    // Monitor the head element for changes to detect any stylesheets that might be added after load
    if ((this.window as WindowInterface).MutationObserver) {
      const headNode = this.window.document.querySelector('head');

      if (headNode !== null) {
        this.headObserver = new MutationObserver(this.bindings.headChangesCallback);
        this.headObserver.observe(headNode, {
          childList: true,
          subtree: true,
        });
      }
    }

    // If the FontFaceSet property exists subscribe to the ready promise to refresh when fonts are
    // finished loading
    if (this.documentFonts && this.documentFonts.status !== 'loaded') {
      this.documentFonts.ready.then(this.bindings.refresh);
    }
  }

  stop(): void {
    this.window.removeEventListener('resize', this.bindings.resizeCallback);
    this.window.removeEventListener('DOMContentLoaded', this.bindings.refresh);
    this.window.removeEventListener('load', this.bindings.refresh);

    this.headObserver?.disconnect();
  }

  refresh(): void {
    this.refreshBreakpoints();
    this.resizeCallback();
  }

  headChangesCallback(mutations: MutationRecord[]): void {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          node.addEventListener('load', () => {
            this.refresh();

            if (this.documentFonts && this.documentFonts.status !== 'loaded') {
              this.documentFonts.ready.then(this.bindings.refresh);
            }
          });
        });
      }
    });
  }

  resizeCallback(): void {
    let containerWidth = this.getInnerWidth(this.rootMenuElement);

    // If the element visibility changes we need to recalculate the widths.  If we don't and the
    // menu started hidden all of the widths will be set to 0.
    const rootMenuElementIsHidden = containerWidth === 0;
    if (rootMenuElementIsHidden !== this.rootMenuElementIsHidden) {
      // We only need to recalculate if we're actually being shown
      if (!rootMenuElementIsHidden) {
        this.refreshBreakpoints();
      }
      this.rootMenuElementIsHidden = rootMenuElementIsHidden;
    }

    // Check if the overflow menu should be visible, if so subtract it from the container width so
    // the checks below are against the container with it visible.
    if (this.breakpoints.find(({ maxWidth }) => maxWidth >= containerWidth) !== undefined) {
      containerWidth -= this.overflowMenuItemWidth;
    }

    const overflowElements: { element: HTMLElement; index: number }[] = [];

    this.breakpoints.forEach(({ element, index, maxWidth }) => {
      if (maxWidth >= containerWidth) {
        // We store the overflow elements in an array with the index and insert it later so we don't
        // have to worry about inserting in the correct position here.
        overflowElements.push({
          element,
          index,
        });
      } else if (element.parentElement === this.overflowItemContainerElement) {
        // If the element breakpoint is smaller than the container and it is  a child of the
        // overflow container we need to move it back to the root.
        this.rootMenuElement.insertBefore(element, this.overflowMenuItemElement);
      }
    });

    if (overflowElements.length) {
      this.overflowMenuItemElement.classList.add('overflow-active');
      overflowElements.map((i) => this.overflowItemContainerElement?.appendChild(i.element));
    } else {
      this.overflowMenuItemElement.classList.remove('overflow-active');
    }
  }

  refreshBreakpoints(): void {
    // Move any known items back into the root element so the size is calculated properly
    this.breakpoints.map((info) => this.rootMenuElement.insertBefore(
      info.element,
      this.overflowMenuItemElement,
    ));

    const menuItemNodes = this.rootMenuElement.querySelectorAll(this.menuItemSelector);

    this.breakpoints = this.calculateBreakpoints(Array.prototype.slice.call(menuItemNodes).filter(
      (item: HTMLElement) => item !== this.overflowMenuItemElement,
    ));

    // Show the overflow menu item so we can calculate it's size properly
    const hadActiveClass = this.overflowMenuItemElement.classList.contains('overflow-active');
    if (!hadActiveClass) {
      this.overflowMenuItemElement.classList.add('overflow-active');
    }

    this.overflowMenuItemWidth = this.getOuterWidth(this.overflowMenuItemElement);

    if (!hadActiveClass) {
      this.overflowMenuItemElement.classList.remove('overflow-active');
    }
  }

  /**
   * @param {HTMLElement[]} menuItems
   * @returns {MonitorBreakpoint[]}
   */
  calculateBreakpoints(menuItems: HTMLElement[]): MonitorBreakpoint[] {
    const breakpoints: MonitorBreakpoint[] = [];

    let currentMaxWidth = 0;

    menuItems.forEach((element, index) => {
      const elementWidth = this.getOuterWidth(element);
      currentMaxWidth += elementWidth;

      breakpoints.push({ element, index, maxWidth: currentMaxWidth });
    });

    return breakpoints;
  }

  /**
   * @param {HTMLElement} element
   * @returns {number}
   */
  getOuterWidth(element: HTMLElement): number {
    return Math.ceil(this.getSubpixelWidth(element) + this.getHorizontalMarginSize(element));
  }

  /**
   * @param {HTMLElement} element
   * @returns {number}
   */
  getInnerWidth(element: HTMLElement): number {
    return Math.floor(this.getSubpixelWidth(element) - this.getHorizontalPaddingSize(element));
  }

  /**
   * @param {HTMLElement} element
   * @returns {number}
   */
  getSubpixelWidth(element: HTMLElement): number {
    const computedStyle = this.window.getComputedStyle(element);
    if (computedStyle.width === 'auto') {
      return element.offsetWidth;
    }

    const width = parseFloat(computedStyle.width);
    if (Number.isNaN(width)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Failed to parse property "width", value "${computedStyle.width}"`, element);
      }
      return element.offsetWidth;
    }

    return width;
  }

  /**
   * @param {HTMLElement} element
   * @returns {number}
   */
  getHorizontalMarginSize(element: HTMLElement): number {
    return Math.ceil(this.getComputedStyleSum(element, ['marginLeft', 'marginRight']));
  }

  /**
   * @param {HTMLElement} element
   * @returns {number}
   */
  getHorizontalPaddingSize(element: HTMLElement): number {
    return Math.ceil(this.getComputedStyleSum(element, ['paddingLeft', 'paddingRight']));
  }

  /**
   * @param {Element} element
   * @param {string[]} properties
   * @returns {number}
   */
  getComputedStyleSum(element: HTMLElement, properties: string[]): number {
    const computedStyle = this.window.getComputedStyle(element);
    let sum = 0;

    properties.forEach((property) => {
      const computedValue: string = computedStyle.getPropertyValue(property);
      if (!computedValue) {
        return;
      }

      const parsed = parseFloat(computedValue);
      if (Number.isNaN(parsed)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to parse property "${property}", value "${computedValue}"`, element);
        }
        return;
      }

      sum += Math.ceil(parsed);
    });

    return sum;
  }
}
