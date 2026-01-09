# ⚠️ 已废弃 - 请使用 supabase/migrations/

> **重要**: 此目录已废弃，所有数据库迁移已统一到项目根目录的 `supabase/migrations/`。

## 新位置

👉 **统一迁移目录**: [`/supabase/migrations/`](../../../supabase/migrations/)

## 详细文档

请参阅：[数据库迁移管理指南](../../../docs/database-migrations-guide.md)

## 迁移原因

1. **统一管理**: Supabase CLI 标准目录
2. **前后端一致**: 前后端使用同一迁移源
3. **更好工具支持**: Supabase Dashboard 可视化

## 本目录保留原因

此目录保留用于向后兼容，但**不应再添加新的迁移文件**。

所有新迁移请添加到 `supabase/migrations/` 目录。

---

**最后更新**: 2025-01-09
**状态**: ⚠️ 已废弃
