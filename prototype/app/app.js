/* Mochi AI · кликабельный прототип экранов. Данные примерные, сервера нет. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const STYLES = [
    { k: 'loud', n: 'Громко' }, { k: 'quiet', n: 'Тихо' }, { k: 'mark', n: 'Маркер' },
    { k: 'outline', n: 'Контур' }, { k: 'box', n: 'Рамка' }, { k: 'stack', n: 'Блок' }
  ];
  const state = {
    style: 'loud', scale: 1, pos: 'bottom', color: '--color-accent', frame: '1',
    format: '9x16', step: 1, left: 4, total: 5,
    files: [{ name: 'дубль-1.mp4', sec: 70 }, { name: 'дубль-2.mp4', sec: 55 }, { name: 'дубль-3.mp4', sec: 75 }]
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  function cap(k, text) {
    const w = esc(text).split(' ');
    const head = w.slice(0, 2).join(' '), rest = w.slice(2).join(' ');
    if (k === 'loud') return `<span class="cap cap--loud">${w.map((x, i) => i === 1 ? `<b>${x}</b>` : x).join(' ')}</span>`;
    if (k === 'mark') return `<span class="cap cap--mark"><span>${head}</span> ${rest}</span>`;
    if (k === 'stack') return `<span class="cap cap--stack"><i>${head}</i><span>${rest}</span></span>`;
    return `<span class="cap cap--${k}">${w.join(' ')}</span>`;
  }
  function applyVid(el) {
    el.style.setProperty('--cap-scale', state.scale);
    el.style.setProperty('--cap-accent', `var(${state.color})`);
    el.dataset.pos = state.pos;
    el.classList.toggle('vid--wide', state.format === '16x9');
  }
  function toast(t) {
    const el = $('#toast'); el.textContent = t; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2200);
  }
  function modal(html) {
    const m = $('#modal'); $('#modal-card').innerHTML = html; m.hidden = false;
    const f = $('#modal-card').querySelector('button, input'); if (f) f.focus();
  }
  const closeModal = () => ($('#modal').hidden = true);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  const ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-7"/></svg>',
    ring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ---------- Роутер ---------- */
  const ROUTES = ['auth', 'projects', 'new', 'proc', 'editor', 'pricing'];
  const SHELL = ['projects', 'new', 'proc', 'pricing'];
  let procTimer = null;
  function route() {
    let r = location.hash.replace('#', '');
    if (!ROUTES.includes(r)) r = 'auth';
    $$('.screen').forEach(s => s.classList.toggle('is-on', s.id === 'screen-' + r));
    $('#shell').hidden = $('#tabbar').hidden = !SHELL.includes(r);
    $$('[data-nav]').forEach(a => a.toggleAttribute('aria-current', a.dataset.nav === r) || (a.dataset.nav !== r && a.removeAttribute('aria-current')));
    $$('[data-nav]').forEach(a => { if (a.dataset.nav === r) a.setAttribute('aria-current', 'page'); });
    if (r !== 'proc') clearTimeout(procTimer);
    if (r === 'new') goStep(1);
    if (r === 'proc') startProc();
    if (r === 'editor') initEditor();
    closeModal(); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- Вход ---------- */
  let signup = false;
  $('#auth-toggle').addEventListener('click', () => {
    signup = !signup;
    $('#auth-title').textContent = signup ? 'Создать аккаунт' : 'Войти';
    $('#auth-btn').textContent = signup ? 'Зарегистрироваться' : 'Войти';
    $('#auth-name-f').hidden = !signup;
    $('#auth-switch').firstChild.textContent = signup ? 'Уже есть аккаунт? ' : 'Нет аккаунта? ';
    $('#auth-toggle').textContent = signup ? 'Войти' : 'Зарегистрироваться';
  });
  $('#auth-form').addEventListener('submit', e => { e.preventDefault(); location.hash = '#projects'; });

  /* ---------- Проекты ---------- */
  function renderUsage() {
    $$('[data-left]').forEach(e => (e.textContent = state.left));
    $$('[data-left-bar]').forEach(e => (e.style.width = (state.left / state.total * 100) + '%'));
  }
  const PROJECTS = [
    { t: 'Мой первый ролик', s: 'Готов', c: 'ok', d: 'сегодня', k: 'loud', x: 'Всем привет' },
    { t: 'Разбор книги', s: 'Готов', c: 'ok', d: 'вчера', k: 'mark', x: 'Три главные мысли' },
    { t: 'Влог из поездки', s: 'Черновик', c: '', d: '3 дня назад', k: 'quiet', x: 'Начнём с вокзала' }
  ];
  function renderProjects() {
    $('#projects-list').innerHTML = `<li><a class="new-tile" href="#new"><span>+</span>Новый ролик</a></li>` + PROJECTS.map((p, i) =>
      `<li><a class="project" href="#editor"><div class="vid" data-frame="${i % 3 + 1}">${cap(p.k, p.x)}</div><div class="project__title">${esc(p.t)}</div><div class="project__meta"><span class="pill ${p.c ? 'pill--' + p.c : ''}">${p.s}</span><span>${p.d}</span></div></a></li>`).join('');
  }

  /* ---------- Мастер ---------- */
  function renderStyles() {
    $('#styles').innerHTML = STYLES.map(s => `<label class="style-opt"><input type="radio" name="style" value="${s.k}"${s.k === state.style ? ' checked' : ''}><div class="vid">${cap(s.k, 'Это уже в кадре')}</div><span class="style-opt__name">${s.n}</span></label>`).join('');
  }
  $('#styles').addEventListener('change', e => { state.style = e.target.value; });
  $('#blogger-btn').addEventListener('click', () => {
    const f = $('#found'); f.hidden = false;
    f.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span> Смотрю видео блогера…';
    setTimeout(() => {
      state.style = 'mark'; renderStyles();
      f.innerHTML = 'Нашла стиль: «Маркер», быстрый темп. Выбрала его для тебя.';
    }, 1400);
  });
  function renderPreview() {
    const v = $('#pv'); v.dataset.frame = state.frame; applyVid(v);
    $('#pv-cap').innerHTML = cap(state.style, 'Всем привет, это Mochi');
  }
  $('#pane-2').addEventListener('change', e => {
    const n = e.target.name, v = e.target.value;
    if (n === 'frame') state.frame = v; if (n === 'size') state.scale = +v;
    if (n === 'pos') state.pos = v; if (n === 'color') state.color = v;
    renderPreview();
  });
  function total() { return state.files.reduce((a, f) => a + f.sec, 0); }
  function renderFiles() {
    $('#files').innerHTML = state.files.map((f, i) =>
      `<li class="file"><span class="file__n">${i + 1}</span><span class="file__name">${esc(f.name)}</span><span class="file__len num">${fmt(f.sec)}</span><span class="file__act">
        <button type="button" data-a="up" data-i="${i}" aria-label="Выше"${i === 0 ? ' disabled' : ''}>${ICON.up}</button>
        <button type="button" data-a="down" data-i="${i}" aria-label="Ниже"${i === state.files.length - 1 ? ' disabled' : ''}>${ICON.down}</button>
        <button type="button" data-a="del" data-i="${i}" aria-label="Убрать файл">${ICON.x}</button></span></li>`).join('');
    const t = total(), over = t > 300;
    $('#meter-t').textContent = fmt(t); $('#meter-b').style.width = Math.min(100, t / 3) + '%';
    $('#meter').classList.toggle('is-over', over); $('#meter-w').hidden = !over;
    $('#wiz-next').disabled = state.step === 3 && (!state.files.length || over);
  }
  $('#files').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const i = +b.dataset.i, a = b.dataset.a, f = state.files;
    if (a === 'del') f.splice(i, 1);
    if (a === 'up' && i > 0) [f[i - 1], f[i]] = [f[i], f[i - 1]];
    if (a === 'down' && i < f.length - 1) [f[i + 1], f[i]] = [f[i], f[i + 1]];
    renderFiles();
  });
  function addFiles(list) {
    [...list].forEach(file => state.files.push({ name: file.name, sec: 30 + (file.name.length * 7) % 50 }));
    renderFiles();
  }
  $('#file-in').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
  const drop = $('#drop');
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', e => { e.preventDefault(); addFiles(e.dataTransfer.files); });
  $('#seg-format').addEventListener('change', e => { state.format = e.target.value; });
  function goStep(n) {
    state.step = n;
    $$('.step-pane').forEach((p, i) => p.classList.toggle('is-on', i + 1 === n));
    $$('#wiz-steps li').forEach((li, i) => { li.toggleAttribute('aria-current', false); li.removeAttribute('aria-current'); li.classList.toggle('is-done', i + 1 < n); if (i + 1 === n) li.setAttribute('aria-current', 'step'); });
    $('#wiz-back').hidden = false;
    $('#wiz-next').textContent = n === 3 ? 'Монтировать' : 'Дальше';
    if (n === 1) renderStyles();
    if (n === 2) renderPreview();
    renderFiles();
  }
  $('#wiz-back').addEventListener('click', () => (state.step === 1 ? (location.hash = '#projects') : goStep(state.step - 1)));
  $('#wiz-next').addEventListener('click', () => (state.step === 3 ? (location.hash = '#proc') : goStep(state.step + 1)));

  /* ---------- Обработка ---------- */
  const PROC = ['Слушаю речь', 'Режу паузы и оговорки', 'Ставлю субтитры', 'Собираю ролик в твоём стиле'];
  function startProc() {
    const v = $('#proc-vid'); applyVid(v); v.dataset.pos = 'bottom';
    $('#proc-cap').innerHTML = cap(state.style, 'Всем привет, это Mochi');
    let i = 0;
    const draw = () => {
      $('#proc-steps').innerHTML = PROC.map((p, k) => k < i
        ? `<li class="step step--done">${ICON.check}<span>${p}</span></li>`
        : k === i ? `<li class="step"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${p}</span></li>`
        : `<li class="step step--todo">${ICON.ring}<span>${p}</span></li>`).join('');
      $('#proc-bar').style.width = (i / PROC.length * 100 + 6) + '%';
    };
    draw();
    const tick = () => { i++; if (i >= PROC.length) { state.left = Math.max(0, state.left); location.hash = '#editor'; return; } draw(); procTimer = setTimeout(tick, 1500); };
    procTimer = setTimeout(tick, 1500);
  }
  $('#proc-cancel').addEventListener('click', () => (location.hash = '#projects'));

  /* ---------- Редактор ---------- */
  const E = { t: 0, play: null, lines: [], clips: [], sel: null, uid: 0 };
  const LINES = [
    ['Всем привет, это Mochi', 0], ['Сегодня расскажу про монтаж', 4], ['Это проще, чем кажется', 8],
    ['Берёшь видео и загружаешь', 12], ['Выбираешь стиль субтитров', 16], ['И забираешь готовый ролик', 20]
  ];
  const DUR = 24, LOW = 1;
  function initEditor() {
    if (!E.lines.length) {
      E.lines = LINES.map(l => ({ text: l[0], at: l[1] }));
      E.clips = [{ id: ++E.uid, n: 'дубль-1', w: 3 }, { id: ++E.uid, n: 'пауза', w: 0.5, pause: true }, { id: ++E.uid, n: 'дубль-2', w: 2 }, { id: ++E.uid, n: 'дубль-3', w: 3 }];
      $('#chat').innerHTML = '<p class="bubble bubble--ai">Готово. Посмотри ролик и скажи, что поправить.</p>';
    }
    renderLines(); renderLanes(); setTime(E.t);
  }
  function renderLines() {
    $('#lines').innerHTML = E.lines.map((l, i) => `<li class="line${i === LOW ? ' is-low' : ''}" data-i="${i}"><time>${fmt(l.at)}</time><input value="${esc(l.text)}" aria-label="Субтитр ${i + 1}"></li>`).join('');
  }
  function renderLanes() {
    $('#lane-v').innerHTML = E.clips.map(c => `<button type="button" class="clip${c.pause ? ' clip--pause' : ''}${E.sel === c.id ? ' is-sel' : ''}" data-id="${c.id}" style="flex:${c.w}">${esc(c.n)}</button>`).join('') + '<span class="playhead" id="ph"></span>';
    $('#lane-s').innerHTML = E.lines.map((l, i) => `<span class="clip" style="flex:1;cursor:default">${i + 1}</span>`).join('');
    movePh();
  }
  function activeLine() { let a = 0; E.lines.forEach((l, i) => { if (E.t >= l.at) a = i; }); return a; }
  function movePh() { const p = $('#ph'); if (p) p.style.left = (E.t / DUR * 100) + '%'; }
  function setTime(t) {
    E.t = Math.max(0, Math.min(DUR, t));
    $('#scrub').value = E.t; $('#time').textContent = fmt(E.t) + ' / ' + fmt(DUR);
    const a = activeLine();
    $$('#lines .line').forEach((li, i) => li.classList.toggle('is-on', i === a));
    const v = $('#ed-vid'); applyVid(v);
    $('#ed-cap').innerHTML = cap(state.style, E.lines[a].text);
    movePh();
  }
  $('#scrub').addEventListener('input', e => setTime(+e.target.value));
  $('#play').addEventListener('click', () => {
    if (E.play) { clearInterval(E.play); E.play = null; $('#play').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'; return; }
    $('#play').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
    E.play = setInterval(() => { if (E.t >= DUR) { setTime(0); } setTime(E.t + 0.1); }, 100);
  });
  window.addEventListener('hashchange', () => { if (E.play) { clearInterval(E.play); E.play = null; } });
  $('#lines').addEventListener('click', e => { const li = e.target.closest('.line'); if (li) setTime(E.lines[+li.dataset.i].at); });
  $('#lines').addEventListener('input', e => {
    const li = e.target.closest('.line'); if (!li) return;
    E.lines[+li.dataset.i].text = e.target.value;
    if (+li.dataset.i === activeLine()) $('#ed-cap').innerHTML = cap(state.style, e.target.value || ' ');
    if (+li.dataset.i === LOW) li.classList.remove('is-low');
  });
  $('#lane-v').addEventListener('click', e => { const b = e.target.closest('.clip'); if (!b) return; E.sel = +b.dataset.id; renderLanes(); });
  $('#tl-split').addEventListener('click', () => {
    const i = E.clips.findIndex(c => c.id === E.sel);
    if (i < 0 || E.clips[i].pause) return toast('Выбери фрагмент видео');
    const c = E.clips[i], h = c.w / 2;
    E.clips.splice(i, 1, { id: ++E.uid, n: c.n + ' · а', w: h }, { id: ++E.uid, n: c.n + ' · б', w: h });
    E.sel = null; renderLanes(); toast('Фрагмент разрезан');
  });
  $('#tl-del').addEventListener('click', () => {
    const i = E.clips.findIndex(c => c.id === E.sel);
    if (i < 0) return toast('Выбери фрагмент');
    E.clips.splice(i, 1); E.sel = null; renderLanes(); toast('Фрагмент удалён');
  });
  function say(text, who) { const c = $('#chat'); c.insertAdjacentHTML('beforeend', `<p class="bubble bubble--${who}">${esc(text)}</p>`); c.scrollTop = c.scrollHeight; }
  function ask(text) {
    text = text.trim(); if (!text) return;
    say(text, 'you');
    setTimeout(() => {
      const t = text.toLowerCase(); let r = 'Принято, перемонтирую и покажу результат.';
      if (/крупн|больш/.test(t)) { state.scale = 1.3; r = 'Готово, субтитры стали крупнее.'; }
      else if (/мельч|меньш|поменьше/.test(t)) { state.scale = 0.8; r = 'Готово, субтитры стали меньше.'; }
      else if (/пауз/.test(t)) { const had = E.clips.some(c => c.pause); E.clips = E.clips.filter(c => !c.pause); renderLanes(); r = had ? 'Паузу вырезала.' : 'Пауз больше не нашла.'; }
      else if (/стил/.test(t)) { const i = STYLES.findIndex(s => s.k === state.style); state.style = STYLES[(i + 1) % STYLES.length].k; r = 'Поменяла стиль на «' + STYLES[(i + 1) % STYLES.length].n + '».'; }
      say(r, 'ai'); setTime(E.t);
    }, 700);
  }
  $('#ask').addEventListener('submit', e => { e.preventDefault(); const i = $('#ask-in'); ask(i.value); i.value = ''; });
  $('.edr__chat .chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) ask(b.textContent); });

  $('#ed-export').addEventListener('click', () => {
    modal(`<h2 id="modal-title">Экспорт ролика</h2>
      <fieldset class="field"><legend class="label">Качество</legend><div class="seg"><label><input type="radio" name="q" checked><span>1080p</span></label><label><input type="radio" name="q"><span>720p</span></label></div></fieldset>
      <p class="muted">Спишется 1 ролик. Останется ${state.left - 1} из ${state.total}.</p>
      <div class="modal__row"><button class="btn btn--ghost" type="button" data-close>Отмена</button><button class="btn btn--primary" type="button" id="do-export">Экспортировать</button></div>`);
    $('#do-export').addEventListener('click', () => {
      $('#modal-card').innerHTML = `<h2 id="modal-title">Готово</h2><p class="done">${ICON.check} Ролик собран</p><p class="muted">В реальном продукте здесь начнётся скачивание файла.</p><div class="modal__row"><button class="btn btn--ghost" type="button" data-close>Закрыть</button><button class="btn btn--primary" type="button" id="dl">Скачать</button></div>`;
      state.left = Math.max(0, state.left - 1); renderUsage();
      $('#dl').addEventListener('click', () => { closeModal(); toast('Скачивание начнётся здесь'); });
    });
  });

  /* ---------- Тарифы ---------- */
  const PLANS = [
    { n: 'Пробный', k: '1 ролик', p: 'бесплатно', note: 'Попробовать на своём видео' },
    { n: 'Старт', k: '5 роликов', p: '— ₽ в месяц', cur: true },
    { n: 'Блогер', k: '20 роликов', p: '— ₽ в месяц', pick: true, note: 'Для регулярного блога' },
    { n: 'Про', k: '50 роликов', p: '— ₽ в месяц' }
  ];
  $('#plans').innerHTML = PLANS.map((p, i) => `<li class="plan${p.pick ? ' plan--pick' : ''}"><span class="plan__name">${p.n}${p.cur ? '<small>Твой тариф</small>' : p.note ? '<small>' + p.note + '</small>' : ''}</span><span class="plan__n">${p.k}</span><span class="plan__price">${p.p}</span><button class="btn ${p.pick ? 'btn--primary' : 'btn--ghost'}" type="button" data-plan="${i}"${p.cur ? ' disabled' : ''}>${p.cur ? 'Активен' : 'Выбрать'}</button></li>`).join('');
  $('#plans').addEventListener('click', e => {
    const b = e.target.closest('[data-plan]'); if (!b) return;
    const p = PLANS[+b.dataset.plan];
    modal(`<h2 id="modal-title">Тариф «${p.n}»</h2><p class="muted">${p.k} в месяц. Цена будет утверждена перед запуском.</p><p class="muted">Здесь откроется оплата картой через российский эквайринг.</p><div class="modal__row"><button class="btn btn--ghost" type="button" data-close>Отмена</button><button class="btn btn--primary" type="button" data-close>Перейти к оплате</button></div>`);
  });

  renderProjects(); renderUsage(); renderFiles();
  if (!location.hash) location.hash = '#auth'; else route();
  route();
})();
