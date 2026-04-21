package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wan-admin/ai-efficiency-admin/internal/config"
	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/service"
)

type AuthHandler struct {
	userService *service.UserService
	jwtConfig   config.JWTConfig
}

func NewAuthHandler(userService *service.UserService, jwtConfig config.JWTConfig) *AuthHandler {
	return &AuthHandler{
		userService: userService,
		jwtConfig:   jwtConfig,
	}
}

// Login 登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误: " + err.Error()})
		return
	}

	user, err := h.userService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": err.Error()})
		return
	}

	token, expiresIn, err := h.userService.GenerateToken(user, h.jwtConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "生成令牌失败"})
		return
	}

	_ = h.userService.UpdateLastLogin(c.Request.Context(), user.ID)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": model.LoginResponse{
			Token:     token,
			ExpiresIn: expiresIn,
			User:      h.userService.ToUserInfo(user),
		},
	})
}

// Register 注册
func (h *AuthHandler) Register(c *gin.Context) {
	var req model.UserCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误: " + err.Error()})
		return
	}

	user, err := h.userService.Create(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "注册成功", "data": h.userService.ToUserInfo(user)})
}
