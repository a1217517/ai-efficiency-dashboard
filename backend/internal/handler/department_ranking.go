package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/wan-admin/ai-efficiency-admin/internal/service"
)

type DeptRankingHandler struct {
	service *service.DeptRankingService
}

func NewDeptRankingHandler(service *service.DeptRankingService) *DeptRankingHandler {
	return &DeptRankingHandler{service: service}
}

// ListSilicon 获取部门硅含量排行
func (h *DeptRankingHandler) ListSilicon(c *gin.Context) {
	level := c.DefaultQuery("level", "level2")
	if level != "level1" && level != "level2" && level != "level3" && level != "level4" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "level 参数必须是 level1/level2/level3/level4"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var startDate, endDate *time.Time
	if sd := c.Query("start_date"); sd != "" {
		if d, err := time.Parse("2006-01-02", sd); err == nil {
			startDate = &d
		}
	}
	if ed := c.Query("end_date"); ed != "" {
		if d, err := time.Parse("2006-01-02", ed); err == nil {
			endDate = &d
		}
	}

	resp, err := h.service.ListSiliconRanking(c.Request.Context(), level, startDate, endDate, limit)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": resp})
}

// ListToken 获取部门 Token 排行
func (h *DeptRankingHandler) ListToken(c *gin.Context) {
	level := c.DefaultQuery("level", "level2")
	if level != "level1" && level != "level2" && level != "level3" && level != "level4" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "level 参数必须是 level1/level2/level3/level4"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var startDate, endDate *time.Time
	if sd := c.Query("start_date"); sd != "" {
		if d, err := time.Parse("2006-01-02", sd); err == nil {
			startDate = &d
		}
	}
	if ed := c.Query("end_date"); ed != "" {
		if d, err := time.Parse("2006-01-02", ed); err == nil {
			endDate = &d
		}
	}

	resp, err := h.service.ListTokenRanking(c.Request.Context(), level, startDate, endDate, limit)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": resp})
}
