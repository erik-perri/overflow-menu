import ResizeMonitor from './ResizeMonitor';
import { OverflowMenu, OverflowMenuInterface } from './OverflowMenu';

const itemContainerSelector = '[data-overflow-menu-items]';
const overflowItemSelector = '[data-overflow-menu-more-item]';
const overflowContainerSelector = '[data-overflow-menu-more-container]';
const menus: { menu: OverflowMenuInterface; element: HTMLElement }[] = [];
let monitor: ResizeMonitor;

const createMenus = (): void => {
  if (menus.length > 0 || monitor !== undefined) {
    throw new Error('Menus already created');
  }

  window.document.querySelectorAll(itemContainerSelector)
    .forEach((element: Element) => {
      const htmlElement = element as HTMLElement;

      const menuItemSelector: string = htmlElement.dataset.overflowMenuItems || '';
      if (!menuItemSelector) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Missing selector', htmlElement);
        }
        return;
      }

      const overflowItem = htmlElement.querySelector(overflowItemSelector);
      const overflowContainer = htmlElement.querySelector(overflowContainerSelector);
      if (!overflowItem || !overflowContainer) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Missing overflow child', element);
        }
        return;
      }

      const menu = new OverflowMenu(
        htmlElement,
        Array.prototype.slice.call(htmlElement.querySelectorAll(menuItemSelector)),
        overflowContainer as HTMLElement,
        overflowItem as HTMLElement,
      );

      menus.push({ menu, element: htmlElement });
    });

  if (menus.length) {
    monitor = new ResizeMonitor(window);
    menus.forEach((info) => monitor?.addMenu(info.menu));
    monitor.start();
  }
};

const { readyState } = window.document;

if (readyState === 'complete' || readyState === 'interactive') {
  createMenus();
} else {
  window.document.addEventListener('DOMContentLoaded', () => createMenus());
}

export default {
  OverflowMenu,
  ResizeMonitor,
  GetResizeMonitor: (): ResizeMonitor | undefined => monitor,
  FindMenu: (element: HTMLElement): OverflowMenuInterface | undefined => menus.find(
    (i) => i.element === element,
  )?.menu,
};
