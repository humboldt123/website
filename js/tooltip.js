(function () {
    const tip = document.createElement('div');
    tip.style.cssText = [
        'position:fixed', 'display:none', 'opacity:0',
        'transition:opacity 0.08s ease',
        'max-width:260px', 'padding:0.6em 0.8em',
        'background:var(--bg)', 'border:1px solid var(--border)',
        'border-radius:6px', 'font-size:0.82em', 'line-height:1.5',
        'z-index:100', 'box-shadow:0 2px 12px rgba(0,0,0,.12)',
        'color:var(--text)', 'font-family:inherit',
    ].join(';');
    document.body.appendChild(tip);

    let tipTimer, tipFadeTimer, mx = null, my = null;

    function showTip() {
        clearTimeout(tipTimer); tipTimer = null;
        clearTimeout(tipFadeTimer);
        tip.style.pointerEvents = 'auto';
        tip.style.display = 'block';
        requestAnimationFrame(() => { tip.style.opacity = '1'; });
    }

    function hideTip() {
        tipTimer = setTimeout(() => {
            tipTimer = null;
            tip.style.pointerEvents = 'none';
            tip.style.opacity = '0';
            tipFadeTimer = setTimeout(() => { tip.style.display = 'none'; }, 80);
        }, 150);
    }

    function hideTipNow() {
        clearTimeout(tipTimer); tipTimer = null;
        tip.style.pointerEvents = 'none';
        tip.style.opacity = '0';
        tipFadeTimer = setTimeout(() => { tip.style.display = 'none'; }, 80);
    }

    tip.addEventListener('mouseenter', () => { clearTimeout(tipTimer); tipTimer = null; });
    tip.addEventListener('mouseleave', hideTip);
    document.addEventListener('scroll', hideTipNow, { passive: true });

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        if (!tipTimer) return;
        const r = tip.getBoundingClientRect();
        if (e.clientX < r.left - 80 || e.clientX > r.right + 80 ||
            e.clientY < r.top  - 80 || e.clientY > r.bottom + 80) hideTipNow();
    });

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

        link.addEventListener('mouseenter', e => {
            const fnEl = document.getElementById('footnote-' + num);
            if (!fnEl) return;
            const clone = fnEl.cloneNode(true);
            const b = clone.querySelector('.fn-back');
            if (b) { if (b.previousSibling) b.previousSibling.remove(); b.remove(); }
            const leadSup = clone.querySelector('sup:first-child');
            if (leadSup) { if (leadSup.nextSibling?.nodeType === 3) leadSup.nextSibling.remove(); leadSup.remove(); }
            tip.innerHTML = clone.innerHTML;
            tip.style.fontStyle = 'normal';
            if (window.MathJax) MathJax.typesetPromise([tip]);
            const w = 260, gap = 8;
            const rect = link.getBoundingClientRect();
            const x = Math.max(gap, Math.min(rect.left, window.innerWidth - w - gap));
            const below = rect.bottom + gap;
            const above = rect.top - gap - 120;
            tip.style.left = x + 'px';
            tip.style.top  = (below + 120 < window.innerHeight ? below : Math.max(gap, above)) + 'px';
            showTip();
        });
        link.addEventListener('mouseleave', hideTip);
    });

    // ── Figure caption tooltips ───────────────────────────────────────────────
    document.querySelectorAll('figure:not(.doodle-cell)').forEach(fig => {
        const cap = fig.querySelector('figcaption');
        if (!cap) return;
        fig.addEventListener('mouseenter', e => {
            tip.innerHTML = cap.innerHTML;
            tip.style.fontStyle = 'italic';
            const w = 220, gap = 12;
            const x = e.clientX + gap + w < window.innerWidth
                ? e.clientX + gap : e.clientX - gap - w;
            const dy = my !== null ? e.clientY - my : 1;
            const y = dy >= 0 ? e.clientY - 60 - gap : e.clientY + gap;
            tip.style.left = Math.max(gap, x) + 'px';
            tip.style.top  = Math.max(gap, Math.min(y, window.innerHeight - 80)) + 'px';
            showTip();
        });
        fig.addEventListener('mouseleave', hideTip);
    });
}());
