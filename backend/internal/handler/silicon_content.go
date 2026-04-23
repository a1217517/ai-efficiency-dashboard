package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/service"
)

type SiliconContentHandler struct {
	service *service.SiliconContentService
}

func NewSiliconContentHandler(service *service.SiliconContentService) *SiliconContentHandler {
	return &SiliconContentHandler{service: service}
}

// List 分页列表
func (h *SiliconContentHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	keyword := c.Query("keyword")

	resp, err := h.service.List(c.Request.Context(), page, pageSize, keyword)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": resp})
}

// ListAll 获取所有记录（公开接口，用于图表展示）
func (h *SiliconContentHandler) ListAll(c *gin.Context) {
	items, err := h.service.ListAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": items})
}

// GetByID 获取单条记录
func (h *SiliconContentHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	item, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 404, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": item})
}

// Create 创建记录
func (h *SiliconContentHandler) Create(c *gin.Context) {
	var req model.SiliconContent
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "参数错误: " + err.Error()})
		return
	}

	if err := h.service.Create(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": req})
}

// Update 更新记录
func (h *SiliconContentHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	if err := h.service.Update(c.Request.Context(), id, updates); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功"})
}

// Delete 删除记录
func (h *SiliconContentHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}

// Stats 获取统计数据
func (h *SiliconContentHandler) Stats(c *gin.Context) {
	stats, err := h.service.GetStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": stats})
}

// ImportExcel 导入 Excel
func (h *SiliconContentHandler) ImportExcel(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "请上传文件"})
		return
	}

	// 保存临时文件
	tempPath := "/tmp/silicon_content_import_" + file.Filename
	if err := c.SaveUploadedFile(file, tempPath); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": "保存文件失败"})
		return
	}
	defer func() {
		_ = func() error { return nil }()
	}()

	result, err := h.service.ImportExcel(c.Request.Context(), tempPath)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "导入成功", "data": result})
}
