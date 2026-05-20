package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/service"
)

type ConfigHandler struct {
	service *service.ConfigService
}

func NewConfigHandler(service *service.ConfigService) *ConfigHandler {
	return &ConfigHandler{service: service}
}

// GetThresholds 获取所有阈值配置
func (h *ConfigHandler) GetThresholds(c *gin.Context) {
	configs, err := h.service.GetAllThresholds(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	data := make([]model.ThresholdResponse, 0, len(configs))
	for _, cfg := range configs {
		data = append(data, model.ThresholdResponse{
			MetricType:     cfg.MetricType,
			ThresholdValue: cfg.ThresholdValue,
			Description:    cfg.Description,
			UpdatedAt:      cfg.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": data})
}

// UpdateThreshold 更新阈值配置
func (h *ConfigHandler) UpdateThreshold(c *gin.Context) {
	var req model.ThresholdUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "参数错误: " + err.Error()})
		return
	}

	if err := h.service.UpdateThreshold(c.Request.Context(), req.MetricType, req.ThresholdValue); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功"})
}

// GetThreshold 获取单个阈值配置
func (h *ConfigHandler) GetThreshold(c *gin.Context) {
	metricType := c.Param("metric_type")
	if metricType == "" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "指标类型不能为空"})
		return
	}

	value, err := h.service.GetThreshold(c.Request.Context(), metricType)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": gin.H{
		"metric_type":     metricType,
		"threshold_value": value,
	}})
}
