const ui = {
  level: document.getElementById('level'),
  xpLabel: document.getElementById('xpLabel'),
  xpBar: document.getElementById('xpBar'),
  qi: document.getElementById('qi'),
  stones: document.getElementById('stones'),
  mood: document.getElementById('mood'),
  log: document.getElementById('log'),
  statusChip: document.getElementById('statusChip'),
  tempo: document.getElementById('tempo'),
};

const STORAGE_KEY = 'idle-cultivation-save-v1';

const state = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  qi: 0,
  spiritStones: 0,
  mood: 70,
  tick: 0,
  activity: '修行',
  activityDuration: 0,
  activityProgress: 0,
  pendingWorkReward: 0,
};

const realmNames = ['练气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升'];

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

function addLog(message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<strong>第 ${state.tick} 轮</strong> · ${message}`;
  ui.log.prepend(entry);
  while (ui.log.children.length > 80) {
    ui.log.removeChild(ui.log.lastChild);
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      level: state.level,
      xp: state.xp,
      xpToNext: state.xpToNext,
      qi: state.qi,
      spiritStones: state.spiritStones,
      mood: state.mood,
      tick: state.tick,
      activity: state.activity,
      activityDuration: state.activityDuration,
      activityProgress: state.activityProgress,
      pendingWorkReward: state.pendingWorkReward,
    })
  );
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data);
    clampXp();
    addLog('读取到上次的修行状态，继续前缘。');
  } catch (err) {
    console.warn('Failed to load save', err);
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
  ui.qi.textContent = state.qi.toFixed(0);
  ui.stones.textContent = state.spiritStones.toFixed(0);
  ui.mood.textContent = moodLabel();

  const progress = Math.min((state.xp / state.xpToNext) * 100, 100);
  ui.xpBar.style.width = `${progress}%`;

  ui.statusChip.textContent = `当前：${state.activity}`;
  ui.tempo.textContent = `修行节奏：${state.activity === '调心' ? '放缓' : '稳定'}`;
}

function baseGain() {
  const moodBonus = 0.85 + (state.mood - 60) / 90;
  const qiGain = 3 + state.level * 0.6;
  const xpGain = 8 + state.level * 0.8;
  return {
    xp: xpGain * moodBonus,
    qi: qiGain * moodBonus,
  };
}

function startActivity(name, duration) {
  state.activity = name;
  state.activityDuration = duration;
  state.activityProgress = 0;
  if (name === '打工') {
    state.pendingWorkReward = Number((1.8 + state.level * 0.4).toFixed(1));
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
  addLog(`消耗 ${cost} 块灵石突破，达到 <strong>${formatLevel(state.level)}</strong>！心境随之提升。`);
}

function handleCultivation() {
  const gains = baseGain();
  state.xp += gains.xp;
  state.qi += gains.qi;
  clampXp();

  if (state.mood < 55) {
    addLog('心绪渐躁，角色自动开始调息平复心境。');
    startActivity('调心', 6);
    return;
  }

  const required = stonesRequired(state.level);
  const needStones = state.spiritStones < required && state.xp > state.xpToNext * 0.6;
  if (needStones) {
    addLog('为了下次突破，角色决定外出打工换取灵石。');
    startActivity('打工', 8);
    return;
  }

  if (state.xp >= state.xpToNext && state.spiritStones >= required) {
    addLog('积累已满，开始静心冲击瓶颈。');
    startActivity('突破', 5);
  }
}

function handleWork() {
  const fatigue = 1.4;
  state.mood = Math.max(20, state.mood - fatigue);
  state.qi += 1.2;
  state.activityProgress += 1;

  if (state.activityProgress >= state.activityDuration) {
    state.spiritStones += state.pendingWorkReward;
    addLog(`一番忙碌赚得 ${state.pendingWorkReward.toFixed(1)} 块灵石，稍作休整继续修行。`);
    state.pendingWorkReward = 0;
    startActivity('修行', 0);
  }
}

function handleMeditation() {
  state.mood = Math.min(100, state.mood + 6.5);
  state.qi += 1;
  state.activityProgress += 1;

  if (state.mood >= 75 || state.activityProgress >= state.activityDuration) {
    addLog('心境恢复澄明，继续潜心修炼。');
    startActivity('修行', 0);
  }
}

function handleBreakthrough() {
  state.activityProgress += 1;
  state.mood = Math.max(40, state.mood - 1);
  if (state.activityProgress >= state.activityDuration) {
    levelUp();
    startActivity('修行', 0);
  }
}

function tick() {
  state.tick += 1;
  if (state.activity !== '调心') {
    state.mood = Math.max(25, state.mood - 0.25);
  }

  switch (state.activity) {
    case '修行':
      handleCultivation();
      break;
    case '调心':
      handleMeditation();
      break;
    case '打工':
      handleWork();
      break;
    case '突破':
      handleBreakthrough();
      break;
    default:
      startActivity('修行', 0);
  }

  clampXp();
  updateUI();
  if (state.tick % 5 === 0) {
    saveState();
  }
}

loadState();
addLog('修行开始，你在后台静静吐息，感受天地灵气。');
updateUI();
setInterval(tick, 1000);
