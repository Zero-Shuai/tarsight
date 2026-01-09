# Tarsight Dashboard

一个现代化的测试用例管理和执行平台的前端界面，使用 Next.js 14 和 Supabase 构建。

## 特性

- 📊 **项目概览** - 查看项目统计和模块分布
- 📋 **测试用例管理** - 浏览和管理所有测试用例
- 📈 **执行历史** - 查看测试执行历史记录
- 🎨 **现代化 UI** - 使用 TailwindCSS 设计的美观界面
- 🚀 **快速响应** - 基于 Next.js App Router 的服务端渲染

## 技术栈

- **框架**: Next.js 14 (App Router)
- **UI**: React 18, TailwindCSS
- **数据库**: Supabase (PostgreSQL)
- **语言**: TypeScript
- **图表**: Recharts

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 2. 配置环境变量

复制环境变量模板并填入你的 Supabase 配置:

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PROJECT_ID=your_project_id
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
tarsight-dashboard/
├── app/                      # Next.js App Router
│   ├── page.tsx             # 首页 (项目概览)
│   ├── test-cases/          # 测试用例页面
│   ├── executions/          # 执行历史页面
│   ├── analytics/           # 统计报表页面
│   ├── layout.tsx           # 根布局
│   └── globals.css          # 全局样式
├── components/              # React 组件
│   ├── sidebar.tsx          # 侧边栏导航
│   └── ui/                  # UI 组件库
│       ├── card.tsx
│       ├── badge.tsx
│       └── ...
├── lib/                     # 工具函数和配置
│   ├── supabase/            # Supabase 客户端
│   │   └── client.ts
│   └── utils.ts             # 工具函数
└── public/                  # 静态资源
```

## 功能说明

### 项目概览
- 显示项目基本信息
- 统计测试用例总数、模块数、执行次数
- 展示模块分布和最近执行记录

### 测试用例管理
- 按模块分组展示测试用例
- 显示用例详情（ID、名称、URL、方法等）
- 支持查看用例标签和状态

### 执行历史
- 展示所有测试执行记录
- 显示每次执行的统计信息（通过/失败/跳过）
- 计算通过率和执行时长

### 统计报表
- 测试趋势图表
- 模块覆盖度分析
- 执行成功率统计

## 开发建议

### 添加新功能

1. 在 `app/` 目录下创建新页面
2. 在 `lib/supabase/client.ts` 中添加 API 函数
3. 在 `components/ui/` 中添加可复用组件

### 样式自定义

修改 `tailwind.config.ts` 中的主题配置:

```typescript
theme: {
  extend: {
    colors: {
      primary: 'hsl(...)',  // 主色调
      // ...
    }
  }
}
```

## 部署

### Vercel

```bash
vercel deploy
```

### Docker

```bash
docker build -t tarsight-dashboard .
docker run -p 3000:3000 tarsight-dashboard
```

## 常见问题

### 环境变量未生效
确保 `.env.local` 文件在项目根目录，并重启开发服务器。

### Supabase 连接失败
1. 检查 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确
2. 确认 Supabase 项目的 RLS 策略允许访问
3. 检查网络连接和防火墙设置

## 许可证

MIT
