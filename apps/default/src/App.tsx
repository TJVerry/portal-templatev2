import { lazy } from 'react';
import { useAuth } from 'react-oidc-context';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { BrandStyles } from '@/components/brand/BrandStyles';
import { SUPPORT_EMAIL } from '@/config';
import { GenesisSection } from '@/lib/genesis';
import { GenesisAuth } from '@/lib/genesis-auth';
import { Loader2 } from '@/lib/icons';

/**
 * Pages are `React.lazy`-imported so one failed chunk cannot block the shell.
 * Add a sibling entry here for every new file in `src/pages/`.
 */
const SignInPage = lazy(() => import('@/pages/SignInPage'));
const PortalPage = lazy(() => import('@/pages/PortalPage'));

/**
 * True only inside the Taskade editor's preview pane (Taskade's own preview host, opened
 * with a preview token by a workspace member). There the owner sees the portal without
 * signing in as a church. Never true on the published app or a custom domain.
 */
function isEditorPreview(): boolean {
  if (!window.location.hostname.startsWith('genesis-preview.')) return false;
  try {
    return (
      new URLSearchParams(window.location.search).has('accessToken') ||
      window.sessionStorage.getItem('director-preview-access-token') != null ||
      /(?:^|;\s*)director-preview-access-token=/.test(document.cookie)
    );
  } catch {
    return false;
  }
}

/** Shows the portal only to a signed-in church; everyone else gets the sign-in page. */
function Gate() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="ff-spin" style={{ width: 32, height: 32, color: 'var(--ff-orange)' }} />
      </div>
    );
  }

  const email = auth.user?.profile.email;
  if ((!auth.isAuthenticated || email == null || email === '') && isEditorPreview()) {
    return (
      <GenesisSection name="Portal preview">
        <PortalPage email={SUPPORT_EMAIL} name="Preview" />
      </GenesisSection>
    );
  }
  if (!auth.isAuthenticated || email == null || email === '') {
    return (
      <GenesisSection name="Sign in">
        <SignInPage />
      </GenesisSection>
    );
  }

  return (
    <GenesisSection name="Portal">
      <PortalPage email={email} name={auth.user?.profile.name ?? null} />
    </GenesisSection>
  );
}

/**
 * The app shell: auth, router, and routes ONLY.
 * Every route sits behind sign-in. Tabs live inside the portal page.
 */
export default function App() {
  return (
    <GenesisAuth>
      <BrowserRouter>
        <main className="ff">
          <BrandStyles />
          <Routes>
            <Route path="*" element={<Gate />} />
          </Routes>
        </main>
      </BrowserRouter>
    </GenesisAuth>
  );
}
