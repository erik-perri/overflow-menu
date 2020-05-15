export class Monitor {
    rootMenuElement;
    menuItemSelector;
    overflowMenuItem;
    overflowMenuItemWidth;
    overflowMenuItemsContainerElement;

    /**
     * @type {MonitorBreakpoint[]}
     */
    breakpoints = [];

    /**
     * @param {HTMLElement} rootMenuElement
     * @param {string} menuItemSelector
     * @param {HTMLElement} overflowMenuItem
     * @param {HTMLElement} overflowMenuContainer
     * @param {Window} windowElement
     */
    constructor(
        rootMenuElement,
        menuItemSelector,
        overflowMenuItem,
        overflowMenuContainer,
        windowElement = window
    ) {
        this.rootMenuElement = rootMenuElement;
        this.menuItemSelector = menuItemSelector;
        this.overflowMenuItem = overflowMenuItem;
        this.overflowMenuItemWidth = 0;
        this.overflowMenuItemsContainerElement = overflowMenuContainer || overflowMenuItem.querySelector(`${rootMenuElement.tagName}`);
        if (this.overflowMenuItemsContainerElement === null) {
            throw new Error(`Failed to find overflow menu items container using selector "${rootMenuElement.tagName}"`)
        }

        this.window = windowElement;
        this.onResize = this.onResize.bind(this);
        this.refresh = this.refresh.bind(this);
    }

    start() {
        this.window.addEventListener('resize', this.onResize);
        this.window.addEventListener('DOMContentLoaded', this.refresh);
        this.window.addEventListener('load', this.refresh);
        this.refreshBreakpoints();
    }

    stop() {
        this.window.removeEventListener('resize', this.onResize);
        this.window.removeEventListener('DOMContentLoaded', this.refresh);
        this.window.removeEventListener('load', this.refresh);
    }

    refresh() {
        this.refreshBreakpoints();
        this.onResize();
    }

    onResize() {
        const containerWidth = Math.ceil(this.rootMenuElement.offsetWidth
            - this.getElementPaddingSize(this.rootMenuElement)
            - this.overflowMenuItemWidth);
        const overflowElements = [];

        this.breakpoints.forEach((info) => {
            const parentElement = info.element.parentElement;

            if (info.maxWidth >= containerWidth) {
                overflowElements.push({element: info.element, index: info.index});
            } else if (parentElement === this.overflowMenuItemsContainerElement) {
                this.rootMenuElement.insertBefore(info.element, this.overflowMenuItem);
            }
        });

        // We move the overflow elements after the loop so we can sort by the index
        if (overflowElements.length) {
            this.overflowMenuItem.classList.add('active');
            overflowElements
                .sort((a, b) => a.index - b.index)
                .map(info => this.overflowMenuItemsContainerElement.appendChild(info.element))
        } else {
            this.overflowMenuItem.classList.remove('active');
        }
    }

    refreshBreakpoints() {
        // Move any known items back into the root element so the size is calculated properly
        this.breakpoints.map(info => this.rootMenuElement.insertBefore(info.element, this.overflowMenuItem));

        this.breakpoints = [];

        const menuItems = this.rootMenuElement.querySelectorAll(this.menuItemSelector);
        if (menuItems.length < 1) {
            console.warn(`No menu items found with selector ${this.menuItemSelector}`);
            return;
        }

        let currentMaxWidth = 0;

        menuItems.forEach((element, index) => {
            if (element === this.overflowMenuItem) {
                return;
            }

            const elementWidth = Math.ceil(element.offsetWidth + this.getElementMarginSize(element));
            currentMaxWidth += elementWidth;

            this.breakpoints.push({element, index, maxWidth: currentMaxWidth});
        });

        this.overflowMenuItem.classList.add('active');
        this.overflowMenuItemWidth = Math.ceil(this.overflowMenuItem.offsetWidth + this.getElementMarginSize(this.overflowMenuItem));
        this.overflowMenuItem.classList.remove('active');
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
            if (isNaN(parsed)) {
                console.warn(`Failed to parse property ${property}`);
                return;
            }
            sum += parsed;
        })

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
 */
