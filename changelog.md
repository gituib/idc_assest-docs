---
editLink: false
---

# 版本更新

## 文档站点 v2.8.4（2026-11-13）

> 对应项目代码版本 [v2.8.4]

本次为**文档完整性专项更新**，依据代码仓库 `backend/config/routes.js`、`backend/routes/`、`backend/models/` 逐项比对后补齐缺失内容并修正错误。

### 新增文档

| 文档 | 说明 |
|------|------|
| [IPAM 接口](/api/ipam) | 网段管理、冲突检测、IP 查询与绑定、批量操作、在线探测、定时调度 |
| [端口采集与设备凭据接口](/api/port-collection) | 采集凭据 CRUD 与测试、交换机端口采集、Redfish 服务器采集、端口选项 |
| [库房与空闲设备接口](/api/warehouses) | 库房 CRUD、空闲设备转入/上架/恢复/删除，含级联与 U 位校验规则 |
| [观测与审计接口](/api/system-observability) | 前端错误上报、危险操作审计与风险等级、公开设备信息牌 |
| [IP 地址管理（IPAM）指南](/guide/features/ipam-management) | 网段规划、状态自动驱动机制、探测原理、典型流程 |
| [端口自动采集指南](/guide/features/port-collection) | 采集前准备、厂商账号配置、差异分区处理建议、故障排查 |
| [设备二维码信息牌指南](/guide/features/device-qrcode) | 单/批量生成、字段白名单、打印与部署要求 |

### 内容修正

| 文档 | 修正内容 |
|------|----------|
| [认证接口](/api/auth) | **移除不存在的 `/api/auth/refresh` 与双令牌模型**；令牌字段更正为 `token`；路径更正：`/me` → `/profile`、`/send-verify-email` → `/send-verify-code`、`/forgot-password` → `/forgot-password/send-code`；补充 `check-admin`、`unlock`、`change-password`；更正锁定阈值默认值为 3 次、维护模式返回 503 |
| [API 概览](/api/overview) | 路径修正：`/api/ports` → `/api/device-ports`、`/api/logs` → `/api/operation-logs`、`/api/settings` → `/api/system-settings`；补充 10 项免鉴权白名单、多层校验模型、404 JSON 兜底、错误脱敏、429/503 状态码 |
| [设备端口接口](/api/ports) | 全文路径前缀修正；`portId`/`nicId` 类型更正为字符串；字段名 `speed` → `portSpeed`；补充更新字段白名单、接线保护、批量删除与批量清理的语义区别 |
| [操作日志接口](/api/operation-logs) | 路径前缀修正；字段名 `action` → `operationType`、`logId` → `recordId`；`/actions` → `/types`；移除不存在的 `/export` 与 `/archive` 端点；补充 `pageSize` 上限 100 |
| [系统设置接口](/api/system-settings) | 路径前缀修正；重写为键值对模型（SystemSetting）；补充 SMTP 邮件、维护模式端点、前端端口同步、IPAM 探测配置键 |
| [权限接口](/api/permissions) | **由空文件补全**：三级权限模型、通配符机制、种子数据与启动期自检、完整权限码清单、IPAM 未纳入权限码的缺口说明 |
| [系统架构](/dev/architecture) | 重写中间件链为实际注册顺序；补充认证白名单与精确匹配约束、配置驱动路由挂载机制；路由表扩充至 37 个模块；数据模型图补充 IPAM、凭据、库房关系 |
| [后端架构](/dev/backend-architecture) | 路由注册机制改为 `routeLoader`；路由表按实际文件名与前缀重写；补充响应格式不一致清单与目录结构 |

### 导航与首页

- 侧边栏「功能模块」新增 3 项：设备二维码信息牌、端口自动采集、IP 地址管理
- 侧边栏「API参考」重组为 5 个分组：API参考 / 资产与线路 / IP 与网络 / 业务管理 / 系统管理
- 首页特性卡片更新：新增端口自动采集、IPAM、设备二维码信息牌；修正双授权协议描述

## 项目代码

### v2.8.4（2026-11-06）

#### 新增功能
- **前端错误日志上报**：新增 `frontendLogger` 全局捕获（`window.onerror` / `unhandledrejection` / `ErrorBoundary`）并上报后端统一日志，新增 `POST /api/frontend-logs` 接口（免鉴权 + IP 限流 30 次/分钟）
- **事故诊断脚本**：新增 `scripts/incident-doctor.js`（只读诊断工具，产出事故卡），新增 `doctor` 命令

#### 功能改进
- **权限种子初始化**：后端启动时幂等 upsert 补齐权限种子，角色管理页新增加载/错误/空态处理
- **后端错误处理**：新增 `/api` 404 JSON 兜底与统一错误中间件 `errorHandlerMiddleware`，替代 Express 默认 HTML

### v2.8.3（2026-10-13）

#### 新增功能
- **IPAM IP 与设备关联**：`IpAddress` 新增 `ipType`（management/business/public/storage/other）、`customTag`、`isPrimaryForDevice`、`statusAutoDriven` 四个字段
- **IPAM 网段用途标记**：`Subnet` 新增 `purpose` 字段，网段内 IP 绑定时自动推荐 `ipType`
- **IPAM 绑定/解绑 API**：`PATCH /ips/:id/bind`、`PATCH /ips/:id/unbind`、`POST /ips/batch-bind`，支持事务、主 IP 互斥、状态自动驱动
- **IPAM 全局 IP 查询**：`GET /ips` 支持 `deviceId` / `ipType` / `status` / `keyword` 筛选
- **设备删除级联清理**：删除设备时自动解绑已绑 IP，自动驱动的 `used` 状态回退 `free`

#### 功能改进
- **旧字段迁移**：`Device.ipAddress` 5266 条数据导入 `IpAddress` 表（`ipType=management`、`status=used`），旧字段保留但废弃
- **PUT /ips/:id 增强**：支持修改 `ipType`/`customTag`/`isPrimaryForDevice`；绑定中的 IP 禁止改为 `gateway`/`excluded`
- **前端表格增强**：IP 类型彩色标签列、已绑设备列（主 IP 带 ★ 标记）

### v2.8.2（2026-10-13）

#### 新增功能
- **Playwright E2E 测试框架**：引入 `@playwright/test`，新增 `playwright.config.js`（api/ui/perm/biz/e2e 五个项目，自动拉起前后端、串行规避 SQLite 写锁）
- **友好数据库错误提示**：新增 `friendlyDbErrorMessage`，唯一约束冲突转为中文提示

#### 功能改进
- **在线更新依赖检测重构**：逐个核对 `package.json` 直接依赖是否已安装，移除对 `git diff HEAD~1` 的脆性依赖

#### 问题修复
- 设备 `deviceId` 自动分配并发撞号重试（最多 8 轮 + 随机退避）
- 新增 U 位越界校验（42U 机柜不允许 U50）
- 空闲设备上新/编辑/恢复上架增加 U 位冲突校验
- 转入空闲与批量转入空闲时从原机柜扣减功耗
- 删除空闲设备时级联清理端口/网卡/工单/盘点记录
- 接线批量创建补齐四向冲突检查，编辑线缆时校验新端口未被占用
- 盘点任务 `recordId` 生成改用集合去重，避免 `ER_DUP_ENTRY`
- 端口日志 `shouldLog` 优先级误判（改用 `??` 空值合并）

### v2.8.1（2026-10-12）

#### 问题修复
- 接线删除端口状态残留与端口采集事务问题
- **端口有接线时禁止修改端口信息**

### v2.8.0（2026-10-12）

#### 新增功能
- **交换机端口自动采集**：SSH/SNMP/Telnet 多协议采集，差异预览后选择性落库
- **设备凭据管理**：SSH/SNMP/Telnet/Redfish 凭据 CRUD，AES-256-GCM 加密存储，连通性测试
- **服务器带外采集**：Redfish 读取硬件清单与网卡端口，自动同步 `NetworkCard`
- **设备/耗材图片上传**

### v2.7.1（2026-10）

#### 新增功能
- **工单快速报修智能解析**：自然语言描述自动提取设备、故障类型、优先级

### v2.7.0（2026-10）

#### 新增功能
- **盘点员分配**：盘点任务支持分配指定盘点员
- **Nginx 配置一键同步**：系统设置中同步前端端口至 Nginx 配置

### v2.6.0（2026-10）

#### 新增功能
- **设备二维码信息牌**：单设备/批量生成，可下载 PNG、打印 A4、复制链接；免鉴权公开页 `/p/devices/:id`，字段白名单排除 IP 与备注

### v2.5.1（2026-08-18）

#### 新增功能
- **双授权模式**：GPL-3.0 开源 + 商业授权，新增 `LICENSE-COMMERCIAL.md`
- **许可证切换**：`LICENSE` 由 MIT 切换为 GPL-3.0-or-later

#### 功能改进
- **导航重构**：端口/接线管理拆分为独立「线路管理」分组
- **用户管理**：弹窗分组标题与配色统一
- **设备字段管理**：引入 `designTokens` 主题变量统一视觉规范

#### 问题修复
- 空闲设备上架时未填 U 位导致原 U 位信息被覆盖丢失，新增 U 位必填校验
- 上架弹窗回填原 U 位作为默认值

## 文档站点 v2.4.1（2026-07-31）

> 对应项目代码版本 [v2.4.1]

- **同步项目代码更新至 v2.4.1**
- 新增 v2.3.4 / v2.3.5 / v2.4.0 / v2.4.1 版本更新记录
- 更新系统管理文档：新增权限管理体系说明、三级权限结构详解、角色管理页面操作指南
- 更新 API 文档：新增权限接口、角色管理接口、网络拓扑接口、系统监控（CPU 使用率）接口
- 更新首页概览与 README 导航

## 文档站点 v1.0.0（2025-06-16）

> 对应项目代码版本 [v2.1.0]

- **初始文档站点发布**
- 基于 VitePress 构建，部署于 GitHub Pages（[https://gituib.github.io/idc_assest-docs/](https://gituib.github.io/idc_assest-docs/)）
- 完整的使用指南：涵盖机房管理、设备管理、耗材管理、工单管理等所有功能模块的详细说明
- 开发手册：包含系统架构、前端架构、后端架构、数据模型等设计文档
- 部署运维指南：Docker 部署、手动部署、环境配置说明
- API 文档：后端接口参考文档
- 版本更新记录与 FAQ 常见问题

## 项目代码

### v2.5.1（2026-08-18）

#### 新增功能
- **双授权模式**：新增双授权模式（GPL-3.0 开源 + 商业授权），新增 LICENSE-COMMERCIAL.md 商业授权协议
- **许可证切换**：LICENSE 由 MIT 切换为 GPL-3.0-or-later，README 更新双授权说明

#### 功能改进
- **导航重构**：侧边栏菜单重构，将端口/接线管理拆分为独立「线路管理」分组，优化 Logo 与菜单样式
- **用户管理**：弹窗分组标题与配色统一，联系方式改为左右两列布局
- **设备字段管理**：引入 designTokens 主题变量统一视觉规范，新增统计卡片与表格样式重构

#### 问题修复
- **空闲设备**：修复上架时未填 U 位导致原 U 位信息被覆盖丢失的问题，新增 U 位必填校验
- **空闲设备**：上架弹窗回填原 U 位作为默认值，机柜/U位表单项新增必填校验

### v2.5.0（2026-07-21）

#### 新增功能——远端备份增强
- **多目标远端备份**：新增多目标远端备份管理（FTP/SFTP/WebDAV 协议目标配置）
- **一键上传**：新增备份文件一键上传至远端目标功能
- **连接测试**：新增远端目标连接测试接口
- **API 新增**：getRemoteTargets / getRemoteSettings / updateRemoteSettings / uploadToRemote / testRemoteTarget
- **备份管理页面**：新增远端备份管理 UI（+847 行）
- **自动备份设置**：扩展远端备份配置（+179 行）

#### 问题修复
- remoteBackup 修复 SFTP 上传未拼接 rootPath，导致文件上传到错误目录的问题
- remoteBackup 修复 Windows 平台 path.dirname 将正斜杠当反斜杠处理的问题，改用 path.posix
- remoteBackup 优化 WebDAV 目录创建逻辑，避免 dirname='.' 或 '/' 触发多余调用
- RemoteBackupSettings 修复分步表单跨步骤字段丢失问题（getFieldsValue(true) 替代 validateFields）

#### 功能改进
- backend package.json 新增 nodemonConfig 热重载配置（忽略 config/logs/uploads/temp/tests）

### v2.4.2（2026-07-21）

#### 问题修复
- CableManagement 修复缺失的 FilterOutlined 图标导入

### v2.4.1（2026-07-21）

#### 问题修复
- 前端组件新增多个组件 catch 分支的 message.error 提示（ServerBackplanePanel / BatchStatusModal / BatchWarrantyModal / DeviceFormModal / TopologyModal / AutoBackupSettings）
- 修复 CategoryManagement / ConsumableLogs / IdleDeviceManagement / InventoryManagement / TicketManagement 组件卸载后更新 state 的内存泄漏问题（新增 cancelledRef 模式）
- 移除 CableManagement / PortManagement / BackupManagement / IdleDeviceManagement 中的多余 console.log 调试输出
- 移除 CableManagement / PortManagement / TicketManagement 未使用的 import 引用
- ConsumableManagement 修复 Tag 组件 key 从 index 改为 sn，消除 React key 警告
- PortManagement 修复 clearInterval 在 importProgressInterval 上的变量作用域问题

### v2.4.0（2026-07-21）

#### 新增功能——权限管理体系
- 新增 requirePermission 中间件，支持细粒度按钮级权限控制
- 新增 init-permissions.js 种子脚本，预设三层权限结构（模块→菜单→按钮）
- 新增 RoleManagement 角色管理页面（前端页面 + 后端路由）
- 新增 permissions.js 路由，所有后端路由批量接入权限中间件
- 扩展 Permission 模型字段定义

#### 新增功能——网络拓扑重构
- 新增 CustomEdge 自定义边组件，支持线缆类型（以太网/光纤/铜缆）与状态着色
- 新增 GlassNodeShell / NodeShell / DeviceIcon 节点壳组件，提升设备节点视觉表现
- 新增 TopologyLayout 模型与 API，支持拓扑节点位置持久化
- 重构 TopologySidebar 侧边栏，布局与交互优化
- 优化 TopologyModal 与 TopologyControls 交互

#### 功能改进
- UserManagement 用户管理页面增强，集成角色分配与搜索筛选
- Login 登录页面 UI 优化
- 3D 组件 DeviceModel / RackModel / Scene 渲染优化
- 前端路由 App.jsx 重构，优化页面组织结构
- backend package.json 新增 init-database / init-permissions 脚本
- hooks/useAuth 认证 hooks 优化
- 各路由统一接入鉴权中间件，修复未受保护的路由

### v2.3.5（2026-07-21）

#### 功能改进
- 耗材统计页面 UI 全面重构：卡片数据驱动渲染、出入库对比改进度条+净流量徽章、类别分布改 SVG 环形图、新增快速筛选按钮
- CI 升级 GitHub Actions 依赖版本（actions/checkout@v5、docker/login-action@v4、setup-buildx-action@v4、build-push-action@v6）

#### 问题修复
- systemSettings 修复 projectPath 路径错误（update.js 所在位置指向）
- DeviceDetailDrawer 修复端口列表按名称数字段自然排序（支持 1/0/10 正确排序）

### v2.3.4（2026-07-21）

#### 新增功能
- **系统监控**：新增基于 os.cpus().times 差值的 CPU 使用率采样器，跨平台准确获取（替代 os.loadavg）
- **工单统计**：新增工单趋势折线图组件（纯 SVG，无第三方依赖），支持悬浮查看每日设备详情
- **工单统计**：新增工单统计时间范围筛选预设（全部/7天/30天/90天/1年）
- **工单管理**：新增 cancelled（已取消）工单状态支持

#### 功能改进
- 盘点模块后端 inventory.js 重构优化（+445/-209 行）
- 盘点任务执行前端 InventoryTaskExecution 页面优化

#### 问题修复
- 系统信息修复 os.hostname() 引用 osUtils 冗余导入的问题
- TicketStatistics 修复日期范围选择器支持清空（显示全部数据）

### v2.3.3（2026-07-21）

- **在线更新优化**：后端新增 isDocker 检测，区分 Docker/非Docker 环境的更新提示
- **在线更新 UI 优化**：加载态改为骨架屏脉搏动画，圆形图标增加背景容器，版本标签样式精简
- **Docker 环境更新指引**：在 Docker 运行时提示"拉取最新镜像后重建容器"，不再显示终端命令

### v2.3.2（2026-07-21）

- **系统版本在线检查**：新增系统版本在线检查功能，调用 GitHub API 获取最新 tag 并与当前版本比较
- **在线更新界面**：系统设置「关于系统」页新增「在线更新」卡片，支持一键检查新版本
- **API 新增**：`GET /api/system-settings/system/check-update` 版本检查接口（5 分钟缓存）

### v2.3.1（2026-07-21）

- **备份恢复修复**：修复 JSON 字段反序列化仅处理 Device.customFields，其他表 JSON 字段丢失的问题
- **增量恢复修复**：修复增量恢复中 JSON 字段未做反序列化的问题
- **备份日志修复**：修复日志模板字符串 `${var}` 在单引号中不生效的问题
- **字段管理修复**：修复 OptionsEditor 组件 `value` 传入 `undefined` 导致 `.map()` 报错
- **备份配置完善**：新增 Warehouse（仓库）、OperationLog（操作日志）的备份配置
- **备份列表增强**：过滤规则新增 `incremental_` 文件前缀支持

### v2.3.0（2026-07-21）

- **邮箱验证与 SMTP 邮件服务**：新增邮箱验证码登录与找回密码功能，支持 6 位验证码 5 分钟有效期
- **SMTP 邮件配置管理**：支持在系统设置中配置 SMTP 服务器，发送测试邮件与验证码邮件
- **EmailVerifyBanner 组件**：新增邮箱验证状态横幅，提醒未验证用户
- **找回密码页面**：新增基于邮箱验证码的密码重置流程
- **邮件模板**：新增测试邮件与验证码邮件的 EJS 模板
- **账户设置增强**：支持邮箱绑定与验证，优化交互体验
- **SMTP 密码加密**：新增 crypto 工具，SMTP 密码加密存储
- **登录页面**：新增「忘记密码」入口和验证码登录切换
- **权限修复**：修复 authStore 中 roles 未合并到 user 对象的权限判断问题
- **UI 修复**：修复邮件服务页面表单控件大小不一致、错误提示逻辑问题

### v2.2.4（2026-07-17）

- **操作日志审计增强**：新增操作日志操作类型（入库/出库/库存调整/上架/转入空闲/解锁/登录/登出等30+种类型），新增模块覆盖（空闲设备/端口管理/线缆管理/网卡管理/认证管理/系统设置/库房管理/备份管理）
- **操作日志统计优化**：统计数据兼容 MySQL 与 SQLite 的日期分组表达式
- **备份操作日志审计**：备份创建、恢复、上传、下载、删除、清理、配置更新等操作均记录详细审计日志
- **认证操作日志审计**：登录、登出、注册、解锁、密码修改等认证操作均记录详细审计日志
- **3D 可视化增强**：重构设备前面板布局与硬盘细节，提升设备辨识度
- **端口列表排序**：端口列表按名称数字段自然排序（如 eth0, eth1, ..., eth10）
- **端口管理修复**：修复交换机子页签误显示防火墙/路由器/存储设备的问题
- **仪表盘修复**：修复 NavigationGrid 响应式布局、QuickStats hover 动画、SystemInfo 伪造数据等5个 P0 级问题
- **系统设置重构**：外观设置（主题色）移除，命令区域改暗色终端风格 UI，复制兼容 execCommand 方案
- **空闲设备优化**：状态字段过滤 idle 选项

### v2.2.3（2026-07-17）

- **3D 可视化优化**：优化3D机柜设备颜色辨识度（服务器深石墨灰、交换机中灰偏蓝、防火墙深灰红调、存储深炭灰），增加设备上下银色边框条分隔相邻设备
- **3D 结构增强**：机柜内部两侧增加前安装轨，强化结构真实感与层次感
- **3D 闪烁修复**：修复4处 Z-fighting 深度冲突（侧板与立柱、前安装轨与前面板等），优化 OrbitControls 中键平移与全屏功能
- **3D 页面布局重构**：顶部 Header 改为浅色玻璃态适配 light theme，右侧 Rack Info 面板浅色玻璃态重构，新增底部 KPI 快捷栏
- **3D 交互修复**：修复 Header 按钮点击无响应、左键旋转失效等问题，规范化 Z-Index 层级体系
- **仪表盘修复**：修复 NavigationGrid 响应式布局、QuickStats hover 动画、SystemInfo 伪造数据、AnimatedCounter 动画重置、DeviceTrendChart 空数组异常等5个 P0 级问题
- **端口管理修复**：修复交换机子页签误显示防火墙/路由器/存储设备的问题
- **端口管理增强**：支持自定义设备类型进入端口管理，设备图标按类型区分背景色，新增「其他」Tab 展示自定义类型设备
- **空闲设备优化**：状态字段过滤 idle 选项

### v2.2.2（2026-07-16）

- **分页配置扩展**：前端分页可选条数扩展至 100/200/500/1000
- **设备表单修复**：修复设备表单字段重复渲染和残留值问题

### v2.2.1（2026-07-11）

- **批量维保更新**：新增批量更新设备维保信息功能，包含前后端完整实现
- **端口选项集中管理**：新增端口选项接口与集中管理 hook，统一维护端口/线缆类型数据
- **端口/线缆类型扩展**：扩展端口类型、线缆类型枚举值，支持更多硬件规格
- **网卡编辑功能**：新增网卡编辑功能，完善设备端口管理流程
- **3D 机柜优化**：优化3D机柜U位渲染逻辑，修复机柜使用率计算问题，重构3D材质与模型渲染
- **3D 交互修复**：修复3D可视化交互问题，优化背板渲染逻辑

### v2.2.0（2026-07-03）

- **端口管理重构**：重构端口管理页面，新增端口批量操作（批量编辑、批量清理）、分组预览功能，提升端口运维效率
- **线缆管理优化**：优化线缆管理流程，增强端口跳线引导体验，支持更直观的连线操作指引
- **空闲设备管理功能**：新增空闲设备列表与详情展示页面，支持按资产编号、设备名称、设备型号搜索筛选
- **空闲设备字段优化**：移除空闲设备表单中的资产状态和入库日期字段，优化数据录入体验
- **用户管理列表优化**：修复用户管理列表分页超出一页时系统设置 Tab 切换失效的问题
- **盘点管理详情优化**：修复盘点完成状态回显显示问题，优化部分页面字段展示
- **耗材管理优化**：修复耗材入库数量显示异常的问题
- **无数据页面优化**：优化空闲设备页面、库位页面、工单详情页的无数据展示提示
- **系统稳定性提升**：修复多处前端逻辑异常和状态管理问题

### v2.1.1（2026-06-16）

- **端口管理优化**：新增按设备分组的端口查询 API，修复端口过多时部分设备不显示的分页问题
- **前端端口页面重构**：改为设备维度分页，移除旧的端口级分页逻辑，统一端口名称自然排序

### v2.1.0

- 优化系统设置页面
- 增强设备字段管理功能
- 改进3D可视化性能

### v2.0.0

- **重大更新：重构前端架构**，采用 React + Vite 构建，提升开发效率和运行性能
- 引入 Three.js + @react-three/fiber，实现 3D 机柜可视化展示
- 新增工单管理系统：完整的工单流转、故障分类与优先级管理
- 新增耗材库存管理：入库出库、安全库存预警、SN 序列号追踪
- 新增资产盘点功能：盘点计划、暂存设备、盘盈处理
- 重构备份管理模块，支持更灵活的数据备份与恢复
- 增强 RBAC 权限控制，支持更细粒度的角色权限配置
- 升级 UI 组件库至 Ant Design 5

### v1.0.0

- 初始版本发布
- 基本的设备 CRUD 功能
- 机房与机柜管理
- 简单的统计看板
