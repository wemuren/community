import React, { useRef, useState, useEffect } from 'react';
import '../assets/styles/landing.css';

import logo  from '../assets/img/logo.svg';
import logo2 from '../assets/img/logo2.svg';
import eye   from '../assets/img/eye.svg';
import heart from '../assets/img/heart.svg';
import star  from '../assets/img/star.svg';
import star2 from '../assets/img/star2.svg';
import video from '../assets/img/video.mp4';

import { Check, ArrowUpRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

/* ── премиум-бейдж ─────────────────────────────────────── */
const PremBadge = ({ children }) => (
  <span className="lnd-prem-badge">{children}</span>
);

/* ── мобильный слайдер карточек ────────────────────────── */
const mobileFeatures = [
  { icon: eye,   title: 'Смотрите и изучайте',            desc: 'Получите доступ к образовательным видеоматериалам по программированию, веб-разработке, дизайну и другим цифровым направлениям.' },
  { icon: null,  title: 'Публикуйте видео',               desc: 'Загружайте собственный контент и делитесь знаниями с другими участниками сообщества.' },
  { icon: star2, title: 'Развивайте канал',               desc: 'Публикуйте образовательные материалы и собирайте аудиторию.' },
  { icon: null,  title: 'Создавайте собственные подборки',desc: 'Формируйте плейлисты и сохраняйте полезные материалы для удобного и структурированного обучения.' },
  { icon: heart, title: 'Участвуйте в сообществе',       desc: 'Делитесь опытом, обсуждайте технологии и обменивайтесь знаниями.' },
  { icon: null,  title: 'Анализируйте результаты',       desc: 'Используйте Творческую студию для просмотра статистики, анализа просмотров и оценки эффективности контента.' },
];

function MobileSlider() {
  const [idx, setIdx] = useState(0);
  const startX = useRef(null);
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(mobileFeatures.length - 1, i + 1));
  const onTouchStart = e => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40) next(); else if (dx > 40) prev();
    startX.current = null;
  };
  const f = mobileFeatures[idx];
  return (
    <div className="lnd-mobile-slider" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="lnd-mobile-slide">
        <div className="lnd-feat-card-mob">
          <div className="lnd-feat-mob__head">
            {f.icon && <img src={f.icon} className="lnd-feat-mob__icon" alt="" />}
            <div className="lnd-feat-mob__title">{f.title}</div>
          </div>
          <div className="lnd-feat-mob__desc">{f.desc}</div>
        </div>
      </div>
      <div className="lnd-mobile-dots">
        {mobileFeatures.map((_, i) => (
          <button key={i} className={`lnd-dot${i === idx ? ' lnd-dot--active' : ''}`} onClick={() => setIdx(i)} />
        ))}
      </div>
    </div>
  );
}

/* ── ротирующийся текст в hero ─────────────────────────── */
const heroTexts = [
  'Изучайте новые технологии',
  'Делитесь опытом',
  'Создавайте каналы',
  'Развивайте аудиторию',
];

function HeroRotatingText({ active }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setVisible(true);
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => { setCurrent(i => (i + 1) % heroTexts.length); setAnimating(false); }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className={`lnd-hero__sub${visible ? ' lnd-hero__sub--visible' : ''}`}>
      <span className={`lnd-hero__sub-text${animating ? ' lnd-hero__sub-text--out' : ''}`}>
        {heroTexts[current]}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING
═══════════════════════════════════════════════════════════ */
export default function Landing() {
  const [rotatingActive, setRotatingActive] = useState(false);
  /* ── refs ── */
  const rootRef        = useRef(null);
  const heroRef        = useRef(null);   // hero block для pixel grid
  const introLogoRef   = useRef(null);   // огромное лого в интро
  const introOverRef   = useRef(null);   // белый оверлей интро
  const headerLogoRef  = useRef(null);   // лого в хедере
  const headerNavRef   = useRef(null);
  const heroWordRef    = useRef([]);
  const heroStarRef    = useRef(null);
  const heroDescRef    = useRef(null);
  const featTitleRef   = useRef(null);
  const featCardsRef   = useRef([]);
  const pricTitleRef   = useRef(null);
  const planCardsRef   = useRef([]);
  const promoTitleRef  = useRef(null);
  const promoSubRef    = useRef(null);
  const promoCodeRef   = useRef(null);
  const ctaTitleRef    = useRef(null);
  const ctaDescRef     = useRef(null);
  const ctaBtnRef      = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    const ctx = gsap.context(() => {

      /* ═══════════════════════════════
         1. INTRO — огромное лого
      ═══════════════════════════════ */
      const isMobile = window.innerWidth < 768;

      gsap.set(headerNavRef.current,  { autoAlpha: 0 });
      gsap.set(headerLogoRef.current, { autoAlpha: 0 });

      // Скрываем все анимируемые элементы — чтобы не мелькали до старта
      gsap.set([
        ...heroWordRef.current,
        heroStarRef.current,
        heroDescRef.current,
        featTitleRef.current,
        pricTitleRef.current,
        ...featCardsRef.current,
        ...planCardsRef.current,
        promoTitleRef.current,
        promoSubRef.current,
        promoCodeRef.current,
        ctaTitleRef.current,
        ctaDescRef.current,
        ctaBtnRef.current,
      ].filter(Boolean), { autoAlpha: 0 });

      const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      introTl
        .from(introLogoRef.current, { autoAlpha: 0, scale: 0.7, duration: 1.1 })
        .to({}, { duration: 0.6 })
        .to(introLogoRef.current, {
          duration: 1.0,
          ease: 'power4.inOut',
          scale: isMobile ? 0.13 : 0.17,
          x: (() => {
            const logoEl = headerLogoRef.current;
            if (!logoEl) return -500;
            const r = logoEl.getBoundingClientRect();
            return r.left - window.innerWidth / 2 + r.width / 2;
          })(),
          y: (() => {
            const logoEl = headerLogoRef.current;
            if (!logoEl) return -400;
            const r = logoEl.getBoundingClientRect();
            return r.top - window.innerHeight / 2 + r.height / 2;
          })(),
        })
        .to(introOverRef.current,   { autoAlpha: 0, duration: 0.35 }, '-=0.15')
        .to(headerLogoRef.current,  { autoAlpha: 1, duration: 0.25 }, '-=0.2')
        .to(headerNavRef.current,   { autoAlpha: 1, duration: 0.5  }, '-=0.1')
        // ВСЕ остальные анимации регистрируются только здесь — после интро
        .call(() => {
          document.body.style.overflow = '';
          document.body.style.height = '';

          // Возвращаем видимость элементам — ScrollTrigger сам спрячет их через from()
          gsap.set([
            ...heroWordRef.current,
            heroStarRef.current,
            heroDescRef.current,
            featTitleRef.current,
            pricTitleRef.current,
            ...featCardsRef.current,
            ...planCardsRef.current,
            promoTitleRef.current,
            promoSubRef.current,
            promoCodeRef.current,
            ctaTitleRef.current,
            ctaDescRef.current,
            ctaBtnRef.current,
          ].filter(Boolean), { autoAlpha: 1 });

          ScrollTrigger.refresh();

          /* ═══════════════════════════════
             2. HERO — clip + skew (Awwwards)
          ═══════════════════════════════ */
          const heroTl = gsap.timeline({
            scrollTrigger: {
              trigger: '.lnd-hero',
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            delay: 0.1,
          });

          heroWordRef.current.forEach((el, i) => {
            if (!el) return;
            heroTl.fromTo(el,
              { y: '105%', skewY: 8, autoAlpha: 1 },
              { y: '0%',   skewY: 0, duration: 1.1, ease: 'power4.out' },
              i * 0.22
            );
          });

          heroTl
            .from(heroStarRef.current, { rotation: -180, scale: 0, autoAlpha: 0, duration: 0.8, ease: 'back.out(2)' }, 0.3)
            .set(heroDescRef.current, { autoAlpha: 1 }, 0.7)
            .call(() => {
              // Typewriter hero desc — три строки с <br>
              const el = heroDescRef.current;
              if (!el) return;
              el.innerHTML = '';
              const lines = [
                'Для изучения IT',
                'публикации экспертного контента',
                'и развития профессионального сообщества',
              ];
              const spans = lines.map((_, i) => {
                const s = document.createElement('span');
                s.className = 'lnd-hero__desc-line';
                el.appendChild(s);
                if (i < lines.length - 1) el.appendChild(document.createElement('br'));
                return s;
              });
              let lineIdx = 0, charIdx = 0;
              const TYPE_SPEED = 38;
              function tick() {
                if (lineIdx >= lines.length) {
                  // Подпись дописана — запускаем ротирующийся текст
                  setRotatingActive(true);
                  return;
                }
                const line = lines[lineIdx];
                if (charIdx <= line.length) {
                  spans[lineIdx].textContent = line.slice(0, charIdx);
                  charIdx++;
                  setTimeout(tick, TYPE_SPEED);
                } else {
                  lineIdx++; charIdx = 0;
                  setTimeout(tick, TYPE_SPEED * 3);
                }
              }
              tick();
            }, [], 0.85);


          /* ═══════════════════════════════
             3. SECTION TITLES — typewriter
          ═══════════════════════════════ */
          [
            { el: featTitleRef.current, text: 'Возможности' },
            { el: pricTitleRef.current, text: 'тарифы'      },
          ].forEach(({ el, text }) => {
            if (!el) return;
            el.textContent = '';
            ScrollTrigger.create({
              trigger: el,
              start: 'top 80%',
              once: true,
              onEnter: () => {
                gsap.to(el, {
                  duration: text.length * 0.12,
                  text: { value: text, delimiter: '' },
                  ease: 'none',
                });
              },
            });
          });


          /* ═══════════════════════════════
             4. FEATURE CARDS
          ═══════════════════════════════ */
          featCardsRef.current.forEach((el) => {
            if (!el) return;
            gsap.from(el, {
              scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
              y: 60, autoAlpha: 0, duration: 0.75, ease: 'power3.out',
            });
          });


          /* ═══════════════════════════════
             5. PRICING CARDS
          ═══════════════════════════════ */
          planCardsRef.current.forEach((el, i) => {
            if (!el) return;
            gsap.from(el, {
              scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
              x: i === 0 ? -80 : 80, autoAlpha: 0, duration: 0.9, ease: 'power3.out',
            });
          });


          /* ═══════════════════════════════
             6. PROMO
          ═══════════════════════════════ */
          if (promoTitleRef.current) {
            const split = new SplitType(promoTitleRef.current, { types: 'words' });
            gsap.from(split.words, {
              scrollTrigger: { trigger: promoTitleRef.current, start: 'top 85%', once: true },
              y: 50, autoAlpha: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out',
            });
          }
          gsap.from(promoSubRef.current, {
            scrollTrigger: { trigger: promoSubRef.current, start: 'top 88%', once: true },
            y: 30, autoAlpha: 0, duration: 0.8, ease: 'power3.out',
          });
          if (promoCodeRef.current) {
            const codeText = promoCodeRef.current.textContent;
            promoCodeRef.current.textContent = '';
            ScrollTrigger.create({
              trigger: promoCodeRef.current,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                gsap.to(promoCodeRef.current, {
                  duration: codeText.length * 0.1,
                  text: { value: codeText, delimiter: '' },
                  ease: 'none',
                });
              },
            });
          }


          /* ═══════════════════════════════
             7. CTA
          ═══════════════════════════════ */
          if (ctaTitleRef.current) {
            const splitCta = new SplitType(ctaTitleRef.current, { types: 'words' });
            gsap.from(splitCta.words, {
              scrollTrigger: { trigger: ctaTitleRef.current, start: 'top 85%', once: true },
              y: 60, autoAlpha: 0, stagger: 0.12, duration: 0.85, ease: 'power4.out',
            });
          }
          gsap.from(ctaDescRef.current, {
            scrollTrigger: { trigger: ctaDescRef.current, start: 'top 88%', once: true },
            y: 25, autoAlpha: 0, duration: 0.7, ease: 'power3.out',
          });
          gsap.from(ctaBtnRef.current, {
            scrollTrigger: { trigger: ctaBtnRef.current, start: 'top 90%', once: true },
            scale: 0.8, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.8)',
          });

        }); // конец .call()

    }, rootRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  /* ── glass block pixel grid on hero ──────────────────── */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    // Активируется только когда текст дописан (rotatingActive = true)
    if (!rotatingActive) return;

    const CELL    = 56;   // размер ячейки включая gap
    const GAP     = 5;
    const FADE_MS = 900;  // через сколько мс квадратик начинает гаснуть
    const OUT_MS  = 300;  // длительность fade-out

    // Красно-чёрная палитра — только inset свечение
    const palette = [
      { bg: 'linear-gradient(145deg, #1a0000 0%, #2d0000 100%)', border: 'rgba(180,0,0,0.50)',   glow: 'inset 0 0 20px 6px rgba(255,30,30,0.55)' },
      { bg: 'linear-gradient(145deg, #0d0000 0%, #200000 100%)', border: 'rgba(140,0,0,0.40)',   glow: 'inset 0 0 16px 5px rgba(200,0,0,0.50)' },
      { bg: 'linear-gradient(145deg, #200000 0%, #3a0000 100%)', border: 'rgba(220,20,20,0.55)', glow: 'inset 0 0 24px 8px rgba(255,50,50,0.65)' },
      { bg: 'linear-gradient(145deg, #0a0000 0%, #180000 100%)', border: 'rgba(100,0,0,0.38)',   glow: 'inset 0 0 14px 4px rgba(180,0,0,0.48)' },
      { bg: 'linear-gradient(145deg, #1c0000 0%, #320000 100%)', border: 'rgba(160,10,10,0.45)', glow: 'inset 0 0 18px 6px rgba(230,20,20,0.55)' },
    ];

    // Инжектируем CSS-анимацию один раз
    const STYLE_ID = 'hero-glass-style';
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = `
        @keyframes glassIn {
          0%   { opacity:0; transform:scale(0.45) rotate(-4deg); }
          65%  { opacity:1; transform:scale(1.06) rotate(1deg); }
          100% { opacity:1; transform:scale(1)    rotate(0deg); }
        }
        @keyframes glassOut {
          0%   { opacity:1; transform:scale(1); filter:blur(0px); }
          100% { opacity:0; transform:scale(0.7); filter:blur(3px); }
        }
        .hero-glass-cell {
          position: absolute;
          border-radius: 8px;
          opacity: 0;
          pointer-events: none;
          box-sizing: border-box;
          backdrop-filter: blur(2px);
        }
        .hero-glass-cell.is-in  { animation: glassIn  0.26s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .hero-glass-cell.is-out { animation: glassOut ${OUT_MS}ms cubic-bezier(0.4,0,1,1) forwards; }
      `;
      document.head.appendChild(s);
    }

    let cols = 0, rows = 0;
    let cells = [];       // [row][col] → { el, color, timerId }
    let layer = null;
    let active = true;

    function build() {
      if (layer) layer.remove();
      layer = document.createElement('div');
      layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;border-radius:inherit;';
      hero.appendChild(layer);

      const w = hero.offsetWidth;
      const h = hero.offsetHeight;
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.ceil(h / CELL) + 1;
      cells = [];

      for (let r = 0; r < rows; r++) {
        cells[r] = [];
        for (let c = 0; c < cols; c++) {
          const color = palette[Math.floor(Math.random() * palette.length)];
          const el = document.createElement('div');
          el.className = 'hero-glass-cell';
          el.style.left       = `${c * CELL + GAP / 2}px`;
          el.style.top        = `${r * CELL + GAP / 2}px`;
          el.style.width      = `${CELL - GAP}px`;
          el.style.height     = `${CELL - GAP}px`;
          el.style.background = color.bg;
          el.style.border     = `1px solid ${color.border}`;
          el.style.boxShadow  = color.glow;
          layer.appendChild(el);
          cells[r][c] = { el, timerId: null };
        }
      }
    }

    build();
    window.addEventListener('resize', build);

    function scheduleOut(cell) {
      if (cell.timerId) clearTimeout(cell.timerId);
      cell.timerId = setTimeout(() => {
        cell.el.classList.remove('is-in');
        cell.el.classList.add('is-out');
        cell.timerId = setTimeout(() => {
          cell.el.classList.remove('is-out');
          cell.el.style.opacity = '0';
        }, OUT_MS);
      }, FADE_MS);
    }

    function onMove(e) {
      if (!active) return;

      // Блокируем ячейки под текстовыми элементами
      const heroRect = hero.getBoundingClientRect();
      const textEls = hero.querySelectorAll(
        '.lnd-hero__word, .lnd-hero__star, .lnd-hero__desc, .lnd-hero__sub'
      );
      for (const t of textEls) {
        const tr = t.getBoundingClientRect();
        if (
          e.clientX >= tr.left - 8  && e.clientX <= tr.right  + 8 &&
          e.clientY >= tr.top  - 8  && e.clientY <= tr.bottom + 8
        ) return;
      }

      const x = e.clientX - heroRect.left;
      const y = e.clientY - heroRect.top;
      const col = Math.min(Math.floor(x / CELL), cols - 1);
      const row = Math.min(Math.floor(y / CELL), rows - 1);
      if (col < 0 || row < 0) return;

      const cell = cells[row]?.[col];
      if (!cell) return;

      // Уже видимый — только перезапускаем таймер гашения
      if (cell.el.classList.contains('is-in')) {
        scheduleOut(cell);
        return;
      }

      cell.el.classList.remove('is-out');
      void cell.el.offsetWidth; // reflow — сбрасываем анимацию
      cell.el.classList.add('is-in');
      scheduleOut(cell);
    }

    hero.addEventListener('mousemove', onMove);

    return () => {
      active = false;
      hero.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', build);
      if (layer) layer.remove();
    };
  }, [rotatingActive]);


  const setHeroWord = i => el => { heroWordRef.current[i] = el; };
  const setFeatCard = i => el => { featCardsRef.current[i] = el; };
  const setPlanCard = i => el => { planCardsRef.current[i] = el; };

  return (
    <div className="lnd-root" ref={rootRef}>

      {/* ══ INTRO OVERLAY ══ */}
      <div className="lnd-intro-over" ref={introOverRef}>
        <img src={logo} alt="logo" className="lnd-intro-logo" ref={introLogoRef} />
      </div>

      {/* ══ HEADER ══ */}
      <div className="lnd-header-wrap">
        <div className="lnd-header">
          <div className="lnd-logo" ref={headerLogoRef}>
            <img src={logo} alt="logo" />
          </div>
          <div className="lnd-nav" ref={headerNavRef}>
            <a href="#features" className="lnd-nav-link">Возможности</a>
            <a href="#pricing"  className="lnd-nav-link lnd-nav-link--hide-mob">Тарифы</a>
            <button className="lnd-btn-grad lnd-btn-reg">Регистрация</button>
          </div>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <div className="lnd-hero-wrap">
        <div className="lnd-hero" ref={heroRef}>
          <div className="lnd-hero__top">
            <div className="lnd-hero__row lnd-hero__row--between">
              <div className="lnd-hero__word-clip">
                <div className="lnd-hero__word" ref={setHeroWord(0)}>Образовательная</div>
              </div>
              <img src={star} className="lnd-hero__star" alt="" ref={heroStarRef} />
            </div>
            <div className="lnd-hero__row lnd-hero__row--end">
              <div className="lnd-hero__word-clip">
                <div className="lnd-hero__word lnd-hero__word--grad" ref={setHeroWord(1)}>видеоплатформа</div>
              </div>
            </div>
          </div>
          <div className="lnd-hero__bottom">
            <div className="lnd-hero__desc" ref={heroDescRef}></div>
            <HeroRotatingText active={rotatingActive} />
          </div>
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <div id="features" className="lnd-features-wrap">
        <div className="lnd-section-hd">
          <div className="lnd-section-title" ref={featTitleRef}>Возможности</div>
        </div>

        <div className="lnd-feat-grid">
          {/* ряд 1 */}
          <div className="lnd-feat-row">
            <div className="lnd-feat-card" ref={setFeatCard(0)}>
              <div className="lnd-feat-card__head">
                <img src={eye} className="lnd-feat-icon" alt="" />
                <div className="lnd-feat-card__title">Смотрите и изучайте</div>
              </div>
              <div className="lnd-feat-card__desc">Получите доступ к образовательным видеоматериалам<br />по программированию, веб-разработке, дизайну<br />и другим цифровым направлениям.</div>
            </div>
            <div className="lnd-feat-card lnd-feat-card--flex" ref={setFeatCard(1)}>
              <div className="lnd-feat-card__head"><div className="lnd-feat-card__title">Публикуйте видео</div></div>
              <div className="lnd-feat-card__desc">Загружайте собственный контент и делитесь<br />знаниями с другими участниками сообщества.</div>
            </div>
          </div>
          {/* ряд 2 */}
          <div className="lnd-feat-row">
            <div className="lnd-feat-card" ref={setFeatCard(2)}>
              <div className="lnd-feat-card__head">
                <img src={star2} className="lnd-feat-icon" alt="" />
                <div className="lnd-feat-card__title">Развивайте канал</div>
              </div>
              <div className="lnd-feat-card__desc">Публикуйте образовательные материалы<br />и собирайте аудиторию.</div>
            </div>
            <div className="lnd-feat-card lnd-feat-card--flex" ref={setFeatCard(3)}>
              <div className="lnd-feat-card__head"><div className="lnd-feat-card__title">Создавайте собственные подборки</div></div>
              <div className="lnd-feat-card__desc">Формируйте плейлисты и сохраняйте полезные<br />материалы для удобного и структурированного обучения.</div>
            </div>
          </div>
          {/* ряд 3 */}
          <div className="lnd-feat-row">
            <div className="lnd-feat-card lnd-feat-card--flex" ref={setFeatCard(4)}>
              <div className="lnd-feat-card__head">
                <img src={heart} className="lnd-feat-icon" alt="" />
                <div className="lnd-feat-card__title">Участвуйте в сообществе</div>
              </div>
              <div className="lnd-feat-card__desc">Делитесь опытом, обсуждайте<br />технологии и обменивайтесь знаниями.</div>
            </div>
            <div className="lnd-feat-card" ref={setFeatCard(5)}>
              <div className="lnd-feat-card__head"><div className="lnd-feat-card__title">Анализируйте результаты</div></div>
              <div className="lnd-feat-card__desc">Используйте Творческую студию для просмотра статистики,<br />анализа просмотров и оценки эффективности контента.</div>
            </div>
          </div>
        </div>

        <MobileSlider />
      </div>

      {/* ══ PRICING ══ */}
      <div id="pricing" className="lnd-pricing-wrap">
        <div className="lnd-section-hd">
          <div className="lnd-section-title" ref={pricTitleRef}>тарифы</div>
        </div>
        <div className="lnd-pricing-cards">
          <div className="lnd-plan-card" ref={setPlanCard(0)}>
            <div className="lnd-plan-title">Бесплатный тариф</div>
            <div className="lnd-plan-list">
              {['Просмотр образовательных видео','Создание плейлистов','Создание собственного канала','Кастомизация профиля','Возможность публикации видео (до 100 мб)','Творческая студия и аналитика'].map(t => (
                <div key={t} className="lnd-plan-item">
                  <Check className="lnd-check-icon" />
                  <div className="lnd-plan-item__text">{t}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lnd-plan-card" ref={setPlanCard(1)}>
            <div className="lnd-plan-title">Премиум-тариф</div>
            <div className="lnd-plan-list">
              <div className="lnd-plan-item">
                <Check className="lnd-check-icon" />
                <div className="lnd-plan-item__text">Все возможности Бесплатного тарифа</div>
              </div>
              {['Загрузка видео до 1 ГБ','Возможность оставлять комментарии','Расширенная персонализация аккаунта'].map(t => (
                <div key={t} className="lnd-plan-item lnd-plan-item--prem">
                  <Check className="lnd-check-icon lnd-check-icon--prem" />
                  <PremBadge size="big">{t}</PremBadge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ PROMO ══ */}
      <div className="lnd-promo">
        <video className="lnd-promo__video" src={video} autoPlay loop muted playsInline />
        <div className="lnd-promo__inner">
          <div className="lnd-promo__text-block">
            <div className="lnd-promo__title" ref={promoTitleRef}>ПОПРОБУЙТЕ ПРЕМИУМ БЕСПЛАТНО</div>
            <div className="lnd-promo__sub" ref={promoSubRef}>Активируйте премиум-доступ на 30 дней, чтобы познакомиться со всеми возможностями платформы</div>
          </div>
          <div className="lnd-promo__code" ref={promoCodeRef}>COMM-FREE30DAYS</div>
        </div>
      </div>

      {/* ══ CTA ══ */}
      <div className="lnd-cta-wrap">
        <div className="lnd-cta">
          <div className="lnd-cta__top">
            <div className="lnd-cta__title" ref={ctaTitleRef}>присоединяйтесь<br />к комьюнити!</div>
            <button className="lnd-btn-grad lnd-btn-reg2" ref={ctaBtnRef}>
              <span>Зарегистрироваться</span>
              <ArrowUpRight className="lnd-arrow-icon" />
            </button>
          </div>
          <div className="lnd-cta__bottom">
            <div className="lnd-cta__desc" ref={ctaDescRef}>Создавайте образовательный контент, развивайте собственный канал<br />и становитесь частью сообщества, где главная ценность — знания.</div>
            <img src={star} className="lnd-cta__star" alt="" />
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div className="lnd-footer">
        <div className="lnd-footer__inner">
          <div className="lnd-footer__left">
            <img src={logo2} alt="logo" className="lnd-footer__logo" />
            <div className="lnd-footer__copy">Дипломный проект 2026</div>
          </div>
          <div className="lnd-footer__links">
            <a href="#" className="lnd-footer__link">Политика Конфиденциальности</a>
            <a href="#" className="lnd-footer__link">Пользовательское Соглашение</a>
            <a href="#" className="lnd-footer__link">Поддержка</a>
          </div>
        </div>
      </div>

    </div>
  );
}