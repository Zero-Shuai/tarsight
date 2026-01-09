# 自动化部署快速设置指南

## 🎯 目标

5 分钟完成 GitHub Actions 自动化部署配置。

---

## ⚡ 快速设置（3 步完成）

### 步骤 1: 配置 GitHub Secrets（2 分钟）

访问：https://github.com/Zero-Shuai/tarsight/settings/secrets/actions

添加 4 个 Secrets：

| 名称 | 值 | 获取方式 |
|------|-----|----------|
| `PRODUCTION_HOST` | `你的服务器IP` | 如：`192.168.1.100` |
| `PRODUCTION_USER` | `SSH用户名` | 如：`root` 或 `ubuntu` |
| `PRODUCTION_SSH_KEY` | `SSH私钥` | 见下方说明 |
| `PRODUCTION_PORT` | `22` | 默认即可 |

#### 如何获取 SSH 私钥？

**在本地执行**：
```bash
# 查看现有私钥（如果有）
cat ~/.ssh/id_ed25519
# 或
cat ~/.ssh/id_rsa

# 如果没有，生成新密钥
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/tarsight_deploy

# 查看新生成的私钥
cat ~/.ssh/tarsight_deploy
```

**复制整个输出**（包括 `-----BEGIN` 和 `-----END` 行），粘贴到 `PRODUCTION_SSH_KEY`。

### 步骤 2: 添加公钥到服务器（2 分钟）

**在服务器上执行**：
```bash
# 1. 创建 .ssh 目录
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 2. 添加公钥（粘贴你刚才生成的公钥）
echo "你的公钥内容（.pub文件的内容）" >> ~/.ssh/authorized_keys

# 3. 设置权限
chmod 600 ~/.ssh/authorized_keys

# 4. 验证
cat ~/.ssh/authorized_keys
```

### 步骤 3: 测试部署（1 分钟）

**推送一个测试提交**：
```bash
cd /Users/zhangshuai/WorkSpace/Tarsight

# 创建测试提交
echo "test" >> test.txt
git add test.txt
git commit -m "test: 测试自动部署"
git push origin master
```

**查看部署进度**：
- 访问：https://github.com/Zero-Shuai/tarsight/actions
- 应该看到 "Deploy to Production" workflow 正在运行

---

## ✅ 验证成功

部署成功后，你会看到：
- ✅ GitHub Actions 显示绿色的勾
- 🟢 生产服务器上的应用已更新

**验证命令**（在服务器上）：
```bash
# 检查容器
docker ps | grep tarsight-frontend

# 查看最新日志
docker compose logs frontend --tail 20
```

---

## 🔧 常见问题

### Q: 我没有 SSH 密钥对，怎么办？

**A**: 生成一个：
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/tarsight_deploy
```

- 私钥：`~/.ssh/tarsight_deploy` → 添加到 GitHub Secrets
- 公钥：`~/.ssh/tarsight_deploy.pub` → 添加到服务器

### Q: SSH 连接失败怎么办？

**A**: 检查以下几点：
1. 服务器 IP 是否正确
2. SSH 服务是否运行：`sudo systemctl status sshd`
3. 防火墙是否开放 22 端口
4. 公钥是否正确添加到 `~/.ssh/authorized_keys`

### Q: 如何禁用自动部署？

**A**: 删除 workflow 文件：
```bash
rm .github/workflows/deploy-production.yml
git add . && git commit -m "chore: 禁用自动部署" && git push
```

---

## 📚 详细文档

需要更多详细信息？查看完整指南：
- [GitHub Actions 自动化部署完整指南](./docs/guides/GITHUB_ACTIONS_DEPLOYMENT.md)

---

## 🎉 完成！

现在每次推送代码到 `master` 分支，都会自动部署到生产服务器！

**工作流程**：
```
你推送代码 → GitHub Actions 自动部署 → 5-10分钟后部署完成
```

**提示**：可以在提交信息中添加 `[no-lint]` 跳过类型检查：
```bash
git commit -m "feat: 新功能 [no-lint]"
```
