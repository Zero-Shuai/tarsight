# Tarsight Dashboard - 项目概览

## ✨ 已完成功能

### 1. 项目结构 ✅
- Next.js 14 App Router 架构
- TypeScript 类型安全
- TailwindCSS 样式系统
- 模块化组件设计

### 2. Supabase 集成 ✅
- 客户端配置完成
- API 函数封装
- 类型定义完整
- 环境变量管理

### 3. 核心页面 ✅

#### 首页 - 项目概览
- 📊 统计卡片 (测试用例数、执行次数、通过率、模块数)
- 📈 模块分布可视化 (进度条展示)
- 🕐 最近执行记录 (最近 5 次执行)

#### 测试用例列表
- 📋 按模块分组展示
- 🔍 详细的用例信息 (ID、名称、URL、方法)
- 🏷️ 标签系统
- ✅ 活跃状态标识

#### 执行历史
- 📅 完整执行记录列表
- 📊 每次执行的详细统计
- 🎯 通过率计算
- ⏱️ 执行时长显示

### 4. UI 组件库 ✅
- Card 组件
- Badge 组件
- Sidebar 导航
- 响应式布局

### 5. 工具函数 ✅
- `cn()` - className 合并
- `formatDate()` - 日期格式化
- `formatDuration()` - 时长格式化
- `getStatusColor()` - 状态颜色
- `getStatusText()` - 状态文本

## 🎨 设计特点

### 现代化界面
- 简洁清爽的卡片式布局
- 柔和的配色方案
- 优雅的过渡动画
- 响应式设计 (支持移动端)

### 良好的用户体验
- 清晰的信息层级
- 直观的数据可视化
- 快速的页面加载 (SSR)
- 友好的错误处理

## 📁 项目文件结构

```
tarsight-dashboard/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页 (概览)
│   ├── test-cases/
│   │   └── page.tsx              # 测试用例列表
│   ├── executions/
│   │   └── page.tsx              # 执行历史
│   ├── layout.tsx                # 根布局
│   └── globals.css               # 全局样式
│
├── components/                   # React 组件
│   ├── sidebar.tsx               # 侧边栏导航
│   └── ui/                       # UI 组件库
│       ├── card.tsx              # 卡片组件
│       └── badge.tsx             # 徽章组件
│
├── lib/                          # 工具库
│   ├── supabase/
│   │   └── client.ts             # Supabase 客户端 + API
│   └── utils.ts                  # 工具函数
│
├── public/                       # 静态资源
├── package.json                  # 依赖配置
├── tsconfig.json                 # TypeScript 配置
├── tailwind.config.ts            # TailwindCSS 配置
├── next.config.js                # Next.js 配置
├── .env.local.example            # 环境变量模板
├── setup.sh                      # 快速启动脚本
└── README.md                     # 项目文档
```

## 🚀 快速开始

### 方法 1: 使用启动脚本 (推荐)

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/tarsight-dashboard
./setup.sh
```

脚本会自动:
1. 创建 `.env.local` 文件
2. 从父项目读取 Supabase 配置
3. 安装依赖
4. 启动开发服务器

### 方法 2: 手动配置

```bash
# 1. 进入项目目录
cd /Users/zhangshuai/WorkSpace/Tarsight/tarsight-dashboard

# 2. 复制环境变量模板
cp .env.local.example .env.local

# 3. 编辑 .env.local，填入配置
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
# NEXT_PUBLIC_PROJECT_ID=your_project_id

# 4. 安装依赖
npm install

# 5. 启动开发服务器
npm run dev
```

## 📊 数据流

```
Supabase Database
    ↓
lib/supabase/client.ts (API 层)
    ↓
app/page.tsx (数据获取 - Server Components)
    ↓
UI Components (展示层)
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGc...` |
| `NEXT_PUBLIC_PROJECT_ID` | Tarsight 项目 ID | `8786c21f-7437-4a2d...` |

### Supabase 权限配置

确保 Supabase 的 Row Level Security (RLS) 策略允许:
- `SELECT` on `projects`, `modules`, `test_cases`, `test_executions`, `test_results`

## 📝 待开发功能

### 统计报表页面
- 测试趋势图
- 模块覆盖度分析
- 失败用例 Top 10
- 性能趋势图

### 高级功能
- 测试用例详情页
- 执行详情页 (查看具体失败原因)
- 实时执行状态更新
- 导出报表 (PDF/Excel)
- 测试用例搜索和过滤
- 标签管理

### 管理功能
- 创建/编辑测试用例
- 手动触发测试执行
- 执行历史对比
- 失败用例重试

## 🎯 技术亮点

### 1. Server Components
- 使用 Next.js 14 的 App Router
- 服务端数据获取，更快的首屏加载
- 减少客户端 JavaScript 体积

### 2. TypeScript 全覆盖
- 完整的类型定义
- 编译时类型检查
- 更好的开发体验

### 3. 模块化设计
- 清晰的代码组织
- 可复用的组件库
- 易于维护和扩展

### 4. 响应式设计
- 支持桌面、平板、手机
- 移动端友好的侧边栏
- 灵活的网格布局

## 🐛 已知问题

### clsx 依赖缺失
**问题**: 项目中使用了 `clsx` 但未在依赖中
**解决**: 在 `package.json` 中已包含，安装时自动处理

### class-variance-authority
**问题**: Badge 组件使用了 CVA 但未在依赖中
**解决**: 已在 `package.json` 中添加

## 💡 优化建议

### 性能优化
1. 添加数据缓存策略
2. 实现增量静态再生成 (ISR)
3. 图片懒加载
4. 代码分割

### 功能增强
1. 添加暗黑模式切换
2. 实现实时数据更新 (WebSocket)
3. 添加数据导出功能
4. 支持多项目管理

## 📞 支持

如有问题，请查看:
- Next.js 文档: https://nextjs.org/docs
- Supabase 文档: https://supabase.com/docs
- TailwindCSS 文档: https://tailwindcss.com/docs
