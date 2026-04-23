package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/wan-admin/ai-efficiency-admin/internal/model"
	"github.com/wan-admin/ai-efficiency-admin/internal/repository"
	"github.com/xuri/excelize/v2"
)

type TokenUsageService struct {
	repo *repository.TokenUsageRepository
}

func NewTokenUsageService(repo *repository.TokenUsageRepository) *TokenUsageService {
	return &TokenUsageService{repo: repo}
}

func (s *TokenUsageService) Create(ctx context.Context, req *model.TokenUsage) (*model.TokenUsage, error) {
	if err := s.repo.Create(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *TokenUsageService) GetByID(ctx context.Context, id string) (*model.TokenUsage, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TokenUsageService) List(ctx context.Context, page, pageSize int, keyword string) (*model.TokenUsageListResponse, error) {
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

	return &model.TokenUsageListResponse{
		List:       items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// ListAll 获取所有记录（用于图表展示）
func (s *TokenUsageService) ListAll(ctx context.Context) ([]model.TokenUsage, error) {
	return s.repo.ListAll(ctx)
}

func (s *TokenUsageService) Update(ctx context.Context, id string, updates map[string]interface{}) error {
	return s.repo.Update(ctx, id, updates)
}

func (s *TokenUsageService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ImportFromExcel 从 Excel 文件导入数据（按 username upsert，不重复）
func (s *TokenUsageService) ImportFromExcel(ctx context.Context, filePath string) (*model.TokenUsageImportResponse, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("打开 Excel 文件失败: %w", err)
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("读取工作表失败: %w", err)
	}

	if len(rows) < 2 {
		return nil, fmt.Errorf("Excel 文件数据行不足")
	}

	header := rows[0]
	colIndex := make(map[string]int)
	for i, col := range header {
		colIndex[strings.TrimSpace(col)] = i
	}

	// 基于 token4.xlsx 的必需列
	requiredCols := []string{"排名", "用户名", "职类", "Total Tokens", "请求次数", "总费用", "日均 Tokens"}
	for _, col := range requiredCols {
		if _, ok := colIndex[col]; !ok {
			return nil, fmt.Errorf("Excel 缺少必需列: %s", col)
		}
	}

	var items []*model.TokenUsage
	var errors []string

	for i, row := range rows[1:] {
		if len(row) == 0 {
			continue
		}

		item := &model.TokenUsage{}

		// 排名
		if idx, ok := colIndex["排名"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				rank, err := strconv.Atoi(val)
				if err != nil {
					errors = append(errors, fmt.Sprintf("第 %d 行排名格式错误: %s", i+2, val))
					continue
				}
				item.Rank = rank
			}
		}

		// 用户名
		if idx, ok := colIndex["用户名"]; ok && idx < len(row) {
			item.Username = strings.TrimSpace(row[idx])
		}
		if item.Username == "" {
			errors = append(errors, fmt.Sprintf("第 %d 行用户名为空", i+2))
			continue
		}

		// 职类
		if idx, ok := colIndex["职类"]; ok && idx < len(row) {
			item.RoleCategory = strings.TrimSpace(row[idx])
		}

		// Total Tokens
		if idx, ok := colIndex["Total Tokens"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				tokens, err := parseNumber(val)
				if err != nil {
					errors = append(errors, fmt.Sprintf("第 %d 行 Total Tokens 格式错误: %s", i+2, val))
					continue
				}
				item.TotalTokens = int64(tokens)
			}
		}

		// 内网 Tokens
		if idx, ok := colIndex["内网Tokens"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				tokens, err := parseNumber(val)
				if err == nil {
					item.InternalTokens = int64(tokens)
				}
			}
		}

		// 外网 Tokens
		if idx, ok := colIndex["外网Tokens"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				tokens, err := parseNumber(val)
				if err == nil {
					item.ExternalTokens = int64(tokens)
				}
			}
		}

		// 日均 Tokens
		if idx, ok := colIndex["日均 Tokens"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				tokens, err := parseNumber(val)
				if err == nil {
					item.DailyTokens = int64(tokens)
				}
			}
		}

		// 请求次数
		if idx, ok := colIndex["请求次数"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				count, err := parseNumber(val)
				if err != nil {
					errors = append(errors, fmt.Sprintf("第 %d 行请求次数格式错误: %s", i+2, val))
					continue
				}
				item.RequestCount = int64(count)
			}
		}

		// 内网请求
		if idx, ok := colIndex["内网请求"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				count, err := parseNumber(val)
				if err == nil {
					item.InternalRequestCount = int64(count)
				}
			}
		}

		// 外网请求
		if idx, ok := colIndex["外网请求"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				count, err := parseNumber(val)
				if err == nil {
					item.ExternalRequestCount = int64(count)
				}
			}
		}

		// 总费用
		if idx, ok := colIndex["总费用"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				cost, err := strconv.ParseFloat(val, 64)
				if err != nil {
					errors = append(errors, fmt.Sprintf("第 %d 行总费用格式错误: %s", i+2, val))
					continue
				}
				item.Cost = cost
			}
		}

		// 内网费用
		if idx, ok := colIndex["内网费用"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				cost, err := strconv.ParseFloat(val, 64)
				if err == nil {
					item.InternalCost = cost
				}
			}
		}

		// 外网费用
		if idx, ok := colIndex["外网费用"]; ok && idx < len(row) {
			val := strings.TrimSpace(row[idx])
			if val != "" {
				cost, err := strconv.ParseFloat(val, 64)
				if err == nil {
					item.ExternalCost = cost
				}
			}
		}

		items = append(items, item)
	}

	if len(items) == 0 {
		return &model.TokenUsageImportResponse{
			SuccessCount: 0,
			FailCount:    len(errors),
			Errors:       errors,
		}, nil
	}

	inserted, updated, err := s.repo.BatchUpsert(ctx, items)
	if err != nil {
		return nil, fmt.Errorf("批量 upsert 失败: %w", err)
	}

	return &model.TokenUsageImportResponse{
		SuccessCount: len(items),
		FailCount:    len(errors),
		Errors:       errors,
		BatchID:      fmt.Sprintf("新增%d/更新%d", inserted, updated),
	}, nil
}

// parseNumber 解析数字（支持带逗号的数字）
func parseNumber(s string) (float64, error) {
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, " ", "")
	return strconv.ParseFloat(s, 64)
}
