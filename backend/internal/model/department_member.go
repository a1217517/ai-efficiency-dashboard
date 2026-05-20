package model

import (
	"time"

	"gorm.io/gorm"
)

// DepartmentMember 部门人员信息
type DepartmentMember struct {
	ID                   string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Level1Dept           string         `json:"level1_dept" gorm:"not null;size:100;index:idx_dept_member,unique"`           // 一级部门
	Level2Dept           string         `json:"level2_dept" gorm:"not null;size:100;index:idx_dept_member,unique"`           // 二级部门
	Level3Dept           *string        `json:"level3_dept" gorm:"size:100;index:idx_dept_member,unique"`                    // 三级部门
	Level4Dept           *string        `json:"level4_dept" gorm:"size:100;index:idx_dept_member,unique"`                    // 四级部门
	Username             string         `json:"username" gorm:"not null;size:100;index:idx_dept_member,unique"`              // 姓名
	IsCoder              bool           `json:"is_coder" gorm:"not null;default:false"`                                        // 是否为编码人员
	IsAINativePilot      bool           `json:"is_ai_native_pilot" gorm:"not null;default:false"`                              // 是否为AI Native试点人员
	PilotDate            *time.Time     `json:"pilot_date" gorm:"type:date"`                                                 // 试点时间
	TeamAINativeContact  *string        `json:"team_ai_native_contact" gorm:"size:100"`                                      // 团队AI接口人
	Remark               *string        `json:"remark" gorm:"size:500"`                                                      // 备注
	CreatedAt            time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt            time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt            gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (DepartmentMember) TableName() string {
	return "department_members"
}

// DepartmentMemberImportResult 导入结果
type DepartmentMemberImportResult struct {
	SuccessCount int      `json:"success_count"`
	FailCount    int      `json:"fail_count"`
	Errors       []string `json:"errors"`
	BatchID      string   `json:"batch_id"`
}

// DepartmentMemberListRequest 列表查询请求
type DepartmentMemberListRequest struct {
	Level2Dept    string `json:"level2_dept" form:"level2_dept"`     // 二级部门过滤
	Level3Dept    string `json:"level3_dept" form:"level3_dept"`     // 三级部门过滤
	Level4Dept    string `json:"level4_dept" form:"level4_dept"`     // 四级部门过滤
	Keyword       string `json:"keyword" form:"keyword"`               // 姓名关键词
	IsCoder       *bool  `json:"is_coder" form:"is_coder"`             // 是否编码人员
	IsAINativePilot *bool `json:"is_ai_native_pilot" form:"is_ai_native_pilot"` // 是否AI Native试点
	Page          int    `json:"page" form:"page"`
	PageSize      int    `json:"page_size" form:"page_size"`
}

// DepartmentMemberListResponse 列表响应
type DepartmentMemberListResponse struct {
	List      []DepartmentMember `json:"list"`
	Total     int64                `json:"total"`
	Page      int                  `json:"page"`
	PageSize  int                  `json:"page_size"`
	TotalPage int                  `json:"total_page"`
}

// DepartmentAggregation 部门聚合统计
type DepartmentAggregation struct {
	DeptLevel       string  `json:"dept_level"`        // 部门层级标识 level2/level3/level4
	DeptName        string  `json:"dept_name"`         // 部门名称
	TotalCount      int64   `json:"total_count"`       // 总人数
	CoderCount      int64   `json:"coder_count"`       // 编码人员数
	PilotCount      int64   `json:"pilot_count"`       // AI Native试点人员数
	PilotRatio      float64 `json:"pilot_ratio"`       // 试点占比
	CoderPilotCount int64   `json:"coder_pilot_count"` // 既是编码又是试点的人数
}
