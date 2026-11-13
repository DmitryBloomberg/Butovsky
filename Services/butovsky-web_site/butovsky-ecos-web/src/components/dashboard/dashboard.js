import './dashboard.css';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ───────────────────────── Данные ───────────────────────── */
const LOCATIONS = [
  { id: 'de', name: 'Германия', city: 'Франкфурт', flag: '🇩🇪', ping: 28, load: 34 },
  { id: 'pl', name: 'Польша', city: 'Варшава', flag: '🇵🇱', ping: 22, load: 41 },
  { id: 'fi', name: 'Финляндия', city: 'Хельсинки', flag: '🇫🇮', ping: 14, load: 27 },
];

const PLANS = [
  { id: 'month', name: 'Месяц', price: 150, days: 30, note: '150 ₽ в месяц' },
  { id: 'two', name: '2 месяца', price: 250, days: 60, note: '125 ₽ в месяц · выгоднее на 50 ₽' },
];

const DEVICE_TYPES = [
  { id: 'phone', icon: '📱', label: 'Телефон' },
  { id: 'laptop', icon: '💻', label: 'Ноутбук' },
  { id: 'desktop', icon: '🖥️', label: 'ПК' },
  { id: 'tv', icon: '📺', label: 'ТВ' },
];

const MAX_DEVICES = 10;

const TRAFFIC = [
  { day: 'Пн', gb: 3.2 },
  { day: 'Вт', gb: 5.1 },
  { day: 'Ср', gb: 2.8 },
  { day: 'Чт', gb: 6.4 },
  { day: 'Пт', gb: 4.7 },
  { day: 'Сб', gb: 7.9 },
  { day: 'Вс', gb: 5.5 },
];

const FAQ = [
  { q: 'Как подключить новое устройство?', a: 'Откройте вкладку «Устройства», нажмите «Добавить устройство» и следуйте подсказкам. Лимит — 10 устройств одновременно.' },
  { q: 'Как сменить страну подключения?', a: 'На вкладке «Обзор» выберите одну из трёх локаций — Германия, Польша или Финляндия. Переключение занимает пару секунд.' },
  { q: 'Что будет, когда подписка закончится?', a: 'Доступ приостановится, но все ваши устройства сохранятся. После продления всё заработает снова.' },
];

const NAV = [
  { id: 'overview', icon: <i className="bx bx-home-alt-2" />, label: 'Главная' },
  { id: 'devices', icon: <i className="bx bx-devices" />, label: 'Устройства' },
  { id: 'billing', icon: <i className="bx bx-credit-card" />, label: 'Подписки и платежи' },
  { id: 'support', icon: <i className="bx bx-support" />, label: 'Поддержка' },
];

const fmtDate = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const plural = (n, a, b, c) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return a;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return b;
  return c;
};

/* ───────────────────────── Хуки ───────────────────────── */
function useCount(target, ms = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* ───────────────────────── Мелкие компоненты ───────────────────────── */
function Stat({ icon, label, value, decimals = 0, suffix = '', hint, tone }) {
  const v = useCount(value);
  return (
    <div className={`d-card d-stat tone-${tone}`}>
      <div className="d-stat-icon">{icon}</div>
      <span className="d-stat-label">{label}</span>
      <b className="d-stat-value">
        {v.toFixed(decimals)}
        <small>{suffix}</small>
      </b>
      <span className="d-stat-hint">{hint}</span>
    </div>
  );
}

function Ring({ pct, children }) {
  const R = 58;
  const C = 2 * Math.PI * R;
  return (
    <div className="d-ring">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="55%" stopColor="#5b7bff" />
            <stop offset="100%" stopColor="#ff5fc8" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={R} className="d-ring-bg" />
        <circle
          cx="70"
          cy="70"
          r={R}
          className="d-ring-fg"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="d-ring-center">{children}</div>
    </div>
  );
}

function TrafficChart({ data }) {
  const W = 640;
  const H = 240;
  const pad = { l: 40, r: 16, t: 20, b: 32 };
  const max = Math.ceil(Math.max(...data.map((d) => d.gb)) / 2) * 2;
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const pts = data.map((d, i) => [
    pad.l + (i * (W - pad.l - pad.r)) / (data.length - 1),
    pad.t + (1 - d.gb / max) * (H - pad.t - pad.b),
  ]);

  let line = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    line += `C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }

  const base = H - pad.b;
  const area = `${line} L${pts[pts.length - 1][0]},${base} L${pts[0][0]},${base} Z`;

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    pts.forEach((p, i) => {
      if (Math.abs(p[0] - x) < Math.abs(pts[best][0] - x)) best = i;
    });
    setHover(best);
  };

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="d-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="График трафика за неделю"
      >
        <defs>
          <linearGradient id="trafArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b7bff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5b7bff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trafLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="55%" stopColor="#5b7bff" />
            <stop offset="100%" stopColor="#ff5fc8" />
          </linearGradient>
        </defs>
        {ticks.map((t) => {
          const y = pad.t + (1 - t) * (H - pad.t - pad.b);
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} className="d-grid-line" />
              <text x={pad.l - 10} y={y + 4} textAnchor="end" className="d-axis">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        <path d={area} fill="url(#trafArea)" className="d-area" />
        <path d={line} fill="none" stroke="url(#trafLine)" strokeWidth="3" strokeLinecap="round" className="d-line" />
        {data.map((d, i) => (
          <text key={d.day} x={pts[i][0]} y={H - 8} textAnchor="middle" className={`d-axis ${hover === i ? 'on' : ''}`}>
            {d.day}
          </text>
        ))}
        {hover !== null && (
          <g>
            <line x1={pts[hover][0]} x2={pts[hover][0]} y1={pad.t} y2={base} className="d-cursor" />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="9" className="d-dot-halo" />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="5" className="d-dot" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="d-tooltip"
          style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100}%` }}
        >
          <small>{data[hover].day}</small>
          <b>{data[hover].gb.toFixed(1)} ГБ</b>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="d-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="d-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button className="d-modal-x" onClick={onClose} aria-label="Закрыть">✕</button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────── Вкладка: Обзор (без кнопки подключения) ───────────────────────── */
function Overview({ s }) {
  const { loc, setLoc, daysLeft, totalDays, expires, devices, plan, goTo } = s;
  const current = LOCATIONS.find((l) => l.id === loc);
  const pct = Math.min(1, daysLeft / totalDays);
  const weekTotal = TRAFFIC.reduce((a, b) => a + b.gb, 0);

  return (
    <div className="d-tab">
      {/* Локации + Подписка */}
      <div className="d-grid-top">
        {/* Локации */}
        <section className="d-card">
          <div className="d-card-head">
            <h3>Серверы</h3>
            <span className="d-badge ok">Выбрано</span>
          </div>
          <div className="d-locs">
            {LOCATIONS.map((l) => (
              <button key={l.id} className={`d-loc ${loc === l.id ? 'active' : ''}`} onClick={() => setLoc(l.id)}>
                <span className="d-loc-flag">{l.flag}</span>
                <span className="d-loc-text">
                  <b>{l.name}</b>
                  <small>{l.city} · {l.ping} мс · нагрузка {l.load}%</small>
                </span>
                <span className="d-loc-check">{loc === l.id ? '✓' : ''}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Подписка */}
        <section className="d-card d-sub">
          <div className="d-card-head">
            <h3>Подписка</h3>
            <span className="d-badge ok">Активна</span>
          </div>
          <Ring pct={pct}>
            <b>{daysLeft}</b>
            <small>{plural(daysLeft, 'день', 'дня', 'дней')}</small>
          </Ring>
          <p className="d-sub-line">
            Тариф <b>{plan}</b>
          </p>
          <p className="d-sub-line muted">до {fmtDate(expires)}</p>
          <button className="d-btn primary block" onClick={() => goTo('billing')}>
            Продлить подписку
          </button>
        </section>
      </div>

      {/* Статистика */}
      <div className="d-stats">
        <Stat icon="📱" label="Устройства" value={devices.length} suffix={` / ${MAX_DEVICES}`} hint="подключено сейчас" tone="cyan" />
        <Stat icon="📊" label="Трафик за неделю" value={weekTotal} decimals={1} suffix=" ГБ" hint="без ограничений" tone="blue" />
        <Stat icon="⚡" label="Скорость" value={940} suffix=" Мбит/с" hint="средняя за 24 часа" tone="violet" />
        <Stat icon="🛡️" label="Аптайм" value={99.98} decimals={2} suffix="%" hint="за последние 30 дней" tone="pink" />
      </div>

      {/* График + мини-список устройств */}
      <div className="d-grid-bottom">
        <section className="d-card">
          <div className="d-card-head">
            <h3>Трафик за неделю</h3>
            <span className="d-badge">ГБ в день</span>
          </div>
          <TrafficChart data={TRAFFIC} />
        </section>

        <section className="d-card">
          <div className="d-card-head">
            <h3>Мои устройства</h3>
            <button className="d-link" onClick={() => goTo('devices')}>Все →</button>
          </div>
          {devices.length === 0 ? (
            <p className="muted" style={{ padding: '10px 0' }}>Устройства пока не подключены</p>
          ) : (
            <ul className="d-mini-list">
              {devices.slice(0, 4).map((d) => (
                <li key={d.id}>
                  <span className="d-mini-icon">{DEVICE_TYPES.find((t) => t.id === d.type)?.icon}</span>
                  <span className="d-mini-text">
                    <b>{d.name}</b>
                    <small>{d.os}</small>
                  </span>
                  <i className={`d-dot-status ${d.online ? 'on' : ''}`} title={d.online ? 'Онлайн' : 'Офлайн'} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── Вкладка: Устройства (пустой старт) ───────────────────────── */
function Devices({ s }) {
  const { devices, removeDevice, openAdd } = s;
  const pct = (devices.length / MAX_DEVICES) * 100;

  return (
    <div className="d-tab">
      <div className="d-card d-devices-head">
        <div>
          <h3>Устройства</h3>
          <p className="muted">
            Использовано {devices.length} из {MAX_DEVICES}. Свободно: {MAX_DEVICES - devices.length}.
          </p>
          <div className="d-bar"><i style={{ width: `${pct}%` }} /></div>
        </div>
        <button className="d-btn primary" onClick={openAdd} disabled={devices.length >= MAX_DEVICES}>
          + Добавить устройство
        </button>
      </div>

      <div className="d-devices">
        {devices.map((d, i) => (
          <article className="d-card d-device" key={d.id} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="d-device-top">
              <span className="d-device-icon">{DEVICE_TYPES.find((t) => t.id === d.type)?.icon}</span>
              <span className={`d-badge ${d.online ? 'ok' : ''}`}>{d.online ? 'Онлайн' : 'Офлайн'}</span>
            </div>
            <h4>{d.name}</h4>
            <p className="muted">{d.os}</p>
            <p className="d-device-seen">Активность: {d.seen}</p>
            <button className="d-btn ghost danger block" onClick={() => removeDevice(d.id)}>
              Отключить
            </button>
          </article>
        ))}
        {devices.length < MAX_DEVICES && (
          <button className="d-device-add" onClick={openAdd}>
            <span>+</span>
            Добавить устройство
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Вкладка: Подписки и платежи ───────────────────────── */
function Billing({ s }) {
  const { plan, daysLeft, expires, payments, openBuy, openRenew } = s;

  return (
    <div className="d-tab">
      <div className="d-grid-billing">
        {/* Текущий тариф */}
        <section className="d-card d-plan-card">
          <div className="d-plan-glow" />
          <span className="d-badge ok">Активна</span>
          <h3>Тариф «{plan}»</h3>
          <p className="muted">
            Осталось {daysLeft} {plural(daysLeft, 'день', 'дня', 'дней')} · действует до {fmtDate(expires)}
          </p>
          <ul className="d-perks">
            <li>До 10 устройств</li>
            <li>3 локации</li>
            <li>Безлимитный трафик</li>
            <li>Поддержка 24/7</li>
          </ul>
          <button className="d-btn primary" onClick={openBuy}>
            Купить подписку
          </button>
        </section>

        {/* История платежей */}
        <section className="d-card">
          <div className="d-card-head"><h3>История платежей</h3></div>
          {payments.length === 0 ? (
            <p className="muted">Платежей пока нет</p>
          ) : (
            <div className="d-table">
              <div className="d-tr d-th">
                <span>Дата</span><span>Тариф</span><span>Сумма</span><span>Статус</span>
              </div>
              {payments.map((p) => (
                <div className="d-tr" key={p.id}>
                  <span>{p.date}</span>
                  <span>{p.plan}</span>
                  <span><b>{p.sum} ₽</b></span>
                  <span><i className="d-badge ok">Оплачено</i></span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── Вкладка: Поддержка + активные запросы ───────────────────────── */
function Support({ s }) {
  const { notify, tickets } = s;
  const [open, setOpen] = useState(0);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!subject.trim() || !text.trim()) {
      notify('Заполните тему и сообщение', 'err');
      return;
    }
    setSubject('');
    setText('');
    notify('Обращение отправлено — ответим в ближайшее время');
  };

  return (
    <div className="d-tab">
      <div className="d-grid-support">
        {/* Форма обращения */}
        <section className="d-card d-support-card">
          <div className="d-support-clock">
            <span className="d-clock-ring" />
            <span className="d-clock-ring r2" />
            <b>24/7</b>
          </div>
          <h3>Мы на связи всегда</h3>
          <p className="muted">Опишите проблему — поддержка ответит в любое время суток.</p>
          <form onSubmit={send}>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Тема обращения" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Опишите, что случилось" rows={4} />
            <button className="d-btn primary block" type="submit">Отправить</button>
          </form>
        </section>

        {/* Активные запросы */}
        <section className="d-card">
          <div className="d-card-head">
            <h3>Активные запросы</h3>
            <span className="d-badge">{tickets.length}</span>
          </div>
          {tickets.length === 0 ? (
            <p className="muted">Активных обращений нет</p>
          ) : (
            <ul className="d-mini-list">
              {tickets.map((t) => (
                <li key={t.id}>
                  <span className="d-mini-icon">
                    {t.status === 'answered' ? '💬' : t.status === 'closed' ? '✓' : '⏳'}
                  </span>
                  <span className="d-mini-text">
                    <b>{t.subject}</b>
                    <small>
                      {fmtDate(t.date)} · {t.status === 'answered' ? 'Отвечено' : t.status === 'closed' ? 'Закрыто' : 'В обработке'}
                    </small>
                  </span>
                  <i className={`d-dot-status ${t.status === 'answered' ? 'on' : ''}`} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* FAQ */}
      <section className="d-card">
        <div className="d-card-head"><h3>Частые вопросы</h3></div>
        <div className="d-faq">
          {FAQ.map((f, i) => (
            <div className={`d-faq-item ${open === i ? 'open' : ''}`} key={f.q}>
              <button onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
                <span>+</span>
              </button>
              <div className="d-faq-a"><p>{f.a}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ───────────────────────── Dashboard ───────────────────────── */
export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [menu, setMenu] = useState(false);

  const [loc, setLoc] = useState('fi');
  const [plan, setPlan] = useState('2 месяца');
  const [daysLeft, setDaysLeft] = useState(42);
  const [totalDays, setTotalDays] = useState(60);

  const [devices, setDevices] = useState([]); // ← пусто по умолчанию

  const [payments, setPayments] = useState([
    { id: 3, date: '19.10.2026', plan: '2 месяца', sum: 250 },
    { id: 2, date: '19.08.2026', plan: '2 месяца', sum: 250 },
    { id: 1, date: '19.07.2026', plan: 'Месяц', sum: 150 },
  ]);

  // Активные обращения в поддержку
  const [tickets, setTickets] = useState([
    { id: 1, subject: 'Не подключается сервер в Германии', date: new Date(2026, 10, 5), status: 'pending' },
    { id: 2, subject: 'Вопрос по оплате', date: new Date(2026, 10, 2), status: 'answered' },
  ]);

  const [modal, setModal] = useState(null); // 'add' | 'buy'
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('phone');
  const [pick, setPick] = useState('two');

  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const expires = useMemo(() => addDays(daysLeft), [daysLeft]);
  const displayName = user?.name || 'Гость';

  const notify = (msg, kind = 'ok') => {
    clearTimeout(timer.current);
    setToast({ msg, kind, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const changeLoc = (id) => {
    setLoc(id);
    notify(`Локация изменена: ${LOCATIONS.find((l) => l.id === id).name}`);
  };

  const removeDevice = (id) => {
    setDevices((list) => list.filter((d) => d.id !== id));
    notify('Устройство отключено');
  };

  const addDevice = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const t = DEVICE_TYPES.find((x) => x.id === newType);
    setDevices((list) => [
      ...list,
      { id: Date.now(), name: newName.trim(), type: newType, os: t.label, online: true, seen: 'сейчас' },
    ]);
    setNewName('');
    setModal(null);
    notify('Устройство добавлено');
  };

  const buy = () => {
    const p = PLANS.find((x) => x.id === pick);
    const nextLeft = daysLeft + p.days;
    setDaysLeft(nextLeft);
    setTotalDays((t) => Math.max(t, nextLeft));
    setPlan(p.name);
    setPayments((list) => [{ id: Date.now(), date: fmtDate(new Date()), plan: p.name, sum: p.price }, ...list]);
    setModal(null);
    notify(`Подписка оплачена на ${p.days} дней`);
  };

  const goTo = (id) => {
    setTab(id);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const s = {
    loc, setLoc: changeLoc,
    daysLeft, totalDays, expires, plan, devices, removeDevice,
    openAdd: () => setModal('add'),
    openBuy: () => setModal('buy'),
    payments, goTo, notify, tickets,
  };

  const current = NAV.find((n) => n.id === tab);

  return (
    <div className="dash">
      <div className="dash-bg" aria-hidden="true" />

      {menu && <div className="d-overlay" onClick={() => setMenu(false)} />}

      {/* Боковая панель (без статуса VPN) */}
      <aside className={`d-side ${menu ? 'open' : ''}`}>
        <a href="#/dashboard" className="d-logo" onClick={() => goTo('overview')}>
          <span className="d-logo-mark"><i /></span>
          Butovsky<b>VPN</b>
        </a>
        <nav className="d-nav">
          {NAV.map((n) => (
            <button key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => goTo(n.id)}>
              <span className="d-nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="d-side-bottom">
          <div className="d-user">
            <span className="d-avatar">{displayName.charAt(0).toUpperCase()}</span>
            <span className="d-user-text">
              <b>{displayName}</b>
              <small>{user?.email || 'Аккаунт'}</small>
            </span>
          </div>
          <button className="d-btn ghost block" onClick={onLogout}>Выйти</button>
        </div>
      </aside>

      {/* Контент */}
      <div className="d-main">
        <header className="d-top">
          <button className="d-burger" onClick={() => setMenu(true)} aria-label="Меню">
            <span /><span /><span />
          </button>
          <div className="d-title">
            <h1>{tab === 'overview' ? `Привет, ${displayName}!` : current.label}</h1>
          </div>
          <div className="d-top-actions">
            <button className="d-icon-btn" onClick={() => notify('Новых уведомлений нет')} aria-label="Уведомления">
              🔔<i />
            </button>
            <button className="d-btn primary d-top-cta" onClick={() => setModal('buy')}>Купить</button>
          </div>
        </header>

        <main key={tab}>
          {tab === 'overview' && <Overview s={s} />}
          {tab === 'devices' && <Devices s={s} />}
          {tab === 'billing' && <Billing s={s} />}
          {tab === 'support' && <Support s={s} />}
        </main>
      </div>

      {/* Модалка: добавление устройства */}
      {modal === 'add' && (
        <Modal title="Новое устройство" onClose={() => setModal(null)}>
          <form onSubmit={addDevice} className="d-form">
            <label>
              <span>Название</span>
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Например, iPad Air" />
            </label>
            <span className="d-form-label">Тип устройства</span>
            <div className="d-types">
              {DEVICE_TYPES.map((t) => (
                <button type="button" key={t.id} className={newType === t.id ? 'active' : ''} onClick={() => setNewType(t.id)}>
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <button className="d-btn primary block" type="submit" disabled={!newName.trim()}>Добавить</button>
          </form>
        </Modal>
      )}

      {/* Модалка: покупка подписки */}
      {modal === 'buy' && (
        <Modal title="Покупка подписки" onClose={() => setModal(null)}>
          <div className="d-plans">
            {PLANS.map((p) => (
              <button key={p.id} className={`d-plan-opt ${pick === p.id ? 'active' : ''}`} onClick={() => setPick(p.id)}>
                <span className="d-radio" />
                <span className="d-plan-opt-text">
                  <b>{p.name}</b>
                  <small>{p.note}</small>
                </span>
                <strong>{p.price} ₽</strong>
              </button>
            ))}
          </div>
          <button className="d-btn primary block" onClick={buy}>
            Оплатить {PLANS.find((p) => p.id === pick).price} ₽
          </button>
        </Modal>
      )}

      {toast && (
        <div className={`d-toast ${toast.kind}`} key={toast.key} role="status">
          <i>{toast.kind === 'err' ? '!' : '✓'}</i>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
