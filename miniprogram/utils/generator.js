/**
 * 难度预设范围
 */
const LEVEL_PRESETS = {
  addition: [
    null,
    { min: 0, max: 10 },
    { min: 0, max: 50 },
    { min: 0, max: 100 },
    { min: 0, max: 500 },
    { min: 0, max: 1000 }
  ],
  subtraction: [
    null,
    { min: 0, max: 10 },
    { min: 0, max: 50 },
    { min: 0, max: 100 },
    { min: 0, max: 500 },
    { min: 0, max: 1000 }
  ],
  multiplication: [
    null,
    { min1: 1, max1: 5, min2: 1, max2: 5 },
    { min1: 1, max1: 9, min2: 1, max2: 9 },
    { min1: 1, max1: 9, min2: 1, max2: 9 },
    { min1: 1, max1: 20, min2: 1, max2: 9 },
    { min1: 1, max1: 20, min2: 1, max2: 20 }
  ],
  division: [
    null,
    { minQ: 1, maxQ: 5, minD: 1, maxD: 5 },
    { minQ: 1, maxQ: 9, minD: 1, maxD: 9 },
    { minQ: 1, maxQ: 9, minD: 1, maxD: 9 },
    { minQ: 1, maxQ: 20, minD: 1, maxD: 9 },
    { minQ: 1, maxQ: 20, minD: 1, maxD: 20 }
  ]
};

/**
 * 随机整数 [min, max]
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 检测 a + b 是否有进位（逐位检测）
 */
function hasCarry(a, b) {
  let carry = 0;
  while (a > 0 || b > 0) {
    const da = a % 10;
    const db = b % 10;
    if (da + db + carry >= 10) return true;
    carry = Math.floor((da + db + carry) / 10);
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

/**
 * 检测 a - b 是否有退位（a >= b 前提）
 */
function hasBorrow(a, b) {
  while (a > 0 || b > 0) {
    const da = a % 10;
    const db = b % 10;
    if (da < db) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

/**
 * 根据配置获取加减法操作数范围
 */
function getAddSubRange(cfg, type) {
  if (cfg.useCustom) {
    return {
      min1: cfg.custom.min1,
      max1: cfg.custom.max1,
      min2: cfg.custom.min2,
      max2: cfg.custom.max2
    };
  }
  const preset = LEVEL_PRESETS[type][cfg.level] || LEVEL_PRESETS[type][3];
  return {
    min1: preset.min,
    max1: preset.max,
    min2: preset.min,
    max2: preset.max
  };
}

/**
 * 生成加法题目
 * @returns {{ op1, op2, result, operator }}
 */
function generateAddition(cfg) {
  const range = getAddSubRange(cfg, 'addition');
  const policy = cfg.carryPolicy || 'any';
  let a, b;
  let attempts = 0;
  do {
    a = randInt(range.min1, range.max1);
    b = randInt(range.min2, range.max2);
    attempts++;
    if (attempts > 1000) break;
  } while (
    a + b > 1000 ||
    (policy === 'must' && !hasCarry(a, b))
  );
  return { op1: a, op2: b, result: a + b, operator: '+' };
}

/**
 * 生成减法题目（保证结果 >= 0）
 * @returns {{ op1, op2, result, operator }}
 */
function generateSubtraction(cfg) {
  const range = getAddSubRange(cfg, 'subtraction');
  const policy = cfg.borrowPolicy || 'any';
  let a, b;
  let attempts = 0;
  do {
    a = randInt(range.min1, range.max1);
    b = randInt(range.min2, range.max2);
    if (b > a) { const tmp = a; a = b; b = tmp; }
    attempts++;
    if (attempts > 1000) break;
  } while (
    policy === 'must' && !hasBorrow(a, b)
  );
  return { op1: a, op2: b, result: a - b, operator: '-' };
}

/**
 * 生成乘法题目
 * @returns {{ op1, op2, result, operator }}
 */
function generateMultiplication(cfg) {
  let range;
  if (cfg.useCustom) {
    range = { min1: cfg.custom.min1, max1: cfg.custom.max1, min2: cfg.custom.min2, max2: cfg.custom.max2 };
  } else {
    range = LEVEL_PRESETS.multiplication[cfg.level] || LEVEL_PRESETS.multiplication[2];
  }
  let a, b;
  let attempts = 0;
  do {
    a = randInt(range.min1, range.max1);
    b = randInt(range.min2, range.max2);
    attempts++;
    if (attempts > 1000) break;
  } while (a * b > 1000);
  return { op1: a, op2: b, result: a * b, operator: '×' };
}

/**
 * 生成除法题目（整除，商为整数）
 * @returns {{ op1, op2, result, operator }}
 */
function generateDivision(cfg) {
  let range;
  if (cfg.useCustom) {
    range = { minQ: cfg.custom.minQ, maxQ: cfg.custom.maxQ, minD: cfg.custom.minD, maxD: cfg.custom.maxD };
  } else {
    range = LEVEL_PRESETS.division[cfg.level] || LEVEL_PRESETS.division[2];
  }
  const quotient = randInt(range.minQ, range.maxQ);
  const divisor = randInt(range.minD, range.maxD);
  const dividend = quotient * divisor;
  return { op1: dividend, op2: divisor, result: quotient, operator: '÷' };
}

/**
 * 生成四选一选项（1 正确 + 3 干扰）
 * 干扰项在 correct ± [1, 20] 随机偏移，去重，均 >= 0
 * @param {number} correct
 * @returns {number[]} 长度为 4 的乱序数组
 */
function makeOptions(correct) {
  const set = new Set([correct]);
  let attempts = 0;
  while (set.size < 4 && attempts < 200) {
    const offset = randInt(1, 20) * (Math.random() < 0.5 ? 1 : -1);
    const val = correct + offset;
    if (val >= 0) set.add(val);
    attempts++;
  }
  // 兜底：若干扰项不足（如 correct=0），补充正整数
  let fallback = 1;
  while (set.size < 4) {
    if (!set.has(fallback)) set.add(fallback);
    fallback++;
  }
  const arr = Array.from(set);
  // Fisher-Yates 洗牌
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

module.exports = {
  hasCarry,
  hasBorrow,
  generateAddition,
  generateSubtraction,
  generateMultiplication,
  generateDivision,
  makeOptions,
  LEVEL_PRESETS
};
