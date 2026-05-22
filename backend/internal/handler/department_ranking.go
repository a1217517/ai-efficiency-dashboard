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

func parseLevel(c *gin.Context) (string, bool) {
	level := c.DefaultQuery("level", "level1")
	if level != "level1" && level != "level2" && level != "level3" && level != "level4" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "level 参数必须是 level1/level2/level3/level4"})
		return "", false
	}
	return level, true
}

func parseParents(c *gin.Context) map[string]string {
	parents := make(map[string]string)
	if v := c.Query("parent_level1"); v != "" {
		parents["level1"] = v
	}
	if v := c.Query("parent_level2"); v != "" {
		parents["level2"] = v
	}
	if v := c.Query("parent_level3"); v != "" {
		parents["level3"] = v
	}
	return parents
}

func parseDateRange(c *gin.Context) (*time.Time, *time.Time) {
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
	return startDate, endDate
}

// ListSilicon 获取部门硅含量排行
func (h *DeptRankingHandler) ListSilicon(c *gin.Context) {
	level, ok := parseLevel(c)
	if !ok {
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	parents := parseParents(c)
	startDate, endDate := parseDateRange(c)

	resp, err := h.service.ListSiliconRanking(c.Request.Context(), level, parents, startDate, endDate, limit)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": resp})
}

// ListToken 获取部门 Token 排行
func (h *DeptRankingHandler) ListToken(c *gin.Context) {
	level, ok := parseLevel(c)
	if !ok {
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	parents := parseParents(c)
	startDate, endDate := parseDateRange(c)

	resp, err := h.service.ListTokenRanking(c.Request.Context(), level, parents, startDate, endDate, limit)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": resp})
}

// ListMembers 获取指定部门下的成员列表
func (h *DeptRankingHandler) ListMembers(c *gin.Context) {
	parents := make(map[string]string)
	if v := c.Query("level1"); v != "" {
		parents["level1"] = v
	}
	if v := c.Query("level2"); v != "" {
		parents["level2"] = v
	}
	if v := c.Query("level3"); v != "" {
		parents["level3"] = v
	}
	if v := c.Query("level4"); v != "" {
		parents["level4"] = v
	}

	// 至少需要 level1 + level2
	if parents["level1"] == "" || parents["level2"] == "" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "至少需要提供 level1 和 level2 参数"})
		return
	}

	startDate, endDate := parseDateRange(c)

	items, err := h.service.ListMembers(c.Request.Context(), parents, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": gin.H{
		"list":  items,
		"total": len(items),
	}})
}
