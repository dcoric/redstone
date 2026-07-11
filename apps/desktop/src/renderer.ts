import './index.css';
import type {
  DesktopConflict,
  DesktopFile,
  DesktopSession,
} from './contracts';

const rootElement = document.querySelector<HTMLDivElement>('#app');
if (!rootElement) throw new Error('App root not found');
const root: HTMLDivElement = rootElement;

let currentSession: DesktopSession | null = null;
let selectedFile: DesktopFile | null = null;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]!);
}

function renderLogin(message = ''): void {
  currentSession = null;
  root.innerHTML = `
    <main class="login-shell">
      <form class="login-card" id="login-form">
        <div class="brand-mark">R</div>
        <h1>Redstone</h1>
        <p>Sign in to your desktop vault</p>
        <label>Email<input id="email" type="email" autocomplete="email" required /></label>
        <label>Password<input id="password" type="password" autocomplete="current-password" required /></label>
        <div class="error" role="alert">${escapeHtml(message)}</div>
        <button type="submit">Sign in</button>
      </form>
    </main>`;

  document.querySelector('#login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector<HTMLInputElement>('#email')?.value ?? '';
    const password = document.querySelector<HTMLInputElement>('#password')?.value ?? '';
    try {
      const session = await window.redstone.auth.login(email, password);
      await renderVault(session);
      await synchronize();
    } catch (error) {
      renderLogin(error instanceof Error ? error.message : 'Sign in failed');
    }
  });
}

async function renderVault(session: DesktopSession): Promise<void> {
  currentSession = session;
  root.innerHTML = `
    <main class="vault-shell">
      <header>
        <div><strong>Redstone</strong><span>${escapeHtml(session.user.email)}</span></div>
        <div class="header-actions"><span id="sync-status">Local vault</span><button id="sync">Sync</button><button class="secondary" id="logout">Sign out</button></div>
      </header>
      <div class="workspace">
        <aside>
          <div class="sidebar-actions"><input id="search" type="search" placeholder="Search notes" /><button id="new-file">New note</button></div>
          <div id="file-list" class="file-list"></div>
        </aside>
        <section id="editor" class="editor empty"><h2>Select a note</h2><p>Notes are stored locally and synchronized when online.</p></section>
      </div>
    </main>`;

  document.querySelector('#logout')?.addEventListener('click', async () => {
    await window.redstone.auth.logout();
    renderLogin();
  });
  document.querySelector('#sync')?.addEventListener('click', synchronize);
  document.querySelector('#new-file')?.addEventListener('click', async () => {
    const file = await window.redstone.files.create();
    await loadFiles();
    await openFile(file.id);
  });
  document.querySelector<HTMLInputElement>('#search')?.addEventListener('input', (event) => {
    void loadFiles((event.target as HTMLInputElement).value);
  });
  await loadFiles();
}

async function loadFiles(query = ''): Promise<void> {
  const files = await window.redstone.files.list(query);
  const list = document.querySelector<HTMLDivElement>('#file-list');
  if (!list) return;
  list.innerHTML = files.length
    ? files.map((file) => `
      <button class="file-row ${selectedFile?.id === file.id ? 'selected' : ''}" data-file-id="${file.id}">
        <strong>${escapeHtml(file.title || 'Untitled')}</strong>
        <span>${file.conflictJson ? 'Conflict' : file.dirty ? 'Pending sync' : new Date(file.updatedAt).toLocaleDateString()}</span>
      </button>`).join('')
    : '<p class="empty-list">No notes found</p>';
  list.querySelectorAll<HTMLButtonElement>('[data-file-id]').forEach((button) => {
    button.addEventListener('click', () => void openFile(button.dataset.fileId!));
  });
}

async function openFile(id: string): Promise<void> {
  selectedFile = await window.redstone.files.get(id);
  if (!selectedFile) {
    await loadFiles();
    return;
  }
  const editor = document.querySelector<HTMLElement>('#editor');
  if (!editor) return;
  const conflict = selectedFile.conflictJson
    ? JSON.parse(selectedFile.conflictJson) as DesktopConflict
    : null;
  editor.classList.remove('empty');
  editor.innerHTML = `
    ${conflict ? `<div class="conflict"><strong>Changed on another device</strong><span>${conflict.kind === 'remote-delete' ? 'The server note was deleted.' : `Server title: ${escapeHtml(conflict.file.title)}`}</span><div><button id="keep-local">Keep mine</button><button class="secondary" id="use-remote">Use server</button></div></div>` : ''}
    <input id="file-title" class="title-input" aria-label="Note title" />
    <textarea id="file-content" aria-label="Note content"></textarea>
    <div class="editor-actions"><span>${selectedFile.dirty ? 'Saved locally · pending sync' : 'Synced'}</span><button class="danger" id="delete-file">Delete</button><button id="save-file">Save locally</button></div>`;
  const title = document.querySelector<HTMLInputElement>('#file-title');
  const content = document.querySelector<HTMLTextAreaElement>('#file-content');
  if (title) title.value = selectedFile.title;
  if (content) content.value = selectedFile.content;
  document.querySelector('#save-file')?.addEventListener('click', async () => {
    selectedFile = await window.redstone.files.update(id, {
      title: title?.value.trim() || 'Untitled',
      content: content?.value ?? '',
    });
    await loadFiles();
    await openFile(id);
  });
  document.querySelector('#delete-file')?.addEventListener('click', async () => {
    if (!confirm('Delete this note?')) return;
    await window.redstone.files.delete(id);
    selectedFile = null;
    await loadFiles();
    editor.classList.add('empty');
    editor.innerHTML = '<h2>Select a note</h2>';
  });
  document.querySelector('#keep-local')?.addEventListener('click', async () => {
    await window.redstone.files.resolveConflict(id, 'local');
    await openFile(id);
  });
  document.querySelector('#use-remote')?.addEventListener('click', async () => {
    await window.redstone.files.resolveConflict(id, 'remote');
    await openFile(id);
  });
  await loadFiles();
}

async function synchronize(): Promise<void> {
  const status = document.querySelector<HTMLElement>('#sync-status');
  if (status) status.textContent = 'Syncing…';
  try {
    const result = await window.redstone.files.sync();
    if (status) {
      status.textContent = result.status === 'synced'
        ? 'Synced'
        : result.status === 'offline'
          ? 'Offline'
          : result.errors[0] ?? 'Sync needs attention';
    }
    await loadFiles();
    if (selectedFile) await openFile(selectedFile.id);
  } catch {
    if (status) status.textContent = 'Offline';
  }
}

window.redstone.auth.getSession()
  .then((session) => session ? renderVault(session).then(synchronize) : renderLogin())
  .catch(() => renderLogin('Unable to restore the session'));
