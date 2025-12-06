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
  phase: document.getElementById('phase'),
};

const state = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  qi: 0,
  spiritStones: 0,
  mood: 60,
  running: true,
  tick: 0,
  mode: 'cultivate', // cultivate | attune | work
  modeRemaining: 0,
  pendingNote: '',
};

const realmNames = ['练气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升'];

function formatLevel(level) {
  const realmIndex = Math.min(Math.floor((level - 1) / 10), realmNames.length - 1);
  const stage = ((level - 1) % 10) + 1;
  return `${realmNames[realmIndex]}${stage}层`;
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

function updateUI() {
  ui.level.textContent = formatLevel(state.level);
  ui.xpLabel.textContent = `${state.xp.toFixed(0)} / ${state.xpToNext}`;
  ui.qi.textContent = state.qi.toFixed(0);
  ui.stones.textContent = state.spiritStones.toFixed(0);
  ui.mood.textContent = state.mood >= 80 ? '澄明' : state.mood >= 60 ? '安稳' : '浮躁';

  const progress = Math.min((state.xp / state.xpToNext) * 100, 100);
  ui.xpBar.style.width = `${progress}%`;

  const phaseText =
    state.mode === 'attune'
      ? '调理心境'
      : state.mode === 'work'
      ? '外出打工'
      : '静心修行';

  ui.phase.textContent = `状态：${phaseText}`;
  ui.statusChip.textContent = state.running ? `后台修行中 · ${phaseText}` : '已暂停';
  ui.tempo.textContent = `修行节奏：${state.running ? phaseText : '暂停'}`;
}

function baseGain() {
  const moodBonus = 1 + (state.mood - 60) / 100;
  const qiGain = 3 + state.level * 0.6;
  const xpGain = 8 + state.level * 0.8;
  return {
    xp: xpGain * moodBonus,
    qi: qiGain * moodBonus,
  };
}

function levelUp() {
  const cost = breakthroughCost();
  if (state.spiritStones < cost) {
    if (state.pendingNote !== 'stone-shortage') {
      addLog('修为已满，但缺少突破所需的灵石。角色决定先外出打工筹措。');
      state.pendingNote = 'stone-shortage';
    }
    scheduleWork();
    return;
  }

  state.spiritStones -= cost;
  state.level += 1;
  state.xp -= state.xpToNext;
  state.xpToNext = Math.floor(state.xpToNext * 1.18 + state.level * 12);
  state.mood = Math.min(state.mood + 8, 100);
  state.pendingNote = '';
  addLog(`消耗 ${cost} 块灵石突破，达到 <strong>${formatLevel(state.level)}</strong>！心境随之提升。`);
}

function breakthroughCost() {
  return Math.max(5, Math.floor(state.level * 1.5 + 4));
}

function scheduleAttune() {
  if (state.mode !== 'attune') {
    state.mode = 'attune';
    state.modeRemaining = 10;
    addLog('心境浮躁，暂且停下修行调理心神。');
  }
}

function scheduleWork() {
  if (state.mode !== 'work') {
    state.mode = 'work';
    state.modeRemaining = 12;
    addLog('缺少灵石，角色外出打工，暂时停下修行。');
  }
}

function tick() {
  if (!state.running) return;
  state.tick += 1;

  if (state.mode === 'attune') {
    state.modeRemaining -= 1;
    state.mood = Math.min(state.mood + 4, 100);
    if (state.modeRemaining <= 0) {
      state.mode = 'cultivate';
      addLog('心绪平稳，重新投入静心修行。');
    }
  } else if (state.mode === 'work') {
    state.modeRemaining -= 1;
    const stones = Math.floor(1 + Math.random() * 2 + state.level * 0.2);
    state.spiritStones += stones;
    state.mood = Math.max(40, state.mood - 1);
    addLog(`打工劳累，但换来了 ${stones} 块灵石。`);
    if (state.modeRemaining <= 0) {
      state.mode = 'cultivate';
      addLog('结束打工，继续修行。');
    }
  } else {
    const gains = baseGain();
    state.xp += gains.xp;
    state.qi += gains.qi;

    if (state.tick % 45 === 0) {
      state.mood = Math.max(35, state.mood - 6);
      addLog('长时间冥想有些枯燥，心境略有波动。');
    }
  }

  while (state.xp >= state.xpToNext) {
    levelUp();
    if (state.mode !== 'cultivate') break;
  }

  if (state.mode === 'cultivate' && state.mood < 55) {
    scheduleAttune();
  }

  if (state.mode === 'cultivate' && state.xp >= state.xpToNext && state.spiritStones < breakthroughCost()) {
    scheduleWork();
  }

  if (state.tick % 15 === 0) {
    saveState();
  }

  updateUI();
}

function saveState() {
  const snapshot = { ...state, lastSaved: Date.now() };
  localStorage.setItem('idle-cultivation-save', JSON.stringify(snapshot));
}

function loadState() {
  const raw = localStorage.getItem('idle-cultivation-save');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data);
  } catch (e) {
    console.warn('存档读取失败，使用默认值', e);
  }
}

loadState();
addLog('修行开始，你在后台静静吐息，感受天地灵气。');
updateUI();
window.addEventListener('beforeunload', saveState);
setInterval(tick, 1000);
