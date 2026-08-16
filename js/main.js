/* =========================================================
   しんのすけ PORTFOLIO — main.js
   ・すべてバニラJS（ライブラリ不要）
   ・動きは「意味のあるところだけ」に絞って実装
   ========================================================= */
(() => {
  'use strict';

  // 端末の設定で「視差効果を減らす」がONなら、派手な動きは全部止める
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- 1. ローディング（幕が上下に開く） ---------- */
  const loader = $('#loader');
  const openCurtain = () => {
    if (!loader) return;
    loader.classList.add('is-done');
    setTimeout(() => {
      loader.classList.add('is-hidden');
      document.body.classList.remove('is-locked');
      startHero();               // ヒーローの文字アニメはここから
    }, 1400);
  };
  document.body.classList.add('is-locked');
  window.addEventListener('load', () => setTimeout(openCurtain, reduced ? 200 : 1500));
  // 読み込みが極端に遅い場合の保険（最大4秒で必ず開ける）
  setTimeout(() => { if (loader && !loader.classList.contains('is-done')) openCurtain(); }, 4000);

  /* ---------- 2. 見出しを1文字ずつに分解（文字が立ち上がる演出用） ---------- */
  $$('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((c, i) => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = c === ' ' ? ' ' : c;
      span.style.transitionDelay = (i * 45) + 'ms';
      el.appendChild(span);
    });
  });

  function startHero() {
    $$('.hero [data-split]').forEach(el => el.classList.add('is-in'));
    $$('.hero [data-reveal]').forEach(el => {
      const d = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('is-in'), d);
    });
  }

  /* ---------- 3. スクロールで要素を出す（IntersectionObserver） ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const d = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('is-in'), d);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  $$('[data-reveal], [data-split]').forEach(el => {
    if (el.closest('.hero')) return;   // ヒーローはローダー明け専用
    io.observe(el);
  });

  /* ---------- 4. 数字のカウントアップ ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const to = parseInt(el.dataset.to, 10);
      const dur = 1400;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);      // ゆっくり止まる動き
        el.textContent = Math.round(to * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('.count').forEach(el => countIO.observe(el));

  /* ---------- 5. スクロール進捗バー／ヘッダー／トップへ戻る ---------- */
  const progress = $('#progress');
  const header   = $('#header');
  const totop    = $('#totop');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (header) header.classList.toggle('is-stuck', y > 80);
    if (totop) totop.classList.toggle('is-show', y > window.innerHeight * 0.9);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- 6. モバイルメニュー ---------- */
  const burger = $('#burger');
  const drawer = $('#drawer');
  if (burger && drawer) {
    const toggle = (open) => {
      burger.classList.toggle('is-open', open);
      drawer.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    };
    burger.addEventListener('click', () => toggle(!drawer.classList.contains('is-open')));
    $$('a', drawer).forEach(a => a.addEventListener('click', () => toggle(false)));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------- 7. カスタムカーソル（PCのみ） ---------- */
  if (!isTouch && !reduced) {
    const cur = $('#cursor');
    const dot = $('#cursorDot');
    const label = $('.cursor__label', cur);
    let mx = 0, my = 0, cx = 0, cy = 0;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      document.body.classList.add('cursor-ready');
    });
    // リングは少し遅れて追従させる（“ぬるっと”感）
    const follow = () => {
      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(follow);
    };
    follow();

    const hoverTargets = 'a, button, [data-cursor], .card, .work, input, textarea, select';
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest(hoverTargets);
      if (!t) return;
      const holder = e.target.closest('[data-cursor]');
      label.textContent = holder ? holder.dataset.cursor : '';
      cur.classList.add('is-hover');
      document.body.classList.add('is-hovering');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        cur.classList.remove('is-hover');
        document.body.classList.remove('is-hovering');
      }
    });
  }

  /* ---------- 8. マグネティックボタン（近づくと吸い付く） ---------- */
  if (!isTouch && !reduced) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + x * 0.24 + 'px,' + y * 0.34 + 'px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 9. ヒーローのポスターをマウスで傾ける ---------- */
  const tilt = $('#heroTilt');
  if (tilt && !isTouch && !reduced) {
    const hero = $('#hero');
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform =
        'perspective(1200px) rotateY(' + (px * 9) + 'deg) rotateX(' + (-py * 9) + 'deg) translateY(' + (-py * 12) + 'px)';
    });
    hero.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
  }

  /* ---------- 10. WORKS：カテゴリで絞り込む ---------- */
  const filters = $('#filters');
  const gallery = $('#gallery');
  if (filters && gallery) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      const cat = btn.dataset.filter;

      $$('.filter', filters).forEach(b => b.classList.toggle('is-active', b === btn));

      $$('.work', gallery).forEach(card => {
        const hit = (cat === 'all' || card.dataset.cat === cat);
        if (hit) {
          card.classList.remove('is-hidden');
          // 一度隠してから出すことで、切り替えがふわっと見える
          card.classList.add('is-fading');
          requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-fading')));
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  }

  /* ---------- 11. お問い合わせフォーム ---------- */
  /*  送信先（Google Apps ScriptのウェブアプリURL）。
      ここが空のあいだは、これまで通りメールソフトが開くだけの動作になります。 */
  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzJqy9MyCW1i-5evu203StnvaI_TRz9FVA9zfWrBH8xCItubDVh-1L7WzWHQwKV-dj5/exec';

  const form = $('#cform');
  const statusEl = $('#cformStatus');

  // 送信先が未設定のあいだは、案内文を実際の動作に合わせておく
  if (!FORM_ENDPOINT) {
    const note = $('.cform__note');
    if (note) note.textContent = '送信ボタンを押すと、内容が入力されたメール作成画面が開きます。';
  }

  const setStatus = (msg, type) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'cform__status' + (type ? ' is-' + type : '');
  };

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const get = (n) => form.elements[n].value.trim();

      // 入力チェック
      let ok = true;
      ['name', 'email', 'body'].forEach(n => {
        const f = form.elements[n];
        const bad = !f.value.trim() || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        f.classList.toggle('is-error', bad);
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) { setStatus('未入力の項目があります。ご確認ください。', 'error'); return; }

      // 迷惑送信よけ（人には見えない欄。埋まっていたら送信しない）
      if (form.elements['company'] && form.elements['company'].value) return;

      const btn = $('button[type="submit"]', form);

      // 送信先が未設定のときは、これまで通りメールソフトを開く
      if (!FORM_ENDPOINT) {
        const subject = '【お問い合わせ】' + get('type') + ' / ' + get('name') + ' 様';
        const lines = [
          'お名前：' + get('name'),
          'メール：' + get('email'),
          'ご相談の種類：' + get('type'),
          '', '【ご相談内容】', get('body'),
          '', '---', 'しんのすけ ポートフォリオサイトより送信'
        ];
        window.location.href = 'mailto:taishinillustration8686@gmail.com'
          + '?subject=' + encodeURIComponent(subject)
          + '&body=' + encodeURIComponent(lines.join('\n'));
        return;
      }

      btn.disabled = true;
      setStatus('送信しています…', 'sending');

      try {
        const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form) });
        const data = await res.json().catch(() => ({ ok: res.ok }));
        if (!data.ok) throw new Error(data.error || '送信に失敗しました');

        form.reset();
        setStatus('送信しました。ご入力のアドレスに控えをお送りしています。24時間以内にご返信します。', 'done');
      } catch (err) {
        // 送信できなかったときも、メールソフト経由で連絡できる道を残す
        setStatus('送信できませんでした。お手数ですが taishinillustration8686@gmail.com まで直接ご連絡ください。', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- 12. 作品の拡大表示（ライトボックス） ---------- */
  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('#lightboxImg');
    const lbCap = $('#lightboxCap');
    let lastFocus = null;

    const openLb = (src, cap) => {
      lastFocus = document.activeElement;
      lbImg.src = src;
      lbImg.alt = cap || '';
      lbCap.textContent = cap || '';
      lb.classList.add('is-open');
      document.body.classList.add('is-locked');
      $('#lightboxClose').focus();
    };
    const closeLb = () => {
      lb.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      setTimeout(() => { lbImg.removeAttribute('src'); }, 450);
      if (lastFocus) lastFocus.focus();
    };

    $$('.work[data-lightbox]').forEach(el => {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      const fire = () => openLb(el.dataset.lightbox, el.dataset.caption);
      el.addEventListener('click', fire);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
      });
    });

    $('#lightboxClose').addEventListener('click', closeLb);
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lightbox__fig') === null) closeLb(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLb(); });
  }

  /* ---------- 13. ページ内リンクをなめらかに（固定ヘッダー分を差し引く） ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = window.scrollY + target.getBoundingClientRect().top - 10;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

})();
