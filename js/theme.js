(function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    var MOON = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    var SUN  = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

    function isDark() {
        var cl = document.documentElement.classList;
        if (cl.contains('dark'))  return true;
        if (cl.contains('light')) return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function applyTheme(dark) {
        var cl = document.documentElement.classList;
        cl.toggle('dark',  dark);
        cl.toggle('light', !dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        btn.innerHTML = dark ? SUN : MOON;
        btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    btn.style.display = 'flex'; // hidden by default in CSS; JS reveals it
    applyTheme(isDark());

    btn.addEventListener('click', function () { applyTheme(!isDark()); });
}());
