package service

import (
	"context"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/repository"
)

type TeamSavingService struct {
	repo *repository.TeamSavingRepository
}

func NewTeamSavingService(repo *repository.TeamSavingRepository) *TeamSavingService {
	return &TeamSavingService{repo: repo}
}

func (s *TeamSavingService) Create(ctx context.Context, req *model.TeamSavingCreateRequest) (*model.TeamSaving, error) {
	savedMinutes := req.TraditionalMinutes - req.StandardMinutes
	if savedMinutes < 0 {
		savedMinutes = 0
	}
	t := &model.TeamSaving{
		TeamName:           req.TeamName,
		TraditionalMinutes: req.TraditionalMinutes,
		StandardMinutes:    req.StandardMinutes,
		Minutes:            savedMinutes,
		Hours:              savedMinutes / 60,
		SortOrder:          req.SortOrder,
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TeamSavingService) GetByID(ctx context.Context, id string) (*model.TeamSaving, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TeamSavingService) List(ctx context.Context, page, pageSize int, keyword string) (*model.TeamSavingListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	items, total, err := s.repo.List(ctx, page, pageSize, keyword)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &model.TeamSavingListResponse{
		List:       items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// ListAll 获取所有记录（用于图表展示）
func (s *TeamSavingService) ListAll(ctx context.Context) ([]model.TeamSaving, error) {
	return s.repo.ListAll(ctx)
}

func (s *TeamSavingService) Update(ctx context.Context, id string, req *model.TeamSavingUpdateRequest) error {
	updates := map[string]interface{}{}
	if req.TeamName != "" {
		updates["team_name"] = req.TeamName
	}
	if req.TraditionalMinutes > 0 {
		updates["traditional_minutes"] = req.TraditionalMinutes
	}
	if req.StandardMinutes > 0 {
		updates["standard_minutes"] = req.StandardMinutes
	}
	// 如果更新了传统或标准化耗时，重新计算节省时间
	if req.TraditionalMinutes > 0 || req.StandardMinutes > 0 {
		// 需要先获取当前数据
		current, err := s.repo.GetByID(ctx, id)
		if err != nil {
			return err
		}
		trad := current.TraditionalMinutes
		std := current.StandardMinutes
		if req.TraditionalMinutes > 0 {
			trad = req.TraditionalMinutes
		}
		if req.StandardMinutes > 0 {
			std = req.StandardMinutes
		}
		saved := trad - std
		if saved < 0 {
			saved = 0
		}
		updates["minutes"] = saved
		updates["hours"] = saved / 60
	}
	updates["sort_order"] = req.SortOrder

	return s.repo.Update(ctx, id, updates)
}

func (s *TeamSavingService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
