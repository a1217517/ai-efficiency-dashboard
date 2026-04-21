package repository

import (
	"context"
	"fmt"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"gorm.io/gorm"
)

type TeamSavingRepository struct {
	db *gorm.DB
}

func NewTeamSavingRepository(db *gorm.DB) *TeamSavingRepository {
	return &TeamSavingRepository{db: db}
}

func (r *TeamSavingRepository) Create(ctx context.Context, t *model.TeamSaving) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *TeamSavingRepository) GetByID(ctx context.Context, id string) (*model.TeamSaving, error) {
	var t model.TeamSaving
	if err := r.db.WithContext(ctx).First(&t, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("记录不存在")
		}
		return nil, err
	}
	return &t, nil
}

func (r *TeamSavingRepository) List(ctx context.Context, page, pageSize int, keyword string) ([]model.TeamSaving, int64, error) {
	var items []model.TeamSaving
	var total int64

	query := r.db.WithContext(ctx).Model(&model.TeamSaving{})
	if keyword != "" {
		query = query.Where("team_name ILIKE ?", "%"+keyword+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("sort_order ASC, created_at DESC").Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// ListAll 获取所有记录（不分页，用于图表展示）
func (r *TeamSavingRepository) ListAll(ctx context.Context) ([]model.TeamSaving, error) {
	var items []model.TeamSaving
	err := r.db.WithContext(ctx).Model(&model.TeamSaving{}).Order("sort_order ASC, created_at DESC").Find(&items).Error
	return items, err
}

func (r *TeamSavingRepository) Update(ctx context.Context, id string, updates map[string]interface{}) error {
	result := r.db.WithContext(ctx).Model(&model.TeamSaving{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("记录不存在")
	}
	return nil
}

func (r *TeamSavingRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Unscoped().Delete(&model.TeamSaving{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("记录不存在")
	}
	return nil
}
