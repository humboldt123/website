(function () {
    if (window.matchMedia('(hover: none)').matches) return;
    const card = document.createElement('div');
    card.style.cssText = 'position:fixed;display:none;opacity:0;transition:opacity 0.08s ease;width:210px;z-index:50;box-shadow:0 4px 20px rgba(0,0,0,.18);overflow:hidden;border-radius:6px;border:1px solid var(--border);';

    const cardImg = document.createElement('img');
    cardImg.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;object-fit:cover;';

    const cardText = document.createElement('p');
    cardText.style.cssText = 'margin:0;padding:8px 10px 10px;font-size:0.78em;color:var(--muted);font-family:inherit;line-height:1.45;font-style:italic;background:var(--bg);';

    card.appendChild(cardImg);
    card.appendChild(cardText);
    document.body.appendChild(card);

    let cardTimer, cardFadeTimer, mx = null, my = null;

    function showCard() {
        clearTimeout(cardTimer); cardTimer = null;
        clearTimeout(cardFadeTimer);
        card.style.pointerEvents = 'auto';
        card.style.display = 'block';
        requestAnimationFrame(() => { card.style.opacity = '1'; });
    }

    function hideCard() {
        cardTimer = setTimeout(() => {
            cardTimer = null;
            card.style.pointerEvents = 'none';
            card.style.opacity = '0';
            cardFadeTimer = setTimeout(() => { card.style.display = 'none'; }, 80);
        }, 150);
    }

    function hideCardNow() {
        clearTimeout(cardTimer); cardTimer = null;
        card.style.pointerEvents = 'none';
        card.style.opacity = '0';
        cardFadeTimer = setTimeout(() => { card.style.display = 'none'; }, 80);
    }

    card.addEventListener('mouseenter', () => { clearTimeout(cardTimer); cardTimer = null; });
    card.addEventListener('mouseleave', hideCard);

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        if (!cardTimer) return;
        const r = card.getBoundingClientRect();
        if (e.clientX < r.left - 80 || e.clientX > r.right + 80 ||
            e.clientY < r.top  - 80 || e.clientY > r.bottom + 80) hideCardNow();
    });

    document.querySelectorAll('[data-banner]').forEach(el => {
        el.addEventListener('mouseenter', e => {
            cardImg.src = el.dataset.banner;
            if (el.dataset.tagline) {
                cardText.textContent = el.dataset.tagline;
                cardText.style.display = 'block';
            } else {
                cardText.style.display = 'none';
            }
            const w = 210, h = 190, gap = 16;
            let x, y;
            if (mx !== null) {
                const dx = e.clientX - mx, dy = e.clientY - my;
                if (Math.abs(dx) >= Math.abs(dy)) {
                    x = dx >= 0 ? e.clientX - w - gap : e.clientX + gap;
                    y = e.clientY - h / 2;
                } else {
                    x = e.clientX + gap;
                    y = dy >= 0 ? e.clientY - h - gap : e.clientY + gap;
                }
            } else {
                x = e.clientX + gap;
                y = e.clientY + gap;
            }
            card.style.left = Math.max(gap, Math.min(x, window.innerWidth  - w - gap)) + 'px';
            card.style.top  = Math.max(gap, Math.min(y, window.innerHeight - h - gap)) + 'px';
            showCard();
        });
        el.addEventListener('mouseleave', hideCard);
    });
}());
