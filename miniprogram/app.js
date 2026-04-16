const { clampOperandRange } = require('./utils/generator');

/** 乘除自定义上限（与 generator / 设置页一致） */
const MAX_MUL_DIV_OPERAND = 33;

/** 支持的主题列表（需与 tokens.wxss 中 .theme-xxx 对应） */
const THEMES = ['mist', 'amber', 'cyber'];
const DEFAULT_THEME = 'mist';

/** 各主题下原生 switch 的激活色（无法走 CSS 变量） */
const THEME_SWITCH_COLOR = {
  mist: '#4A90E2',
  amber: '#E8B86D',
  cyber: '#00E5FF'
};

const DEFAULT_SETTINGS = {
  /** 答对反馈：与练习页音效/震动一致 */
  feedback: {
    soundEnabled: true,
    vibrationEnabled: true
  },
  addition: {
    enabled: true,
    custom: { min: 0, max: 10 },
    carryPolicy: 'any'
  },
  subtraction: {
    enabled: true,
    custom: { min: 0, max: 10 },
    borrowPolicy: 'any'
  },
  multiplication: {
    enabled: false,
    custom: { min1: 1, max1: 9, min2: 1, max2: 9 }
  },
  division: {
    enabled: false,
    custom: { minQ: 1, maxQ: 9, minD: 1, maxD: 9 }
  }
};

function ensureAddSubOperandRange(settings) {
  for (const key of ['addition', 'subtraction']) {
    const cfg = settings[key];
    if (!cfg || !cfg.custom) continue;
    cfg.custom = clampOperandRange(cfg.custom.min, cfg.custom.max);
  }
}

function ensureMulDivOperands(settings) {
  const m = settings.multiplication.custom;
  let min1 = Math.max(0, Math.min(Number(m.min1) || 0, MAX_MUL_DIV_OPERAND));
  let max1 = Math.max(0, Math.min(Number(m.max1) || 0, MAX_MUL_DIV_OPERAND));
  let min2 = Math.max(0, Math.min(Number(m.min2) || 0, MAX_MUL_DIV_OPERAND));
  let max2 = Math.max(0, Math.min(Number(m.max2) || 0, MAX_MUL_DIV_OPERAND));
  if (min1 > max1) {
    const t = min1;
    min1 = max1;
    max1 = t;
  }
  if (min2 > max2) {
    const t = min2;
    min2 = max2;
    max2 = t;
  }
  m.min1 = min1;
  m.max1 = max1;
  m.min2 = min2;
  m.max2 = max2;

  const d = settings.division.custom;
  let minQ = Math.max(0, Math.min(Number(d.minQ) || 0, MAX_MUL_DIV_OPERAND));
  let maxQ = Math.max(0, Math.min(Number(d.maxQ) || 0, MAX_MUL_DIV_OPERAND));
  let minD = Math.max(1, Math.min(Number(d.minD) || 1, MAX_MUL_DIV_OPERAND));
  let maxD = Math.max(1, Math.min(Number(d.maxD) || 1, MAX_MUL_DIV_OPERAND));
  if (minQ > maxQ) {
    const t = minQ;
    minQ = maxQ;
    maxQ = t;
  }
  if (minD > maxD) {
    const t = minD;
    minD = maxD;
    maxD = t;
  }
  d.minQ = minQ;
  d.maxQ = maxQ;
  d.minD = minD;
  d.maxD = maxD;
}

/**
 * 读盘或保存后统一：去掉旧版 level/useCustom，并做区间钳制
 * @param {object|null} raw
 */
function normalizeSettings(raw) {
  const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  if (!raw || typeof raw !== 'object') {
    ensureAddSubOperandRange(out);
    ensureMulDivOperands(out);
    return out;
  }
  for (const k of ['addition', 'subtraction', 'multiplication', 'division']) {
    if (!raw[k]) continue;
    out[k] = { ...out[k], ...raw[k] };
    delete out[k].level;
    delete out[k].useCustom;
  }
  if (raw.feedback && typeof raw.feedback === 'object') {
    out.feedback = { ...out.feedback, ...raw.feedback };
  }
  out.feedback.soundEnabled = out.feedback.soundEnabled !== false;
  out.feedback.vibrationEnabled = out.feedback.vibrationEnabled !== false;
  ensureAddSubOperandRange(out);
  ensureMulDivOperands(out);
  return out;
}

App({
  globalData: {
    settings: null,
    theme: DEFAULT_THEME
  },

  onLaunch() {
    const raw = wx.getStorageSync('settings');
    const settings = normalizeSettings(raw);
    wx.setStorageSync('settings', settings);
    this.globalData.settings = settings;

    const savedTheme = wx.getStorageSync('theme');
    const theme = THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME;
    this.globalData.theme = theme;
  },

  updateSettings(newSettings) {
    const settings = normalizeSettings(newSettings);
    this.globalData.settings = settings;
    wx.setStorageSync('settings', settings);
  },

  /**
   * 切换主题：写入全局与本地存储；页面需自行拉取并 setData 刷新。
   * @param {string} theme
   */
  updateTheme(theme) {
    if (!THEMES.includes(theme)) return;
    this.globalData.theme = theme;
    wx.setStorageSync('theme', theme);
  },

  /** 获取当前主题下 switch 组件需要的激活色（原生控件不支持 CSS 变量） */
  getSwitchColor() {
    return THEME_SWITCH_COLOR[this.globalData.theme] || THEME_SWITCH_COLOR[DEFAULT_THEME];
  }
});
