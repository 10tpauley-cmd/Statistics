import { useEffect, type ReactNode } from 'react';
import * as fx from './lib/fx';
import { subscribe, getState } from './state/store';
import { useLocation, matchPath } from './lib/router';
import { useLearner } from './state/store';
import { setTutorFocus } from './state/tutor';
import { addStudyTime } from './state/actions';
import { CONCEPT_BY_ID } from './content/concepts';
import type { ConceptId } from './engine/types';
import { Layout } from './components/layout/Layout';
import { Toasts, Celebrations, SearchPalette } from './components/layout/Overlays';
import { MascotDock } from './components/mascot/MascotDock';
import { Dashboard } from './pages/Dashboard';
import { LearnPage } from './pages/Learn';
import { ConceptPage } from './pages/ConceptPage';
import { PracticePage } from './pages/Practice';
import { ReviewPage } from './pages/Review';
import { ExamCenter, ExamRunner } from './pages/Exams';
import { TeachPage } from './pages/Teach';
import { BossList, BossRun } from './pages/Boss';
import { PlacementPage } from './pages/Placement';
import { LabPage } from './pages/Lab';
import { CalculatorPage } from './pages/CalculatorPage';
import { FormulasPage } from './pages/Formulas';
import { GlossaryPage } from './pages/Glossary';
import { ConceptMapPage } from './pages/ConceptMap';
import { MistakesPage } from './pages/Mistakes';
import { SavedPage } from './pages/Saved';
import { ProgressPage } from './pages/Progress';
import { SettingsPage } from './pages/Settings';
import { PathwayPage } from './pages/pathway/PathwayPage';
import { PlayPage, QuickReviewPage, PathwayCompletePage } from './pages/pathway/PathwayRoutes';
import { Empty, LinkBtn } from './components/ui';

interface Route {
  pattern: string;
  name: string;
  render: (p: Record<string, string>, q: URLSearchParams, hrefKey: string) => ReactNode;
}

const ROUTES: Route[] = [
  { pattern: '/', name: 'Dashboard', render: () => <Dashboard /> },
  { pattern: '/pathway', name: 'The Pathway', render: () => <PathwayPage /> },
  { pattern: '/pathway/play/:id', name: 'The Pathway', render: (p, _q, k) => <PlayPage key={k} id={p.id} /> },
  { pattern: '/pathway/review/:concept', name: 'Quick review', render: (p, q, k) => <QuickReviewPage key={k} concept={p.concept} query={q} /> },
  { pattern: '/pathway/complete', name: 'Journey complete', render: () => <PathwayCompletePage /> },
  { pattern: '/learn', name: 'Course path', render: () => <LearnPage /> },
  { pattern: '/learn/:id', name: 'Lesson', render: (p) => (CONCEPT_BY_ID[p.id as ConceptId] ? <ConceptPage key={p.id} id={p.id as ConceptId} /> : <NotFound />) },
  { pattern: '/practice', name: 'Practice', render: (_p, q, k) => <PracticePage key={k} query={q} /> },
  { pattern: '/review', name: 'Daily review', render: () => <ReviewPage /> },
  { pattern: '/exam', name: 'Exam center', render: () => <ExamCenter /> },
  { pattern: '/exam/:scope', name: 'Exam', render: (p, q, k) => <ExamRunner key={k} scope={p.scope} query={q} /> },
  { pattern: '/teach', name: 'Teach It', render: (_p, q, k) => <TeachPage key={k} query={q} /> },
  { pattern: '/boss', name: 'Boss battles', render: () => <BossList /> },
  { pattern: '/boss/:id', name: 'Boss battle', render: (p) => <BossRun key={p.id} id={p.id} /> },
  { pattern: '/placement', name: 'Placement test', render: () => <PlacementPage /> },
  { pattern: '/lab', name: 'Simulation lab', render: (_p, q) => <LabPage query={q} /> },
  { pattern: '/calculator', name: 'Calculator', render: (_p, q) => <CalculatorPage query={q} /> },
  { pattern: '/formulas', name: 'Formula sheet', render: (_p, q) => <FormulasPage query={q} /> },
  { pattern: '/glossary', name: 'Glossary', render: (_p, q) => <GlossaryPage query={q} /> },
  { pattern: '/map', name: 'Concept map', render: () => <ConceptMapPage /> },
  { pattern: '/mistakes', name: 'Mistake bank', render: (_p, q) => <MistakesPage query={q} /> },
  { pattern: '/saved', name: 'Saved & notes', render: (_p, q) => <SavedPage query={q} /> },
  { pattern: '/progress', name: 'Progress', render: () => <ProgressPage /> },
  { pattern: '/settings', name: 'Settings', render: () => <SettingsPage /> },
];

function NotFound() {
  return (
    <div className="content narrow">
      <Empty icon="🧭" title="Page not found" action={<LinkBtn to="/" className="btn primary">Back to dashboard</LinkBtn>}>That link doesn't lead anywhere in Stat Lab.</Empty>
    </div>
  );
}

/** Rendered before the page so pages can refine the tutor focus in their own effects. */
function RouteFocus({ name, path }: { name: string; path: string }) {
  useEffect(() => {
    setTutorFocus({ page: name, concept: undefined, question: undefined });
    document.title = `${name} · Stat Lab`;
  }, [name, path]);
  return null;
}

function useTheme() {
  const { theme, reducedMotion, fontScale } = useLearner().settings;
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = theme;
    if (reducedMotion) root.dataset.motion = 'reduced';
    else delete root.dataset.motion;
    root.style.setProperty('--font-scale', String(fontScale || 1));
  }, [theme, reducedMotion, fontScale]);
}

/** Counts study time only while the tab is visible and the learner has been active recently. */
function useStudyHeartbeat() {
  useEffect(() => {
    let last = Date.now();
    const mark = () => (last = Date.now());
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove'] as const;
    evs.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const TICK = 15000;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - last < 90000) addStudyTime(TICK);
    }, TICK);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, mark));
      window.clearInterval(t);
    };
  }, []);
}

/** Press feedback on every control, and a pulse on the XP pill whenever XP is earned. */
function useGlobalFx() {
  useEffect(() => {
    const off = fx.installClickFx();
    let xp = getState().xp;
    let streak = getState().streak.current;
    const unsub = subscribe(() => {
      const st = getState();
      if (st.xp > xp) fx.pulse(document.querySelector('[data-xp-pill]'));
      if (st.streak.current > streak && streak >= 0) {
        const pill = document.querySelector('[data-streak-pill]');
        fx.pulse(pill);
        fx.burst(pill, { count: 10, glyphs: ['🔥'], spread: 60, size: 14 });
        fx.float(pill, `🔥 ${st.streak.current}-day streak!`, 'gold');
      }
      xp = st.xp;
      streak = st.streak.current;
    });
    return () => { off(); unsub(); };
  }, []);
}

export function App() {
  const { path, query, href } = useLocation();
  useTheme();
  useStudyHeartbeat();
  useGlobalFx();
  let page: ReactNode = <NotFound />;
  let name = 'Not found';
  for (const r of ROUTES) {
    const params = matchPath(r.pattern, path);
    if (params) {
      page = r.render(params, query, href);
      name = r.name === 'Lesson' && CONCEPT_BY_ID[params.id as ConceptId] ? `Lesson: ${CONCEPT_BY_ID[params.id as ConceptId].title}` : r.name;
      break;
    }
  }
  return (
    <>
      <Layout>
        <RouteFocus name={name} path={path} />
        {page}
      </Layout>
      <SearchPalette />
      <Toasts />
      <Celebrations />
      <MascotDock />
    </>
  );
}
