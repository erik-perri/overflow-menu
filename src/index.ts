import Monitor from './Monitor';

interface AutomaticMonitorInterface {
  element: HTMLElement;
  monitor: Monitor;
}

const { document } = window;
const automaticOverflowMenus: AutomaticMonitorInterface[] = [];

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-overflow-menu-items]').forEach((element: Element) => {
    const htmlElement = element as HTMLElement;

    const menuItemSelector: string = htmlElement.dataset.overflowMenuItems || '';
    if (!menuItemSelector) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Missing selector', htmlElement);
      }
      return;
    }

    const menuItemElement: HTMLElement = htmlElement.querySelector('[data-overflow-menu-more-item]') as HTMLElement;
    const menuContainerElement: HTMLElement = htmlElement.querySelector('[data-overflow-menu-more-container]') as HTMLElement;
    if (!menuItemElement || !menuContainerElement) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Missing overflow child', element);
      }
      return;
    }

    // noinspection JSCheckFunctionSignatures
    const monitor = new Monitor(
      htmlElement,
      menuItemSelector,
      menuItemElement,
      menuContainerElement,
    );

    monitor.start();

    automaticOverflowMenus.push({ element: htmlElement, monitor });
  });
});

const FindMonitor = (element: HTMLElement): Monitor | null => {
  const info = automaticOverflowMenus.find((i) => i.element === element);

  return info ? info.monitor : null;
};

export default {
  Monitor,
  FindMonitor,
};
