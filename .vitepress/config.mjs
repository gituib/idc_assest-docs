import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'IDC 设备资产管理系统',
  description: '现代化数据中心设备管理平台 - 文档站点',
  lang: 'zh-CN',

  // GitHub Pages 部署配置
  base: '/idc_assest-docs/',
  ignoreDeadLinks: [
    /^https?:\/\/localhost/,
  ],

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    logo: '/images/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      {
        text: '使用指南',
        link: '/guide/user-guide',
        activeMatch: '/guide/',
      },
      {
        text: '开发手册',
        link: '/dev/code-wiki',
        activeMatch: '/dev/',
      },
      {
        text: '部署运维',
        link: '/deploy/docker-deploy',
        activeMatch: '/deploy/',
      },
      {
        text: 'API文档',
        link: '/api/overview',
        activeMatch: '/api/',
      },
      {
        text: '版本更新',
        link: '/changelog',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '快速入门',
          collapsed: false,
          items: [
            { text: '开始使用', link: '/guide/getting-started' },
            { text: '用户指南', link: '/guide/user-guide' },
            { text: '常见问题', link: '/guide/faq' },
          ],
        },
        {
          text: '功能模块',
          collapsed: false,
          items: [
            { text: '仪表盘', link: '/guide/features/dashboard' },
            { text: '机房管理', link: '/guide/features/room-management' },
            { text: '资产管理', link: '/guide/features/device-management' },
            { text: '耗材管理', link: '/guide/features/consumable-management' },
            { text: '工单管理', link: '/guide/features/ticket-management' },
            { text: '资产盘点', link: '/guide/features/inventory-management' },
            { text: '空闲设备管理', link: '/guide/features/idle-device-management' },
            { text: '操作日志', link: '/guide/features/operation-logs' },
            { text: '备份管理', link: '/guide/features/backup-management' },
            { text: '系统管理', link: '/guide/features/system-management' },
          ],
        },
      ],
      '/dev/': [
        {
          text: '开发指南',
          items: [
            { text: 'Code Wiki', link: '/dev/code-wiki' },
          ],
        },
        {
          text: '架构设计',
          items: [
            { text: '系统架构', link: '/dev/architecture' },
            { text: '前端架构', link: '/dev/frontend-architecture' },
            { text: '后端架构', link: '/dev/backend-architecture' },
            { text: '数据模型', link: '/dev/data-model' },
          ],
        },
        {
          text: '设计文档',
          items: [
            { text: '系统设置重写设计', link: '/dev/specs/system-settings-rewrite' },
            { text: '设备字段必填规则设计', link: '/dev/specs/device-field-required' },
          ],
        },
      ],
      '/deploy/': [
        {
          text: '部署指南',
          items: [
            { text: 'Docker部署', link: '/deploy/docker-deploy' },
            { text: '手动部署', link: '/deploy/manual-deploy' },
            { text: '环境配置', link: '/deploy/env-config' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API参考',
          items: [
            { text: 'API概览', link: '/api/overview' },
            { text: '设备接口', link: '/api/devices' },
            { text: '工单接口', link: '/api/tickets' },
            { text: '备份接口', link: '/api/backup' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gituib/idc_assest' },
    ],

    footer: {
      message: '基于 MIT 协议开源',
      copyright: 'Copyright © 2024-2026 IDC设备资产管理系统',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/gituib/idc_assest/edit/master/docs-site/:path',
      text: '在GitHub上编辑此页',
    },

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '页面导航',
    },

    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
});
