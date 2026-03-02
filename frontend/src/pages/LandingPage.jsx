import { Link } from 'react-router-dom';
import { FiMusic, FiShare2, FiList, FiPlay, FiHeadphones, FiLink, FiArrowRight, FiCheck, FiZap } from 'react-icons/fi';
import '../styles/landing.css';

const FEATURES = [
  {
    icon: <FiMusic />,
    title: 'Cross-Platform Playlists',
    desc: 'Twórz playlisty łączące utwory ze Spotify, SoundCloud i innych serwisów. Jedna playlista, wiele źródeł.',
  },
  {
    icon: <FiShare2 />,
    title: 'Share & Collaborate',
    desc: 'Udostępniaj swoje playlisty znajomym i twórzcie je razem — niezależnie od platformy.',
  },
  {
    icon: <FiList />,
    title: 'Smart Queue Management',
    desc: 'Zarządzaj kolejką odtwarzania z drag & drop. Dodawaj, usuwaj i zmieniaj kolejność w czasie rzeczywistym.',
  },
  {
    icon: <FiPlay />,
    title: 'Universal Player',
    desc: 'Jeden odtwarzacz do wszystkiego. Odtwarzaj muzykę z różnych serwisów bez przełączania aplikacji.',
  },
  {
    icon: <FiZap />,
    title: 'AI Discovery',
    desc: 'Sztuczna inteligencja analizuje Twoje playlisty i proponuje nowe utwory dopasowane do Twojego gustu.',
    isAi: true,
  },
  {
    icon: <FiHeadphones />,
    title: 'Multi-Service Support',
    desc: 'Połącz swoje konta Spotify i SoundCloud — więcej serwisów już wkrótce.',
  },
];

const STEPS = [
  {
    num: '1',
    icon: <FiLink />,
    title: 'Połącz swoje konta',
    desc: 'Zaloguj się i połącz konta Spotify, SoundCloud i więcej w jednym miejscu.',
  },
  {
    num: '2',
    icon: <FiMusic />,
    title: 'Twórz playlisty',
    desc: 'Wyszukuj utwory ze wszystkich platform i buduj międzyplatformowe playlisty.',
  },
  {
    num: '3',
    icon: <FiZap />,
    title: 'Odkrywaj muzykę',
    desc: 'Pozwól AI proponować Ci nowe utwory i rozszerzaj swoje muzyczne horyzonty.',
  },
];

const AI_MOCK_TRACKS = [
  { name: 'Midnight Echoes', artist: 'Luna Wave', match: '96%', coverClass: 'ai-mock-cover--1' },
  { name: 'Neon Dreams', artist: 'Synthex', match: '93%', coverClass: 'ai-mock-cover--2' },
  { name: 'Electric Sunset', artist: 'Nova Pulse', match: '89%', coverClass: 'ai-mock-cover--3' },
];

const LandingPage = () => {
  return (
    <div className="landing">
      {/* ── Hero ────────────────────────────── */}
      <section className="hero" id="hero">
        <div className="hero-orb hero-orb--green" />
        <div className="hero-orb hero-orb--purple" />
        <div className="hero-orb hero-orb--blue" />

        <div className="hero-content">
          <span className="hero-badge">🎵 All-in-one music platform</span>
          <h1>Your Music, One&nbsp;Hub</h1>
          <p className="hero-subtitle">
            Łącz playlisty ze Spotify, SoundCloud i&nbsp;innych serwisów.
            Odtwarzaj, udostępniaj i&nbsp;odkrywaj nową muzykę z&nbsp;pomocą AI&nbsp;— wszystko w&nbsp;jednym miejscu.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">
              Get Started <FiArrowRight />
            </Link>
            <Link to="/login" className="btn-secondary">
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────── */}
      <section className="landing-section text-center" id="features">
        <span className="section-label">Features</span>
        <h2>Everything you need,<br />in one place</h2>
        <p className="section-desc">
          Music Hub łączy Twoje ulubione serwisy muzyczne, dodając inteligentne
          narzędzia do odtwarzania, odkrywania i&nbsp;dzielenia się muzyką.
        </p>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              className={`feature-card${f.isAi ? ' feature-card--ai' : ''}`}
              key={i}
            >
              <div className={`feature-icon${f.isAi ? ' feature-icon--ai' : ''}`}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Discovery Highlight ──────────── */}
      <section className="ai-section" id="ai-discovery">
        <div className="ai-section-bg" />
        <div className="ai-section-inner">
          <div className="ai-text">
            <span className="section-label section-label--purple">Powered by AI</span>
            <h2>Discover music you'll&nbsp;love</h2>
            <p>
              Nasz moduł AI Discovery analizuje Twoje playlisty, historię odtwarzania
              i&nbsp;preferencje muzyczne, aby proponować utwory idealnie dopasowane do
              Twojego gustu.
            </p>
            <p>
              Znajdź ukryte perełki z&nbsp;różnych platform, odkryj nowych artystów
              i&nbsp;rozwijaj swój muzyczny świat — bez wysiłku.
            </p>
            <ul className="ai-features-list">
              <li>
                <span className="ai-check"><FiCheck /></span>
                Analiza nastroju i gatunków Twojej playlisty
              </li>
              <li>
                <span className="ai-check"><FiCheck /></span>
                Propozycje z wielu platform jednocześnie
              </li>
              <li>
                <span className="ai-check"><FiCheck /></span>
                Uczenie się na podstawie Twoich preferencji
              </li>
            </ul>
          </div>

          <div className="ai-visual">
            <div className="ai-visual-card">
              <div className="ai-card-header">
                <span className="ai-card-badge">AI Suggestions</span>
                <span className="ai-card-title">For your playlist</span>
              </div>
              {AI_MOCK_TRACKS.map((track, i) => (
                <div className="ai-mock-track" key={i}>
                  <div className={`ai-mock-cover ${track.coverClass}`} />
                  <div className="ai-mock-info">
                    <div className="ai-mock-name">{track.name}</div>
                    <div className="ai-mock-artist">{track.artist}</div>
                  </div>
                  <span className="ai-mock-match">{track.match}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────── */}
      <section className="landing-section text-center" id="how-it-works">
        <span className="section-label">How It Works</span>
        <h2>Get started in minutes</h2>
        <p className="section-desc">
          Trzy proste kroki, żeby zacząć korzystać z Music Hub.
        </p>

        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <div className="step-card" key={i}>
              <div className="step-number">
                <span>{step.num}</span>
              </div>
              <span className="step-icon">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="cta-section" id="cta">
        <div className="cta-content">
          <h2>Ready to unite your music?</h2>
          <p>
            Dołącz do Music Hub za darmo i&nbsp;zacznij tworzyć
            międzyplatformowe playlisty już dziś.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-primary">
              Sign Up Free <FiArrowRight />
            </Link>
            <Link to="/login" className="btn-secondary">
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="footer-logo">Music Hub</span>
          <span className="footer-copy">&copy; {new Date().getFullYear()} Music Hub. All rights reserved.</span>
          <div className="footer-links">
            <Link to="/register">Sign Up</Link>
            <Link to="/login">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
