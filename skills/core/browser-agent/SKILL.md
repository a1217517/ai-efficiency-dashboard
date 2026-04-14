# Browser Agent Skill

基于 `agent-browser` 的浏览器自动化与视觉回归测试技能包。

## 前置条件

运行本 skill 前，请确保已安装：

```bash
./scripts/setup-agent-browser.sh
```

验证安装：
```bash
agent-browser --version
pixelmatch --help
```

## 核心能力

1. **页面截图**：捕获页面或元素的视觉快照
2. **交互验证**：模拟点击、输入、滚动等用户操作
3. **视觉回归**：对比当前截图与基线，发现 UI 漂移
4. **E2E 辅助**：配合 Playwright 补充真实浏览器验证

## 常用命令

### 启动浏览器并打开页面
```bash
agent-browser open http://localhost:3000
agent-browser wait --load networkidle
```

### 全页截图
```bash
agent-browser screenshot --full eval/visual/snapshots/homepage.png
```

### 指定元素截图
```bash
agent-browser screenshot --selector "header" eval/visual/snapshots/header.png
```

### 模拟交互后截图
```bash
agent-browser open http://localhost:3000/login
agent-browser type --selector "input[name=email]" "test@example.com"
agent-browser click --selector "button[type=submit]"
agent-browser wait --load networkidle
agent-browser screenshot --full eval/visual/snapshots/login-submitted.png
```

## 视觉回归工作流

### 1. 建立基线（首次运行）
```bash
cd eval/visual/scenarios
./homepage.sh
# 首次会自动将当前截图复制为 baseline
```

### 2. 日常回归（后续修改后）
```bash
./homepage.sh
# 如果有 diff，会在 eval/visual/diffs/ 中生成差异图
```

### 3. 审查 diff
- 打开 `eval/visual/diffs/homepage.png`
- 红色像素表示差异区域
- 如果差异是预期的，更新 baseline：
  ```bash
  cp eval/visual/snapshots/homepage-current.png eval/visual/baselines/homepage.png
  ```

## 项目级配置

全局配置文件：`~/.config/agent-browser/config.json`

可配置项：
- `viewport`：默认视口大小
- `deviceScaleFactor`：设备像素比
- `fullPage`：是否默认全页截图
- `browser.headless`：是否无头模式
- `browser.executablePath`：自定义 Chrome 路径

## CI 集成

GitHub Actions 示例：见 `.github/workflows/visual-regression.yml`

关键点：
- CI 中必须安装 Chrome/Chromium
- 使用 `--no-sandbox` 参数运行无头浏览器
- 失败时上传 `eval/visual/diffs/` 作为 artifact

##  Troubleshooting

**Q: agent-browser 找不到 Chrome**
> A: 设置环境变量 `CHROME_PATH` 或修改 `config.json` 中的 `executablePath`

**Q: 截图全是空白**
> A: 增加 `wait` 时间，或改用 `wait --load networkidle`

**Q: pixelmatch 报错 "images do not have the same dimensions"**
> A: 视口大小变化导致。固定 viewport 或在同一设备上运行。
