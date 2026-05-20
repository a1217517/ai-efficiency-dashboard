package service

import (
	"context"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/repository"
)

type ConfigService struct {
	repo *repository.ConfigRepository
}

func NewConfigService(repo *repository.ConfigRepository) *ConfigService {
	return &ConfigService{repo: repo}
}

// GetAllThresholds 获取所有阈值配置
func (s *ConfigService) GetAllThresholds(ctx context.Context) ([]model.ConfigThreshold, error) {
	return s.repo.GetAll(ctx)
}

// GetThreshold 获取指定指标的阈值
func (s *ConfigService) GetThreshold(ctx context.Context, metricType string) (float64, error) {
	config, err := s.repo.GetByMetricType(ctx, metricType)
	if err != nil {
		// 如果找不到，返回默认值
		if metricType == "token_daily_avg" {
			return 1.0, nil
		}
		if metricType == "pr_silicon_ratio" {
			return 50.0, nil
		}
		if metricType == "date_range_days" {
			return 30.0, nil
		}
		return 0, err
	}
	return config.ThresholdValue, nil
}

// UpdateThreshold 更新阈值配置
func (s *ConfigService) UpdateThreshold(ctx context.Context, metricType string, thresholdValue float64) error {
	return s.repo.Upsert(ctx, metricType, thresholdValue, "")
}

// InitDefaults 初始化默认配置
func (s *ConfigService) InitDefaults(ctx context.Context) error {
	return s.repo.InitDefaults(ctx)
}
