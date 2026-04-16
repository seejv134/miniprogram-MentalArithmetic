const { makeOptions } = require('../../utils/generator');
const { pickRandomWithType } = require('../../utils/candidates');

Page({
  data: {
    // 当前题目
    op1: 0,
    op2: 0,
    operator: '+',
    // 四个选项
    options: [],
    // 用户选择的答案索引，-1 表示未选
    selectedIndex: -1,
    // 正确答案在 options 中的索引
    correctIndex: -1,
    // 答题统计
    correctCount: 0,
    totalCount: 0,
    // 是否正在等待下一题（防止快速重复点击）
    waiting: false,
    // 是否有可用题目
    hasQuestion: true,
    // 当前主题 id（与 tokens.wxss 的 .theme-xxx 对应）
    theme: 'mist'
  },

  // 正确答案（不放 data，不参与渲染）
  _correctAnswer: 0,
  _feedbackTimer: null,
  /** @type {WechatMiniprogram.InnerAudioContext | null} */
  _correctSound: null,

  onLoad() {
    const sound = wx.createInnerAudioContext();
    sound.src = '/assets/audio/lucadialessandro-tap-notification-180637.mp3';
    this._correctSound = sound;
    this._syncTheme();
    this._nextQuestion();
  },

  onShow() {
    this._syncTheme();
    this._nextQuestion();
  },

  _syncTheme() {
    const theme = getApp().globalData.theme || 'mist';
    if (theme !== this.data.theme) {
      this.setData({ theme });
    }
  },

  _nextQuestion() {
    const app = getApp();
    const settings = app.globalData.settings;

    const picked = pickRandomWithType(settings);
    if (!picked) {
      this.setData({ hasQuestion: false });
      return;
    }

    const { pair, type } = picked;

    // 由 candidates 按策略抽出的操作数对，在此计算结果
    let question;
    if (type === 'addition') {
      question = { op1: pair.op1, op2: pair.op2, result: pair.op1 + pair.op2, operator: '+' };
    } else if (type === 'subtraction') {
      question = { op1: pair.op1, op2: pair.op2, result: pair.op1 - pair.op2, operator: '-' };
    } else if (type === 'multiplication') {
      question = { op1: pair.op1, op2: pair.op2, result: pair.op1 * pair.op2, operator: '×' };
    } else {
      // division: op1 = dividend, op2 = divisor, result = quotient
      question = { op1: pair.op1, op2: pair.op2, result: pair.op1 / pair.op2, operator: '÷' };
    }

    this._correctAnswer = question.result;
    const options = makeOptions(question.result);
    const correctIndex = options.indexOf(question.result);

    this.setData({
      op1: question.op1,
      op2: question.op2,
      operator: question.operator,
      options,
      correctIndex,
      selectedIndex: -1,
      waiting: false,
      hasQuestion: true
    });
  },

  onOptionTap(e) {
    if (this.data.waiting) return;

    const index = e.currentTarget.dataset.index;
    const isCorrect = index === this.data.correctIndex;

    this.setData({
      selectedIndex: index,
      waiting: true,
      correctCount: isCorrect ? this.data.correctCount + 1 : this.data.correctCount,
      totalCount: this.data.totalCount + 1
    });

    if (isCorrect) {
      const app = getApp();
      const fb = app.globalData.settings && app.globalData.settings.feedback;
      const vibrationOn = !fb || fb.vibrationEnabled !== false;
      const soundOn = !fb || fb.soundEnabled !== false;
      if (vibrationOn) {
        wx.vibrateShort({ type: 'medium' });
      }
      if (soundOn && this._correctSound) {
        this._correctSound.stop();
        this._correctSound.play();
      }
    }

    this._feedbackTimer = setTimeout(() => {
      this._nextQuestion();
    }, 200);
  },

  onGoSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  onUnload() {
    if (this._feedbackTimer) clearTimeout(this._feedbackTimer);
    if (this._correctSound) {
      this._correctSound.destroy();
      this._correctSound = null;
    }
  }
});
