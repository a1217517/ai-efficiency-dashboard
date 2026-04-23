package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/repository"
)

type SiliconContentService struct {
	repo *repository.SiliconContentRepository
}

func NewSiliconContentService(repo *repository.SiliconContentRepository) *SiliconContentService {
	return &SiliconContentService{repo: repo}
}

func (s *SiliconContentService) Create(ctx context.Context, sc *model.SiliconContent) error {
	return s.repo.Create(ctx, sc)
}

func (s *SiliconContentService) GetByID(ctx context.Context, id string) (*model.SiliconContent, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *SiliconContentService) List(ctx context.Context, page, pageSize int, keyword string) (*model.SiliconContentListResponse, error) {
	items, total, err := s.repo.List(ctx, page, pageSize, keyword)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &model.SiliconContentListResponse{
		List:       items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *SiliconContentService) ListAll(ctx context.Context) ([]model.SiliconContent, error) {
	return s.repo.ListAll(ctx)
}

func (s *SiliconContentService) Update(ctx context.Context, id string, updates map[string]interface{}) error {
	return s.repo.Update(ctx, id, updates)
}

func (s *SiliconContentService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *SiliconContentService) GetStats(ctx context.Context) (*model.SiliconContentStats, error) {
	return s.repo.GetStats(ctx)
}

// ImportExcel 从 Excel 导入硅含量数据
func (s *SiliconContentService) ImportExcel(ctx context.Context, filePath string) (*model.SiliconContentImportResponse, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("无法打开 Excel 文件: %v", err)
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("读取 Excel 失败: %v", err)
	}

	if len(rows) < 2 {
		return nil, fmt.Errorf("Excel 文件为空或格式不正确")
	}

	// 解析表头，找到列索引
	header := rows[0]
	colIndex := make(map[string]int)
	for i, col := range header {
		colIndex[strings.TrimSpace(col)] = i
	}

	// 必需的列
	requiredCols := []string{"排名", "用户名", "职类", "硅基含量", "硅基代码量", "总代码量"}
	for _, col := range requiredCols {
		if _, ok := colIndex[col]; !ok {
			return nil, fmt.Errorf("Excel 缺少必需列: %s", col)
		}
	}

	var items []*model.SiliconContent
	var errors []string

	for i, row := range rows[1:] {
		lineNum := i + 2

		if len(row) < len(requiredCols) {
			continue
		}

		rank, err := strconv.Atoi(strings.TrimSpace(row[colIndex["排名"]]))
		if err != nil {
			errors = append(errors, fmt.Sprintf("第 %d 行: 排名格式错误", lineNum))
			continue
		}

		username := strings.TrimSpace(row[colIndex["用户名"]])
		if username == "" {
			errors = append(errors, fmt.Sprintf("第 %d 行: 用户名为空", lineNum))
			continue
		}

		roleCategory := strings.TrimSpace(row[colIndex["职类"]])

		siliconPct, err := strconv.ParseFloat(strings.TrimSpace(row[colIndex["硅基含量"]]), 64)
		if err != nil {
			errors = append(errors, fmt.Sprintf("第 %d 行: 硅基含量格式错误", lineNum))
			continue
		}

		aiLines, err := strconv.ParseInt(strings.TrimSpace(row[colIndex["硅基代码量"]]), 10, 64)
		if err != nil {
			errors = append(errors, fmt.Sprintf("第 %d 行: 硅基代码量格式错误", lineNum))
			continue
		}

		totalLines, err := strconv.ParseInt(strings.TrimSpace(row[colIndex["总代码量"]]), 10, 64)
		if err != nil {
			errors = append(errors, fmt.Sprintf("第 %d 行: 总代码量格式错误", lineNum))
			continue
		}

		items = append(items, &model.SiliconContent{
			Rank:              rank,
			Username:          username,
			RoleCategory:      roleCategory,
			SiliconPercentage: siliconPct,
			AILines:           aiLines,
			TotalLines:        totalLines,
		})
	}

	inserted, updated, err := s.repo.BatchUpsert(ctx, items)
	if err != nil {
		return nil, fmt.Errorf("批量导入失败: %v", err)
	}

	return &model.SiliconContentImportResponse{
		SuccessCount: int(inserted + updated),
		FailCount:    len(errors),
		Errors:       errors,
	}, nil
}
