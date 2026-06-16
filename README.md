# IDC 设备资产管理系统 - 文档站点

> 现代化数据中心设备管理平台 · 官方文档站点

## 📖 项目简介

IDC 设备资产管理系统是一款面向数据中心（IDC）场景的综合性设备管理平台，提供从机房规划、设备采购、安装上架到报废退出的**全生命周期管理**，同时集成了 **3D 可视化展示**、**工单流转**、**耗材库存管理**、**资产盘点**等核心功能，帮助运维团队高效管理数据中心资产。

## 🌐 文档站点

在线文档站点：[https://gituib.github.io/idc_assest-docs/](https://gituib.github.io/idc_assest-docs/)

文档站点基于 **VitePress** 构建，部署于 GitHub Pages，涵盖了使用指南、开发手册、部署运维、API 文档等全部内容。

## 📂 文档导航

| 模块 | 说明 | 链接 |
|------|------|------|
| 🚀 快速开始 | 环境要求、安装启动、基本操作流程 | [快速开始](guide/getting-started) |
| 📘 用户指南 | 各功能模块详细使用说明 | [用户指南](guide/user-guide) |
| 🏢 机房管理 | 机房分类、机柜 CRUD、容量统计 | [机房管理](guide/features/room-management) |
| 💻 设备管理 | 设备全生命周期、端口线缆、导入导出 | [设备管理](guide/features/device-management) |
| 🎯 3D 可视化 | Three.js 机柜可视化、操作交互 | [仪表盘](guide/features/dashboard) |
| 📋 工单管理 | 工单流转、故障分类、统计分析 | [工单管理](guide/features/ticket-management) |
| 📦 耗材管理 | 入库出库、安全库存预警、SN 追踪 | [耗材管理](guide/features/consumable-management) |
| ✅ 资产盘点 | 盘点计划、暂存设备、盘盈处理 | [资产盘点](guide/features/inventory-management) |
| 📝 操作审计 | 操作日志记录、筛选检索 | [操作日志](guide/features/operation-logs) |
| 🔧 系统管理 | RBAC 权限、角色管理、系统配置 | [系统管理](guide/features/system-management) |
| 🗄️ 备份管理 | 数据备份与恢复 | [备份管理](guide/features/backup-management) |
| 🏗️ 开发手册 | 架构设计、数据模型、开发规范 | [开发手册](dev/code-wiki) |
| 🐳 部署运维 | Docker 部署、手动部署、环境配置 | [部署运维](deploy/docker-deploy) |
| 📡 API 文档 | 后端接口参考 | [API 概览](api/overview) |

## 🛠️ 本地构建

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建静态站点
npm run build

# 预览构建结果
npm run preview
```

## 🔗 相关链接

- [项目源代码仓库](https://github.com/gituib/idc_assest)
- [GitHub Issues](https://github.com/gituib/idc_assest/issues)
- [版本更新记录](changelog)
