Page({
  data: {
    settings: null,
    // 展开哪个运算卡片
    expandedCard: ''
  },

  _levelLabels: ['', 'L1', 'L2', 'L3', 'L4', 'L5'],

  onLoad() {
    this._loadSettings();
  },

  onShow() {
    this._loadSettings();
  },

  _loadSettings() {
    const app = getApp();
    // 深拷贝，避免直接修改 globalData
    const settings = JSON.parse(JSON.stringify(app.globalData.settings));
    this.setData({ settings });
  },

  // 切换运算开关
  onToggleEnabled(e) {
    const type = e.currentTarget.dataset.type;
    const key = `settings.${type}.enabled`;
    this.setData({ [key]: !this.data.settings[type].enabled });
  },

  // 切换展开卡片
  onToggleCard(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      expandedCard: this.data.expandedCard === type ? '' : type
    });
  },

  // 选择难度
  onLevelChange(e) {
    const type = e.currentTarget.dataset.type;
    const level = parseInt(e.detail.value, 10) + 1; // picker value 从 0 开始
    this.setData({ [`settings.${type}.level`]: level });
  },

  // 切换自定义开关
  onToggleCustom(e) {
    const type = e.currentTarget.dataset.type;
    const key = `settings.${type}.useCustom`;
    this.setData({ [key]: !this.data.settings[type].useCustom });
  },

  // 自定义范围输入（通用）
  onCustomInput(e) {
    const { type, field } = e.currentTarget.dataset;
    const val = parseInt(e.detail.value, 10);
    if (!isNaN(val) && val >= 0) {
      this.setData({ [`settings.${type}.custom.${field}`]: val });
    }
  },

  // 加法进位策略
  onCarryPolicy(e) {
    const policy = e.currentTarget.dataset.policy;
    this.setData({ 'settings.addition.carryPolicy': policy });
  },

  // 减法退位策略
  onBorrowPolicy(e) {
    const policy = e.currentTarget.dataset.policy;
    this.setData({ 'settings.subtraction.borrowPolicy': policy });
  },

  // 保存设置
  onSave() {
    const app = getApp();
    app.updateSettings(this.data.settings);
    wx.showToast({ title: '已保存', icon: 'success', duration: 1000 });
    setTimeout(() => wx.navigateBack(), 800);
  }
});
