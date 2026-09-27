import './style.css';
import { createIcons } from 'lucide';
import gsap from 'gsap';

try {
  createIcons();
} catch (e) {}

window.onerror = function(msg, url, line) {
  console.error("Global Error:", msg, "at line", line);
  const errBox = document.createElement('div');
  errBox.style.position = 'fixed';
  errBox.style.top = '10px';
  errBox.style.left = '10px';
  errBox.style.background = 'red';
  errBox.style.color = 'white';
  errBox.style.padding = '10px';
  errBox.style.zIndex = '9999';
  errBox.innerText = msg + ' | Line: ' + line;
  document.body.appendChild(errBox);
};

const getEl = (id: string) => document.getElementById(id);

const translatedText = getEl('translatedText')!;
const morsePreview = getEl('morsePreview')!;
const mobileTapBtn = getEl('mobileTapBtn')!;
const clearBtn = getEl('clearBtn')!;
const signalIndicator = getEl('signalIndicator')!;
const drawer = getEl('drawer')!;
const drawerOverlay = getEl('drawerOverlay')!;
const cheatSheetBtn = getEl('cheatSheetBtn')!;
const cheatSheetContent = getEl('cheatSheetContent')!;
const drawerDragHandle = getEl('drawerDragHandle')!;
const historyContainer = getEl('historyContainer')!;

const MORSE_MAP: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
  '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
  '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
  '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
  '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
  '--..': 'Z', '.----': '1', '..---': '2', '...--': '3', '....-': '4',
  '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9',
  '-----': '0',
};

const DOT_MAX = 250;
const CHAR_GAP = 600;
const WORD_GAP = 1400;

let isPressed = false;
let pressStart = 0;
let seq = '';
let msg = '';
let gapTimer: any = null;
let wordTimer: any = null;

// Populate cheat sheet safely
Object.entries(MORSE_MAP).forEach(([morse, char]) => {
  const item = document.createElement('div');
  item.className = 'flex flex-col gap-1';
  item.innerHTML = `<span class="text-zinc-500 text-xs font-medium">${char}</span><span class="text-zinc-200 font-mono tracking-widest text-sm">${morse}</span>`;
  if (cheatSheetContent) cheatSheetContent.appendChild(item);
});

const updateUI = () => {
  if (morsePreview) morsePreview.textContent = seq;
  if (translatedText) translatedText.textContent = msg;
  
  if (clearBtn) {
    if (msg || seq) {
      gsap.to(clearBtn, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.4, ease: 'back.out(1.5)' });
    } else {
      gsap.to(clearBtn, { opacity: 0, y: 16, pointerEvents: 'none', duration: 0.3 });
    }
  }
};

const commitChar = () => {
  if (seq) {
    const char = MORSE_MAP[seq] || '?';
    msg += char;
    
    if (historyContainer) {
      const block = document.createElement('div');
      block.className = 'flex flex-col items-center justify-center min-w-[3rem] p-2 bg-zinc-800/40 rounded-xl border border-white/5 opacity-0 scale-90';
      block.innerHTML = `<span class="text-xs text-zinc-500 font-mono mb-1">${seq}</span><span class="text-lg font-medium text-zinc-200">${char}</span>`;
      historyContainer.appendChild(block);
      gsap.to(block, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)' });
    }

    seq = '';
    updateUI();
  }
};

const commitWord = () => {
  if (msg && !msg.endsWith(' ')) {
    msg += ' ';
    if (historyContainer) {
      const spaceBlock = document.createElement('div');
      spaceBlock.className = 'w-4 h-full flex-shrink-0';
      historyContainer.appendChild(spaceBlock);
    }
    updateUI();
  }
};

const clearTimers = () => {
  if (gapTimer) clearTimeout(gapTimer);
  if (wordTimer) clearTimeout(wordTimer);
};

const handleDown = (e: Event) => {
  // Safe filtering
  if (e.type === 'keydown') {
    const ke = e as KeyboardEvent;
    if (ke.code !== 'Space' && ke.key !== ' ') return;
    if (ke.repeat) return;
  } else {
    // For mouse/touch events, ignore clicks on UI buttons
    const target = e.target as HTMLElement;
    if (target && typeof target.closest === 'function') {
      if (target.closest('button#cheatSheetBtn') || target.closest('button#clearBtn') || target.closest('#drawer')) {
        return; 
      }
    }
  }

  // Prevent default to avoid scrolling on spacebar, except we skip it if it throws
  try {
    if (e.cancelable) e.preventDefault();
  } catch (err) {}
  
  if (isPressed) return;
  isPressed = true;
  pressStart = Date.now();
  clearTimers();
  
  if (signalIndicator) {
    gsap.killTweensOf(signalIndicator);
    gsap.set(signalIndicator, { opacity: 1, width: 24, height: 24, scale: 1 });
    gsap.to(signalIndicator, { width: 140, height: 140, duration: 0.6, ease: 'power2.out' });
  }
};

const handleUp = (e: Event) => {
  if (e.type === 'keyup') {
    const ke = e as KeyboardEvent;
    if (ke.code !== 'Space' && ke.key !== ' ') return;
  }
  
  if (!isPressed) return;
  isPressed = false;
  
  const dur = Date.now() - pressStart;
  const isDot = dur <= DOT_MAX;
  seq += isDot ? '.' : '-';
  updateUI();
  
  if (signalIndicator) {
    gsap.killTweensOf(signalIndicator);
    gsap.to(signalIndicator, {
      scale: isDot ? 1.2 : 1.5,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => gsap.set(signalIndicator, { width: 0, height: 0 })
    });
  }

  clearTimers();
  gapTimer = setTimeout(commitChar, CHAR_GAP);
  wordTimer = setTimeout(commitWord, WORD_GAP);
};

// Bind safely to window
window.addEventListener('keydown', handleDown, { passive: false });
window.addEventListener('keyup', handleUp);
window.addEventListener('mousedown', handleDown, { passive: false });
window.addEventListener('mouseup', handleUp);
window.addEventListener('touchstart', handleDown, { passive: false });
window.addEventListener('touchend', handleUp);

if (clearBtn) {
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    msg = ''; seq = '';
    if (historyContainer) historyContainer.innerHTML = '';
    clearTimers(); updateUI();
  });
}

// Drawer logic removed in favor of permanent right-column cheat sheet

// Prevent context menu on hold
window.addEventListener('contextmenu', (e) => {
  const target = e.target as HTMLElement;
  if (target && typeof target.closest === 'function' && !target.closest('#drawer')) {
    e.preventDefault();
  }
});
