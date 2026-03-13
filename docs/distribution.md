# Text Idle - 打包与分发

## 快速打包

```powershell
npm run build:dist    # 构建单文件可执行程序
npm run package:dist  # 构建并打成 zip 包
```

输出：
- `dist/text-idle.exe`：Windows 单文件可执行程序（内含前端）
- `dist/text-idle-windows.zip`：含 exe 和 README 的压缩包

## 分发给朋友

1. 运行 `npm run package:dist`
2. 将 `dist/text-idle-windows.zip` 发给朋友
3. 朋友解压后：
   - 双击 `text-idle.exe` 启动
   - 浏览器打开 http://localhost:8080
   - 注册账号即可试玩

存档保存在同目录下的 `text-idle.db`。

## 跨平台构建（可选）

```powershell
# Linux
$env:GOOS="linux"; $env:GOARCH="amd64"; npm run package:dist

# macOS
$env:GOOS="darwin"; $env:GOARCH="amd64"; npm run package:dist
```

输出为 `dist/text-idle-<platform>.zip`。
