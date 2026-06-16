---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "IDC 设备资产管理系统"
  text: "现代化数据中心设备管理平台"
  tagline: 机房管理 · 设备全生命周期 · 3D可视化 · 工单管理 · 耗材管理
  image:
    src: /images/hero-icon.svg
    alt: IDC管理系统
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 用户指南
      link: /guide/user-guide
    - theme: alt
      text: GitHub仓库
      link: https://github.com/gituib/idc_assest

features:
  - title: 机房与机柜管理
    details: 支持多机房分类管理、机柜CRUD操作、容量统计，配合平面图与3D可视化，直观呈现数据中心布局。
    icon: 🏢
  - title: 设备全生命周期管理
    details: 从采购、安装、运行到报废的全流程跟踪，支持批量导入导出、自定义字段、端口与线缆管理。
    icon: 💻
  - title: 3D可视化展示
    details: 基于Three.js的3D机柜可视化，支持旋转缩放、设备信息悬停查看、LOD性能优化。
    icon: 🎯
  - title: 工单与故障管理
    details: 完整的工单流转流程，支持故障分类、优先级管理、统计分析，保障运维效率。
    icon: 📋
  - title: 耗材库存管理
    details: 耗材入库出库管理、安全库存预警、SN序列号追踪、领用记录与统计报表。
    icon: 📦
  - title: 资产盘点
    details: 盘点计划制定与执行、暂存设备管理、盘盈设备处理，确保资产账实相符。
    icon: ✅
  - title: 操作审计日志
    details: 全方位操作日志记录，支持按模块、类型筛选和操作统计，满足审计需求。
    icon: 📝
  - title: 系统管理
    details: 基于RBAC的用户角色权限管理、系统参数配置，保障系统安全可控。
    icon: ⚙️
---

::: tip 部署说明
本文档站点使用 **VitePress** 构建，通过 GitHub Actions 自动部署到 **GitHub Pages**。  
配置文件中 `base` 设置为 `/idc_assest-docs/`，对应仓库名称路径，确保静态资源引用正确。
:::---
