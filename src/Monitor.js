export default class Monitor {
  /**
   * @param {HTMLElement} rootMenuElement
   * @param {string} menuItemSelector
   * @param {HTMLElement} overflowMenuItemElement
   * @param {HTMLElement} overflowItemContainerElement
   * @param {Window} [windowElement]
   */
  constructor(
    rootMenuElement,
    menuItemSelector,
    overflowMenuItemElement,
    overflowItemContainerElement,
    windowElement = window,
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
    this.refresh = this.refresh.bind(this);
    this.resizeCallback = this.resizeCallback.bind(this);
  }

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

  start() {
    this.window.addEventListener('resize', this.resizeCallback);

    // Refresh the breakpoints on when the dom is ready and when the content is loaded
    this.window.addEventListener('DOMContentLoaded', this.refresh);
    this.window.addEventListener('load', this.refresh);

    this.refreshBreakpoints();
  }

  // noinspection JSUnusedGlobalSymbols
  stop() {
    this.window.removeEventListener('resize', this.resizeCallback);
    this.window.removeEventListener('DOMContentLoaded', this.refresh);
    this.window.removeEventListener('load', this.refresh);
  }

  refresh() {
    this.refreshBreakpoints();
    this.resizeCallback();
  }

  resizeCallback() {
    const overflowElements = [];
    let containerWidth = this.getInnerWidth(this.rootMenuElement);

    containerWidth -= this.overflowMenuItemWidth;

    this.breakpoints.forEach(({ element, index, maxWidth }) => {
      if (maxWidth >= containerWidth) {
        // We store the overflow elements in an array with the index and insert it later so we don't
        // have to worry about inserting in the correct position here.
        overflowElements.push({ element, index });
      } else if (element.parentElement === this.overflowItemContainerElement) {
        this.rootMenuElement.insertBefore(element, this.overflowMenuItemElement);
      }
    });

    if (overflowElements.length) {
      this.overflowMenuItemElement.classList.add('active');
      overflowElements.map((i) => this.overflowItemContainerElement.appendChild(i.element));
    } else {
      this.overflowMenuItemElement.classList.remove('active');
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

    this.overflowMenuItemElement.classList.add('active');

    this.overflowMenuItemWidth = this.getOuterWidth(this.overflowMenuItemElement);

    this.overflowMenuItemElement.classList.remove('active');
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
   */
  getOuterWidth(element) {
    return Math.ceil(element.offsetWidth + this.getHorizontalMarginSize(element));
  }

  /**
   * @param {HTMLElement} element
   */
  getInnerWidth(element) {
    return Math.ceil(element.offsetWidth - this.getHorizontalPaddingSize(element));
  }

  /**
   * @param {HTMLElement} element
   */
  getHorizontalMarginSize(element) {
    return Math.ceil(this.getComputedStyleSum(element, ['marginLeft', 'marginRight']));
  }

  /**
   * @param {HTMLElement} element
   */
  getHorizontalPaddingSize(element) {
    return Math.ceil(this.getComputedStyleSum(element, ['paddingLeft', 'paddingRight']));
  }

  /**
   * @param {Element} element
   * @param {string[]} properties
   */
  getComputedStyleSum(element, properties) {
    const computedStyle = this.window.getComputedStyle(element);
    let sum = 0;

    properties.forEach((property) => {
      if (!computedStyle[property]) {
        return;
      }

      const parsed = parseInt(computedStyle[property], 10);
      if (Number.isNaN(parsed)) {
        console.warn(`Failed to parse property "${property}", value "${computedStyle[property]}"`);
        return;
      }
      sum += parsed;
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
