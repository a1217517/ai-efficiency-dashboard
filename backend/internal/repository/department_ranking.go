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

// ListSiliconRanking 按部门层级查询硅含量排行
func (r *DeptRankingRepository) ListSiliconRanking(ctx context.Context, level string, startDate, endDate *time.Time, limit int) ([]model.DeptRankingItem, error) {
	var items []model.DeptRankingItem

	// 确定 GROUP BY 的字段
	deptCol := fmt.Sprintf("dm.%s_dept", level)

	err := r.db.WithContext(ctx).Raw(fmt.Sprintf(`
		SELECT 
			%s AS dept_name,
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
		WHERE %s IS NOT NULL AND %s != ''
		GROUP BY %s
		ORDER BY avg_silicon_pct DESC
		LIMIT $3
	`, deptCol, deptCol, deptCol, deptCol), startDate, endDate, limit).Scan(&items).Error

	return items, err
}

// ListTokenRanking 按部门层级查询 Token 排行
func (r *DeptRankingRepository) ListTokenRanking(ctx context.Context, level string, startDate, endDate *time.Time, limit int) ([]model.DeptRankingItem, error) {
	var items []model.DeptRankingItem

	deptCol := fmt.Sprintf("dm.%s_dept", level)

	err := r.db.WithContext(ctx).Raw(fmt.Sprintf(`
		SELECT 
			%s AS dept_name,
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
		WHERE %s IS NOT NULL AND %s != ''
		GROUP BY %s
		ORDER BY avg_daily_tokens DESC
		LIMIT $3
	`, deptCol, deptCol, deptCol, deptCol), startDate, endDate, limit).Scan(&items).Error

	return items, err
}
