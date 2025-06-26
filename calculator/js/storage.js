/**
 * 存储模块
 * 负责本地存储操作，增强错误处理与配额检查
 */
class Storage {
    constructor(storagePrefix = 'calculator_') {
        this.prefix = storagePrefix;
        this.historyKey = `${this.prefix}history`;
        this.expressionKey = `${this.prefix}expression`;
        this.settingsKey = `${this.prefix}settings`;
        this.constantsKey = `${this.prefix}constants`;
        
        // 检查浏览器是否支持localStorage
        this.isStorageAvailable = this.checkStorageAvailability();
        
        // 存储配额
        this.storageQuota = {
            max: 5 * 1024 * 1024, // 假设最大5MB
            used: 0
        };
        
        // 初始化时检查已使用空间
        if (this.isStorageAvailable) {
            this.checkStorageUsage();
        }
    }
    
    /**
     * 检查localStorage是否可用
     * @returns {boolean} 是否可用
     */
    checkStorageAvailability() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('localStorage不可用，无法保存数据:', e);
            return false;
        }
    }
    
    /**
     * 检查存储空间使用情况
     * @returns {Object} 使用情况统计
     */
    checkStorageUsage() {
        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                totalSize += key.length + value.length;
            }
            
            this.storageQuota.used = totalSize;
            return {
                used: totalSize,
                max: this.storageQuota.max,
                percentage: (totalSize / this.storageQuota.max) * 100
            };
        } catch (e) {
            console.error("检查存储使用情况失败:", e);
            return null;
        }
    }
    
    /**
     * 检查是否即将达到存储限制
     * @returns {boolean} 是否接近限制
     */
    isNearQuotaLimit() {
        const usage = this.checkStorageUsage();
        if (!usage) return false;
        
        // 如果使用了超过80%的空间，返回警告
        return usage.percentage > 80;
    }
    
    /**
     * 保存设置到本地存储
     * @param {Object} settings - 设置对象
     * @returns {boolean} 是否保存成功
     */
    saveSettings(settings) {
        if (!this.isStorageAvailable) return false;
        
        try {
            const settingsString = JSON.stringify(settings);
            localStorage.setItem(this.settingsKey, settingsString);
            return true;
        } catch (e) {
            console.error("保存设置失败:", e);
            
            // 如果是存储空间限制，尝试清除部分数据再保存
            if (e.name === 'QuotaExceededError') {
                // 清除历史记录来节省空间
                try {
                    localStorage.removeItem(this.historyKey);
                    
                    // 再次尝试保存
                    try {
                        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
                        return true;
                    } catch (error) {
                        console.error("第二次尝试保存设置失败:", error);
                    }
                } catch (clearError) {
                    console.error("清除历史记录失败:", clearError);
                }
            }
            
            return false;
        }
    }
    
    /**
     * 从本地存储加载设置
     * @returns {Object|null} 设置对象或null
     */
    loadSettings() {
        if (!this.isStorageAvailable) return null;
        
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : null;
        } catch (e) {
            console.error("加载设置失败:", e);
            return null;
        }
    }
    
    /**
     * 保存历史记录到本地存储
     * @param {Array} history - 历史记录数组
     * @returns {boolean} 是否保存成功
     */
    saveHistory(history) {
        if (!this.isStorageAvailable) return false;
        
        try {
            // 如果历史记录太大，可能会导致存储失败
            // 做一个简单的限制
            if (history.length > 100) {
                history = history.slice(-100);
            }
            
            localStorage.setItem(this.historyKey, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error("保存历史记录失败:", e);
            
            // 如果是存储空间限制，尝试减少历史记录数量
            if (e.name === 'QuotaExceededError') {
                try {
                    const reducedHistory = history.slice(-Math.floor(history.length / 2));
                    localStorage.setItem(this.historyKey, JSON.stringify(reducedHistory));
                    return true;
                } catch (error) {
                    console.error("减少后保存历史记录失败:", error);
                }
            }
            
            return false;
        }
    }
    
    /**
     * 从本地存储加载历史记录
     * @returns {Array|null} 历史记录数组或null
     */
    loadHistory() {
        if (!this.isStorageAvailable) return [];
        
        try {
            const history = localStorage.getItem(this.historyKey);
            
            // 防止解析错误
            if (!history) return [];
            
            return JSON.parse(history);
        } catch (e) {
            console.error("加载历史记录失败:", e);
            return [];
        }
    }
    
    /**
     * 保存当前表达式到本地存储
     * @param {string} expression - 表达式字符串
     * @returns {boolean} 是否保存成功
     */
    saveExpression(expression) {
        if (!this.isStorageAvailable) return false;
        
        try {
            localStorage.setItem(this.expressionKey, expression);
            return true;
        } catch (e) {
            console.error("保存表达式失败:", e);
            return false;
        }
    }
    
    /**
     * 从本地存储加载表达式
     * @returns {string|null} 表达式字符串或null
     */
    loadExpression() {
        if (!this.isStorageAvailable) return null;
        
        try {
            return localStorage.getItem(this.expressionKey);
        } catch (e) {
            console.error("加载表达式失败:", e);
            return null;
        }
    }
    
    /**
     * 保存常量到本地存储
     * @param {Object} constants - 常量对象
     * @returns {boolean} 是否保存成功
     */
    saveConstants(constants) {
        if (!this.isStorageAvailable) return false;
        
        try {
            const constantsString = JSON.stringify(constants);
            localStorage.setItem(this.constantsKey, constantsString);
            return true;
        } catch (e) {
            console.error("保存常量失败:", e);
            return false;
        }
    }
    
    /**
     * 从本地存储加载常量
     * @returns {Object|null} 常量对象或null
     */
    loadConstants() {
        if (!this.isStorageAvailable) return {};
        
        try {
            const constants = localStorage.getItem(this.constantsKey);
            return constants ? JSON.parse(constants) : {};
        } catch (e) {
            console.error("加载常量失败:", e);
            return {};
        }
    }
    
    /**
     * 清除所有存储的数据
     * @returns {boolean} 是否清除成功
     */
    clearAll() {
        if (!this.isStorageAvailable) return false;
        
        try {
            localStorage.removeItem(this.historyKey);
            localStorage.removeItem(this.expressionKey);
            localStorage.removeItem(this.constantsKey);
            // 不清除设置，因为用户可能希望保留个性化设置
            return true;
        } catch (e) {
            console.error("清除数据失败:", e);
            return false;
        }
    }
    
    /**
     * 处理存储配额超出错误
     * 当存储空间不足时，自动清理部分数据
     */
    handleQuotaExceeded() {
        console.warn("存储空间已满，尝试清理旧数据");
        
        try {
            // 首先尝试清理历史记录
            const history = this.loadHistory();
            if (history && history.length > 10) {
                // 只保留最近的10条历史
                this.saveHistory(history.slice(-10));
                console.log("已自动清理过期历史记录");
            }
        } catch (e) {
            console.error("清理存储失败:", e);
        }
    }
}

export default Storage; 