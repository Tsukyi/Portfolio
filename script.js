'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* Optional preferences. */ } }
};

// Theme works without storage access and respects the existing saved preference.
function updateThemeControl() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  $('#theme-toggle').title = `Switch to ${dark ? 'light' : 'dark'} theme`;
  $('meta[name="theme-color"]').content = dark ? '#171d1c' : '#f6f4ee';
}
function toggleTheme() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  storage.set('theme', theme);
  updateThemeControl();
}
$('#theme-toggle').addEventListener('click', toggleTheme);
updateThemeControl();

// Accessible mobile navigation.
function closeMenu() {
  $('#mobile-nav').hidden = true;
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  $('#menu-toggle').setAttribute('aria-label', 'Open navigation');
}
$('#menu-toggle').addEventListener('click', () => {
  const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true';
  $('#mobile-nav').hidden = !open;
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
  $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
$$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); }, { passive: true });

// Filters leave cards in the DOM and keep button state available to screen readers.
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  $$('[data-filter]').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  let count = 0;
  $$('.project-card').forEach(card => {
    card.hidden = filter !== 'all' && !card.dataset.category.split(' ').includes(filter);
    if (!card.hidden) {
      count++;
      card.classList.remove('pending');
      card.classList.add('visible');
    }
  });
  $('#project-count').textContent = `${count} project${count === 1 ? '' : 's'}`;
}));

// Progressive enhancement: never hide content when motion or observers are unavailable.
if ('IntersectionObserver' in window) {
  if (!reducedMotion.matches) {
    const reveals = $$('.reveal');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px 20px 0px' });
    document.documentElement.classList.add('motion-ready');
    reveals.forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add('pending');
      revealObserver.observe(element);
    });
  }
  const sections = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) $$('.desktop-nav a').forEach(link => {
      const active = link.hash === `#${visible.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-10% 0px -50% 0px', threshold: 0 });
  $$('main section[id]').forEach(section => sections.observe(section));
}

let scrollFrame = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('.reading-progress').style.width = `${max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0}%`;
  scrollFrame = false;
}
window.addEventListener('scroll', () => {
  if (!scrollFrame) { scrollFrame = true; requestAnimationFrame(updateProgress); }
}, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();

const art = $('#hero-art');
art.addEventListener('pointermove', event => {
  if (reducedMotion.matches || event.pointerType !== 'mouse') return;
  const box = art.getBoundingClientRect();
  art.style.setProperty('--tilt-x', `${((event.clientX - box.left) / box.width - .5) * 10}deg`);
  art.style.setProperty('--tilt-y', `${-((event.clientY - box.top) / box.height - .5) * 8}deg`);
});
art.addEventListener('pointerleave', () => {
  art.style.setProperty('--tilt-x', '0deg');
  art.style.setProperty('--tilt-y', '0deg');
});

// Number game: integer validation, deliberate restart, persistent personal best.
let secret = Math.floor(Math.random() * 10) + 1;
let attempts = 0;
let won = false;
const storedBest = Number(storage.get('guess-best'));
let best = Number.isInteger(storedBest) && storedBest > 0 ? storedBest : null;
function gameStats() {
  $('#game-attempts').textContent = `${attempts} attempt${attempts === 1 ? '' : 's'}`;
  $('#game-best').textContent = `Best: ${best || '—'}`;
}
$('#guess-form').addEventListener('submit', event => {
  event.preventDefault();
  if (won) return;
  const guess = Number($('#guess-input').value);
  if (!Number.isInteger(guess) || guess < 1 || guess > 10) {
    $('#game-message').textContent = 'Enter a whole number from 1 to 10.';
    return;
  }
  attempts++;
  if (guess === secret) {
    won = true;
    $('#game-message').textContent = `Found it! ${secret} in ${attempts} ${attempts === 1 ? 'guess' : 'guesses'}. Nicely done.`;
    $('#game-message').dataset.state = 'won';
    $('#guess-button').disabled = true;
    $('#guess-input').disabled = true;
    if (!best || attempts < best) { best = attempts; storage.set('guess-best', best); }
    $('#game-reset').focus({ preventScroll: true });
  } else {
    $('#game-message').textContent = guess < secret ? 'A little higher. You’re getting closer. ↑' : 'A little lower. Give it another go. ↓';
    $('#guess-input').select();
  }
  gameStats();
});
$('#game-reset').addEventListener('click', () => {
  secret = Math.floor(Math.random() * 10) + 1;
  attempts = 0;
  won = false;
  $('#guess-input').value = '';
  $('#guess-input').disabled = false;
  $('#guess-button').disabled = false;
  $('#game-message').textContent = 'New number. Fresh start. Your move.';
  delete $('#game-message').dataset.state;
  gameStats();
  $('#guess-input').focus({ preventScroll: true });
});
gameStats();

// Quick navigation: native dialog focus management, search and keyboard selection.
const dialog = $('#command-dialog');
let commandIndex = 0;
const commands = () => $$('[data-command]').filter(element => !element.hidden);
function selectCommand(index) {
  const options = commands();
  commandIndex = options.length ? (index + options.length) % options.length : 0;
  $$('[data-command]').forEach(element => element.classList.remove('selected'));
  options[commandIndex]?.classList.add('selected');
}
function openCommands() {
  closeMenu();
  $('#command-search').value = '';
  $$('[data-command]').forEach(element => { element.hidden = false; });
  $('#command-empty').hidden = true;
  selectCommand(0);
  if (!dialog.open) dialog.showModal();
  $('#command-search').focus();
}
$('#command-trigger').addEventListener('click', openCommands);
$('#command-close').addEventListener('click', () => dialog.close());
$('#command-search').addEventListener('input', event => {
  const query = event.target.value.trim().toLowerCase();
  $$('[data-command]').forEach(element => { element.hidden = !element.dataset.command.includes(query); });
  $('#command-empty').hidden = commands().length > 0;
  selectCommand(0);
});
$$('[data-command]').forEach(element => element.addEventListener('click', () => dialog.close()));
$('#command-theme').addEventListener('click', toggleTheme);
dialog.addEventListener('click', event => {
  const box = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    dialog.open ? dialog.close() : openCommands();
  } else if (event.key === 'Escape') closeMenu();
  if (!dialog.open || document.activeElement !== $('#command-search')) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    selectCommand(commandIndex + (event.key === 'ArrowDown' ? 1 : -1));
  } else if (event.key === 'Enter') {
    event.preventDefault();
    commands()[commandIndex]?.click();
  }
});

let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
$('#copy-email').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('bseng@u.nus.edu');
    toast('Email copied. Say hello whenever you like.');
  } catch { toast('Email: bseng@u.nus.edu — select the address to copy it.'); }
});
$('#year').textContent = new Date().getFullYear();
function singaporeTime() {
  const now = new Date();
  $('#singapore-time').textContent = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Singapore', hour12: false });
  $('#singapore-time').dateTime = now.toISOString();
}
singaporeTime();
setInterval(() => { if (!document.hidden) singaporeTime(); }, 1000);
