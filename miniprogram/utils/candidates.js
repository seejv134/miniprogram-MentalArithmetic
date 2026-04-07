const { hasCarry, hasBorrow, LEVEL_PRESETS } = require('./generator');

/**
 * 构建加法候选对
 * @param {object} cfg - addition 配置
 * @returns {{ op1: number, op2: number }[]}
 */
function buildAdditionCandidates(cfg) {
  let min1, max1, min2, max2;
  if (cfg.useCustom) {
    ({ min1, max1, min2, max2 } = cfg.custom);
  } else {
    const preset = LEVEL_PRESETS.addition[cfg.level] || LEVEL_PRESETS.addition[3];
    min1 = min2 = preset.min;
    max1 = max2 = preset.max;
  }
  const policy = cfg.carryPolicy || 'any';
  const result = [];
  for (let a = min1; a <= max1; a++) {
    for (let b = min2; b <= max2; b++) {
      if (a + b > 1000) continue;
      if (policy === 'must' && !hasCarry(a, b)) continue;
      result.push({ op1: a, op2: b });
    }
  }
  return result;
}

/**
 * 构建减法候选对（保证 op1 >= op2，结果 >= 0）
 * @param {object} cfg - subtraction 配置
 * @returns {{ op1: number, op2: number }[]}
 */
function buildSubtractionCandidates(cfg) {
  let min1, max1, min2, max2;
  if (cfg.useCustom) {
    ({ min1, max1, min2, max2 } = cfg.custom);
  } else {
    const preset = LEVEL_PRESETS.subtraction[cfg.level] || LEVEL_PRESETS.subtraction[3];
    min1 = min2 = preset.min;
    max1 = max2 = preset.max;
  }
  const policy = cfg.borrowPolicy || 'any';
  const result = [];
  for (let a = min1; a <= max1; a++) {
    for (let b = min2; b <= max2; b++) {
      if (b > a) continue;
      if (policy === 'must' && !hasBorrow(a, b)) continue;
      result.push({ op1: a, op2: b });
    }
  }
  return result;
}

/**
 * 构建乘法候选对
 * @param {object} cfg - multiplication 配置
 * @returns {{ op1: number, op2: number }[]}
 */
function buildMultiplicationCandidates(cfg) {
  let min1, max1, min2, max2;
  if (cfg.useCustom) {
    ({ min1, max1, min2, max2 } = cfg.custom);
  } else {
    const preset = LEVEL_PRESETS.multiplication[cfg.level] || LEVEL_PRESETS.multiplication[2];
    ({ min1, max1, min2, max2 } = preset);
  }
  const result = [];
  for (let a = min1; a <= max1; a++) {
    for (let b = min2; b <= max2; b++) {
      if (a * b > 1000) continue;
      result.push({ op1: a, op2: b });
    }
  }
  return result;
}

/**
 * 构建除法候选对（整除）
 * @param {object} cfg - division 配置
 * @returns {{ op1: number, op2: number }[]}
 */
function buildDivisionCandidates(cfg) {
  let minQ, maxQ, minD, maxD;
  if (cfg.useCustom) {
    ({ minQ, maxQ, minD, maxD } = cfg.custom);
  } else {
    const preset = LEVEL_PRESETS.division[cfg.level] || LEVEL_PRESETS.division[2];
    ({ minQ, maxQ, minD, maxD } = preset);
  }
  const result = [];
  for (let q = minQ; q <= maxQ; q++) {
    for (let d = minD; d <= maxD; d++) {
      result.push({ op1: q * d, op2: d });
    }
  }
  return result;
}

/**
 * 根据运算类型构建候选池
 * @param {object} settings - 全量设置
 * @param {object} candidates - 候选池对象（按类型）
 */
function buildCandidates(settings, candidates) {
  candidates.addition = settings.addition.enabled
    ? buildAdditionCandidates(settings.addition)
    : [];
  candidates.subtraction = settings.subtraction.enabled
    ? buildSubtractionCandidates(settings.subtraction)
    : [];
  candidates.multiplication = settings.multiplication.enabled
    ? buildMultiplicationCandidates(settings.multiplication)
    : [];
  candidates.division = settings.division.enabled
    ? buildDivisionCandidates(settings.division)
    : [];
}

/**
 * 重建所有候选池（等同 buildCandidates，语义别名）
 */
function rebuildAllCandidates(settings, candidates) {
  buildCandidates(settings, candidates);
}

/**
 * O(1) 随机从候选池取一对
 * @param {Array} candidates
 * @returns {{ op1: number, op2: number } | null}
 */
function pickRandom(candidates) {
  if (!candidates || candidates.length === 0) return null;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

/**
 * 从所有已启用的运算类型中随机选一种并取一对候选
 * @param {object} allCandidates - { addition, subtraction, multiplication, division }
 * @returns {{ pair: { op1, op2 }, type: string } | null}
 */
function pickRandomWithType(allCandidates) {
  const types = ['addition', 'subtraction', 'multiplication', 'division'];
  const available = types.filter(t => allCandidates[t] && allCandidates[t].length > 0);
  if (available.length === 0) return null;
  const type = available[Math.floor(Math.random() * available.length)];
  const pair = pickRandom(allCandidates[type]);
  return { pair, type };
}

module.exports = {
  buildCandidates,
  rebuildAllCandidates,
  pickRandom,
  pickRandomWithType
};
