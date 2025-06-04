import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BookmarkProvider } from './bookmarkProvider';
import { BookmarkManager } from './bookmarkManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('Bookmark extension is now active!');

    const bookmarkManager = new BookmarkManager(context);
    const bookmarkProvider = new BookmarkProvider(bookmarkManager);

    // 注册树数据提供器
    const treeView = vscode.window.createTreeView('bookmarkView', {
        treeDataProvider: bookmarkProvider,
        showCollapseAll: true,
        canSelectMany: false,
        dragAndDropController: bookmarkProvider
    });

    // 监听文件夹展开和折叠事件
    treeView.onDidExpandElement(e => {
        bookmarkProvider.onDidExpandElement(e.element);
    });

    treeView.onDidCollapseElement(e => {
        bookmarkProvider.onDidCollapseElement(e.element);
    });

    // 注册命令
    context.subscriptions.push(
        vscode.commands.registerCommand('bookmark.addBookmark', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No active editor');
                return;
            }

            const document = editor.document;
            const position = editor.selection.active;
            const lineText = document.lineAt(position.line).text.trim();
            
            const name = await vscode.window.showInputBox({
                prompt: 'Enter bookmark name',
                value: lineText || `Line ${position.line + 1}`
            });

            if (name) {
                bookmarkManager.addBookmark(document.uri, position, name);
                bookmarkProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('bookmark.removeBookmark', (bookmark) => {
            bookmarkManager.removeBookmark(bookmark.id);
            bookmarkProvider.refresh();
        }),

        vscode.commands.registerCommand('bookmark.renameBookmark', async (bookmark) => {
            const newName = await vscode.window.showInputBox({
                prompt: 'Enter new bookmark name',
                value: bookmark.label
            });

            if (newName) {
                bookmarkManager.renameBookmark(bookmark.id, newName);
                bookmarkProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('bookmark.createFolder', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter folder name'
            });

            if (name) {
                bookmarkManager.createFolder(name);
                bookmarkProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('bookmark.renameFolder', async (folder) => {
            const newName = await vscode.window.showInputBox({
                prompt: 'Enter new folder name',
                value: folder.label
            });

            if (newName) {
                bookmarkManager.renameFolder(folder.id, newName);
                bookmarkProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('bookmark.deleteFolder', (folder) => {
            bookmarkManager.deleteFolder(folder.id);
            bookmarkProvider.refresh();
        }),

        vscode.commands.registerCommand('bookmark.createSubFolder', async (folder) => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter subfolder name'
            });

            if (name) {
                bookmarkManager.createFolder(name, folder.id);
                bookmarkProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('bookmark.refresh', () => {
            bookmarkProvider.refresh();
        }),

        // 导出书签命令
        vscode.commands.registerCommand('bookmark.exportBookmarks', async () => {
            try {
                const data = bookmarkManager.exportBookmarks();
                
                // 让用户选择保存位置
                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(path.join(
                        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                        `bookmarks-${new Date().toISOString().split('T')[0]}.json`
                    )),
                    filters: {
                        'JSON Files': ['json'],
                        'All Files': ['*']
                    }
                });

                if (saveUri) {
                    const jsonString = JSON.stringify(data, null, 2);
                    await vscode.workspace.fs.writeFile(saveUri, Buffer.from(jsonString, 'utf8'));
                    vscode.window.showInformationMessage(`书签已导出到: ${saveUri.fsPath}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }),

        // 导入书签命令
        vscode.commands.registerCommand('bookmark.importBookmarks', async () => {
            try {
                // 让用户选择文件
                const openUri = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        'JSON Files': ['json'],
                        'All Files': ['*']
                    }
                });

                if (openUri && openUri[0]) {
                    const fileContent = await vscode.workspace.fs.readFile(openUri[0]);
                    const jsonString = Buffer.from(fileContent).toString('utf8');
                    const data = JSON.parse(jsonString);

                    // 确认是否要替换现有书签
                    const choice = await vscode.window.showWarningMessage(
                        '导入书签将替换所有现有书签和文件夹。是否继续？',
                        { modal: true },
                        '继续导入',
                        '取消'
                    );

                    if (choice === '继续导入') {
                        const result = bookmarkManager.importBookmarks(data);
                        if (result.success) {
                            bookmarkProvider.refresh();
                            vscode.window.showInformationMessage(result.message);
                        } else {
                            vscode.window.showErrorMessage(result.message);
                        }
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }),

        treeView
    );

    // 在编辑器中显示书签装饰
    const bookmarkDecorationType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: context.asAbsolutePath('resources/bookmark-icon.svg'),
        gutterIconSize: 'contain'
    });

    // 更新所有编辑器的书签装饰
    const updateDecorations = () => {
        vscode.window.visibleTextEditors.forEach(editor => {
            const bookmarks = bookmarkManager.getBookmarksForFile(editor.document.uri);
            const ranges = bookmarks.map(b => new vscode.Range(b.position, b.position));
            editor.setDecorations(bookmarkDecorationType, ranges);
        });
    };

    // 监听编辑器变化
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => updateDecorations()),
        vscode.workspace.onDidChangeTextDocument(() => updateDecorations())
    );

    // 初始更新
    updateDecorations();
}

export function deactivate() {} 