(function () {
  'use strict';
  const C = window.Chart, T = window.Tools, $ = id => document.getElementById(id);
  const yen = n => Math.round(n).toLocaleString('ja-JP');

  /* ---------- STEP1 単利と複利 ---------- */
  function drawCI() {
    const cap = +$('cap').value, rate = +$('rate').value / 100, yrs = +$('yrs').value;
    $('capV').textContent = cap.toLocaleString('ja-JP');
    $('rateV').textContent = rate * 100 % 1 === 0 ? (rate * 100).toFixed(1) : (rate * 100).toFixed(1);
    $('yrsV').textContent = yrs;
    const sim = [], com = [], labels = [];
    for (let y = 0; y <= yrs; y++) {
      sim.push(cap * (1 + rate * y));
      com.push(cap * Math.pow(1 + rate, y));
      labels.push(yrs <= 15 || y % Math.ceil(yrs / 10) === 0 ? y + '年' : '');
    }
    C.line($('ciChart'), { W: 460, H: 320, labels,
      series: [{ name: '単利', values: sim, color: '#858a92' }, { name: '複利', values: com, color: '#123a6b' }],
      unit: '円', yMin: 0 });
    const s = sim[yrs], c = com[yrs];
    $('mSimple').textContent = yen(s);
    $('mComp').textContent = yen(c);
    $('mGap').textContent = yen(c - s);
    const n = $('ciNote');
    n.className = (c - s) / cap > 0.1 ? 'note ok' : 'note info';
    n.innerHTML = yrs + '年後、複利のほうが <strong>' + yen(c - s) + '円</strong> 多くなります（元金の ' +
      ((c - s) / cap * 100).toFixed(1) + '％）。' +
      (yrs < 5 ? '期間が短いうちは差がわずかです。<strong>年数を増やしてみてください。</strong>'
               : '複利は<strong>期間が長いほど差が大きく</strong>なります。利息にも利息がつくからです。');
    $('ciTools').innerHTML = '';
    $('ciTools').appendChild(T.saveButton(() => $('ciChart').querySelector('svg'), '単利と複利'));
  }

  /* ---------- STEP2 返済表 ---------- */
  const P0 = 100000, RATE = 0.03, PAY = 5000;
  const MR = RATE / 12;
  let rows = [], month = 0;

  function buildAll() {
    rows = [];
    let bal = P0;
    // 0か月目：利息なしで返済する
    bal = bal - PAY;
    rows.push({ m: 0, before: P0, interest: 0, pay: PAY, after: bal });
    let guard = 0;
    while (bal > 0 && guard++ < 600) {
      const it = bal * MR;
      const pay = Math.min(PAY, bal + it);
      const after = bal + it - pay;
      rows.push({ m: rows.length, before: bal, interest: it, pay: pay, after: after });
      bal = after;
    }
  }
  function drawLoan() {
    const shown = rows.slice(0, month + 1);
    let h = '<thead><tr><th>月</th><th>月初の残高</th><th>利息</th><th>返済額</th><th>返済後の残高</th></tr></thead><tbody>';
    shown.forEach(r => {
      h += '<tr class="' + (r.m === month ? 'now' : '') + '"><td>' + r.m + '</td><td>' + yen(r.before) +
        '</td><td>' + (r.interest ? yen(r.interest) : '—') + '</td><td>' + yen(r.pay) + '</td><td>' + yen(r.after) + '</td></tr>';
    });
    $('loanTable').innerHTML = h + '</tbody>';
    const cur = rows[month];
    $('monthBadge').textContent = month + ' / ' + (rows.length - 1) + ' か月目';
    $('nextMonth').disabled = month >= rows.length - 1;
    if (month === 0) {
      $('stepBox').innerHTML = '<strong>0か月目</strong><br>' +
        '残高 <span class="hl">100,000円</span> から 5,000円 を返済<br>' +
        '→ 1か月目の借入残高は <span class="hl">' + yen(cur.after) + '円</span>';
    } else {
      $('stepBox').innerHTML = '<strong>' + month + 'か月目</strong><br>' +
        '利息 ＝ ' + yen(cur.before) + ' × 0.0025 ＝ <span class="hl">' + cur.interest.toFixed(2) + '円</span><br>' +
        '残高 ＝ ' + yen(cur.before) + ' ＋ ' + cur.interest.toFixed(2) + ' − ' + yen(cur.pay) +
        ' ＝ <span class="hl">' + yen(cur.after) + '円</span><br>' +
        '<span style="font-size:.84rem;color:var(--ink-2);font-family:var(--font)">今回の返済のうち、元金にあてられたのは ' +
        yen(cur.pay - cur.interest) + '円 です。</span>';
    }
    const totalInt = shown.reduce((a, r) => a + r.interest, 0);
    const totalPay = shown.reduce((a, r) => a + r.pay, 0);
    $('mCount').textContent = shown.length;
    $('mInt').textContent = yen(totalInt);
    $('mTotal').textContent = yen(totalPay);
    C.line($('loanChart'), { W: 700, H: 300,
      labels: rows.map((r, i) => (i % 3 === 0 ? r.m + '' : '')),
      series: [{ name: '借入残高', values: rows.map(r => r.after), color: '#123a6b' }],
      unit: '円', yMin: 0 });
    const n = $('loanNote');
    if (month >= rows.length - 1) {
      const ti = rows.reduce((a, r) => a + r.interest, 0);
      n.className = 'note ok';
      n.innerHTML = '<strong>完済しました。</strong>返済回数 ' + rows.length + ' 回、支払った利息の合計は <strong>' +
        yen(ti) + '円</strong>、総返済額は <strong>' + yen(rows.reduce((a, r) => a + r.pay, 0)) + '円</strong>。<br>' +
        '残高の減り方をよく見てください。最初は利息の分だけ減りが小さく、<strong>後になるほど減り方が大きく</strong>なっています。' +
        '残高が減ると利息も減り、その分だけ元金にあてられるお金が増えるからです。';
    } else {
      const d1 = rows[1] ? rows[0].after - rows[1].after : 0;
      const dl = rows[rows.length - 1] ? rows[rows.length - 2].after - rows[rows.length - 1].after : 0;
      n.className = 'note info';
      n.innerHTML = '「次の月へ」を押して進めてください。1か月あたりの残高の減り方は、はじめ約 ' + yen(d1) +
        '円、終わりごろは約 ' + yen(dl) + '円。<strong>だんだん大きくなります。</strong>';
    }
  }

  /* ---------- STEP3 条件を変える ---------- */
  function simulate(cap, annual, pay) {
    const mr = annual / 12;
    let bal = cap - pay, n = 1, ti = 0, tp = pay, guard = 0;
    const series = [cap, bal];
    if (pay <= cap * mr) return { ok: false };
    while (bal > 0 && guard++ < 1200) {
      const it = bal * mr;
      const p = Math.min(pay, bal + it);
      bal = bal + it - p;
      ti += it; tp += p; n++;
      series.push(bal);
    }
    return { ok: true, n, ti, tp, series };
  }
  function drawSim() {
    const cap = +$('loanCap').value, annual = +$('loanRate').value / 100, pay = +$('loanPay').value;
    $('loanCapV').textContent = cap.toLocaleString('ja-JP');
    $('loanRateV').textContent = (annual * 100).toFixed(1);
    $('loanPayV').textContent = pay.toLocaleString('ja-JP');
    const r = simulate(cap, annual, pay);
    const n = $('simNote');
    if (!r.ok) {
      ['sCount', 'sInt', 'sTotal', 'sRatio'].forEach(i => $(i).textContent = '—');
      $('simChart').innerHTML = '';
      n.className = 'note ng';
      n.innerHTML = '<strong>この条件では一生返し終わりません。</strong>毎月の返済額が、毎月ついてくる利息（約 ' +
        yen(cap * annual / 12) + '円）以下だからです。返済額を増やしてください。';
      return;
    }
    $('sCount').textContent = r.n;
    $('sInt').textContent = yen(r.ti);
    $('sTotal').textContent = yen(r.tp);
    $('sRatio').textContent = (r.tp / cap * 100).toFixed(1);
    C.line($('simChart'), { W: 700, H: 300,
      labels: r.series.map((_, i) => (i % Math.max(1, Math.ceil(r.series.length / 14)) === 0 ? i + '' : '')),
      series: [{ name: '借入残高', values: r.series, color: '#123a6b' }], unit: '円', yMin: 0 });
    const base = simulate(cap, annual, pay + 1000);
    n.className = r.ti / cap > .2 ? 'note warn' : 'note ok';
    n.innerHTML = '返済に <strong>' + r.n + 'か月（約' + (r.n / 12).toFixed(1) + '年）</strong>、' +
      '利息だけで <strong>' + yen(r.ti) + '円</strong> 払います（借りた額の ' + (r.ti / cap * 100).toFixed(1) + '％）。' +
      (base.ok ? '<br>毎月あと1,000円多く返すと、回数は <strong>' + base.n + 'か月</strong>（' + (r.n - base.n) +
        'か月短縮）、利息は <strong>' + yen(base.ti) + '円</strong>（' + yen(r.ti - base.ti) + '円節約）になります。' : '');
    $('simTools').innerHTML = '';
    $('simTools').appendChild(T.saveButton(() => $('simChart').querySelector('svg'), '借入残高の推移'));
    const sh = document.createElement('button');
    sh.className = 'btn sm ghost'; sh.textContent = 'この条件のURLを作る';
    sh.addEventListener('click', () => T.share({ c: cap, r: $('loanRate').value, p: pay }, sh));
    $('simTools').appendChild(sh);
    const pr = document.createElement('button');
    pr.className = 'btn sm ghost'; pr.textContent = '印刷する';
    pr.addEventListener('click', T.printPage);
    $('simTools').appendChild(pr);
  }

  /* ---------- STEP4 クイズ ---------- */
  const QUIZ = [
    { t: '100,000円を年利3.0％で借り、初月に5,000円返済した。1か月目の借入残高はいくらか。',
      choices: ['95,000円', '94,762円', '95,250円', '95,238円'], a: '95,000円',
      why: '初月の返済には利息がつきません。100,000 − 5,000 ＝ 95,000円です。利息は次の月から、この残高にかかります。' },
    { t: '年利3.0％のとき、1か月あたりの利率（月利）はいくらか。',
      choices: ['0.0025', '0.030', '0.0025の2乗', '0.030の2乗'], a: '0.0025',
      why: '年利を12か月で割ります。0.030 ÷ 12 ＝ 0.0025（0.25％）です。' },
    { t: '毎月の返済額が一定のとき、借入残高の減り方はどうなるか。',
      choices: ['月を追うごとに減り方が少しずつ大きくなる', '毎月一定である',
                '月を追うごとに減り方がだんだん小さくなる', '返済総額と借入残高の差は変わらない'],
      a: '月を追うごとに減り方が少しずつ大きくなる',
      why: '残高が減ると利息も減ります。返済額は一定なので、<strong>元金にあてられる分が毎月増えていく</strong>ためです。' },
    { t: '単利と複利で、差がいちばん大きくなるのはどんなときか。',
      choices: ['期間が長いとき', '期間が短いとき', '元金が小さいとき', '利率が0％のとき'], a: '期間が長いとき',
      why: '複利は利息にも利息がつくので、期間が長いほど差が広がります。1年目はどちらも同じ額です。' },
    { t: '毎月の返済額を増やすと、支払う利息の合計はどうなるか。',
      choices: ['減る', '増える', '変わらない', '返済回数によっては増える'], a: '減る',
      why: '早く元金が減るので、利息がかかる期間も金額も小さくなります。返済回数も減ります。' },
    { t: '毎月の返済額が、毎月つく利息より少ないとどうなるか。',
      choices: ['残高が減らず、いつまでも返し終わらない', '利息が免除される',
                '自動的に返済額が増える', '残高がゆっくり減っていく'], a: '残高が減らず、いつまでも返し終わらない',
      why: '返した額より増える利息のほうが大きいので、残高はむしろ増えていきます。STEP 3 で返済額を小さくすると確かめられます。' }
  ];
  let qList = [], qi = 0, qScore = 0;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startQuiz() { qList = shuffle(QUIZ); qi = 0; qScore = 0; renderQ(); }
  function renderQ() {
    if (qi >= qList.length) {
      $('qText').textContent = qScore + ' / ' + qList.length + ' 問正解';
      $('qChoices').innerHTML = ''; $('qFb').hidden = true; $('qNext').disabled = true;
      $('qProgress').textContent = qList.length + ' / ' + qList.length; return;
    }
    const it = qList[qi];
    $('qProgress').textContent = (qi + 1) + ' / ' + qList.length;
    $('qScore').textContent = qScore;
    $('qText').textContent = it.t;
    const box = $('qChoices'); box.className = 'choice4'; box.innerHTML = '';
    shuffle(it.choices).forEach(c => {
      const b = document.createElement('button');
      b.className = 'btn'; b.textContent = c; b.dataset.c = c;
      b.addEventListener('click', () => answerQ(c));
      box.appendChild(b);
    });
    $('qFb').hidden = true; $('qNext').disabled = true;
    $('qNext').textContent = (qi === qList.length - 1) ? '結果を見る' : '次の問題';
  }
  function answerQ(c) {
    const it = qList[qi], ok = c === it.a, box = $('qChoices');
    box.classList.add('locked');
    [...box.children].forEach(b => {
      if (b.dataset.c === it.a) b.classList.add('correct');
      else if (b.dataset.c === c) b.classList.add('wrong');
    });
    if (ok) qScore++;
    const fb = $('qFb');
    fb.className = 'note ' + (ok ? 'ok' : 'ng');
    fb.innerHTML = (ok ? '正解。' : '正解は「<strong>' + it.a + '</strong>」。') + it.why;
    fb.hidden = false;
    $('qScore').textContent = qScore; $('qNext').disabled = false;
  }

  function init() {
    ['cap', 'rate', 'yrs'].forEach(i => $(i).addEventListener('input', drawCI));
    $('nextMonth').addEventListener('click', () => { if (month < rows.length - 1) { month++; drawLoan(); } });
    $('allMonths').addEventListener('click', () => { month = rows.length - 1; drawLoan(); });
    $('resetLoan').addEventListener('click', () => { month = 0; drawLoan(); });
    ['loanCap', 'loanRate', 'loanPay'].forEach(i => $(i).addEventListener('input', drawSim));
    $('qNext').addEventListener('click', () => { qi++; renderQ(); });
    $('qReset').addEventListener('click', startQuiz);
    const shared = T.readShared();
    if (shared) {
      if (shared.c) $('loanCap').value = shared.c;
      if (shared.r) $('loanRate').value = shared.r;
      if (shared.p) $('loanPay').value = shared.p;
    }
    window.Terms.glossary($('glossBox'), ['単利', '複利', 'シミュレーション', '確定的モデル', 'パラメータ', '数式モデル']);
    buildAll(); month = 0;
    drawCI(); drawLoan(); drawSim(); startQuiz();
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
