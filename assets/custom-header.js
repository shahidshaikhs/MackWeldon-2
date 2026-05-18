import { Component } from '@theme/component';

/**
 * @typedef {Object} CustomHeaderRefs
 * @property {HTMLElement} headerInner - The header inner wrapper
 * @property {HTMLElement} overlay - Mega menu overlay
 * @property {HTMLElement} drawerOverlay - Mobile drawer overlay
 * @property {HTMLElement} drawer - Mobile drawer element
 * @property {HTMLElement} drawerLevel1 - Drawer level 1 content
 * @property {HTMLElement} drawerLevel2 - Drawer level 2 content
 * @property {HTMLElement} drawerLevel2Title - Drawer level 2 title
 * @property {HTMLElement} drawerLevel2Links - Drawer level 2 links container
 * @property {HTMLElement} drawerLevel2Promos - Drawer level 2 promos container
 */

/** @extends {Component<CustomHeaderRefs>} */
class CustomHeaderComponent extends Component {
  /** @type {number | null} */
  #hideTimeout = null;

  /** @type {number | null} */
  #activeMegaMenuIndex = null;

  /** @type {ResizeObserver | null} */
  #resizeObserver = null;

  connectedCallback() {
    super.connectedCallback();
    this.#setupResizeObserver();
    this.#reportHeight();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }

    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
    }
  }

  #setupResizeObserver() {
    this.#resizeObserver = new ResizeObserver(() => {
      this.#reportHeight();
    });

    if (this.refs.headerInner) {
      this.#resizeObserver.observe(this.refs.headerInner);
    }
  }

  #reportHeight() {
    const headerInner = this.refs.headerInner;
    if (!headerInner) return;

    const headerHeight = headerInner.offsetHeight;
    const headerGroup = this.closest('#header-group');
    const headerGroupHeight = headerGroup ? headerGroup.offsetHeight : headerHeight;

    document.body.style.setProperty('--header-height', `${headerHeight}px`);
    document.body.style.setProperty('--header-group-height', `${headerGroupHeight}px`);
  }

  /**
   * Show mega menu panel for a given nav item index
   * @param {number} index
   */
  #showMegaMenu(index) {
    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
      this.#hideTimeout = null;
    }

    // Hide any currently active panel
    if (this.#activeMegaMenuIndex !== null && this.#activeMegaMenuIndex !== index) {
      this.#hideMegaMenuImmediate(this.#activeMegaMenuIndex);
    }

    const panel = this.querySelector(`[data-mega-menu-index="${index}"]`);
    const navLink = this.querySelector(`[data-nav-index="${index}"]`);

    if (panel) {
      panel.classList.add('custom-header__mega-menu--active');
    }

    if (navLink) {
      navLink.classList.add('custom-header__nav-link--active');
    }

    if (this.refs.overlay) {
      this.refs.overlay.classList.add('custom-header__overlay--visible');
    }

    this.#activeMegaMenuIndex = index;
  }

  /**
   * @param {number} index
   */
  #hideMegaMenuImmediate(index) {
    const panel = this.querySelector(`[data-mega-menu-index="${index}"]`);
    const navLink = this.querySelector(`[data-nav-index="${index}"]`);

    if (panel) {
      panel.classList.remove('custom-header__mega-menu--active');
    }

    if (navLink) {
      navLink.classList.remove('custom-header__nav-link--active');
    }
  }

  #hideAllMegaMenus() {
    const panels = this.querySelectorAll('.custom-header__mega-menu--active');
    const links = this.querySelectorAll('.custom-header__nav-link--active');

    for (const panel of panels) {
      panel.classList.remove('custom-header__mega-menu--active');
    }

    for (const link of links) {
      link.classList.remove('custom-header__nav-link--active');
    }

    if (this.refs.overlay) {
      this.refs.overlay.classList.remove('custom-header__overlay--visible');
    }

    this.#activeMegaMenuIndex = null;
  }

  /**
   * Handle mouseenter on nav items (desktop)
   * @param {MouseEvent} event
   */
  handleNavEnter(event) {
    const target = /** @type {HTMLElement} */ (event.currentTarget);
    const index = parseInt(target.dataset.navIndex, 10);

    if (isNaN(index)) return;

    // Check if this nav item has a corresponding mega menu panel
    const panel = this.querySelector(`[data-mega-menu-index="${index}"]`);
    if (!panel) return;

    this.#showMegaMenu(index);
  }

  /**
   * Handle mouseleave on nav items (desktop)
   * @param {MouseEvent} event
   */
  handleNavLeave(event) {
    const target = /** @type {HTMLElement} */ (event.currentTarget);
    const relatedTarget = /** @type {HTMLElement | null} */ (event.relatedTarget);

    // Check if mouse moved to the mega menu panel
    if (relatedTarget && (relatedTarget.closest('.custom-header__mega-menu') || relatedTarget.closest('.custom-header__nav-item'))) {
      return;
    }

    this.#scheduleHide();
  }

  /**
   * Handle mouseenter on mega menu panel
   */
  handleMegaMenuEnter() {
    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
      this.#hideTimeout = null;
    }
  }

  /**
   * Handle mouseleave on mega menu panel
   * @param {MouseEvent} event
   */
  handleMegaMenuLeave(event) {
    const relatedTarget = /** @type {HTMLElement | null} */ (event.relatedTarget);

    if (relatedTarget && relatedTarget.closest('.custom-header__nav-item')) {
      return;
    }

    this.#scheduleHide();
  }

  #scheduleHide() {
    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
    }

    this.#hideTimeout = window.setTimeout(() => {
      this.#hideAllMegaMenus();
      this.#hideTimeout = null;
    }, 200);
  }

  /**
   * Handle overlay click to close mega menu
   */
  handleOverlayClick() {
    this.#hideAllMegaMenus();
  }

  /* =====================
   * Mobile Drawer Methods
   * ===================== */

  /**
   * Open mobile drawer
   */
  handleDrawerOpen() {
    const drawer = this.refs.drawer;
    if (!drawer) return;

    drawer.classList.add('custom-header__drawer--open');

    if (this.refs.drawerOverlay) {
      this.refs.drawerOverlay.classList.add('custom-header__drawer-overlay--visible');
    }

    document.body.style.overflow = 'hidden';

    // Reset to level 1
    this.#showDrawerLevel(1);
  }

  /**
   * Close mobile drawer
   */
  handleDrawerClose() {
    const drawer = this.refs.drawer;
    if (!drawer) return;

    drawer.classList.remove('custom-header__drawer--open');

    if (this.refs.drawerOverlay) {
      this.refs.drawerOverlay.classList.remove('custom-header__drawer-overlay--visible');
    }

    document.body.style.overflow = '';
  }

  /**
   * Navigate to a menu item's sub-links (level 2)
   * @param {MouseEvent} event
   */
  handleDrawerNavItem(event) {
    event.preventDefault();

    const target = /** @type {HTMLElement} */ (event.currentTarget);
    const menuTitle = target.dataset.menuTitle;
    const menuIndex = target.dataset.drawerIndex;

    if (!menuTitle || menuIndex === undefined) return;

    // Set the title
    if (this.refs.drawerLevel2Title) {
      this.refs.drawerLevel2Title.textContent = menuTitle;
    }

    // Show/hide the correct child links
    const allChildContainers = this.querySelectorAll('.custom-header__drawer-children');
    for (const container of allChildContainers) {
      container.classList.remove('custom-header__drawer-children--active');
    }

    const activeChildren = this.querySelector(`[data-drawer-children="${menuIndex}"]`);
    if (activeChildren) {
      activeChildren.classList.add('custom-header__drawer-children--active');
    }

    // Show/hide the correct promos
    const allPromoContainers = this.querySelectorAll('.custom-header__drawer-promos');
    for (const container of allPromoContainers) {
      container.classList.remove('custom-header__drawer-promos--active');
    }

    const activePromos = this.querySelector(`[data-drawer-promos="${menuIndex}"]`);
    if (activePromos) {
      activePromos.classList.add('custom-header__drawer-promos--active');
    }

    this.#showDrawerLevel(2);
  }

  /**
   * Go back to level 1 in the drawer
   */
  handleDrawerBack() {
    this.#showDrawerLevel(1);
  }

  /**
   * @param {number} level
   */
  #showDrawerLevel(level) {
    if (this.refs.drawerLevel1 && this.refs.drawerLevel2) {
      if (level === 1) {
        this.refs.drawerLevel1.classList.add('custom-header__drawer-level--active');
        this.refs.drawerLevel2.classList.remove('custom-header__drawer-level--active');
      } else {
        this.refs.drawerLevel1.classList.remove('custom-header__drawer-level--active');
        this.refs.drawerLevel2.classList.add('custom-header__drawer-level--active');
      }
    }

    // Scroll drawer back to top
    const drawer = this.refs.drawer;
    if (drawer) {
      drawer.scrollTop = 0;
    }
  }
}

customElements.define('custom-header-component', CustomHeaderComponent);
