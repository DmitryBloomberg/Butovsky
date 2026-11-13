import './home.css';
import { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';

/* ───────────────────────── Данные ───────────────────────── */
const LOCATIONS = [
  { id: 'de', name: 'Германия', city: 'Франкфурт', ping: '28 мс', flag: '🇩🇪', lat: 50.1, lon: 8.7, load: 34 },
  { id: 'pl', name: 'Польша', city: 'Варшава', ping: '22 мс', flag: '🇵🇱', lat: 52.2, lon: 21.0, load: 41 },
  { id: 'fi', name: 'Финляндия', city: 'Хельсинки', ping: '14 мс', flag: '🇫🇮', lat: 60.2, lon: 24.9, load: 27 },
];

const PLANS = [
  {
    id: 'month',
    name: 'Месяц',
    price: 150,
    period: 'за 1 месяц',
    note: '150 ₽ в месяц',
    featured: false,
  },
  {
    id: 'two',
    name: '2 месяца',
    price: 250,
    period: 'за 2 месяца',
    note: 'всего 125 ₽ в месяц',
    featured: true,
    badge: 'Выгоднее на 50 ₽',
  },
];

const PLAN_FEATURES = [
  'До 10 устройств одновременно',
  '3 локации: Германия, Польша, Финляндия',
  'Безлимитный трафик и скорость',
  'Шифрование нового поколения',
  'Поддержка 24/7',
];

const FEATURES = [
  { icon: <i className="bx bx-bolt"></i>, title: 'Высокая скорость', text: 'Серверы на каналах 10 Гбит/с. Стримы, звонки и игры без задержек.' },
  { icon: <i className="bx bx-shield-alt-2"></i>, title: 'Надёжное шифрование', text: 'Современные протоколы защищают весь ваш трафик от слежки и перехвата.' },
  { icon: <i className="bx bx-devices"></i>, title: '10 устройств', text: 'Телефон, ноутбук, планшет, роутер и ТВ — всё под одной подпиской.' },
  { icon: <i className="bx bx-hide"></i>, title: 'Без логов', text: 'Мы не храним историю посещений и не собираем данные о ваших действиях.' },
  { icon: <i className="bx bx-globe"></i>, title: '3 локации', text: 'Германия, Польша и Финляндия. Переключайтесь в один клик.' },
  { icon: <i className="bx bx-message-square-dots"></i>, title: 'Поддержка 24/7', text: 'Живые люди отвечают в любое время суток, без выходных и праздников.' },
];

/* ───────────────────────── Хуки ───────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('visible'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ───────────────────────── Вращающаяся планета-сеть ───────────────────────── */
function latLon(lat, lon) {
  const p = (lat * Math.PI) / 180;
  const l = (lon * Math.PI) / 180;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
}

function Globe() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let angle = -0.5;
    let last = performance.now();
    let dragging = false;
    let dragX = 0;
    let velocity = 0;

    const N = 560;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i += 1) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }

    const edges = [];
    for (let i = 0; i < N; i += 1) {
      for (let j = i + 1; j < N; j += 1) {
        const dx = pts[i][0] - pts[j][0];
        const dy = pts[i][1] - pts[j][1];
        const dz = pts[i][2] - pts[j][2];
        if (dx * dx + dy * dy + dz * dz < 0.045) edges.push([i, j]);
      }
    }

    const nodes = LOCATIONS.map((l) => ({ ...l, v: latLon(l.lat, l.lon) }));
    const hub = { v: latLon(55.7, 37.6) };
    const routes = [
      { a: hub.v, b: nodes[0].v, off: 0 },
      { a: hub.v, b: nodes[1].v, off: 0.33 },
      { a: hub.v, b: nodes[2].v, off: 0.66 },
      { a: nodes[0].v, b: nodes[2].v, off: 0.5 },
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tilt = 0.38;
    const rot = (v) => {
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const x1 = v[0] * ca + v[2] * sa;
      const z1 = -v[0] * sa + v[2] * ca;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      const y2 = v[1] * ct - z1 * st;
      const z2 = v[1] * st + z1 * ct;
      return [x1, y2, z2];
    };

    const slerp = (a, b, t) => {
      const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const om = Math.acos(dot);
      const so = Math.sin(om) || 1;
      const k1 = Math.sin((1 - t) * om) / so;
      const k2 = Math.sin(t * om) / so;
      const lift = 1 + Math.sin(Math.PI * t) * 0.22 * (om / Math.PI + 0.35);
      return [
        (a[0] * k1 + b[0] * k2) * lift,
        (a[1] * k1 + b[1] * k2) * lift,
        (a[2] * k1 + b[2] * k2) * lift,
      ];
    };

    const draw = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!dragging) {
        velocity *= 0.95;
        angle += (reduce ? 0 : dt * 0.00018) + velocity;
      }
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36;
      const P = (v) => [cx + v[0] * R, cy - v[1] * R];

      const glow = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.9);
      glow.addColorStop(0, 'rgba(90,120,255,0.38)');
      glow.addColorStop(0.45, 'rgba(150,70,255,0.14)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, 'rgba(70,100,255,0.35)');
      body.addColorStop(0.6, 'rgba(25,20,90,0.55)');
      body.addColorStop(1, 'rgba(5,6,30,0.9)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      const rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      rim.addColorStop(0, 'rgba(0,229,255,0.9)');
      rim.addColorStop(1, 'rgba(176,92,255,0.9)');
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      const rp = pts.map(rot);
      ctx.lineWidth = 0.7;
      for (let k = 0; k < edges.length; k += 1) {
        const [i, j] = edges[k];
        const a = rp[i];
        const b = rp[j];
        const z = (a[2] + b[2]) / 2;
        if (z < -0.05) continue;
        const [x1, y1] = P(a);
        const [x2, y2] = P(b);
        ctx.strokeStyle = `rgba(110,190,255,${0.08 + z * 0.34})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      for (let i = 0; i < N; i += 1) {
        const p = rp[i];
        if (p[2] < 0) continue;
        const [x, y] = P(p);
        ctx.fillStyle = `rgba(190,230,255,${0.2 + p[2] * 0.7})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.7 + p[2] * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      routes.forEach((rt) => {
        const seg = 48;
        let prev = null;
        for (let s = 0; s <= seg; s += 1) {
          const t = s / seg;
          const q = rot(slerp(rt.a, rt.b, t));
          const visible = q[2] > -0.1;
          const [x, y] = P(q);
          if (prev && visible && prev.visible) {
            ctx.strokeStyle = `rgba(0,229,255,${0.25 + Math.max(0, q[2]) * 0.55})`;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          prev = { x, y, visible };
        }
        const tt = (now * 0.00022 + rt.off) % 1;
        const q = rot(slerp(rt.a, rt.b, tt));
        if (q[2] > -0.1) {
          const [x, y] = P(q);
          const g = ctx.createRadialGradient(x, y, 0, x, y, 12);
          g.addColorStop(0, 'rgba(255,255,255,1)');
          g.addColorStop(0.3, 'rgba(0,229,255,0.8)');
          g.addColorStop(1, 'rgba(0,229,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const hp = rot(hub.v);
      if (hp[2] > 0) {
        const [x, y] = P(hp);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      nodes.forEach((n, idx) => {
        const q = rot(n.v);
        if (q[2] < -0.05) return;
        const [x, y] = P(q);
        const ph = ((now * 0.0011 + idx * 0.7) % 2) / 2;
        ctx.strokeStyle = `rgba(255,95,200,${(1 - ph) * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 5 + ph * 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff5fc8';
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        if (q[2] > 0.15) {
          ctx.font = '600 12px Manrope, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.fillText(n.name, x + 11, y + 4);
        }
      });

      raf = requestAnimationFrame(draw);
    };

    const down = (e) => {
      dragging = true;
      dragX = e.clientX;
      canvas.setPointerCapture?.(e.pointerId);
    };

    const move = (e) => {
      if (!dragging) return;
      velocity = (e.clientX - dragX) * 0.0045;
      angle += velocity;
      dragX = e.clientX;
    };

    const up = () => {
      dragging = false;
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', up);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointerleave', up);
    };
  }, []);

  return <canvas ref={canvasRef} className="globe-canvas" aria-label="Вращающаяся сеть серверов" />;
}

/* ───────────────────────── Окно входа / регистрации ───────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function AuthModal({ initialTab, onClose }) {
  const { login } = useContext(AuthContext);
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({ name: '', email: '', password: '', repeat: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setServerError('');
  };

  const switchTab = (t) => {
    setTab(t);
    setErrors({});
    setServerError('');
  };

  const validate = () => {
    const er = {};
    if (tab === 'register' && form.name.trim().length < 2) er.name = 'Введите имя (от 2 символов)';
    if (!EMAIL_RE.test(form.email)) er.email = 'Введите корректную почту';
    if (form.password.length < 6) er.password = 'Минимум 6 символов';
    if (tab === 'register' && form.repeat !== form.password) er.repeat = 'Пароли не совпадают';
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    setServerError('');

    try {
      const endpoint = tab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = tab === 'register'
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(`https://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.success) {
        setServerError(data.error || 'Произошла ошибка');
        setLoading(false);
        return;
      }

      login(data.user, data.token);
      onClose();

    } catch (err) {
      setServerError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Вход и регистрация">
        <div className="modal-glow" />
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          <i className="bx bx-x"></i>
        </button>

        <div className="tabs">
          <button className={tab === 'login' ? 'tab active' : 'tab'} onClick={() => switchTab('login')}>
            Вход
          </button>
          <button className={tab === 'register' ? 'tab active' : 'tab'} onClick={() => switchTab('register')}>
            Регистрация
          </button>
          <span className={`tab-indicator ${tab}`} />
        </div>

        <form onSubmit={submit} noValidate>
          <h3 className="modal-title">{tab === 'register' ? 'Создайте аккаунт' : 'С возвращением'}</h3>
          <p className="modal-sub">
            {tab === 'register' ? 'Займёт меньше минуты' : 'Войдите, чтобы подключиться к сети'}
          </p>

          {serverError && (
            <p style={{ color: '#ff5f5f', textAlign: 'center', fontSize: '14px', marginBottom: '10px' }}>
              {serverError}
            </p>
          )}

          {tab === 'register' && (
            <label className={`field ${errors.name ? 'has-error' : ''}`}>
              <span>Имя</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Как к вам обращаться"
                value={form.name}
                onChange={change}
              />
              {errors.name && <em>{errors.name}</em>}
            </label>
          )}

          <label className={`field ${errors.email ? 'has-error' : ''}`}>
            <span>Почта</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={change}
            />
            {errors.email && <em>{errors.email}</em>}
          </label>

          <label className={`field ${errors.password ? 'has-error' : ''}`}>
            <span>Пароль</span>
            <div className="pass-wrap">
              <input
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={form.password}
                onChange={change}
              />
              <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Показать пароль">
                {show ? <i className="bx bx-hide"></i> : <i className="bx bx-show"></i>}
              </button>
            </div>
            {errors.password && <em>{errors.password}</em>}
          </label>

          {tab === 'register' && (
            <label className={`field ${errors.repeat ? 'has-error' : ''}`}>
              <span>Повторите пароль</span>
              <input
                name="repeat"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.repeat}
                onChange={change}
              />
              {errors.repeat && <em>{errors.repeat}</em>}
            </label>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : tab === 'register' ? 'Зарегистрироваться' : 'Войти'}
          </button>

          <p className="switch-line">
            {tab === 'register' ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
            <button type="button" onClick={() => switchTab(tab === 'register' ? 'login' : 'register')}>
              {tab === 'register' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ───────────────────────── Приложение ───────────────────────── */
function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const open = (tab) => {
    setMenu(false);
    setModal(tab);
  };

  const handleConnect = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      open('register');
    }
  };

  return (
    <div className="app">
      <div className="bg" aria-hidden="true">
        <div className="stars stars-1" />
        <div className="stars stars-2" />
        <div className="stars stars-3" />
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <div className="grid-floor" />
      </div>

      <header className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <a href="#top" className="logo">
          <span className="logo-mark">
            <i />
          </span>
          Butovsky<b>VPN</b>
        </a>
        <nav className={`nav-links ${menu ? 'open' : ''}`}>
          <a href="#locations" onClick={() => setMenu(false)}>Локации</a>
          <a href="#features" onClick={() => setMenu(false)}>Преимущества</a>
          <a href="#pricing" onClick={() => setMenu(false)}>Тарифы</a>
          <a href="#support" onClick={() => setMenu(false)}>Поддержка</a>
          <button className="link-btn mobile-only" onClick={() => open('login')}>Войти</button>
        </nav>
        <div className="nav-actions">
          {/*<button className="link-btn desktop-only" onClick={() => open('login')}>Войти</button>*/}
          {/*<button className="btn btn-primary btn-sm" onClick={handleConnect}>Подключиться</button>*/}
          <button className={`burger ${menu ? 'open' : ''}`} onClick={() => setMenu(!menu)} aria-label="Меню">
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-text">
            <span className="pill">
              <i className="pulse-dot" /> Сеть работает · все серверы онлайн
            </span>
            <h1>
              Интернет <span className="grad">без границ</span> и без слежки
            </h1>
            <p className="lead">
              Быстрый и защищённый VPN с серверами в Германии, Польше и Финляндии. Одна подписка — до 10 ваших
              устройств.
            </p>
            <div className="hero-cta">
              {/*<button className="btn btn-primary btn-lg" onClick={handleConnect}>
                Подключиться
                <i className="bx bx-right-arrow-alt btn-arrow"></i>
              </button>*/}
              <a className="btn btn-ghost btn-lg" href="#pricing">Смотреть тарифы</a>
            </div>
            <ul className="stats">
              <li><b>3</b><span>локации</span></li>
              <li><b>10</b><span>устройств</span></li>
              <li><b>24/7</b><span>поддержка</span></li>
            </ul>
          </div>
          <div className="hero-globe">
            <div className="orbit orbit-1"><i /></div>
            <div className="orbit orbit-2"><i /></div>
            <div className="orbit orbit-3"><i /></div>
            <Globe />
            <div className="float-card fc-1">
              <span className="fc-dot" /> Шифрование включено
            </div>
            <div className="float-card fc-2">
              <small>Финляндия</small>
              <b>14 мс</b>
            </div>
            <div className="float-card fc-3">
              <small>Скорость</small>
              <b>940 Мбит/с</b>
            </div>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <div className="marquee-group" key={k}>
                <span><i className="bx bx-lock-alt"></i> Шифрование</span>
                <span><i className="bx bx-bolt"></i> Высокая скорость</span>
                <span><i className="bx bx-map"></i> Германия</span>
                <span><i className="bx bx-map"></i> Польша</span>
                <span><i className="bx bx-map"></i> Финляндия</span>
                <span><i className="bx bx-devices"></i> 10 устройств</span>
                <span><i className="bx bx-message-square-dots"></i> Поддержка 24/7</span>
                <span><i className="bx bx-hide"></i> Без логов</span>
              </div>
            ))}
          </div>
        </div>

        <section id="locations" className="section">
          <div className="section-head reveal">
            <span className="eyebrow">Локации</span>
            <h2>Три узла — одна <span className="grad">быстрая сеть</span></h2>
            <p>Выбирайте ближайший сервер или переключайтесь между странами в один клик.</p>
          </div>
          <div className="cards-3">
            {LOCATIONS.map((l, i) => (
              <article className="card loc-card reveal" style={{ transitionDelay: `${i * 90}ms` }} key={l.id}>
                <div className="card-shine" />
                <div className="loc-flag">{l.flag}</div>
                <h3>{l.name}</h3>
                <p className="muted">{l.city}</p>
                <div className="loc-meta">
                  <span>Пинг <b>{l.ping}</b></span>
                  <span>Нагрузка <b>{l.load}%</b></span>
                </div>
                <div className="bar"><i style={{ width: `${l.load}%` }} /></div>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="section">
          <div className="section-head reveal">
            <span className="eyebrow">Преимущества</span>
            <h2>Всё, что нужно для <span className="grad">свободной сети</span></h2>
          </div>
          <div className="cards-3">
            {FEATURES.map((f, i) => (
              <article className="card feat-card reveal" style={{ transitionDelay: `${(i % 3) * 90}ms` }} key={f.title}>
                <div className="card-shine" />
                <div className="feat-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p className="muted">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="section-head reveal">
            <span className="eyebrow">Тарифы</span>
            <h2>Простые цены, <span className="grad">никаких сюрпризов</span></h2>
            <p>Оба тарифа включают все возможности — отличается только срок.</p>
          </div>
          <div className="plans">
            {PLANS.map((p, i) => (
              <article className={`plan reveal ${p.featured ? 'plan-featured' : ''}`} style={{ transitionDelay: `${i * 120}ms` }} key={p.id}>
                {p.badge && <span className="plan-badge">{p.badge}</span>}
                <h3>{p.name}</h3>
                <div className="price">
                  <b>{p.price}</b>
                  <span>₽</span>
                </div>
                <p className="muted">{p.period} · {p.note}</p>
                <ul>
                  {PLAN_FEATURES.map((f) => (
                    <li key={f}><i>✓</i>{f}</li>
                  ))}
                </ul>
                <button className={`btn btn-block ${p.featured ? 'btn-primary' : 'btn-ghost'}`} onClick={handleConnect}>
                  Подключиться
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="support" className="section">
          <div className="support reveal">
            <div className="support-glow" />
            <div className="support-text">
              <span className="eyebrow">Поддержка 24/7</span>
              <h2>Мы на связи <span className="grad">всегда</span></h2>
              <p>
                Что-то не подключается или нужна помощь с настройкой? Наша команда отвечает круглосуточно — в будни,
                выходные и праздники.
              </p>
              {/*<button className="btn btn-primary" onClick={handleConnect}>Начать сейчас</button>*/}
            </div>
            <div className="support-clock" aria-hidden="true">
              <div className="clock-ring" />
              <div className="clock-ring r2" />
              <div className="clock-core">
                <b>24/7</b>
                <span>онлайн</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a href="#top" className="logo">
          <span className="logo-mark"><i /></span>
          Butovsky<b>VPN</b>
        </a>
        <p>© {new Date().getFullYear()} NebulaVPN. Все права защищены.</p>
      </footer>

      {modal && <AuthModal initialTab={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

export default Home;