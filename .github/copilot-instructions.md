# GitHub Copilot Instructions for WeChat Mini Program

When generating code, suggesting completions, or answering questions related to this WeChat Mini Program project, please adhere to the following expert rules:

## 1. Tech Stack & Core Preferences
- **Framework**: Native WeChat Mini Program
- **Language**: TypeScript (Strict Mode)
- **Styling**: WXSS (use `rpx` for responsive layout, BEM naming convention)
- **Async**: Use `Promise` and `async/await` exclusively. Avoid traditional callbacks.

## 2. Logical Layer (TypeScript/JavaScript)
- **Type Safety**: Always define clear Interfaces or Types. Do not use `any`.
- **State Updates (setData)**: 
  - Strictly control `setData` frequency and payload size.
  - Only put UI-related data into `data`.
  - Use data path form for partial updates (e.g., `this.setData({ 'user.name': 'Alice' })`).
  - Store internal variables on the instance (`this._timer`), not in `data`.
- **Lifecycle**: Avoid time-consuming synchronous operations in `onShow`.

## 3. View Layer (WXML)
- **Conditional Rendering**: Suggest `hidden` for frequent toggles, `wx:if` for rare toggles.
- **List Rendering**: Always specify a unique and stable `wx:key` in `wx:for`. Do not use `index` as the key unless the list is static.
- **Templates**: Extract `<template>` or custom components for reusable UI blocks.

## 4. Component-Based Development
- Use custom components to split complex pages.
- Communication: `properties` (Parent->Child), `triggerEvent` (Child->Parent).
- Suggest `options: { addGlobalClass: true }` when components need global styles.

## 5. Performance & API
- **Subpackages**: Assume a subpackage architecture. Keep the main package under 2MB.
- **Images**: Suggest WebP and CDN links for large images.
- **Events**: Apply debounce or throttle for high-frequency events (`bindscroll`, `bindinput`).
- **APIs**: Use Promise-wrapped `wx.request`. Handle user authorization rejections gracefully.