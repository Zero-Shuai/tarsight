# 已知问题及解决方案 (Known Issues & Solutions)

**最后更新**: 2026-01-05
**版本**: 1.0

本文档记录了开发和使用过程中遇到的已知问题及其解决方案，帮助快速定位和修复问题。

---

## 🔴 TypeScript 构建错误

### 问题 1: Button Variant 类型错误

#### 错误信息
```
Type '"destructive"' is not assignable to type '"default" | "outline" | "ghost" | undefined'
```

#### 位置
- **文件**: `tarsight-dashboard/components/queue-config-form.tsx:292`

#### 原因
shadcn/ui 的 Button 组件不支持 `variant="destructive"` 属性。

#### 解决方案
```tsx
// ❌ 错误写法
<Button variant="destructive" size="sm" onClick={handleResetQueue}>

// ✅ 正确写法
<Button
  variant="outline"
  size="sm"
  onClick={handleResetQueue}
  className="text-red-600 hover:text-red-700 hover:bg-red-50"
>
```

**影响范围**: 队列配置页面的"重置状态"按钮

---

### 问题 2: 变量类型推断错误

#### 错误信息
```
Type error: Type 'boolean' is not assignable to type 'string'
```

#### 位置
- **文件**: `tarsight-dashboard/components/test-case-form.tsx:122`

#### 原因
TypeScript 从初始赋值推断 `parsedValue` 为 `string` 类型，但后续代码尝试赋值 `boolean` 或 `number`。

#### 解决方案
```tsx
// ❌ 错误写法
let parsedValue = newValidationRule.value
if (parsedValue === 'true') parsedValue = true  // 类型错误

// ✅ 正确写法
let parsedValue: string | boolean | number = newValidationRule.value
if (parsedValue === 'true') parsedValue = true  // 正确
else if (parsedValue === 'false') parsedValue = false
else if (!isNaN(Number(parsedValue))) parsedValue = Number(parsedValue)
```

#### 临时绕过方法
如果无法立即修复类型错误，可以禁用类型检查：

**方法1**: 修改 `package.json`
```json
{
  "scripts": {
    "build": "next build --no-lint"
  }
}
```

**方法2**: 使用更新脚本
```bash
sudo bash scripts/update-production.sh --no-lint
```

**注意**: 这只是临时方案，应该尽快修复类型错误。

---

## 🟡 Alpine Linux 兼容性问题

### 问题: spawn /bin/bash ENOENT 错误（严重）

#### 错误信息
```
Error: spawn /bin/bash ENOENT
Exit code: -2
```

#### 位置
- **文件**: `tarsight-dashboard/lib/test-execution-queue.ts:260`
- **函数**: `execute()` 方法

#### 错误日志示例
```
tarsight-frontend  |   path: '/bin/bash',
tarsight-frontend  |   spawnargs: ['-c', 'cd /app/python && python3 ...'],
tarsight-frontend  | }
tarsight-frontend  | error: 'spawn /bin/bash ENOENT',
tarsight-frontend  | executionId: '47f63472-aca3-48d0-b240-8b0a37a61a13'
```

#### 原因
1. Docker 容器使用 **Alpine Linux** (`node:20-alpine`)
2. Alpine Linux 默认**只有 `/bin/sh`**，**没有** `/bin/bash`
3. 代码尝试 spawn `/bin/bash`，导致 `ENOENT` (No such file or directory) 错误

#### 解决方案
```typescript
// ❌ 错误写法
const child = spawn('/bin/bash', ['-c', command], {
  env: { ...process.env, EXECUTION_ID: executionId }
})

// ✅ 正确写法
const child = spawn('/bin/sh', ['-c', command], {
  env: { ...process.env, EXECUTION_ID: executionId }
})
```

**文件**: `tarsight-dashboard/lib/test-execution-queue.ts:260`

#### 验证修复
```bash
# 1. 检查 /bin/sh 是否存在
docker compose exec frontend which /bin/sh
# 应该输出: /bin/sh

# 2. 检查 Python 是否安装
docker compose exec frontend python3 --version
# 应该输出类似: Python 3.12.x

# 3. 测试手动执行
docker compose exec frontend /bin/sh -c "cd /app/python && python3 -c 'print(\"test\")'"
# 应该输出: test

# 4. 运行健康检查
bash scripts/health-check.sh
```

#### 影响
- **严重程度**: 🔴 **CRITICAL** - 导致测试执行功能完全失效
- **影响范围**: 所有通过前端触发的测试执行
- **修复优先级**: **最高**

#### 检查清单
- [x] 代码中使用 `/bin/sh` 而不是 `/bin/bash`
- [x] Dockerfile 中安装了 Python 3
- [x] 环境变量正确传递
- [x] 健康检查脚本包含 Alpine 兼容性检查

---

## 🔧 Docker 构建优化

### 问题 1: 构建缓存导致旧代码被打包

#### 症状
修改代码后重新构建，但容器中运行的仍是旧代码。

#### 解决方案
```bash
# 清理缓存并重新构建
docker compose build --no-cache frontend

# 或清理所有Docker缓存
docker system prune -a
docker compose build frontend
```

#### 预防措施
- 每次修改代码后使用 `--no-cache` 标志
- 定期运行 `docker system prune` 清理未使用的镜像

---

### 问题 2: 构建时间过长

#### 正常构建时间
- **首次构建**: 5-8 分钟
- **有缓存构建**: 2-3 分钟
- **无缓存构建**: 5-8 分钟

#### 如果构建时间超过10分钟
可能原因：
1. 网络速度慢（下载依赖）
2. Docker 内存不足
3. 构建缓存损坏

#### 解决方案
```bash
# 1. 检查Docker资源
docker system df

# 2. 清理缓存
docker system prune -a

# 3. 增加Docker内存限制（如需要）
# 编辑 /etc/docker/daemon.json
# {
#   "default-runtime-memory": "2g"
# }

# 4. 重启Docker
sudo systemctl restart docker
```

---

## 📋 部署前检查清单

在部署到生产环境前，请确认以下事项：

### TypeScript 类型检查
- [ ] 运行 `npx tsc --noEmit` 检查类型错误
- [ ] 修复所有类型错误，或使用 `--no-lint` 标志
- [ ] 本地构建成功：`npm run build`

### Alpine Linux 兼容性
- [ ] **必须使用 `/bin/sh`，绝对不能使用 `/bin/bash`**
- [ ] 使用 `grep -r "/bin/bash"` 检查代码
- [ ] 确认 `lib/test-execution-queue.ts` 使用 `/bin/sh`

### 功能测试
- [ ] 前端页面正常加载
- [ ] 登录功能正常
- [ ] 项目列表显示正常
- [ ] **测试执行功能正常**（最重要）
- [ ] 没有控制台错误

### 环境配置
- [ ] `.env` 文件配置正确
- [ ] Supabase 凭证信息有效
- [ ] API Token 未过期
- [ ] Docker 有足够磁盘空间（>5GB）

---

## 🚨 快速修复指南

### 场景 1: Docker 构建失败（TypeScript 错误）

```bash
# 1. 查看错误日志
docker compose logs frontend --tail 100 | grep -i error

# 2. 记录错误信息

# 3. 回退到已知良好版本
git reset --hard HEAD~1

# 4. 使用 --no-lint 标志重新构建
cd tarsight-dashboard
# 修改 package.json: "build": "next build --no-lint"
cd ..
docker compose up -d --build

# 5. 记录问题到本文档
```

---

### 场景 2: 测试执行失败（spawn ENOENT）

```bash
# 1. 确认问题
docker compose logs frontend | grep "spawn.*ENOENT"

# 2. 检查代码
grep -r "/bin/bash" tarsight-dashboard/lib/

# 3. 如果发现 /bin/bash，立即修复
sed -i 's|/bin/bash|/bin/sh|g' tarsight-dashboard/lib/test-execution-queue.ts

# 4. 提交并推送修复
git add tarsight-dashboard/lib/test-execution-queue.ts
git commit -m "fix: 修复Alpine兼容性，使用/bin/sh"
git push origin master

# 5. 在服务器上更新
cd /opt/tarsight
git pull origin master
docker compose up -d --build

# 6. 验证修复
docker compose logs frontend | grep -i error
# 在应用中尝试执行测试
```

---

### 场景 3: 容器启动但无法访问

```bash
# 1. 检查容器状态
docker ps | grep tarsight

# 2. 检查端口监听
netstat -tulpn | grep 3000

# 3. 检查日志
docker compose logs frontend --tail 50

# 4. 进入容器检查
docker compose exec frontend sh
ls -la /app
ps aux

# 5. 如果需要，重启容器
docker compose restart frontend
```

---

## 📊 问题统计

| 问题 | 严重程度 | 状态 | 修复日期 |
|------|---------|------|---------|
| Button variant 类型错误 | 🟡 中 | ✅ 已修复 | 2026-01-05 |
| 变量类型推断错误 | 🟡 中 | ✅ 已修复 | 2026-01-05 |
| spawn /bin/bash ENOENT | 🔴 严重 | ✅ 已修复 | 2026-01-05 |
| Docker 构建缓存 | 🟢 低 | ✅ 已解决 | 2026-01-05 |

---

## 🔍 问题诊断工具

### 健康检查脚本
```bash
# 运行完整健康检查
bash scripts/health-check.sh --verbose

# 检查项包括：
# - Docker 服务状态
# - 容器运行状态
# - Alpine 兼容性（/bin/sh, Python3）
# - 端口监听
# - HTTP 响应
# - 错误日志
# - 资源使用
# - 磁盘空间
```

### TypeScript 类型检查
```bash
cd tarsight-dashboard

# 检查类型错误
npx tsc --noEmit

# 显示所有错误
npx tsc --noEmit --pretty
```

### Docker 诊断
```bash
# 查看容器详细信息
docker inspect tarsight-frontend

# 查看资源使用
docker stats tarsight-frontend

# 查看磁盘使用
docker system df

# 查看构建历史
docker images tarsight-frontend
```

---

## 📚 相关文档

- **部署指南**: `docs/guides/PRODUCTION_UPDATE_GUIDE.md`
- **Docker部署**: `docs/guides/DOCKER_FULL_STACK_DEPLOYMENT.md`
- **故障排查**: `docs/troubleshooting/INDEX.md`
- **脚本说明**: `scripts/update-production.sh` 和 `scripts/health-check.sh`

---

## 💡 最佳实践

### 代码编写
1. **永远使用 `/bin/sh`** 而不是 `/bin/bash`（Alpine兼容）
2. **显式声明复杂类型**，避免类型推断错误
3. **使用 shadcn/ui 组件时检查支持的属性**
4. **定期运行类型检查**，不要等到构建时才发现错误

### 部署流程
1. **先在本地测试构建**：`npm run build`
2. **运行健康检查**：`bash scripts/health-check.sh`
3. **使用自动化脚本更新**：`sudo bash scripts/update-production.sh`
4. **验证核心功能**：测试执行、API调用等
5. **监控日志**：`docker compose logs -f frontend`

### 问题预防
1. **添加 `.sh` 可执行文件到 PATH**（如果需要）
2. **使用 TypeScript 严格模式**，尽早发现类型错误
3. **编写单元测试**覆盖关键功能
4. **定期更新依赖**，修复已知问题
5. **记录新问题到本文档**，防止重复遇到

---

## 🔄 文档维护

### 更新记录
- **2026-01-05**: 初始版本，记录 TypeScript 和 Alpine 兼容性问题

### 如何添加新问题
当遇到新问题时，请按以下格式添加到本文档：

```markdown
### 问题 X: [简短标题]

#### 错误信息
```
[错误信息]
```

#### 位置
- **文件**: `path/to/file:line`

#### 原因
[问题原因]

#### 解决方案
```bash/tsx/js/python
[解决方案代码]
```

#### 影响
- 严重程度: 🟢低 / 🟡中 / 🔴严重
- 影响范围: [受影响的功能]
```

---

**文档维护**: 当问题修复或发现新问题时，及时更新本文档。
