(function () {
    const tip = document.createElement('div');
    tip.style.cssText = [
        'position:fixed', 'display:none', 'opacity:0',
        'transition:opacity 0.08s ease',
        'max-width:260px',
        'padding:0.6em 0.8em', 'background:hsl(40,20%,98%)',
        'border:1px solid hsl(0,0%,80%)', 'border-radius:6px',
        'font-size:0.82em', 'line-height:1.5', 'z-index:100',
        'box-shadow:0 2px 12px rgba(0,0,0,.12)',
        'color:hsl(0,5%,10%)', 'font-family:inherit',
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

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        // If the cursor streaks far from the tip while the grace period is pending,
        // cancel and hide immediately — a deliberate move toward the tip stays
        // within ~80px, but a fast streak across the page shouldn't leave it open.
        if (!tipTimer) return;
        const r = tip.getBoundingClientRect();
        if (e.clientX < r.left - 80 || e.clientX > r.right + 80 ||
            e.clientY < r.top - 80 || e.clientY > r.bottom + 80) {
            hideTipNow();
        }
    });

    document.querySelectorAll('sup a[href^="#footnote-"]').forEach(link => {
        link.addEventListener('mouseenter', e => {
            const fn = document.getElementById(link.getAttribute('href').slice(1));
            if (!fn) return;
            tip.innerHTML = fn.innerHTML.replace(/^\[\d+\]\s*/, '');
            if (window.MathJax) MathJax.typesetPromise([tip]);
            // Anchor to the superscript element rather than using cursor direction —
            // footnotes are small targets and the tooltip should always be close.
            const w = 260, gap = 8;
            const rect = link.getBoundingClientRect();
            const x = Math.max(gap, Math.min(rect.left, window.innerWidth - w - gap));
            const below = rect.bottom + gap;
            const above = rect.top - gap - 120;
            const y = below + 120 < window.innerHeight ? below : Math.max(gap, above);
            tip.style.left = x + 'px';
            tip.style.top  = y + 'px';
            showTip();
        });
        link.addEventListener('mouseleave', hideTip);
    });
})();
