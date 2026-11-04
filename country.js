(() => {
  const country = document.body.dataset.country || '';
  const MSG = 'Здравствуйте! Хочу получить прайс HOME ROSES' + (country ? ' по цветам из ' + country + '.' : '.');
  document.querySelectorAll('[data-tg]').forEach(a => a.href = 'https://t.me/home_roses_ltda?text=' + encodeURIComponent(MSG));
  document.querySelectorAll('[data-wa]').forEach(a => a.href = 'https://wa.me/79810524242?text=' + encodeURIComponent(MSG));
  const mailAddr = () => ['invoice', '2007'].join('.') + String.fromCharCode(64) + ['mail', 'ru'].join('.');
  document.querySelectorAll('[data-mail]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    location.href = 'mailto:' + mailAddr() + '?subject=' + encodeURIComponent('Запрос прайса HOME ROSES') + '&body=' + encodeURIComponent(MSG + '\n\nСорта:\nДлина стебля:\nКоличество коробок:\nГород доставки:');
  }));
  document.getElementById('year').textContent = new Date().getFullYear();
})();

// variety gallery: tabs, colour chips, search, details dialog
(() => {
  const root = document.getElementById('sorts'); if (!root) return;
  const country = document.body.dataset.country || '';
  const panels = [...root.querySelectorAll('.panel')];
  const tabs = [...root.querySelectorAll('.tab')];
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t); });
    panels.forEach(p => { p.hidden = p.id !== 'p-' + t.dataset.t; });
  }));
  panels.forEach(p => {
    const chips = [...p.querySelectorAll('.chip')], items = [...p.querySelectorAll('.vr')], inp = p.querySelector('.search input'), empty = p.querySelector('.empty');
    let f = 'all', q = '';
    const apply = () => {
      let n = 0;
      items.forEach(li => { const ok = (f === 'all' || li.dataset.c === f) && (!q || li.dataset.n.includes(q)); li.hidden = !ok; n += ok; });
      empty.hidden = n > 0;
    };
    chips.forEach(c => c.addEventListener('click', () => { chips.forEach(x => x.classList.toggle('on', x === c)); f = c.dataset.f; apply(); }));
    if (inp) inp.addEventListener('input', () => { q = inp.value.trim().toLowerCase(); apply(); });
  });
  const dataEl = document.getElementById('vdata'), dlg = document.getElementById('vdlg');
  if (!dataEl || !dlg) return;
  const D = JSON.parse(dataEl.textContent);
  const ph = dlg.querySelector('.vd-ph'), dl = dlg.querySelector('.vd-f'), kk = dlg.querySelector('.vd-k'), nm = dlg.querySelector('#vdn');
  const tg = dlg.querySelector('[data-vtg]'), wa = dlg.querySelector('[data-vwa]');
  root.addEventListener('click', e => {
    const b = e.target.closest('.vcard'); if (!b) return;
    const d = D[b.dataset.id]; if (!d) return;
    ph.innerHTML = d.i.map(s => '<img src="' + s + '" alt="' + d.n.replace(/"/g, '&quot;') + '">').join('');
    kk.textContent = d.k; nm.textContent = d.n;
    dl.innerHTML = d.f.map(r => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('');
    const msg = 'Здравствуйте! Хочу получить прайс HOME ROSES: ' + d.k.toLowerCase() + ' ' + d.n + (country ? ' (' + country + ')' : '') + '.';
    tg.href = 'https://t.me/home_roses_ltda?text=' + encodeURIComponent(msg);
    wa.href = 'https://wa.me/79810524242?text=' + encodeURIComponent(msg);
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    ph.scrollLeft = 0; dlg.querySelector('.vd').scrollTop = 0;
  });
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
})();
