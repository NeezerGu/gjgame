const ui = {
  level: document.getElementById('level'),
  xpLabel: document.getElementById('xpLabel'),
  xpBar: document.getElementById('xpBar'),
  days: document.getElementById('days'),
  stones: document.getElementById('stones'),
  mood: document.getElementById('mood'),
  log: document.getElementById('log'),
  statusChip: document.getElementById('statusChip'),
  tempo: document.getElementById('tempo'),
  pomoTimer: document.getElementById('pomoTimer'),
  pomoStatus: document.getElementById('pomoStatus'),
  startPauseBtn: document.getElementById('startPause'),
  resetBtn: document.getElementById('resetPomo'),
  addFiveBtn: document.getElementById('addFive'),
  bellBtn: document.getElementById('bellToggle'),
  notifyBtn: document.getElementById('notifyToggle'),
};

const STORAGE_KEY = 'idle-cultivation-save-v1';
const POMODORO_KEY = 'idle-cultivation-pomo-v1';

const state = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  spiritStones: 0,
  mood: 70,
  tick: 0,
  activity: '修行',
  activityDuration: 0,
  activityProgress: 0,
  pendingWorkReward: 0,
  workStreak: 0,
  cultivateStreak: 0,
};

const realmNames = ['练气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升'];

const statusClassMap = {
  修行: 'cultivate',
  打工: 'work',
  调心: 'mood',
  突破: 'break',
};

let latestLogEntry = null;

const pomodoro = {
  mode: 'work',
  remaining: 25 * 60,
  running: false,
  workLength: 25 * 60,
  breakLength: 5 * 60,
  soundEnabled: false,
  notifyEnabled: false,
};

const workMoodEvents = [
  '遭遇同门欺压，心境受损',
  '长夜加班，身心俱疲，心境震荡',
  '凡俗纷扰侵蚀道心，心境下沉',
];

const cultivateMoodEvents = [
  '闭关多日，烦躁暗生，心境受损',
  '灵力淤积，念头浮动，心境受损',
  '思绪杂念扰心，心境受损',
];

function formatLevel(level) {
  const realmIndex = Math.min(Math.floor((level - 1) / 10), realmNames.length - 1);
  const stage = ((level - 1) % 10) + 1;
  return `${realmNames[realmIndex]}${stage}层`;
}

function moodLabel() {
  if (state.mood >= 85) return '澄明';
  if (state.mood >= 65) return '安稳';
  if (state.mood >= 45) return '浮躁';
  return '心魔潜伏';
}

function stonesRequired(level) {
  return Math.floor(6 + level * 1.6);
}

function formatDayRange(entry) {
  const range = entry.startDay === entry.endDay ? `第${entry.startDay}天` : `第${entry.startDay}-${entry.endDay}天`;
  return `${range} · ${entry.action}`;
}

function formatDetail(entry) {
  if (!entry.details || entry.details.length === 0) return '';

  if (entry.action === '修行') {
    const amounts = entry.details
      .filter((d) => d.type === 'xp')
      .map((d) => `${Math.max(0, Math.round(d.amount))}点`);
    if (amounts.length === 0) return '';
    return `修为增长${amounts.join('、')}`;
  }

  if (entry.action === '打工') {
    const amounts = entry.details
      .filter((d) => d.type === 'stones')
      .map((d) => `${Math.max(0, Math.round(d.amount))}灵石`);
    if (amounts.length === 0) return '';
    return `收入${amounts.join('、')}`;
  }

  if (entry.action === '突破') {
    const notes = entry.details.map((d) => d.note || '').filter(Boolean);
    return notes.join('；');
  }

  return entry.details.map((d) => d.note || '').filter(Boolean).join('；');
}

function formatEntryText(entry) {
  const base = formatDayRange(entry);
  const detail = formatDetail(entry);
  const events = entry.events && entry.events.length ? entry.events.join('；') : '';

  if (detail && events) return `${base}，${detail}；${events}`;
  if (detail) return `${base}，${detail}`;
  if (events) return `${base}；${events}`;
  return base;
}

function addDailyDetail(action, detail) {
  const entry = ensureLogEntry(action);
  entry.details.push(detail);
  entry.element.textContent = formatEntryText(entry);
}

function addMoodEvent(action, text) {
  const entry = ensureLogEntry(action);
  entry.events.push(text);
  entry.locked = true;
  entry.element.textContent = formatEntryText(entry);
}

function ensureLogEntry(action) {
  const day = state.tick;
  if (latestLogEntry && latestLogEntry.action === action && !latestLogEntry.locked) {
    latestLogEntry.endDay = day;
    latestLogEntry.element.textContent = formatEntryText(latestLogEntry);
    return latestLogEntry;
  }

  const entry = {
    startDay: day,
    endDay: day,
    action,
    element: document.createElement('div'),
    details: [],
    events: [],
    locked: false,
  };
  entry.element.className = 'log-entry';
  entry.element.textContent = formatEntryText(entry);
  ui.log.prepend(entry.element);
  while (ui.log.children.length > 80) {
    ui.log.removeChild(ui.log.lastChild);
  }
  latestLogEntry = entry;
  return entry;
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      level: state.level,
      xp: state.xp,
      xpToNext: state.xpToNext,
      spiritStones: state.spiritStones,
      mood: state.mood,
      tick: state.tick,
      activity: state.activity,
      activityDuration: state.activityDuration,
      activityProgress: state.activityProgress,
      pendingWorkReward: state.pendingWorkReward,
      workStreak: state.workStreak,
      cultivateStreak: state.cultivateStreak,
    })
  );

  localStorage.setItem(
    POMODORO_KEY,
    JSON.stringify({
      mode: pomodoro.mode,
      remaining: pomodoro.remaining,
      soundEnabled: pomodoro.soundEnabled,
      notifyEnabled: pomodoro.notifyEnabled,
    })
  );
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      Object.assign(state, data);
      clampXp();
    } catch (err) {
      console.warn('Failed to load save', err);
    }
  }

  const pomoRaw = localStorage.getItem(POMODORO_KEY);
  if (pomoRaw) {
    try {
      const saved = JSON.parse(pomoRaw);
      pomodoro.mode = saved.mode || 'work';
      pomodoro.remaining = saved.remaining || pomodoro.workLength;
      pomodoro.soundEnabled = Boolean(saved.soundEnabled);
      pomodoro.notifyEnabled = Boolean(saved.notifyEnabled);
    } catch (err) {
      console.warn('Failed to load pomodoro', err);
    }
  }
}

function clampXp() {
  const maxXp = Math.max(state.xpToNext, 1);
  state.xp = Math.min(Math.max(0, state.xp), maxXp);
}

function updateUI() {
  state.xp = Math.max(0, state.xp);
  ui.level.textContent = formatLevel(state.level);
  ui.xpLabel.textContent = `${state.xp.toFixed(0)} / ${state.xpToNext}`;
  ui.days.textContent = state.tick.toFixed(0);
  ui.stones.textContent = state.spiritStones.toFixed(0);
  ui.mood.textContent = moodLabel();

  const progress = Math.min((state.xp / state.xpToNext) * 100, 100);
  ui.xpBar.style.width = `${progress}%`;

  ui.statusChip.textContent = `当前：${state.activity}`;
  const statusClass = statusClassMap[state.activity] || 'cultivate';
  ui.statusChip.className = `status-chip status-${statusClass}`;
  ui.tempo.textContent = `修行节奏：${state.activity === '调心' ? '放缓' : '稳定'}`;

  updatePomodoroUI();
}

function baseGain() {
  const moodBonus = 0.85 + (state.mood - 60) / 90;
  const xpGain = 8 + state.level * 0.8;
  return {
    xp: xpGain * moodBonus,
  };
}

function formatTime(seconds) {
  const clamped = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(clamped / 60)).padStart(2, '0');
  const s = String(clamped % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updatePomodoroUI() {
  ui.pomoTimer.textContent = formatTime(pomodoro.remaining);
  ui.pomoStatus.textContent = pomodoro.mode === 'break' ? '休息中' : '专注中';

  if (pomodoro.mode === 'break') {
    ui.startPauseBtn.textContent = '跳过休息';
  } else {
    ui.startPauseBtn.textContent = pomodoro.running ? '暂停' : '开始';
  }

  ui.bellBtn.classList.toggle('active', pomodoro.soundEnabled);
  ui.notifyBtn.classList.toggle('active', pomodoro.notifyEnabled);
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn('Beep failed', err);
  }
}

function sendNotification() {
  if (!pomodoro.notifyEnabled || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification('番茄钟完成', { body: pomodoro.mode === 'work' ? '进入休息时间' : '开始新一轮专注', silent: true });
  }
}

function handlePomodoroComplete() {
  if (pomodoro.soundEnabled) {
    playBeep();
  }
  sendNotification();

  if (pomodoro.mode === 'work') {
    pomodoro.mode = 'break';
    pomodoro.remaining = pomodoro.breakLength;
    pomodoro.running = true;
  } else {
    pomodoro.mode = 'work';
    pomodoro.remaining = pomodoro.workLength;
    pomodoro.running = false;
  }

  updatePomodoroUI();
  saveState();
}

function pomodoroTick() {
  if (!pomodoro.running) return;
  pomodoro.remaining = Math.max(0, pomodoro.remaining - 1);
  if (pomodoro.remaining === 0) {
    handlePomodoroComplete();
  } else {
    updatePomodoroUI();
  }
}

function togglePomodoro() {
  if (pomodoro.mode === 'break') {
    skipRest();
    return;
  }
  pomodoro.running = !pomodoro.running;
  updatePomodoroUI();
  saveState();
}

function resetPomodoro() {
  pomodoro.mode = 'work';
  pomodoro.running = false;
  pomodoro.remaining = pomodoro.workLength;
  updatePomodoroUI();
  saveState();
}

function skipRest() {
  pomodoro.mode = 'work';
  pomodoro.running = false;
  pomodoro.remaining = pomodoro.workLength;
  updatePomodoroUI();
  saveState();
}

function addFiveMinutes() {
  pomodoro.remaining += 5 * 60;
  updatePomodoroUI();
  saveState();
}

function toggleBell() {
  pomodoro.soundEnabled = !pomodoro.soundEnabled;
  updatePomodoroUI();
  saveState();
}

function toggleNotify() {
  pomodoro.notifyEnabled = !pomodoro.notifyEnabled;
  if (pomodoro.notifyEnabled && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((res) => {
      if (res !== 'granted') {
        pomodoro.notifyEnabled = false;
      }
      updatePomodoroUI();
      saveState();
    });
  } else {
    updatePomodoroUI();
    saveState();
  }
}

function startActivity(name, duration) {
  state.activity = name;
  state.activityDuration = duration;
  state.activityProgress = 0;
  if (name === '打工') {
    state.pendingWorkReward = Number((1.8 + state.level * 0.4).toFixed(1));
  }
  if (name !== '打工') {
    state.workStreak = 0;
  }
  if (name !== '修行') {
    state.cultivateStreak = 0;
  }
}

function levelUp() {
  const cost = stonesRequired(state.level);
  if (state.spiritStones < cost) return;
  state.spiritStones -= cost;
  state.level += 1;
  state.xp = Math.max(0, state.xp - state.xpToNext);
  state.xpToNext = Math.floor(state.xpToNext * 1.18 + state.level * 12);
  if (state.xp >= state.xpToNext) {
    state.xp = Math.floor(state.xpToNext * 0.25);
  }
  state.mood = Math.min(state.mood + 10, 100);
}

function handleCultivation(action) {
  const gains = baseGain();
  const before = state.xp;
  state.xp += gains.xp;
  clampXp();
  const delta = Math.max(0, state.xp - before);
  addDailyDetail(action, { type: 'xp', amount: delta });

  if (state.mood < 55) {
    startActivity('调心', 6);
    return;
  }

  const required = stonesRequired(state.level);
  const needStones = state.spiritStones < required && state.xp > state.xpToNext * 0.6;
  if (needStones) {
    startActivity('打工', 8);
    return;
  }

  if (state.xp >= state.xpToNext && state.spiritStones >= required) {
    startActivity('突破', 5);
  }
}

function handleWork(action) {
  const fatigue = 1.4;
  state.mood = Math.max(20, state.mood - fatigue);
  state.activityProgress += 1;

  const isComplete = state.activityProgress >= state.activityDuration;
  const reward = isComplete ? state.pendingWorkReward : 0;
  if (reward > 0) {
    addDailyDetail(action, { type: 'stones', amount: reward });
  }

  if (isComplete) {
    state.spiritStones += reward;
    state.pendingWorkReward = 0;
    startActivity('修行', 0);
  }
}

function handleMeditation() {
  state.mood = Math.min(100, state.mood + 6.5);
  state.activityProgress += 1;

  if (state.mood >= 75 || state.activityProgress >= state.activityDuration) {
    startActivity('修行', 0);
  }
}

function handleBreakthrough() {
  state.activityProgress += 1;
  state.mood = Math.max(40, state.mood - 1);
  if (state.activityProgress >= state.activityDuration) {
    const target = formatLevel(state.level + 1);
    levelUp();
    addDailyDetail('突破', { note: `突破至${target}` });
    startActivity('修行', 0);
  }
}

function checkMoodEvents(action, streak) {
  if (action === '打工' && streak > 0 && streak % 3 === 0) {
    const drop = 12;
    state.mood = Math.max(15, state.mood - drop);
    const event = workMoodEvents[Math.floor(Math.random() * workMoodEvents.length)];
    addMoodEvent(action, event);
  }

  if (action === '修行' && streak > 0 && streak % 10 === 0) {
    const drop = 8;
    state.mood = Math.max(18, state.mood - drop);
    const event = cultivateMoodEvents[Math.floor(Math.random() * cultivateMoodEvents.length)];
    addMoodEvent(action, event);
  }
}

function tickGame() {
  state.tick += 1;
  const dayActivity = state.activity;
  ensureLogEntry(dayActivity);
  if (dayActivity !== '调心') {
    state.mood = Math.max(25, state.mood - 0.25);
  }

  if (dayActivity === '打工') {
    state.workStreak += 1;
    state.cultivateStreak = 0;
  } else if (dayActivity === '修行') {
    state.cultivateStreak += 1;
    state.workStreak = 0;
  } else {
    state.workStreak = 0;
    state.cultivateStreak = 0;
  }

  const streakSnapshot =
    dayActivity === '打工' ? state.workStreak : dayActivity === '修行' ? state.cultivateStreak : 0;

  switch (dayActivity) {
    case '修行':
      handleCultivation(dayActivity);
      break;
    case '调心':
      handleMeditation();
      break;
    case '打工':
      handleWork(dayActivity);
      break;
    case '突破':
      handleBreakthrough();
      break;
    default:
      startActivity('修行', 0);
  }

  checkMoodEvents(dayActivity, streakSnapshot);

  clampXp();
  updateUI();
  if (state.tick % 5 === 0) {
    saveState();
  }
}

loadState();
updateUI();
ui.startPauseBtn.addEventListener('click', togglePomodoro);
ui.resetBtn.addEventListener('click', resetPomodoro);
ui.addFiveBtn.addEventListener('click', addFiveMinutes);
ui.bellBtn.addEventListener('click', toggleBell);
ui.notifyBtn.addEventListener('click', toggleNotify);

setInterval(() => {
  tickGame();
  pomodoroTick();
}, 1000);
