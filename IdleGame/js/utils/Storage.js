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
    static saveGame(game) {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                character: this.serializeCharacter(game.character),
                combat: this.serializeCombat(game.combat),
                equipment: this.serializeEquipment(game.equipment),
                skills: this.serializeSkills(game.skills),
                resources: {
                    gold: game.gold || 0,
                    gems: game.gems || 0
                },
                settings: game.settings || {},
                progress: {
                    currentStage: game.currentStage || 1,
                    unlockedFeatures: game.unlockedFeatures || []
                }
            };

            const compressed = this.compressData(saveData);
            Utils.setStorage(this.SAVE_KEY, compressed);
            
            console.log('游戏已保存');
            return true;
        } catch (error) {
            console.error('保存游戏失败:', error);
            Utils.showNotification('保存游戏失败', 'error');
            return false;
        }
    }

    // 加载游戏
    static loadGame() {
        try {
            const compressed = Utils.getStorage(this.SAVE_KEY);
            if (!compressed) {
                return null; // 没有存档
            }

            const saveData = this.decompressData(compressed);
            
            // 版本兼容性检查
            if (!this.isCompatibleVersion(saveData.version)) {
                console.warn('存档版本不兼容:', saveData.version);
                return null;
            }

            console.log('游戏已加载');
            return saveData;
        } catch (error) {
            console.error('加载游戏失败:', error);
            Utils.showNotification('加载游戏失败', 'error');
            return null;
        }
    }

    // 序列化角色数据
    static serializeCharacter(character) {
        return {
            name: character.name,
            level: character.level,
            exp: character.exp,
            class: character.class,
            stats: { ...character.stats },
            baseStats: { ...character.baseStats },
            freePoints: character.freePoints,
            currentHP: character.currentHP,
            maxHP: character.maxHP
        };
    }

    // 序列化战斗数据
    static serializeCombat(combat) {
        return {
            isActive: combat.isActive,
            currentEnemy: combat.currentEnemy ? {
                ...combat.currentEnemy,
                currentHP: combat.currentEnemy.currentHP
            } : null,
            stage: combat.stage,
            autoMode: combat.autoMode
        };
    }

    // 序列化装备数据
    static serializeEquipment(equipment) {
        return {
            equipped: { ...equipment.equipped },
            inventory: equipment.inventory.map(item => item ? { ...item } : null),
            inventorySize: equipment.inventorySize
        };
    }

    // 序列化技能数据
    static serializeSkills(skills) {
        return {
            learned: { ...skills.learned },
            points: skills.points,
            autocast: { ...skills.autocast },
            cooldowns: { ...skills.cooldowns }
        };
    }

    // 数据压缩 (简单的JSON压缩)
    static compressData(data) {
        return JSON.stringify(data);
    }

    // 数据解压
    static decompressData(compressed) {
        return JSON.parse(compressed);
    }

    // 版本兼容性检查
    static isCompatibleVersion(version) {
        const currentVersion = '1.0.0';
        return version === currentVersion; // 简单的版本检查
    }

    // 导出存档
    static exportSave() {
        try {
            const saveData = Utils.getStorage(this.SAVE_KEY);
            if (!saveData) {
                Utils.showNotification('没有可导出的存档', 'warning');
                return;
            }

            const dataStr = JSON.stringify(saveData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `idle_game_save_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            Utils.showNotification('存档已导出', 'success');
        } catch (error) {
            console.error('导出存档失败:', error);
            Utils.showNotification('导出存档失败', 'error');
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
                    
                    // 验证存档格式
                    if (!this.validateSaveData(saveData)) {
                        reject(new Error('存档格式无效'));
                        return;
                    }

                    Utils.setStorage(this.SAVE_KEY, saveData);
                    Utils.showNotification('存档已导入', 'success');
                    resolve(saveData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    }

    // 验证存档数据
    static validateSaveData(data) {
        const requiredFields = ['version', 'timestamp', 'character', 'resources'];
        return requiredFields.every(field => data.hasOwnProperty(field));
    }

    // 重置游戏数据
    static resetGame() {
        if (confirm('确定要重置游戏吗？这将删除所有进度！')) {
            Utils.removeStorage(this.SAVE_KEY);
            Utils.showNotification('游戏已重置', 'info');
            location.reload();
        }
    }

    // 获取存档信息
    static getSaveInfo() {
        const saveData = Utils.getStorage(this.SAVE_KEY);
        if (!saveData) {
            return null;
        }

        return {
            version: saveData.version,
            timestamp: saveData.timestamp,
            character: {
                name: saveData.character?.name || '未知',
                level: saveData.character?.level || 1,
                class: saveData.character?.class || 'warrior'
            },
            resources: saveData.resources || { gold: 0, gems: 0 }
        };
    }

    // 备份存档
    static backupSave() {
        const saveData = Utils.getStorage(this.SAVE_KEY);
        if (saveData) {
            const backupKey = `${this.SAVE_KEY}_backup_${Date.now()}`;
            Utils.setStorage(backupKey, saveData);
            
            // 只保留最近的3个备份
            this.cleanupBackups();
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
            Utils.showNotification('备份已恢复', 'success');
            return true;
        }
        return false;
    }
} 