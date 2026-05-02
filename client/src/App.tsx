import { useEffect } from 'react';
import { loadFromFirestoreToLocal } from '@/lib/store';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MusicProvider } from "./contexts/MusicContext";
import { ReminderProvider } from "./contexts/ReminderContext";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import History from "./pages/History";
import DayMap from "./pages/DayMap";
import Patterns from "./pages/Patterns";
import Analytics from "./pages/Analytics";
import Weekly from "./pages/Weekly";
import Experiments from "./pages/Experiments";
import MoodCanvas from "./pages/MoodCanvas";
import ResetMind from "./pages/ResetMind";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
      <Route path="/history" component={History} />
      <Route path="/day-map" component={DayMap} />
      <Route path="/patterns" component={Patterns} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/weekly" component={Weekly} />
      <Route path="/experiments" component={Experiments} />
      <Route path="/mood-canvas" component={MoodCanvas} />
      <Route path="/reset-mind" component={ResetMind} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    // Load from Firebase on first open (cross-device sync)
    // Use a flag so we only reload once per session
    const syncedKey = 'parvaz-pulse-synced-session';
    if (!sessionStorage.getItem(syncedKey)) {
      sessionStorage.setItem(syncedKey, '1');
      loadFromFirestoreToLocal().then(loaded => {
        if (loaded) window.location.reload();
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <MusicProvider>
          <ReminderProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ReminderProvider>
        </MusicProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
