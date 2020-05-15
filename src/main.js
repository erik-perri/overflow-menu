import Monitor from './Monitor';

const { document } = window;
const automaticOverflowMenus = [];

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-overflow-menu-items]').forEach((element) => {
    const menuItemSelector = element.dataset.overflowMenuItems;
    if (!menuItemSelector) {
      console.warn('Missing selector', element);
      return;
    }

    const menuItemElement = element.querySelector('[data-overflow-menu-more-item]');
    const menuContainerElement = element.querySelector('[data-overflow-menu-more-container]');
    if (!menuItemElement || !menuContainerElement) {
      console.warn('Missing overflow child', element);
      return;
    }

    // noinspection JSCheckFunctionSignatures
    const monitor = new Monitor(element, menuItemSelector, menuItemElement, menuContainerElement);

    monitor.start();

    automaticOverflowMenus.push({ element, monitor });
  });
});

// noinspection JSUnusedGlobalSymbols
/**
 * @param {HTMLElement} element
 */
export const FindMonitor = (element) => {
  const info = automaticOverflowMenus.find((i) => i.element === element);

  return info ? info.monitor : null;
};

// noinspection JSUnusedGlobalSymbols
export { default as Monitor } from './Monitor';
