package model

import (
	"time"

	"gorm.io/gorm"
)

// ConfigThreshold 指标达标阈值配置
type ConfigThreshold struct {
	ID             string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	MetricType     string    `json:"metric_type" gorm:"not null;size:50;uniqueIndex"` // 指标类型: token_daily_avg / pr_silicon_ratio
	ThresholdValue float64   `json:"threshold_value" gorm:"not null;default:0"`         // 阈值数值
	Description    string    `json:"description" gorm:"size:200"`                      // 描述
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// TableName 指定表名
func (ConfigThreshold) TableName() string {
	return "config_thresholds"
}

// BeforeCreate 创建前检查
func (c *ConfigThreshold) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		// 使用数据库默认值 gen_random_uuid()
	}
	return nil
}

// ThresholdResponse 阈值响应
type ThresholdResponse struct {
	MetricType     string  `json:"metric_type"`
	ThresholdValue float64 `json:"threshold_value"`
	Description    string  `json:"description"`
	UpdatedAt      string  `json:"updated_at"`
}

// ThresholdUpdateRequest 阈值更新请求
type ThresholdUpdateRequest struct {
	MetricType     string  `json:"metric_type" binding:"required"`
	ThresholdValue float64 `json:"threshold_value" binding:"required"`
}
