import{_ as a,o as n,c as t,a2 as i}from"./chunks/framework.Cd7uensT.js";const k=JSON.parse('{"title":"系统架构","description":"","frontmatter":{},"headers":[],"relativePath":"dev/architecture.md","filePath":"dev/architecture.md","lastUpdated":1781596792000}'),p={name:"dev/architecture.md"};function e(l,s,d,r,c,o){return n(),t("div",null,[...s[0]||(s[0]=[i(`<h1 id="系统架构" tabindex="-1">系统架构 <a class="header-anchor" href="#系统架构" aria-label="Permalink to &quot;系统架构&quot;">​</a></h1><h2 id="整体架构" tabindex="-1">整体架构 <a class="header-anchor" href="#整体架构" aria-label="Permalink to &quot;整体架构&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>┌─────────────────────────────────────────────┐</span></span>
<span class="line"><span>│              客户端层 (Client)                │</span></span>
<span class="line"><span>│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │</span></span>
<span class="line"><span>│  │  浏览器   │  │  移动端   │  │  Web App │  │</span></span>
<span class="line"><span>│  └──────────┘  └──────────┘  └──────────┘  │</span></span>
<span class="line"><span>└──────────────────┬──────────────────────────┘</span></span>
<span class="line"><span>                   │</span></span>
<span class="line"><span>                   ▼</span></span>
<span class="line"><span>┌─────────────────────────────────────────────┐</span></span>
<span class="line"><span>│             前端层 (React + Vite)             │</span></span>
<span class="line"><span>│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │</span></span>
<span class="line"><span>│  │ 页面组件  │ │ 通用组件  │ │ 状态管理  │     │</span></span>
<span class="line"><span>│  └──────────┘ └──────────┘ └──────────┘     │</span></span>
<span class="line"><span>└──────────────────┬──────────────────────────┘</span></span>
<span class="line"><span>                   │ RESTful API</span></span>
<span class="line"><span>                   ▼</span></span>
<span class="line"><span>┌─────────────────────────────────────────────┐</span></span>
<span class="line"><span>│             后端层 (Express.js)              │</span></span>
<span class="line"><span>│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │</span></span>
<span class="line"><span>│  │ 中间件层  │ │  路由层   │ │ 业务逻辑  │     │</span></span>
<span class="line"><span>│  └──────────┘ └──────────┘ └──────────┘     │</span></span>
<span class="line"><span>└──────────────────┬──────────────────────────┘</span></span>
<span class="line"><span>                   │</span></span>
<span class="line"><span>                   ▼</span></span>
<span class="line"><span>┌─────────────────────────────────────────────┐</span></span>
<span class="line"><span>│           数据层 (Sequelize ORM)             │</span></span>
<span class="line"><span>│        SQLite (开发) / MySQL (生产)          │</span></span>
<span class="line"><span>└─────────────────────────────────────────────┘</span></span></code></pre></div><h2 id="前端架构" tabindex="-1">前端架构 <a class="header-anchor" href="#前端架构" aria-label="Permalink to &quot;前端架构&quot;">​</a></h2><ul><li><strong>框架</strong>: React 18 (18.2.0) + Vite 4 (4.4.9)</li><li><strong>UI</strong>: Ant Design 5 (5.8.6)</li><li><strong>3D</strong>: Three.js (0.183.2) + @react-three/fiber (8.18.0)</li><li><strong>状态管理</strong>: React Context + Zustand</li><li><strong>数据请求</strong>: SWR + Axios</li><li><strong>路由</strong>: React Router 6</li></ul><h3 id="前端项目结构" tabindex="-1">前端项目结构 <a class="header-anchor" href="#前端项目结构" aria-label="Permalink to &quot;前端项目结构&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>frontend/</span></span>
<span class="line"><span>├── public/                    # 静态公共资源</span></span>
<span class="line"><span>│   ├── assets/3d/            # 3D环境贴图</span></span>
<span class="line"><span>│   └── png/                   # 设备图标</span></span>
<span class="line"><span>├── src/</span></span>
<span class="line"><span>│   ├── api/                   # API接口封装</span></span>
<span class="line"><span>│   ├── components/            # React组件库</span></span>
<span class="line"><span>│   │   ├── 3d/               # 3D可视化组件</span></span>
<span class="line"><span>│   │   ├── dashboard/        # 数据看板组件</span></span>
<span class="line"><span>│   │   ├── device/           # 设备管理组件</span></span>
<span class="line"><span>│   │   ├── floorplan/        # 机房平面图组件</span></span>
<span class="line"><span>│   │   ├── rack/             # 机柜组件</span></span>
<span class="line"><span>│   │   └── topology/         # 网络拓扑组件</span></span>
<span class="line"><span>│   ├── config/                # 配置文件</span></span>
<span class="line"><span>│   ├── constants/             # 常量定义</span></span>
<span class="line"><span>│   ├── context/               # React Context（状态管理）</span></span>
<span class="line"><span>│   ├── hooks/                 # 自定义Hooks</span></span>
<span class="line"><span>│   ├── pages/                 # 页面组件</span></span>
<span class="line"><span>│   ├── styles/                # 样式文件</span></span>
<span class="line"><span>│   └── utils/                 # 工具函数</span></span></code></pre></div><h2 id="后端架构" tabindex="-1">后端架构 <a class="header-anchor" href="#后端架构" aria-label="Permalink to &quot;后端架构&quot;">​</a></h2><ul><li><strong>框架</strong>: Express.js (4.18.2)</li><li><strong>ORM</strong>: Sequelize 6 (6.37.8)</li><li><strong>认证</strong>: JWT (jsonwebtoken 9.0.3)</li><li><strong>验证</strong>: Joi</li><li><strong>日志</strong>: Winston</li><li><strong>定时任务</strong>: node-cron</li></ul><h3 id="后端项目结构" tabindex="-1">后端项目结构 <a class="header-anchor" href="#后端项目结构" aria-label="Permalink to &quot;后端项目结构&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>backend/</span></span>
<span class="line"><span>├── config/                    # 配置模块</span></span>
<span class="line"><span>├── middleware/                # 中间件</span></span>
<span class="line"><span>├── models/                    # Sequelize数据模型</span></span>
<span class="line"><span>├── routes/                    # API路由</span></span>
<span class="line"><span>├── scripts/                   # 数据库脚本</span></span>
<span class="line"><span>├── utils/                     # 工具函数</span></span>
<span class="line"><span>├── validation/                # Joi验证Schema</span></span>
<span class="line"><span>├── tests/                     # 测试文件</span></span>
<span class="line"><span>├── server.js                  # 服务入口</span></span>
<span class="line"><span>└── db.js                      # 数据库连接</span></span></code></pre></div><h3 id="中间件链" tabindex="-1">中间件链 <a class="header-anchor" href="#中间件链" aria-label="Permalink to &quot;中间件链&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>请求 → CORS → auth → maintenance → validation → requestLogger → routes → response</span></span></code></pre></div><table tabindex="0"><thead><tr><th>中间件</th><th>功能描述</th></tr></thead><tbody><tr><td><strong>CORS</strong></td><td>跨域资源共享配置，允许前端跨域访问</td></tr><tr><td><strong>authMiddleware</strong></td><td>JWT 令牌验证、用户身份认证、权限校验</td></tr><tr><td><strong>maintenanceMiddleware</strong></td><td>系统维护模式拦截，非管理员无法访问</td></tr><tr><td><strong>validationMiddleware</strong></td><td>使用 Joi 对请求参数进行格式校验</td></tr><tr><td><strong>requestLogger</strong></td><td>HTTP 请求日志记录（方法、路径、状态码、耗时）</td></tr></tbody></table><h3 id="服务初始化流程" tabindex="-1">服务初始化流程 <a class="header-anchor" href="#服务初始化流程" aria-label="Permalink to &quot;服务初始化流程&quot;">​</a></h3><div class="language-javascript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">async</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> function</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> initializeApp</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">  // 1. 数据库同步</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> syncDatabase</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">  // 2. 自定义字段初始化</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> initDeviceFields</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();      </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 初始化设备扩展字段</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> initTicketFields</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();      </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 初始化工单扩展字段</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">  // 3. 数据模型同步</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> syncConsumableModels</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();  </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 同步耗材模型</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> syncInventoryModels</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();   </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 同步盘点模型</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">  // 4. 系统基础数据初始化</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> initDefaultSystemSettings</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(); </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 初始化系统设置</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> initFaultCategories</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();       </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 初始化故障分类</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">  // 5. 定时任务启动</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  await</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> initAutoBackupScheduler</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">();   </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 初始化自动备份调度器</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><h3 id="路由模块" tabindex="-1">路由模块 <a class="header-anchor" href="#路由模块" aria-label="Permalink to &quot;路由模块&quot;">​</a></h3><p>完整的 RESTful API 路由，覆盖所有业务模块：</p><table tabindex="0"><thead><tr><th>路由前缀</th><th>模块</th><th>功能</th></tr></thead><tbody><tr><td><code>/api/auth</code></td><td>认证</td><td>登录、注册、Token 刷新</td></tr><tr><td><code>/api/rooms</code></td><td>机房</td><td>机房 CRUD</td></tr><tr><td><code>/api/racks</code></td><td>机柜</td><td>机柜 CRUD、容量统计</td></tr><tr><td><code>/api/devices</code></td><td>设备</td><td>设备全生命周期 CRUD、批量导入导出</td></tr><tr><td><code>/api/ports</code></td><td>端口</td><td>设备端口配置、网卡绑定</td></tr><tr><td><code>/api/cables</code></td><td>线缆</td><td>线缆连接管理</td></tr><tr><td><code>/api/tickets</code></td><td>工单</td><td>工单全流程 CRUD</td></tr><tr><td><code>/api/consumables</code></td><td>耗材</td><td>耗材库存、领用、SN 追踪</td></tr><tr><td><code>/api/inventory</code></td><td>盘点</td><td>盘点计划、任务、记录</td></tr><tr><td><code>/api/backup</code></td><td>备份</td><td>本地/远程备份管理</td></tr><tr><td><code>/api/users</code></td><td>用户</td><td>用户管理、角色权限</td></tr><tr><td><code>/api/settings</code></td><td>系统设置</td><td>系统参数配置</td></tr><tr><td><code>/api/logs</code></td><td>操作日志</td><td>审计日志查询</td></tr></tbody></table><h2 id="数据模型关系" tabindex="-1">数据模型关系 <a class="header-anchor" href="#数据模型关系" aria-label="Permalink to &quot;数据模型关系&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Room (机房) ──1:N──► Rack (机柜) ──1:N──► Device (设备)</span></span>
<span class="line"><span>                                              │</span></span>
<span class="line"><span>                          ┌────────────────────┼────────────────────┐</span></span>
<span class="line"><span>                          ▼                    ▼                    ▼</span></span>
<span class="line"><span>                    NetworkCard (网卡)    DevicePort (端口)    DeviceField (字段)</span></span>
<span class="line"><span>                          │                    │</span></span>
<span class="line"><span>                          └────────────────────┘</span></span>
<span class="line"><span>                                              │</span></span>
<span class="line"><span>                                              ▼</span></span>
<span class="line"><span>                                          Cable (线缆)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>User (用户) ──N:M──► Role (角色) ──1:N──► Permission (权限)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Consumable (耗材) ──N:1──► ConsumableCategory (耗材分类)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>InventoryPlan (盘点计划) ──1:N──► InventoryTask (盘点任务)</span></span>
<span class="line"><span>                                        │</span></span>
<span class="line"><span>                                        ▼</span></span>
<span class="line"><span>                                  InventoryRecord (盘点记录)</span></span>
<span class="line"><span>                                        │</span></span>
<span class="line"><span>                                        ▼</span></span>
<span class="line"><span>                                  IdleDevice (暂存空闲设备)</span></span></code></pre></div><h3 id="核心模型关系说明" tabindex="-1">核心模型关系说明 <a class="header-anchor" href="#核心模型关系说明" aria-label="Permalink to &quot;核心模型关系说明&quot;">​</a></h3><table tabindex="0"><thead><tr><th>关系</th><th>说明</th></tr></thead><tbody><tr><td>Room → Rack</td><td>一个机房包含多个机柜，<code>Room.roomId</code> → <code>Rack.roomId</code></td></tr><tr><td>Rack → Device</td><td>一个机柜可安装多个设备，<code>Rack.rackId</code> → <code>Device.rackId</code></td></tr><tr><td>Device → NetworkCard</td><td>一个设备可有多块网卡</td></tr><tr><td>Device → DevicePort</td><td>一个设备可有多个端口</td></tr><tr><td>DevicePort + NetworkCard → Cable</td><td>端口和网卡之间通过线缆连接</td></tr><tr><td>User ↔ Role</td><td>多对多关系，一个用户可有多个角色</td></tr><tr><td>ConsumableCategory → Consumable</td><td>一个分类下有多个耗材</td></tr><tr><td>InventoryPlan → Task → Record</td><td>盘点计划分解为任务，任务产生记录</td></tr></tbody></table>`,23)])])}const g=a(p,[["render",e]]);export{k as __pageData,g as default};
