import { getInsideWidth, getOutsideWidth } from './SizeCalculation';

export interface OverflowMenuInterface {
  /**
   * Calculates the container width and moves items that will not fit to the overflow menu.  Item
   * sizes are not calculated here, if item sizes need to be updated call {@link refreshSizes}
   * first.
   */
  refreshMenu(): void;

  /**
   * Calculates the item sizes and stores them for use in {@link refreshMenu}.
   */
  refreshSizes(): void;
}

export interface OverflowMenuOptions {
  /**
   * The container containing the initial menu elements.  Items will be removed from and placed
   * inside this.
   */
  itemContainer: HTMLElement;

  /**
   * The selector to use when looking for menu items.  Only children of {@link itemContainer} will
   * be matched.
   */
  itemSelector: string;

  /**
   * The "More Items" menu item.  This will be shown and hidden automatically using
   * {@link overflowActiveClass}.
   */
  overflowItem: HTMLElement;

  /**
   * The overflow container.  Items will be moved between this and {@link itemContainer}.
   */
  overflowContainer: HTMLElement;

  /**
   * The class to set on {@link overflowItem} when it is visible.
   */
  overflowActiveClass?: string;

  /**
   * The function used to calculate the container width.  By default, this calculates the inner
   * width of {@link itemContainer} rounded down.
   *
   * @param element
   * @return number
   */
  calculateContainerWidth?: (element: HTMLElement) => number;

  /**
   * The function used to calculate the item widths.  By default, this calculates the outer width of
   * {@link itemContainer} rounded up.
   *
   * @param element
   * @return number
   */
  calculateItemWidth?: (element: HTMLElement) => number;

  /**
   * The function used to hide the overflow item.  By default, this adds {@link overflowActiveClass}
   * to the class list.
   *
   * @param element
   */
  showOverflowItem?: (element: HTMLElement) => void;

  /**
   * The function used to hide the overflow item.  By default, this removes
   * {@link overflowActiveClass} from the class list.
   *
   * @param element
   */
  hideOverflowItem?: (element: HTMLElement) => void;

  /**
   * The function used to find items.  By default, this searches for children of
   * {@link itemContainer} using {@link itemSelector}.  An array must be returned, if using
   * querySelectorAll the return should be passed through Array.prototype.slice.call first.
   *
   * @param selector
   * @return HTMLElement[]
   */
  findItems?: (selector: string) => HTMLElement[];
}

export interface MenuBreakpoints {
  element: HTMLElement;
  maxWidth: number;
}

export class OverflowMenu implements OverflowMenuInterface {
  private readonly options: OverflowMenuOptions;

  // noinspection JSUnusedGlobalSymbols -- They are not unused, they are merged in constructor
  private readonly defaultOptions = {
    overflowActiveClass: 'overflow-active',

    calculateContainerWidth: (element: HTMLElement): number =>
      Math.floor(getInsideWidth(element)),
    calculateItemWidth: (element: HTMLElement): number =>
      Math.ceil(getOutsideWidth(element)),

    showOverflowItem: (element: Element): void => {
      if (this.options.overflowActiveClass) {
        element.classList.add(this.options.overflowActiveClass);
      }
    },

    hideOverflowItem: (element: Element): void => {
      if (this.options.overflowActiveClass) {
        element.classList.remove(this.options.overflowActiveClass);
      }
    },

    findItems: (selector: string): HTMLElement[] =>
      Array.prototype.slice.call(
        this.options.itemContainer.querySelectorAll(selector)
      ) as HTMLElement[],
  };

  private breakpoints: MenuBreakpoints[] = [];

  private overflowItemWidth = 0;

  private isHidden: boolean;

  private isOverflowing = false;

  constructor(options: OverflowMenuOptions) {
    this.options = { ...this.defaultOptions, ...options };

    this.isHidden = this.options.itemContainer.offsetWidth === 0;
  }

  public refreshMenu(): void {
    const {
      calculateContainerWidth,
      showOverflowItem,
      hideOverflowItem,
    } = this.options;

    if (!calculateContainerWidth || !showOverflowItem || !hideOverflowItem) {
      return;
    }

    let containerWidth = calculateContainerWidth(this.options.itemContainer);

    // If the element visibility changes we need to recalculate the widths.  If we don't and the
    // menu started hidden all of the widths will be set to 0.
    const itemContainerIsHidden = containerWidth === 0;
    if (itemContainerIsHidden !== this.isHidden) {
      this.isHidden = itemContainerIsHidden;

      // We only need to recalculate if we're being shown.
      if (!itemContainerIsHidden) {
        this.refreshSizes();
      }
    }

    // If we are hidden there is no point continuing.
    if (this.isHidden) {
      return;
    }

    const reversedBreakpoints = this.breakpoints.slice().reverse();

    // We check this outside of the loop so we only subtract the overflow item width only when
    // needed. If we always subtract it we can end up switching to the overflow when an item would
    // still fit.  We check against the reversed array so we are comparing the highest maxWidth
    // first.
    this.isOverflowing =
      reversedBreakpoints.find(({ maxWidth }) => maxWidth > containerWidth) !==
      undefined;

    // If we are overflowing we need to subtract the overflow item width from the container to
    // account for it being visible.
    if (this.isOverflowing) {
      containerWidth -= this.overflowItemWidth;
    }

    // When adding we loop through the breakpoints in reverse order so we can only insert what is
    // needed and maintain the correct item order.
    reversedBreakpoints.forEach(({ element, maxWidth }) => {
      if (
        maxWidth > containerWidth &&
        element.parentElement !== this.options.overflowContainer
      ) {
        this.options.overflowContainer.insertBefore(
          element,
          this.options.overflowContainer.firstChild
        );
      }
    });

    // When removing we don't need to reverse since they will always be removed in order.
    this.breakpoints.forEach(({ element, maxWidth }) => {
      if (
        maxWidth <= containerWidth &&
        element.parentElement === this.options.overflowContainer
      ) {
        this.options.itemContainer.insertBefore(
          element,
          this.options.overflowItem
        );
      }
    });

    if (this.isOverflowing) {
      showOverflowItem(this.options.overflowItem);
    } else {
      hideOverflowItem(this.options.overflowItem);
    }
  }

  public refreshSizes(): void {
    const {
      calculateItemWidth,
      findItems,
      showOverflowItem,
      hideOverflowItem,
    } = this.options;

    if (
      !calculateItemWidth ||
      !findItems ||
      !showOverflowItem ||
      !hideOverflowItem
    ) {
      return;
    }

    // Move any known items back into the root element so the size is calculated properly.
    this.breakpoints.map((info) =>
      this.options.itemContainer.insertBefore(
        info.element,
        this.options.overflowItem
      )
    );

    this.breakpoints = this.calculateBreakpoints(
      findItems(this.options.itemSelector).filter(
        (item: HTMLElement) => item !== this.options.overflowItem
      )
    );

    // Make sure the overflow menu is visible so we can calculate it's size properly.
    if (!this.isOverflowing) {
      showOverflowItem(this.options.overflowItem);
    }

    this.overflowItemWidth = calculateItemWidth(this.options.overflowItem);

    if (!this.isOverflowing) {
      hideOverflowItem(this.options.overflowItem);
    }
  }

  private calculateBreakpoints(menuItems: HTMLElement[]): MenuBreakpoints[] {
    const { calculateItemWidth } = this.options;

    if (!calculateItemWidth) {
      return [];
    }

    const breakpoints: MenuBreakpoints[] = [];
    let currentMaxWidth = 0;

    menuItems.forEach((element) => {
      const elementWidth = calculateItemWidth(element);
      currentMaxWidth += elementWidth;

      breakpoints.push({ element, maxWidth: currentMaxWidth });
    });

    return breakpoints;
  }
}
