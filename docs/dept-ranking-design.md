## 部门层级排行榜设计

### 新增后端接口

#### 1. Model: `backend/internal/model/department_ranking.go`

```go
package model

// DeptRankingItem 部门排行项
type DeptRankingItem struct {
    DeptName        string  `json:"dept_name"`         // 部门名称
    DeptLevel       string  `json:"dept_level"`        // 层级: level1/level2/level3/level4
    MemberCount     int64   `json:"member_count"`      // 该部门人数
    AvgSiliconPct   float64 `json:"avg_silicon_pct"`   // 平均硅含量%
    TotalAILines    int64   `json:"total_ai_lines"`    // 总AI代码行数
    TotalLines      int64   `json:"total_lines"`       // 总代码行数
    AvgDailyTokens  int64   `json:"avg_daily_tokens"`  // 平均日均Token
    TotalTokens     int64   `json:"total_tokens"`      // 总Token
    TotalCost       float64 `json:"total_cost"`        // 总费用
    Rank            int     `json:"rank"`              // 排名
}

// DeptRankingRequest 请求参数
type DeptRankingRequest struct {
    Level      string     `form:"level" binding:"required,oneof=level1 level2 level3 level4"` // 部门层级
    Metric     string     `form:"metric" binding:"required,oneof=silicon token"`            // 指标类型
    StartDate  *time.Time `form:"start_date"`                                                // 开始日期
    EndDate    *time.Time `form:"end_date"`                                                  // 结束日期
    Limit      int        `form:"limit,default=10"`                                          // Top N
}
```

#### 2. Repository: SQL JOIN 查询

核心 SQL 思路：
```sql
-- 硅含量按部门聚合
SELECT 
    dm.level2_dept AS dept_name,
    COUNT(DISTINCT dm.username) AS member_count,
    COALESCE(AVG(user_silicon.silicon_pct), 0) AS avg_silicon_pct,
    COALESCE(SUM(user_silicon.ai_lines), 0) AS total_ai_lines,
    COALESCE(SUM(user_silicon.total_lines), 0) AS total_lines
FROM department_members dm
LEFT JOIN (
    SELECT 
        username,
        CASE WHEN SUM(total_lines) > 0 THEN SUM(ai_lines)::float / SUM(total_lines) * 100 ELSE 0 END AS silicon_pct,
        SUM(ai_lines) AS ai_lines,
        SUM(total_lines) AS total_lines
    FROM silicon_contents
    WHERE date BETWEEN $1 AND $2
    GROUP BY username
) user_silicon ON dm.username = user_silicon.username
WHERE dm.level2_dept IS NOT NULL
GROUP BY dm.level2_dept
ORDER BY avg_silicon_pct DESC
LIMIT $3;

-- Token 按部门聚合（类似结构，JOIN token_usages）
```

#### 3. Handler Route: `GET /api/v1/department-rankings`

### 新增前端组件

#### `src/sections/DeptRankingChart.tsx`

- 使用 Recharts 的 `<BarChart>` 横向布局（`layout="vertical"`）
- 顶部 Tab 切换：一级/二级/三级/四级
- 左右两个图表卡片：PR硅含量排行 + Token日均排行
- 数据为空时显示占位

### 页面集成

在 `App.tsx` Dashboard 下方新增区域：
```tsx
{/* 部门层级排行榜 */}
<div style={{ gridColumn: '1 / 4', gridRow: '2 / 3' }}>
  <DeptRankingChart dateRange={dateRange} />
</div>
```

调整 grid 布局为 2 行。
