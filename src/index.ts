import ResizeMonitor from './ResizeMonitor';
import { OverflowMenu, OverflowMenuInterface } from './OverflowMenu';

const itemContainerSelector = '[data-overflow-menu-items]';
const overflowItemSelector = '[data-overflow-menu-more-item]';
const overflowContainerSelector = '[data-overflow-menu-more-container]';
const menus: { menu: OverflowMenuInterface; element: HTMLElement }[] = [];
const monitor: ResizeMonitor = new ResizeMonitor(window);

monitor.onRecalculateSizes((): void => {
  menus.forEach((info) => {
    info.menu.refreshSizes();
    info.menu.refreshMenu();
  });
});

monitor.onResize((): void => {
  menus.forEach((info) => info.menu.refreshMenu());
});

const createMenus = (): void => {
  window.document.querySelectorAll(itemContainerSelector).forEach((element: Element) => {
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

    const menu = new OverflowMenu({
      itemContainer: htmlElement,
      itemSelector: menuItemSelector,
      overflowItem: overflowItem as HTMLElement,
      overflowContainer: overflowContainer as HTMLElement,
    });

    menus.push({ menu, element: htmlElement });
  });

  if (menus.length) {
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
