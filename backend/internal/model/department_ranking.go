package model

// DeptRankingItem 部门排行项
type DeptRankingItem struct {
	DeptName       string  `json:"dept_name"`        // 部门名称
	DeptLevel      string  `json:"dept_level"`       // 层级: level1/level2/level3/level4
	MemberCount    int64   `json:"member_count"`     // 该部门在表中有记录的人数
	AvgSiliconPct  float64 `json:"avg_silicon_pct"`  // 平均硅含量%（有数据的成员平均值）
	TotalAILines   int64   `json:"total_ai_lines"`   // 总AI代码行数
	TotalLines     int64   `json:"total_lines"`      // 总代码行数
	AvgDailyTokens int64   `json:"avg_daily_tokens"` // 平均日均Token（有数据的成员平均值）
	TotalTokens    int64   `json:"total_tokens"`     // 总Token
	TotalCost      float64 `json:"total_cost"`       // 总费用
	Rank           int     `json:"rank"`             // 排名
}

// DeptRankingListResponse 部门排行响应
type DeptRankingListResponse struct {
	List   []DeptRankingItem `json:"list"`
	Level  string            `json:"level"`
	Metric string            `json:"metric"`
	Total  int64             `json:"total"`
	Limit  int               `json:"limit"`
}
