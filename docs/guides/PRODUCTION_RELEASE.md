# 生产发版说明

## 原则

- `master` 只代表集成代码，不代表自动上线。
- 生产发布必须显式触发，不能跟随普通功能提交自动发生。
- 总结性文档、计划、复盘类文件不得成为生产发布的触发条件。

## 当前生产发布入口

### 方式一：手动发布

GitHub -> Actions -> `Deploy to Production` -> `Run workflow`

`git_ref` 可填写：
- `master`
- 某个 commit SHA
- 某个 tag，例如 `v1.0.0`

### 方式二：tag 发布

推送 `v*` tag 后，会触发生产发布。

示例：

```bash
bash scripts/create-release-tag.sh 1.0.0
```

## 推荐发布流程

1. 在本地完成开发和验证。
2. 更新仓库内的业务版本号，例如：

```bash
bash scripts/set-release-version.sh 1.0
```

3. 确认发布 tag 版本号，例如 `1.0.0`。
4. 创建并推送 tag：

```bash
bash scripts/create-release-tag.sh 1.0.0
```

5. 等待 GitHub Actions 完成生产发布。
6. 发布后验证：

```bash
curl http://test.shuai.click/healthz
curl http://test.shuai.click/api/version
curl http://test.shuai.click/api/status
```

## 当前版本字段约定

- `APP_RELEASE_VERSION`: 对外业务版本，例如 `1.0`
- `APP_REVISION`: 当前代码修订，通常为 git 短 SHA
- `APP_RELEASE_TAG`: 正式发布标签，例如 `v1.0.0`
- `APP_DEPLOYED_AT`: 部署时间

其中：

- `RELEASE_VERSION` 文件是仓库内受控的业务版本源
- 生产部署时默认优先读取 `RELEASE_VERSION`
- 线上 `.env` 不再作为主要版本来源

## 常用命令

### 手动服务器发布指定版本

```bash
cd /opt/tarsight
bash scripts/auto-deploy.sh --ref <commit-or-tag>
```

### 查看当前线上版本

```bash
curl http://127.0.0.1:25380/api/version
```

### 查看线上状态

```bash
curl http://127.0.0.1:25380/api/status
```

### 健康检查

```bash
cd /opt/tarsight
bash scripts/health-check.sh
```

## 禁止事项

- 不要把普通 `push master` 当成生产发布。
- 不要在未验证的情况下直接发布新功能到生产。
- 不要让总结性文档触发生产发布。
