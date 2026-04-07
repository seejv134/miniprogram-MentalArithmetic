/** 加减法操作数下界（与设置页一致） */
const MIN_OPERAND_ADD_SUB = 0;
/** 加减法操作数统一上限 */
const MAX_OPERAND = 1000;
/** 乘除法操作数上限 */
const MAX_MUL_DIV_OPERAND = 33;

/**
 * 随机整数 [min, max]
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 竖式加法是否存在进位：任一数位上（含低位向本位的进位）该位和 ≥ 10
 */
function hasCarry(a, b) {
  let carryIn = 0;
  while (a > 0 || b > 0) {
    const s = (a % 10) + (b % 10) + carryIn;
    if (s >= 10) return true;
    carryIn = Math.floor(s / 10);
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

/**
 * 检测 a - b 是否有退位（a >= b 前提）
 */
function hasBorrow(a, b) {
  while (b > 0) {
    if ((a % 10) < (b % 10)) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

/**
 * 将区间限制在 [MIN_OPERAND_ADD_SUB, MAX_OPERAND] 且 min <= max
 */
function clampOperandRange(min, max) {
  let lo = Math.max(MIN_OPERAND_ADD_SUB, Math.min(min, max));
  let hi = Math.min(MAX_OPERAND, Math.max(min, max));
  if (lo > hi) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  return { min: lo, max: hi };
}

/**
 * 根据配置获取加减法操作数统一范围 { min, max }（仅自定义）
 * @param {object} cfg
 * @param {'addition'|'subtraction'} _type 保留参数，兼容旧调用
 */
function getAddSubRange(cfg, _type) {
  return clampOperandRange(cfg.custom.min, cfg.custom.max);
}

/** 随机取 [min,max] 内使 hasCarry(a,b) 成立的 b；若无则返回 null */
function pickBWithCarry(a, min, max) {
  const pool = [];
  for (let b = min; b <= max; b++) {
    if (hasCarry(a, b)) pool.push(b);
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 在 [min,max]² 内找第一组满足 must 进位的 (a,b)；若无则 null */
function findFirstCarryPair(min, max) {
  for (let a = min; a <= max; a++) {
    for (let b = min; b <= max; b++) {
      if (hasCarry(a, b)) return { a, b };
    }
  }
  return null;
}

/**
 * 减数 b、差 c 均在 [min,max] 时，是否存在必须退位：hasBorrow(b+c, b)
 */
function canBorrowForBcRange(min, max) {
  for (let b = min; b <= max; b++) {
    for (let c = min; c <= max; c++) {
      if (hasBorrow(b + c, b)) return true;
    }
  }
  return false;
}

/** 找第一组 (b,c) 使 hasBorrow(b+c,b)；若无则 null */
function findFirstBorrowBcTriple(min, max) {
  for (let b = min; b <= max; b++) {
    for (let c = min; c <= max; c++) {
      const a = b + c;
      if (hasBorrow(a, b)) return { a, b, c };
    }
  }
  return null;
}

/**
 * 生成加法题目（仅约束操作数范围，不限制和的上界）
 */
function generateAddition(cfg) {
  const { min, max } = getAddSubRange(cfg, 'addition');
  const policy = cfg.carryPolicy || 'any';

  if (policy !== 'must') {
    const a = randInt(min, max);
    const b = randInt(min, max);
    return { op1: a, op2: b, result: a + b, operator: '+' };
  }

  const maxAttempts = Math.min(2000, (max - min + 1) * 50);
  for (let i = 0; i < maxAttempts; i++) {
    const a = randInt(min, max);
    const b = pickBWithCarry(a, min, max);
    if (b != null) {
      return { op1: a, op2: b, result: a + b, operator: '+' };
    }
  }

  const found = findFirstCarryPair(min, max);
  if (found) {
    return { op1: found.a, op2: found.b, result: found.a + found.b, operator: '+' };
  }

  const a = randInt(min, max);
  const b = randInt(min, max);
  return { op1: a, op2: b, result: a + b, operator: '+' };
}

/**
 * 生成减法题目：被减数 a=b+c，题目 a−b=c
 */
function generateSubtraction(cfg) {
  const { min, max } = getAddSubRange(cfg, 'subtraction');
  const policy = cfg.borrowPolicy || 'any';

  if (policy !== 'must') {
    const b = randInt(min, max);
    const c = randInt(min, max);
    const a = b + c;
    return { op1: a, op2: b, result: c, operator: '-' };
  }

  const maxAttempts = Math.min(2000, (max - min + 1) * (max - min + 1) * 2);
  for (let i = 0; i < maxAttempts; i++) {
    const b = randInt(min, max);
    const c = randInt(min, max);
    const a = b + c;
    if (hasBorrow(a, b)) {
      return { op1: a, op2: b, result: c, operator: '-' };
    }
  }

  const found = findFirstBorrowBcTriple(min, max);
  if (found) {
    return { op1: found.a, op2: found.b, result: found.c, operator: '-' };
  }

  const b = randInt(min, max);
  const c = randInt(min, max);
  const a = b + c;
  return { op1: a, op2: b, result: c, operator: '-' };
}

/**
 * 生成乘法题目
 */
function generateMultiplication(cfg) {
  const range = {
    min1: cfg.custom.min1,
    max1: cfg.custom.max1,
    min2: cfg.custom.min2,
    max2: cfg.custom.max2
  };
  const a = randInt(range.min1, range.max1);
  const b = randInt(range.min2, range.max2);
  return { op1: a, op2: b, result: a * b, operator: '×' };
}

/**
 * 生成除法题目（整除，商为整数）
 */
function generateDivision(cfg) {
  const range = {
    minQ: cfg.custom.minQ,
    maxQ: cfg.custom.maxQ,
    minD: cfg.custom.minD,
    maxD: cfg.custom.maxD
  };
  const quotient = randInt(range.minQ, range.maxQ);
  const divisor = randInt(range.minD, range.maxD);
  const dividend = quotient * divisor;
  return { op1: dividend, op2: divisor, result: quotient, operator: '÷' };
}

/**
 * 生成四选一选项（1 正确 + 3 干扰）
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
  let fallback = 1;
  while (set.size < 4) {
    if (!set.has(fallback)) set.add(fallback);
    fallback++;
  }
  const arr = Array.from(set);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
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
  getAddSubRange,
  canBorrowForBcRange,
  MIN_OPERAND_ADD_SUB,
  /** @deprecated 使用 MIN_OPERAND_ADD_SUB */
  MIN_OPERAND: MIN_OPERAND_ADD_SUB,
  MAX_OPERAND,
  MAX_MUL_DIV_OPERAND,
  clampOperandRange
};
