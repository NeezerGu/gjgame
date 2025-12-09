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
  cautionInput: document.getElementById('cautionValue'),
  cautionDeathsInput: document.getElementById('cautionDeaths'),
  cautionSetBtn: document.getElementById('setCaution'),
  resetAllBtn: document.getElementById('resetAll'),
  stashTest: document.getElementById('stashTest'),
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
const MAX_ARTIFACTS = 9;
const TEST_INFO_LIFETIME = 30 * 1000;

const CAUTION_K = 0.03046;
const CAUTION_ALPHA = 0.493;

const LONGEVITY_BASE_RANGE = [50, 80];
const LONGEVITY_MAX_ROLL = 0.02;
const LONGEVITY_REALM_BONUS = {
  练气: 0,
  筑基: 100,
  结丹: 200,
  元婴: 400,
  化神: 1000,
  炼虚: 1500,
  合体: 3000,
  大乘: 5000,
  渡劫: 7000,
  飞升: 10000,
  仙: Infinity,
};

const REALM_CULTIVATE_GAIN = {
  练气: 10,
  筑基: 20,
  结丹: 40,
  元婴: 70,
  化神: 110,
  炼虚: 150,
  合体: 190,
  大乘: 230,
  渡劫: 265,
  飞升: 300,
  仙: 500,
};

const BREAK_COST = {
  练气: [16, 16, 24, 24, 24, 32, 32, 32, 40, 40],
  筑基: [80, 80, 100, 100, 100, 120, 120, 120, 140, 140],
  结丹: [300, 300, 350, 350, 350, 400, 400, 400, 450, 450],
  元婴: [960, 960, 1080, 1080, 1080, 1200, 1200, 1200, 1320, 1320],
  化神: [2500, 2500, 2750, 2750, 2750, 3000, 3000, 3000, 3250, 3250],
  炼虚: [6000, 6000, 6500, 6500, 6500, 7000, 7000, 7000, 7500, 7500],
  合体: [12600, 12600, 13500, 13500, 13500, 14400, 14400, 14400, 15300, 15300],
  大乘: [24000, 24000, 25500, 25500, 25500, 27000, 27000, 27000, 28500, 28500],
  渡劫: [45000, 45000, 45000, 47500, 47500, 47500, 47500, 50000, 50000, 50000],
  飞升: [80000],
};

const XIAN_BREAK_COST = 160000;

const LEVEL_NEED_EXP = {
  练气: [1898, 5694, 9490, 13286, 17082, 20878, 24674, 28470, 32266, 36062],
  筑基: [36066, 62118, 88170, 114222, 140274, 166326, 192378, 218430, 244482, 270534],
  结丹: [270536, 291528, 312520, 333512, 354504, 375496, 396488, 417480, 438472, 459464],
  元婴: [459466, 616918, 774370, 931822, 1089274, 1246726, 1404178, 1561630, 1719082, 1876534],
  化神: [1876537, 2140862, 2405187, 2669512, 2933837, 3198163, 3462488, 3726813, 3991138, 4255463],
  炼虚: [4255464, 5256472, 6257480, 7258488, 8259496, 9260504, 10261512, 11262520, 12263528, 13264536],
  合体: [13264537, 16805751, 20346965, 23888179, 27429393, 30970607, 34511821, 38053035, 41594249, 45135463],
  大乘: [45135465, 46298695, 47461925, 48625155, 49788385, 50951615, 52114845, 53278075, 54441305, 55604535],
  渡劫: [55604539, 58010197, 60415855, 62821513, 65227171, 67632829, 70038487, 72444145, 74849803, 77255461],
  飞升: [964476000],
};

const FLY_EXP = 964476000;
const XIAN_BASE_EXP = FLY_EXP * 3;

const realmOrder = ['练气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升'];
const TOTAL_PRE_LEVELS = realmOrder.reduce((sum, name) => sum + (name === '飞升' ? 1 : 10), 0);

let testMode = false;

let windowId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
let allowRun = true;
let latestLogEntry = null;
let timeScale = 1;

const state = {
  level: 1,
  xp: 0,
  xpToNext: LEVEL_NEED_EXP['练气'][0],
  spiritStones: 0,
  mood: 70,
  totalDays: START_AGE_YEARS * DAYS_PER_YEAR,
  lifeDays: START_AGE_YEARS * DAYS_PER_YEAR,
  activity: '修行',
  activityDuration: 0,
  activityProgress: 0,
  pendingWorkReward: 0,
  workPlan: null,
  workStreak: 0,
  cultivateStreak: 0,
  planMode: '冲境界',
  knownMaxLevel: 1,
  condition: '正常',
  healTimer: 0,
  nearDeathTimer: 0,
  autoLogs: [],
  majorLogs: [],
  reincarnation: 0,
  artifacts: [],
  stashes: [],
  lastStashDay: 0,
  lastTheftRollLife: 0,
  lastStashReminderLife: 0,
  firstLifeStashSettled: false,
  bestLevelThisLife: 1,
  lastLifePeak: 0,
  lifespanBase: 0,
  lifespanYears: 0,
  lifespanBonus: 0,
  lifespanApplied: {},
  lifespanWarned: { finalYear: false, tenYear: false },
  battle: null,
  prevActivity: '修行',
  caution: 100,
  cautionDeaths: 0,
  levelRepeats: { 1: 1 },
  finalLegacyPrepared: false,
};

ensureLifespan();

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

function expandTasks(base) {
  const suffixes = ['（晨勤）', '（夜巡）', '（外派）', '（轮值）', '（督查）', '（援助）'];
  const list = [...new Set(base)];
  let i = 0;
  while (list.length < 40) {
    const suffix = suffixes[i % suffixes.length];
    list.push(`${base[i % base.length]}${suffix}`);
    i += 1;
  }
  return list;
}

const WORK_TASKS = {
  练气: expandTasks([
    '翻耕灵田培土',
    '搬运柴火煮药',
    '挑水润泽药苗',
    '采摘凡药换取灵石',
    '协助守门值夜',
    '清扫练武场',
    '雕刻简易灵符',
    '照料幼灵兽',
    '砍伐灵竹做器',
    '打水洗炼器材',
    '修补道袍与草鞋',
    '协助师兄抄录手抄本',
    '采集晨露炼制灵饮',
    '巡山驱逐小兽',
    '整理藏书阁灰尘',
    '搬运矿石入库',
    '磨制灵石碎料',
    '协助晾晒符纸',
    '看守坊市摊位',
    '浇灌灵田灵泉',
    '护送凡人货运短途',
  ]),
  筑基: expandTasks([
    '镇守坊市巡视',
    '绘制低阶符箓',
    '炼制入门丹药',
    '采挖二阶灵矿',
    '照看灵脉节点',
    '雕琢灵石阵眼',
    '护送凡商远行',
    '修缮宗门外墙',
    '校准传音阵盘',
    '记录弟子考核',
    '煅烧灵铁打坯',
    '巡逻山门护阵',
    '驯养坐骑灵禽',
    '布置小型聚灵阵',
    '协助炼器锤炼胚体',
    '照料伤患灵草药浴',
    '守护丹房火候',
    '搬运灵木建阁',
    '采摘三阶灵果',
    '测绘秘境草图',
    '审核凡俗贡品',
  ]),
  结丹: expandTasks([
    '主持小型采矿队',
    '炼制疗伤灵丹',
    '协助开辟灵脉支渠',
    '巡察各峰灵气输送',
    '修补护山大阵裂纹',
    '策划凡俗城镇防御',
    '护送灵材商队远行',
    '收购并挑选稀有灵材',
    '炼制符箭供应外门',
    '打磨飞剑坯胎',
    '校场演练指导外门',
    '炼制灵舟部件',
    '开凿灵石矿脉试坑',
    '清理灵兽园禁制',
    '协助长老主持考核',
    '搜集灵药并晾晒',
    '协助缝合阵旗',
    '修复古籍并抄录',
    '建立凡俗传送落点',
    '筹备祭祀香火',
    '看护秘藏入口',
  ]),
  元婴: expandTasks([
    '镇守跨域商道',
    '炼制高阶护身符',
    '主持灵舟航行',
    '采伐四阶灵木',
    '镇压灵脉暴动',
    '缝合大阵断层',
    '坐镇丹房开炉',
    '守护天材地宝成熟',
    '巡查外派据点',
    '训练执法弟子',
    '开辟秘境临时营地',
    '封印失控灵兽',
    '指导炼器刻纹',
    '调试跨域传送阵',
    '护送贡品入宗',
    '盘点库藏灵材',
    '编撰任务卷宗',
    '裁决外门纷争',
    '镇压妖域边患',
    '行走凡间收税',
    '巡视洞天入口',
  ]),
  化神: expandTasks([
    '主持域外矿区开采',
    '炼制元婴护道丹',
    '压阵护送宗门大使',
    '镇守跨界传送枢纽',
    '封印危险裂隙',
    '雕琢大型阵盘',
    '培养亲传弟子',
    '坐镇炼器大炉',
    '修复古阵基石',
    '编纂功法注解',
    '接引散修入盟',
    '协调各峰资源',
    '炼制护宗灵甲',
    '督战妖域前线',
    '镇守灵舟舰队',
    '疏导灵脉洪流',
    '承办宗门谈判',
    '镇压魔修据点',
    '筹建跨域节点',
    '修葺通天塔阶',
    '坐镇秘境关隘',
  ]),
  炼虚: expandTasks([
    '镇守界域封锁线',
    '炼制虚空舟锚',
    '清剿星盗余孽',
    '开辟小型洞天',
    '稳固域外据点',
    '收服古兽为坐骑',
    '镇压失控灵潮',
    '主持跨界贸易',
    '炼制化神突破丹',
    '布置万里护宗阵',
    '牵引流星灵铁',
    '校准星图航线',
    '安抚附庸宗门',
    '炼制灵植温养塔',
    '修复坍塌灵井',
    '镇守天外魔渊',
    '锚定界碑走向',
    '采集九天灵雷',
    '修缮天机宝库',
    '镇守王都灵脉',
    '巡查仙盟约法',
  ]),
  合体: expandTasks([
    '坐镇仙盟议事',
    '统筹大战后勤',
    '镇守仙舟车队',
    '炼制大乘淬体丹',
    '布置跨界援军阵道',
    '镇压逆灵风暴',
    '巡查星海灵矿',
    '监管九幽封印',
    '策划宗门迁都',
    '督造灵舰炮台',
    '招募域外散修',
    '掌控十万里星河航线',
    '主持大型拍卖会',
    '筹备宗门祭祀',
    '清理旧界残阵',
    '修复界壁裂痕',
    '统筹天材拍卖',
    '缓和宗门纠纷',
    '布置星轨炮位',
    '镇守灵脉中枢',
    '主持盟约签订',
  ]),
  大乘: expandTasks([
    '镇守仙盟天柱',
    '操纵万剑归宗阵',
    '镇压界域大劫',
    '指挥天军征讨',
    '布局护界星阵',
    '炼制渡劫符器',
    '坐镇万灵议会',
    '调遣灵舰舰队',
    '主持界域谈判',
    '护送天才出境历练',
    '稳定界心天柱',
    '裁决仙盟纷争',
    '开辟星港航道',
    '调度灵脉换向',
    '掌控域门通行',
    '主持天象观测',
    '镇守神兵库',
    '调遣补给星链',
    '封存灾厄遗迹',
    '筹备界域祈福',
    '主持天机推演',
  ]),
  渡劫: expandTasks([
    '筹谋渡劫资源',
    '稳固天劫避雷针',
    '坐镇雷池护法',
    '镇压四野妖潮',
    '布局护劫灵阵',
    '收敛天外劫云样本',
    '主持万民祈福',
    '封存劫后残骸',
    '护送同道赴劫地',
    '镇守劫场入口',
    '调度劫后重建',
    '剿灭趁火打劫之徒',
    '镇守天劫缓冲阵',
    '封印劫雷余波',
    '布置星辰牵引',
    '稳固护体真灵',
    '监修渡劫密卷',
    '筹备护道灵宝',
    '护送凡俗撤离',
    '镇守帝都天柱',
    '引导灵河改道',
  ]),
  飞升: expandTasks([
    '整理飞升通道',
    '协调下界供奉',
    '检修飞升台阵纹',
    '护送飞升使者',
    '记录界域功绩',
    '维护功德碑',
    '封存凡间传承',
    '整备界门钥匙',
    '观测界壁波动',
    '验证飞升候选资格',
    '巡察飞升台护法',
    '校对飞升仪轨',
    '筹备供奉灵材',
    '守护飞升天梯',
    '调度界域灵脉',
    '疏通飞升灵河',
    '安置飞升候补',
    '守望天劫预警',
    '协调仙舟接引',
    '拟定飞升祈文',
  ]),
  仙: expandTasks([
    '主持下界监察',
    '调遣仙宫执令',
    '巡游星域秩序',
    '修补天道裂缝',
    '编织仙阵守护星河',
    '点化下界传人',
    '坐镇天庭奏章',
    '裁决仙凡纷争',
    '炼制仙品灵宝雏形',
    '锚定界域航道',
    '勘察星海隐患',
    '执掌云雷司令',
    '调和诸天灵脉',
    '主持飞升天梯护持',
    '镇压天魔乱流',
    '守望寰宇边关',
    '记录星辰运转',
    '接引渡世飞升者',
    '巡视仙籍功过',
    '监督仙兵操演',
    '重塑残损仙阵',
  ]),
};

const WORK_DURATION = {
  练气: [8, 12],
  筑基: [9, 13],
  结丹: [10, 14],
  元婴: [11, 16],
  化神: [12, 18],
  炼虚: [13, 20],
  合体: [14, 22],
  大乘: [16, 24],
  渡劫: [18, 26],
  飞升: [22, 28],
  仙: [24, 30],
};

const WORK_REWARD = {
  练气: [3, 8],
  筑基: [8, 20],
  结丹: [20, 50],
  元婴: [50, 120],
  化神: [120, 250],
  炼虚: [250, 500],
  合体: [500, 900],
  大乘: [900, 1500],
  渡劫: [1500, 2500],
  飞升: [2500, 4000],
  仙: [4000, 8000],
};

const WORK_CONFIG = Object.fromEntries(
  Object.keys(WORK_TASKS).map((realm) => [realm, { duration: WORK_DURATION[realm], reward: WORK_REWARD[realm], tasks: WORK_TASKS[realm] }])
);

const artifactIcons = {
  'breeze-scroll': '📜',
  'moon-silk': '🌙',
  'spirit-lantern': '🏮',
  'jade-leaf': '🍃',
  'quiet-bead': '🟣',
  'flowing-ink': '🖋️',
  'iron-charm': '🧿',
  'spirit-scale': '🐉',
  'jade-ring': '💍',
  'stone-finder': '🔔',
  'dew-pendant': '💧',
  'feather-token': '🪶',
  'mist-robe': '🧥',
  'ancient-coin': '🪙',
  'lotus-seed': '🌸',
  'sun-feather': '☀️',
  'star-sand': '✨',
  'jade-bell': '🔔',
  'echo-shell': '🐚',
  'violet-charm': '⚡',
  'earth-ward': '🪨',
  'mist-bead': '💠',
  'crane-plume': '🪽',
  'ember-core': '🔥',
  'balance-plate': '🪬',
  'quiet-fan': '🪭',
  'shadow-step': '🕴️',
  'soul-lantern': '🕯️',
  'river-pebble': '🪨',
  'pine-dew': '🍶',
  'starry-veil': '🌌',
  'jade-pendant': '🛡️',
  'soft-sand': '🏜️',
};

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

function withArtifactMeta(raw) {
  if (!raw) return raw;
  const base = artifactPool.find((a) => a.key === raw.key) || raw;
  return {
    ...base,
    ...raw,
    icon: raw.icon || artifactIcons[raw.key] || artifactIcons[base.key] || '🔮',
    id: raw.id || `art-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

function consumeArtifactFlag(flag) {
  const idx = state.artifacts.findIndex((a) => a.effect[flag]);
  if (idx >= 0) {
    const [item] = state.artifacts.splice(idx, 1);
    pushTestInfo(`天道灵宝消耗：${item.name}`);
    return item;
  }
  return null;
}

function addArtifact(item) {
  const artifact = withArtifactMeta(item);
  if (state.artifacts.length >= MAX_ARTIFACTS) {
    addMajor(`天道灵宝达到上限，无法获得「${artifact.name}」`);
    pushTestInfo(`天道灵宝上限，放弃「${artifact.name}」`);
    return;
  }
  state.artifacts.push(artifact);
  addMajor(`获得天道灵宝「${artifact.name}」`);
}

function randomArtifact() {
  const idx = Math.floor(Math.random() * artifactPool.length);
  return withArtifactMeta({ ...artifactPool[idx] });
}

function levelToRealmStage(level) {
  const safeLevel = Math.max(1, Math.floor(level));
  let idx = safeLevel;
  for (const realm of realmOrder) {
    const maxStage = realm === '飞升' ? 1 : 10;
    if (idx <= maxStage) return { realm, stage: idx };
    idx -= maxStage;
  }
  return { realm: '仙', stage: idx };
}

function requiredXp(level) {
  const { realm, stage } = levelToRealmStage(level);
  if (LEVEL_NEED_EXP[realm]) {
    const arr = LEVEL_NEED_EXP[realm];
    return arr[Math.min(arr.length - 1, Math.max(0, stage - 1))];
  }
  if (realm === '飞升') return FLY_EXP;
  if (realm === '仙') return Math.round(XIAN_BASE_EXP * (1 + 0.05 * Math.max(0, stage - 1)));
  return LEVEL_NEED_EXP['渡劫'][LEVEL_NEED_EXP['渡劫'].length - 1];
}

function levelRepeatCount(level) {
  if (!state.levelRepeats) state.levelRepeats = { 1: 1 };
  return state.levelRepeats[level] || 0;
}

function registerLevelEntry(level) {
  if (!state.levelRepeats) state.levelRepeats = {};
  state.levelRepeats[level] = (state.levelRepeats[level] || 0) + 1;
}

function ensureLevelEntry(level) {
  if (!state.levelRepeats) state.levelRepeats = {};
  if (!state.levelRepeats[level]) state.levelRepeats[level] = 1;
}

function gainPerSecond(realm) {
  const base = REALM_CULTIVATE_GAIN[realm] || REALM_CULTIVATE_GAIN['飞升'];
  const repeats = levelRepeatCount(state.level);
  const capped = Math.min(20, repeats);
  const highProb = 0.2 + (0.3 * capped) / 20; // up to 50%
  const minFactor = 0.8 + (0.2 * capped) / 20; // up to 1.0
  const roll = Math.random();
  const factor = roll < highProb ? 1.2 : minFactor + Math.random() * (1.2 - minFactor);
  return base * factor;
}

function formatLevel(level) {
  const { realm, stage } = levelToRealmStage(level);
  if (realm === '飞升') return '飞升';
  if (realm === '仙') return `仙${stage}层`;
  return `${realm}${stage}层`;
}

function cautionFactor() {
  return Math.max(0, state.caution) / 100;
}

function cautionIntensity(ageYears) {
  const bEff = Math.max(ageYears, 1e-6);
  const x = Math.log(bEff / 100) / Math.log(10);
  return 1 + 0.3 * Math.tanh(x);
}

function cautionLambdaBase(times) {
  if (times <= 0) return 0;
  const prevPow = times === 1 ? 0 : (times - 1) ** CAUTION_ALPHA;
  const currPow = times ** CAUTION_ALPHA;
  const delta = CAUTION_K * (currPow - prevPow);
  return 1 - Math.exp(-delta);
}

function cautionStep(ageYears) {
  const nextTimes = (state.cautionDeaths || 0) + 1;
  const baseRate = cautionLambdaBase(nextTimes);
  const rate = baseRate * cautionIntensity(ageYears);
  const nextValue = Math.max(0, state.caution * (1 - rate));
  state.cautionDeaths = nextTimes;
  state.caution = nextValue;
  addMajor('生死一遭，道心更慎，行事愈加小心翼翼');
}

function currentLife() {
  return (state.reincarnation || 0) + 1;
}

function stashWealthThreshold(realm) {
  const cfg = WORK_CONFIG[realm] || WORK_CONFIG['练气'];
  const maxReward = cfg.reward[1];
  const avgDuration = Math.max(1, (cfg.duration[0] + cfg.duration[1]) / 2);
  const yearlyReward = maxReward * (DAYS_PER_YEAR / avgDuration);
  return yearlyReward * randRange(5, 10);
}

function describeStashContents(stash) {
  const parts = [];
  if (stash.stones > 0) parts.push(`${stash.stones}枚灵石`);
  if (Array.isArray(stash.artifacts) && stash.artifacts.length) {
    const names = stash.artifacts.map((a) => `「${a.name}」`);
    parts.push(`天道灵宝${names.join('、')}`);
  }
  return parts.join('和') || '一些不起眼的小物件';
}

function createStash(reason, options = {}) {
  const {
    portionRange = [0.3, 0.5],
    includeArtifactChance = 0.15,
    force = false,
    takeAll = false,
  } = options;
  let stones = 0;
  const stashArtifacts = [];

  if (takeAll) {
    stones = Math.floor(state.spiritStones);
    if (Array.isArray(state.artifacts) && state.artifacts.length) {
      stashArtifacts.push(...state.artifacts.splice(0));
    }
  } else {
    const min = Math.max(0, portionRange[0]);
    const max = Math.max(min, portionRange[1]);
    const fraction = min + Math.random() * (max - min);
    stones = Math.floor(state.spiritStones * fraction);

    if (state.artifacts.length > 1 && Math.random() < includeArtifactChance) {
      const idx = Math.floor(Math.random() * state.artifacts.length);
      const [artifact] = state.artifacts.splice(idx, 1);
      stashArtifacts.push(artifact);
    }
  }

  if (!force && stones <= 0 && stashArtifacts.length === 0) return false;

  if (stones > 0) {
    state.spiritStones -= stones;
  }

  const stash = {
    id: `stash-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdLife: currentLife(),
    stones,
    artifacts: stashArtifacts,
    stolen: false,
    opened: false,
    openedLife: null,
  };

  state.stashes.push(stash);
  const contentText = describeStashContents(stash);
  addMajor(reason || `你悄然将${contentText}埋入隐蔽之所，以备后用。`);
  state.lastStashDay = Math.floor(state.totalDays);
  return true;
}

function pendingStashes() {
  const life = currentLife();
  return (state.stashes || []).filter((stash) => !stash.opened && stash.createdLife < life);
}

function rollStashTheft() {
  const life = currentLife();
  if (state.lastTheftRollLife === life) return;
  state.lastTheftRollLife = life;
  state.stashes = (state.stashes || []).map((stash) => {
    if (stash.opened || stash.createdLife >= life) return stash;
    const stolen = stash.stolen || Math.random() < 0.05;
    return { ...stash, stolen };
  });
}

function remindStashMemory() {
  const life = currentLife();
  rollStashTheft();
  if (state.lastStashReminderLife === life) return;
  const pending = pendingStashes();
  if (pending.length > 0) {
    addMajor('前世藏宝的记忆浮现，决心至练气五层后再去寻回。');
    state.lastStashReminderLife = life;
  }
}

function maybeOpenStashes() {
  const { realm, stage } = levelToRealmStage(state.level);
  if (realm === '练气' && stage < 5) return;
  const life = currentLife();
  const available = pendingStashes();
  if (!available.length) return;

  available.forEach((stash) => {
    stash.opened = true;
    stash.openedLife = life;
    if (stash.stolen) {
      addMajor('记忆中的藏宝已被人捷足先登，空余旧坑。');
      return;
    }

    const gains = [];
    if (stash.stones > 0) {
      state.spiritStones += stash.stones;
      gains.push(`${stash.stones}枚灵石`);
    }

    if (Array.isArray(stash.artifacts) && stash.artifacts.length) {
      const restored = [];
      stash.artifacts.forEach((item) => {
        const artifact = withArtifactMeta(item);
        if (state.artifacts.length < MAX_ARTIFACTS) {
          state.artifacts.push(artifact);
          restored.push(`「${artifact.name}」`);
        }
      });
      if (restored.length) {
        gains.push(`天道灵宝${restored.join('、')}`);
      }
    }

    const content = gains.length ? gains.join('，') : '空空如也';
    addMajor(`掘出前世藏宝，获得${content}`);
    stash.stones = 0;
    stash.artifacts = [];
  });

  updatePlanMode();
}

function maybeFirstLifeStash() {
  if (state.reincarnation !== 0 || state.firstLifeStashSettled) return;
  const chance = Math.random();
  if (chance > 0.05) {
    state.firstLifeStashSettled = true;
    return;
  }
  const { realm } = levelToRealmStage(state.level);
  const threshold = stashWealthThreshold(realm);
  if (state.spiritStones < threshold) {
    state.firstLifeStashSettled = true;
    return;
  }

  createStash('一种朦胧的不安让你把少量灵石和一件小物件埋在某处，以防将来有用。', {
    portionRange: [0.1, 0.2],
    includeArtifactChance: 0.2,
  });

  state.firstLifeStashSettled = true;
}

function maybeAccumulateStash() {
  if (state.planMode !== '打工攒积累') return;
  const realm = levelToRealmStage(state.level).realm;
  const cfg = WORK_CONFIG[realm] || WORK_CONFIG['练气'];
  const target = cfg.reward[1] * DAYS_PER_YEAR;
  if (state.spiritStones <= target) return;
  if (state.totalDays - state.lastStashDay < 180) return;

  const ok = createStash('灵机一动，你以玉符封存部分灵石与零散物事，寄望后世再取。', {
    portionRange: [0.3, 0.5],
    includeArtifactChance: 0.25,
  });

  if (ok) {
    pushTestInfo('自动藏宝：跨世积累触发');
  }
}

function maybePrepareFinalStash(force = false) {
  if (state.reincarnation < 1) return;
  if (state.planMode !== '打工攒积累') return;
  if (state.finalLegacyPrepared) return;
  const monthThreshold = DAYS_PER_MONTH / DAYS_PER_YEAR;
  if (!force && remainingYears() > monthThreshold) return;
  const hasLoot = state.spiritStones > 0 || (Array.isArray(state.artifacts) && state.artifacts.length > 0);
  if (!hasLoot) {
    addMajor('感应末劫将临，却发现身无长物可封，唯有叹息。');
    state.finalLegacyPrepared = true;
    return;
  }

  const ok = createStash('劫气隐约，一月之前你已将此世所得封入秘窟，静待后世自取。', {
    takeAll: true,
    force: true,
  });
  if (ok) {
    state.finalLegacyPrepared = true;
  }
}

function updatePlanMode() {
  const pending = pendingStashes();
  if (pending.length > 0) {
    state.planMode = '修炼取宝';
    return;
  }
  const realm = levelToRealmStage(state.level).realm;
  const cfg = WORK_CONFIG[realm] || WORK_CONFIG['练气'];
  const maxWorkReward = cfg.reward[1];
  const stashStones = (state.stashes || []).reduce((sum, s) => sum + (s.stones || 0), 0);
  const wealth = state.spiritStones + stashStones;
  const lifeNo = (state.reincarnation || 0) + 1;
  const peakLevel = state.knownMaxLevel || state.level;
  const peakRepeats = levelRepeatCount(peakLevel);
  const lastPeak = state.lastLifePeak || peakLevel;
  const plateau = lifeNo >= 3 && peakRepeats >= Math.max(3, lifeNo);
  const regression = lifeNo > 1 && lastPeak < peakLevel;
  const savingTarget = maxWorkReward * 365;
  const hasSurplus = wealth > savingTarget;

  if ((plateau || regression) && wealth < savingTarget * 2) {
    state.planMode = '打工攒积累';
  } else if (lifeNo > 1 && hasSurplus) {
    state.planMode = '打工攒积累';
  } else {
    state.planMode = '冲境界';
  }
}

function shouldAccumulateWork() {
  if (state.planMode !== '打工攒积累') return false;
  const realm = levelToRealmStage(state.level).realm;
  const cfg = WORK_CONFIG[realm] || WORK_CONFIG['练气'];
  const maxWorkReward = cfg.reward[1];
  const stashStones = (state.stashes || []).reduce((sum, s) => sum + (s.stones || 0), 0);
  const wealth = state.spiritStones + stashStones;
  const savingTarget = maxWorkReward * 365;
  const belowSavings = wealth < savingTarget;
  const lifeNo = (state.reincarnation || 0) + 1;
  const laggingBehind = lifeNo > 1 && state.bestLevelThisLife < (state.knownMaxLevel || 1);
  return belowSavings || laggingBehind;
}

function rollBaseLifespan() {
  if (Math.random() < LONGEVITY_MAX_ROLL) return 100;
  return randRange(LONGEVITY_BASE_RANGE[0], LONGEVITY_BASE_RANGE[1]);
}

function ensureLifespan() {
  if (!state.lifespanBase) state.lifespanBase = rollBaseLifespan();
  if (!state.lifespanBonus) state.lifespanBonus = 0;
  if (!state.lifespanYears) state.lifespanYears = state.lifespanBase + state.lifespanBonus;
  if (!state.lifespanApplied) state.lifespanApplied = {};
  if (!state.lifespanWarned) state.lifespanWarned = { finalYear: false, tenYear: false };
}

function remainingYears() {
  const ageYears = Math.floor(state.lifeDays / DAYS_PER_YEAR);
  return (state.lifespanYears || 0) - ageYears;
}

function applyLongevity(realm) {
  ensureLifespan();
  if (state.lifespanApplied[realm]) return;
  const bonus = LONGEVITY_REALM_BONUS[realm] || 0;
  state.lifespanApplied[realm] = true;
  if (!Number.isFinite(bonus)) {
    state.lifespanYears = Infinity;
    addMajor('羽化飞升，寿元不再受限');
    state.lifespanWarned.finalYear = false;
    state.lifespanWarned.tenYear = false;
    return;
  }
  state.lifespanBonus += bonus;
  const remBefore = remainingYears();
  state.lifespanYears += bonus;
  const remAfter = remainingYears();
  addMajor(`境界精进，寿元延长${bonus}年`);
  if (remBefore <= 10 && remAfter > 10) {
    addMajor('寿元再添光阴，心中一松，劫数暂缓');
    state.lifespanWarned.tenYear = false;
  }
}

function checkLifespanWarnings() {
  ensureLifespan();
  if (!Number.isFinite(state.lifespanYears)) return;
  const ageYears = Math.floor(state.lifeDays / DAYS_PER_YEAR);
  const remain = state.lifespanYears - ageYears;
  if (state.reincarnation === 0 && !state.lifespanWarned.finalYear && remain <= 1) {
    addMajor('模糊感知寿元将尽，也许只剩一年。');
    state.lifespanWarned.finalYear = true;
  }
  if (state.reincarnation === 0 && remain <= 1) {
    maybeFirstLifeStash();
  }
  if (state.reincarnation > 0 && !state.lifespanWarned.tenYear && remain <= 10) {
    addMajor('不知为何，你清晰感知到自己的大限将至，大约还有十年。');
    state.lifespanWarned.tenYear = true;
  }
  if (state.reincarnation > 0) {
    maybePrepareFinalStash();
  }
  if (remain <= 0) {
    handleDeath('寿元耗尽，坐化而逝');
  }
}

function cautiousRoll(prob, onAvoid) {
  const base = Math.max(0, Math.min(1, prob));
  const scaled = base * cautionFactor();
  const roll = Math.random();
  if (roll < scaled) return true;
  if (roll < base && typeof onAvoid === 'function') {
    onAvoid();
  }
  return false;
}

function moodLabel() {
  return moodStages.find((s) => state.mood >= s.min)?.label || moodStages[moodStages.length - 1].label;
}

function moodTier() {
  return moodStages.findIndex((s) => state.mood >= s.min);
}

function stonesRequired(level) {
  const { realm, stage } = levelToRealmStage(level);
  if (realm === '仙') return XIAN_BREAK_COST;
  const costs = BREAK_COST[realm];
  if (costs && costs.length) {
    return costs[Math.min(costs.length - 1, Math.max(0, stage - 1))];
  }
  return 0;
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
  const actionSep = entry.action === '重大事项' ? '：' : '，';
  if (detailText && events) return `${time} · ${entry.action}${actionSep}${detailText}；${events}`;
  if (detailText) return `${time} · ${entry.action}${actionSep}${detailText}`;
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
    const amounts = entry.details
      .filter((d) => d.type === 'stones' && d.amount > 0)
      .map((d) => `${Math.max(0, Math.round(d.amount))}灵石`);
    const notes = entry.details.map((d) => d.note || '').filter(Boolean);
    if (amounts.length && notes.length) return `收入${amounts.join('、')}；${notes.join('；')}`;
    if (amounts.length) return `收入${amounts.join('、')}`;
    return notes.join('；');
  }
  if (entry.action === '突破') {
    const notes = entry.details.map((d) => d.note || '').filter(Boolean);
    return notes.join('；');
  }
  return entry.details.map((d) => d.note || '').filter(Boolean).join('；');
}

function hasActiveSelection() {
  const sel = window.getSelection();
  return sel && sel.toString();
}

function renderLogs() {
  if (!logsDirty) return;
  if (hasActiveSelection()) return;

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
  logsDirty = false;
}

function renderArtifacts() {
  if (!ui.artifactGrid) return;
  ui.artifactGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < MAX_ARTIFACTS; i += 1) {
    const artifact = state.artifacts[i];
    const div = document.createElement('div');
    div.className = 'artifact';
    if (artifact) {
      div.dataset.id = artifact.id;
      div.textContent = artifact.icon || '🔮';
      div.title = `${artifact.name}：${artifact.desc}`;
    } else {
      div.classList.add('placeholder');
      div.innerHTML = '&nbsp;';
    }
    fragment.appendChild(div);
  }
  ui.artifactGrid.appendChild(fragment);
}

function handleArtifactClick(e) {
  const card = e.target.closest('.artifact');
  if (!card || !card.dataset.id) return;
  const artifact = state.artifacts.find((a) => a.id === card.dataset.id);
  if (!artifact) return;
  const ok = confirm(`是否遗弃天道灵宝「${artifact.name}」？`);
  if (!ok) return;
  state.artifacts = state.artifacts.filter((a) => a.id !== artifact.id);
  addMajor(`遗弃天道灵宝「${artifact.name}」`);
  renderArtifacts();
  saveState();
}

function addAutoLogEntry(action) {
  const day = Math.floor(state.totalDays);
  const last = latestLogEntry;
  if (last && last.action === action && !last.locked) {
    last.endDay = day;
    logsDirty = true;
    return last;
  }
  const entry = { startDay: day, endDay: day, action, details: [], events: [], locked: false };
  state.autoLogs.push(entry);
  if (state.autoLogs.length > AUTO_LOG_LIMIT) {
    state.autoLogs.splice(0, state.autoLogs.length - AUTO_LOG_LIMIT);
  }
  latestLogEntry = entry;
  logsDirty = true;
  return entry;
}

function addDetail(action, detail) {
  const entry = addAutoLogEntry(action);
  entry.details.push(detail);
  logsDirty = true;
}

function addMoodEvent(action, text) {
  const entry = addAutoLogEntry(action);
  entry.events.push(text);
  entry.locked = true;
  logsDirty = true;
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
  logsDirty = true;
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
      state.artifacts = state.artifacts.map(withArtifactMeta).slice(0, MAX_ARTIFACTS);
      if (typeof state.lifeDays !== 'number') state.lifeDays = state.totalDays;
      if (!Array.isArray(state.stashes)) state.stashes = [];
      if (typeof state.lastStashDay !== 'number') state.lastStashDay = 0;
      if (typeof state.lastTheftRollLife !== 'number') state.lastTheftRollLife = 0;
      if (typeof state.lastStashReminderLife !== 'number') state.lastStashReminderLife = 0;
      if (typeof state.firstLifeStashSettled !== 'boolean') state.firstLifeStashSettled = false;
      ensureLifespan();
      if (!state.prevActivity) state.prevActivity = '修行';
      if (!state.battle) state.battle = null;
      if (typeof state.caution !== 'number') state.caution = 100;
      if (typeof state.cautionDeaths !== 'number') state.cautionDeaths = 0;
      if (!state.levelRepeats || typeof state.levelRepeats !== 'object') state.levelRepeats = {};
      if (!state.planMode) state.planMode = '冲境界';
      if (!state.knownMaxLevel || state.knownMaxLevel < state.level) {
        state.knownMaxLevel = state.level;
      }
      if (!state.workPlan) state.workPlan = null;
      if (!state.bestLevelThisLife || state.bestLevelThisLife < 1) state.bestLevelThisLife = state.level;
      if (!state.lastLifePeak) state.lastLifePeak = 0;
      if (typeof state.finalLegacyPrepared !== 'boolean') state.finalLegacyPrepared = false;
      ensureLevelEntry(state.level);
      state.xpToNext = requiredXp(state.level);
      if (state.activity === '打工') {
        if (state.workPlan) {
          state.activityDuration = state.workPlan.duration;
          state.pendingWorkReward = state.workPlan.reward;
        } else {
          prepareWorkPlan();
          state.activityProgress = 0;
        }
      }
      updatePlanMode();
      rollStashTheft();
      remindStashMemory();
      maybeOpenStashes();
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
  state.xpToNext = requiredXp(state.level);
  const maxXp = Math.max(state.xpToNext, 1);
  state.xp = Math.min(Math.max(0, state.xp), maxXp);
}

function updateUI() {
  state.xp = Math.max(0, state.xp);
  ui.level.textContent = formatLevel(state.level);
  ui.xpLabel.textContent = `${state.xp.toFixed(0)} / ${state.xpToNext}`;

  const currentDate = dayToDate(Math.floor(state.totalDays));
  ui.years.textContent = `${currentDate.year}年${currentDate.month}月`;
  const ageYears = Math.max(0, Math.floor(state.lifeDays / DAYS_PER_YEAR));
  ui.age.textContent = `第${state.reincarnation + 1}世 ${ageYears}岁`;
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
  syncCautionInputs();
}

function highlightGear() {
  if (!ui.gearGroup) return;
  Array.from(ui.gearGroup.querySelectorAll('button')).forEach((btn) => {
    const val = Number(btn.dataset.gear);
    btn.classList.toggle('active', val === timeScale);
  });
}

function syncCautionInputs() {
  if (ui.cautionInput && document.activeElement !== ui.cautionInput) {
    ui.cautionInput.value = state.caution.toFixed(2);
  }
  if (ui.cautionDeathsInput && document.activeElement !== ui.cautionDeathsInput) {
    ui.cautionDeathsInput.value = state.cautionDeaths;
  }
}

const testMessages = [];
let logsDirty = true;

function aiInsights() {
  const lifeNo = state.reincarnation + 1;
  const highest = formatLevel(state.knownMaxLevel || state.level);
  const remain = remainingYears();
  const remainText = Number.isFinite(state.lifespanYears) ? `${Math.max(0, Math.floor(remain))}年` : '无上限';
  const stashInfo = `${(state.stashes || []).length}处藏宝`;
  const resourceLine = `灵石${state.spiritStones.toFixed(0)}，灵宝${state.artifacts.length}`;
  return [
    `轻智能：第${lifeNo}世 · 策略：${state.planMode} · 已知最高：${highest}`,
    `寿元预估：${remainText} · 资源：${resourceLine} · 藏宝：${stashInfo}`,
  ];
}

function renderTestInfo() {
  if (!ui.testInfo) return;
  const cutoff = Date.now() - TEST_INFO_LIFETIME;
  while (testMessages.length && testMessages[0].ts < cutoff) {
    testMessages.shift();
  }
  const filtered = testMessages.filter((m) => m.ts >= cutoff);
  const lines = [`谨慎度：${state.caution.toFixed(2)}（死亡${state.cautionDeaths}次）`];
  lines.push(...aiInsights());
  lines.push(...filtered.slice(-MAX_TEST_INFO).map((m) => `[${m.stamp}] ${m.text}`));
  ui.testInfo.textContent = lines.join('\n');
}

function pushTestInfo(text) {
  const now = Date.now();
  const stamp = new Date(now).toLocaleTimeString();
  testMessages.push({ text, ts: now, stamp });
  while (testMessages.length > MAX_TEST_INFO * 2) testMessages.shift();
  renderTestInfo();
}

function setTestMode(enabled) {
  testMode = enabled;
  if (ui.testPanel) ui.testPanel.classList.toggle('active', enabled);
  if (ui.gearHint) {
    ui.gearHint.textContent = enabled ? '测试模式已开启' : '';
    ui.gearHint.classList.toggle('hidden', !enabled);
    ui.gearHint.classList.remove('alert');
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
  const moodBonus = Math.max(1, 0.85 + (state.mood - 60) / 90);
  const { realm } = levelToRealmStage(state.level);
  const xpGain = gainPerSecond(realm);
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
    Notification.requestPermission().then((res) => {
      if (res === 'granted') {
        new Notification('番茄钟完成', {
          body: pomodoro.mode === 'work' ? '专注时间结束' : '休息时间结束',
          silent: true,
        });
      } else {
        pomodoro.notifyEnabled = false;
        updatePomodoroUI();
        saveState();
      }
    });
    return;
  }
  if (Notification.permission === 'granted') {
    new Notification('番茄钟完成', {
      body: pomodoro.mode === 'work' ? '专注时间结束' : '休息时间结束',
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
  if (!('Notification' in window)) {
    pomodoro.notifyEnabled = false;
    alert('当前浏览器不支持通知');
    updatePomodoroUI();
    saveState();
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission().then((res) => {
      pomodoro.notifyEnabled = res === 'granted';
      updatePomodoroUI();
      saveState();
    });
    return;
  }

  if (Notification.permission === 'denied') {
    pomodoro.notifyEnabled = false;
    alert('通知已被系统拒绝，请在浏览器设置中开启');
  } else {
    pomodoro.notifyEnabled = !pomodoro.notifyEnabled;
  }
  updatePomodoroUI();
  saveState();
}

function prepareWorkPlan() {
  const { realm } = levelToRealmStage(state.level);
  const cfg = WORK_CONFIG[realm] || WORK_CONFIG['练气'];
  const duration = randRange(cfg.duration[0], cfg.duration[1]);
  const reward = randRange(cfg.reward[0], cfg.reward[1]);
  const task = cfg.tasks[Math.floor(Math.random() * cfg.tasks.length)] || '杂务劳作';
  state.workPlan = { realm, task, duration, reward };
  state.activityDuration = duration;
  state.pendingWorkReward = reward;
}

function startActivity(name, duration) {
  state.activity = name;
  state.activityDuration = duration;
  state.activityProgress = 0;
  if (name === '打工') {
    prepareWorkPlan();
  } else {
    state.pendingWorkReward = 0;
    state.workPlan = null;
    state.workStreak = 0;
  }
  if (name !== '修行') {
    state.cultivateStreak = 0;
  }
}

function levelUp() {
  const cost = stonesRequired(state.level);
  if (state.spiritStones < cost || state.xp < state.xpToNext) return;
  state.spiritStones -= cost;
  const spentXp = state.xpToNext;
  state.level += 1;
  registerLevelEntry(state.level);
  state.knownMaxLevel = Math.max(state.knownMaxLevel || state.level, state.level);
  state.bestLevelThisLife = Math.max(state.bestLevelThisLife || state.level, state.level);
  updatePlanMode();
  state.xp = Math.max(0, state.xp - spentXp);
  state.xpToNext = requiredXp(state.level);
  const { realm, stage } = levelToRealmStage(state.level);
  if (stage === 1) {
    applyLongevity(realm);
  }
  if (state.xp >= state.xpToNext) {
    state.xp = Math.floor(state.xpToNext * 0.25);
  }
  state.mood = Math.min(state.mood + 10, 100);
  addMajor(`突破至${formatLevel(state.level)}`);
  maybeOpenStashes();
}

function handleCultivation(action) {
  if (maybeEncounterDemon()) return;

  const gains = baseGain();
  const before = state.xp;
  state.xp += gains.xp;
  clampXp();
  const delta = Math.max(0, state.xp - before);
  addDetail(action, { type: 'xp', amount: delta });

  if (shouldAccumulateWork()) {
    startActivity('打工', 8);
    return;
  }

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

function settleWork(reason) {
  const portion = state.activityDuration ? Math.min(1, state.activityProgress / state.activityDuration) : 0;
  const reward = Number((state.pendingWorkReward * portion).toFixed(1));
  const job = state.workPlan;
  const jobName = job?.task || '杂务劳作';
  const status = portion < 1 ? '提前结束' : '完成';
  const note = reason ? `${status}「${jobName}」（${reason}）` : `${status}「${jobName}」`;
  if (reward > 0 || reason || jobName) {
    addDetail('打工', { type: reward > 0 ? 'stones' : undefined, amount: reward, note });
  }
  if (reward > 0) {
    state.spiritStones += reward;
  }
  state.pendingWorkReward = 0;
  state.workPlan = null;
}

function handleWork(action) {
  const fatigue = 1.6;
  state.mood = Math.max(5, state.mood - fatigue);
  state.activityProgress += 1;

  if (moodTier() >= moodStages.length - 3) {
    settleWork('心境失衡，提前结算');
    startActivity('调心', 6);
    return;
  }

  const isComplete = state.activityProgress >= state.activityDuration;
  if (isComplete) {
    state.activityProgress = Math.min(state.activityProgress, state.activityDuration);
    settleWork();
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
  if (cautiousRoll(deathChance, () => addMajor('濒死警醒，谨慎避过死亡'))) {
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
    startActivity('修行', 0);
  }
}

function startBattle(enemyLevel, source = '偶遇来敌', { force = false } = {}) {
  if (state.battle) {
    if (!force) return false;
    endBattle();
  }
  const playerRealm = Math.floor((state.level - 1) / 10);
  const enemyRealm = Math.floor((enemyLevel - 1) / 10);
  const displaySource = source.includes('测试') ? '偶遇来敌' : source;
  let winRate = 0.55 + (state.level - enemyLevel) * 0.1;
  if (enemyRealm > playerRealm) winRate = 0;
  if (enemyRealm < playerRealm) winRate = 1;
  const boost = artifactBonus('battleBoost');
  winRate += winRate * boost;
  winRate = Math.max(0.02, Math.min(0.98, winRate));

  const realmBaseMap = {
    练气: 1,
    筑基: 3,
    结丹: 5,
    元婴: 7,
    化神: 10,
    炼虚: 14,
    合体: 18,
    大乘: 22,
    渡劫: 26,
    飞升: 28,
    仙: 30,
  };
  const playerInfo = levelToRealmStage(state.level);
  const enemyInfo = levelToRealmStage(enemyLevel);
  const baseRealm = realmBaseMap[playerInfo.realm] || 14;
  const enemyBase = realmBaseMap[enemyInfo.realm] || 14;
  const gap = Math.abs(state.level - enemyLevel);
  const closenessFactor = 1 + Math.max(0, 5 - Math.min(gap, 5)) * 0.08; // 拉长接近修为的战斗
  const baseDuration = Math.max(baseRealm, enemyBase);
  const duration = Math.max(1, Math.min(30, Math.round(baseDuration * closenessFactor)));

  state.prevActivity = state.activity;
  state.battle = {
    enemyLevel,
    source,
    winRate,
    remaining: duration,
    realmGap: enemyRealm - playerRealm,
    label: displaySource,
  };
  startActivity('战斗', duration);
  addDetail('战斗', { note: `${displaySource}，对手${formatLevel(enemyLevel)}，胜率${Math.round(winRate * 100)}%` });
  if (testMode || source.includes('测试')) {
    pushTestInfo(
      `战斗开始，胜率${Math.round(winRate * 100)}%，预计${duration}天 | 赶尽杀绝10%，顿悟概率≈${Math.round(
        (1 - winRate) * 100
      )}%`
    );
  }
  return true;
}

function resolveBattle(win) {
  if (!state.battle) return;
  const { winRate, enemyLevel, realmGap, label } = state.battle;
  if (win) {
    addMajor(`战胜${formatLevel(enemyLevel)}${label ? `（${label}）` : ''}`);
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
      if (cautiousRoll(1, () => addDetail('战斗', { note: '谨慎防备，避开了赶尽杀绝' }))) {
        handleDeath('境界压制，遭对手赶尽杀绝');
      }
      endBattle();
      startActivity(state.prevActivity || '修行', 0);
      return;
    }
    const escapeChance = Math.min(0.95, winRate + artifactBonus('escapeBoost'));
    if (Math.random() < escapeChance) {
      if (cautiousRoll(1, () => addDetail('战斗', { note: '谨慎退避，避免了重伤' }))) {
        state.condition = '受伤';
        state.healTimer = randRange(30, 180);
        startActivity('疗伤', state.healTimer);
        addMajor('拼死逃脱，遍体鳞伤');
      } else {
        endBattle();
        startActivity(state.prevActivity || '修行', 0);
        return;
      }
    } else if (cautiousRoll(1, () => addDetail('战斗', { note: '谨慎观察，躲过致命杀招' }))) {
      handleDeath('战败被杀，身死道消');
    } else {
      endBattle();
      startActivity(state.prevActivity || '修行', 0);
      return;
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

  if (cautiousRoll(winRate, () => addDetail('战斗', { note: '谨慎撤退，避免受伤' }))) {
    state.condition = '受伤';
    state.healTimer = randRange(30, 180);
    startActivity('疗伤', state.healTimer);
    addMajor('战败受伤，暂避锋芒');
  } else if (cautiousRoll(1, () => addDetail('战斗', { note: '谨慎护身，未陷入濒死' }))) {
    state.condition = '濒死';
    state.nearDeathTimer = randRange(90, 180);
    startActivity('濒死', state.nearDeathTimer);
    addMajor('战败濒死，垂危挣扎');
  } else {
    addDetail('战斗', { note: '危机四伏，但谨慎化险为夷' });
    endBattle();
    startActivity(state.prevActivity || '修行', 0);
    return;
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
    if (!guarded() && Math.random() < 0.5) {
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
      if (!cautiousRoll(1, () => addMajor('戒慎恐惧，避开了心魔反噬'))) {
        return true;
      }
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
      if (!cautiousRoll(1, () => addMajor('谨慎自守，避开心魔重创'))) {
        return true;
      }
      state.condition = '濒死';
      state.nearDeathTimer = randRange(90, 180);
      startActivity('濒死', state.nearDeathTimer);
      addMajor('心魔重创，濒死挣扎');
    }
  } else {
    if (cautiousRoll(1, () => addMajor('往昔劫难使其更谨慎，避开心魔绝杀'))) {
      handleDeath('心魔爆发，神魂俱灭');
    }
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
    if (cautiousRoll(1, () => addMajor('谨慎感知天罚征兆，避过一劫'))) {
      handleDeath('天罚突降，魂飞魄散');
    }
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
  if (
    moodTier() === moodStages.length - 1 &&
    cautiousRoll(0.1, () => addMajor('道心崩塌被谨慎压制，侥幸无恙'))
  ) {
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
  maybePrepareFinalStash(true);
  addMajor(`死亡：${reason}`);
  const deathAgeYears = Math.max(1, Math.floor(state.lifeDays / DAYS_PER_YEAR));
  cautionStep(deathAgeYears);
  if (state.artifacts.length) {
    addMajor('身死道消，随身天道灵宝散去');
  }
  const lastLifePeak = state.bestLevelThisLife || state.level;
  state.reincarnation += 1;
  const lifeNo = state.reincarnation + 1;
  const sect = randomSect();
  latestLogEntry = null;
  const keepTotal = state.totalDays;
  const keepStashes = Array.isArray(state.stashes) ? state.stashes : [];
  const keepRepeats = state.levelRepeats;
  const keepPlan = state.planMode || '冲境界';
  const knownMax = Math.max(state.knownMaxLevel || 1, state.level);
  const newBase = rollBaseLifespan();

  Object.assign(state, {
    level: 1,
    xp: 0,
    xpToNext: LEVEL_NEED_EXP['练气'][0],
    spiritStones: 0,
    mood: 70,
    totalDays: keepTotal,
    lifeDays: 0,
    activity: '修行',
    activityDuration: 0,
    activityProgress: 0,
    pendingWorkReward: 0,
    workPlan: null,
    workStreak: 0,
    cultivateStreak: 0,
    planMode: keepPlan,
    knownMaxLevel: knownMax,
    condition: '正常',
    healTimer: 0,
    nearDeathTimer: 0,
    autoLogs: state.autoLogs,
    majorLogs: state.majorLogs,
    reincarnation: state.reincarnation,
    artifacts: [],
    stashes: keepStashes,
    lastStashDay: 0,
    lastTheftRollLife: state.lastTheftRollLife,
    lastStashReminderLife: state.lastStashReminderLife,
    firstLifeStashSettled: state.firstLifeStashSettled,
    bestLevelThisLife: 1,
    lastLifePeak: lastLifePeak,
    lifespanBase: newBase,
    lifespanBonus: 0,
    lifespanYears: newBase,
    lifespanApplied: {},
    lifespanWarned: { finalYear: false, tenYear: false },
    battle: null,
    prevActivity: '修行',
    caution: state.caution,
    cautionDeaths: state.cautionDeaths,
    levelRepeats: keepRepeats,
    finalLegacyPrepared: false,
  });
  registerLevelEntry(1);
  const { finalDay, ageDays } = narrateRebirth(sect, keepTotal);
  addMajor(`转生轮回，第${lifeNo}世。${sect}弟子将于八岁觉醒记忆。`);
  state.totalDays = finalDay;
  state.lifeDays = ageDays;
  remindStashMemory();
  updatePlanMode();
}

function randomSect() {
  const names = ['碧霞仙宗', '归墟剑阁', '灵霄天宫', '九渊书院', '紫极道门'];
  return names[Math.floor(Math.random() * names.length)];
}

function narrateRebirth(sectName, baseDay = 0) {
  const origin = Math.max(0, baseDay);
  const birthDay = origin + randRange(20, 120);
  const childhoodDay = birthDay + randRange(2 * DAYS_PER_YEAR, 3 * DAYS_PER_YEAR);
  const literacyDay = birthDay + 7 * DAYS_PER_YEAR + randRange(-30, 40);
  const awakenDay = birthDay + START_AGE_YEARS * DAYS_PER_YEAR;
  const sectDay = awakenDay + randRange(5, 120);
  const timeline = [
    { day: birthDay, text: '出生于凡尘，灵根潜藏' },
    { day: childhoodDay, text: '童年平凡，劳作习武，心性渐成' },
    { day: literacyDay, text: '七岁识字，开蒙见世' },
    { day: awakenDay, text: '八岁觉醒前世记忆' },
    { day: sectDay, text: `被仙门发现，收录入${sectName}` },
  ];

  timeline.forEach(({ day, text }) => {
    state.totalDays = day;
    addMajor(text);
  });

  state.totalDays = sectDay;
  state.lifeDays = sectDay - birthDay;
  return { finalDay: sectDay, ageDays: state.lifeDays };
}

function initialStory(sectName) {
  ensureLevelEntry(state.level);
  const base = Math.max(0, state.totalDays - state.lifeDays);
  narrateRebirth(sectName, base);
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
  const tier = moodTier();
  if (dayActivity === '打工' && state.activity === '打工' && tier >= moodStages.length - 3) {
    settleWork('心境不稳，提前结算灵石');
    startActivity('调心', 8);
  } else if (tier >= moodStages.length - 2 && !['疗伤', '濒死'].includes(state.activity)) {
    startActivity('调心', 8);
  }
  handleMoodCollapse();

  maybeAccumulateStash();
  checkLifespanWarnings();

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

function handleSetCaution() {
  if (!testMode) {
    alert('请在控制台输入 testmode("password") 开启测试模式');
    return;
  }
  if (ui.cautionInput) {
    const val = Number(ui.cautionInput.value);
    if (Number.isFinite(val)) {
      state.caution = Math.max(0, Math.min(100, val));
    }
  }
  if (ui.cautionDeathsInput) {
    const deaths = Number(ui.cautionDeathsInput.value);
    if (Number.isFinite(deaths)) {
      state.cautionDeaths = Math.max(0, Math.floor(deaths));
    }
  }
  pushTestInfo(`手动设定谨慎度为${state.caution.toFixed(2)}，死亡次数${state.cautionDeaths}`);
  renderTestInfo();
  saveState();
}

function resetAll() {
  latestLogEntry = null;
  timeScale = 1;
  allowRun = true;
  testMessages.length = 0;
  Object.assign(state, {
    level: 1,
    xp: 0,
    xpToNext: LEVEL_NEED_EXP['练气'][0],
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
    planMode: '冲境界',
    knownMaxLevel: 1,
    condition: '正常',
    healTimer: 0,
    nearDeathTimer: 0,
    autoLogs: [],
    majorLogs: [],
    reincarnation: 0,
    artifacts: [],
    stashes: [],
    lastStashDay: 0,
    lastTheftRollLife: 0,
    lastStashReminderLife: 0,
    firstLifeStashSettled: false,
    bestLevelThisLife: 1,
    lastLifePeak: 0,
    lifespanBase: rollBaseLifespan(),
    lifespanBonus: 0,
    lifespanYears: 0,
    lifespanApplied: {},
    lifespanWarned: { finalYear: false, tenYear: false },
    battle: null,
    prevActivity: '修行',
    caution: 100,
    cautionDeaths: 0,
    levelRepeats: { 1: 1 },
    finalLegacyPrepared: false,
  });

  state.lifespanYears = state.lifespanBase;

  pomodoro.mode = 'work';
  pomodoro.running = false;
  pomodoro.remaining = pomodoro.workLength;
  pomodoro.soundEnabled = false;
  pomodoro.notifyEnabled = false;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(POMODORO_KEY);
  localStorage.removeItem('idle-cultivation-gear');
  localStorage.removeItem(WINDOW_KEY);

  initialStory(randomSect());
  updatePlanMode();
  highlightGear();
  renderTestInfo();
  updateUI();
  saveState();
  pushTestInfo('已重置全部数据');
}

function handleResetAll() {
  if (!testMode) {
    alert('请在控制台输入 testmode("password") 开启测试模式');
    return;
  }
  if (!confirm('确认重置所有数据并重新开始？')) return;
  resetAll();
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
  ui.artifactGrid.addEventListener('click', handleArtifactClick);
  ui.gearGroup.addEventListener('click', handleGearClick);
  ui.cautionSetBtn.addEventListener('click', handleSetCaution);
  ui.resetAllBtn.addEventListener('click', handleResetAll);
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
    const started = startBattle(enemyLevel, '测试遇敌', { force: true });
    if (!started) {
      pushTestInfo('遇敌测试未能启动');
    }
    updateUI();
  });

  ui.fortuneTest.addEventListener('click', () => {
    if (!testMode) {
      alert('请在控制台输入 testmode("password") 开启测试模式');
      return;
    }
    handleFortuity(true);
  });

  ui.stashTest.addEventListener('click', () => {
    if (!testMode) {
      alert('请在控制台输入 testmode("password") 开启测试模式');
      return;
    }
    const ok = createStash('测试藏宝：手动埋下资源。', {
      portionRange: [0.3, 0.5],
      includeArtifactChance: 0.5,
      force: false,
    });
    if (!ok) {
      pushTestInfo('无可藏宝物。');
      addMajor('翻遍行囊，发现无可藏宝之物。');
    } else {
      pushTestInfo('手动触发藏宝，等待下一世开启。');
      saveState();
      updateUI();
    }
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

setInterval(renderTestInfo, 1000);
setInterval(() => {
  tickGame(timeScale);
  pomodoroTick(timeScale);
  heartbeat();
}, 1000);
