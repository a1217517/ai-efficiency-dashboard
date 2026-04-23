package repository

import (
	"context"
	"fmt"

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

// BatchUpsert 批量 upsert（按 username 唯一键，存在更新，不存在插入）
func (r *TokenUsageRepository) BatchUpsert(ctx context.Context, items []*model.TokenUsage) (inserted int64, updated int64, err error) {
	if len(items) == 0 {
		return 0, 0, nil
	}

	usernames := make([]string, 0, len(items))
	for _, item := range items {
		usernames = append(usernames, item.Username)
	}

	var existingCount int64
	if err := r.db.WithContext(ctx).Model(&model.TokenUsage{}).
		Where("username IN ?", usernames).
		Count(&existingCount).Error; err != nil {
		return 0, 0, err
	}

	result := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "username"}},
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

func (r *TokenUsageRepository) List(ctx context.Context, page, pageSize int, keyword string) ([]model.TokenUsage, int64, error) {
	var items []model.TokenUsage
	var total int64

	query := r.db.WithContext(ctx).Model(&model.TokenUsage{})
	if keyword != "" {
		query = query.Where("username ILIKE ?", "%"+keyword+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("rank ASC, total_tokens DESC").Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// ListAll 获取所有记录（不分页，用于图表展示）
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
