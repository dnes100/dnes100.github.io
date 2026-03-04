---
layout: post
title: "Easy typing tutor"
date: 2026-03-04
categories: games
---


<div id="typing-tutor-container">
  <div id="typing-tutor-letters" class="typing-tutor-letters" aria-live="polite"></div>
  <div id="typing-tutor-keyboard" class="typing-tutor-keyboard" aria-hidden="true"></div>
  <div id="typing-tutor-hands" class="typing-tutor-hands" aria-hidden="true"></div>
</div>

<style>
#typing-tutor-container {
  max-width: 640px;
  margin: 1rem 0;
  font-family: system-ui, sans-serif;
}
.typing-tutor-letters {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  min-height: 4rem;
}
.typing-tutor-letter {
  font-size: 3rem;
  font-weight: bold;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f0f0f0;
  color: #333;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.typing-tutor-letter.correct {
  background: #86efac;
  color: #166534;
}
.typing-tutor-letter.wrong {
  background: #fecaca;
  color: #991b1b;
  animation: typing-tutor-flash 0.4s ease;
}
@keyframes typing-tutor-flash {
  0%, 100% { background: #fecaca; }
  50% { background: #fca5a5; box-shadow: 0 0 0 4px rgba(248,113,113,0.4); }
}
.typing-tutor-keyboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 1.5rem;
  padding: 12px;
  background: #e5e7eb;
  border-radius: 12px;
}
.typing-tutor-keyrow {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.typing-tutor-key {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  background: #fff;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  text-transform: lowercase;
}
.typing-tutor-key.current {
  background: #fef08a;
  border-color: #eab308;
  box-shadow: 0 0 0 2px rgba(234,179,8,0.3);
}
.typing-tutor-key.typed {
  background: #bbf7d0;
  border-color: #22c55e;
}
.typing-tutor-hands {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}
.typing-tutor-hand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.typing-tutor-hand-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 4px;
}
.typing-tutor-fingers {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  padding-top: 8px; /* reserved for highlighted finger translateY(-8px) */
  min-height: 52px; /* 8px spacer + 44px finger height */
}
.typing-tutor-finger {
  width: 32px;
  height: 44px;
  border-radius: 8px;
  background: #d1d5db;
  transition: background 0.2s ease, transform 0.2s ease;
}
.typing-tutor-finger.highlight {
  margin-bottom: 0; /* override Jekyll/Minima .highlight { margin-bottom: 15px } */
  background: #fef08a;
  box-shadow: 0 0 0 2px #eab308;
  transform: translateY(-8px);
}
.typing-tutor-finger.typed {
  background: #bbf7d0;
}
</style>

<script>
'use strict';

/** QWERTY US: key (lowercase) -> { hand: 'left'|'right', fingerIndex: 0..4 } */
  const FingerMap = {
    _keyToFinger: {
      q: { hand: 'left', fingerIndex: 0 }, a: { hand: 'left', fingerIndex: 0 }, z: { hand: 'left', fingerIndex: 0 },
      w: { hand: 'left', fingerIndex: 1 }, s: { hand: 'left', fingerIndex: 1 }, x: { hand: 'left', fingerIndex: 1 },
      e: { hand: 'left', fingerIndex: 2 }, d: { hand: 'left', fingerIndex: 2 }, c: { hand: 'left', fingerIndex: 2 },
      r: { hand: 'left', fingerIndex: 3 }, f: { hand: 'left', fingerIndex: 3 }, t: { hand: 'left', fingerIndex: 3 }, g: { hand: 'left', fingerIndex: 3 }, v: { hand: 'left', fingerIndex: 3 }, b: { hand: 'left', fingerIndex: 3 },
      y: { hand: 'right', fingerIndex: 0 }, h: { hand: 'right', fingerIndex: 0 }, n: { hand: 'right', fingerIndex: 0 }, u: { hand: 'right', fingerIndex: 0 }, j: { hand: 'right', fingerIndex: 0 }, m: { hand: 'right', fingerIndex: 0 },
      i: { hand: 'right', fingerIndex: 1 }, k: { hand: 'right', fingerIndex: 1 },
      o: { hand: 'right', fingerIndex: 2 }, l: { hand: 'right', fingerIndex: 2 },
      p: { hand: 'right', fingerIndex: 3 }
    },
    _leftKeys: ['q','w','e','r','t','a','s','d','f','g','z','x','c','v','b'],
    _rightKeys: ['y','u','i','o','p','h','j','k','l','n','m'],
    get: function (key) {
      return this._keyToFinger[key ? key.toLowerCase() : ''];
    },
    pickTwoLetters: function () {
      const left = this._leftKeys[Math.floor(Math.random() * this._leftKeys.length)];
      const right = this._rightKeys[Math.floor(Math.random() * this._rightKeys.length)];
      return [left, right];
    }
  };

  function KeyboardDisplay(containerId) {
    this.container = document.getElementById(containerId);
    this.keyEls = {};
    if (this.container) this._build();
  }

  KeyboardDisplay.KEYBOARD_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m']
  ];

  KeyboardDisplay.prototype._build = function () {
    this.container.innerHTML = '';
    const self = this;
    KeyboardDisplay.KEYBOARD_ROWS.forEach(function (row) {
      const rowEl = document.createElement('div');
      rowEl.className = 'typing-tutor-keyrow';
      row.forEach(function (key) {
        const keyEl = document.createElement('div');
        keyEl.className = 'typing-tutor-key';
        keyEl.setAttribute('data-key', key);
        keyEl.textContent = key;
        self.keyEls[key] = keyEl;
        rowEl.appendChild(keyEl);
      });
      self.container.appendChild(rowEl);
    });
  };

  KeyboardDisplay.prototype.setCurrent = function (keys) {
    const keyList = Array.isArray(keys) ? keys : (keys ? [keys.toLowerCase()] : []);
    Object.keys(this.keyEls).forEach(function (key) {
      const el = this.keyEls[key];
      el.classList.remove('current');
      if (keyList.indexOf(key) !== -1) el.classList.add('current');
    }, this);
  };

  KeyboardDisplay.prototype.setTyped = function (key) {
    const k = key ? key.toLowerCase() : null;
    if (k && this.keyEls[k]) {
      this.keyEls[k].classList.remove('current');
      this.keyEls[k].classList.add('typed');
    }
  };

  KeyboardDisplay.prototype.clearTyped = function () {
    Object.keys(this.keyEls).forEach(function (key) {
      this.keyEls[key].classList.remove('current', 'typed');
    }, this);
  };

  function HandsDisplay(containerId) {
    this.container = document.getElementById(containerId);
    this.leftFingers = [];
    this.rightFingers = [];
    this.fingerLabels = [['Pinky','Ring','Middle','Index','Thumb'], ['Thumb','Index','Middle','Ring','Pinky']];
    if (this.container) this._build();
  }

  HandsDisplay.prototype._build = function () {
    this.container.innerHTML = '';
    const leftBox = document.createElement('div');
    leftBox.className = 'typing-tutor-hand';
    leftBox.innerHTML = '<span class="typing-tutor-hand-title">Left hand</span>';
    const leftRow = document.createElement('div');
    leftRow.className = 'typing-tutor-fingers';
    for (let i = 0; i < 5; i++) {
      const f = document.createElement('div');
      f.className = 'typing-tutor-finger';
      f.setAttribute('data-hand', 'left');
      f.setAttribute('data-finger', String(i));
      f.setAttribute('title', this.fingerLabels[0][i]);
      this.leftFingers.push(f);
      leftRow.appendChild(f);
    }
    leftBox.appendChild(leftRow);
    this.container.appendChild(leftBox);

    const rightBox = document.createElement('div');
    rightBox.className = 'typing-tutor-hand';
    rightBox.innerHTML = '<span class="typing-tutor-hand-title">Right hand</span>';
    const rightRow = document.createElement('div');
    rightRow.className = 'typing-tutor-fingers';
    for (let j = 0; j < 5; j++) {
      const g = document.createElement('div');
      g.className = 'typing-tutor-finger';
      g.setAttribute('data-hand', 'right');
      g.setAttribute('data-finger', String(j));
      g.setAttribute('title', this.fingerLabels[1][j]);
      this.rightFingers.push(g);
      rightRow.appendChild(g);
    }
    rightBox.appendChild(rightRow);
    this.container.appendChild(rightBox);
  };

  HandsDisplay.prototype.highlightFinger = function (hand, fingerIndex) {
    this.highlightFingers([{ hand: hand, fingerIndex: fingerIndex }]);
  };

  HandsDisplay.prototype.highlightFingers = function (pairs) {
    const set = {};
    (pairs || []).forEach(function (p) {
      set[p.hand + '-' + p.fingerIndex] = true;
    });
    this.leftFingers.forEach(function (el, i) {
      el.classList.remove('highlight');
      if (set['left-' + i]) el.classList.add('highlight');
    });
    this.rightFingers.forEach(function (el, i) {
      el.classList.remove('highlight');
      if (set['right-' + i]) el.classList.add('highlight');
    });
  };

  HandsDisplay.prototype.setTyped = function (hand, fingerIndex) {
    const arr = hand === 'left' ? this.leftFingers : this.rightFingers;
    if (arr[fingerIndex]) {
      arr[fingerIndex].classList.remove('highlight');
      arr[fingerIndex].classList.add('typed');
    }
  };

  HandsDisplay.prototype.clearHighlight = function () {
    this.leftFingers.forEach(function (el) { el.classList.remove('highlight', 'typed'); });
    this.rightFingers.forEach(function (el) { el.classList.remove('highlight', 'typed'); });
  };

  HandsDisplay.prototype.updateForKeys = function (currentLetters) {
    const pairs = [];
    currentLetters.forEach(function (letter) {
      const info = FingerMap.get(letter);
      if (info) pairs.push({ hand: info.hand, fingerIndex: info.fingerIndex });
    });
    this.highlightFingers(pairs);
  };

  function TypingTutorApp(options) {
    options = options || {};
    this.lettersContainerId = options.lettersContainerId || 'typing-tutor-letters';
    this.keyboardContainerId = options.keyboardContainerId || 'typing-tutor-keyboard';
    this.handsContainerId = options.handsContainerId || 'typing-tutor-hands';

    this.lettersContainer = null;
    this.letterEls = [];
    this.keyboard = null;
    this.hands = null;

    this.letters = [];
    this.states = [];
    this._boundKeydown = null;
  }

  TypingTutorApp.prototype.start = function () {
    this.lettersContainer = document.getElementById(this.lettersContainerId);
    if (!this.lettersContainer) return;

    this.keyboard = new KeyboardDisplay(this.keyboardContainerId);
    this.hands = new HandsDisplay(this.handsContainerId);

    this._newRound();
    this._bindKeydown();
  };

  TypingTutorApp.prototype._newRound = function () {
    this.letters = FingerMap.pickTwoLetters();
    this.states = ['pending', 'pending'];
    this._renderLetters();
    this._updateHighlights();
  };

  TypingTutorApp.prototype._renderLetters = function () {
    this.lettersContainer.innerHTML = '';
    this.letterEls = [];
    const self = this;
    this.letters.forEach(function (letter, i) {
      const span = document.createElement('span');
      span.className = 'typing-tutor-letter ' + self.states[i];
      span.setAttribute('data-index', String(i));
      span.textContent = letter.toUpperCase();
      self.letterEls.push(span);
      self.lettersContainer.appendChild(span);
    });
  };

  TypingTutorApp.prototype._updateHighlights = function () {
    const pending = [];
    this.letters.forEach(function (letter, i) {
      if (this.states[i] === 'pending') pending.push(letter);
    }, this);
    if (pending.length > 0) {
      const currentLetter = pending[0];
      this.keyboard.setCurrent(currentLetter);
      this.hands.updateForKeys([currentLetter]);
    } else {
      this.keyboard.clearTyped();
      this.hands.clearHighlight();
    }
  };

  TypingTutorApp.prototype._onKeyDown = function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = (e.key || '').toLowerCase();
    if (!key || key.length !== 1) return;
    if (!/^[a-z]$/.test(key)) return;
    e.preventDefault();

    const index = this.letters.indexOf(key);
    if (index === -1) {
      this._flashWrong();
      return;
    }
    if (this.states[index] !== 'pending') return;

    this.states[index] = 'correct';
    this.letterEls[index].className = 'typing-tutor-letter correct';

    const allDone = this.states.every(function (s) { return s === 'correct'; });
    if (allDone) {
      const self = this;
      setTimeout(function () { self._newRound(); }, 600);
    } else {
      this._updateHighlights();
    }
  };

  TypingTutorApp.prototype._flashWrong = function () {
    const currentIndex = this.states.indexOf('pending');
    if (currentIndex === -1) return;
    const el = this.letterEls[currentIndex];
    if (!el) return;
    el.classList.add('wrong');
    setTimeout(function () {
      el.classList.remove('wrong');
    }, 400);
  };

  TypingTutorApp.prototype._bindKeydown = function () {
    this._boundKeydown = this._onKeyDown.bind(this);
    document.addEventListener('keydown', this._boundKeydown);
  };

document.addEventListener('DOMContentLoaded', function () {
  const app = new TypingTutorApp();
  app.start();
});
</script>
