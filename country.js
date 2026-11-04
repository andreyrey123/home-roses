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

// colour filter of the variety gallery
(() => {
  const chips = document.querySelectorAll('.chip'), items = document.querySelectorAll('.vr');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.toggle('on', x === c));
    const f = c.dataset.f;
    items.forEach(li => { li.hidden = f !== 'all' && li.dataset.c !== f; });
  }));
})();
