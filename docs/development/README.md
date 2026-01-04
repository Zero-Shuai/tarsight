# 开发文档

此目录存放开发过程中的日志、设计文档和实现记录。

## 📁 目录结构

```
development/
├── README.md                    # 本文件
├── logs/                        # 每日开发日志
│   └── DAILY_LOG_2026-01-04.md  # 2026-01-04 开发日志
├── FRONTEND_UPDATE.md           # 前端更新记录
├── FINAL_UPDATE.md              # 最终更新说明
├── RESPONSE_BODY_LAYOUT.md      # Response Body 布局设计
├── RESPONSE_BODY_FINAL.md       # Response Body 最终规范
└── VALIDATION_BASED_HIGHLIGHT.md # 基于验证规则的标红（已废弃）
```

## 📝 文档说明

### 每日开发日志 (logs/)
- **命名格式**: `DAILY_LOG_YYYY-MM-DD.md`
- **内容**: 当天完成的工作、遇到的问题、解决方案、待办事项
- **用途**: 记录开发过程，方便后续回顾和 AI 上下文恢复

### 实现文档
- **FRONTEND_UPDATE.md**: 前端优化的完整历史记录
- **FINAL_UPDATE.md**: 功能实现的最终总结
- **RESPONSE_BODY_*.md**: Response Body 展示的设计和实现

### 废弃方案记录
- **VALIDATION_BASED_HIGHLIGHT.md**: 记录尝试过但最终放弃的方案
- **保留原因**: 了解设计决策的演变过程，避免重复尝试

## 💡 使用建议

### 对于新的 AI 对话
在新对话开始时，告诉 AI：
```
请先阅读以下文件了解项目上下文：
- docs/development/logs/DAILY_LOG_YYYY-MM-DD.md（最新的开发日志）
- docs/INDEX.md（文档索引）
```

### 对于开发者
1. **每日更新**: 每天结束时更新或创建当日的日志文件
2. **问题记录**: 遇到问题时详细记录问题和解决方案
3. **决策记录**: 重要设计决策要记录原因和考虑因素
4. **定期整理**: 定期清理过期的临时文档，归档到相应目录

## 🔄 与 AI 的记忆管理

### 方法 1: 创建项目知识库
在项目根目录创建 `PROJECT_KNOWLEDGE.md`，记录：
- 项目架构
- 关键设计决策
- 常见问题和解决方案
- 代码规范和约定

### 方法 2: 每日日志
如本文档结构，每天记录开发日志，包含：
- 完成的工作
- 遇到的问题和解决方案
- 重要的设计决策
- 待办事项

### 方法 3: 详细的提交信息
Git 提交时包含详细的变更说明，AI 可以通过 `git log` 查看历史。

## 📚 相关文档

- [../INDEX.md](../INDEX.md) - 文档总索引
- [../architecture/](../architecture/) - 架构文档
- [../troubleshooting/](../troubleshooting/) - 故障排查
