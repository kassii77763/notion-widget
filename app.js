/**
 * Notion Multi-Widget (Clock, Pomodoro, Countdown)
 * State Management & Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. STATE & STORAGE MANAGEMENT
  // ==========================================
  const state = {
    activeTab: localStorage.getItem('nw_activeTab') || 'clock',
    soundEnabled: localStorage.getItem('nw_sound') !== 'false',
    theme: localStorage.getItem('nw_theme') || 'botanical',
    bgmMode: 'none',
    // Clock State
    is24Hour: localStorage.getItem('nw_24h') === 'true',
    isAnalog: localStorage.getItem('nw_analog') === 'true',
    // Pomodoro State
    pomoMode: 'work', // 'work' or 'break'
    pomoTimeLeft: 25 * 60,
    pomoTotalTime: 25 * 60,
    pomoIsRunning: false,
    pomoTimerId: null,
    pomoCompletedSessions: parseInt(localStorage.getItem('nw_pomoCount') || '0', 10),
    // Countdown State
    eventTitle: localStorage.getItem('nw_eventTitle') || '目標イベント',
    eventDate: localStorage.getItem('nw_eventDate') || getTomorrowISOString()
  };

  const widgetRoot = document.getElementById('widget-root');
  function applyTheme(themeName) {
    state.theme = themeName;
    widgetRoot.setAttribute('data-theme', themeName);
    localStorage.setItem('nw_theme', themeName);
  }
  applyTheme(state.theme);

  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themes = ['botanical', 'sakura', 'wood', 'midnight'];
  themeToggleBtn.addEventListener('click', () => {
    const nextIdx = (themes.indexOf(state.theme) + 1) % themes.length;
    applyTheme(themes[nextIdx]);
  });

  // ==========================================
  // BGM SYNTHESIZER (Web Audio API)
  // ==========================================
  let bgmCtx = null;
  let bgmNode = null;
  let bgmGain = null;
  let bgmInterval = null;

  function stopBGM() {
    if (bgmInterval) clearInterval(bgmInterval);
    if (bgmNode) { try { bgmNode.stop(); } catch(e){} bgmNode = null; }
    if (bgmCtx) { try { bgmCtx.close(); } catch(e){} bgmCtx = null; }
  }

  function startBGM(type) {
    stopBGM();
    if (type === 'none') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      bgmCtx = new AudioCtx();
      
      // Create Noise Buffer (10s)
      const bufferSize = bgmCtx.sampleRate * 5;
      const noiseBuffer = bgmCtx.createBuffer(1, bufferSize, bgmCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      bgmNode = bgmCtx.createBufferSource();
      bgmNode.buffer = noiseBuffer;
      bgmNode.loop = true;

      const filter = bgmCtx.createBiquadFilter();
      bgmGain = bgmCtx.createGain();

      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, bgmCtx.currentTime);
        bgmGain.gain.setValueAtTime(0.08, bgmCtx.currentTime);
      } else if (type === 'fire') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, bgmCtx.currentTime);
        filter.Q.setValueAtTime(2, bgmCtx.currentTime);
        bgmGain.gain.setValueAtTime(0.12, bgmCtx.currentTime);

        // Crackle effect
        bgmInterval = setInterval(() => {
          if (!bgmCtx) return;
          if (Math.random() < 0.3) {
            const crackle = bgmCtx.createOscillator();
            const cg = bgmCtx.createGain();
            crackle.type = 'triangle';
            crackle.frequency.setValueAtTime(200 + Math.random() * 400, bgmCtx.currentTime);
            cg.gain.setValueAtTime(0.04, bgmCtx.currentTime);
            cg.gain.exponentialRampToValueAtTime(0.001, bgmCtx.currentTime + 0.05);
            crackle.connect(cg);
            cg.connect(bgmCtx.destination);
            crackle.start();
            crackle.stop(bgmCtx.currentTime + 0.05);
          }
        }, 150);
      } else if (type === 'waves') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, bgmCtx.currentTime);
        bgmGain.gain.setValueAtTime(0.05, bgmCtx.currentTime);

        // LFO for wave swelling
        let wavePhase = 0;
        bgmInterval = setInterval(() => {
          if (!bgmCtx || !filter) return;
          wavePhase += 0.05;
          const freq = 300 + Math.sin(wavePhase) * 250;
          filter.frequency.setValueAtTime(freq, bgmCtx.currentTime);
        }, 100);
      }

      bgmNode.connect(filter);
      filter.connect(bgmGain);
      bgmGain.connect(bgmCtx.destination);
      bgmNode.start();
    } catch(e) {
      console.warn('BGM error:', e);
    }
  }

  // BGM Controls UI
  const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
  const bgmMenu = document.getElementById('bgm-menu');
  const bgmOpts = document.querySelectorAll('.bgm-opt');
  const bgmIcon = document.getElementById('bgm-icon');

  bgmToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bgmMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    bgmMenu.classList.add('hidden');
  });

  bgmOpts.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const mode = opt.dataset.bgm;
      state.bgmMode = mode;

      bgmOpts.forEach(o => o.classList.toggle('active', o.dataset.bgm === mode));
      startBGM(mode);
      bgmMenu.classList.add('hidden');

      const iconMap = { none: 'volume-x', rain: 'cloud-rain', fire: 'flame', waves: 'waves' };
      bgmIcon.setAttribute('data-lucide', iconMap[mode] || 'cloud-rain');
      if (window.lucide) lucide.createIcons();
    });
  });

  function getTomorrowISOString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  }

  // ==========================================
  // 2. AUDIO SYNTHESIZER (Web Audio API)
  // ==========================================
  function playBeep(type = 'workEnd') {
    if (!state.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (type === 'workEnd') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // ==========================================
  // 3. TAB NAVIGATION SYSTEM
  // ==========================================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');

  function switchTab(targetTab) {
    state.activeTab = targetTab;
    localStorage.setItem('nw_activeTab', targetTab);

    tabBtns.forEach(btn => {
      const isActive = btn.dataset.tab === targetTab;
      btn.classList.toggle('active', isActive);
    });

    panels.forEach(panel => {
      const isActive = panel.id === `panel-${targetTab}`;
      panel.classList.toggle('active', isActive);
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  switchTab(state.activeTab);

  // Sound Toggle Button
  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundIcon = document.getElementById('sound-icon');

  function updateSoundUI() {
    soundToggleBtn.classList.toggle('muted', !state.soundEnabled);
    soundIcon.setAttribute('data-lucide', state.soundEnabled ? 'volume-2' : 'volume-x');
    if (window.lucide) lucide.createIcons();
  }

  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('nw_sound', state.soundEnabled);
    updateSoundUI();
  });
  updateSoundUI();

  // ==========================================
  // 4. CLOCK MODULE
  // ==========================================
  const clockDateEl = document.getElementById('clock-date');
  const clockTimeEl = document.getElementById('clock-time');
  const clockSecondsEl = document.getElementById('clock-seconds');
  const clockAmpmEl = document.getElementById('clock-ampm');
  const digitalClockView = document.getElementById('digital-clock');
  const analogClockView = document.getElementById('analog-clock');
  const clockStyleBtn = document.getElementById('toggle-clock-style');
  const clockStyleText = document.getElementById('clock-style-text');
  const hourFormatBtn = document.getElementById('toggle-hour-format');
  const hourFormatText = document.getElementById('hour-format-text');

  // Hands
  const analogHour = document.getElementById('analog-hour');
  const analogMinute = document.getElementById('analog-minute');
  const analogSecond = document.getElementById('analog-second');

  function updateClockViews() {
    digitalClockView.classList.toggle('hidden', state.isAnalog);
    analogClockView.classList.toggle('hidden', !state.isAnalog);
    clockStyleText.textContent = state.isAnalog ? 'デジタル切替' : 'アナログ切替';
    hourFormatText.textContent = state.is24Hour ? '12時間表示' : '24時間表示';
  }

  clockStyleBtn.addEventListener('click', () => {
    state.isAnalog = !state.isAnalog;
    localStorage.setItem('nw_analog', state.isAnalog);
    updateClockViews();
  });

  hourFormatBtn.addEventListener('click', () => {
    state.is24Hour = !state.is24Hour;
    localStorage.setItem('nw_24h', state.is24Hour);
    updateClockViews();
  });

  function tickClock() {
    const now = new Date();
    // Date string
    const daysJP = ['日', '月', '火', '水', '木', '金', '土'];
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 (${daysJP[now.getDay()]})`;
    clockDateEl.textContent = dateStr;

    // Digital
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    let ampm = '';

    if (!state.is24Hour) {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
    }
    const hoursStr = String(hours).padStart(2, '0');

    clockTimeEl.textContent = `${hoursStr}:${minutes}`;
    clockSecondsEl.textContent = seconds;
    clockAmpmEl.textContent = ampm;

    // Analog
    const secDeg = (now.getSeconds() / 60) * 360;
    const minDeg = ((now.getMinutes() + now.getSeconds() / 60) / 60) * 360;
    const hourDeg = (((now.getHours() % 12) + now.getMinutes() / 60) / 12) * 360;

    analogSecond.style.transform = `rotate(${secDeg}deg)`;
    analogMinute.style.transform = `rotate(${minDeg}deg)`;
    analogHour.style.transform = `rotate(${hourDeg}deg)`;
  }

  updateClockViews();
  setInterval(tickClock, 1000);
  tickClock();

  // ==========================================
  // 5. POMODORO MODULE
  // ==========================================
  const pomoModeLabel = document.getElementById('pomo-mode-label');
  const pomoTimeEl = document.getElementById('pomo-time');
  const pomoProgress = document.getElementById('pomo-progress');
  const pomoStartBtn = document.getElementById('pomo-start-btn');
  const pomoStartText = document.getElementById('pomo-start-text');
  const pomoPlayIcon = document.getElementById('pomo-play-icon');
  const pomoResetBtn = document.getElementById('pomo-reset-btn');
  const pomoSkipBtn = document.getElementById('pomo-skip-btn');
  const pomoCountEl = document.getElementById('pomo-count');

  const RING_CIRCUMFERENCE = 2 * Math.PI * 95; // 596.9

  function updatePomoUI() {
    const mins = Math.floor(state.pomoTimeLeft / 60);
    const secs = state.pomoTimeLeft % 60;
    pomoTimeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Circular progress ring offset
    const progressFraction = state.pomoTimeLeft / state.pomoTotalTime;
    const offset = RING_CIRCUMFERENCE * (1 - progressFraction);
    pomoProgress.style.strokeDashoffset = offset;

    // Mode label
    pomoModeLabel.textContent = state.pomoMode === 'work' ? 'WORK TIME (25分)' : 'BREAK TIME (5分)';
    pomoModeLabel.style.color = state.pomoMode === 'work' ? 'var(--accent-purple)' : 'var(--accent-emerald)';
    pomoProgress.style.stroke = state.pomoMode === 'work' ? 'var(--accent-purple)' : 'var(--accent-emerald)';

    // Play/Pause button
    pomoStartText.textContent = state.pomoIsRunning ? '一時停止' : 'スタート';
    pomoPlayIcon.setAttribute('data-lucide', state.pomoIsRunning ? 'pause' : 'play');
    pomoCountEl.textContent = state.pomoCompletedSessions;

    if (window.lucide) lucide.createIcons();
  }

  function startPomoTimer() {
    if (state.pomoIsRunning) {
      // Pause
      clearInterval(state.pomoTimerId);
      state.pomoIsRunning = false;
      updatePomoUI();
      return;
    }

    state.pomoIsRunning = true;
    updatePomoUI();

    state.pomoTimerId = setInterval(() => {
      state.pomoTimeLeft--;
      if (state.pomoTimeLeft <= 0) {
        clearInterval(state.pomoTimerId);
        state.pomoIsRunning = false;
        playBeep(state.pomoMode === 'work' ? 'workEnd' : 'breakEnd');

        if (state.pomoMode === 'work') {
          state.pomoCompletedSessions++;
          localStorage.setItem('nw_pomoCount', state.pomoCompletedSessions);
          switchPomoMode('break');
        } else {
          switchPomoMode('work');
        }
      } else {
        updatePomoUI();
      }
    }, 1000);
  }

  function switchPomoMode(newMode) {
    clearInterval(state.pomoTimerId);
    state.pomoIsRunning = false;
    state.pomoMode = newMode;
    state.pomoTotalTime = newMode === 'work' ? 25 * 60 : 5 * 60;
    state.pomoTimeLeft = state.pomoTotalTime;
    updatePomoUI();
  }

  pomoStartBtn.addEventListener('click', startPomoTimer);
  pomoResetBtn.addEventListener('click', () => switchPomoMode(state.pomoMode));
  pomoSkipBtn.addEventListener('click', () => switchPomoMode(state.pomoMode === 'work' ? 'break' : 'work'));
  updatePomoUI();

  // ==========================================
  // 6. COUNTDOWN MODULE
  // ==========================================
  const eventTitleDisplay = document.getElementById('event-title-display');
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');

  const editEventBtn = document.getElementById('edit-event-btn');
  const eventEditForm = document.getElementById('event-edit-form');
  const eventTitleInput = document.getElementById('event-title-input');
  const eventDateInput = document.getElementById('event-date-input');
  const saveEventBtn = document.getElementById('save-event-btn');
  const cancelEventBtn = document.getElementById('cancel-event-btn');

  function updateCountdown() {
    eventTitleDisplay.textContent = state.eventTitle;

    const targetTime = new Date(state.eventDate).getTime();
    const nowTime = new Date().getTime();
    const diff = targetTime - nowTime;

    if (isNaN(diff) || diff <= 0) {
      cdDays.textContent = '00';
      cdHours.textContent = '00';
      cdMinutes.textContent = '00';
      cdSeconds.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    cdDays.textContent = String(days).padStart(2, '0');
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMinutes.textContent = String(minutes).padStart(2, '0');
    cdSeconds.textContent = String(seconds).padStart(2, '0');
  }

  editEventBtn.addEventListener('click', () => {
    eventTitleInput.value = state.eventTitle;
    eventDateInput.value = state.eventDate;
    eventEditForm.classList.remove('hidden');
  });

  cancelEventBtn.addEventListener('click', () => {
    eventEditForm.classList.add('hidden');
  });

  saveEventBtn.addEventListener('click', () => {
    const title = eventTitleInput.value.trim() || '目標イベント';
    const dateVal = eventDateInput.value;

    if (dateVal) {
      state.eventTitle = title;
      state.eventDate = dateVal;
      localStorage.setItem('nw_eventTitle', title);
      localStorage.setItem('nw_eventDate', dateVal);
      updateCountdown();
      eventEditForm.classList.add('hidden');
    }
  });

  setInterval(updateCountdown, 1000);
  updateCountdown();
});
