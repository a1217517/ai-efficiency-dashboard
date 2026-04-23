package handler

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/service"
)

type TokenUsageHandler struct {
	service *service.TokenUsageService
}

func NewTokenUsageHandler(service *service.TokenUsageService) *TokenUsageHandler {
	return &TokenUsageHandler{service: service}
}

// GetByID 根据ID获取
func (h *TokenUsageHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	item, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": item})
}

// List 列表
func (h *TokenUsageHandler) List(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if ps := c.Query("page_size"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 {
			pageSize = v
		}
	}
	keyword := c.Query("keyword")

	resp, err := h.service.List(c.Request.Context(), page, pageSize, keyword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": resp})
}

// ListAll 获取所有记录（公开接口，用于图表展示）
func (h *TokenUsageHandler) ListAll(c *gin.Context) {
	items, err := h.service.ListAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": items})
}

// Create 创建
func (h *TokenUsageHandler) Create(c *gin.Context) {
	var req model.TokenUsage
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误: " + err.Error()})
		return
	}

	item, err := h.service.Create(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": item})
}

// Update 更新
func (h *TokenUsageHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req model.TokenUsage
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误: " + err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Username != "" {
		updates["username"] = req.Username
	}
	if req.RoleCategory != "" {
		updates["role_category"] = req.RoleCategory
	}
	if req.TotalTokens > 0 {
		updates["total_tokens"] = req.TotalTokens
	}
	if req.InternalTokens >= 0 {
		updates["internal_tokens"] = req.InternalTokens
	}
	if req.ExternalTokens >= 0 {
		updates["external_tokens"] = req.ExternalTokens
	}
	if req.DailyTokens >= 0 {
		updates["daily_tokens"] = req.DailyTokens
	}
	if req.RequestCount >= 0 {
		updates["request_count"] = req.RequestCount
	}
	if req.InternalRequestCount >= 0 {
		updates["internal_request_count"] = req.InternalRequestCount
	}
	if req.ExternalRequestCount >= 0 {
		updates["external_request_count"] = req.ExternalRequestCount
	}
	if req.Cost >= 0 {
		updates["cost"] = req.Cost
	}
	if req.InternalCost >= 0 {
		updates["internal_cost"] = req.InternalCost
	}
	if req.ExternalCost >= 0 {
		updates["external_cost"] = req.ExternalCost
	}
	if req.Rank > 0 {
		updates["rank"] = req.Rank
	}

	if err := h.service.Update(c.Request.Context(), id, updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功"})
}

// Delete 删除
func (h *TokenUsageHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}

// ImportExcel 导入 Excel
func (h *TokenUsageHandler) ImportExcel(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请上传文件: " + err.Error()})
		return
	}

	// 检查文件类型
	if file.Header.Get("Content-Type") != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" {
		ext := file.Filename
		if len(ext) > 5 && ext[len(ext)-5:] != ".xlsx" {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "只支持 .xlsx 格式的 Excel 文件"})
			return
		}
	}

	// 保存临时文件
	tmpDir := os.TempDir()
	tmpPath := fmt.Sprintf("%s/token_usage_%s.xlsx", tmpDir, strconv.FormatInt(time.Now().UnixNano(), 10))
	if err := c.SaveUploadedFile(file, tmpPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "保存文件失败: " + err.Error()})
		return
	}
	defer os.Remove(tmpPath)

	// 导入数据
	result, err := h.service.ImportFromExcel(c.Request.Context(), tmpPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "导入失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "导入成功", "data": result})
}
