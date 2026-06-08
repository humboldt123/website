(function () {
    const tip = document.createElement('div');
    tip.style.cssText = [
        'position:fixed', 'display:none', 'opacity:0',
        'transition:opacity 0.08s ease',
        'max-width:220px', 'padding:0.5em 0.7em',
        'background:hsl(40,20%,98%)', 'border:1px solid hsl(0,0%,80%)',
        'border-radius:6px', 'font-size:0.8em', 'line-height:1.4',
        'z-index:100', 'box-shadow:0 2px 12px rgba(0,0,0,.12)',
        'color:hsl(0,5%,10%)', 'font-family:inherit', 'font-style:italic',
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
        if (!tipTimer) return;
        const r = tip.getBoundingClientRect();
        if (e.clientX < r.left - 80 || e.clientX > r.right + 80 ||
            e.clientY < r.top - 80 || e.clientY > r.bottom + 80) {
            hideTipNow();
        }
    });

    // Attach to any figure with a figcaption, skipping doodle placeholders.
    document.querySelectorAll('figure:not(.doodle-cell)').forEach(fig => {
        const cap = fig.querySelector('figcaption');
        if (!cap) return;
        fig.addEventListener('mouseenter', e => {
            tip.innerHTML = cap.innerHTML;
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
})();
