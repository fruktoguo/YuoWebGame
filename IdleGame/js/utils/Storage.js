// 游戏存档系统
class Storage {
    static SAVE_KEY = 'idleGame_save';
    static AUTO_SAVE_INTERVAL = 30000; // 30秒自动存档
    
    static autoSaveTimer = null;

    // 初始化自动存档
    static initAutoSave(game) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.saveGame(game);
        }, this.AUTO_SAVE_INTERVAL);
    }

    // 停止自动存档
    static stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // 保存游戏
    static saveGame(saveData) {
        try {
            Utils.setStorage(this.SAVE_KEY, saveData);
            console.log('游戏保存成功');
        } catch (error) {
            console.error('保存游戏失败:', error);
        }
    }

    // 加载游戏
    static loadGame() {
        try {
            const saveData = Utils.getStorage(this.SAVE_KEY);
            if (!saveData) {
                return null; // 没有存档
            }

            console.log('游戏数据加载成功');
            return saveData;
        } catch (error) {
            console.error('加载游戏失败:', error);
            return null;
        }
    }

    // 清除存档
    static clearSave() {
        try {
            Utils.removeStorage(this.SAVE_KEY);
            console.log('存档已清除');
        } catch (error) {
            console.error('清除存档失败:', error);
        }
    }

    // 检查是否有存档
    static hasSave() {
        return Utils.getStorage(this.SAVE_KEY) !== null;
    }

    // 获取存档信息
    static getSaveInfo() {
        const saveData = Utils.getStorage(this.SAVE_KEY);
        if (!saveData) {
            return null;
        }

        return {
            version: saveData.version || '1.0.0',
            timestamp: saveData.timestamp || Date.now(),
            character: {
                name: saveData.character?.name || '冒险者',
                level: saveData.character?.level || 1,
                class: saveData.character?.class || 'warrior'
            }
        };
    }

    // 导出存档
    static exportSave() {
        try {
            const saveData = Utils.getStorage(this.SAVE_KEY);
            if (!saveData) {
                console.log('没有存档可导出');
                return;
            }

            const dataStr = JSON.stringify(saveData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `idle_game_save_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            console.log('存档导出成功');
        } catch (error) {
            console.error('导出存档失败:', error);
        }
    }

    // 导入存档
    static importSave(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('没有选择文件'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    
                    // 简单验证存档格式
                    if (!saveData.character) {
                        reject(new Error('存档格式无效'));
                        return;
                    }

                    Utils.setStorage(this.SAVE_KEY, saveData);
                    console.log('存档导入成功');
                    resolve(saveData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    }

    // 备份存档
    static backupSave() {
        const saveData = Utils.getStorage(this.SAVE_KEY);
        if (saveData) {
            const backupKey = `${this.SAVE_KEY}_backup_${Date.now()}`;
            Utils.setStorage(backupKey, saveData);
            
            // 只保留最近的3个备份
            this.cleanupBackups();
            console.log('存档备份成功');
        }
    }

    // 清理旧备份
    static cleanupBackups() {
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith(`${this.SAVE_KEY}_backup_`)
        );
        
        if (keys.length > 3) {
            keys.sort().slice(0, keys.length - 3).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    }

    // 获取可用备份
    static getAvailableBackups() {
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith(`${this.SAVE_KEY}_backup_`)
        );
        
        return keys.map(key => {
            const timestamp = parseInt(key.split('_').pop());
            const saveData = Utils.getStorage(key);
            return {
                key,
                timestamp,
                date: new Date(timestamp).toLocaleString(),
                character: saveData?.character
            };
        }).sort((a, b) => b.timestamp - a.timestamp);
    }

    // 恢复备份
    static restoreBackup(backupKey) {
        const backupData = Utils.getStorage(backupKey);
        if (backupData) {
            Utils.setStorage(this.SAVE_KEY, backupData);
            console.log('备份恢复成功');
            return true;
        }
        return false;
    }
} 