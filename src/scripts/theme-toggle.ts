const STORAGE_KEY = 'theme-preference';
const root = document.documentElement;

const getStoredTheme = (): 'light' | 'dark' | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch (error) {
    console.warn('No se pudo leer la preferencia de tema', error);
    return null;
  }
};

const getPreferredTheme = (): 'light' | 'dark' => {
  const stored = getStoredTheme();
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: 'light' | 'dark'): void => {
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.dataset['theme'] = theme;
};

const saveTheme = (theme: 'light' | 'dark'): void => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn('No se pudo guardar la preferencia de tema', error);
  }
};

const updateToggleButtons = (theme: 'light' | 'dark'): void => {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((button) => {
    const isDark = theme === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    const icon = button.querySelector('[data-theme-icon]');
    const text = button.querySelector('[data-theme-text]');
    if (icon) {
      icon.textContent = isDark ? '☀️' : '🌙';
    }
    if (text) {
      text.textContent = isDark ? 'Desactivar modo oscuro' : 'Activar modo oscuro';
    }
  });
};

const toggleTheme = (): void => {
  const current = root.dataset['theme'] === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  updateToggleButtons(next);
  saveTheme(next);
};

const init = (): void => {
  const theme = getPreferredTheme();
  applyTheme(theme);
  updateToggleButtons(theme);

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const toggle = target?.closest('[data-theme-toggle]');
    if (!toggle) return;
    event.preventDefault();
    toggleTheme();
  });

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (event) => {
    const stored = getStoredTheme();
    if (stored) return;
    const next = event.matches ? 'dark' : 'light';
    applyTheme(next);
    updateToggleButtons(next);
  });
};

init();

if (import.meta.hot) {
  import.meta.hot.accept();
}
