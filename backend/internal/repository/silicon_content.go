package repository

import (
	"context"
	"fmt"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SiliconContentRepository struct {
	db *gorm.DB
}

func NewSiliconContentRepository(db *gorm.DB) *SiliconContentRepository {
	return &SiliconContentRepository{db: db}
}

func (r *SiliconContentRepository) Create(ctx context.Context, s *model.SiliconContent) error {
	return r.db.WithContext(ctx).Create(s).Error
}

// BatchUpsert 批量 upsert（按 username 唯一键，存在更新，不存在插入）
func (r *SiliconContentRepository) BatchUpsert(ctx context.Context, items []*model.SiliconContent) (inserted int64, updated int64, err error) {
	if len(items) == 0 {
		return 0, 0, nil
	}

	usernames := make([]string, 0, len(items))
	for _, item := range items {
		usernames = append(usernames, item.Username)
	}

	var existingCount int64
	if err := r.db.WithContext(ctx).Model(&model.SiliconContent{}).
		Where("username IN ?", usernames).
		Count(&existingCount).Error; err != nil {
		return 0, 0, err
	}

	result := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "username"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"rank", "role_category", "silicon_percentage", "ai_lines", "total_lines",
		}),
	}).Create(items)

	if result.Error != nil {
		return 0, 0, result.Error
	}

	inserted = int64(len(items)) - existingCount
	updated = existingCount
	return inserted, updated, nil
}

func (r *SiliconContentRepository) GetByID(ctx context.Context, id string) (*model.SiliconContent, error) {
	var s model.SiliconContent
	if err := r.db.WithContext(ctx).First(&s, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("记录不存在")
		}
		return nil, err
	}
	return &s, nil
}

func (r *SiliconContentRepository) List(ctx context.Context, page, pageSize int, keyword string) ([]model.SiliconContent, int64, error) {
	var items []model.SiliconContent
	var total int64

	query := r.db.WithContext(ctx).Model(&model.SiliconContent{})
	if keyword != "" {
		query = query.Where("username ILIKE ?", "%"+keyword+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("rank ASC, silicon_percentage DESC").Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// ListAll 获取所有记录（不分页，用于图表展示）
func (r *SiliconContentRepository) ListAll(ctx context.Context) ([]model.SiliconContent, error) {
	var items []model.SiliconContent
	err := r.db.WithContext(ctx).Model(&model.SiliconContent{}).Order("rank ASC, silicon_percentage DESC").Find(&items).Error
	return items, err
}

func (r *SiliconContentRepository) Update(ctx context.Context, id string, updates map[string]interface{}) error {
	result := r.db.WithContext(ctx).Model(&model.SiliconContent{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("记录不存在")
	}
	return nil
}

// Delete 物理删除
func (r *SiliconContentRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Unscoped().Delete(&model.SiliconContent{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("记录不存在")
	}
	return nil
}

// GetStats 获取硅含量统计数据
func (r *SiliconContentRepository) GetStats(ctx context.Context) (*model.SiliconContentStats, error) {
	var stats model.SiliconContentStats

	// 总人数
	if err := r.db.WithContext(ctx).Model(&model.SiliconContent{}).Count(&stats.TotalMembers).Error; err != nil {
		return nil, err
	}

	// 平均硅含量
	if err := r.db.WithContext(ctx).Model(&model.SiliconContent{}).
		Select("COALESCE(AVG(silicon_percentage), 0)").
		Scan(&stats.AvgSiliconPct).Error; err != nil {
		return nil, err
	}

	// 总AI行数和总代码量
	var sums struct {
		TotalAILines int64 `gorm:"column:total_ai_lines"`
		TotalLines   int64 `gorm:"column:total_lines"`
	}
	if err := r.db.WithContext(ctx).Model(&model.SiliconContent{}).
		Select("COALESCE(SUM(ai_lines), 0) as total_ai_lines, COALESCE(SUM(total_lines), 0) as total_lines").
		Scan(&sums).Error; err != nil {
		return nil, err
	}
	stats.TotalAILines = sums.TotalAILines
	stats.TotalLines = sums.TotalLines

	if stats.TotalLines > 0 {
		stats.OverallSiliconPct = float64(stats.TotalAILines) / float64(stats.TotalLines) * 100
	}

	// 职类分布统计
	var roleStats []model.RoleStat
	if err := r.db.WithContext(ctx).Model(&model.SiliconContent{}).
		Select("role_category, COUNT(*) as count, COALESCE(AVG(silicon_percentage), 0) as avg_silicon_pct, COALESCE(SUM(ai_lines), 0) as total_ai_lines, COALESCE(SUM(total_lines), 0) as total_lines").
		Group("role_category").
		Scan(&roleStats).Error; err != nil {
		return nil, err
	}
	stats.RoleDistribution = roleStats

	return &stats, nil
}
