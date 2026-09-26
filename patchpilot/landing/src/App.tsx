import { useEffect, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

const EASE = [0.25, 1, 0.5, 1] as const;

const Logo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const Arrow = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <motion.nav
      className={`nav${scrolled ? ' scrolled' : ''}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="container nav-inner">
        <a className="brand" href="/">
          <span className="logo" aria-hidden><Logo /></span>
          PatchPilot
        </a>
        <div className="nav-links">
          <a href="#how" className="hide-sm">How it works</a>
          <a href="#features" className="hide-sm">Features</a>
          <a href="/app" className="hide-sm">Console</a>
          <a href="/login">Sign in</a>
          <a href="/register" className="btn btn-nav">Get started</a>
        </div>
      </div>
    </motion.nav>
  );
}

function Hero({ reduce }: { reduce: boolean }) {
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  };
  const barGrow = (h: number) =>
    reduce ? { height: h } : { height: [8, h] };

  return (
    <motion.header className="hero container" variants={container} initial="hidden" animate="show">
      <motion.span className="eyebrow" variants={item}>Built with IBM Bob 2.0</motion.span>
      <motion.h1 className="h1" variants={item}>
        Dependency upgrades<br />
        <span className="muted">that don't break your build.</span>
      </motion.h1>
      <motion.p className="lede" variants={item}>
        Dependabot bumps a version and walks away. PatchPilot fixes the breaking changes across
        your whole repo, verifies them, and opens a merge-ready pull request.
      </motion.p>
      <motion.div className="hero-actions" variants={item}>
        <motion.a href="/register" className="btn btn-primary btn-lg" whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={reduce ? undefined : { scale: 0.97 }}>Get started free</motion.a>
        <motion.a href="/app" className="btn btn-lg" whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={reduce ? undefined : { scale: 0.97 }}>See it run</motion.a>
      </motion.div>

      <motion.div
        className="mock"
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
      >
        <div className="mock-bar">
          <span className="d" style={{ background: '#ff5f57' }} />
          <span className="d" style={{ background: '#febc2e' }} />
          <span className="d" style={{ background: '#28c840' }} />
          <span className="t">patchpilot run · express 4 → 5</span>
        </div>
        <div className="mock-body">
          <div className="mock-lane">
            <div className="lab">Before</div>
            <div className="track"><motion.div className="bar" style={{ background: '#ff375f' }} initial={{ height: 8 }} animate={{ height: 8 }} /></div>
            <div className="num" style={{ color: '#ff375f' }}>0</div>
            <div className="cap">tests passing</div>
          </div>
          <div className="mock-arrow" aria-hidden><Arrow /></div>
          <div className="mock-lane">
            <div className="lab">After</div>
            <div className="track">
              <motion.div className="bar" style={{ background: 'var(--live)' }} initial={{ height: 8 }} animate={barGrow(72)} transition={{ duration: 0.7, ease: EASE, delay: 0.9 }} />
            </div>
            <motion.div className="num" style={{ color: '#0a7d47' }} initial={{ opacity: reduce ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>11</motion.div>
            <div className="cap">tests passing</div>
          </div>
          <motion.div style={{ flex: 1, minWidth: 130, textAlign: 'center' }} initial={{ opacity: reduce ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <span className="pill-ok"><span className="dot" />Merge-ready</span>
            <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-3)' }} className="tnum">9 fixes · 3 modules · ~6s</div>
          </motion.div>
        </div>
      </motion.div>
    </motion.header>
  );
}

function Reveal({ children, className, delay = 0, id }: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={id}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.section>
  );
}

const STEPS = [
  ['01', 'Scan the whole repo', 'Full-repository context maps every place the dependency is used — not just the file you have open.'],
  ['02', 'Fix in parallel', 'A subagent per module applies the migration and self-heals against its own tests, all at once.'],
  ['03', 'Verify the build', "Tests or type-checks gate every change. What can't be fixed safely is flagged, never faked green."],
  ['04', 'Open the PR', 'A merge-ready pull request lands with migration notes and a before/after report attached.'],
];

const FEATURES: [React.ReactNode, string, string][] = [
  [<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z M12 12l8-4.5 M12 12v9 M12 12L4 7.5" />, 'Agentic remediation', "It changes the code to match the new API — it doesn't just tell you what's wrong."],
  [<><rect x="3" y="4" width="7" height="7" rx="1.5" /><rect x="14" y="4" width="7" height="7" rx="1.5" /><rect x="3" y="15" width="7" height="5" rx="1.5" /><rect x="14" y="15" width="7" height="5" rx="1.5" /></>, 'Parallel subagents', 'Each module is isolated and fixed concurrently, so a monorepo upgrade takes seconds, not an afternoon.'],
  [<path d="M20 6L9 17l-5-5" />, 'Verified & merge-ready', 'Every run ends on a green build or an honest flag. No PRs that break the moment you merge them.'],
  [<path d="M4 6h16M4 12h16M4 18h10" />, 'Works on real repos', 'Point it at a sample project or your production monorepo — config picks the module layout and verify command.'],
];

export default function App() {
  const reduce = useReducedMotion() ?? false;
  return (
    <>
      <Nav />
      <Hero reduce={reduce} />

      <main className="container">
        <Reveal className="section read">
          <div className="panel stats">
            <div className="s"><div className="n accent tnum">95%</div><div className="l">less time per upgrade</div></div>
            <div className="s"><div className="n tnum">0 → 11</div><div className="l">tests red to green</div></div>
            <div className="s"><div className="n tnum">1 PR</div><div className="l">reviewed, not written</div></div>
          </div>
        </Reveal>

        <Reveal className="section read" id="how">
          <div className="section-head">
            <h2 className="h2">From broken bump to merge-ready</h2>
            <p className="sub">One command runs the whole pipeline — no babysitting.</p>
          </div>
          <div className="panel rows">
            {STEPS.map(([idx, title, desc]) => (
              <div className="row" key={idx}>
                <span className="idx">{idx}</span>
                <div><div className="rt">{title}</div><div className="rd">{desc}</div></div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="section read" id="features">
          <div className="section-head">
            <h2 className="h2">Not another linter</h2>
            <p className="sub">Detection is a solved problem. PatchPilot does the remediation.</p>
          </div>
          <div className="panel rows">
            {FEATURES.map(([icon, title, desc]) => (
              <div className="row" key={title}>
                <span className="ico" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                </span>
                <div><div className="rt">{title}</div><div className="rd">{desc}</div></div>
              </div>
            ))}
          </div>
        </Reveal>
      </main>

      <Reveal className="section container read">
        <div className="cta">
          <motion.span className="orb" style={{ width: 280, height: 280, background: '#8ab6ff', top: -90, left: -60 }} animate={reduce ? undefined : { x: [0, 20, 0], y: [0, 14, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span className="orb" style={{ width: 240, height: 240, background: '#b39cff', bottom: -90, right: -40 }} animate={reduce ? undefined : { x: [0, -18, 0], y: [0, -12, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
          <h2>Stop babysitting dependency PRs.</h2>
          <p>Let PatchPilot do the upgrade, fix the fallout, and prove it still works.</p>
          <div className="cta-actions">
            <motion.a href="/register" className="btn btn-white btn-lg" whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={reduce ? undefined : { scale: 0.97 }}>Get started free</motion.a>
            <motion.a href="/app" className="btn btn-glass btn-lg" whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={reduce ? undefined : { scale: 0.97 }}>Watch a live run</motion.a>
          </div>
        </div>
      </Reveal>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© 2026 PatchPilot · Built with IBM Bob 2.0</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <a href="/login">Sign in</a>
            <a href="/register">Get started</a>
            <a href="/app">Console</a>
          </span>
        </div>
      </footer>
    </>
  );
}
