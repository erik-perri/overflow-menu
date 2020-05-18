import ResizeMonitor from './ResizeMonitor';
import { OverflowMenu, OverflowMenuInterface } from './OverflowMenu';

const itemContainerSelector = '[data-overflow-menu-items]';
const overflowItemSelector = '[data-overflow-menu-more-item]';
const overflowContainerSelector = '[data-overflow-menu-more-container]';
const menus: { menu: OverflowMenuInterface; element: HTMLElement }[] = [];
const monitor: ResizeMonitor = new ResizeMonitor(window);

const createMenus = (): void => {
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
    monitor.start();
  }
};

monitor.onRecalculateSizes((): void => {
  menus.forEach((info) => {
    info.menu.refreshSizes();
    info.menu.refreshItems();
  });
});

monitor.onResize((): void => {
  menus.forEach((info) => info.menu.refreshItems());
});

const { readyState } = window.document;

if (readyState === 'complete' || readyState === 'interactive') {
  createMenus();
} else {
  window.document.addEventListener('DOMContentLoaded', () => createMenus());
}

export default {
  OverflowMenu,
  GetResizeMonitor: (): ResizeMonitor | undefined => monitor,
  FindMenu: (element: HTMLElement): OverflowMenuInterface | undefined => menus.find(
    (i) => i.element === element,
  )?.menu,
};