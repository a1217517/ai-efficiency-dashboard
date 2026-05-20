package repository

import (
	"context"
	"fmt"

	"github.com/wan-admin/ai-efficiency-admin/internal/config"
	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDB(cfg config.DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("连接数据库失败: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	// 自动迁移
	if err := db.AutoMigrate(&model.User{}, &model.TeamSaving{}, &model.TokenUsage{}, &model.SiliconContent{}, &model.ConfigThreshold{}, &model.DepartmentMember{}); err != nil {
		return nil, fmt.Errorf("自动迁移失败: %w", err)
	}

	// 初始化默认阈值配置
	configRepo := NewConfigRepository(db)
	if err := configRepo.InitDefaults(context.Background()); err != nil {
		return nil, fmt.Errorf("初始化阈值配置失败: %w", err)
	}

	return db, nil
}
