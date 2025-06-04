import * as vscode from 'vscode';

export interface Bookmark {
    id: string;
    name: string;
    uri: vscode.Uri;
    position: vscode.Position;
    folderId?: string;
    sortOrder?: number;
}

export interface BookmarkFolder {
    id: string;
    name: string;
    parentId?: string;
    sortOrder?: number;
}

export class BookmarkManager {
    private bookmarks: Map<string, Bookmark> = new Map();
    private folders: Map<string, BookmarkFolder> = new Map();
    private storageKey = 'bookmarks';
    private foldersKey = 'bookmarkFolders';

    constructor(private context: vscode.ExtensionContext) {
        this.loadBookmarks();
    }

    private loadBookmarks() {
        const storedBookmarks = this.context.globalState.get<any[]>(this.storageKey, []);
        const storedFolders = this.context.globalState.get<any[]>(this.foldersKey, []);

        storedBookmarks.forEach(data => {
            const bookmark: Bookmark = {
                id: data.id,
                name: data.name,
                uri: vscode.Uri.parse(data.uri),
                position: new vscode.Position(data.position.line, data.position.character),
                folderId: data.folderId,
                sortOrder: data.sortOrder
            };
            this.bookmarks.set(bookmark.id, bookmark);
        });

        storedFolders.forEach(data => {
            this.folders.set(data.id, data);
        });
    }

    private saveBookmarks() {
        const bookmarksArray = Array.from(this.bookmarks.values()).map(bookmark => ({
            id: bookmark.id,
            name: bookmark.name,
            uri: bookmark.uri.toString(),
            position: {
                line: bookmark.position.line,
                character: bookmark.position.character
            },
            folderId: bookmark.folderId,
            sortOrder: bookmark.sortOrder
        }));

        const foldersArray = Array.from(this.folders.values());

        this.context.globalState.update(this.storageKey, bookmarksArray);
        this.context.globalState.update(this.foldersKey, foldersArray);
    }

    addBookmark(uri: vscode.Uri, position: vscode.Position, name: string, folderId?: string): string {
        const id = this.generateId();
        const bookmark: Bookmark = { id, name, uri, position, folderId, sortOrder: this.getNextSortOrder() };
        this.bookmarks.set(id, bookmark);
        this.saveBookmarks();
        return id;
    }

    removeBookmark(id: string) {
        this.bookmarks.delete(id);
        this.saveBookmarks();
    }

    renameBookmark(id: string, newName: string) {
        const bookmark = this.bookmarks.get(id);
        if (bookmark) {
            bookmark.name = newName;
            this.saveBookmarks();
        }
    }

    moveBookmark(bookmarkId: string, targetFolderId?: string) {
        const bookmark = this.bookmarks.get(bookmarkId);
        if (bookmark) {
            bookmark.folderId = targetFolderId;
            this.saveBookmarks();
        }
    }

    createFolder(name: string, parentId?: string): string {
        const id = this.generateId();
        const folder: BookmarkFolder = { id, name, parentId, sortOrder: this.getNextSortOrder() };
        this.folders.set(id, folder);
        this.saveBookmarks();
        return id;
    }

    deleteFolder(id: string) {
        // 删除文件夹时，将其中的书签移到父文件夹或根目录
        const folder = this.folders.get(id);
        if (folder) {
            // 移动书签到父文件夹
            this.bookmarks.forEach(bookmark => {
                if (bookmark.folderId === id) {
                    bookmark.folderId = folder.parentId;
                }
            });

            // 更新子文件夹的父级
            this.folders.forEach(subFolder => {
                if (subFolder.parentId === id) {
                    subFolder.parentId = folder.parentId;
                }
            });

            this.folders.delete(id);
            this.saveBookmarks();
        }
    }

    renameFolder(id: string, newName: string) {
        const folder = this.folders.get(id);
        if (folder) {
            folder.name = newName;
            this.saveBookmarks();
        }
    }

    moveFolder(folderId: string, targetParentId?: string) {
        const folder = this.folders.get(folderId);
        if (folder && !this.wouldCreateCycle(folderId, targetParentId)) {
            folder.parentId = targetParentId;
            this.saveBookmarks();
        }
    }

    private wouldCreateCycle(folderId: string, targetParentId?: string): boolean {
        if (!targetParentId) return false;
        
        let currentId = targetParentId;
        while (currentId) {
            if (currentId === folderId) return true;
            const parent = this.folders.get(currentId);
            currentId = parent?.parentId || '';
        }
        return false;
    }

    getBookmarksForFile(uri: vscode.Uri): Bookmark[] {
        return Array.from(this.bookmarks.values()).filter(
            bookmark => bookmark.uri.toString() === uri.toString()
        );
    }

    getAllBookmarks(): Bookmark[] {
        return Array.from(this.bookmarks.values());
    }

    getAllFolders(): BookmarkFolder[] {
        return Array.from(this.folders.values());
    }

    getBookmark(id: string): Bookmark | undefined {
        return this.bookmarks.get(id);
    }

    getFolder(id: string): BookmarkFolder | undefined {
        return this.folders.get(id);
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private getNextSortOrder(): number {
        const bookmarkSortOrders = Array.from(this.bookmarks.values()).map(bookmark => bookmark.sortOrder || 0);
        const folderSortOrders = Array.from(this.folders.values()).map(folder => folder.sortOrder || 0);
        const allSortOrders = [...bookmarkSortOrders, ...folderSortOrders];
        return allSortOrders.length > 0 ? Math.max(...allSortOrders) + 1 : 0;
    }

    // 重新排序书签
    reorderBookmarks(bookmarkIds: string[], startIndex: number, endIndex: number) {
        const items = this.getAllBookmarksInSameContainer(bookmarkIds[0]);
        const [removed] = items.splice(startIndex, 1);
        items.splice(endIndex, 0, removed);
        
        // 更新排序值
        items.forEach((item, index) => {
            if (item.type === 'bookmark') {
                const bookmark = this.bookmarks.get(item.id);
                if (bookmark) {
                    bookmark.sortOrder = index;
                }
            } else if (item.type === 'folder') {
                const folder = this.folders.get(item.id);
                if (folder) {
                    folder.sortOrder = index;
                }
            }
        });
        
        this.saveBookmarks();
    }

    // 获取同一容器中的所有项目（书签和文件夹）
    getAllBookmarksInSameContainer(itemId: string): { id: string, type: 'bookmark' | 'folder', sortOrder: number }[] {
        let containerId: string | undefined;
        
        // 确定容器ID
        const bookmark = this.bookmarks.get(itemId);
        const folder = this.folders.get(itemId);
        
        if (bookmark) {
            containerId = bookmark.folderId;
        } else if (folder) {
            containerId = folder.parentId;
        }
        
        const items: { id: string, type: 'bookmark' | 'folder', sortOrder: number }[] = [];
        
        // 添加同一容器中的书签
        this.bookmarks.forEach(bookmark => {
            if (bookmark.folderId === containerId) {
                items.push({
                    id: bookmark.id,
                    type: 'bookmark',
                    sortOrder: bookmark.sortOrder || 0
                });
            }
        });
        
        // 添加同一容器中的文件夹
        this.folders.forEach(folder => {
            if (folder.parentId === containerId) {
                items.push({
                    id: folder.id,
                    type: 'folder',
                    sortOrder: folder.sortOrder || 0
                });
            }
        });
        
        // 按sortOrder排序
        return items.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // 根据拖拽位置重新排序
    reorderItemsByDrag(sourceId: string, targetId: string, position: 'before' | 'after') {
        const container = this.getAllBookmarksInSameContainer(sourceId);
        const sourceIndex = container.findIndex(item => item.id === sourceId);
        let targetIndex = container.findIndex(item => item.id === targetId);
        
        if (sourceIndex === -1 || targetIndex === -1) {
            return;
        }
        
        // 调整目标位置
        if (position === 'after') {
            targetIndex++;
        }
        
        // 如果源在目标之前，目标索引需要减1
        if (sourceIndex < targetIndex) {
            targetIndex--;
        }
        
        this.reorderBookmarks([sourceId], sourceIndex, targetIndex);
    }

    // 导出书签数据
    exportBookmarks(): any {
        return {
            version: "1.0.0",
            exportDate: new Date().toISOString(),
            bookmarks: Array.from(this.bookmarks.values()).map(bookmark => ({
                id: bookmark.id,
                name: bookmark.name,
                uri: bookmark.uri.toString(),
                position: {
                    line: bookmark.position.line,
                    character: bookmark.position.character
                },
                folderId: bookmark.folderId,
                sortOrder: bookmark.sortOrder
            })),
            folders: Array.from(this.folders.values()).map(folder => ({
                id: folder.id,
                name: folder.name,
                parentId: folder.parentId,
                sortOrder: folder.sortOrder
            }))
        };
    }

    // 导入书签数据
    importBookmarks(data: any): { success: boolean; message: string } {
        try {
            // 验证数据格式
            if (!data.version || !data.bookmarks || !data.folders) {
                return { success: false, message: "无效的书签数据格式" };
            }

            // 清空现有数据（可选，或者可以选择合并）
            const shouldClearExisting = true; // 可以添加用户选择
            if (shouldClearExisting) {
                this.bookmarks.clear();
                this.folders.clear();
            }

            // 导入文件夹
            data.folders.forEach((folderData: any) => {
                const folder: BookmarkFolder = {
                    id: this.generateId(), // 重新生成ID避免冲突
                    name: folderData.name,
                    parentId: folderData.parentId,
                    sortOrder: folderData.sortOrder || this.getNextSortOrder()
                };
                this.folders.set(folder.id, folder);
            });

            // 创建旧ID到新ID的映射
            const oldToNewFolderIdMap = new Map<string, string>();
            const foldersArray = Array.from(this.folders.values());
            data.folders.forEach((oldFolder: any, index: number) => {
                if (oldFolder.id) {
                    oldToNewFolderIdMap.set(oldFolder.id, foldersArray[index].id);
                }
            });

            // 更新文件夹的parentId引用
            this.folders.forEach(folder => {
                if (folder.parentId && oldToNewFolderIdMap.has(folder.parentId)) {
                    folder.parentId = oldToNewFolderIdMap.get(folder.parentId);
                }
            });

            // 导入书签
            data.bookmarks.forEach((bookmarkData: any) => {
                const bookmark: Bookmark = {
                    id: this.generateId(), // 重新生成ID避免冲突
                    name: bookmarkData.name,
                    uri: vscode.Uri.parse(bookmarkData.uri),
                    position: new vscode.Position(bookmarkData.position.line, bookmarkData.position.character),
                    folderId: bookmarkData.folderId && oldToNewFolderIdMap.has(bookmarkData.folderId) 
                        ? oldToNewFolderIdMap.get(bookmarkData.folderId) 
                        : undefined,
                    sortOrder: bookmarkData.sortOrder || this.getNextSortOrder()
                };
                this.bookmarks.set(bookmark.id, bookmark);
            });

            // 保存数据
            this.saveBookmarks();

            return { 
                success: true, 
                message: `成功导入 ${data.bookmarks.length} 个书签和 ${data.folders.length} 个文件夹` 
            };
        } catch (error) {
            return { 
                success: false, 
                message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}` 
            };
        }
    }
} 