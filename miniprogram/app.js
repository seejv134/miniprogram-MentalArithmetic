const { rebuildAllCandidates } = require('./utils/candidates');

const DEFAULT_SETTINGS = {
  addition: {
    enabled: true,
    level: 3,
    useCustom: false,
    custom: { min1: 0, max1: 100, min2: 0, max2: 100 },
    carryPolicy: 'any'
  },
  subtraction: {
    enabled: true,
    level: 3,
    useCustom: false,
    custom: { min1: 0, max1: 100, min2: 0, max2: 100 },
    borrowPolicy: 'any'
  },
  multiplication: {
    enabled: false,
    level: 2,
    useCustom: false,
    custom: { min1: 1, max1: 9, min2: 1, max2: 9 }
  },
  division: {
    enabled: false,
    level: 2,
    useCustom: false,
    custom: { minQ: 1, maxQ: 9, minD: 1, maxD: 9 }
  }
};

App({
  globalData: {
    settings: null,
    candidates: {
      addition: [],
      subtraction: [],
      multiplication: [],
      division: []
    }
  },

  onLaunch() {
    let settings = wx.getStorageSync('settings');
    if (!settings) {
      settings = DEFAULT_SETTINGS;
      wx.setStorageSync('settings', settings);
    }
    this.globalData.settings = settings;
    rebuildAllCandidates(settings, this.globalData.candidates);
  },

  updateSettings(newSettings) {
    this.globalData.settings = newSettings;
    wx.setStorageSync('settings', newSettings);
    rebuildAllCandidates(newSettings, this.globalData.candidates);
  }
});
