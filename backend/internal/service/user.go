package service

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/wan-admin/ai-efficiency-admin/internal/config"
	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// Create 创建用户
func (s *UserService) Create(ctx context.Context, req *model.UserCreateRequest) (*model.User, error) {
	// 检查用户名是否存在
	if _, err := s.repo.GetByUsername(ctx, req.Username); err == nil {
		return nil, fmt.Errorf("用户名已存在")
	}
	// 检查邮箱是否存在
	if _, err := s.repo.GetByEmail(ctx, req.Email); err == nil {
		return nil, fmt.Errorf("邮箱已存在")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("密码加密失败")
	}

	user := &model.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		Nickname: req.Nickname,
		Phone:    req.Phone,
		Role:     req.Role,
		Status:   1,
	}
	if user.Role == "" {
		user.Role = model.RoleUser
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

// GetByID 根据ID获取用户
func (s *UserService) GetByID(ctx context.Context, id string) (*model.User, error) {
	return s.repo.GetByID(ctx, id)
}

// List 用户列表
func (s *UserService) List(ctx context.Context, page, pageSize int, keyword string) (*model.UserListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	users, total, err := s.repo.List(ctx, page, pageSize, keyword)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &model.UserListResponse{
		List:       users,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// Update 更新用户
func (s *UserService) Update(ctx context.Context, id string, req *model.UserUpdateRequest) error {
	updates := map[string]interface{}{
		"nickname": req.Nickname,
		"phone":    req.Phone,
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.TeamID != nil {
		updates["team_id"] = *req.TeamID
	}

	return s.repo.Update(ctx, id, updates)
}

// Delete 删除用户
func (s *UserService) Delete(ctx context.Context, id string) error {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if user.Role == model.RoleAdmin {
		return fmt.Errorf("管理员账号不允许删除")
	}
	return s.repo.Delete(ctx, id)
}

// Login 登录
func (s *UserService) Login(ctx context.Context, username, password string) (*model.User, error) {
	user, err := s.repo.GetByUsername(ctx, username)
	if err != nil {
		// 尝试用邮箱登录
		user, err = s.repo.GetByEmail(ctx, username)
		if err != nil {
			return nil, fmt.Errorf("用户名或密码错误")
		}
	}

	if user.Status != 1 {
		return nil, fmt.Errorf("账号已被禁用")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, fmt.Errorf("用户名或密码错误")
	}

	return user, nil
}

// GenerateToken 生成JWT
func (s *UserService) GenerateToken(user *model.User, cfg config.JWTConfig) (string, int, error) {
	expireHours := cfg.Expire
	if expireHours == 0 {
		expireHours = 24
	}
	expireDuration := time.Duration(expireHours) * time.Hour

	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(expireDuration).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(cfg.Secret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, int(expireDuration.Seconds()), nil
}

// UpdateLastLogin 更新最后登录时间
func (s *UserService) UpdateLastLogin(ctx context.Context, id string) error {
	now := time.Now()
	return s.repo.Update(ctx, id, map[string]interface{}{
		"last_login": &now,
	})
}

// ToUserInfo 转换为脱敏用户信息
func (s *UserService) ToUserInfo(user *model.User) *model.UserInfo {
	return &model.UserInfo{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Nickname: user.Nickname,
		Avatar:   user.Avatar,
		Role:     user.Role,
		Status:   user.Status,
	}
}
