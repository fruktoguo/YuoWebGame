// 通用工具函数
class Utils {
    // 格式化数字显示
    static formatNumber(num) {
        if (num < 1000) return Math.floor(num).toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        return (num / 1000000000).toFixed(1) + 'B';
    }

    // 生成随机数
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // 生成随机整数
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 从数组中随机选择一个元素
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // 权重随机选择
    static weightedChoice(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let randomNum = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            randomNum -= weights[i];
            if (randomNum <= 0) {
                return items[i];
            }
        }
        return items[items.length - 1];
    }

    // 深拷贝对象
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    // 限制数值范围
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // 线性插值
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // 获取元素相对于页面的位置
    static getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        };
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 生成唯一ID
    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // 时间格式化
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // 获取品质颜色
    static getQualityColor(quality) {
        const colors = {
            common: '#9ca3af',
            magic: '#3b82f6',
            rare: '#fbbf24',
            epic: '#a855f7',
            legendary: '#f97316'
        };
        return colors[quality] || colors.common;
    }

    // 获取品质名称
    static getQualityName(quality) {
        const names = {
            common: '普通',
            magic: '魔法',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说'
        };
        return names[quality] || names.common;
    }

    // 计算两点距离
    static distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // 角度转弧度
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // 弧度转角度
    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    // 检查是否为移动设备
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 本地存储封装
    static setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('存储失败:', e);
            return false;
        }
    }

    static getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('读取存储失败:', e);
            return defaultValue;
        }
    }

    static removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('删除存储失败:', e);
            return false;
        }
    }

    // 显示通知
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;

        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
} 