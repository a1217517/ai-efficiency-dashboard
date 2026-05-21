package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"gorm.io/gorm"
)

type DepartmentMemberRepository struct {
	db *gorm.DB
}

func NewDepartmentMemberRepository(db *gorm.DB) *DepartmentMemberRepository {
	return &DepartmentMemberRepository{db: db}
}

// AutoMigrate 自动迁移表结构
func (r *DepartmentMemberRepository) AutoMigrate() error {
	return r.db.AutoMigrate(&model.DepartmentMember{})
}

// Create 创建单条记录
func (r *DepartmentMemberRepository) Create(ctx context.Context, member *model.DepartmentMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

// UpsertByUsernameDept 根据姓名创建或更新（按 username 匹配，包含已软删除记录）
func (r *DepartmentMemberRepository) UpsertByUsernameDept(ctx context.Context, member *model.DepartmentMember) error {
	var existing model.DepartmentMember
	result := r.db.WithContext(ctx).Unscoped().Where("username = ?", member.Username).First(&existing)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return r.db.WithContext(ctx).Create(member).Error
		}
		return result.Error
	}
	// 恢复并更新已有记录（即使之前被软删除）
	member.ID = existing.ID
	return r.db.WithContext(ctx).Unscoped().Save(member).Error
}

// GetByID 根据ID获取
func (r *DepartmentMemberRepository) GetByID(ctx context.Context, id string) (*model.DepartmentMember, error) {
	var member model.DepartmentMember
	if err := r.db.WithContext(ctx).First(&member, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &member, nil
}

// List 分页查询
func (r *DepartmentMemberRepository) List(ctx context.Context, req model.DepartmentMemberListRequest) ([]model.DepartmentMember, int64, error) {
	db := r.db.WithContext(ctx).Model(&model.DepartmentMember{})

	if req.Keyword != "" {
		db = db.Where("username ILIKE ?", "%"+req.Keyword+"%")
	}
	if req.Level2Dept != "" {
		db = db.Where("level2_dept = ?", req.Level2Dept)
	}
	if req.Level3Dept != "" {
		db = db.Where("level3_dept = ?", req.Level3Dept)
	}
	if req.Level4Dept != "" {
		db = db.Where("level4_dept = ?", req.Level4Dept)
	}
	if req.IsCoder != nil {
		db = db.Where("is_coder = ?", *req.IsCoder)
	}
	if req.IsAINativePilot != nil {
		db = db.Where("is_ai_native_pilot = ?", *req.IsAINativePilot)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 || req.PageSize > 500 {
		req.PageSize = 20
	}

	var members []model.DepartmentMember
	if err := db.Order("level2_dept, level3_dept, level4_dept, username").
		Offset((req.Page - 1) * req.PageSize).
		Limit(req.PageSize).
		Find(&members).Error; err != nil {
		return nil, 0, err
	}
	return members, total, nil
}

// Update 更新
func (r *DepartmentMemberRepository) Update(ctx context.Context, member *model.DepartmentMember) error {
	return r.db.WithContext(ctx).Save(member).Error
}

// Delete 软删除
func (r *DepartmentMemberRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&model.DepartmentMember{}, "id = ?", id).Error
}

// GetDistinctDepts 获取某层级的所有部门
func (r *DepartmentMemberRepository) GetDistinctDepts(ctx context.Context, level string, parentLevel2 string, parentLevel3 *string) ([]string, error) {
	var depts []string
	var column string
	switch level {
	case "level2":
		column = "level2_dept"
	case "level3":
		column = "level3_dept"
	case "level4":
		column = "level4_dept"
	default:
		return nil, fmt.Errorf("unknown dept level: %s", level)
	}

	db := r.db.WithContext(ctx).Model(&model.DepartmentMember{}).
		Select("DISTINCT " + column).
		Where(column + " IS NOT NULL AND " + column + " != ''")

	if parentLevel2 != "" {
		db = db.Where("level2_dept = ?", parentLevel2)
	}
	if parentLevel3 != nil && *parentLevel3 != "" {
		db = db.Where("level3_dept = ?", *parentLevel3)
	}

	var results []string
	if err := db.Pluck(column, &results).Error; err != nil {
		return nil, err
	}
	// 过滤空值
	for _, d := range results {
		if strings.TrimSpace(d) != "" {
			depts = append(depts, d)
		}
	}
	return depts, nil
}

// AggregateByDept 按部门层级聚合统计
func (r *DepartmentMemberRepository) AggregateByDept(ctx context.Context, deptLevel string, level2Filter string, level3Filter *string) ([]model.DepartmentAggregation, error) {
	var groupCol string
	switch deptLevel {
	case "level2":
		groupCol = "level2_dept"
	case "level3":
		groupCol = "level3_dept"
	case "level4":
		groupCol = "level4_dept"
	default:
		return nil, fmt.Errorf("unknown dept level: %s", deptLevel)
	}

	db := r.db.WithContext(ctx).Model(&model.DepartmentMember{}).
		Select(groupCol + " as dept_name, " +
			"COUNT(*) as total_count, " +
			"SUM(CASE WHEN is_coder THEN 1 ELSE 0 END) as coder_count, " +
			"SUM(CASE WHEN is_ai_native_pilot THEN 1 ELSE 0 END) as pilot_count, " +
			"SUM(CASE WHEN is_coder AND is_ai_native_pilot THEN 1 ELSE 0 END) as coder_pilot_count").
		Where(groupCol + " IS NOT NULL AND " + groupCol + " != ''")

	if level2Filter != "" {
		db = db.Where("level2_dept = ?", level2Filter)
	}
	if level3Filter != nil && *level3Filter != "" {
		db = db.Where("level3_dept = ?", *level3Filter)
	}

	var agg []struct {
		DeptName        string
		TotalCount      int64
		CoderCount      int64
		PilotCount      int64
		CoderPilotCount int64
	}
	if err := db.Group(groupCol).Find(&agg).Error; err != nil {
		return nil, err
	}

	var result []model.DepartmentAggregation
	for _, a := range agg {
		var ratio float64
		if a.TotalCount > 0 {
			ratio = float64(a.PilotCount) / float64(a.TotalCount) * 100
		}
		result = append(result, model.DepartmentAggregation{
			DeptLevel:       deptLevel,
			DeptName:        a.DeptName,
			TotalCount:      a.TotalCount,
			CoderCount:      a.CoderCount,
			PilotCount:      a.PilotCount,
			PilotRatio:      ratio,
			CoderPilotCount: a.CoderPilotCount,
		})
	}
	return result, nil
}
