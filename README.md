# Overflow Menu

A library to move menu items into an overflow menu when they will not fit on one line.

[Example](https://codepen.io/ebp/pen/pojMEXo)


## Automatic initialization

To automatically initialize using data attributes, 3 elements must have attributes set.

`data-overflow-menu-items` should be set on the menu item container with a value set to the selector used to find the menu items.
 
`data-overflow-menu-more-item` should be set on the "More Items" menu item.  It should be hidden by
default, and should be visible when the menu item has the `overflow-active` class.

`data-overflow-menu-more-container` should be set (with no value) on the overflow menu item container.  Items that do not fit will be moved into this container.


## Manual example


```javascript
const menu = new OverflowMenu.OverflowMenu({
  itemContainer: document.querySelector('.site-header > .container'),
  itemSelector: 'a.item',
  overflowItem: document.querySelector('.site-header .overflow-more-items'),
  overflowContainer: document.querySelector('.site-header .overflow-more-items .dropdown-menu'),
});

// If you don't want to use ResizeMonitor, call refreshSizes when elements are loaded and
// refreshMenu when the window is resized.
const monitor = new OverflowMenu.ResizeMonitor();

monitor.onRecalculateSizes(() => {
  menu.refreshSizes();
  menu.refreshMenu();
});

monitor.onResize(() => {
  menu.refreshMenu();
});

monitor.start();
```


## License

[MIT](https://opensource.org/licenses/MIT)
