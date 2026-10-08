import React from 'react';
import './main_styles.css';

function MainWeb() {
  return (
    <div className="main-container">
      <nav className="main-nav">
        <a className="nav-logo" href="#top" aria-label="Butovsky — на главную">
          <span className="logo-mark"><i class='bx bx-code-alt'></i></span>
          <span>butovsky<span className="logo-dot">.</span></span>
        </a>
        <div className="nav-links">
          <a href="#vpn"><i class='bx bx-lock-alt'></i> VPN</a>
          <a href="#esim"><i class='bx bx-memory-card'></i> eSIM</a>
          <a href="#hosting"><i class='bx bx-server'></i> Хостинг</a>
          <a href="#about">О нас</a>
          <button className="nav-btn" type="button">Личный кабинет <i className="bx bx-right-arrow-alt" /></button>
        </div>
      </nav>

      <header className="hero-section" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-kicker"><span className="status-dot" /> ВАША ЦИФРОВАЯ СВОБОДА</div>
          <h1>Безопасность<br />и свобода <span className="title-gradient">в цифровом мире</span></h1>
          <p>Комплексные решения для защиты вашей конфиденциальности, путешествий без границ и надежного хостинга.</p>
          <div className="hero-buttons">
            <a className="btn-primary" href="#products">Начать сейчас <i className="bx bx-right-arrow-alt" /></a>
            <a className="btn-secondary" href="#about">Узнать больше</a>
          </div>
          <div className="hero-proof"><span className="proof-avatars"><i className="bx bx-user" /><i className="bx bx-user" /><i className="bx bx-user" /></span><span>Свобода в сети — на ваших условиях</span></div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="visual-glow" />
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
          <div className="orbit-dot orbit-dot-one" /><div className="orbit-dot orbit-dot-two" />
          <div className="security-orb">
            <div className="orb-rim" /><div className="orb-shine" />
            <div className="orb-shield"><svg viewBox="0 0 64 72" fill="none"><path d="M32 4 56 13v19c0 16-10 27-24 36C18 59 8 48 8 32V13L32 4Z" fill="url(#shieldFill)" stroke="rgba(255,255,255,.78)" strokeWidth="1.5"/><path d="m22 35 7 7 14-16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="shieldFill" x1="12" y1="10" x2="52" y2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#9BFCFF"/><stop offset="1" stopColor="#3774FF"/></linearGradient></defs></svg></div>
          </div>
          <div className="floating-card card-encrypted"><span className="float-icon"><i className="bx bx-lock-alt" /></span><span><strong>Ваши данные</strong><small>под защитой</small></span><span className="float-check"><i className="bx bx-check" /></span></div>
          <div className="floating-card card-global"><span className="global-icon"><i className="bx bx-globe" /></span><span><strong>Без границ</strong><small>в любой точке мира</small></span></div>
          <div className="visual-caption"><span className="caption-line" /> PRIVATE BY DESIGN</div>
        </div>
        <a className="hero-scroll" href="#products"><span /> ЛИСТАЙТЕ НИЖЕ</a>
      </header>

      <section id="products" className="products-section">
        <div className="section-header">
          <span className="section-eyebrow">ОДНА ЭКОСИСТЕМА — БОЛЬШЕ ВОЗМОЖНОСТЕЙ</span>
          <h2>Ваш интернет.<br /><span className="title-gradient">Ваши правила.</span></h2>
          <p>Выберите решение, которое подходит именно вам</p>
        </div>

        <div id="vpn" className="product-card vpn-product">
          <div className="product-icon"><i className="bx bx-shield-quarter" /><span className="icon-orbit" /></div>
          <div className="product-content">
            <div className="product-heading"><span className="product-label">01 / PRIVACY</span><h3>Butovsky VPN</h3></div>
            <p className="product-description">Надежное шифрование вашего интернет-трафика и IP-адреса для защиты от мошенников и обеспечения конфиденциальности в сети. Простое и эффективное решение для безопасного использования интернета.</p>
            <ul className="product-features">
              <li><i className="bx bx-check-circle" /> Шифрование AES-256</li><li><i className="bx bx-check-circle" /> Защита от утечек DNS</li><li><i className="bx bx-check-circle" /> Без логов активности</li><li><i className="bx bx-check-circle" /> Поддержка всех устройств</li>
            </ul>
            <div className="product-pricing"><div className="price-option"><span className="price">150₽<small> / мес</small></span><span className="price-label">Месячный план</span></div><div className="price-option popular"><span className="price">250₽<small> / 2 месяца</small></span><span className="price-label">Годовой план</span><span className="badge">ПОПУЛЯРНЫЙ</span></div></div>
            <a href="https://web.telegram.org/k/#@Butovsky_VPN_robot" className="btn-primary product-btn" target="_blank" rel="noopener noreferrer">Подключить VPN <i className="bx bx-right-arrow-alt" /></a>
          </div>
          <span className="card-index">01</span>
        </div>

        <div id="esim" className="product-card esim-product">
          <div className="product-icon"><i className="bx bx-globe" /><span className="icon-orbit" /></div>
          <div className="product-content">
            <div className="product-heading"><span className="product-label">02 / TRAVEL</span><h3>Butovsky eSIM</h3></div>
            <p className="product-description">Путешествуйте по всему миру без роуминга! Мгновенная активация eSIM в более чем 190 странах. Выгодные тарифы на мобильный интернет и звонки за границей.</p>
            <ul className="product-features"><li><i className="bx bx-check-circle" /> 190+ стран покрытия</li><li><i className="bx bx-check-circle" /> Мгновенная активация</li><li><i className="bx bx-check-circle" /> Гибкие тарифы</li><li><i className="bx bx-check-circle" /> Работает на современных смартфонах</li></ul>
            <div className="product-pricing"><div className="price-option"><span className="price">от 200₽</span><span className="price-label">За 1 ГБ данных</span></div><div className="price-option"><span className="price">до 800₽</span><span className="price-label">Неограниченный пакет</span></div></div>
            <a href="https://web.telegram.org/k/#@Butovsky_Esim_robot" className="btn-primary product-btn" target="_blank" rel="noopener noreferrer">Подключить VPN <i className="bx bx-right-arrow-alt" /></a>
          </div>
          <span className="card-index">02</span>
        </div>

        <div id="hosting" className="product-card hosting-product">
          <div className="product-icon"><i className="bx bx-server" /><span className="icon-orbit" /></div>
          <div className="product-content">
            <div className="product-heading"><span className="product-label">03 / PERFORMANCE</span><h3>Butovsky Hosting</h3></div>
            <p className="product-description">Надежный хостинг для ваших проектов. Идеально подходит для размещения VPN-серверов, веб-сайтов, приложений или любых других задач. Высокая производительность и uptime 99.9%.</p>
            <ul className="product-features"><li><i className="bx bx-check-circle" /> SSD накопители</li><li><i className="bx bx-check-circle" /> DDoS защита</li><li><i className="bx bx-check-circle" /> 24/7 поддержка</li><li><i className="bx bx-check-circle" /> Панель управления</li></ul>
            <div className="product-pricing"><div className="price-option"><span className="price">299₽<small> / мес</small></span><span className="price-label">Базовый · 1 vCPU, 1 GB RAM</span></div><div className="price-option popular"><span className="price">599₽<small> / мес</small></span><span className="price-label">Про · 2 vCPU, 4 GB RAM</span><span className="badge">РЕКОМЕНДУЕМ</span></div><div className="price-option"><span className="price">999₽<small> / мес</small></span><span className="price-label">Премиум · 4 vCPU, 8 GB RAM</span></div></div>
            <a href="https://web.telegram.org/k/#@Butovsky_Host_robot" className="btn-primary product-btn" target="_blank" rel="noopener noreferrer">Подключить VPN <i className="bx bx-right-arrow-alt" /></a>
          </div>
          <span className="card-index">03</span>
        </div>
      </section>

      <section id="about" className="advantages-section">
        <div className="advantages-inner">
          <div className="section-header advantages-heading"><span className="section-eyebrow">ТЕХНОЛОГИИ, КОТОРЫМ МОЖНО ДОВЕРЯТЬ</span><h2>Свобода — это<br /><span className="title-gradient">спокойствие.</span></h2></div>
          <div className="advantages-grid">
            <div className="advantage-item"><span className="advantage-number">01</span><i className="bx bx-lock-alt" /><h4>Безопасность</h4><p>Современные технологии шифрования для защиты ваших данных</p></div>
            <div className="advantage-item"><span className="advantage-number">02</span><i className="bx bx-bolt-circle" /><h4>Скорость</h4><p>Высокая скорость соединения без ограничений</p></div>
            <div className="advantage-item"><span className="advantage-number">03</span><i className="bx bx-headphone" /><h4>Поддержка 24/7</h4><p>Наша команда всегда готова помочь вам</p></div>
            <div className="advantage-item"><span className="advantage-number">04</span><i className="bx bx-diamond" /><h4>Честные цены</h4><p>Качественные услуги по понятной стоимости</p></div>
          </div>
        </div>
      </section>

      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-brand"><a className="nav-logo" href="#top"><span className="logo-mark"><i class='bx bx-code-alt'></i></span><span>butovsky<span className="logo-dot">.</span></span></a><p>Ваш надежный партнер<br />в цифровом мире.</p></div>
          <div className="footer-section"><h4>Продукты</h4><a href="#vpn"><i class='bx bx-lock-alt'></i> VPN</a><a href="#esim"><i class='bx bx-memory-card'></i> eSIM</a><a href="#hosting"><i class='bx bx-server'></i> Хостинг</a></div>
          <div className="footer-section"><h4>Связаться</h4><p>Telegram: @butovskysup</p></div>
          <div className="footer-note"><span className="status-dot" /> ВЫ В БЕЗОПАСНОСТИ</div>
        </div>
        <div className="footer-bottom"><span>© 2026 Butovsky. Все права защищены.</span><a href="#top">Наверх ↑</a></div>
      </footer>
    </div>
  );
}

export default MainWeb;
