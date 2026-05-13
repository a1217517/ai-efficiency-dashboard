package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TokenUsage 成员 Token 使用量数据模型（基于 APEX平台研发部_成员明细_20260422_token4.xlsx 结构）
type TokenUsage struct {
	ID                   string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Rank                 int        `json:"rank" gorm:"not null"`
	Username             string     `json:"username" gorm:"not null;size:100;uniqueIndex:idx_username_date"` // 用户名
	RoleCategory         string     `json:"role_category" gorm:"size:50"`                                    // 职类
	TotalTokens          int64      `json:"total_tokens" gorm:"not null"`                                    // Total Tokens
	InternalTokens       int64      `json:"internal_tokens" gorm:"not null;default:0"`                       // 内网 Tokens
	ExternalTokens       int64      `json:"external_tokens" gorm:"not null;default:0"`                       // 外网 Tokens
	DailyTokens          int64      `json:"daily_tokens" gorm:"not null;default:0"`                          // 日均 Tokens
	RequestCount         int64      `json:"request_count" gorm:"not null;default:0"`                         // 请求次数
	InternalRequestCount int64      `json:"internal_request_count" gorm:"not null;default:0"`                // 内网请求
	ExternalRequestCount int64      `json:"external_request_count" gorm:"not null;default:0"`                // 外网请求
	Cost                 float64    `json:"cost" gorm:"not null;default:0"`                                  // 总费用
	InternalCost         float64    `json:"internal_cost" gorm:"not null;default:0"`                         // 内网费用
	ExternalCost         float64    `json:"external_cost" gorm:"not null;default:0"`                         // 外网费用
	Date                 *time.Time `json:"date" gorm:"type:date;uniqueIndex:idx_username_date"`             // 数据所属日期
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

// TokenUsageDaily 按用户聚合的日均 Token 使用量（用于看板展示）
type TokenUsageDaily struct {
	ID           string  `json:"id"`
	Rank         int     `json:"rank"`
	Username     string  `json:"username"`
	RoleCategory string  `json:"role_category"`
	TotalTokens  int64   `json:"total_tokens"`
	DailyTokens  int64   `json:"daily_tokens"`
	RequestCount int64   `json:"request_count"`
	Cost         float64 `json:"cost"`
}

// TableName 指定表名
func (TokenUsage) TableName() string {
	return "token_usages"
}

// BeforeCreate 创建前生成 UUID
func (t *TokenUsage) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return nil
}

// TokenUsageListResponse 列表响应
type TokenUsageListResponse struct {
	List       []TokenUsage `json:"list"`
	Total      int64        `json:"total"`
	Page       int          `json:"page"`
	PageSize   int          `json:"page_size"`
	TotalPages int          `json:"total_pages"`
}

// TokenUsageImportResponse 导入响应
type TokenUsageImportResponse struct {
	SuccessCount int      `json:"success_count"`
	FailCount    int      `json:"fail_count"`
	Errors       []string `json:"errors,omitempty"`
	BatchID      string   `json:"batch_id"`
}
