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
	"github.com/xuri/excelize/v2"
)

type DepartmentMemberHandler struct {
	service *service.DepartmentMemberService
}

func NewDepartmentMemberHandler(service *service.DepartmentMemberService) *DepartmentMemberHandler {
	return &DepartmentMemberHandler{service: service}
}

// List 列表查询
func (h *DepartmentMemberHandler) List(c *gin.Context) {
	var req model.DepartmentMemberListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "参数错误: " + err.Error()})
		return
	}
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 || req.PageSize > 500 {
		req.PageSize = 20
	}

	resp, err := h.service.List(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": resp})
}

// GetByID 获取详情
func (h *DepartmentMemberHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	item, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 404, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": item})
}

// Create 创建
func (h *DepartmentMemberHandler) Create(c *gin.Context) {
	var req model.DepartmentMember
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "参数错误: " + err.Error()})
		return
	}
	if req.Username == "" || req.Level1Dept == "" || req.Level2Dept == "" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "姓名、一级部门、二级部门不能为空"})
		return
	}
	if err := h.service.Create(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "创建成功", "data": req})
}

// Update 更新
func (h *DepartmentMemberHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req model.DepartmentMember
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "参数错误: " + err.Error()})
		return
	}
	req.ID = id
	if err := h.service.Update(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "更新成功"})
}

// Delete 删除
func (h *DepartmentMemberHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "删除成功"})
}

// ImportExcel 导入 Excel
func (h *DepartmentMemberHandler) ImportExcel(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "请上传文件: " + err.Error()})
		return
	}

	ext := file.Filename
	if len(ext) > 5 && ext[len(ext)-5:] != ".xlsx" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "只支持 .xlsx 格式的 Excel 文件"})
		return
	}

	tmpDir := os.TempDir()
	tmpPath := fmt.Sprintf("%s/dept_member_%s.xlsx", tmpDir, strconv.FormatInt(time.Now().UnixNano(), 10))
	if err := c.SaveUploadedFile(file, tmpPath); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": "保存文件失败: " + err.Error()})
		return
	}
	defer os.Remove(tmpPath)

	members, err := parseDepartmentMemberExcel(tmpPath)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "解析 Excel 失败: " + err.Error()})
		return
	}

	result, err := h.service.UpsertBatch(c.Request.Context(), members)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": "导入失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "导入成功", "data": result})
}

// Aggregate 部门聚合统计
func (h *DepartmentMemberHandler) Aggregate(c *gin.Context) {
	deptLevel := c.Query("dept_level")
	if deptLevel == "" {
		deptLevel = "level3"
	}
	level2 := c.Query("level2_dept")
	var level3 *string
	if l3 := c.Query("level3_dept"); l3 != "" {
		level3 = &l3
	}

	result, err := h.service.AggregateByDept(c.Request.Context(), deptLevel, level2, level3)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": result})
}

// GetDistinctDepts 获取某层级的部门列表
func (h *DepartmentMemberHandler) GetDistinctDepts(c *gin.Context) {
	level := c.Query("level")
	if level == "" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "message": "level 参数不能为空"})
		return
	}
	parentLevel2 := c.Query("level2_dept")
	var parentLevel3 *string
	if l3 := c.Query("level3_dept"); l3 != "" {
		parentLevel3 = &l3
	}

	depts, err := h.service.GetDistinctDepts(c.Request.Context(), level, parentLevel2, parentLevel3)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success", "data": depts})
}

// parseDepartmentMemberExcel 解析 Excel 文件
func parseDepartmentMemberExcel(path string) ([]*model.DepartmentMember, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("Excel 中没有 sheet")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, err
	}
	if len(rows) < 2 {
		return nil, fmt.Errorf("Excel 中没有数据行")
	}

	// 解析表头索引
	headerMap := make(map[string]int)
	for i, cell := range rows[0] {
		headerMap[cell] = i
	}

	requiredHeaders := []string{"一级部门", "二级部门", "姓名", "是否为编码人员", "是否为AI Native试点人员"}
	for _, h := range requiredHeaders {
		if _, ok := headerMap[h]; !ok {
			return nil, fmt.Errorf("缺少必要列: %s", h)
		}
	}

	var members []*model.DepartmentMember
	for _, row := range rows[1:] {
		if len(row) == 0 {
			continue
		}

		getStr := func(key string) string {
			idx, ok := headerMap[key]
			if !ok || idx >= len(row) {
				return ""
			}
			return row[idx]
		}

		getStrPtr := func(key string) *string {
			v := getStr(key)
			if v == "" {
				return nil
			}
			return &v
		}

		isYes := func(key string) bool {
			v := getStr(key)
			return v == "是" || v == "Y" || v == "yes" || v == "true"
		}

		// 解析试点时间
		var pilotDate *time.Time
		if pdStr := getStr("试点时间"); pdStr != "" {
			// 尝试多种格式
			for _, layout := range []string{"2006-01-02", "2006/01/02", "01/02/06", "2006-01-02 15:04:05", "1月2日", "1月02日", "01月2日", "01月02日"} {
				if d, err := time.Parse(layout, pdStr); err == nil {
					now := time.Now()
					// 对于只含月日的格式，补全为当前年份
					if layout == "1月2日" || layout == "1月02日" || layout == "01月2日" || layout == "01月02日" {
						d = time.Date(now.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
						// 如果日期在未来，可能是去年的数据，减一年
						if d.After(now) {
							d = d.AddDate(-1, 0, 0)
						}
					}
					pilotDate = &d
					break
				}
			}
			// 如果上述格式都失败，尝试 Excel 日期数值
			if pilotDate == nil {
				if excelDate, err := strconv.ParseFloat(pdStr, 64); err == nil {
					d := excelDateToTime(excelDate)
					pilotDate = &d
				}
			}
		}

		member := &model.DepartmentMember{
			Level1Dept:          getStr("一级部门"),
			Level2Dept:          getStr("二级部门"),
			Level3Dept:          getStrPtr("三级部门"),
			Level4Dept:          getStrPtr("四级部门"),
			Username:            getStr("姓名"),
			IsCoder:             isYes("是否为编码人员"),
			IsAINativePilot:     isYes("是否为AI Native试点人员"),
			PilotDate:           pilotDate,
			TeamAINativeContact: getStrPtr("团队AI接口人"),
			Remark:              getStrPtr("备注"),
		}

		if member.Username == "" || member.Level1Dept == "" || member.Level2Dept == "" {
			continue
		}

		members = append(members, member)
	}

	return members, nil
}

// excelDateToTime 将 Excel 日期数值转为 time.Time
func excelDateToTime(excelDate float64) time.Time {
	// Excel 日期从 1899-12-30 开始计算
	base := time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)
	return base.AddDate(0, 0, int(excelDate))
}
