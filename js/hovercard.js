(function () {
    if (window.matchMedia('(hover: none)').matches) return;

    const CARD_W = 300;
    const GAP    = 6;

    const card = document.createElement('div');
    card.style.cssText = [
        'position:fixed', 'display:none', 'z-index:50',
        'width:' + CARD_W + 'px',
        'overflow:hidden', 'border-radius:4px',
        'border:1px solid var(--border)',
        'box-shadow:0 4px 24px rgba(0,0,0,.15)',
        'background:var(--bg)',
    ].join(';');

    const cardImg = document.createElement('img');
    cardImg.style.cssText = 'display:block;width:100%;height:160px;object-fit:cover;';

    const cardBody = document.createElement('div');
    cardBody.style.cssText = 'padding:10px 12px 12px;';

    const cardTitle = document.createElement('p');
    cardTitle.style.cssText = 'margin:0 0 4px;font-weight:bold;font-size:0.95em;color:var(--text);line-height:1.3;';

    const cardTagline = document.createElement('p');
    cardTagline.style.cssText = 'margin:0;font-size:0.82em;color:var(--muted);font-style:italic;line-height:1.4;';

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardTagline);
    card.appendChild(cardImg);
    card.appendChild(cardBody);
    document.body.appendChild(card);

    let hideTimer = null;

    function show(el) {
        clearTimeout(hideTimer); hideTimer = null;

        // Content
        cardImg.src = el.dataset.banner;
        const title = el.querySelector('a')?.textContent?.trim() || '';
        cardTitle.textContent = title;
        cardTitle.style.display = title ? 'block' : 'none';
        if (el.dataset.tagline) {
            cardTagline.textContent = el.dataset.tagline;
            cardTagline.style.display = 'block';
        } else {
            cardTagline.style.display = 'none';
        }

        // Position — below element, anchored to its rect (LessWrong placement="bottom-start")
        card.style.display = 'block';
        const rect = el.getBoundingClientRect();
        const cardH = card.offsetHeight;
        let x = rect.left;
        let y = rect.bottom + GAP;

        // Flip above if not enough room below
        if (y + cardH > window.innerHeight - GAP) y = rect.top - cardH - GAP;

        // Clamp horizontally
        x = Math.max(GAP, Math.min(x, window.innerWidth - CARD_W - GAP));
        y = Math.max(GAP, y);

        card.style.left = x + 'px';
        card.style.top  = y + 'px';
    }

    function hide() {
        hideTimer = setTimeout(() => { card.style.display = 'none'; }, 100);
    }

    card.addEventListener('mouseenter', () => { clearTimeout(hideTimer); hideTimer = null; });
    card.addEventListener('mouseleave', hide);

    document.querySelectorAll('[data-banner]').forEach(el => {
        el.addEventListener('mouseenter', () => show(el));
        el.addEventListener('mouseleave', hide);
    });
}());
