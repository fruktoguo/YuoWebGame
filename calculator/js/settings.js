/**
 * 计算器设置模块
 * 处理设置的加载、保存和更新
 */
class Settings {
    constructor(storage) {
        this.storage = storage;
        
        // 默认设置
        this.defaultSettings = {
            decimalPlaces: 10,
            maxHistoryItems: 50,
            useScientificNotation: false,
            showTimestamps: true,
            theme: 'light'
        };
        
        // 设置的限制范围
        this.settingLimits = {
            decimalPlaces: { min: 0, max: 15 },
            maxHistoryItems: { min: 1, max: 100 }
        };
        
        // 当前设置
        this.currentSettings = { ...this.defaultSettings };
        
        // 上一次有效的设置（用于恢复）
        this.lastValidSettings = null;
        
        // 从存储加载设置
        this.loadSettings();
        
        // 初始化UI
        this.initUI();
    }
    
    // 初始化UI
    initUI() {
        // 设置输入字段
        const decimalPlacesInput = document.getElementById('decimalPlaces');
        const maxHistoryItemsInput = document.getElementById('maxHistoryItems');
        const scientificNotationCheckbox = document.getElementById('scientificNotation');
        const showTimestampsCheckbox = document.getElementById('showTimestamps');
        
        // 设置初始值
        if (decimalPlacesInput) {
            decimalPlacesInput.value = this.currentSettings.decimalPlaces;
            
            decimalPlacesInput.addEventListener('change', () => {
                const value = parseInt(decimalPlacesInput.value, 10);
                
                // 验证输入值
                if (this.validateSetting('decimalPlaces', value)) {
                    this.updateSetting('decimalPlaces', value);
                } else {
                    // 如果不合法，恢复为当前值
                    decimalPlacesInput.value = this.currentSettings.decimalPlaces;
                    this.showSettingError("小数位数必须在0到15之间");
                }
            });
        }
        
        if (maxHistoryItemsInput) {
            maxHistoryItemsInput.value = this.currentSettings.maxHistoryItems;
            
            maxHistoryItemsInput.addEventListener('change', () => {
                const value = parseInt(maxHistoryItemsInput.value, 10);
                
                // 验证输入值
                if (this.validateSetting('maxHistoryItems', value)) {
                    this.updateSetting('maxHistoryItems', value);
                } else {
                    // 如果不合法，恢复为当前值
                    maxHistoryItemsInput.value = this.currentSettings.maxHistoryItems;
                    this.showSettingError("历史记录数量必须在1到100之间");
                }
            });
        }
        
        if (scientificNotationCheckbox) {
            scientificNotationCheckbox.checked = this.currentSettings.useScientificNotation;
            scientificNotationCheckbox.addEventListener('change', () => {
                this.updateSetting('useScientificNotation', scientificNotationCheckbox.checked);
            });
        }
        
        if (showTimestampsCheckbox) {
            showTimestampsCheckbox.checked = this.currentSettings.showTimestamps;
            showTimestampsCheckbox.addEventListener('change', () => {
                this.updateSetting('showTimestamps', showTimestampsCheckbox.checked);
            });
        }
    }
    
    // 加载设置
    loadSettings() {
        const savedSettings = this.storage.loadSettings();
        if (savedSettings) {
            // 验证加载的设置
            const validatedSettings = this.validateSettings(savedSettings);
            
            // 合并已保存的设置和默认设置，确保所有必需的字段都存在
            this.currentSettings = { ...this.defaultSettings, ...validatedSettings };
            
            // 保存有效设置用于恢复
            this.lastValidSettings = { ...this.currentSettings };
        }
    }
    
    // 保存设置
    saveSettings() {
        // 在保存前验证设置
        const validatedSettings = this.validateSettings(this.currentSettings);
        
        const saved = this.storage.saveSettings(validatedSettings);
        
        if (saved) {
            // 更新最后有效的设置
            this.lastValidSettings = { ...validatedSettings };
        }
        
        return saved;
    }
    
    // 更新单个设置
    updateSetting(key, value) {
        if (key in this.currentSettings) {
            // 备份当前设置
            this.lastValidSettings = { ...this.currentSettings };
            
            // 更新设置
            this.currentSettings[key] = value;
            
            // 保存设置
            const saved = this.saveSettings();
            
            if (saved) {
                // 触发设置变更事件
                document.dispatchEvent(new CustomEvent('settingsChanged', {
                    detail: { settings: this.getSettings() }
                }));
            } else {
                // 保存失败时恢复设置
                this.currentSettings = { ...this.lastValidSettings };
                this.showSettingError("保存设置失败");
            }
        }
    }
    
    // 显示设置错误
    showSettingError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        if (errorDisplay) {
            errorDisplay.textContent = message;
            errorDisplay.style.opacity = '1';
            
            // 3秒后自动清除错误
            setTimeout(() => {
                errorDisplay.textContent = '';
                errorDisplay.style.opacity = '0';
            }, 3000);
        }
    }
    
    // 验证单个设置项
    validateSetting(key, value) {
        switch (key) {
            case 'decimalPlaces':
                return Number.isInteger(value) && 
                       value >= this.settingLimits.decimalPlaces.min && 
                       value <= this.settingLimits.decimalPlaces.max;
                
            case 'maxHistoryItems':
                return Number.isInteger(value) && 
                       value >= this.settingLimits.maxHistoryItems.min && 
                       value <= this.settingLimits.maxHistoryItems.max;
                
            case 'useScientificNotation':
            case 'showTimestamps':
                return typeof value === 'boolean';
                
            default:
                return true;
        }
    }
    
    // 验证全部设置
    validateSettings(settings) {
        const validated = { ...settings };
        
        // 验证每个设置项，如果无效则使用默认值
        Object.keys(this.defaultSettings).forEach(key => {
            if (!this.validateSetting(key, settings[key])) {
                validated[key] = this.defaultSettings[key];
            }
        });
        
        return validated;
    }
    
    // 获取当前设置
    getSettings() {
        return { ...this.currentSettings };
    }
    
    // 重置为默认设置
    resetToDefaults() {
        // 备份当前设置
        this.lastValidSettings = { ...this.currentSettings };
        
        // 重置为默认设置
        this.currentSettings = { ...this.defaultSettings };
        
        // 保存设置
        this.saveSettings();
        
        // 更新UI
        this.updateUI();
        
        // 触发设置变更事件
        document.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: { settings: this.getSettings() }
        }));
    }
    
    // 更新UI以匹配当前设置
    updateUI() {
        const decimalPlacesInput = document.getElementById('decimalPlaces');
        const maxHistoryItemsInput = document.getElementById('maxHistoryItems');
        const scientificNotationCheckbox = document.getElementById('scientificNotation');
        const showTimestampsCheckbox = document.getElementById('showTimestamps');
        
        if (decimalPlacesInput) decimalPlacesInput.value = this.currentSettings.decimalPlaces;
        if (maxHistoryItemsInput) maxHistoryItemsInput.value = this.currentSettings.maxHistoryItems;
        if (scientificNotationCheckbox) scientificNotationCheckbox.checked = this.currentSettings.useScientificNotation;
        if (showTimestampsCheckbox) showTimestampsCheckbox.checked = this.currentSettings.showTimestamps;
    }
    
    // 恢复到上一个有效设置
    restorePreviousSettings() {
        if (this.lastValidSettings) {
            this.currentSettings = { ...this.lastValidSettings };
            this.updateUI();
            
            // 触发设置变更事件
            document.dispatchEvent(new CustomEvent('settingsChanged', {
                detail: { settings: this.getSettings() }
            }));
        }
    }
    
    // 应用当前主题
    applyCurrentTheme() {
        const theme = this.currentSettings.theme || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}

// 导出
export default Settings; 