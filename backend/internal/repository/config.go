package repository

import (
	"context"
	"fmt"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"gorm.io/gorm"
)

type ConfigRepository struct {
	db *gorm.DB
}

func NewConfigRepository(db *gorm.DB) *ConfigRepository {
	return &ConfigRepository{db: db}
}

// GetAll 获取所有阈值配置
func (r *ConfigRepository) GetAll(ctx context.Context) ([]model.ConfigThreshold, error) {
	var configs []model.ConfigThreshold
	if err := r.db.WithContext(ctx).Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

// GetByMetricType 根据指标类型获取阈值
func (r *ConfigRepository) GetByMetricType(ctx context.Context, metricType string) (*model.ConfigThreshold, error) {
	var config model.ConfigThreshold
	if err := r.db.WithContext(ctx).Where("metric_type = ?", metricType).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("配置不存在: %s", metricType)
		}
		return nil, err
	}
	return &config, nil
}

// Upsert 创建或更新阈值配置
func (r *ConfigRepository) Upsert(ctx context.Context, metricType string, thresholdValue float64, description string) error {
	var config model.ConfigThreshold
	err := r.db.WithContext(ctx).Where("metric_type = ?", metricType).First(&config).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新记录
			config = model.ConfigThreshold{
				MetricType:     metricType,
				ThresholdValue: thresholdValue,
				Description:    description,
			}
			return r.db.WithContext(ctx).Create(&config).Error
		}
		return err
	}
	// 更新已有记录
	config.ThresholdValue = thresholdValue
	if description != "" {
		config.Description = description
	}
	return r.db.WithContext(ctx).Save(&config).Error
}

// InitDefaults 初始化默认阈值配置
func (r *ConfigRepository) InitDefaults(ctx context.Context) error {
	defaults := []struct {
		metricType  string
		value       float64
		description string
	}{
		{"token_daily_avg", 1.0, "Token 日均使用量达标阈值（百万）"},
		{"pr_silicon_ratio", 50.0, "PR 硅含量占比达标阈值（%）"},
		{"date_range_days", 30.0, "看板默认时间范围（天数）"},
	}

	for _, d := range defaults {
		var count int64
		r.db.WithContext(ctx).Model(&model.ConfigThreshold{}).Where("metric_type = ?", d.metricType).Count(&count)
		if count == 0 {
			config := model.ConfigThreshold{
				MetricType:     d.metricType,
				ThresholdValue: d.value,
				Description:    d.description,
			}
			if err := r.db.WithContext(ctx).Create(&config).Error; err != nil {
				return err
			}
		}
	}
	return nil
}
