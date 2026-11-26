// Колода цветов из всех каталогов и заявка
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SIZE = 20, KEY = 'hr-order';
  const SHADES = [
    ['', 'Все цвета', null, 'conic-gradient(#c4143c,#f2bd0c,#9a6fc0,#ee86a5,#c4143c)'],
    ['red', 'Красные', ['red'], '#c4143c'], ['pink', 'Розовые', ['pink', 'softpink', 'hotpink'], '#ee86a5'], ['white', 'Белые', ['white'], '#f3eee0'],
    ['yellow', 'Жёлтые', ['yellow'], '#f2bd0c'], ['orange', 'Оранжевые', ['orange'], '#ef8a3c'], ['lilac', 'Сиреневые', ['lilac', 'purple'], '#9a6fc0'],
    ['mix', 'Двухцветные', ['mix'], 'linear-gradient(135deg,#ee86a5 50%,#f2bd0c 50%)']
  ];
  const all = FLOWERS.map(([name, file, country, color, kind, cut]) => ({ name, file, country, color, kind, cut, label: `${name} (${kind}, ${country})` }));
  const shuffle = list => { const a = list.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.random() * (k + 1) | 0; [a[k], a[j]] = [a[j], a[k]]; } return a; };
  const deck = shuffle(all);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- заявка ---------- */
  const order = new Map();
  const load = () => {
    order.clear();
    try { for (const [n, c] of JSON.parse(sessionStorage.getItem(KEY) || '[]')) if (c > 0) order.set(n, c); } catch (e) { /* хранилище недоступно */ }
  };
  const total = () => [...order.values()].reduce((a, b) => a + b, 0);
  const paintCart = () => { $('cart').textContent = total() ? 'Заявка: ' + total() : 'Запросить прайс'; };
  const add = (label, n) => {
    const v = (order.get(label) || 0) + n;
    if (v > 0) order.set(label, v); else order.delete(label);
    try { sessionStorage.setItem(KEY, JSON.stringify([...order])); } catch (e) { /* без хранилища заявка живёт до закрытия */ }
    paintCart();
  };
  const message = () => {
    if (!order.size) return 'Здравствуйте! Хочу получить прайс HOME ROSES.';
    const head = 'Здравствуйте! Хочу прайс HOME ROSES: ', rows = [...order].map(([n, c]) => `${n} — ${c} банч.`);
    // очень длинную ссылку мессенджер не откроет, поэтому ограничиваем текст
    let text = head, used = 0;
    for (const row of rows) { if (encodeURIComponent(text + row).length > 3500) break; text += (used ? '; ' : '') + row; used++; }
    return used < rows.length ? `${text}; и ещё позиций: ${rows.length - used}.` : text;
  };
  const dialog = $('order');
  const paintOrder = () => {
    dialog.innerHTML = `<h2 id="orderTitle">Заявка</h2>${order.size
      ? `<ul>${[...order].map(([n, c], i) => `<li><span>${esc(n)}</span><b>${c}</b><button type="button" data-i="${i}" data-d="-1" aria-label="Убрать банч">−</button><button type="button" data-i="${i}" data-d="1" aria-label="Добавить банч">+</button></li>`).join('')}</ul>`
      : '<p>Пока пусто. Можно просто запросить прайс.</p>'}
      <button type="button" data-send>${total() ? `Отправить в Telegram: ${total()} банч.` : 'Запросить прайс в Telegram'}</button>
      <button type="button" data-close>Закрыть</button>
      <p class="call">Телефон и WhatsApp: <a href="tel:+79810524242">+7 981 052-42-42</a></p>`;
  };
  dialog.addEventListener('click', e => {
    if (e.target === dialog || e.target.closest('[data-close]')) return dialog.close();
    const step = e.target.closest('[data-d]');
    if (step) { add([...order.keys()][step.dataset.i], +step.dataset.d); paintOrder(); return; }
    if (e.target.closest('[data-send]')) window.open('https://t.me/home_roses_ltda?text=' + encodeURIComponent(message()), '_blank', 'noopener');
  });
  dialog.addEventListener('close', () => { if (i < end()) buttons(); else summary(); });
  const showOrder = () => { paintOrder(); if (!dialog.open) dialog.showModal(); };

  /* ---------- колода ---------- */
  let shade = '', list = deck, i = 0, round = 0, history = [], busy = false, ring = [], epoch = 0;
  const stack = $('stack');
  const end = () => Math.min(list.length, (round + 1) * SIZE);
  const small = () => Math.min(innerWidth, innerHeight) < 600;
  const makeRing = () => { ring = list.filter(f => f.cut).slice(0, small() ? 10 : 18).map(flower => { const image = new Image(); image.src = 'ring/' + flower.file; return { flower, image }; }); };

  function build() {
    const found = SHADES.find(s => s[0] === shade)[2];
    list = found ? deck.filter(f => found.includes(f.color)) : deck;
    i = 0; round = 0; history = []; busy = false; epoch++;
    [...$('dots').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.c === shade));
    makeRing(); render();
  }
  const buttons = () => {
    const done = i >= end();
    $('yes').disabled = $('no').disabled = done;
    $('undo').disabled = !history.length;
  };
  function render() {
    stack.textContent = '';
    if (i >= end()) return summary();
    list.slice(i, Math.min(i + 3, end())).reverse().forEach(f => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `<div class="photo"><img src="img/${esc(f.file)}" alt="${esc(f.name)}" draggable="false"></div><div class="cap"><h2>${esc(f.name)}</h2><p>${esc(f.kind)} · ${esc(f.country)}</p></div><span class="stamp take" aria-hidden="true">БЕРУ</span><span class="stamp skip" aria-hidden="true">МИМО</span>`;
      stack.append(card);
    });
    drag(stack.lastElementChild);
    const next = list[i + 3]; if (next) new Image().src = 'img/' + next.file;
    $('info').textContent = `${i - round * SIZE + 1} из ${end() - round * SIZE}, всего ${list.length}. Вправо — беру, влево — мимо.`;
    buttons();
  }
  function summary() {
    const liked = history.filter(h => h.yes).map(h => h.flower), more = end() < list.length;
    stack.innerHTML = `<div class="end"><h2>${liked.length ? 'Вы выбрали: ' + liked.length : 'Пока ничего не выбрано'}</h2>
      <button type="button" data-send>${total() ? 'Проверить и отправить' : 'Запросить прайс'}</button>
      <button type="button" data-more>${more ? 'Показать ещё' : 'Посмотреть заново'}</button>
      <div class="picked">${liked.map(f => `<figure><img src="img/${esc(f.file)}" alt="" loading="lazy"><figcaption>${esc(f.name)}</figcaption></figure>`).join('')}</div></div>`;
    $('info').textContent = more ? `Просмотрено ${end()} из ${list.length}.` : 'Вы посмотрели всё.';
    buttons();
  }
  function swipe(yes) {
    const card = stack.querySelector('.card:last-child');
    if (!card || busy) return;
    busy = true;
    const flower = list[i], added = yes && !order.has(flower.label);
    if (added) add(flower.label, 1);
    history.push({ flower, yes, added });
    card.classList.add('go');
    card.querySelector(yes ? '.take' : '.skip').style.opacity = 1;
    card.style.transform = `translate(${(yes ? 1 : -1) * (card.offsetWidth + 160)}px,-40px) rotate(${yes ? 22 : -22}deg)`;
    card.style.opacity = 0;
    const started = epoch;   // если за время анимации сменили фильтр, старый свайп не считается
    setTimeout(() => { if (started !== epoch) return; busy = false; i++; render(); }, Globe.calm ? 0 : 280);
  }
  function undo() {
    if (busy || !history.length) return;
    const h = history.pop();
    if (h.added) add(h.flower.label, -1);
    i--; round = Math.floor(i / SIZE); render();
  }
  // цветок, нажатый у шара, становится верхней карточкой
  function bring(flower) {
    const at = list.indexOf(flower);
    if (at < 0 || busy) return;
    list = list.slice();
    list.splice(at, 1);
    if (at < i) { i--; history = history.filter(h => h.flower !== flower); }
    list.splice(i, 0, flower);
    round = Math.floor(i / SIZE); render();
  }
  function drag(card) {
    let id = null, sx = 0, sy = 0, x = 0, y = 0, t = 0;
    const set = () => {
      card.style.transform = x || y ? `translate(${x}px,${y}px) rotate(${x / 20}deg)` : '';
      card.querySelector('.take').style.opacity = Math.max(0, Math.min(1, x / 80));
      card.querySelector('.skip').style.opacity = Math.max(0, Math.min(1, -x / 80));
    };
    card.addEventListener('pointerdown', e => {
      if (id !== null || e.button || busy) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; x = y = 0; t = e.timeStamp; card.classList.remove('go');
      try { card.setPointerCapture(id); } catch (err) { /* указатель уже отпущен */ }
    });
    card.addEventListener('pointermove', e => { if (e.pointerId !== id) return; x = e.clientX - sx; y = (e.clientY - sy) * .5; set(); });
    const release = e => {
      if (e.pointerId !== id) return;
      id = null;
      const far = Math.abs(x) > Math.min(90, card.offsetWidth * .28), flick = Math.abs(x) > 35 && Math.abs(x) / Math.max(1, e.timeStamp - t) > .5;
      if (e.type === 'pointerup' && (far || flick)) return swipe(x > 0);
      card.classList.add('go'); x = y = 0; set();
    };
    card.addEventListener('pointerup', release); card.addEventListener('pointercancel', release);
  }

  /* ---------- связи ---------- */
  $('dots').innerHTML = SHADES.map(([key, title, , css]) => `<button type="button" data-c="${key}" aria-label="${title}" title="${title}" style="--c:${css}"></button>`).join('');
  $('dots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { shade = b.dataset.c; build(); } });
  stack.addEventListener('click', e => {
    if (e.target.closest('[data-send]')) showOrder();
    else if (e.target.closest('[data-more]')) { if (end() < list.length) { round++; render(); } else build(); }
  });
  $('yes').addEventListener('click', () => swipe(true));
  $('no').addEventListener('click', () => swipe(false));
  $('undo').addEventListener('click', undo);
  $('cart').addEventListener('click', showOrder);
  addEventListener('keydown', e => {
    if (dialog.open || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); swipe(true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); swipe(false); }
  });
  // при возврате из каталога кнопкой «Назад» заявка перечитывается
  addEventListener('pageshow', () => { load(); paintCart(); });
  let wasSmall = small();
  addEventListener('resize', () => { if (small() !== wasSmall) { wasSmall = small(); makeRing(); } });

  /* ---------- шар: занимает свободное от панели место ---------- */
  const side = $('side'), tabs = $('tabs'), hint = $('hint');
  Globe.create($('globe'), {
    view: (w, h) => {
      const s = side.getBoundingClientRect(), t = tabs.getBoundingClientRect(), beside = s.left > w * .25;
      const width = beside ? s.left : w;
      const top = beside && h <= 520 ? 46 : 60;
      const hb = hint.getBoundingClientRect(), bottom = hb.height ? hb.top - 8 : t.top - 6;
      const room = Math.max(0, bottom - top);
      return { x: width / 2, y: top + room / 2, r: Math.min(width / 3.5, room / 2.12) };
    },
    ring: () => ring,
    pick: bring,
    country: () => (list[Math.min(i, list.length - 1)] || {}).country,
    open: c => { location.href = `../${c.id}.html`; }
  });

  load(); paintCart(); build();
})();
