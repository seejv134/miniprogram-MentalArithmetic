/**
 * 设置页只读区间公式：[min_a,max_a] op [min_b,max_b] = [min_r,max_r]
 */

function br(lo, hi) {
  return `[${lo},${hi}]`;
}

function previewAddition(custom) {
  const min = custom.min;
  const max = custom.max;
  return `${br(min, max)}+${br(min, max)}=${br(min + min, max + max)}`;
}

function previewSubtraction(custom) {
  const min = custom.min;
  const max = custom.max;
  return `${br(min + min, max + max)}-${br(min, max)}=${br(min, max)}`;
}

function previewMultiplication(custom) {
  const p = [
    custom.min1 * custom.min2,
    custom.min1 * custom.max2,
    custom.max1 * custom.min2,
    custom.max1 * custom.max2
  ];
  const lo = Math.min.apply(null, p);
  const hi = Math.max.apply(null, p);
  return `${br(custom.min1, custom.max1)}×${br(custom.min2, custom.max2)}=${br(lo, hi)}`;
}

function previewDivision(custom) {
  const minD = custom.minD;
  const maxD = custom.maxD;
  const minQ = custom.minQ;
  const maxQ = custom.maxQ;
  const corners = [minQ * minD, minQ * maxD, maxQ * minD, maxQ * maxD];
  const lo = Math.min.apply(null, corners);
  const hi = Math.max.apply(null, corners);
  return `${br(lo, hi)}÷${br(minD, maxD)}=${br(minQ, maxQ)}`;
}

/**
 * @param {object} settings 与 app.globalData.settings 同结构
 */
function buildPreviewPatch(settings) {
  return {
    previewAddition: previewAddition(settings.addition.custom),
    previewSubtraction: previewSubtraction(settings.subtraction.custom),
    previewMultiplication: previewMultiplication(settings.multiplication.custom),
    previewDivision: previewDivision(settings.division.custom)
  };
}

module.exports = {
  buildPreviewPatch,
  previewAddition,
  previewSubtraction,
  previewMultiplication,
  previewDivision
};
