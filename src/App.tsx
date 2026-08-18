import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './ui/components/Sidebar';
import { ProgressProvider } from './ui/progress';
import { chapterById } from './content/curriculum';
import { chapterComponents } from './ui/chapters/registry';
import { ComingSoon } from './ui/chapters/ComingSoon';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';

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
      <TooltipProvider delayDuration={200}>
        <div className="flex h-screen overflow-hidden bg-background">
          <Button
            variant="outline"
            size="icon"
            className="fixed top-3.5 left-3.5 z-50 shadow-sm lg:hidden"
            onClick={() => setNavOpen((o) => !o)}
            aria-label="Toggle chapter menu"
          >
            <Menu />
          </Button>

          {navOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setNavOpen(false)}
            />
          )}

          <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />

          <main className="min-w-0 flex-1 overflow-y-auto scroll-smooth" id="reading">
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Navigate to="/c/prologue" replace />} />
              <Route path="/c/:id" element={<ChapterRoute />} />
              <Route path="*" element={<Navigate to="/c/prologue" replace />} />
            </Routes>
          </main>
        </div>
      </TooltipProvider>
    </ProgressProvider>
  );
}
