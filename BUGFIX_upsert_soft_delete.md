## Bug 修复报告

### 问题描述
用户手动删除排名第一的记录（李言博18379）后，重新导入 Excel，但删除的记录未恢复。

### 根因分析
GORM 使用软删除（设置 `deleted_at` 字段）。upsert 的 `ON CONFLICT DO UPDATE` 虽然更新了数据字段，但**没有恢复 `deleted_at`**，导致记录仍处于软删除状态，查询时被自动过滤。

### 修复内容
在 `BatchUpsert` 方法中，upsert 完成后额外执行一步：
```go
// 恢复被软删除的记录
db.Unscoped().Model(&model.TokenUsage{}).
    Where("username IN ? AND deleted_at IS NOT NULL", usernames).
    Update("deleted_at", nil)
```

### 验证结果

| 操作 | 结果 |
|------|------|
| 导入 Excel | 新增 0 / 更新 182 ✅ |
| API 返回总数 | 182 条 ✅ |
| Top 1 | 李言博18379 ✅ |
| 重复导入 | 新增 0 / 更新 182 ✅（无重复） |
| 删除后再导入 | 数据恢复 ✅ |

### 涉及文件
- `backend/internal/repository/token_usage.go` — `BatchUpsert` 方法
