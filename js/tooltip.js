(function () {
    if (window.matchMedia('(hover: none)').matches) return;

    const GAP = 6;

    const tip = document.createElement('div');
    tip.style.cssText = [
        'position:fixed', 'display:none',
        'max-width:300px', 'padding:12px 14px',
        'background:var(--bg)', 'border:1px solid var(--border)',
        'border-radius:4px', 'font-size:0.88em', 'line-height:1.55',
        'z-index:100', 'box-shadow:0 4px 24px rgba(0,0,0,.15)',
        'color:var(--text)', 'font-family:inherit',
    ].join(';');
    document.body.appendChild(tip);

    let hideTimer = null;

    function place(anchorEl) {
        // Replicate LessWrong placement="bottom-start": below the element, left-aligned.
        // Flips to top-start if not enough room below.
        tip.style.display = 'block';
        const rect = anchorEl.getBoundingClientRect();
        const tipH = tip.offsetHeight;
        const tipW = tip.offsetWidth;

        let x = rect.left;
        let y = rect.bottom + GAP;

        if (y + tipH > window.innerHeight - GAP) y = rect.top - tipH - GAP;
        x = Math.max(GAP, Math.min(x, window.innerWidth - tipW - GAP));
        y = Math.max(GAP, y);

        tip.style.left = x + 'px';
        tip.style.top  = y + 'px';
    }

    function hideTip() {
        hideTimer = setTimeout(() => { tip.style.display = 'none'; }, 100);
    }

    function cancelHide() { clearTimeout(hideTimer); hideTimer = null; }

    tip.addEventListener('mouseenter', cancelHide);
    tip.addEventListener('mouseleave', hideTip);
    document.addEventListener('scroll', () => { tip.style.display = 'none'; }, { passive: true });

    // ── Footnote reformatting + tooltips ──────────────────────────────────────
    document.querySelectorAll('sup a[href^="#footnote-"]').forEach(link => {
        const num = link.getAttribute('href').slice('#footnote-'.length);
        link.parentElement.id = 'fn-ref-' + num;

        const fn = document.getElementById('footnote-' + num);
        if (fn) {
            fn.innerHTML = fn.innerHTML.replace(/^\[\d+\]\s*/, '');
            const numEl = document.createElement('sup');
            numEl.textContent = num;
            fn.prepend(numEl, ' ');
            const back = document.createElement('a');
            back.href = '#fn-ref-' + num;
            back.textContent = '↩';
            back.className = 'fn-back';
            back.setAttribute('aria-label', 'Back to reference ' + num);
            fn.append(' ', back);
        }

        link.addEventListener('mouseenter', () => {
            const fnEl = document.getElementById('footnote-' + num);
            if (!fnEl) return;
            const clone = fnEl.cloneNode(true);
            const b = clone.querySelector('.fn-back');
            if (b) { if (b.previousSibling) b.previousSibling.remove(); b.remove(); }
            const leadSup = clone.querySelector('sup:first-child');
            if (leadSup) { if (leadSup.nextSibling?.nodeType === 3) leadSup.nextSibling.remove(); leadSup.remove(); }
            tip.style.fontStyle = 'normal';
            tip.innerHTML = clone.innerHTML;
            if (window.MathJax) MathJax.typesetPromise([tip]);
            cancelHide();
            place(link);
        });
        link.addEventListener('mouseleave', hideTip);
    });

    // ── Figure caption tooltips ───────────────────────────────────────────────
    document.querySelectorAll('figure:not(.doodle-cell)').forEach(fig => {
        const cap = fig.querySelector('figcaption');
        if (!cap) return;
        fig.addEventListener('mouseenter', () => {
            tip.style.fontStyle = 'italic';
            tip.innerHTML = cap.innerHTML;
            cancelHide();
            place(fig);
        });
        fig.addEventListener('mouseleave', hideTip);
    });
}());
