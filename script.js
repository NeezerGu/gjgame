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
  battleDiff: document.getElementById('battleDiff'),
  battleTest: document.getElementById('battleTest'),
  fortuneTest: document.getElementById('fortuneTest'),
  testInfo: document.getElementById('testInfo'),
  testPanel: document.getElementById('testPanel'),
  gearHint: document.getElementById('gearHint'),
  artifactGrid: document.getElementById('artifactGrid'),
  tabButtons: document.querySelectorAll('.tab'),
};

const STORAGE_KEY = 'idle-cultivation-save-v2';
const POMODORO_KEY = 'idle-cultivation-pomo-v2';
const WINDOW_KEY = 'idle-cultivation-window';

const START_AGE_YEARS = 8;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;
const AUTO_LOG_LIMIT = 1000;
const DEMON_REAL_RATE = 1 / (100 * 24 * 60 * 60); // 100天现实时间一次
const MAX_TEST_INFO = 8;

let testMode = false;

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
  lifeDays: START_AGE_YEARS * DAYS_PER_YEAR,
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
  artifacts: [],
  battle: null,
  prevActivity: '修行',
};

const realmNames = ['练气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升'];

const statusClassMap = {
  修行: 'cultivate',
  打工: 'work',
  调心: 'mood',
  突破: 'break',
  疗伤: 'mood',
  濒死: 'break',
  战斗: 'battle',
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

const workMoodEvents = (() => {
  const fronts = [
    '遭遇同门欺压',
    '凡俗琐事纠缠',
    '任务被临时加码',
    '长夜加班',
    '灵石被克扣',
    '同伴冷嘲热讽',
    '被凡人上司斥责',
    '赶路迟到被罚',
    '恶劣天气出勤',
    '灵兽干扰劳作',
    '器材损坏重工',
    '同门争功抢赏',
    '凡俗吵闹不休',
    '灵气稀薄耗时',
    '搬运重物劳损',
    '被迫处理杂务',
    '账目对不上数',
    '坊市纠纷缠身',
    '误食辛辣之物',
    '舟车劳顿奔波',
  ];
  const tails = [
    '心神抽离，道心蒙尘',
    '精神透支，心境震荡',
    '心绪烦闷，意志受挫',
    '心湖泛起涟漪，意志摇晃',
    '心火滋生，浮躁难安',
  ];
  const list = [];
  fronts.forEach((f) => {
    tails.forEach((t) => {
      list.push(`${f}，${t}`);
    });
  });
  while (list.length < 110) {
    list.push(`劳役反复，${tails[list.length % tails.length]}`);
  }
  return list;
})();

const cultivateMoodEvents = [
  '闭关多日，烦躁暗生，心境受损',
  '灵力淤积，念头浮动，心境受损',
  '思绪杂念扰心，心境受损',
  '心神难静，灵光蒙尘',
  '丹田胀痛，意志受损',
];

const demonStories = [
  '前世遗憾化作恶念撕扯心神',
  '旧日执念凝成魔影，直扑识海',
  '尘世羁绊再现，心湖泛起巨浪',
];

const artifactPool = [
  { key: 'breeze-scroll', name: '清风玉简', desc: '修炼效率提升10%', effect: { xpBoost: 0.1 } },
  { key: 'moon-silk', name: '月华丝帛', desc: '修炼效率提升6%，心绪更宁静', effect: { xpBoost: 0.06, moodGuard: 0.02 } },
  { key: 'spirit-lantern', name: '灵光灯', desc: '修炼效率提升15%', effect: { xpBoost: 0.15 } },
  { key: 'jade-leaf', name: '翠玉叶', desc: '10%概率免疫心境受损', effect: { moodGuard: 0.1 } },
  { key: 'quiet-bead', name: '静心珠', desc: '15%概率免疫心境受损', effect: { moodGuard: 0.15 } },
  { key: 'flowing-ink', name: '流霞墨', desc: '修炼效率提升8%，战斗胜率提升5%', effect: { xpBoost: 0.08, battleBoost: 0.05 } },
  { key: 'iron-charm', name: '玄铁符', desc: '战斗胜率提升10%', effect: { battleBoost: 0.1 } },
  { key: 'spirit-scale', name: '灵鳞护符', desc: '战斗胜率提升6%，10%概率免疫心境受损', effect: { battleBoost: 0.06, moodGuard: 0.1 } },
  { key: 'jade-ring', name: '扶风玉环', desc: '修炼效率提升12%', effect: { xpBoost: 0.12 } },
  { key: 'stone-finder', name: '寻石铃', desc: '每日10%概率额外发现1枚灵石', effect: { stoneLuck: 0.1 } },
  { key: 'dew-pendant', name: '晨露坠', desc: '每日5%概率额外发现2枚灵石', effect: { stoneLuck: 0.05, stoneValue: 2 } },
  { key: 'feather-token', name: '灵羽令', desc: '战斗胜率提升8%', effect: { battleBoost: 0.08 } },
  { key: 'mist-robe', name: '雾岚衣', desc: '修炼效率提升5%，战斗胜率提升3%', effect: { xpBoost: 0.05, battleBoost: 0.03 } },
  { key: 'ancient-coin', name: '古铜钱', desc: '心境波动减缓，5%概率免疫心境受损', effect: { moodGuard: 0.05 } },
  { key: 'lotus-seed', name: '青莲子', desc: '修炼效率提升9%，心境平稳', effect: { xpBoost: 0.09, moodGuard: 0.04 } },
  { key: 'sun-feather', name: '朝阳羽', desc: '战斗胜率提升12%', effect: { battleBoost: 0.12 } },
  { key: 'star-sand', name: '星辰砂', desc: '修炼效率提升7%，战斗胜率提升4%', effect: { xpBoost: 0.07, battleBoost: 0.04 } },
  { key: 'jade-bell', name: '寒玉铃', desc: '10%概率免疫心境受损，战斗胜率提升2%', effect: { moodGuard: 0.1, battleBoost: 0.02 } },
  { key: 'echo-shell', name: '回音螺', desc: '每日8%概率额外发现灵石', effect: { stoneLuck: 0.08 } },
  { key: 'violet-charm', name: '紫电符', desc: '战斗胜率提升15%，但略显锋锐', effect: { battleBoost: 0.15 } },
  { key: 'earth-ward', name: '厚土符', desc: '修炼效率提升4%，战斗胜率提升6%', effect: { xpBoost: 0.04, battleBoost: 0.06 } },
  { key: 'mist-bead', name: '幻雾珠', desc: '心境防护15%，偶有灵石入袋', effect: { moodGuard: 0.15, stoneLuck: 0.03 } },
  { key: 'crane-plume', name: '仙鹤羽', desc: '修炼效率提升11%', effect: { xpBoost: 0.11 } },
  { key: 'ember-core', name: '余烬火核', desc: '战斗胜率提升7%，修炼效率提升5%', effect: { battleBoost: 0.07, xpBoost: 0.05 } },
  { key: 'balance-plate', name: '衡心石盘', desc: '20%概率免疫心境受损', effect: { moodGuard: 0.2 } },
  { key: 'quiet-fan', name: '清风扇', desc: '修炼效率提升6%，战斗胜率提升4%', effect: { xpBoost: 0.06, battleBoost: 0.04 } },
  { key: 'shadow-step', name: '影行符', desc: '战斗胜率提升5%，逃生几率稍高', effect: { battleBoost: 0.05, escapeBoost: 0.05 } },
  { key: 'soul-lantern', name: '镇魂灯', desc: '心魔劫可替死一次', effect: { demonSave: true } },
  { key: 'river-pebble', name: '溪灵石', desc: '修炼效率提升3%，心境更柔和', effect: { xpBoost: 0.03, moodGuard: 0.03 } },
  { key: 'pine-dew', name: '松露清酿', desc: '修炼效率提升10%，偶有灵石', effect: { xpBoost: 0.1, stoneLuck: 0.04 } },
  { key: 'starry-veil', name: '星雾纱', desc: '战斗胜率提升9%，心境波动减弱', effect: { battleBoost: 0.09, moodGuard: 0.06 } },
  { key: 'jade-pendant', name: '护身玉坠', desc: '战斗胜率提升6%，逃跑概率+5%', effect: { battleBoost: 0.06, escapeBoost: 0.05 } },
  { key: 'soft-sand', name: '软金砂', desc: '修炼效率提升13%', effect: { xpBoost: 0.13 } },
];

function artifactBonus(type) {
  return state.artifacts.reduce((sum, a) => sum + (a.effect[type] || 0), 0);
}

function hasArtifactFlag(flag) {
  return state.artifacts.some((a) => a.effect[flag]);
}

function consumeArtifactFlag(flag) {
  const idx = state.artifacts.findIndex((a) => a.effect[flag]);
  if (idx >= 0) {
    const [item] = state.artifacts.splice(idx, 1);
    pushTestInfo(`宝物消耗：${item.name}`);
    return item;
  }
  return null;
}

function addArtifact(item) {
  state.artifacts.push(item);
  addMajor(`获得宝物「${item.name}」`);
}

function randomArtifact() {
  const idx = Math.floor(Math.random() * artifactPool.length);
  return { ...artifactPool[idx] };
}

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

function renderArtifacts() {
  if (!ui.artifactGrid) return;
  ui.artifactGrid.innerHTML = '';
  if (!state.artifacts.length) {
    const empty = document.createElement('div');
    empty.className = 'artifact';
    empty.textContent = '暂无宝物';
    ui.artifactGrid.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  state.artifacts.slice(-20).forEach((a) => {
    const div = document.createElement('div');
    div.className = 'artifact';
    div.innerHTML = `<strong>${a.name}</strong><br/>${a.desc}`;
    fragment.appendChild(div);
  });
  ui.artifactGrid.appendChild(fragment);
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
  const entry = {
    startDay: Math.floor(state.totalDays),
    endDay: Math.floor(state.totalDays),
    action: '重大事项',
    details: [{ note: text }],
    events: [],
    locked: true,
  };
  state.autoLogs.push(entry);
  if (state.autoLogs.length > AUTO_LOG_LIMIT) {
    state.autoLogs.splice(0, state.autoLogs.length - AUTO_LOG_LIMIT);
  }
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
      if (!Array.isArray(state.artifacts)) state.artifacts = [];
      if (typeof state.lifeDays !== 'number') state.lifeDays = state.totalDays;
      if (!state.prevActivity) state.prevActivity = '修行';
      if (!state.battle) state.battle = null;
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
  ui.age.textContent = `${Math.max(0, Math.floor(state.lifeDays / DAYS_PER_YEAR))}岁`;
  ui.stones.textContent = state.spiritStones.toFixed(0);
  ui.mood.textContent = moodLabel();

  const progress = Math.min((state.xp / state.xpToNext) * 100, 100);
  ui.xpBar.style.width = `${progress}%`;

  ui.statusChip.textContent = `当前：${state.activity}`;
  const statusClass = statusClassMap[state.activity] || 'cultivate';
  ui.statusChip.className = `status-chip status-${statusClass}`;
  ui.tempo.textContent = `修行节奏：${state.activity === '调心' ? '放缓' : '稳定'}`;

  updatePomodoroUI();
  renderArtifacts();
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

const testMessages = [];
function pushTestInfo(text) {
  if (!ui.testInfo) return;
  const stamp = new Date().toLocaleTimeString();
  testMessages.push(`[${stamp}] ${text}`);
  while (testMessages.length > MAX_TEST_INFO) testMessages.shift();
  ui.testInfo.textContent = testMessages.join(' | ');
}

function setTestMode(enabled) {
  testMode = enabled;
  if (ui.testPanel) ui.testPanel.classList.toggle('active', enabled);
  if (ui.gearHint) {
    ui.gearHint.textContent = enabled ? '测试模式已开启' : '测试模式关闭';
    ui.gearHint.classList.toggle('alert', !enabled);
  }
}

window.testmode = function (pwd) {
  if (pwd === 'password') {
    setTestMode(true);
    pushTestInfo('测试模式开启');
    return 'OK';
  }
  pushTestInfo('密码错误');
  return '密码错误';
};

function switchLogTab(target) {
  ui.tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === target);
  });
  ui.log.classList.toggle('hidden', target === 'major');
  ui.majorLog.classList.toggle('hidden', target !== 'major');
}

function baseGain() {
  const moodBonus = 0.85 + (state.mood - 60) / 90;
  const xpGain = 8 + state.level * 0.8;
  const artifactBoost = 1 + artifactBonus('xpBoost');
  return { xp: xpGain * moodBonus * artifactBoost };
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
  const idle = !pomodoro.running && pomodoro.mode === 'work' && pomodoro.remaining === pomodoro.workLength;
  ui.pomoStatus.textContent = idle ? '未使用' : pomodoro.mode === 'break' ? '休息中' : '专注中';

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
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
  if (Notification.permission === 'granted') {
    new Notification('番茄钟完成', {
      body: pomodoro.mode === 'work' ? '进入休息时间' : '开始新一轮专注',
      silent: true,
    });
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
    handleFortuity();
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
  if (pomodoro.notifyEnabled && 'Notification' in window) {
    Notification.requestPermission().then((res) => {
      if (res !== 'granted') {
        pomodoro.notifyEnabled = false;
      }
      updatePomodoroUI();
      saveState();
    });
  } else {
    if (!('Notification' in window)) {
      pomodoro.notifyEnabled = false;
      alert('当前浏览器不支持通知');
    }
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

function startBattle(enemyLevel, source = '偶遇来敌') {
  if (state.battle) return;
  const playerRealm = Math.floor((state.level - 1) / 10);
  const enemyRealm = Math.floor((enemyLevel - 1) / 10);
  let winRate = 0.55 + (state.level - enemyLevel) * 0.1;
  if (enemyRealm > playerRealm) winRate = 0;
  if (enemyRealm < playerRealm) winRate = 1;
  const boost = artifactBonus('battleBoost');
  winRate += winRate * boost;
  winRate = Math.max(0.02, Math.min(0.98, winRate));

  const closeness = Math.max(1, Math.abs(state.level - enemyLevel));
  const avg = (state.level + enemyLevel) / 2;
  const durationBase = (closeness < 2 ? 32 : 14) * (avg / 10 + 1);
  const duration = Math.max(1, Math.min(320, Math.round(durationBase / Math.max(1, closeness / 2))));

  state.prevActivity = state.activity;
  state.battle = {
    enemyLevel,
    source,
    winRate,
    remaining: duration,
    realmGap: enemyRealm - playerRealm,
  };
  startActivity('战斗', duration);
  addDetail('战斗', { note: `${source}，对手${formatLevel(enemyLevel)}，胜率${Math.round(winRate * 100)}%` });
  pushTestInfo(
    `战斗开始，胜率${Math.round(winRate * 100)}%，预计${duration}天 | 赶尽杀绝10%，顿悟概率≈${Math.round(
      (1 - winRate) * 100
    )}%`
  );
}

function resolveBattle(win) {
  if (!state.battle) return;
  const { winRate, enemyLevel, realmGap, source } = state.battle;
  if (win) {
    addMajor(`战胜${formatLevel(enemyLevel)}（${source}）`);
    const enlightenChance = Math.max(0, 1 - winRate);
    if (Math.random() < enlightenChance) {
      const days = randRange(100, 300);
      const gain = Math.min(baseGain().xp * days, state.xpToNext - state.xp);
      state.xp += gain;
      addDetail('战斗', { note: `战后顿悟，等同修炼${days}天` });
      addMajor('战后顿悟，修为精进');
    }
    endBattle();
    startActivity('修行', 0);
    return;
  }

  const ruthless = Math.random() < 0.1;
  if (ruthless) {
    if (realmGap !== 0) {
      handleDeath('境界压制，遭对手赶尽杀绝');
      endBattle();
      return;
    }
    const escapeChance = Math.min(0.95, winRate + artifactBonus('escapeBoost'));
    if (Math.random() < escapeChance) {
      state.condition = '受伤';
      state.healTimer = randRange(30, 180);
      startActivity('疗伤', state.healTimer);
      addMajor('拼死逃脱，遍体鳞伤');
    } else {
      handleDeath('战败被杀，身死道消');
    }
    endBattle();
    return;
  }

  if (Math.random() < winRate) {
    addDetail('战斗', { note: '落败但全身而退' });
    endBattle();
    startActivity(state.prevActivity || '修行', 0);
    return;
  }

  if (Math.random() < winRate) {
    state.condition = '受伤';
    state.healTimer = randRange(30, 180);
    startActivity('疗伤', state.healTimer);
    addMajor('战败受伤，暂避锋芒');
  } else {
    state.condition = '濒死';
    state.nearDeathTimer = randRange(90, 180);
    startActivity('濒死', state.nearDeathTimer);
    addMajor('战败濒死，垂危挣扎');
  }
  endBattle();
}

function handleBattle() {
  if (!state.battle) {
    startActivity('修行', 0);
    return;
  }
  state.battle.remaining = Math.max(0, state.battle.remaining - 1);
  state.activityProgress += 1;
  if (state.battle.remaining <= 0) {
    const win = Math.random() < state.battle.winRate;
    resolveBattle(win);
  }
}

function endBattle() {
  state.battle = null;
  state.activity = '修行';
  state.activityDuration = 0;
  state.activityProgress = 0;
}

function checkMoodEvents(action, streak) {
  const guarded = () => Math.random() < artifactBonus('moodGuard');

  if (action === '打工' && streak > 0 && streak % 10 === 0) {
    if (!guarded()) {
      state.mood = Math.max(5, state.mood - 10);
      const event = workMoodEvents[Math.floor(Math.random() * workMoodEvents.length)];
      addMoodEvent(action, event);
    }
  }

  if (action === '修行' && streak > 0 && streak % 10 === 0) {
    if (!guarded()) {
      state.mood = Math.max(5, state.mood - 8);
      const event = cultivateMoodEvents[Math.floor(Math.random() * cultivateMoodEvents.length)];
      addMoodEvent(action, event);
    }
  }
}

function maybeEncounterDemon(force = false) {
  if (state.condition !== '正常') return false;
  const chance = force ? 1 : DEMON_REAL_RATE / Math.max(1, timeScale);
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
    if (consumeArtifactFlag('demonSave')) {
      const xpGain = Math.min(baseGain().xp * 360, state.xpToNext - state.xp);
      state.xp += xpGain;
      clampXp();
      addDetail('修行', { type: 'xp', amount: xpGain });
      addMajor('镇魂灯闪耀，化险为夷，修为反增');
    } else {
      state.condition = '受伤';
      state.healTimer = randRange(30, 180);
      startActivity('疗伤', state.healTimer);
      addMajor('心魔反噬，受伤闭关疗养');
    }
  } else if (roll < 0.6) {
    if (consumeArtifactFlag('demonSave')) {
      const xpGain = Math.min(baseGain().xp * 360, state.xpToNext - state.xp);
      state.xp += xpGain;
      clampXp();
      addDetail('修行', { type: 'xp', amount: xpGain });
      addMajor('镇魂灯护身，反噬化为顿悟');
    } else {
      state.condition = '濒死';
      state.nearDeathTimer = randRange(90, 180);
      startActivity('濒死', state.nearDeathTimer);
      addMajor('心魔重创，濒死挣扎');
    }
  } else {
    handleDeath('心魔爆发，神魂俱灭');
  }
  return true;
}

function triggerFortuityBattle() {
  const diff = randRange(-2, 3);
  const enemyLevel = Math.max(1, state.level + diff);
  const engageChance = diff > 0 ? 0.35 : 0.75;
  if (Math.random() < engageChance) {
    startBattle(enemyLevel, '奇遇试探');
  } else {
    addMajor('奇遇对峙后双方退让，无战事');
  }
}

function handleFortuity(force = false) {
  if (!force && Math.random() >= 0.1) return;
  const roll = Math.random();
  pushTestInfo(`奇遇触发，roll=${roll.toFixed(2)}`);
  if (roll < 0.01) {
    handleDeath('天罚突降，魂飞魄散');
    return;
  }
  if (roll < 0.31) {
    const item = randomArtifact();
    addArtifact(item);
    if (Math.random() < 0.1) {
      triggerFortuityBattle();
    }
    return;
  }
  addMajor('小有奇遇，但风平浪静，未起波澜');
}

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleMoodCollapse() {
  if (moodTier() === moodStages.length - 1 && Math.random() < 0.1) {
    handleDeath('道心崩塌，气息断绝');
  }
}

function maybeFindStones(action) {
  const chance = artifactBonus('stoneLuck');
  if (!chance) return;
  const values = state.artifacts
    .map((a) => (a.effect.stoneValue ? a.effect.stoneValue : 0))
    .filter((v) => v > 0);
  const value = values.length ? Math.max(...values) : 1;
  if (Math.random() < chance) {
    state.spiritStones += value;
    addDetail(action, { type: 'stones', amount: value });
  }
}

function handleDeath(reason) {
  addMajor(`死亡：${reason}`);
  state.reincarnation += 1;
  const sect = randomSect();
  addMajor(`转生轮回，第${state.reincarnation}世。${sect}弟子将于八岁觉醒记忆。`);
  latestLogEntry = null;
  const keepTotal = state.totalDays;
  Object.assign(state, {
    level: 1,
    xp: 0,
    xpToNext: 100,
    spiritStones: 0,
    mood: 70,
    totalDays: keepTotal,
    lifeDays: START_AGE_YEARS * DAYS_PER_YEAR,
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
    artifacts: state.artifacts,
    battle: null,
    prevActivity: '修行',
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
  state.lifeDays += 1;
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
    case '战斗':
      handleBattle();
      break;
    default:
      startActivity('修行', 0);
  }

  maybeFindStones(dayActivity);
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
  if (!testMode) {
    alert('请在控制台输入 testmode("password") 开启测试模式');
    return;
  }
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
    if (!testMode) {
      alert('请在控制台输入 testmode("password") 开启测试模式');
      return;
    }
    maybeEncounterDemon(true);
    updateUI();
    saveState();
  });

  ui.battleTest.addEventListener('click', () => {
    if (!testMode) {
      alert('请在控制台输入 testmode("password") 开启测试模式');
      return;
    }
    const diff = Number(ui.battleDiff.value) || 0;
    const enemyLevel = Math.max(1, state.level + diff);
    startBattle(enemyLevel, '测试遇敌');
    updateUI();
  });

  ui.fortuneTest.addEventListener('click', () => {
    if (!testMode) {
      alert('请在控制台输入 testmode("password") 开启测试模式');
      return;
    }
    handleFortuity(true);
  });

  ui.tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchLogTab(btn.dataset.tab));
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
setTestMode(false);
updateUI();
setupEvents();

setInterval(() => {
  tickGame(timeScale);
  pomodoroTick(timeScale);
  heartbeat();
}, 1000);
