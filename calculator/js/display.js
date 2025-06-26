/**
 * 计算器显示模块
 * 负责数字格式化和时间戳显示
 */
class Display {
    constructor(settings) {
        this.settings = settings;
    }
    
    /**
     * 格式化数字
     * @param {number} num - 要格式化的数字
     * @param {number} decimalPlaces - 小数位数
     * @param {boolean} useScientific - 是否使用科学计数法
     * @returns {string} 格式化后的数字字符串
     */
    formatNumber(num, decimalPlaces = 10, useScientific = false) {
        // 如果不是一个有效的数字，直接返回
        if (isNaN(num) || !isFinite(num)) {
            return num.toString();
        }
        
        // 无论数字大小，都不使用科学计数法，除非显式要求
        if (useScientific) {
            // 使用精确的科学计数法格式化
            return this.formatScientificNotation(num, decimalPlaces);
        }
        
        // 如果是整数，返回整数格式（不使用千位分隔符）
        if (Number.isInteger(num)) {
            return num.toString();
        }
        
        // 处理小数，确保保留指定的小数位数
        return this.formatDecimal(num, decimalPlaces);
    }
    
    /**
     * 科学计数法格式化
     * @param {number} num - 要格式化的数字
     * @param {number} precision - 精度
     * @returns {string} 格式化后的字符串
     */
    formatScientificNotation(num, precision) {
        // 使用toExponential获取科学计数法表示
        const expString = num.toExponential(precision);
        
        // 根据需要美化输出格式
        return expString
            .replace(/e\+?/, ' × 10^')  // 替换e为 × 10^
            .replace(/\.?0+e/, 'e')     // 移除尾部多余的0
            .replace(/(\.\d*?)0+( × 10\^)/, '$1$2'); // 移除尾部多余的0但保留小数点
    }
    
    /**
     * 小数格式化，解决精度问题
     * @param {number} num - 要格式化的数字
     * @param {number} decimalPlaces - 小数位数
     * @returns {string} 格式化后的字符串
     */
    formatDecimal(num, decimalPlaces) {
        // 使用toFixed确保精确的小数位数
        const fixedNum = num.toFixed(decimalPlaces);
        
        // 移除尾部多余的0，但保留必要的小数位
        let resultStr = fixedNum;
        if (resultStr.includes('.')) {
            // 移除尾部的0，但保留至少一位小数（如果原数是小数）
            resultStr = resultStr.replace(/\.?0+$/, '');
            
            // 如果移除后是整数但原数有小数部分，添加.0
            if (!resultStr.includes('.') && num % 1 !== 0) {
                resultStr = resultStr + '.0';
            }
        }
        
        // 直接返回格式化后的数字字符串，不添加千位分隔符
        return resultStr;
    }
    
    /**
     * 格式化时间戳为简洁时间
     * @param {string} isoString - ISO格式的时间字符串
     * @returns {string} 格式化后的时间字符串
     */
    formatTimestamp(isoString) {
        if (!isoString) return '';
        
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '';
            
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            // 不同时间间隔使用不同格式
            if (diffMins < 1) {
                return '刚刚';
            } else if (diffMins < 60) {
                return `${diffMins}分钟前`;
            } else if (diffMins < 24 * 60) {
                const hours = Math.floor(diffMins / 60);
                return `${hours}小时前`;
            } else {
                // 同一年内只显示月日
                if (date.getFullYear() === now.getFullYear()) {
                    // 确保分钟显示两位数
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${minutes}`;
                } else {
                    // 不同年显示年月日
                    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                }
            }
        } catch (error) {
            console.error("格式化时间戳错误:", error);
            return '';
        }
    }
    
    /**
     * 更新设置
     * @param {Object} newSettings - 新的设置对象
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
}

// 导出
export default Display; 