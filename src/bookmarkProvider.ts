import * as vscode from 'vscode';
import * as path from 'path';
import { BookmarkManager, Bookmark, BookmarkFolder } from './bookmarkManager';

type TreeItem = BookmarkTreeItem | FolderItem;

export class BookmarkProvider implements vscode.TreeDataProvider<TreeItem>, vscode.TreeDragAndDropController<TreeItem> {
    dropMimeTypes = ['application/vnd.code.tree.bookmarkView'];
    dragMimeTypes = ['text/uri-list'];

    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private bookmarkManager: BookmarkManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!element) {
            // 返回根级别的项目
            return Promise.resolve(this.getRootItems());
        } else if (element instanceof FolderItem) {
            // 返回文件夹中的项目
            return Promise.resolve(this.getFolderItems(element.id));
        }
        return Promise.resolve([]);
    }

    private getRootItems(): TreeItem[] {
        const items: TreeItem[] = [];
        
        // 添加根级别的文件夹
        const folders = this.bookmarkManager.getAllFolders().filter(f => !f.parentId);
        folders.forEach(folder => {
            items.push(new FolderItem(folder.id, folder.name));
        });

        // 添加根级别的书签
        const bookmarks = this.bookmarkManager.getAllBookmarks().filter(b => !b.folderId);
        bookmarks.forEach(bookmark => {
            items.push(new BookmarkTreeItem(bookmark));
        });

        // 按sortOrder排序
        return items.sort((a, b) => {
            const aOrder = a instanceof BookmarkTreeItem ? (a.bookmark.sortOrder || 0) : 
                          a instanceof FolderItem ? (this.bookmarkManager.getFolder(a.id)?.sortOrder || 0) : 0;
            const bOrder = b instanceof BookmarkTreeItem ? (b.bookmark.sortOrder || 0) : 
                          b instanceof FolderItem ? (this.bookmarkManager.getFolder(b.id)?.sortOrder || 0) : 0;
            return aOrder - bOrder;
        });
    }

    private getFolderItems(folderId: string): TreeItem[] {
        const items: TreeItem[] = [];
        
        // 添加子文件夹
        const folders = this.bookmarkManager.getAllFolders().filter(f => f.parentId === folderId);
        folders.forEach(folder => {
            items.push(new FolderItem(folder.id, folder.name));
        });

        // 添加文件夹中的书签
        const bookmarks = this.bookmarkManager.getAllBookmarks().filter(b => b.folderId === folderId);
        bookmarks.forEach(bookmark => {
            items.push(new BookmarkTreeItem(bookmark));
        });

        // 按sortOrder排序
        return items.sort((a, b) => {
            const aOrder = a instanceof BookmarkTreeItem ? (a.bookmark.sortOrder || 0) : 
                          a instanceof FolderItem ? (this.bookmarkManager.getFolder(a.id)?.sortOrder || 0) : 0;
            const bOrder = b instanceof BookmarkTreeItem ? (b.bookmark.sortOrder || 0) : 
                          b instanceof FolderItem ? (this.bookmarkManager.getFolder(b.id)?.sortOrder || 0) : 0;
            return aOrder - bOrder;
        });
    }

    async handleDrag(source: readonly TreeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        dataTransfer.set('application/vnd.code.tree.bookmarkView', new vscode.DataTransferItem(source));
    }

    async handleDrop(target: TreeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const transferItem = dataTransfer.get('application/vnd.code.tree.bookmarkView');
        if (!transferItem) {
            return;
        }

        const source = transferItem.value as readonly TreeItem[];
        if (!source || source.length === 0) {
            return;
        }

        const sourceItem = source[0]; // 只处理单个拖拽项

        // 如果没有目标，说明拖拽到空白区域，移动到根目录
        if (!target) {
            if (sourceItem instanceof BookmarkTreeItem) {
                this.bookmarkManager.moveBookmark(sourceItem.bookmark.id, undefined);
            } else if (sourceItem instanceof FolderItem) {
                this.bookmarkManager.moveFolder(sourceItem.id, undefined);
            }
            this.refresh();
            return;
        }

        // 检查是否为同级排序
        const isSameLevelReorder = this.isSameLevelItems(sourceItem, target);
        
        if (isSameLevelReorder) {
            // 同级排序
            const sourceId = sourceItem instanceof BookmarkTreeItem ? sourceItem.bookmark.id : sourceItem.id;
            const targetId = target instanceof BookmarkTreeItem ? target.bookmark.id : target.id;
            
            // 拖拽到目标项之前（上方）
            this.bookmarkManager.reorderItemsByDrag(sourceId, targetId, 'before');
        } else {
            // 移动到不同文件夹
            const targetFolderId = target instanceof FolderItem ? target.id : 
                                  target instanceof BookmarkTreeItem ? target.bookmark.folderId : 
                                  undefined;

            if (sourceItem instanceof BookmarkTreeItem) {
                this.bookmarkManager.moveBookmark(sourceItem.bookmark.id, targetFolderId);
            } else if (sourceItem instanceof FolderItem) {
                this.bookmarkManager.moveFolder(sourceItem.id, targetFolderId);
            }
        }

        this.refresh();
    }

    // 检查两个项目是否在同一级别
    private isSameLevelItems(source: TreeItem, target: TreeItem): boolean {
        let sourceParentId: string | undefined;
        let targetParentId: string | undefined;

        // 获取源项目的父级ID
        if (source instanceof BookmarkTreeItem) {
            sourceParentId = source.bookmark.folderId;
        } else if (source instanceof FolderItem) {
            const folder = this.bookmarkManager.getFolder(source.id);
            sourceParentId = folder?.parentId;
        }

        // 获取目标项目的父级ID
        if (target instanceof BookmarkTreeItem) {
            targetParentId = target.bookmark.folderId;
        } else if (target instanceof FolderItem) {
            const folder = this.bookmarkManager.getFolder(target.id);
            targetParentId = folder?.parentId;
        }

        return sourceParentId === targetParentId;
    }
}

export class BookmarkTreeItem extends vscode.TreeItem {
    constructor(
        public readonly bookmark: Bookmark,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(bookmark.name, collapsibleState);

        this.id = bookmark.id;
        this.tooltip = `${bookmark.name} - ${path.basename(bookmark.uri.fsPath)}:${bookmark.position.line + 1}`;
        this.description = `${path.basename(bookmark.uri.fsPath)}:${bookmark.position.line + 1}`;
        this.contextValue = 'bookmark';
        
        this.command = {
            command: 'vscode.open',
            title: 'Open',
            arguments: [bookmark.uri, { selection: new vscode.Range(bookmark.position, bookmark.position) }]
        };

        this.iconPath = new vscode.ThemeIcon('bookmark');
    }
}

export class FolderItem extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
    ) {
        super(label, collapsibleState);

        this.contextValue = 'folder';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
} 