# Tarsight 目录结构重构计划

## 当前问题

1. **根目录文档过多**：多个 MD 文档散落在根目录
2. **目录命名不一致**：`tarsight-dashboard` 和 `supabase_version` 不够直观
3. **Python 后端位置混乱**：测试执行逻辑分散
4. **文档分散**：根目录、`docs/`、子项目 `docs/` 都有文档

## 新目录结构

```
tarsight/
├── README.md                          # 项目主 README（保留）
├── CLAUDE.md                          # Claude AI 开发指南（保留）
├── docker-compose.yml                 # Docker 编排配置（保留）
├── .github/                           # GitHub 配置（保留）
│   └── workflows/
├── docs/                              # 📚 统一文档目录
│   ├── INDEX.md                       # 文档索引
│   ├── architecture.md                # 架构文档
│   ├── api.md                         # API 文档
│   ├── coding-standards.md            # 编码规范
│   ├── commands.md                    # 常用命令
│   ├── configuration.md               # 配置指南
│   ├── deployment.md                  # 部署文档
│   ├── troubleshooting.md             # 故障排查
│   ├── guides/                        # 指南文档
│   │   ├── assertions-guide.md
│   │   └── ...
│   ├── lessons-learned/               # 经验教训
│   │   └── assertion-system-integration.md
│   └── archive/                       # 归档文档
│       ├── MIGRATION_GUIDE.md
│       └── ...
├── frontend/                          # 🎨 Next.js 前端（原 tarsight-dashboard）
│   ├── README.md
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── deployment/
│       └── Dockerfile
├── backend/                           # 🐍 Python 后端（原 supabase_version）
│   ├── README.md
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── run.py                         # 入口文件
│   ├── config.py                      # 配置文件
│   ├── database/                      # 数据库相关
│   │   └── migrations/
│   ├── testcases/                     # 测试用例逻辑
│   ├── utils/                         # 工具函数
│   ├── scripts/                       # 脚本工具
│   ├── reports/                       # 测试报告
│   └── Dockerfile
├── supabase/                          # 🗄️  Supabase 配置（保留）
│   └── migrations/
├── scripts/                           # 🔧 项目级脚本（保留）
│   ├── auto-deploy.sh
│   ├── health-check.sh
│   ├── update-production.sh
│   └── setup_python_env.sh
└── DEPRECATED.md                      # 废弃组件文档（保留）

## 迁移步骤

### Phase 1: 创建新结构
- [ ] 创建 `frontend/` 目录
- [ ] 创建 `backend/` 目录
- [ ] 整理 `docs/` 目录

### Phase 2: 迁移前端
- [ ] 移动 `tarsight-dashboard/` → `frontend/`
- [ ] 更新 `frontend/` 内部引用路径
- [ ] 更新 `docker-compose.yml` 前端路径

### Phase 3: 迁移后端
- [ ] 移动 `supabase_version/` → `backend/`
- [ ] 更新 `backend/` 内部引用路径
- [ ] 更新 `docker-compose.yml` 后端路径
- [ ] 更新前端 API 调用路径（如果需要）

### Phase 4: 整理文档
- [ ] 移动根目录 MD 文件到 `docs/archive/`
- [ ] 删除子项目中的冗余文档
- [ ] 更新所有文档中的路径引用

### Phase 5: 更新配置
- [ ] 更新 `.github/workflows/deploy-production.yml`
- [ ] 更新 `docker-compose.yml`
- [ ] 更新 `scripts/` 中的路径引用
- [ ] 更新 `README.md` 中的路径说明

### Phase 6: 验证测试
- [ ] 本地启动前端
- [ ] 本地启动后端
- [ ] 运行测试用例
- [ ] 验证 Docker 构建
- [ ] 验证部署流程

## 关键变更点

### 1. Docker Compose
```yaml
# Before
frontend:
  build:
    context: .
    dockerfile: tarsight-dashboard/deployment/Dockerfile

# After
frontend:
  build:
    context: .
    dockerfile: frontend/deployment/Dockerfile
```

### 2. GitHub Actions
```yaml
# Before
- cd tarsight-dashboard && npm run build

# After
- cd frontend && npm run build
```

### 3. 文档引用
```markdown
# Before
参见 tarsight-dashboard/README.md

# After
参见 frontend/README.md
```

### 4. 脚本路径
```bash
# Before
cd tarsight-dashboard && npm run dev

# After
cd frontend && npm run dev
```

## 注意事项

1. **Git 历史**：使用 `git mv` 保留文件历史
2. **环境变量**：检查所有 `.env` 文件中的路径引用
3. **绝对路径**：搜索代码中的硬编码路径并更新
4. **CI/CD**：确保 GitHub Actions 工作流正常
5. **依赖关系**：检查前后端之间的依赖引用

## 预期收益

✅ 清晰的项目结构
✅ 直观的目录命名
✅ 集中的文档管理
✅ 简化的部署流程
✅ 更好的可维护性
