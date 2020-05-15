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
    const containerWidth = Math.ceil(this.rootMenuElement.offsetWidth
      - this.getElementPaddingSize(this.rootMenuElement)
      - this.overflowMenuItemWidth);
    const overflowElements = [];

    this.breakpoints.forEach(({ element, index, maxWidth }) => {
      if (maxWidth >= containerWidth) {
        overflowElements.push({ element, index });
      } else if (element.parentElement === this.overflowItemContainerElement) {
        this.rootMenuElement.insertBefore(element, this.overflowMenuItemElement);
      }
    });

    // We move the overflow elements after the loop so we can sort by the index
    if (overflowElements.length) {
      this.overflowMenuItemElement.classList.add('active');
      overflowElements
        .sort((a, b) => a.index - b.index)
        .map((info) => this.overflowItemContainerElement.appendChild(info.element));
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

    this.breakpoints = [];

    const menuItems = this.rootMenuElement.querySelectorAll(this.menuItemSelector);
    if (menuItems.length < 1) {
      console.warn(`No menu items found with selector ${this.menuItemSelector}`);
      return;
    }

    let currentMaxWidth = 0;

    menuItems.forEach((element, index) => {
      if (element === this.overflowMenuItemElement) {
        return;
      }

      const elementWidth = Math.ceil(element.offsetWidth + this.getElementMarginSize(element));
      currentMaxWidth += elementWidth;

      this.breakpoints.push({ element, index, maxWidth: currentMaxWidth });
    });

    this.overflowMenuItemElement.classList.add('active');

    const marginSize = this.getElementMarginSize(this.overflowMenuItemElement);
    this.overflowMenuItemWidth = Math.ceil(this.overflowMenuItemElement.offsetWidth + marginSize);

    this.overflowMenuItemElement.classList.remove('active');
  }

  /**
   * @param {HTMLElement} element
   * @param {string[]} properties
   */
  getElementComputedStyleSum(element, properties) {
    const computedStyle = this.window.getComputedStyle(element);
    let sum = 0;

    properties.forEach((property) => {
      const parsed = parseInt(computedStyle[property], 10);
      if (Number.isNaN(parsed)) {
        console.warn(`Failed to parse property ${property}`);
        return;
      }
      sum += parsed;
    });

    return sum;
  }

  /**
   * @param {HTMLElement} element
   */
  getElementMarginSize(element) {
    return Math.ceil(this.getElementComputedStyleSum(element, ['marginLeft', 'marginRight']));
  }

  /**
   * @param {HTMLElement} element
   */
  getElementPaddingSize(element) {
    return Math.ceil(this.getElementComputedStyleSum(element, ['paddingLeft', 'paddingRight']));
  }
}

/**
 * @typedef {Object} MonitorBreakpoint
 * @property {HTMLElement} element
 * @property {int} maxWidth
 * @property {int} index
 */
