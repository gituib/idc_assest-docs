# 系统设置页面重写设计

> 原文：[docs/superpowers/specs/2026-06-12-system-settings-rewrite-design.md](https://github.com/gituib/idc_assest/blob/master/docs/superpowers/specs/2026-06-12-system-settings-rewrite-design.md)

## 概述

重写系统设置主页面（`SystemSettings.jsx`），遵循务实原则：每个设置项都必须有实际效果。移除所有"只写不读"的设置项，新增 maintenance_mode 和 max_login_attempts 的后端执行逻辑。

**范围**：仅重写系统设置主页面，备份相关 3 个页面保持不变。

## 设计决策

- **方案 A**：保持 3 Tab 结构（基本设置、外观设置、关于系统）
- **务实派**：移除所有无实际效果的设置项，保留的每个设置项都必须有前后端闭环
- **精简优先**：不新增功能，先做精简

## 设置项清单

### Tab 1：基本设置

| 设置项 | Key | 类型 | 实际效果 |
|--------|-----|------|----------|
| 站点名称 | site_name | string | 浏览器 title |
| 空闲超时 | idle_timeout | number | 前端 idle-timeout hook |
| 最大登录尝试 | max_login_attempts | number | 后端登录限流 |
| 维护模式 | maintenance_mode | boolean | 后端中间件拦截 |

### Tab 2：外观设置

| 设置项 | Key | 类型 | 实际效果 |
|--------|-----|------|----------|
| 登录页背景 | login_bg | upload | 登录页背景图 |
| 站点 Logo | site_logo | upload | 左上角 Logo |

更多详情请查看完整设计文档。
