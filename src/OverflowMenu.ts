import { ElementSizeCalculatorInterface } from './ElementSizeCalculator';

export class OverflowMenu implements OverflowMenuInterface {
  private readonly itemContainer: HTMLElement;

  private readonly items: HTMLElement[];

  private readonly overflowItem: HTMLElement;

  private readonly overflowContainer: HTMLElement;

  private readonly calculator: ElementSizeCalculatorInterface;

  private readonly overflowActiveClassName: string;

  private breakpoints: MenuBreakpoints[] = [];

  private itemContainerIsHidden: boolean;

  private overflowItemWidth = 0;

  private isOverflowing = false;

  constructor(
    itemContainer: HTMLElement,
    items: HTMLElement[],
    overflowContainer: HTMLElement,
    overflowItem: HTMLElement,
    calculator: ElementSizeCalculatorInterface,
    overflowActiveClassName = 'overflow-active',
  ) {
    this.itemContainer = itemContainer;
    this.itemContainerIsHidden = itemContainer.offsetWidth === 0;
    this.items = items;
    this.overflowContainer = overflowContainer;
    this.overflowItem = overflowItem;
    this.calculator = calculator;
    this.overflowActiveClassName = overflowActiveClassName;
  }

  public refreshItems(): void {
    // We round the container width down and the element widths up.  This will ensure we put items
    // in the overflow container before they cause a line break due to the width.
    let containerWidth = Math.floor(this.calculator.getInnerWidth(this.itemContainer));

    // If the element visibility changes we need to recalculate the widths.  If we don't and the
    // menu started hidden all of the widths will be set to 0.
    const itemContainerIsHidden = containerWidth === 0;
    if (itemContainerIsHidden !== this.itemContainerIsHidden) {
      // We only need to recalculate if we're actually being shown
      if (!itemContainerIsHidden) {
        this.refreshSizes();
      }
      this.itemContainerIsHidden = itemContainerIsHidden;
    }

    // Check if the overflow menu should be visible. If it is visible subtract the overflow item
    // width from the container so the check below is using the correct size.
    if (this.breakpoints.find(({ maxWidth }) => maxWidth >= containerWidth) !== undefined) {
      containerWidth -= this.overflowItemWidth;
    }

    this.isOverflowing = false;

    this.breakpoints.forEach(({ element, maxWidth }) => {
      if (maxWidth >= containerWidth) {
        this.isOverflowing = true;

        // Some of the items here may already be in the overflow container, we append again anyway
        // so the proper order is maintained.
        this.overflowContainer?.appendChild(element);
      } else if (element.parentElement === this.overflowContainer) {
        // Move the item back to the item container if we are not overflowing any more.
        this.itemContainer.insertBefore(element, this.overflowItem);
      }
    });

    if (this.isOverflowing) {
      this.overflowItem.classList.add(this.overflowActiveClassName);
    } else {
      this.overflowItem.classList.remove(this.overflowActiveClassName);
    }
  }

  public refreshSizes(): void {
    // Move any known items back into the root element so the size is calculated properly
    this.breakpoints.map((info) => this.itemContainer.insertBefore(
      info.element,
      this.overflowItem,
    ));

    this.breakpoints = this.calculateBreakpoints(this.items.filter(
      (item: HTMLElement) => item !== this.overflowItem,
    ));

    // Show the overflow menu item so we can calculate it's size properly
    if (!this.isOverflowing) {
      this.overflowItem.classList.add(this.overflowActiveClassName);
    }

    this.overflowItemWidth = Math.ceil(this.calculator.getOuterWidth(this.overflowItem));

    if (!this.isOverflowing) {
      this.overflowItem.classList.remove(this.overflowActiveClassName);
    }
  }

  private calculateBreakpoints(menuItems: HTMLElement[]): MenuBreakpoints[] {
    const breakpoints: MenuBreakpoints[] = [];

    let currentMaxWidth = 0;

    menuItems.forEach((element) => {
      const elementWidth = Math.ceil(this.calculator.getOuterWidth(element));
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
