package service

import (
	"context"
	"strconv"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/repository"
)

type DepartmentMemberService struct {
	repo *repository.DepartmentMemberRepository
}

func NewDepartmentMemberService(repo *repository.DepartmentMemberRepository) *DepartmentMemberService {
	return &DepartmentMemberService{repo: repo}
}

func (s *DepartmentMemberService) Create(ctx context.Context, member *model.DepartmentMember) error {
	return s.repo.Create(ctx, member)
}

func (s *DepartmentMemberService) GetByID(ctx context.Context, id string) (*model.DepartmentMember, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *DepartmentMemberService) List(ctx context.Context, req model.DepartmentMemberListRequest) (*model.DepartmentMemberListResponse, error) {
	list, total, err := s.repo.List(ctx, req)
	if err != nil {
		return nil, err
	}

	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	page := req.Page
	if page <= 0 {
		page = 1
	}

	totalPage := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPage++
	}
	if totalPage == 0 {
		totalPage = 1
	}

	return &model.DepartmentMemberListResponse{
		List:      list,
		Total:     total,
		Page:      page,
		PageSize:  pageSize,
		TotalPage: totalPage,
	}, nil
}

func (s *DepartmentMemberService) Update(ctx context.Context, member *model.DepartmentMember) error {
	return s.repo.Update(ctx, member)
}

func (s *DepartmentMemberService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *DepartmentMemberService) UpsertBatch(ctx context.Context, members []*model.DepartmentMember) (*model.DepartmentMemberImportResult, error) {
	result := &model.DepartmentMemberImportResult{BatchID: "dept-member-batch"}

	// 按姓名去重：同一批 Excel 内相同姓名只保留最后一个
	seen := make(map[string]int) // username -> lastIndex
	for i, m := range members {
		if m.Username == "" || m.Level1Dept == "" || m.Level2Dept == "" {
			continue
		}
		seen[m.Username] = i
	}

	// 收集去重后的成员（保持原顺序中最后出现的）
	imported := make(map[int]bool)
	for _, idx := range seen {
		imported[idx] = true
	}

	for i, m := range members {
		if m.Username == "" || m.Level1Dept == "" || m.Level2Dept == "" {
			result.FailCount++
			result.Errors = append(result.Errors, "行"+strconv.Itoa(i+1)+": 姓名/一级部门/二级部门不能为空")
			continue
		}
		if !imported[i] {
			result.FailCount++
			result.Errors = append(result.Errors, "行"+strconv.Itoa(i+1)+": 与前面行姓名重复，已忽略")
			continue
		}
		if err := s.repo.UpsertByUsernameDept(ctx, m); err != nil {
			result.FailCount++
			result.Errors = append(result.Errors, "行"+strconv.Itoa(i+1)+": "+err.Error())
			continue
		}
		result.SuccessCount++
	}
	return result, nil
}

func (s *DepartmentMemberService) AggregateByDept(ctx context.Context, deptLevel string, level2Filter string, level3Filter *string) ([]model.DepartmentAggregation, error) {
	return s.repo.AggregateByDept(ctx, deptLevel, level2Filter, level3Filter)
}

func (s *DepartmentMemberService) GetDistinctDepts(ctx context.Context, level string, parentLevel2 string, parentLevel3 *string) ([]string, error) {
	return s.repo.GetDistinctDepts(ctx, level, parentLevel2, parentLevel3)
}

func (s *DepartmentMemberService) AutoMigrate() error {
	return s.repo.AutoMigrate()
}
