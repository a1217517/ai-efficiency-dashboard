package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TokenUsageRepository struct {
	db *gorm.DB
}

func NewTokenUsageRepository(db *gorm.DB) *TokenUsageRepository {
	return &TokenUsageRepository{db: db}
}

func (r *TokenUsageRepository) Create(ctx context.Context, t *model.TokenUsage) error {
	return r.db.WithContext(ctx).Create(t).Error
}

// BatchUpsert 批量 upsert（按 username + date 联合唯一键，存在更新，不存在插入）
func (r *TokenUsageRepository) BatchUpsert(ctx context.Context, items []*model.TokenUsage) (inserted int64, updated int64, err error) {
	if len(items) == 0 {
		return 0, 0, nil
	}

	// 统计已存在的记录数（按 username + date）
	var existingCount int64
	for _, item := range items {
		if item.Date != nil {
			var count int64
			if err := r.db.WithContext(ctx).Model(&model.TokenUsage{}).
				Where("username = ? AND date = ?", item.Username, item.Date).
				Count(&count).Error; err != nil {
				return 0, 0, err
			}
			existingCount += count
		}
	}

	result := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "username"}, {Name: "date"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"rank", "role_category", "total_tokens", "internal_tokens", "external_tokens",
			"daily_tokens", "request_count", "internal_request_count", "external_request_count",
			"cost", "internal_cost", "external_cost",
		}),
	}).Create(items)

	if result.Error != nil {
		return 0, 0, result.Error
	}

	inserted = int64(len(items)) - existingCount
	updated = existingCount
	return inserted, updated, nil
}

// ListAggregated 按用户聚合查询日均 Token 使用量（支持日期范围过滤）
func (r *TokenUsageRepository) ListAggregated(ctx context.Context, startDate, endDate *time.Time) ([]model.TokenUsageDaily, error) {
	var items []model.TokenUsageDaily

	err := r.db.WithContext(ctx).Raw(`
		SELECT 
			username AS id,
			username,
			role_category,
			COALESCE(SUM(total_tokens), 0)::bigint AS total_tokens,
			(COALESCE(SUM(total_tokens), 0) / GREATEST(COUNT(DISTINCT date), 1))::bigint AS daily_tokens,
			COALESCE(SUM(request_count), 0)::bigint AS request_count,
			COALESCE(SUM(cost), 0)::double precision AS cost,
			ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(total_tokens), 0) DESC)::int AS rank
		FROM token_usages
		WHERE ($1::date IS NULL OR date >= $1::date)
		  AND ($2::date IS NULL OR date <= $2::date)
		GROUP BY username, role_category
		ORDER BY total_tokens DESC
	`, startDate, endDate).Scan(&items).Error

	return items, err
}

func (r *TokenUsageRepository) GetByID(ctx context.Context, id string) (*model.TokenUsage, error) {
	var t model.TokenUsage
	if err := r.db.WithContext(ctx).First(&t, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("记录不存在")
		}
		return nil, err
	}
	return &t, nil
}

func (r *TokenUsageRepository) List(ctx context.Context, page, pageSize int, keyword string, startDate, endDate *time.Time) ([]model.TokenUsage, int64, error) {
	var items []model.TokenUsage
	var total int64

	query := r.db.WithContext(ctx).Model(&model.TokenUsage{})
	if keyword != "" {
		query = query.Where("username ILIKE ?", "%"+keyword+"%")
	}
	if startDate != nil {
		query = query.Where("date >= ?", startDate)
	}
	if endDate != nil {
		query = query.Where("date <= ?", endDate)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("date DESC, rank ASC, total_tokens DESC").Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// ListAll 获取所有记录（不分页，用于图表展示）—— 已废弃，请使用 ListAggregated
func (r *TokenUsageRepository) ListAll(ctx context.Context) ([]model.TokenUsage, error) {
	var items []model.TokenUsage
	err := r.db.WithContext(ctx).Model(&model.TokenUsage{}).Order("rank ASC, total_tokens DESC").Find(&items).Error
	return items, err
}

func (r *TokenUsageRepository) Update(ctx context.Context, id string, updates map[string]interface{}) error {
	result := r.db.WithContext(ctx).Model(&model.TokenUsage{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("记录不存在")
	}
	return nil
}

// Delete 物理删除（不走软删除）
func (r *TokenUsageRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Unscoped().Delete(&model.TokenUsage{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("记录不存在")
	}
	return nil
}
