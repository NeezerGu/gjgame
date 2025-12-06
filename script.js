const ui = {
  level: document.getElementById('level'),
  xpLabel: document.getElementById('xpLabel'),
  xpBar: document.getElementById('xpBar'),
  years: document.getElementById('years'),
  age: document.getElementById('age'),
  stones: document.getElementById('stones'),
  mood: document.getElementById('mood'),
  log: document.getElementById('log'),
  majorLog: document.getElementById('majorLog'),
  statusChip: document.getElementById('statusChip'),
  tempo: document.getElementById('tempo'),
  pomoTimer: document.getElementById('pomoTimer'),
  pomoStatus: document.getElementById('pomoStatus'),
  startPauseBtn: document.getElementById('startPause'),
  resetBtn: document.getElementById('resetPomo'),
  addFiveBtn: document.getElementById('addFive'),
  bellBtn: document.getElementById('bellToggle'),
  notifyBtn: document.getElementById('notifyToggle'),
  gearGroup: document.getElementById('gearGroup'),
  demonTest: document.getElementById('demonTest'),
};

const STORAGE_KEY = 'idle-cultivation-save-v2';
const POMODORO_KEY = 'idle-cultivation-pomo-v2';
const WINDOW_KEY = 'idle-cultivation-window';

const START_AGE_YEARS = 8;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;
const AUTO_LOG_LIMIT = 1000;

let windowId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
let allowRun = true;
let latestLogEntry = null;
let timeScale = 1;

const state = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  spiritStones: 0,
  mood: 70,
  totalDays: START_AGE_YEARS * DAYS_PER_YEAR,
  activity: '修行',
  activityDuration: 0,
  activityProgress: 0,
  pendingWorkReward: 0,
  workStreak: 0,
  cultivateStreak: 0,
  condition: '正常',
  healTimer: 0,
  nearDeathTimer: 0,
  autoLogs: [],
  majorLogs: [],
  reincarnation: 0,
};

const realmNames = ['练气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升'];

const statusClassMap = {
  修行: 'cultivate',
  打工: 'work',
  调心: 'mood',
  突破: 'break',
  疗伤: 'mood',
  濒死: 'break',
};

const moodStages = [
  { min: 95, label: '道心如镜' },
  { min: 85, label: '澄澈安宁' },
  { min: 75, label: '温润如玉' },
  { min: 65, label: '心神安稳' },
  { min: 55, label: '微躁未起' },
  { min: 45, label: '浮动渐生' },
  { min: 35, label: '不稳压抑' },
  { min: 25, label: '念头纷杂' },
  { min: 15, label: '心魔压境' },
  { min: 0, label: '道心崩塌' },
];

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

const demonStories = [
  '前世遗憾化作恶念撕扯心神',
  '旧日执念凝成魔影，直扑识海',
  '尘世羁绊再现，心湖泛起巨浪',
];

function formatLevel(level) {
  const realmIndex = Math.min(Math.floor((level - 1) / 10), realmNames.length - 1);
  const stage = ((level - 1) % 10) + 1;
  return `${realmNames[realmIndex]}${stage}层`;
}

function moodLabel() {
  return moodStages.find((s) => state.mood >= s.min)?.label || moodStages[moodStages.length - 1].label;
}

function moodTier() {
  return moodStages.findIndex((s) => state.mood >= s.min);
}

function stonesRequired(level) {
  return Math.floor(6 + level * 1.6);
}

function dayToDate(dayCount) {
  const years = Math.floor(dayCount / DAYS_PER_YEAR);
  const rem = dayCount % DAYS_PER_YEAR;
  const months = Math.floor(rem / DAYS_PER_MONTH);
  const days = rem % DAYS_PER_MONTH;
  return { year: years, month: months + 1, day: days + 1 };
}

function formatRange(startDay, endDay) {
  const start = dayToDate(startDay);
  const end = dayToDate(endDay);
  if (start.year === end.year && start.month === end.month) {
    const range = start.day === end.day ? `${start.day}日` : `${start.day}-${end.day}日`;
    return `${start.year}年 ${start.month}月 ${range}`;
  }
  return `${start.year}年 ${start.month}月 ${start.day}日 - ${end.year}年 ${end.month}月 ${end.day}日`;
}

function formatEntry(entry) {
  const time = formatRange(entry.startDay, entry.endDay);
  const detailText = formatDetail(entry);
  const events = entry.events && entry.events.length ? entry.events.join('；') : '';
  if (detailText && events) return `${time} · ${entry.action}，${detailText}；${events}`;
  if (detailText) return `${time} · ${entry.action}，${detailText}`;
  if (events) return `${time} · ${entry.action}；${events}`;
  return `${time} · ${entry.action}`;
}

function formatDetail(entry) {
  if (!entry.details || entry.details.length === 0) return '';
  if (entry.action === '修行') {
    const amounts = entry.details.filter((d) => d.type === 'xp').map((d) => `${Math.max(0, Math.round(d.amount))}点`);
    if (amounts.length === 0) return '';
    return `修为增长${amounts.join('、')}`;
  }
  if (entry.action === '打工') {
    const amounts = entry.details.filter((d) => d.type === 'stones' && d.amount > 0).map((d) => `${Math.max(0, Math.round(d.amount))}灵石`);
    if (amounts.length === 0) return '';
    return `收入${amounts.join('、')}`;
  }
  if (entry.action === '突破') {
    const notes = entry.details.map((d) => d.note || '').filter(Boolean);
    return notes.join('；');
  }
  return entry.details.map((d) => d.note || '').filter(Boolean).join('；');
}

function renderLogs() {
  ui.log.innerHTML = '';
  const fragment = document.createDocumentFragment();
  state.autoLogs.slice(-80).forEach((entry) => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.textContent = formatEntry(entry);
    fragment.prepend(div);
  });
  ui.log.appendChild(fragment);

  ui.majorLog.innerHTML = '';
  const majorFragment = document.createDocumentFragment();
  state.majorLogs.slice(-200).forEach((entry) => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    const stamp = formatRange(entry.day, entry.day);
    div.textContent = `${stamp} · ${entry.text}`;
    majorFragment.prepend(div);
  });
  ui.majorLog.appendChild(majorFragment);
}

function addAutoLogEntry(action) {
  const day = Math.floor(state.totalDays);
  const last = latestLogEntry;
  if (last && last.action === action && !last.locked) {
    last.endDay = day;
    return last;
  }
  const entry = { startDay: day, endDay: day, action, details: [], events: [], locked: false };
  state.autoLogs.push(entry);
  if (state.autoLogs.length > AUTO_LOG_LIMIT) {
    state.autoLogs.splice(0, state.autoLogs.length - AUTO_LOG_LIMIT);
  }
  latestLogEntry = entry;
  return entry;
}

function addDetail(action, detail) {
  const entry = addAutoLogEntry(action);
  entry.details.push(detail);
}

function addMoodEvent(action, text) {
  const entry = addAutoLogEntry(action);
  entry.events.push(text);
  entry.locked = true;
}

function addMajor(text) {
  state.majorLogs.push({ day: Math.floor(state.totalDays), text });
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      latestAction: latestLogEntry ? latestLogEntry.action : null,
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
  localStorage.setItem('idle-cultivation-gear', String(timeScale));
  localStorage.setItem(WINDOW_KEY, JSON.stringify({ id: windowId, ts: Date.now() }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      Object.assign(state, data);
      const last = state.autoLogs[state.autoLogs.length - 1];
      latestLogEntry = last || null;
      if (!Array.isArray(state.autoLogs)) state.autoLogs = [];
      if (!Array.isArray(state.majorLogs)) state.majorLogs = [];
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

  const savedGear = Number(localStorage.getItem('idle-cultivation-gear'));
  if ([1, 10, 100, 1000].includes(savedGear)) {
    timeScale = savedGear;
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

  const currentDate = dayToDate(Math.floor(state.totalDays));
  ui.years.textContent = `${currentDate.year}年${currentDate.month}月`;
  ui.age.textContent = `${Math.max(0, Math.floor(state.totalDays / DAYS_PER_YEAR))}岁`;
  ui.stones.textContent = state.spiritStones.toFixed(0);
  ui.mood.textContent = moodLabel();

  const progress = Math.min((state.xp / state.xpToNext) * 100, 100);
  ui.xpBar.style.width = `${progress}%`;

  ui.statusChip.textContent = `当前：${state.activity}`;
  const statusClass = statusClassMap[state.activity] || 'cultivate';
  ui.statusChip.className = `status-chip status-${statusClass}`;
  ui.tempo.textContent = `修行节奏：${state.activity === '调心' ? '放缓' : '稳定'}`;

  updatePomodoroUI();
  renderLogs();
  highlightGear();
}

function highlightGear() {
  if (!ui.gearGroup) return;
  Array.from(ui.gearGroup.querySelectorAll('button')).forEach((btn) => {
    const val = Number(btn.dataset.gear);
    btn.classList.toggle('active', val === timeScale);
  });
}

function baseGain() {
  const moodBonus = 0.85 + (state.mood - 60) / 90;
  const xpGain = 8 + state.level * 0.8;
  return { xp: xpGain * moodBonus };
}

function formatTime(seconds) {
  const clamped = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(clamped / 60)).padStart(2, '0');
  const s = String(clamped % 60).padStart(2, '0');
  return `${m}:${s}`;
}

const pomodoro = {
  mode: 'work',
  remaining: 25 * 60,
  running: false,
  workLength: 25 * 60,
  breakLength: 5 * 60,
  soundEnabled: false,
  notifyEnabled: false,
};

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

function pomodoroTick(delta) {
  if (!allowRun) return;
  if (!pomodoro.running) return;
  pomodoro.remaining = Math.max(0, pomodoro.remaining - delta);
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
  addMajor(`突破至${formatLevel(state.level)}`);
}

function handleCultivation(action) {
  if (maybeEncounterDemon()) return;

  const gains = baseGain();
  const before = state.xp;
  state.xp += gains.xp;
  clampXp();
  const delta = Math.max(0, state.xp - before);
  addDetail(action, { type: 'xp', amount: delta });

  if (state.mood < 50 && moodTier() >= 8) {
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
  const fatigue = 1.6;
  state.mood = Math.max(5, state.mood - fatigue);
  state.activityProgress += 1;

  const isComplete = state.activityProgress >= state.activityDuration;
  const reward = isComplete ? state.pendingWorkReward : 0;
  if (reward > 0) {
    addDetail(action, { type: 'stones', amount: reward });
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

function handleHealing() {
  state.mood = Math.min(100, state.mood + 2);
  state.healTimer = Math.max(0, state.healTimer - 1);
  if (state.healTimer === 0) {
    state.condition = '正常';
    startActivity('修行', 0);
    addMajor('疗伤结束，状态恢复');
  }
}

function handleNearDeath() {
  state.nearDeathTimer = Math.max(0, state.nearDeathTimer - 1);
  const deathChance = 0.2 / Math.max(1, state.nearDeathTimer + 1);
  if (Math.random() < deathChance) {
    handleDeath('濒死未撑住，走向死亡');
    return;
  }
  if (state.nearDeathTimer === 0) {
    state.condition = '受伤';
    state.healTimer = randRange(30, 180);
    startActivity('疗伤', state.healTimer);
    addMajor('濒死劫后余生，转入疗伤');
  }
}

function handleBreakthrough() {
  state.activityProgress += 1;
  state.mood = Math.max(10, state.mood - 1);
  if (state.activityProgress >= state.activityDuration) {
    const target = formatLevel(state.level + 1);
    levelUp();
    addDetail('突破', { note: `突破至${target}` });
    addMajor(`突破至${target}`);
    startActivity('修行', 0);
  }
}

function checkMoodEvents(action, streak) {
  if (action === '打工' && streak > 0 && streak % 3 === 0) {
    state.mood = Math.max(5, state.mood - 12);
    const event = workMoodEvents[Math.floor(Math.random() * workMoodEvents.length)];
    addMoodEvent(action, event);
  }

  if (action === '修行' && streak > 0 && streak % 10 === 0) {
    state.mood = Math.max(5, state.mood - 8);
    const event = cultivateMoodEvents[Math.floor(Math.random() * cultivateMoodEvents.length)];
    addMoodEvent(action, event);
  }
}

function maybeEncounterDemon(force = false) {
  if (state.condition !== '正常') return false;
  const chance = force ? 1 : 0.01;
  if (!force && Math.random() > chance) return false;
  const story = demonStories[Math.floor(Math.random() * demonStories.length)];
  addMajor(`心魔来袭：${story}`);

  const roll = Math.random();
  if (roll < 0.05) {
    const xpGain = Math.min(baseGain().xp * 360, state.xpToNext - state.xp);
    state.xp += xpGain;
    clampXp();
    addDetail('修行', { type: 'xp', amount: xpGain });
    addMajor('历经心魔，心神更凝，修为大增');
  } else if (roll < 0.25) {
    state.condition = '受伤';
    state.healTimer = randRange(30, 180);
    startActivity('疗伤', state.healTimer);
    addMajor('心魔反噬，受伤闭关疗养');
  } else if (roll < 0.6) {
    state.condition = '濒死';
    state.nearDeathTimer = randRange(90, 180);
    startActivity('濒死', state.nearDeathTimer);
    addMajor('心魔重创，濒死挣扎');
  } else {
    handleDeath('心魔爆发，神魂俱灭');
  }
  return true;
}

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleMoodCollapse() {
  if (moodTier() === moodStages.length - 1 && Math.random() < 0.1) {
    handleDeath('道心崩塌，气息断绝');
  }
}

function handleDeath(reason) {
  addMajor(`死亡：${reason}`);
  state.reincarnation += 1;
  const sect = randomSect();
  addMajor(`转生轮回，第${state.reincarnation}世。${sect}弟子将于八岁觉醒记忆。`);
  latestLogEntry = null;
  Object.assign(state, {
    level: 1,
    xp: 0,
    xpToNext: 100,
    spiritStones: 0,
    mood: 70,
    totalDays: START_AGE_YEARS * DAYS_PER_YEAR,
    activity: '修行',
    activityDuration: 0,
    activityProgress: 0,
    pendingWorkReward: 0,
    workStreak: 0,
    cultivateStreak: 0,
    condition: '正常',
    healTimer: 0,
    nearDeathTimer: 0,
    autoLogs: state.autoLogs,
    majorLogs: state.majorLogs,
    reincarnation: state.reincarnation,
  });
  initialStory(sect);
}

function randomSect() {
  const names = ['碧霞仙宗', '归墟剑阁', '灵霄天宫', '九渊书院', '紫极道门'];
  return names[Math.floor(Math.random() * names.length)];
}

function initialStory(sectName) {
  addMajor('出生于凡尘，灵根潜藏');
  addMajor('童年平凡，劳作习武，心性渐成');
  addMajor('七岁识字，八岁觉醒前世记忆');
  addMajor(`被仙门发现，收录入${sectName}`);
}

function tickDay() {
  state.totalDays += 1;
  const dayActivity = state.activity;
  addAutoLogEntry(dayActivity);

  if (state.activity !== '调心') {
    state.mood = Math.max(0, state.mood - 0.25);
  }

  if (state.activity === '打工') {
    state.workStreak += 1;
    state.cultivateStreak = 0;
  } else if (state.activity === '修行') {
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
    case '疗伤':
      handleHealing();
      break;
    case '濒死':
      handleNearDeath();
      break;
    default:
      startActivity('修行', 0);
  }

  checkMoodEvents(dayActivity, streakSnapshot);
  if (moodTier() >= moodStages.length - 2 && !['疗伤', '濒死'].includes(state.activity)) {
    startActivity('调心', 8);
  }
  handleMoodCollapse();

  clampXp();
}

function tickGame(deltaDays) {
  if (!allowRun) return;
  for (let i = 0; i < deltaDays; i += 1) {
    tickDay();
  }
  updateUI();
  if (Math.floor(state.totalDays) % 5 === 0) {
    saveState();
  }
}

function handleGearClick(e) {
  const val = Number(e.target.dataset.gear);
  if (!val) return;
  timeScale = val;
  highlightGear();
  saveState();
}

function enforceSingleWindow() {
  const existingRaw = localStorage.getItem(WINDOW_KEY);
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw);
      if (existing.id && existing.id !== windowId && Date.now() - existing.ts < 5000) {
        allowRun = false;
        alert('请关闭之前的窗口后再继续体验。');
      } else {
        allowRun = true;
      }
    } catch (err) {
      console.warn('window token parse failed', err);
    }
  }
  if (!existingRaw) {
    allowRun = true;
  }
  localStorage.setItem(WINDOW_KEY, JSON.stringify({ id: windowId, ts: Date.now() }));
}

function heartbeat() {
  if (!allowRun) return;
  localStorage.setItem(WINDOW_KEY, JSON.stringify({ id: windowId, ts: Date.now() }));
}

function setupEvents() {
  ui.startPauseBtn.addEventListener('click', togglePomodoro);
  ui.resetBtn.addEventListener('click', resetPomodoro);
  ui.addFiveBtn.addEventListener('click', addFiveMinutes);
  ui.bellBtn.addEventListener('click', toggleBell);
  ui.notifyBtn.addEventListener('click', toggleNotify);
  ui.gearGroup.addEventListener('click', handleGearClick);
  ui.demonTest.addEventListener('click', () => {
    maybeEncounterDemon(true);
    updateUI();
    saveState();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === WINDOW_KEY) {
      enforceSingleWindow();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (localStorage.getItem(WINDOW_KEY)) {
      const data = JSON.parse(localStorage.getItem(WINDOW_KEY));
      if (data.id === windowId) {
        localStorage.removeItem(WINDOW_KEY);
      }
    }
  });
}

loadState();
if (state.majorLogs.length === 0) {
  initialStory(randomSect());
}
enforceSingleWindow();
updateUI();
setupEvents();

setInterval(() => {
  tickGame(timeScale);
  pomodoroTick(timeScale);
  heartbeat();
}, 1000);
