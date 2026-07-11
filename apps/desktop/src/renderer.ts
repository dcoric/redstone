import './index.css';
import type { DesktopSession } from './contracts';

const rootElement = document.querySelector<HTMLDivElement>('#app');
if (!rootElement) throw new Error('App root not found');
const root: HTMLDivElement = rootElement;

function renderLogin(message = ''): void {
  root.innerHTML = `
    <main class="login-shell">
      <form class="login-card" id="login-form">
        <div class="brand-mark">R</div>
        <h1>Redstone</h1>
        <p>Sign in to your desktop vault</p>
        <label>Email<input id="email" type="email" autocomplete="email" required /></label>
        <label>Password<input id="password" type="password" autocomplete="current-password" required /></label>
        <div class="error" role="alert">${message}</div>
        <button type="submit">Sign in</button>
      </form>
    </main>`;

  document.querySelector('#login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = (document.querySelector<HTMLInputElement>('#email'))?.value ?? '';
    const password = (document.querySelector<HTMLInputElement>('#password'))?.value ?? '';
    try {
      renderSession(await window.redstone.auth.login(email, password));
    } catch (error) {
      renderLogin(error instanceof Error ? error.message : 'Sign in failed');
    }
  });
}

function renderSession(session: DesktopSession): void {
  root.innerHTML = `
    <main class="vault-shell">
      <header><div><strong>Redstone</strong><span>Desktop vault</span></div><button id="logout">Sign out</button></header>
      <section class="welcome"><h1>Welcome, ${session.user.name ?? session.user.email}</h1><p>Your encrypted desktop session is ready. Offline vault data is the next implementation checkpoint.</p></section>
    </main>`;
  document.querySelector('#logout')?.addEventListener('click', async () => {
    await window.redstone.auth.logout();
    renderLogin();
  });
}

window.redstone.auth.getSession()
  .then((session) => session ? renderSession(session) : renderLogin())
  .catch(() => renderLogin('Unable to restore the session'));
