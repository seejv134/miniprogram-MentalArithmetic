# 英语达人模式（English Expert Mode）设计文档

- 日期：2026-04-16
- 作者：讨论定稿
- 状态：待实现

## 1. 背景与目标

当前答题页面的题目（`op1 运算符 op2 = ?`）与四个选项均为阿拉伯数字。
用户希望新增一个"英语达人"开关：开启后，答题区内所有数字替换为英文单词，帮助强化英文数词记忆。

**目标**：一键切换显示模式，不改变题目生成逻辑、不改变正确答案，只改变数字的视觉呈现；在不牺牲可读性的前提下适配英文长文本的布局。

**非目标**：
- 不支持语音朗读
- 不引入额外的「英文听力/拼写」题型
- 不支持中文大写或其他语言
- 不改变运算符的显示（仍使用 `+ − × ÷`）

## 2. 数据范围与英文长度调研

| 运算 | 操作数上限 | 结果上限 | 最长英文字串示例 |
|---|---|---|---|
| 加法 | 1000 + 1000 | 2000 | `one thousand nine hundred ninety-nine`（≈37 字符） |
| 减法 | 1000 − 0 | 1000 | 同上量级 |
| 乘法 | 33 × 33 | 1089 | `one thousand eighty-nine`（≈24 字符） |
| 除法 | 被除数 ≤ 33×33 | 1089 / 33 | 同上量级 |

**整体范围：0–2000**。`numberToWords` 函数只需覆盖 `[0, 9999]` 即足够安全。

单行最坏情况（如 `978 + 777 = ?` 英文展开）约 60+ 字符，在 750rpx 屏宽下单行放不下，**必须改布局**。

## 3. 总体方案

### 3.1 设置侧

在**设置页「外观」卡片**底部追加一行 `form-row`：

```
┌ 外观 ──────────────────────
│ 选择你喜欢的氛围
│  [晨雾]  [琥珀]  [赛博]
│ ───────────────────────
│ 我是英语达人          [开关]
└────────────────────────────
```

- 数据字段：`settings.feedback.englishMode: boolean`（复用 `feedback` 分组做杂项集合；也可新增 `settings.display.englishMode`，择其一，见 §8 决策）
- 默认值：`false`
- 持久化：复用现有的 `wx.setStorageSync` 设置保存流程

### 3.2 答题侧

引入新的根类 `practice--en`，在 `englishMode === true` 时挂载。所有针对英文模式的样式覆盖都在这个类下写，不影响现有数字模式。

**题目区布局（竖排）**：

```
    nine hundred seventy-eight
              +
    seven hundred seventy-seven
              =
              ?
```

- `.practice__question` 在 `.practice--en` 下改为 `flex-direction: column`，`gap` 缩小到 `--space-md`
- 操作数字号从 `--text-3xl` (72rpx) 降到 `--text-lg` (36rpx)
- 运算符/等号字号降到 `--text-md` (32rpx)
- 允许操作数内部 `word-break: break-word` 防极端情况溢出

**选项区布局（单列 4 行）**：

```
┌──────────────────────────────┐
│ one thousand seven hundred   │
│        fifty-five            │
└──────────────────────────────┘
┌──────────────────────────────┐
│        ....                  │
└──────────────────────────────┘
```

- `.practice__options` 在 `.practice--en` 下改为 `grid-template-columns: 1fr`，`max-width` 放宽到 `640rpx`
- 按钮高度改为 `min-height: 120rpx`，允许内部换行而自适应拉高
- 字号从 `--text-2xl` (56rpx) 降到 `--text-md` (32rpx)
- `padding` 左右补上，让长单词居中呼吸

## 4. 组件 / 模块拆分

### 4.1 新增：`miniprogram/utils/englishNumber.js`

纯函数工具模块，零副作用、无依赖。

```js
/**
 * 将整数 n ∈ [0, 9999] 转为小写英文字串。
 * 超出范围时返回 String(n) 作为降级。
 * 规则：
 *   0 → "zero"
 *   十位带个位加连字符：23 → "twenty-three"
 *   百位后省略 "and"（美式）：123 → "one hundred twenty-three"
 *   千位：2000 → "two thousand"，1234 → "one thousand two hundred thirty-four"
 */
function numberToEnglish(n) { /* ... */ }
module.exports = { numberToEnglish };
```

导出单个函数，便于单元测试。

### 4.2 修改：`miniprogram/pages/practice/practice.js`

- `data` 增加 `englishMode: false`
- `onShow` 中从 `app.globalData.settings` 同步 `englishMode`
- `_nextQuestion` 中新增派生字段：
  - `op1Text` = `englishMode ? numberToEnglish(op1) : String(op1)`
  - `op2Text` = 同上
  - `optionTexts` = `options.map(v => englishMode ? numberToEnglish(v) : String(v))`
- 原始数字仍保留在 `data.op1/op2/options`，仅用于判题；新字段只用于渲染

### 4.3 修改：`miniprogram/pages/practice/practice.wxml`

```xml
<view class="practice theme-{{theme}} {{englishMode ? 'practice--en' : ''}}">
  ...
  <view class="practice__question">
    <text class="practice__num">{{op1Text}}</text>
    <text class="practice__operator">{{operator}}</text>
    <text class="practice__num">{{op2Text}}</text>
    <text class="practice__eq">=</text>
    <text class="practice__blank">?</text>
  </view>
  ...
  <text class="practice__option-text">{{optionTexts[index]}}</text>
```

### 4.4 修改：`miniprogram/pages/practice/practice.wxss`

追加一段 `.practice--en` 作用域的样式覆盖（约 30 行）：
- 题目区竖排、字号降档
- 选项区单列、高度自适应、字号降档、内部换行

### 4.5 修改：`miniprogram/pages/settings/settings.wxml`

在外观卡片 `card__body` 的 `theme-grid` 之后追加：

```xml
<view class="form-row form-row--divided">
  <text class="form-label">我是英语达人</text>
  <switch
    class="card__switch"
    checked="{{settings.feedback.englishMode}}"
    bindchange="onToggleEnglishMode"
    catchtap="stopProp"
    color="{{switchColor}}"
  />
</view>
```

### 4.6 修改：`miniprogram/pages/settings/settings.js`

- 新增 `onToggleEnglishMode` 处理函数，复用现有 `onToggleFeedbackSound/Vibration` 模板
- 保存后同步到 `app.globalData.settings.feedback.englishMode`

### 4.7 修改：`miniprogram/app.js`

- 默认设置对象中加入 `feedback.englishMode: false`
- 读取已存设置时对缺失字段做向后兼容（`?? false`）

## 5. 数据流

```
settings 页切换开关
  ↓ onToggleEnglishMode
  setData + wx.setStorageSync
  ↓
app.globalData.settings.feedback.englishMode = true/false
  ↓
practice 页 onShow 读取并 setData({ englishMode })
  ↓
_nextQuestion 计算 op1Text / op2Text / optionTexts
  ↓
WXML 用 Text 字段渲染；根 view 挂 practice--en 类
  ↓
WXSS 条件样式生效
```

**关键不变量**：数字→文本只发生在渲染层；判题逻辑仍比较数值索引（`selectedIndex === correctIndex`），与英文无关。

## 6. 边界与错误处理

| 场景 | 处理 |
|---|---|
| `n = 0`（如 5−5=0） | 返回 `"zero"` |
| `n` 超出 [0, 9999] | 返回 `String(n)`（降级不崩溃） |
| 开关切换时正在等待下一题 | 当前题立刻按新模式重渲染（下次 `setData` 生效即可，无需额外处理） |
| 旧用户本地无 `englishMode` 字段 | 读取时 `?? false`，行为与今天一致 |
| 超长单词挤爆按钮 | 按钮内 `word-break: break-word` + `min-height` 自适应拉高 |

## 7. 测试计划

**单元测试**（`numberToEnglish`）：
- 0 → "zero"
- 1, 9, 10, 11, 19, 20, 21, 99 → 边界
- 100, 101, 120, 999 → 百位
- 1000, 1001, 1234, 2000, 9999 → 千位
- −1, 10000 → 降级（返回 `String(n)`）

**手动验收**：
1. 关闭英语模式，练习页显示阿拉伯数字，布局与当前一致（回归）
2. 开启英语模式，题目竖排、选项单列、字号合适，无溢出
3. 在乘法（短数字）、加法大范围（长数字）两种配置下分别观察最长题目
4. 切主题（晨雾/琥珀/赛博）× 英语模式开关，颜色和反馈状态正常
5. 答对/答错状态下的绿/红色在单列按钮上视觉正常

## 8. 待确认的小决策

1. **配置字段归属**：`settings.feedback.englishMode` vs `settings.display.englishMode`
   - 前者改动小、与现有反馈开关同组
   - 后者语义更清晰，但需新增一个 `display` 分组
   - **决策**：默认采用 `settings.feedback.englishMode`（最小改动）；若后续「显示类」开关变多再抽 `display` 分组

2. **hyphen 风格**：`twenty-three` vs `twenty three`
   - **决策**：采用**标准英文写法** `twenty-three`（带连字符），仅十位和个位之间使用

## 9. 工作量估算

| 模块 | 行数 | 耗时 |
|---|---|---|
| `numberToEnglish.js` | ~50 | 30 min |
| practice 页 js + wxml + wxss 改动 | ~60 | 1 h |
| settings 页 wxml + js + app.js 默认值 | ~25 | 30 min |
| 调试 + 真机看布局 | — | 1 h |
| **合计** | ~135 行 | **3 小时左右** |

## 10. 风险与后续

- 风险：英文字号降档后在小屏（iPhone SE 等）是否仍清晰需真机验证
- 后续可扩展：音效反馈加入朗读英文单词；选项按钮添加语音图标点击试听
