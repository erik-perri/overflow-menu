function getStyleSum(element: HTMLElement, properties: string[]): number {
  const computedStyle = window.getComputedStyle(element);
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

export function getWidth(element: HTMLElement): number {
  return element.getBoundingClientRect().width;
}

export function getInsideWidth(element: HTMLElement): number {
  return getWidth(element) - getStyleSum(element, ['padding-left', 'padding-right']);
}

export function getOutsideWidth(element: HTMLElement): number {
  return getWidth(element) + getStyleSum(element, ['margin-left', 'margin-right']);
}

export function getHeight(element: HTMLElement): number {
  return element.getBoundingClientRect().height;
}

export function getInsideHeight(element: HTMLElement): number {
  return getHeight(element) - getStyleSum(element, ['padding-top', 'padding-bottom']);
}

export function getOutsideHeight(element: HTMLElement): number {
  return getHeight(element) + getStyleSum(element, ['margin-top', 'margin-bottom']);
}
