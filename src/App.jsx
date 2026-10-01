import {
  useEffect,
  useState
} from 'react';

import {
  Navigate,
  Route,
  Routes
} from 'react-router-dom';

import Navbar from './components/Navbar';

import DashboardPage from './pages/DashboardPage';
import ProjectMasterPage from './pages/ProjectMasterPage';
import BusinessPartnerPage from './pages/BusinessPartnerPage';
import ProjectPhasesPage from './pages/ProjectPhasesPage';
import ResourceMasterPage from './pages/ResourceMasterPage';
import ResourceAllocationPage from './pages/ResourceAllocationPage';
import ProjectPlanPage from './pages/ProjectPlanPage';
import ProjectFIPage from './pages/ProjectFIPage';

/* =========================================================
   API RESPONSE HELPER
========================================================= */

const readJsonResponse = async (
  response,
  fallbackMessage
) => {
  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result.error ||
      fallbackMessage
    );
  }

  return result;
};

/* =========================================================
   LOGIN SCREEN
========================================================= */

function LoginScreen({
  onLogin
}) {
  const [login, setLogin] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(
        '/api/auth/login',
        {
          method: 'POST',

          credentials: 'same-origin',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            login: login.trim(),
            password
          })
        }
      );

      const result =
        await readJsonResponse(
          response,
          'Login failed.'
        );

      if (
        result.success !== true ||
        !result.user
      ) {
        throw new Error(
          'Login failed.'
        );
      }

      setPassword('');

      onLogin(result.user);

    } catch (requestError) {
      setError(
        requestError.message ||
        'Unable to log in.'
      );

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f3f6f9'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow:
            '0 8px 30px rgba(0, 0, 0, 0.08)'
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: '8px'
          }}
        >
          PPBMA
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: '28px',
            color: '#64748b'
          }}
        >
          Planning and Project Baseline
          Management Application
        </p>

        <h2
          style={{
            marginBottom: '20px'
          }}
        >
          Sign in
        </h2>

        <form
          onSubmit={handleSubmit}
        >
          <div
            style={{
              marginBottom: '16px'
            }}
          >
            <label
              htmlFor="login"
              style={{
                display: 'block',
                marginBottom: '6px'
              }}
            >
              Username or email
            </label>

            <input
              id="login"
              type="text"
              autoComplete="username"
              value={login}
              onChange={(event) => {
                setLogin(
                  event.target.value
                );
              }}
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '11px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div
            style={{
              marginBottom: '20px'
            }}
          >
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '6px'
              }}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );
              }}
              required
              disabled={submitting}
              style={{
                width: '100%',
                padding: '11px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: '#b91c1c',
                marginBottom: '16px'
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              cursor:
                submitting
                  ? 'wait'
                  : 'pointer'
            }}
          >
            {submitting
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   APPLICATION
========================================================= */

function App() {
  const [user, setUser] =
    useState(null);

  const [
    checkingSession,
    setCheckingSession
  ] = useState(true);

  const [
    sessionError,
    setSessionError
  ] = useState('');

  const [
    sessionCheckVersion,
    setSessionCheckVersion
  ] = useState(0);

  const [
    loggingOut,
    setLoggingOut
  ] = useState(false);

  const [
    logoutError,
    setLogoutError
  ] = useState('');

  /* =======================================================
     RESTORE EXISTING AUTHENTICATION SESSION
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      setCheckingSession(true);
      setSessionError('');

      try {
        const response = await fetch(
          '/api/auth/me',
          {
            credentials: 'same-origin',
            cache: 'no-store'
          }
        );

        if (response.status === 401) {
          if (!cancelled) {
            setUser(null);
          }

          return;
        }

        const result =
          await readJsonResponse(
            response,
            'Failed to check your session.'
          );

        if (!cancelled) {
          setUser(
            result.user || null
          );
        }

      } catch (error) {
        if (!cancelled) {
          setSessionError(
            error.message ||
            'Unable to check your session.'
          );
        }

      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [sessionCheckVersion]);

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin = (
    authenticatedUser
  ) => {
    setSessionError('');
    setLogoutError('');

    setUser(
      authenticatedUser
    );
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setLogoutError('');

    try {
      const csrfResponse =
        await fetch(
          '/api/auth/csrf-token',
          {
            credentials: 'same-origin',
            cache: 'no-store'
          }
        );

      const csrfResult =
        await readJsonResponse(
          csrfResponse,
          'Failed to retrieve logout protection token.'
        );

      if (
        typeof csrfResult.csrfToken !==
          'string' ||
        !csrfResult.csrfToken
      ) {
        throw new Error(
          'Unable to retrieve a valid logout protection token.'
        );
      }

      const response = await fetch(
        '/api/auth/logout',
        {
          method: 'POST',

          credentials: 'same-origin',

          headers: {
            'X-CSRF-Token':
              csrfResult.csrfToken
          }
        }
      );

      await readJsonResponse(
        response,
        'Logout failed.'
      );

      setUser(null);

    } catch (error) {
      setLogoutError(
        error.message ||
        'Unable to log out.'
      );

    } finally {
      setLoggingOut(false);
    }
  };

  /* =======================================================
     LOADING SCREEN
  ======================================================= */

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <p>
          Checking your session...
        </p>
      </div>
    );
  }

  /* =======================================================
     SESSION CHECK ERROR
  ======================================================= */

  if (sessionError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}
      >
        <p role="alert">
          {sessionError}
        </p>

        <button
          type="button"
          onClick={() => {
            setSessionCheckVersion(
              (version) => version + 1
            );
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  /* =======================================================
     UNAUTHENTICATED VIEW
  ======================================================= */

  if (!user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
      />
    );
  }

  /* =======================================================
     AUTHENTICATED APPLICATION
  ======================================================= */

  return (
    <div className="app-shell">

      <Navbar
        user={user}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <main className="app-main">

        {logoutError && (
          <p
            role="alert"
            style={{
              margin: '12px 20px',
              color: '#b91c1c'
            }}
          >
            {logoutError}
          </p>
        )}

        <Routes>

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />

          <Route
            path="/projects"
            element={
              <ProjectMasterPage />
            }
          />

          <Route
            path="/business-partners"
            element={
              <BusinessPartnerPage />
            }
          />

          <Route
            path="/project-phases"
            element={
              <ProjectPhasesPage />
            }
          />

          <Route
            path="/resource-master"
            element={
              <ResourceMasterPage />
            }
          />

          <Route
            path="/resource-allocation"
            element={
              <ResourceAllocationPage />
            }
          />

          <Route
            path="/project-plan"
            element={
              <ProjectPlanPage />
            }
          />

          <Route
            path="/project-fi"
            element={
              <ProjectFIPage />
            }
          />

        </Routes>

      </main>

    </div>
  );
}

export default App;