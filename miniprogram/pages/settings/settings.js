const {
  hasCarry,
  MAX_OPERAND,
  MAX_MUL_DIV_OPERAND,
  canBorrowForBcRange
} = require('../../utils/generator');
const { buildPreviewPatch } = require('../../utils/rangePreview');

Page({
  data: {
    settings: null,
    expandedCard: '',
    errorField: '',
    previewAddition: '',
    previewSubtraction: '',
    previewMultiplication: '',
    previewDivision: ''
  },

  onLoad() {
    this._loadSettings();
  },

  onUnload() {
    if (this._previewTimer) {
      clearTimeout(this._previewTimer);
      this._previewTimer = null;
    }
  },

  stopProp() {},

  _loadSettings() {
    const app = getApp();
    const settings = JSON.parse(JSON.stringify(app.globalData.settings));
    const previews = buildPreviewPatch(settings);
    this.setData({ settings, ...previews });
  },

  _updatePreviews() {
    const settings = this.data.settings;
    if (!settings) return;
    this.setData(buildPreviewPatch(settings));
  },

  onToggleEnabled(e) {
    const type = e.currentTarget.dataset.type;
    const key = `settings.${type}.enabled`;
    this.setData({ [key]: e.detail.value });
  },

  onToggleFeedbackSound(e) {
    const soundEnabled = e.detail.value;
    this.setData({ 'settings.feedback.soundEnabled': soundEnabled });
  },

  onToggleFeedbackVibration(e) {
    const vibrationEnabled = e.detail.value;
    this.setData({ 'settings.feedback.vibrationEnabled': vibrationEnabled });
  },

  onToggleCard(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      expandedCard: this.data.expandedCard === type ? '' : type
    });
  },

  onCustomInput(e) {
    const { type, field } = e.currentTarget.dataset;
    let val = parseInt(e.detail.value, 10);
    if (isNaN(val)) {
      return;
    }
    const isMinField = /^min/i.test(field);

    if (type === 'division' && field === 'minD') {
      if (val < 1) val = 1;
    } else if (isMinField && val < 0) {
      val = 0;
    } else if (!isMinField && val < 0) {
      val = 0;
    }

    if ((type === 'addition' || type === 'subtraction') && /^max$/i.test(field) && val > MAX_OPERAND) {
      val = MAX_OPERAND;
    }
    if ((type === 'multiplication' || type === 'division') && /^max/i.test(field) && val > MAX_MUL_DIV_OPERAND) {
      val = MAX_MUL_DIV_OPERAND;
    }

    const key = `settings.${type}.custom.${field}`;
    this.setData({ [key]: val });
    if (this._previewTimer) {
      clearTimeout(this._previewTimer);
    }
    this._previewTimer = setTimeout(() => {
      this._previewTimer = null;
      this._updatePreviews();
    }, 200);
  },

  onCustomBlur() {
    if (this._previewTimer) {
      clearTimeout(this._previewTimer);
      this._previewTimer = null;
    }
    this._updatePreviews();
  },

  _validateCustomRange(settings) {
    const types = ['addition', 'subtraction', 'multiplication', 'division'];
    for (const type of types) {
      const cfg = settings[type];
      if (!cfg.enabled) continue;

      const c = cfg.custom;

      if (type === 'addition' || type === 'subtraction') {
        const min = c.min;
        const max = c.max;
        if (min > max) {
          return { msg: `${this._getTypeName(type)}：范围最小值不能大于最大值`, type };
        }
        if (max > MAX_OPERAND) {
          return { msg: `${this._getTypeName(type)}：范围最大值不能超过 ${MAX_OPERAND}`, type };
        }
        if (type === 'addition' && cfg.carryPolicy === 'must') {
          if (!this._canCarry(min, max)) {
            return { msg: `加法：当前范围无法产生进位，请修改范围或更改进位策略`, type, field: 'carryPolicy' };
          }
        }
        if (type === 'subtraction' && cfg.borrowPolicy === 'must') {
          if (!canBorrowForBcRange(min, max)) {
            return { msg: `减法：当前范围无法产生退位，请修改范围或更改退位策略`, type, field: 'borrowPolicy' };
          }
        }
        continue;
      }

      if (type === 'multiplication') {
        const min1 = c.min1;
        const max1 = c.max1;
        const min2 = c.min2;
        const max2 = c.max2;
        if (min1 > max1) return { msg: `${this._getTypeName(type)}：乘数1 的最小值不能大于最大值`, type };
        if (min2 > max2) return { msg: `${this._getTypeName(type)}：乘数2 的最小值不能大于最大值`, type };
        if (max1 > MAX_MUL_DIV_OPERAND || max2 > MAX_MUL_DIV_OPERAND) {
          return { msg: `乘法：乘数的最大值不能超过 ${MAX_MUL_DIV_OPERAND}`, type };
        }
        continue;
      }

      if (type === 'division') {
        const min1 = c.minQ;
        const max1 = c.maxQ;
        const min2 = c.minD;
        const max2 = c.maxD;
        if (min1 > max1) return { msg: `除法：商的最小值不能大于最大值`, type };
        if (min2 > max2) return { msg: `除法：除数的最小值不能大于最大值`, type };
        if (max1 > MAX_MUL_DIV_OPERAND || max2 > MAX_MUL_DIV_OPERAND) {
          return { msg: `除法：商和除数的最大值不能超过 ${MAX_MUL_DIV_OPERAND}`, type };
        }
        if (min2 < 1) {
          return { msg: `除法：除数最小值须至少为 1`, type };
        }
      }
    }
    return null;
  },

  _getTypeName(type) {
    const names = { addition: '加法', subtraction: '减法', multiplication: '乘法', division: '除法' };
    return names[type];
  },

  _canCarry(min, max) {
    for (let a = min; a <= max; a++) {
      for (let b = min; b <= max; b++) {
        if (hasCarry(a, b)) return true;
      }
    }
    return false;
  },

  onCarryPolicy(e) {
    const policy = e.currentTarget.dataset.policy;
    this.setData({ 'settings.addition.carryPolicy': policy });
  },

  onBorrowPolicy(e) {
    const policy = e.currentTarget.dataset.policy;
    this.setData({ 'settings.subtraction.borrowPolicy': policy });
  },

  onSave() {
    const error = this._validateCustomRange(this.data.settings);
    if (error) {
      wx.showToast({ title: error.msg, icon: 'none', duration: 2000 });
      if (this.data.expandedCard !== error.type) {
        this.setData({ expandedCard: error.type });
      }
      this.setData({ errorField: `${error.type}_${error.field || 'range'}` });
      return;
    }
    this.setData({ errorField: '' });

    const app = getApp();
    app.updateSettings(this.data.settings);
    wx.showToast({ title: '已保存', icon: 'success', duration: 1500 });
  }
});
