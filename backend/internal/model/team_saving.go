package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TeamSaving 团队节省时间数据模型
type TeamSaving struct {
	ID        string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	TeamName  string         `json:"team_name" gorm:"not null;size:50"`
	// 原始录入数据
	TraditionalMinutes float64 `json:"traditional_minutes" gorm:"not null"` // 传统部署耗时（分钟）
	StandardMinutes    float64 `json:"standard_minutes" gorm:"not null"`    // 标准化部署耗时（分钟）
	// 计算得出的数据
	Minutes   float64        `json:"minutes" gorm:"not null"` // 节省时间 = traditional - standard
	Hours     float64        `json:"hours" gorm:"not null"`
	SortOrder int            `json:"sort_order" gorm:"not null;default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (TeamSaving) TableName() string {
	return "team_savings"
}

// BeforeCreate 创建前生成 UUID
func (t *TeamSaving) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return nil
}

// TeamSavingCreateRequest 创建请求
type TeamSavingCreateRequest struct {
	TeamName           string  `json:"team_name" binding:"required,min=1,max=50"`
	TraditionalMinutes float64 `json:"traditional_minutes" binding:"required"`
	StandardMinutes    float64 `json:"standard_minutes" binding:"required"`
	SortOrder          int     `json:"sort_order"`
}

// TeamSavingUpdateRequest 更新请求
type TeamSavingUpdateRequest struct {
	TeamName           string  `json:"team_name" binding:"omitempty,min=1,max=50"`
	TraditionalMinutes float64 `json:"traditional_minutes"`
	StandardMinutes    float64 `json:"standard_minutes"`
	SortOrder          int     `json:"sort_order"`
}

// TeamSavingListResponse 列表响应
type TeamSavingListResponse struct {
	List       []TeamSaving `json:"list"`
	Total      int64        `json:"total"`
	Page       int          `json:"page"`
	PageSize   int          `json:"page_size"`
	TotalPages int          `json:"total_pages"`
}
