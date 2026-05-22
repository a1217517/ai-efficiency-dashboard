package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"gorm.io/gorm"
)

type DeptRankingRepository struct {
	db *gorm.DB
}

func NewDeptRankingRepository(db *gorm.DB) *DeptRankingRepository {
	return &DeptRankingRepository{db: db}
}

func buildParentWhere(level string, parents map[string]string) string {
	where := ""
	if level == "level2" {
		if v, ok := parents["level1"]; ok && v != "" {
			where = fmt.Sprintf(" AND dm.level1_dept = '%s'", v)
		}
	} else if level == "level3" {
		if v, ok := parents["level1"]; ok && v != "" {
			where += fmt.Sprintf(" AND dm.level1_dept = '%s'", v)
		}
		if v, ok := parents["level2"]; ok && v != "" {
			where += fmt.Sprintf(" AND dm.level2_dept = '%s'", v)
		}
	} else if level == "level4" {
		if v, ok := parents["level1"]; ok && v != "" {
			where += fmt.Sprintf(" AND dm.level1_dept = '%s'", v)
		}
		if v, ok := parents["level2"]; ok && v != "" {
			where += fmt.Sprintf(" AND dm.level2_dept = '%s'", v)
		}
		if v, ok := parents["level3"]; ok && v != "" {
			where += fmt.Sprintf(" AND dm.level3_dept = '%s'", v)
		}
	}
	return where
}

// ListSiliconRanking 按部门层级查询硅含量排行
func (r *DeptRankingRepository) ListSiliconRanking(ctx context.Context, level string, parents map[string]string, startDate, endDate *time.Time, limit int) ([]model.DeptRankingItem, error) {
	var items []model.DeptRankingItem
	deptCol := fmt.Sprintf("dm.%s_dept", level)
	parentWhere := buildParentWhere(level, parents)

	err := r.db.WithContext(ctx).Raw(fmt.Sprintf(`
		SELECT 
			%s AS dept_name,
			'%s' AS dept_level,
			COUNT(DISTINCT dm.username) AS member_count,
			COALESCE(AVG(user_silicon.silicon_pct), 0)::double precision AS avg_silicon_pct,
			COALESCE(SUM(user_silicon.ai_lines), 0)::bigint AS total_ai_lines,
			COALESCE(SUM(user_silicon.total_lines), 0)::bigint AS total_lines,
			0::bigint AS avg_daily_tokens,
			0::bigint AS total_tokens,
			0::double precision AS total_cost,
			ROW_NUMBER() OVER (ORDER BY COALESCE(AVG(user_silicon.silicon_pct), 0) DESC)::int AS rank
		FROM department_members dm
		LEFT JOIN (
			SELECT 
				username,
				CASE 
					WHEN COALESCE(SUM(total_lines), 0) > 0 
					THEN (COALESCE(SUM(ai_lines), 0)::double precision / COALESCE(SUM(total_lines), 0)::double precision * 100)
					ELSE 0 
				END::double precision AS silicon_pct,
				COALESCE(SUM(ai_lines), 0)::bigint AS ai_lines,
				COALESCE(SUM(total_lines), 0)::bigint AS total_lines
			FROM silicon_contents
			WHERE ($1::date IS NULL OR date >= $1::date)
			  AND ($2::date IS NULL OR date <= $2::date)
			GROUP BY username
		) user_silicon ON dm.username = user_silicon.username
		WHERE %s IS NOT NULL AND %s != ''%s
		GROUP BY %s
		ORDER BY avg_silicon_pct DESC
		LIMIT $3
	`, deptCol, level, deptCol, deptCol, parentWhere, deptCol), startDate, endDate, limit).Scan(&items).Error

	return items, err
}

// ListTokenRanking 按部门层级查询 Token 排行
func (r *DeptRankingRepository) ListTokenRanking(ctx context.Context, level string, parents map[string]string, startDate, endDate *time.Time, limit int) ([]model.DeptRankingItem, error) {
	var items []model.DeptRankingItem
	deptCol := fmt.Sprintf("dm.%s_dept", level)
	parentWhere := buildParentWhere(level, parents)

	err := r.db.WithContext(ctx).Raw(fmt.Sprintf(`
		SELECT 
			%s AS dept_name,
			'%s' AS dept_level,
			COUNT(DISTINCT dm.username) AS member_count,
			0::double precision AS avg_silicon_pct,
			0::bigint AS total_ai_lines,
			0::bigint AS total_lines,
			COALESCE(AVG(user_token.daily_tokens), 0)::bigint AS avg_daily_tokens,
			COALESCE(SUM(user_token.total_tokens), 0)::bigint AS total_tokens,
			COALESCE(SUM(user_token.cost), 0)::double precision AS total_cost,
			ROW_NUMBER() OVER (ORDER BY COALESCE(AVG(user_token.daily_tokens), 0) DESC)::int AS rank
		FROM department_members dm
		LEFT JOIN (
			SELECT 
				username,
				COALESCE(SUM(daily_tokens), 0)::bigint AS daily_tokens,
				COALESCE(SUM(total_tokens), 0)::bigint AS total_tokens,
				COALESCE(SUM(cost), 0)::double precision AS cost
			FROM token_usages
			WHERE ($1::date IS NULL OR date >= $1::date)
			  AND ($2::date IS NULL OR date <= $2::date)
			GROUP BY username
		) user_token ON dm.username = user_token.username
		WHERE %s IS NOT NULL AND %s != ''%s
		GROUP BY %s
		ORDER BY avg_daily_tokens DESC
		LIMIT $3
	`, deptCol, level, deptCol, deptCol, parentWhere, deptCol), startDate, endDate, limit).Scan(&items).Error

	return items, err
}

// MemberDetail 成员详情（带硅含量和Token数据）
type MemberDetail struct {
	Username         string   `json:"username"`
	RoleCategory     string   `json:"role_category"`
	Level1Dept       string   `json:"level1_dept"`
	Level2Dept       string   `json:"level2_dept"`
	Level3Dept       *string  `json:"level3_dept"`
	Level4Dept       *string  `json:"level4_dept"`
	IsCoder          bool     `json:"is_coder"`
	IsAINativePilot  bool     `json:"is_ai_native_pilot"`
	PilotDate        *string  `json:"pilot_date,omitempty"`
	SiliconPct       float64  `json:"silicon_percentage"`
	AILines          int64    `json:"ai_lines"`
	TotalLines       int64    `json:"total_lines"`
	DailyTokens      int64    `json:"daily_tokens"`
	TotalTokens      int64    `json:"total_tokens"`
	Cost             float64  `json:"cost"`
}

// ListMembers 查询指定部门路径下的成员列表
func (r *DeptRankingRepository) ListMembers(ctx context.Context, parents map[string]string, startDate, endDate *time.Time) ([]MemberDetail, error) {
	var items []MemberDetail

	where := ""
	if v, ok := parents["level1"]; ok && v != "" {
		where += fmt.Sprintf(" AND dm.level1_dept = '%s'", v)
	}
	if v, ok := parents["level2"]; ok && v != "" {
		where += fmt.Sprintf(" AND dm.level2_dept = '%s'", v)
	}
	if v, ok := parents["level3"]; ok && v != "" {
		where += fmt.Sprintf(" AND dm.level3_dept = '%s'", v)
	}
	if v, ok := parents["level4"]; ok && v != "" {
		where += fmt.Sprintf(" AND dm.level4_dept = '%s'", v)
	}

	err := r.db.WithContext(ctx).Raw(fmt.Sprintf(`
		SELECT 
			dm.username,
			'编码人员' AS role_category,
			dm.level1_dept,
			dm.level2_dept,
			dm.level3_dept,
			dm.level4_dept,
			dm.is_coder,
			dm.is_ai_native_pilot,
			COALESCE(TO_CHAR(dm.pilot_date, 'YYYY-MM-DD'), '') AS pilot_date,
			COALESCE(user_silicon.silicon_pct, 0)::double precision AS silicon_percentage,
			COALESCE(user_silicon.ai_lines, 0)::bigint AS ai_lines,
			COALESCE(user_silicon.total_lines, 0)::bigint AS total_lines,
			COALESCE(user_token.daily_tokens, 0)::bigint AS daily_tokens,
			COALESCE(user_token.total_tokens, 0)::bigint AS total_tokens,
			COALESCE(user_token.cost, 0)::double precision AS cost
		FROM department_members dm
		LEFT JOIN (
			SELECT 
				username,
				CASE 
					WHEN COALESCE(SUM(total_lines), 0) > 0 
					THEN (COALESCE(SUM(ai_lines), 0)::double precision / COALESCE(SUM(total_lines), 0)::double precision * 100)
					ELSE 0 
				END::double precision AS silicon_pct,
				COALESCE(SUM(ai_lines), 0)::bigint AS ai_lines,
				COALESCE(SUM(total_lines), 0)::bigint AS total_lines
			FROM silicon_contents
			WHERE ($1::date IS NULL OR date >= $1::date)
			  AND ($2::date IS NULL OR date <= $2::date)
			GROUP BY username
		) user_silicon ON dm.username = user_silicon.username
		LEFT JOIN (
			SELECT 
				username,
				COALESCE(SUM(daily_tokens), 0)::bigint AS daily_tokens,
				COALESCE(SUM(total_tokens), 0)::bigint AS total_tokens,
				COALESCE(SUM(cost), 0)::double precision AS cost
			FROM token_usages
			WHERE ($1::date IS NULL OR date >= $1::date)
			  AND ($2::date IS NULL OR date <= $2::date)
			GROUP BY username
		) user_token ON dm.username = user_token.username
		WHERE 1=1%s
		ORDER BY COALESCE(user_silicon.silicon_pct, 0) DESC
	`, where), startDate, endDate).Scan(&items).Error

	return items, err
}
