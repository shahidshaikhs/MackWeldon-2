import { Component } from '@theme/component';
import { RecentlyViewed } from '@theme/recently-viewed-products';

/**
 * @typedef {Object} RecentlyViewedSectionRefs
 * @property {HTMLElement} carousel - The scrollable carousel container
 * @property {HTMLButtonElement} prevArrow - Previous navigation arrow
 * @property {HTMLButtonElement} nextArrow - Next navigation arrow
 */

/** @extends {Component<RecentlyViewedSectionRefs>} */
class RecentlyViewedSection extends Component {
  /** @type {AbortController | null} */
  #abortController = null;

  connectedCallback() {
    super.connectedCallback();
    this.#loadProducts();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  async #loadProducts() {
    const productIds = RecentlyViewed.getProducts();

    if (productIds.length === 0) return;

    const sectionId = this.dataset.sectionId;

    if (!sectionId) return;

    const query = productIds.map((id) => `id:${id}`).join(' OR ');
    const url = new URL(Theme.routes.search_url, location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('resources[type]', 'product');
    url.searchParams.set('section_id', sectionId);

    this.#abortController = new AbortController();

    try {
      const response = await fetch(url.toString(), {
        signal: this.#abortController.signal,
      });

      if (!response.ok) return;

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const serverCarousel = doc.querySelector('[ref="carousel"]');

      if (!serverCarousel || serverCarousel.children.length === 0) return;

      /** @type {Map<string, Element>} */
      const cardsByProductId = new Map();

      for (const card of serverCarousel.children) {
        const productId = card.querySelector('[data-product-id]')?.getAttribute('data-product-id');

        if (productId) {
          cardsByProductId.set(productId, card);
        }
      }

      const { carousel } = this.refs;

      if (!carousel) return;

      // Insert cards in localStorage order (most recently viewed first)
      for (const id of productIds) {
        const card = cardsByProductId.get(id);

        if (card) {
          carousel.appendChild(card);
        }
      }

      // Append any remaining cards not matched by ID
      for (const [id, card] of cardsByProductId) {
        if (!productIds.includes(id)) {
          carousel.appendChild(card);
        }
      }

      if (carousel.children.length > 0) {
        this.style.display = '';
        this.#updateArrowStates();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  handlePrev() {
    const { carousel } = this.refs;

    if (!carousel) return;

    const scrollAmount = this.#getScrollAmount();
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  handleNext() {
    const { carousel } = this.refs;

    if (!carousel) return;

    const scrollAmount = this.#getScrollAmount();
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  /**
   * @returns {number}
   */
  #getScrollAmount() {
    const { carousel } = this.refs;

    if (!carousel || !carousel.firstElementChild) return 0;

    const firstCard = carousel.firstElementChild;
    const gap = parseFloat(getComputedStyle(carousel).gap) || 0;

    return firstCard.getBoundingClientRect().width + gap;
  }

  #updateArrowStates() {
    const { carousel, prevArrow, nextArrow } = this.refs;

    if (!carousel || !prevArrow || !nextArrow) return;

    const isAtStart = carousel.scrollLeft <= 1;
    const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;

    prevArrow.classList.toggle('recently-viewed__arrow--disabled', isAtStart);
    nextArrow.classList.toggle('recently-viewed__arrow--disabled', isAtEnd);
    prevArrow.setAttribute('aria-disabled', String(isAtStart));
    nextArrow.setAttribute('aria-disabled', String(isAtEnd));
  }

  handleScroll() {
    this.#updateArrowStates();
  }
}

customElements.define('recently-viewed-section', RecentlyViewedSection);
