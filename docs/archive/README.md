# 文档存档

此目录存放历史文档和工具，保留供参考。

## 目录结构

```
archive/
├── backups/              # 备份文件
│   ├── README.md.bak
│   ├── run.py.bak
│   ├── .env.bak
│   └── page.tsx.bak
├── verify_optimization.sh # 优化验证脚本
└── README.md             # 本文件
```

## 使用说明

### 恢复备份文件

如果需要查看或恢复备份文件：

```bash
cd docs/archive/backups
ls -la
```

### 运行验证脚本

验证项目优化是否完整：

```bash
cd docs/archive
bash verify_optimization.sh
```

## 注意

- 这些文件仅供参考
- 不应在生产环境中使用
- 可以根据需要删除
