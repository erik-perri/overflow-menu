export class ElementSizeCalculator implements ElementSizeCalculatorInterface {
  private window: Window;

  constructor(windowElement?: Window) {
    this.window = windowElement || window;
  }

  public getWidth(element: HTMLElement): number {
    return this.getDimension(element, 'width');
  }

  public getInnerWidth(element: HTMLElement): number {
    const padding = this.getStyleSum(element, ['padding-left', 'padding-right']);
    return this.getWidth(element) - padding;
  }

  public getOuterWidth(element: HTMLElement): number {
    const margin = this.getStyleSum(element, ['margin-left', 'margin-right']);
    return this.getWidth(element) + margin;
  }

  public getHeight(element: HTMLElement): number {
    return this.getDimension(element, 'height');
  }

  public getInnerHeight(element: HTMLElement): number {
    const padding = this.getStyleSum(element, ['padding-top', 'padding-bottom']);
    return this.getHeight(element) - padding;
  }

  public getOuterHeight(element: HTMLElement): number {
    const margin = this.getStyleSum(element, ['margin-top', 'margin-bottom']);
    return this.getHeight(element) + margin;
  }

  private getDimension(element: HTMLElement, dimension: string): number {
    const computedStyle = this.window.getComputedStyle(element);
    const computedValue = computedStyle.getPropertyValue(dimension);
    if (computedValue !== 'auto') {
      const parsedValue = parseFloat(computedValue);
      if (!Number.isNaN(parsedValue)) {
        return parsedValue;
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn(`Failed to parse "${dimension}", value "${computedValue}"`, element);
      }
    }

    if (dimension === 'width') {
      return element.offsetWidth;
    }

    return element.offsetHeight;
  }

  private getStyleSum(element: HTMLElement, properties: string[]): number {
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
          console.warn(`Failed to parse "${property}", value "${computedValue}"`, element);
        }
        return;
      }

      sum += parsed;
    });

    return sum;
  }
}

export interface ElementSizeCalculatorInterface {
  getWidth(element: HTMLElement): number;

  getInnerWidth(element: HTMLElement): number;

  getOuterWidth(element: HTMLElement): number;

  getHeight(element: HTMLElement): number;

  getInnerHeight(element: HTMLElement): number;

  getOuterHeight(element: HTMLElement): number;
}
