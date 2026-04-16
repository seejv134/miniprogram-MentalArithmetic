/**
 * 英文数词工具：将 [0, 9999] 区间整数转为小写英文字串。
 * 说明：
 *  - 十位与个位之间使用连字符（twenty-three），符合标准写法
 *  - 百位与后续部分使用空格连接，不加 "and"（美式写法）
 *  - 非法或超范围输入返回 String(n)，渲染层不崩溃
 */

const UNITS = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen'
];

const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];

function twoDigitsToWords(n) {
  if (n < 20) return UNITS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  if (ones === 0) return TENS[tens];
  return TENS[tens] + '-' + UNITS[ones];
}

function threeDigitsToWords(n) {
  if (n < 100) return twoDigitsToWords(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = UNITS[hundreds] + ' hundred';
  if (rest === 0) return head;
  return head + ' ' + twoDigitsToWords(rest);
}

function numberToEnglish(n) {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n);
  if (n === 0) return 'zero';
  if (n < 1000) return threeDigitsToWords(n);
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = UNITS[thousands] + ' thousand';
  if (rest === 0) return head;
  return head + ' ' + threeDigitsToWords(rest);
}

module.exports = { numberToEnglish };
