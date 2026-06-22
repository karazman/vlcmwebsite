// Header background on scroll
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
    const onScroll = () => siteHeader.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

// Continuous ticker loop
const ticker = document.querySelector('.hero-ticker');
const tickerTrack = ticker ? ticker.querySelector('.ticker-track') : null;
if (ticker && tickerTrack) {
    const seedItems = Array.from(tickerTrack.children).map((item) => item.cloneNode(true));

    const fillTicker = () => {
        const minWidth = ticker.clientWidth * 2;
        while (tickerTrack.scrollWidth < minWidth) {
            seedItems.forEach((item) => tickerTrack.appendChild(item.cloneNode(true)));
        }
    };

    fillTicker();

    let offsetX = 0;
    let lastTime = performance.now();
    let frameId = null;
    const speedPxPerSecond = 52;

    const step = (now) => {
        const deltaSeconds = (now - lastTime) / 1000;
        lastTime = now;
        offsetX -= speedPxPerSecond * deltaSeconds;

        // Recycle items that are fully out of view on the left.
        while (tickerTrack.firstElementChild) {
            const first = tickerTrack.firstElementChild;
            const firstStyles = getComputedStyle(first);
            const firstWidth = first.getBoundingClientRect().width + parseFloat(firstStyles.marginRight || '0');
            if (-offsetX >= firstWidth) {
                offsetX += firstWidth;
                tickerTrack.appendChild(first);
            } else {
                break;
            }
        }

        tickerTrack.style.transform = `translate3d(${offsetX}px, 0, 0)`;
        frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);

    window.addEventListener('resize', fillTicker);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (frameId) {
                cancelAnimationFrame(frameId);
            }
            return;
        }
        lastTime = performance.now();
        frameId = requestAnimationFrame(step);
    });
}

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-list');
if (toggle && navList) {
    navList.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => {
        const open = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', (event) => {
        if (!navList.classList.contains('open')) {
            return;
        }
        if (!event.target.closest('.main-nav')) {
            navList.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            navList.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });

    navList.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navList.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => observer.observe(el));
} else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
}

// Contact form submit
const quoteForm = document.querySelector('.cta-form[data-endpoint]');
if (quoteForm) {
    const formNote = quoteForm.querySelector('.form-note');
    quoteForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (formNote) {
            formNote.classList.remove('is-success', 'is-error');
            formNote.textContent = 'Sending your request...';
        }

        const endpoint = quoteForm.getAttribute('data-endpoint');
        const formData = new FormData(quoteForm);
        formData.append('_subject', 'New quote request - VL Capital Management');
        formData.append('_captcha', 'false');

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Request failed');
            }

            quoteForm.reset();
            if (formNote) {
                formNote.classList.add('is-success');
                formNote.textContent = 'Thank you. Your request was sent successfully.';
            }
        } catch (error) {
            if (formNote) {
                formNote.classList.add('is-error');
                formNote.textContent = 'There was a problem sending your request. Please email us directly.';
            }
        }
    });
}

// Insights list interactions (search, category filter, load more)
const insightsHub = document.querySelector('[data-insights-hub]');
if (insightsHub) {
    const cards = Array.from(insightsHub.querySelectorAll('.js-insight-card'));
    const searchInput = insightsHub.querySelector('[data-insights-search]');
    const categoryButtons = Array.from(insightsHub.querySelectorAll('[data-category]'));
    const countEl = insightsHub.querySelector('[data-insights-count]');
    const loadMoreButton = insightsHub.querySelector('[data-insights-load-more]');

    const initialCount = Number(loadMoreButton?.dataset.initialCount || cards.length || 6);
    let visibleLimit = initialCount;
    let activeCategory = 'all';
    let searchValue = '';

    const applyFilters = () => {
        const filtered = cards.filter((card) => {
            const categoryMatch = activeCategory === 'all' || card.dataset.category === activeCategory;
            const haystack = `${card.dataset.title || ''} ${card.dataset.excerpt || ''} ${card.dataset.tags || ''}`;
            const searchMatch = !searchValue || haystack.includes(searchValue);
            return categoryMatch && searchMatch;
        });

        cards.forEach((card) => card.classList.add('is-hidden'));
        filtered.slice(0, visibleLimit).forEach((card) => card.classList.remove('is-hidden'));

        if (countEl) {
            countEl.textContent = `${filtered.length} article(s) found`;
        }

        if (loadMoreButton) {
            const showLoadMore = filtered.length > visibleLimit;
            loadMoreButton.style.display = showLoadMore ? 'inline-flex' : 'none';
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            searchValue = String(event.target.value || '').trim().toLowerCase();
            visibleLimit = initialCount;
            applyFilters();
        });
    }

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeCategory = String(button.dataset.category || 'all');
            visibleLimit = initialCount;
            categoryButtons.forEach((item) => item.classList.toggle('is-active', item === button));
            applyFilters();
        });
    });

    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            visibleLimit += initialCount;
            applyFilters();
        });
    }

    applyFilters();
}
