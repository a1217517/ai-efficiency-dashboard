package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserRole 用户角色
type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleUser   UserRole = "user"
	RoleViewer UserRole = "viewer"
)

// User 用户模型
type User struct {
	ID        string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null;size:100"`
	Password  string         `json:"-" gorm:"not null;size:255"`
	Nickname  string         `json:"nickname" gorm:"size:50"`
	Avatar    string         `json:"avatar" gorm:"size:255"`
	Phone     string         `json:"phone" gorm:"size:20"`
	Role      UserRole       `json:"role" gorm:"not null;default:'user'"`
	Status    int            `json:"status" gorm:"not null;default:1"` // 1=启用 0=禁用
	TeamID    *string        `json:"team_id,omitempty" gorm:"type:uuid;index"`
	LastLogin *time.Time     `json:"last_login,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// BeforeCreate 创建前生成 UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// UserCreateRequest 创建用户请求
type UserCreateRequest struct {
	Username string   `json:"username" binding:"required,min=3,max=50"`
	Email    string   `json:"email" binding:"required,email"`
	Password string   `json:"password" binding:"required,min=6,max=100"`
	Nickname string   `json:"nickname"`
	Phone    string   `json:"phone"`
	Role     UserRole `json:"role" binding:"omitempty,oneof=admin user viewer"`
}

// UserUpdateRequest 更新用户请求
type UserUpdateRequest struct {
	Nickname string   `json:"nickname"`
	Phone    string   `json:"phone"`
	Role     UserRole `json:"role" binding:"omitempty,oneof=admin user viewer"`
	Status   *int     `json:"status"`
	TeamID   *string  `json:"team_id"`
}

// UserListResponse 用户列表响应
type UserListResponse struct {
	List       []User `json:"list"`
	Total      int64  `json:"total"`
	Page       int    `json:"page"`
	PageSize   int    `json:"page_size"`
	TotalPages int    `json:"total_pages"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token     string    `json:"token"`
	ExpiresIn int       `json:"expires_in"`
	User      *UserInfo `json:"user"`
}

// UserInfo 用户信息（脱敏）
type UserInfo struct {
	ID       string   `json:"id"`
	Username string   `json:"username"`
	Email    string   `json:"email"`
	Nickname string   `json:"nickname"`
	Avatar   string   `json:"avatar"`
	Role     UserRole `json:"role"`
	Status   int      `json:"status"`
}
