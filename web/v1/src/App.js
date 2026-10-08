import { useState } from 'react';
import './App.css';

const plans = [
  { price: 150, label: 'Тариф 150' },
  { price: 250, label: 'Тариф 250' },
];

const advantages = [
  {
    icon: 'shield',
    number: '01',
    title: 'Больше приватности',
    text: 'VPN создаёт защищённый маршрут для соединения и помогает безопаснее пользоваться общественными Wi-Fi сетями.',
  },
  {
    icon: 'devices',
    number: '02',
    title: 'Все устройства рядом',
    text: 'Подключайте до 20 устройств по одному тарифу — телефон, ноутбук, планшет и другие.',
  },
  {
    icon: 'infinity',
    number: '03',
    title: 'Без лимита трафика',
    text: 'Смотрите, работайте и оставайтесь на связи без подсчёта гигабайтов.',
  },
  {
    icon: 'support',
    number: '04',
    title: 'Поддержка 24/7',
    text: 'Если появится вопрос, команда поддержки доступна круглосуточно.',
  },
];

function Icon({ name }) {
  const shapes = {
    shield: <><path d="M12 3 19 6v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    devices: <><rect x="3" y="4" width="13" height="11" rx="2" /><path d="M7 19h5m-2-4v4" /><rect x="17" y="8" width="4" height="10" rx="1" /></>,
    infinity: <><path d="M8.5 8.5C5.8 8.5 4 10 4 12s1.8 3.5 4.5 3.5c3 0 5-7 8-7 2.1 0 3.5 1.5 3.5 3.5s-1.4 3.5-3.5 3.5c-3 0-5-7-8-7Z" /></>,
    support: <><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><path d="M4 13h3v6H6a2 2 0 0 1-2-2v-4Zm16 0h-3v6h1a2 2 0 0 0 2-2v-4Z" /><path d="M17 19c-.8 1-2.3 1.5-4.5 1.5" /></>,
    arrow: <><path d="M7 17 17 7M8 7h9v9" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {shapes[name]}
    </svg>
  );
}

function App() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <div className="site-shell" id="top">
      <div className="page-glow page-glow-one" aria-hidden="true" />
      <div className="page-glow page-glow-two" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Butovsky VPN — на главную">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-name">BUTOVSKY<span>VPN</span></span>
        </a>
        <nav className="main-nav" aria-label="Основная навигация">
          <a href="#advantages">Преимущества</a>
          <a href="#plans">Тарифы</a>
          <a href="#faq">Вопросы</a>
        </nav>
        <a className="header-link" href="#plans">Выбрать тариф <Icon name="arrow" /></a>
      </header>

      <main>
        <section className="hero section-wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> ПРИВАТНОСТЬ БЕЗ ЛИШНЕГО</div>
            <h1 id="hero-title">Твоя сеть.<br /><span>Твои правила.</span></h1>
            <p className="hero-description">Защищённое VPN-подключение на каждый день — дома, в дороге и в общественных сетях. Без регистрации на сайте и без лимита трафика.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#plans">Смотреть тарифы <Icon name="arrow" /></a>
              <a className="text-link" href="#advantages">Почему Butovsky <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-proof" aria-label="Условия тарифа">
              <span><Icon name="devices" /> до 20 устройств</span>
              <span><Icon name="infinity" /> безлимитный трафик</span>
              <span><Icon name="support" /> поддержка 24/7</span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-back" />
            <div className="orbit orbit-front" />
            <div className="orbit orbit-thin" />
            <div className="planet-shadow" />
            <div className="planet">
              <div className="planet-grid" />
              <div className="planet-shine" />
              <div className="planet-core-mark"><span /></div>
            </div>
            <div className="art-caption"><span className="caption-line" />PRIVATE BY DESIGN</div>
            <div className="orbit-point orbit-point-one" />
            <div className="orbit-point orbit-point-two" />
            <div className="art-coordinate">55°45′N<br />37°37′E</div>
          </div>

          <div className="hero-index"><span>01</span><i />ИНТЕРНЕТ — ТВОЁ ПРОСТРАНСТВО</div>
        </section>

        <div className="signal-strip" aria-label="Ключевые условия">
          <div><span className="strip-dot" />20 УСТРОЙСТВ</div>
          <div><span className="strip-dot" />БЕЗЛИМИТНЫЙ ТРАФИК</div>
          <div><span className="strip-dot" />ПОДДЕРЖКА 24/7</div>
          <div><span className="strip-dot" />БЕЗ РЕГИСТРАЦИИ НА САЙТЕ</div>
        </div>

        <section className="advantages-section section-wrap" id="advantages" aria-labelledby="advantages-title">
          <div className="section-heading">
            <div>
              <div className="eyebrow section-eyebrow">СВОБОДА В КАЖДОМ СОЕДИНЕНИИ</div>
              <h2 id="advantages-title">Меньше ограничений.<br /><span>Больше спокойствия.</span></h2>
            </div>
            <p>Всё необходимое для повседневного интернета — в одном понятном месячном тарифе.</p>
          </div>

          <div className="advantages-grid">
            {advantages.map((item) => (
              <article className="advantage-card" key={item.number}>
                <div className="card-topline"><span className="advantage-icon"><Icon name={item.icon} /></span><span className="card-number">{item.number}</span></div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="card-accent" aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="plans-section section-wrap" id="plans" aria-labelledby="plans-title">
          <div className="section-heading plans-heading">
            <div>
              <div className="eyebrow section-eyebrow">ПРОСТЫЕ УСЛОВИЯ. ЧЕСТНАЯ ЦЕНА.</div>
              <h2 id="plans-title">Выбирай свой<br /><span>уровень свободы.</span></h2>
            </div>
            <p>Один месяц. До 20 устройств. Безлимитный трафик и поддержка в любое время.</p>
          </div>

          <div className="plans-grid">
            {plans.map((plan, index) => (
              <article className={'plan-card' + (index === 1 ? ' plan-card-featured' : '')} key={plan.price}>
                <div className="plan-topline"><span>{plan.label}</span><span className="plan-symbol">0{index + 1}</span></div>
                <div className="plan-price"><span className="price-value">{plan.price}</span><span className="price-currency">₽</span><span className="price-period">/ 1 месяц</span></div>
                <p className="plan-summary">Всё нужное для приватного интернета — без регистрации.</p>
                <div className="plan-divider" />
                <ul className="plan-features">
                  <li><Icon name="check" /> До 20 устройств</li>
                  <li><Icon name="check" /> Безлимитный трафик</li>
                  <li><Icon name="check" /> Поддержка 24/7</li>
                </ul>
                <button className={'button plan-button' + (selectedPlan === plan.price ? ' is-selected' : '')} type="button" onClick={() => setSelectedPlan(plan.price)} aria-pressed={selectedPlan === plan.price}>
                  {selectedPlan === plan.price ? 'Тариф выбран' : 'Выбрать тариф'} <Icon name="arrow" />
                </button>
              </article>
            ))}
          </div>
          {selectedPlan !== null && (
            <div className="selection-note" role="status">
              <span className="selection-check"><Icon name="check" /></span>
              <p>Вы выбрали тариф <strong>{selectedPlan} ₽ / 1 месяц</strong>. Регистрация на сайте не нужна — сообщите этот вариант поддержке при подключении.</p>
            </div>
          )}
          <p className="pricing-footnote"><Icon name="lock" /> На сайте нет аккаунтов и формы регистрации. Условия подключения уточняйте у поддержки.</p>
        </section>

        <section className="privacy-section section-wrap" aria-labelledby="privacy-title">
          <div className="privacy-mark" aria-hidden="true"><div className="privacy-ring" /><div className="privacy-shield"><Icon name="shield" /></div><span className="privacy-spark privacy-spark-one" /><span className="privacy-spark privacy-spark-two" /></div>
          <div className="privacy-copy">
            <div className="eyebrow section-eyebrow">ПРИВАТНОСТЬ — ЭТО ПРАКТИКА</div>
            <h2 id="privacy-title">Твой трафик.<br /><span>Твой выбор.</span></h2>
            <p>VPN помогает защитить соединение в пути и уменьшить объём данных, доступных локальной сети. При этом VPN не делает пользователя полностью анонимным: сайты всё ещё могут узнавать вас по аккаунтам, cookies и другим настройкам.</p>
            <a className="text-link privacy-link" href="#faq">Подробнее — в вопросах <span aria-hidden="true">↓</span></a>
          </div>
          <div className="privacy-side-note"><span>01 / 03</span><i />ВАША ПРИВАТНОСТЬ — В ВАШИХ РУКАХ</div>
        </section>

        <section className="faq-section section-wrap" id="faq" aria-labelledby="faq-title">
          <div className="faq-intro">
            <div className="eyebrow section-eyebrow">КОРОТКО И ПО ДЕЛУ</div>
            <h2 id="faq-title">Остались<br /><span>вопросы?</span></h2>
            <p>Всё важное о тарифах и приватности — здесь.</p>
          </div>
          <div className="faq-list">
            <details className="faq-item" open>
              <summary>Нужно ли регистрироваться на сайте?<span className="faq-plus" aria-hidden="true" /></summary>
              <p>Нет. На сайте нет регистрации. Чтобы подключиться, выберите тариф и свяжитесь с поддержкой — она доступна 24/7.</p>
            </details>
            <details className="faq-item">
              <summary>Сколько устройств можно подключить?<span className="faq-plus" aria-hidden="true" /></summary>
              <p>До 20 устройств на один тариф: можно использовать телефон, компьютер, планшет и другие устройства.</p>
            </details>
            <details className="faq-item">
              <summary>Есть ли ограничение по трафику?<span className="faq-plus" aria-hidden="true" /></summary>
              <p>Нет, в обоих указанных тарифах трафик безлимитный.</p>
            </details>
            <details className="faq-item">
              <summary>VPN гарантирует полную анонимность?<span className="faq-plus" aria-hidden="true" /></summary>
              <p>Нет. VPN повышает приватность сетевого соединения, но сайты могут распознавать вас по входу в аккаунт, cookies и другим данным браузера. Не передавайте сервису больше личной информации, чем необходимо.</p>
            </details>
          </div>
        </section>

        <section className="closing-cta section-wrap" aria-label="Выбор тарифа">
          <div className="closing-orb" aria-hidden="true"><span /></div>
          <div className="closing-copy"><div className="eyebrow">BUTOVSKY VPN</div><h2>Подключайся.<br /><span>Оставайся собой.</span></h2></div>
          <a className="button button-primary" href="#plans">Выбрать тариф <Icon name="arrow" /></a>
        </section>
      </main>

      <footer className="site-footer section-wrap">
        <a className="brand footer-brand" href="#top" aria-label="Butovsky VPN — наверх"><span className="brand-mark" aria-hidden="true"><span /></span><span className="brand-name">BUTOVSKY<span>VPN</span></span></a>
        <p>Приватность начинается с выбора.</p>
        <span className="copyright">© {new Date().getFullYear()} BUTOVSKY VPN</span>
      </footer>
    </div>
  );
}

export default App;
