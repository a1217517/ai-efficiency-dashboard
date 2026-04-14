# 视觉回归测试指南

## 目录结构

```
eval/visual/
├── baselines/          # 基线截图（人工确认过的"正确"版本）
├── snapshots/          # 当前截图（每次测试自动生成）
├── diffs/              # 差异图（红色像素表示差异）
└── scenarios/          # 测试场景脚本
    ├── homepage.sh
    └── profile.sh      # 示例：个人中心页
```

## 首次使用

### 1. 安装 agent-browser

```bash
./scripts/setup-agent-browser.sh
```

### 2. 启动项目并建立基线

```bash
# 建立首页基线
cd eval/visual/scenarios
./homepage.sh

# 首次运行会自动把当前截图设为基线
# 检查：ls ../baselines/homepage.png
```

## 添加新页面

### Step 1：创建测试脚本

复制 `homepage.sh` 并修改：

```bash
cp homepage.sh mypage.sh
```

修改以下关键行：
- `agent-browser open http://localhost:3000/my-page`
- `agent-browser screenshot --full eval/visual/snapshots/mypage-current.png`
- 对比文件路径：`mypage.png`

### Step 2：首次运行建立基线

```bash
chmod +x mypage.sh
./mypage.sh
```

### Step 3：添加到 CI

在 `.github/workflows/visual-regression.yml` 中添加步骤：

```yaml
      - name: Run mypage visual regression
        run: ./eval/visual/scenarios/mypage.sh
```

## 审查差异

当测试发现 diff 时：

1. 打开 `eval/visual/diffs/[page-name].png`
2. 观察红色像素区域
3. **如果是预期变更**（如设计更新）：
   ```bash
   cp eval/visual/snapshots/[page-name]-current.png eval/visual/baselines/[page-name].png
   git add eval/visual/baselines/[page-name].png
   git commit -m "chore: update visual baseline for [page-name]"
   ```
4. **如果是意外变更**（如 CSS 副作用）：
   - 修复代码
   - 重新运行测试直到 diff 消失

## 最佳实践

1. **基线截图必须提交到 Git**：它们是测试的"正确标准"
2. **snapshots 和 diffs 不提交**：在 `.gitignore` 中忽略
3. **在相同环境下运行**：视口、操作系统、浏览器版本都会影响像素
4. **容忍阈值**：默认使用 `0.1`，对于动画丰富的页面可调高到 `0.2`
