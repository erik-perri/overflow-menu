export default class Monitor {
  /**
   * @type {HTMLElement}
   */
  rootMenuElement;

  /**
   * @type {string}
   */
  menuItemSelector;

  /**
   * @type {HTMLElement}
   */
  overflowMenuItemElement;

  /**
   * @type {int}
   */
  overflowMenuItemWidth;

  /**
   * @type {HTMLElement}
   */
  overflowItemContainerElement;

  /**
   * @type {Window}
   */
  window;

  /**
   * @type {MonitorBreakpoint[]}
   */
  breakpoints = [];

  /**
   * @param {HTMLElement} rootMenuElement
   * @param {string} menuItemSelector
   * @param {HTMLElement} overflowMenuItemElement
   * @param {HTMLElement} overflowItemContainerElement
   * @param {Window} [windowElement]
   * @param {FontFaceSet|null} [documentFonts]
   */
  constructor(
    rootMenuElement,
    menuItemSelector,
    overflowMenuItemElement,
    overflowItemContainerElement,
    windowElement = window,
    documentFonts = null,
  ) {
    this.rootMenuElement = rootMenuElement;
    this.menuItemSelector = menuItemSelector;
    this.overflowMenuItemElement = overflowMenuItemElement;
    this.overflowMenuItemWidth = 0;

    if (overflowItemContainerElement) {
      this.overflowItemContainerElement = overflowItemContainerElement;
    } else {
      this.overflowItemContainerElement = overflowMenuItemElement.querySelector(`${rootMenuElement.tagName}`);
    }

    if (this.overflowItemContainerElement === null) {
      throw new Error(`Failed to find overflow menu items container using selector "${rootMenuElement.tagName}"`);
    }

    this.window = windowElement;

    // noinspection JSUnresolvedVariable
    this.documentFonts = documentFonts || windowElement.document.fonts;

    this.refresh = this.refresh.bind(this);
    this.resizeCallback = this.resizeCallback.bind(this);
    this.headChangesCallback = this.headChangesCallback.bind(this);
  }

  start() {
    this.window.addEventListener('resize', this.resizeCallback);

    const { readyState } = document;

    if (readyState === 'complete') {
      // If we are already loaded we can go ahead and refresh
      this.refresh();
    } else {
      // Otherwise refresh the breakpoints when the dom is ready and when everything is loaded
      if (readyState !== 'interactive') {
        this.window.addEventListener('DOMContentLoaded', this.refresh);
      }

      this.window.addEventListener('load', this.refresh);
    }

    // Monitor the head element for changes to detect any stylesheets that might be added after load
    if (this.window.MutationObserver) {
      this.headObserver = new MutationObserver(this.headChangesCallback);
      this.headObserver.observe(this.window.document.querySelector('head'), {
        childList: true,
        subtree: true,
      });
    }

    // If the FontFaceSet property exists subscribe to the ready promise to refresh when fonts are
    // finished loading
    if (this.documentFonts && this.documentFonts.status !== 'loaded') {
      this.documentFonts.ready.then(this.refresh);
    }
  }

  // noinspection JSUnusedGlobalSymbols
  stop() {
    this.window.removeEventListener('resize', this.resizeCallback);
    this.window.removeEventListener('DOMContentLoaded', this.refresh);
    this.window.removeEventListener('load', this.refresh);

    if (this.headObserver) {
      this.headObserver.disconnect();
    }
  }

  refresh() {
    this.refreshBreakpoints();
    this.resizeCallback();
  }

  headChangesCallback(mutationsList) {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          node.addEventListener('load', () => {
            this.refresh();

            if (this.documentFonts && this.documentFonts.status !== 'loaded') {
              this.documentFonts.ready.then(this.refresh);
            }
          });
        });
      }
    });
  }

  resizeCallback() {
    let containerWidth = this.getInnerWidth(this.rootMenuElement);

    containerWidth -= this.overflowMenuItemWidth;

    const overflowElements = [];

    this.breakpoints.forEach(({ element, index, maxWidth }) => {
      if (maxWidth >= containerWidth) {
        // We store the overflow elements in an array with the index and insert it later so we don't
        // have to worry about inserting in the correct position here.
        overflowElements.push({ element, index });
      } else if (element.parentElement === this.overflowItemContainerElement) {
        // If the element breakpoint is smaller than the container and it is  a child of the
        // overflow container we need to move it back to the root.
        this.rootMenuElement.insertBefore(element, this.overflowMenuItemElement);
      }
    });

    if (overflowElements.length) {
      this.overflowMenuItemElement.classList.add('overflow-active');
      overflowElements.map((i) => this.overflowItemContainerElement.appendChild(i.element));
    } else {
      this.overflowMenuItemElement.classList.remove('overflow-active');
    }
  }

  refreshBreakpoints() {
    // Move any known items back into the root element so the size is calculated properly
    this.breakpoints.map((info) => this.rootMenuElement.insertBefore(
      info.element,
      this.overflowMenuItemElement,
    ));

    const menuItemNodes = this.rootMenuElement.querySelectorAll(this.menuItemSelector);

    this.breakpoints = this.calculateBreakpoints(Array.prototype.slice.call(menuItemNodes).filter(
      (item) => item !== this.overflowMenuItemElement,
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
  calculateBreakpoints(menuItems) {
    const breakpoints = [];

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
   * @returns {int}
   */
  getOuterWidth(element) {
    return Math.ceil(this.getSubpixelWidth(element) + this.getHorizontalMarginSize(element));
  }

  /**
   * @param {HTMLElement} element
   * @returns {int}
   */
  getInnerWidth(element) {
    return Math.floor(this.getSubpixelWidth(element) - this.getHorizontalPaddingSize(element));
  }

  /**
   * @param {HTMLElement} element
   * @returns {float|int}
   */
  getSubpixelWidth(element) {
    const computedStyle = this.window.getComputedStyle(element);
    if (computedStyle.width === 'auto') {
      return element.offsetWidth;
    }

    const width = parseFloat(computedStyle.width);
    if (Number.isNaN(width)) {
      console.warn(`Failed to parse property "width", value "${computedStyle.width}"`, element);
      return element.offsetWidth;
    }

    return width;
  }

  /**
   * @param {HTMLElement} element
   * @returns {int}
   */
  getHorizontalMarginSize(element) {
    return Math.ceil(this.getComputedStyleSum(element, ['marginLeft', 'marginRight']));
  }

  /**
   * @param {HTMLElement} element
   * @returns {int}
   */
  getHorizontalPaddingSize(element) {
    return Math.ceil(this.getComputedStyleSum(element, ['paddingLeft', 'paddingRight']));
  }

  /**
   * @param {Element} element
   * @param {string[]} properties
   * @returns {int}
   */
  getComputedStyleSum(element, properties) {
    const computedStyle = this.window.getComputedStyle(element);
    let sum = 0;

    properties.forEach((property) => {
      if (!computedStyle[property]) {
        return;
      }

      const parsed = parseFloat(computedStyle[property]);
      if (Number.isNaN(parsed)) {
        console.warn(`Failed to parse property "${property}", value "${computedStyle[property]}"`, element);
        return;
      }

      sum += Math.ceil(parsed);
    });

    return sum;
  }
}

/**
 * @typedef {Object} MonitorBreakpoint
 * @property {HTMLElement} element
 * @property {int} maxWidth
 * @property {int} index
 */

/**
 * @typedef {Object} FontFaceSet
 * @property {string} status
 * @property {Promise} ready
 */
