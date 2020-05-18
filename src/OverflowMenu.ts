import { getInsideWidth, getOutsideWidth } from './SizeCalculation';

export class OverflowMenu implements OverflowMenuInterface {
  private readonly itemContainer: HTMLElement;

  private readonly items: HTMLElement[];

  private readonly overflowItem: HTMLElement;

  private readonly overflowContainer: HTMLElement;

  private readonly overflowActiveClass: string;

  private breakpoints: MenuBreakpoints[] = [];

  private overflowItemWidth = 0;

  private isHidden: boolean;

  private isOverflowing = false;

  constructor(
    itemContainer: HTMLElement,
    items: HTMLElement[],
    overflowContainer: HTMLElement,
    overflowItem: HTMLElement,
    overflowActiveClass = 'overflow-active',
  ) {
    this.itemContainer = itemContainer;
    this.items = items;
    this.overflowContainer = overflowContainer;
    this.overflowItem = overflowItem;
    this.overflowActiveClass = overflowActiveClass;
    this.isHidden = itemContainer.offsetWidth === 0;
  }

  public refreshItems(): void {
    // We round the container width down and the element widths up.  This will ensure we put items
    // in the overflow container before they cause a line break due to the width.
    let containerWidth = Math.floor(getInsideWidth(this.itemContainer));

    // If the element visibility changes we need to recalculate the widths.  If we don't and the
    // menu started hidden all of the widths will be set to 0.
    const itemContainerIsHidden = containerWidth === 0;
    if (itemContainerIsHidden !== this.isHidden) {
      this.isHidden = itemContainerIsHidden;

      // We only need to recalculate if we're actually being shown.
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
    this.isOverflowing = reversedBreakpoints.find(
      ({ maxWidth }) => maxWidth >= containerWidth,
    ) !== undefined;

    // If we are overflowing we need to subtract the overflow item width from the container to
    // account for it being visible.
    if (this.isOverflowing) {
      containerWidth -= this.overflowItemWidth;
    }

    // When adding we loop through the breakpoints in reverse order so we can only insert what is
    // needed and maintain the correct item order.
    reversedBreakpoints.forEach(({ element, maxWidth }) => {
      if (maxWidth >= containerWidth && element.parentElement !== this.overflowContainer) {
        this.overflowContainer.insertBefore(element, this.overflowContainer.firstChild);
      }
    });

    // When removing we don't need to reverse since they will always be removed in order.
    this.breakpoints.forEach(({ element, maxWidth }) => {
      if (maxWidth < containerWidth && element.parentElement === this.overflowContainer) {
        this.itemContainer.insertBefore(element, this.overflowItem);
      }
    });

    if (this.isOverflowing) {
      this.overflowItem.classList.add(this.overflowActiveClass);
    } else {
      this.overflowItem.classList.remove(this.overflowActiveClass);
    }
  }

  public refreshSizes(): void {
    // Move any known items back into the root element so the size is calculated properly.
    this.breakpoints.map((info) => this.itemContainer.insertBefore(
      info.element,
      this.overflowItem,
    ));

    this.breakpoints = OverflowMenu.calculateBreakpoints(this.items.filter(
      (item: HTMLElement) => item !== this.overflowItem,
    ));

    // Show the overflow menu item so we can calculate it's size properly.
    if (!this.isOverflowing) {
      this.overflowItem.classList.add(this.overflowActiveClass);
    }

    this.overflowItemWidth = Math.ceil(getOutsideWidth(this.overflowItem));

    if (!this.isOverflowing) {
      this.overflowItem.classList.remove(this.overflowActiveClass);
    }
  }

  private static calculateBreakpoints(menuItems: HTMLElement[]): MenuBreakpoints[] {
    const breakpoints: MenuBreakpoints[] = [];

    let currentMaxWidth = 0;

    menuItems.forEach((element) => {
      const elementWidth = Math.ceil(getOutsideWidth(element));
      currentMaxWidth += elementWidth;

      breakpoints.push({ element, maxWidth: currentMaxWidth });
    });

    return breakpoints;
  }
}

export interface OverflowMenuInterface {
  refreshItems(): void;

  refreshSizes(): void;
}

interface MenuBreakpoints {
  element: HTMLElement;
  maxWidth: number;
}
