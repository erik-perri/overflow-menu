// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN#Polyfill
Number.isNaN =
  Number.isNaN ||
  function isNaN(input): boolean {
    // The following works because NaN is the only value in javascript which is not equal to itself.
    // eslint-disable-next-line no-self-compare
    return typeof input === 'number' && input !== input;
  };

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
        console.warn(
          `Failed to parse "${property}", value "${computedValue}"`,
          element
        );
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
  return Math.max(
    0,
    getWidth(element) - getStyleSum(element, ['padding-left', 'padding-right'])
  );
}

export function getOutsideWidth(element: HTMLElement): number {
  return (
    getWidth(element) + getStyleSum(element, ['margin-left', 'margin-right'])
  );
}

export function getHeight(element: HTMLElement): number {
  return element.getBoundingClientRect().height;
}

export function getInsideHeight(element: HTMLElement): number {
  return Math.max(
    0,
    getHeight(element) - getStyleSum(element, ['padding-top', 'padding-bottom'])
  );
}

export function getOutsideHeight(element: HTMLElement): number {
  return (
    getHeight(element) + getStyleSum(element, ['margin-top', 'margin-bottom'])
  );
}
