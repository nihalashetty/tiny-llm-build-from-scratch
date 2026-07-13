import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Sidebar } from './ui/components/Sidebar';
import { ProgressProvider } from './ui/progress';
import { chapterById } from './content/curriculum';
import { chapterComponents } from './ui/chapters/registry';
import { ComingSoon } from './ui/chapters/ComingSoon';

/** Scroll the reading pane back to the top whenever the chapter changes. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById('reading')?.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

/** Resolve :id to a real chapter, its page, or the coming-soon fallback. */
function ChapterRoute() {
  const { id } = useParams();
  const ch = chapterById(id);
  if (!ch) return <Navigate to="/c/prologue" replace />;
  const Comp = chapterComponents[ch.id];
  return Comp ? <Comp /> : <ComingSoon id={ch.id} />;
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <ProgressProvider>
      <div className={`app${navOpen ? ' nav-open' : ''}`}>
        <button
          className="menu-toggle"
          onClick={() => setNavOpen((o) => !o)}
          aria-label="Toggle chapter menu"
        >
          ☰
        </button>
        <div className="scrim" onClick={() => setNavOpen(false)} />

        <Sidebar onNavigate={() => setNavOpen(false)} />

        <main className="reading" id="reading">
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Navigate to="/c/prologue" replace />} />
            <Route path="/c/:id" element={<ChapterRoute />} />
            <Route path="*" element={<Navigate to="/c/prologue" replace />} />
          </Routes>
        </main>
      </div>
    </ProgressProvider>
  );
}
