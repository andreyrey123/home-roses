(() => {
const $ = id => document.getElementById(id);
const all = s => [...document.querySelectorAll(s)];

/* ---------- выбор сортов и сообщения ---------- */
const BASE = 'Здравствуйте! Хочу получить прайс HOME ROSES';
const KEY = 'hr2-pick';
let chosen = [];
try { chosen = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
const message = () => chosen.length ? BASE + ' на позиции: ' + chosen.join(', ') + '.' : BASE + '.';
const tg = t => 'https://t.me/home_roses_ltda?text=' + encodeURIComponent(t);
const wa = t => 'https://wa.me/79810524242?text=' + encodeURIComponent(t);
// MAX не умеет открывать чат по номеру: сюда нужна ссылка профиля из приложения (max.ru/u/…)
const MAX_LINK = 'https://max.ru/';

/* ---------- полка со стеблями ---------- */
const STEMS = [['explorer','Explorer','красная'],['mondial','Mondial','белая'],['pink-floyd','Pink Floyd','малиновая'],['esperance','Esperance','бело-розовая'],['freedom','Freedom','красная'],['coral-reef','Coral Reef','коралловая'],['pink-mondial','Pink Mondial','нежно-розовая'],['brighton','Brighton','жёлтая'],['deep-purple','Deep Purple','пурпурная'],['playa-blanca','Playa Blanca','белая'],['cabaret','Cabaret','двухцветная'],['cherry-o','Cherry O','вишнёвая'],['born-free','Born Free','красная'],['atomic','Atomic','огненная'],['be-sweet','Be Sweet','розовая']];
const row = $('row');
row.innerHTML = STEMS.map(([f, n, c]) => `<button class="stem" type="button" data-n="${n}"><span class="ph"><img src="cut/std-${f}.webp" alt="" draggable="false"></span><b>${n}</b><span class="c">${c}</span></button>`).join('');

all('[data-chips]').forEach(ul => {
  ul.innerHTML = ul.textContent.split('|').map(n => `<li><button class="chip" type="button" data-n="${n.trim()}">${n.trim()}</button></li>`).join('');
});

const paint = () => {
  all('[data-n]').forEach(b => b.setAttribute('aria-pressed', chosen.includes(b.dataset.n)));
  $('pick').textContent = chosen.length ? 'В запросе (' + chosen.length + '): ' + chosen.join(', ') : 'Прайс на ближайший рейс';
  $('clear').hidden = !chosen.length;
  all('[data-tg]').forEach(a => a.href = tg(message()));
  all('[data-wa]').forEach(a => a.href = wa(message()));
  try { localStorage.setItem(KEY, JSON.stringify(chosen)); } catch (e) {}
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-n]'); if (!b) return;
  const n = b.dataset.n;
  chosen = chosen.includes(n) ? chosen.filter(x => x !== n) : [...chosen, n];
  paint();
});
$('clear').onclick = () => { chosen = []; paint(); };
all('[data-max]').forEach(a => a.href = MAX_LINK);

const step = d => row.scrollBy({ left: d * row.clientWidth * .7, behavior: 'smooth' });
$('prev').onclick = () => step(-1);
$('next').onclick = () => step(1);
const ends = () => { $('prev').disabled = row.scrollLeft < 4; $('next').disabled = row.scrollLeft > row.scrollWidth - row.clientWidth - 4; };
row.addEventListener('scroll', ends, { passive: true }); addEventListener('resize', ends); ends();

/* ---------- окно «Запросить прайс» ---------- */
const dlg = $('dlg');
all('[data-price]').forEach(b => b.addEventListener('click', () => {
  const t = b.dataset.price || message();
  dlg.querySelector('[data-tg]').href = tg(t);
  dlg.querySelector('[data-wa]').href = wa(t);
  $('dlgMsg').textContent = 'Выберите, куда удобнее написать. Сообщение уже подготовлено: «' + t + '»';
  dlg.showModal ? dlg.showModal() : location.hash = '#contacts';
}));
dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });

/* ---------- почта: собирается только по нажатию ---------- */
const addr = () => ['invoice', '2007'].join('.') + String.fromCharCode(64) + ['mail', 'ru'].join('.');
all('[data-mail]').forEach(el => el.addEventListener('click', () => {
  if (!el.dataset.shown) { el.dataset.shown = '1'; el.textContent = addr(); el.title = 'Нажмите ещё раз, чтобы написать письмо'; return; }
  location.href = 'mailto:' + addr() + '?subject=' + encodeURIComponent('Запрос прайса HOME ROSES') + '&body=' + encodeURIComponent(message() + '\n\nСорта:\nДлина стебля:\nКоличество коробок:\nГород доставки:');
}));

/* ---------- расписание: на среду — до вс 23:00 МСК, на воскресенье — до ср 23:00 МСК ---------- */
const MSK = 3 * 3600e3, DAY = 86400e3;
const today = () => { const m = new Date(Date.now() + MSK); return Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate()); };
const isFly = t => [0, 3].includes(new Date(t).getUTCDay());
const closing = f => f - (new Date(f).getUTCDay() === 3 ? 3 : 4) * DAY + 23 * 3600e3 - MSK;
const openFlights = () => {
  const r = [];
  for (let t = today(); r.length < 2; t += DAY) if (isFly(t) && closing(t) > Date.now()) r.push(t);
  return r;
};
const fmt = (t, o) => new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', ...o }).format(t);
const date = t => fmt(t, { day: 'numeric', month: 'long' });
const full = t => date(t) + ', ' + fmt(t, { weekday: 'short' });
let flights, shownDay;
const dates = () => {
  flights = openFlights(); shownDay = today();
  const [f, n] = flights, close = closing(f) + MSK, a = f + 5 * DAY, b = f + 6 * DAY;
  $('nd').textContent = full(f);
  $('na').textContent = new Date(a).getUTCMonth() === new Date(b).getUTCMonth() ? new Date(a).getUTCDate() + '–' + date(b) : date(a) + ' – ' + date(b);
  $('nn').textContent = full(n);
  $('nc').textContent = date(close) + ', 23:00 МСК';
  $('when').textContent = 'Заявки на рейс ' + date(f) + ' — до ' + date(close) + ', 23:00 МСК';
  $('what').textContent = 'До конца приёма заявок на рейс ' + date(f);
  $('week').innerHTML = Array.from({ length: 7 }, (_, i) => {
    const t = shownDay + i * DAY;
    return `<li class="${isFly(t) ? 'fly' : ''}${i ? '' : ' today'}"><small>${fmt(t, { weekday: 'short' })}</small><b>${new Date(t).getUTCDate()}</b></li>`;
  }).join('');
};
const tick = () => {
  if (Date.now() >= closing(flights[0]) || today() !== shownDay) dates();
  const s = Math.max(0, Math.floor((closing(flights[0]) - Date.now()) / 1000)), p = n => String(n).padStart(2, '0');
  $('td').textContent = Math.floor(s / 86400); $('th').textContent = p(Math.floor(s / 3600) % 24);
  $('tm').textContent = p(Math.floor(s / 60) % 60); $('ts').textContent = p(s % 60);
};
dates(); tick(); setInterval(tick, 1000);

/* ---------- фото склада ---------- */
const photos = '01,06,07,10,12,15,18,20,23,27,29,31,03,08,11,16,21,24,30,34,35,36,40,41'.split(',');
const imgs = hidden => photos.map(n => `<img src="../img/w/p${n}.webp" alt="${hidden ? '' : 'Цветы на складе HOME ROSES'}" loading="lazy">`).join('');
$('reel').innerHTML = imgs(false) + imgs(true);

/* ---------- шапка, меню, нижняя панель ---------- */
const menu = document.querySelector('.menu');
menu.addEventListener('click', e => { if (e.target.closest('a')) menu.open = false; });
document.addEventListener('click', e => { if (!menu.contains(e.target)) menu.open = false; });
const onScroll = () => $('top').classList.toggle('stuck', scrollY > 4);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
// у контактов свои кнопки — панель там не нужна
new IntersectionObserver(([x]) => $('dock').classList.toggle('away', x.isIntersecting), { rootMargin: '0px 0px -35% 0px' }).observe($('contacts'));

$('year').textContent = new Date().getFullYear();
paint();
})();
