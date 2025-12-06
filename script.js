const ui = {
  level: document.getElementById('level'),
  xpLabel: document.getElementById('xpLabel'),
  xpBar: document.getElementById('xpBar'),
  qi: document.getElementById('qi'),
  stones: document.getElementById('stones'),
  mood: document.getElementById('mood'),
  log: document.getElementById('log'),
  toggle: document.getElementById('toggleButton'),
  statusChip: document.getElementById('statusChip'),
  tempo: document.getElementById('tempo'),
  actionButtons: document.querySelectorAll('[data-action]'),
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

  ui.toggle.textContent = state.running ? '暂停修行' : '继续修行';
  ui.statusChip.textContent = state.running ? '后台修行中' : '已暂停';
  ui.tempo.textContent = `修行节奏：${state.running ? '正常' : '暂停'}`;
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
  state.level += 1;
  state.xp -= state.xpToNext;
  state.xpToNext = Math.floor(state.xpToNext * 1.18 + state.level * 12);
  state.mood = Math.min(state.mood + 8, 100);
  addLog(`境界突破，达到 <strong>${formatLevel(state.level)}</strong>！心境随之提升。`);
}

function tick() {
  if (!state.running) return;
  state.tick += 1;
  const gains = baseGain();
  state.xp += gains.xp;
  state.qi += gains.qi;

  if (state.tick % 20 === 0) {
    const stones = Math.floor(1 + Math.random() * 3);
    state.spiritStones += stones;
    addLog(`灵田稳产，额外获得 ${stones} 块灵石。`);
  }

  if (state.tick % 45 === 0) {
    state.mood = Math.max(45, state.mood - 6);
    addLog('长时间冥想有些枯燥，心境略有波动。');
  }

  while (state.xp >= state.xpToNext) {
    levelUp();
  }

  updateUI();
}

function handleAction(action) {
  switch (action) {
    case 'meditate':
      state.xp += 15;
      state.qi += 5;
      addLog('你短暂入定，神识清明，修为略有精进。');
      break;
    case 'gather':
      const stones = Math.floor(1 + Math.random() * 3);
      state.spiritStones += stones;
      addLog(`巡视灵田，收获 ${stones} 块灵石。`);
      break;
    case 'rest':
      state.mood = Math.min(state.mood + 10, 100);
      addLog('你静心吐纳，心境恢复平稳。');
      break;
    default:
      break;
  }
  updateUI();
}

ui.toggle.addEventListener('click', () => {
  state.running = !state.running;
  updateUI();
});

ui.actionButtons.forEach((btn) => {
  btn.addEventListener('click', () => handleAction(btn.dataset.action));
});

addLog('修行开始，你在后台静静吐息，感受天地灵气。');
updateUI();
setInterval(tick, 1000);
