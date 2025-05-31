# VSCode Bookmark Manager Plugin

[中文文档](README.zh-cn.md)

A user-friendly VSCode bookmark management plugin that supports folder organization, nested folders, and drag-and-drop functionality for both bookmarks and folders.

## Features

✨ **Core Features**
- 📌 Create bookmarks in code files for quick navigation
- 📁 Organize bookmarks using custom directories
- 🖱️ Drag-and-drop support for easy bookmark management
- ✏️ Customizable bookmark and directory names
- 🎨 High-visibility bookmark icons across all themes
- 📤 Export bookmarks to JSON files
- 📥 Import bookmarks from JSON files

![recording.gif](https://cdn.nlark.com/yuque/0/2025/gif/56576899/1748683855018-35c32f01-0d00-4f38-b66a-484ad578be20.gif)



## Installation & Setup

### Development Environment
1. Clone or download this repository
2. In the project root directory, run:
   ```bash
   npm install
   npm run compile
   ```
3. Press `F5` in VSCode to start debugging

### Package Installation
1. Install the vsce tool:
   ```bash
   npm install -g vsce
   ```
2. Package the extension:
   ```bash
   vsce package
   ```
3. Install the generated `.vsix` file in VSCode

## Usage Guide

### Adding Bookmarks
1. Place the cursor on the line you want to bookmark
2. Add a bookmark using any of these methods:
   - Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on macOS)
   - Right-click and select "Bookmark: Add Bookmark" from the context menu
   - Click the bookmark icon in the activity bar and use the "Add Bookmark" button

### Managing Bookmarks
- **Navigate**: Click on a bookmark in the sidebar to jump to its location
- **Rename**: Right-click a bookmark and select "Rename Bookmark"
- **Delete**: Right-click a bookmark and select "Delete Bookmark"
- **Move**: Drag and drop bookmarks to different folders or positions

### Using Directories
- **Create Directory**: Click the "Create Folder" button in the toolbar
- **Nested Directories**: Create multi-level directory structures
- **Organize Bookmarks**: Drag and drop bookmarks into directories for categorization
- **Bulk Operations**: When deleting a directory, its bookmarks are automatically moved to the parent directory
- **Rename Directory**: Right-click a directory and select "Rename Directory"
- **Delete Directory**: Right-click a directory and select "Delete Directory"

### Export and Import
- **Export Bookmarks**: Click the "Export Bookmarks" button in the toolbar and choose save location
- **Import Bookmarks**: Click the "Import Bookmarks" button and select a JSON file
- **Data Format**: Exported JSON files include version info, export time, bookmark and folder data

## Detailed Features

### Bookmark Decoration
- Orange bookmark icons displayed in the editor gutter

### Data Persistence
- All bookmarks and directory structures are automatically saved
- Bookmarks persist after VSCode restart
- Support for local JSON file backup

### Smart Suggestions
- Automatically extracts current line code as default bookmark name
- Displays filename and line number information

### Context Menu Operations
- Rename and delete operations for bookmarks and folders via right-click menu
- Clear operation grouping to prevent accidental operations

## Keyboard Shortcuts

| Function | Windows/Linux | macOS |
|----------|--------------|--------|
| Add Bookmark | `Ctrl+Shift+B` | `Cmd+Shift+B` |


## Contributing

Issues and Pull Requests are welcome!

## License

MIT License



# VSCode 书签插件 (Bookmark Manager)

一个简单易用的 VSCode 书签管理插件，支持文件夹组织、文件夹嵌套、书签和文件夹任意拖放。

## 功能特性

✨ **核心功能**
- 📌 在代码文件中创建书签，实现快速导航
- 📁 使用自定义目录组织书签
- 🖱️ 支持拖放功能，轻松整理书签
- ✏️ 可自定义书签和目录名称
- 🎨 在所有主题中提供高可见度的书签图标
- 📤 支持导出书签为 JSON 文件
- 📥 支持从 JSON 文件导入书签

![recording.gif](https://cdn.nlark.com/yuque/0/2025/gif/56576899/1748683855018-35c32f01-0d00-4f38-b66a-484ad578be20.gif)

## 安装与运行

### 开发环境运行
1. 克隆或下载此项目
2. 在项目根目录执行：
   ```bash
   npm install
   npm run compile
   ```
3. 在 VSCode 中按 `F5` 启动调试

### 打包安装
1. 安装 vsce 工具：
   ```bash
   npm install -g vsce
   ```
2. 打包扩展：
   ```bash
   vsce package
   ```
3. 在 VSCode 中安装生成的 `.vsix` 文件

## 使用方法

### 添加书签
1. 将光标放在要添加书签的行上
2. 使用以下任一方法添加书签：
   - 按下 `Ctrl+Shift+B`（在 macOS 上为 `Cmd+Shift+B`）
   - 右键点击并从上下文菜单中选择"书签: 添加书签"
   - 点击活动栏中的书签图标，然后使用"添加书签"按钮

### 管理书签
- **导航**：点击侧边栏中的书签可导航到对应位置
- **重命名**：右键点击书签，选择"重命名书签"
- **删除**：右键点击书签，选择"删除书签"
- **移动**：拖放书签到不同的文件夹或位置

### 使用目录
- **创建目录**：点击工具栏中的"创建文件夹"按钮
- **嵌套目录**：支持创建多级目录结构
- **组织书签**：将书签拖放到目录中进行分类
- **批量操作**：删除目录时，其中的书签会自动移到父级目录
- **重命名目录**：右键点击目录，选择"重命名目录"
- **删除目录**：右键点击目录，选择"删除目录"

### 导出和导入
- **导出书签**：点击工具栏中的"导出书签"按钮，选择保存位置
- **导入书签**：点击"导入书签"按钮，选择 JSON 文件
- **数据格式**：导出的 JSON 文件包含版本信息、导出时间、书签和文件夹数据

## 功能详解

### 书签装饰
- 在编辑器的边栏显示橙色书签图标

### 数据持久化
- 所有书签和目录结构自动保存
- 重启 VSCode 后书签依然存在
- 支持导出到本地 JSON 文件进行备份

### 智能提示
- 添加书签时自动提取当前行代码作为默认名称
- 显示文件名和行号信息

### 右键菜单操作
- 书签和文件夹的重命名、删除操作通过右键菜单访问
- 清晰的操作分组，避免误操作

## 快捷键

| 功能 | Windows/Linux | macOS |
|------|---------------|-------|
| 添加书签 | `Ctrl+Shift+B` | `Cmd+Shift+B` |

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
