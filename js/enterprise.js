/* Presentation adapter. No business data or storage writes. */
(function () {
    'use strict';
    document.title = 'D SMART ERP v2.0 | Enterprise';
    const sidebar = document.querySelector('.sidebar');
    sidebar.querySelector('.notice').textContent = 'D SMART ERP v2.0 · Enterprise';
    const buttons = [...sidebar.querySelectorAll('button')];
    const keyOf = button => (button.getAttribute('onclick') || '').match(/showPage\(['"]([^'"]+)/)?.[1] || button.dataset.page;
    // Dynamic module buttons retain their original handlers.
    buttons.forEach(button => {
        button.dataset.erpLabel = button.textContent.replace(/^[^가-힣A-Za-z0-9]+/u, '').trim();
        button.textContent = button.dataset.erpLabel;
        button.title = button.dataset.erpLabel;
    });
    const search = document.createElement('input');
    search.className = 'menu-search'; search.type = 'search';
    search.placeholder = '메뉴 검색'; search.setAttribute('aria-label', '업무 메뉴 검색');
    sidebar.querySelector('.logo').after(search);
    search.addEventListener('input', () => {
        buttons.forEach(button => button.hidden = !button.textContent.toLowerCase().includes(search.value.trim().toLowerCase()));
    });
    const label = document.createElement('div'); label.className = 'nav-caption'; label.textContent = 'WORKSPACE / 전체 업무'; search.after(label);
    const dashboard = document.getElementById('dashboard');
    const legacy = document.createElement('div'); legacy.hidden = true; legacy.id = 'legacyDashboardBindings';
    // Keep nodes queried by erp-01..11 alive; show one copy of each metric.
    const oldCards = dashboard.querySelector('.cards');
    const secondary = document.createElement('div'); secondary.className = 'overview-secondary';
    ['totalProducts', 'totalIn', 'totalOut', 'erpPendingTasks', 'erp19AlertCount'].forEach(id => {
        const card = document.getElementById(id)?.closest('.card');
        if (card) secondary.append(card);
    });
    legacy.append(oldCards);
    const warning = document.getElementById('erpWarningTable')?.closest('.panel');
    if (warning) legacy.append(warning);
    dashboard.append(legacy);
    const overview = document.getElementById('v2Dashboard');
    overview.querySelector('.v2-grid').after(secondary);
    document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
        const target = buttons.find(item => keyOf(item) === button.dataset.open || item.textContent.includes(button.dataset.open === 'erp19-approval' ? '전자결재' : '재고관리'));
        if (target) target.click();
    }));
    function polish() {
        buttons.forEach(button => {
            const clean = button.textContent.replace(/^[^가-힣A-Za-z0-9]+/u, '').trim();
            if (clean !== button.textContent) button.textContent = clean;
            button.setAttribute('aria-current', button.classList.contains('active') ? 'page' : 'false');
        });
        document.querySelectorAll('input,select,textarea').forEach(input => {
            if (!input.labels?.length && !input.hasAttribute('aria-label')) input.setAttribute('aria-label', input.placeholder || input.id || '입력 항목');
        });
        document.querySelectorAll('#pageTitle,.page h2,.page h3').forEach(heading => {
            if (heading.firstChild?.nodeType === 3) {
                const clean = heading.firstChild.textContent.replace(/^[^가-힣A-Za-z0-9]+/u, '');
                if (clean !== heading.firstChild.textContent) heading.firstChild.textContent = clean;
            }
        });
    }
    const observer = new MutationObserver(polish);
    observer.observe(document.querySelector('.main'), {childList:true,subtree:true});
    // Do not observe attributes/text; avoid observer loops.
    sidebar.addEventListener('click', () => setTimeout(polish, 0));
    polish();
})();
