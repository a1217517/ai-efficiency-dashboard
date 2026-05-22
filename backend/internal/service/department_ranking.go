package service

import (
	"context"
	"time"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/repository"
)

type DeptRankingService struct {
	repo *repository.DeptRankingRepository
}

func NewDeptRankingService(repo *repository.DeptRankingRepository) *DeptRankingService {
	return &DeptRankingService{repo: repo}
}

func (s *DeptRankingService) ListSiliconRanking(ctx context.Context, level string, parents map[string]string, startDate, endDate *time.Time, limit int) (*model.DeptRankingListResponse, error) {
	items, err := s.repo.ListSiliconRanking(ctx, level, parents, startDate, endDate, limit)
	if err != nil {
		return nil, err
	}
	return &model.DeptRankingListResponse{
		List:   items,
		Level:  level,
		Metric: "silicon",
		Total:  int64(len(items)),
		Limit:  limit,
	}, nil
}

func (s *DeptRankingService) ListTokenRanking(ctx context.Context, level string, parents map[string]string, startDate, endDate *time.Time, limit int) (*model.DeptRankingListResponse, error) {
	items, err := s.repo.ListTokenRanking(ctx, level, parents, startDate, endDate, limit)
	if err != nil {
		return nil, err
	}
	return &model.DeptRankingListResponse{
		List:   items,
		Level:  level,
		Metric: "token",
		Total:  int64(len(items)),
		Limit:  limit,
	}, nil
}

func (s *DeptRankingService) ListMembers(ctx context.Context, parents map[string]string, startDate, endDate *time.Time) ([]repository.MemberDetail, error) {
	return s.repo.ListMembers(ctx, parents, startDate, endDate)
}
