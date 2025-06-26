/**
 * 计算器应用入口文件
 * 引入和初始化所有模块
 */
import Calculator from './calculator.js';
import Settings from './settings.js';
import Storage from './storage.js';
import Display from './display.js';

// 等待DOM加载完成
window.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('应用初始化开始...');
        
        // 初始化存储
        const storage = new Storage();
        console.log('存储模块初始化完成');
        
        // 初始化设置
        const settings = new Settings(storage);
        console.log('设置模块初始化完成');
        
        // 尝试应用主题，如果方法存在的话
        if (typeof settings.applyCurrentTheme === 'function') {
            settings.applyCurrentTheme();
        }
        
        // 初始化显示
        const display = new Display(settings.getSettings());
        console.log('显示模块初始化完成');
        
        // 初始化计算器
        const calculator = new Calculator(settings, storage, display);
        console.log('计算器模块初始化完成');
        
        // 监听设置变更
        document.addEventListener('settingsChanged', (e) => {
            // 更新Display模块的设置
            display.updateSettings(e.detail.settings);
            calculator.updateHistory(); // 刷新历史记录以应用新设置
            console.log("应用入口检测到设置变更:", e.detail.settings);
        });
        
        // 清除历史记录按钮
        const clearHistoryBtn = document.getElementById('clearHistory');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('确定要清除所有历史记录吗?')) {
                    calculator.history = [];
                    calculator.updateHistory();
                    calculator.saveHistoryToStorage();
                }
            });
        }
        
        // 为清除数据按钮添加事件
        const clearDataBtn = document.getElementById('clearData');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                if (confirm('确定要清除所有计算数据吗？这将删除历史记录、当前表达式和所有常量。')) {
                    // 触发自定义事件，通知计算器数据将被清除
                    document.dispatchEvent(new CustomEvent('calculatorDataCleared'));
                    
                    // 清除存储数据
                    storage.clearAll();
                }
            });
        }
        
        // 恢复数据按钮
        const undoBtn = document.getElementById('undoClearData');
        if (undoBtn) {
            undoBtn.disabled = true; // 初始禁用
        }
        
        // 检测浏览器兼容性
        checkBrowserCompatibility();
        
        // 导出到全局作用域以便调试
        window.calculatorApp = {
            calculator,
            settings,
            storage,
            display
        };
        
        console.log('应用初始化完成!');
    } catch (error) {
        console.error('应用初始化失败:', error);
        // 显示错误信息给用户
        const errorBox = document.getElementById('errorDisplay');
        if (errorBox) {
            errorBox.textContent = `初始化失败: ${error.message}`;
            errorBox.style.display = 'block';
        }
    }
});

// 检测浏览器兼容性
function checkBrowserCompatibility() {
    const warnings = [];
    
    // 检查localStorage
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
    } catch (e) {
        warnings.push('本地存储不可用，无法保存计算历史和设置');
    }
    
    // 检查ES6特性
    try {
        eval('const test = 1; let x = () => {}; class Test {}');
    } catch (e) {
        warnings.push('您的浏览器不支持现代JavaScript特性，可能会导致功能异常');
    }
    
    // 显示警告
    if (warnings.length > 0) {
        const warningBox = document.getElementById('browserWarning');
        if (warningBox) {
            warningBox.innerHTML = warnings.map(w => `<p>${w}</p>`).join('');
            warningBox.style.display = 'block';
        }
    }
} 