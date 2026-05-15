package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SiliconContent 成员硅含量数据模型（基于 APEX平台研发部_成员明细_20260422_硅基含量.xlsx 结构）
type SiliconContent struct {
	ID                string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Rank              int        `json:"rank" gorm:"not null"`                              // 排名
	Username          string     `json:"username" gorm:"not null;size:100;uniqueIndex:idx_silicon_username_date"`     // 用户名
	RoleCategory      string     `json:"role_category" gorm:"size:50"`                      // 职类
	SiliconPercentage float64    `json:"silicon_percentage" gorm:"not null;default:0"`      // 硅基含量（%）
	AILines           int64      `json:"ai_lines" gorm:"not null;default:0"`                // 硅基代码量（AI行数）
	TotalLines        int64      `json:"total_lines" gorm:"not null;default:0"`             // 总代码量
	Date              *time.Time `json:"date" gorm:"type:date"`                             // 数据日期
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// TableName 指定表名
func (SiliconContent) TableName() string {
	return "silicon_contents"
}

// BeforeCreate 创建前生成 UUID
func (s *SiliconContent) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

// SiliconContentDaily 聚合后的日均硅含量数据（用于图表展示）
type SiliconContentDaily struct {
	ID                string  `json:"id"`                // username
	Rank              int     `json:"rank"`              // 按日均硅含量排序
	Username          string  `json:"username"`
	RoleCategory      string  `json:"role_category"`
	SiliconPercentage float64 `json:"silicon_percentage"` // 日均硅含量
	AILines           int64   `json:"ai_lines"`           // 总AI行数
	TotalLines        int64   `json:"total_lines"`        // 总代码行数
}

// SiliconContentListResponse 列表响应
type SiliconContentListResponse struct {
	List       []SiliconContent `json:"list"`
	Total      int64            `json:"total"`
	Page       int              `json:"page"`
	PageSize   int              `json:"page_size"`
	TotalPages int              `json:"total_pages"`
}

// SiliconContentImportResponse 导入响应
type SiliconContentImportResponse struct {
	SuccessCount int      `json:"success_count"`
	FailCount    int      `json:"fail_count"`
	Errors       []string `json:"errors,omitempty"`
}

// SiliconContentStats 硅含量统计
type SiliconContentStats struct {
	TotalMembers     int64            `json:"total_members"`
	AvgSiliconPct    float64          `json:"avg_silicon_pct"`
	TotalAILines     int64            `json:"total_ai_lines"`
	TotalLines       int64            `json:"total_lines"`
	OverallSiliconPct float64         `json:"overall_silicon_pct"`
	RoleDistribution []RoleStat       `json:"role_distribution"`
}

// RoleStat 职类统计
type RoleStat struct {
	RoleCategory   string  `json:"role_category"`
	Count          int64   `json:"count"`
	AvgSiliconPct  float64 `json:"avg_silicon_pct"`
	TotalAILines   int64   `json:"total_ai_lines"`
	TotalLines     int64   `json:"total_lines"`
}
