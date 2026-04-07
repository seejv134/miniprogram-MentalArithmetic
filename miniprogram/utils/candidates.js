const { hasCarry, hasBorrow, getAddSubRange } = require('./generator');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickAddition(cfg) {
  const { min, max } = getAddSubRange(cfg, 'addition');
  const policy = cfg.carryPolicy || 'any';

  for (let attempts = 0; attempts < 100; attempts++) {
    const a = randInt(min, max);
    if (policy === 'must') {
      const pool = [];
      for (let b = min; b <= max; b++) {
        if (hasCarry(a, b)) pool.push(b);
      }
      if (pool.length === 0) continue;
      const b = pool[Math.floor(Math.random() * pool.length)];
      return { op1: a, op2: b };
    }
    const b = randInt(min, max);
    return { op1: a, op2: b };
  }
  return null;
}

function pickSubtraction(cfg) {
  const { min, max } = getAddSubRange(cfg, 'subtraction');
  const policy = cfg.borrowPolicy || 'any';

  for (let attempts = 0; attempts < 100; attempts++) {
    const b = randInt(min, max);
    const c = randInt(min, max);
    const a = b + c;
    if (policy === 'must' && !hasBorrow(a, b)) continue;
    return { op1: a, op2: b };
  }

  if (policy === 'must') {
    for (let b = min; b <= max; b++) {
      for (let c = min; c <= max; c++) {
        const a = b + c;
        if (hasBorrow(a, b)) return { op1: a, op2: b };
      }
    }
    return null;
  }

  return null;
}

function pickMultiplication(cfg) {
  const range = {
    min1: cfg.custom.min1,
    max1: cfg.custom.max1,
    min2: cfg.custom.min2,
    max2: cfg.custom.max2
  };
  const a = randInt(range.min1, range.max1);
  const b = randInt(range.min2, range.max2);
  return { op1: a, op2: b };
}

function pickDivision(cfg) {
  const range = {
    minQ: cfg.custom.minQ,
    maxQ: cfg.custom.maxQ,
    minD: cfg.custom.minD,
    maxD: cfg.custom.maxD
  };
  const q = randInt(range.minQ, range.maxQ);
  const d = randInt(range.minD, range.maxD);
  return { op1: q * d, op2: d };
}

function pickRandomWithType(settings) {
  const types = [];
  if (settings.addition.enabled) types.push('addition');
  if (settings.subtraction.enabled) types.push('subtraction');
  if (settings.multiplication.enabled) types.push('multiplication');
  if (settings.division.enabled) types.push('division');

  if (types.length === 0) return null;

  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  for (const type of types) {
    let pair = null;
    if (type === 'addition') pair = pickAddition(settings.addition);
    else if (type === 'subtraction') pair = pickSubtraction(settings.subtraction);
    else if (type === 'multiplication') pair = pickMultiplication(settings.multiplication);
    else if (type === 'division') pair = pickDivision(settings.division);

    if (pair) {
      return { pair, type };
    }
  }

  return null;
}

module.exports = {
  pickRandomWithType
};
