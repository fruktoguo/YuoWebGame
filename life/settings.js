class Settings {
    constructor() {
        this.settings = {
            // 基础设置
            speed: {
                name: '速度',
                description: '游戏每秒更新的次数（1-30）',
                value: 5,
                min: 1,
                max: 30,
                step: 1,
                category: 'basic'
            },
            cellSize: {
                name: '网格',
                description: '单个细胞的大小（5-50像素）',
                value: 20,
                min: 5,
                max: 50,
                step: 5,
                category: 'basic'
            },
            // 游戏规则
            survivalRule: {
                name: '生存',
                description: '细胞存活所需的邻居数范围，格式：最小值-最大值，例如：2-3',
                value: '2-3',
                type: 'text',
                category: 'rules',
                validate: (value) => {
                    const match = value.match(/^(\d+)-(\d+)$/);
                    if (!match) return false;
                    const [min, max] = [parseInt(match[1]), parseInt(match[2])];
                    return min >= 0 && max <= 8 && min <= max;
                }
            },
            birthRule: {
                name: '繁殖',
                description: '死细胞复活所需的邻居数（0-8）',
                value: 3,
                min: 0,
                max: 8,
                step: 1,
                category: 'rules'
            },
            // 显示设置
            cellColor: {
                name: '细胞色',
                description: '活细胞的显示颜色',
                value: '#4CAF50',
                type: 'color',
                category: 'display'
            },
            gridColor: {
                name: '网格色',
                description: '网格线的颜色',
                value: '#dddddd',
                type: 'color',
                category: 'display'
            }
        };

        this.categories = {
            basic: {
                name: '基础',
                description: '调整游戏的基本运行参数'
            },
            rules: {
                name: '规则',
                description: '设置生命游戏的核心规则'
            },
            display: {
                name: '显示',
                description: '自定义游戏的视觉效果'
            }
        };

        this.callbacks = new Map();
        this.initUI();
    }

    createSettingItem(key, setting) {
        const settingItem = document.createElement('div');
        settingItem.className = 'setting-item';

        // 创建标签容器
        const labelContainer = document.createElement('div');
        labelContainer.className = 'setting-label';
        labelContainer.title = setting.description;

        const label = document.createElement('label');
        label.htmlFor = key;
        label.textContent = setting.name;

        labelContainer.appendChild(label);

        // 创建控件容器
        const controlContainer = document.createElement('div');
        controlContainer.className = 'setting-control';

        // 创建输入控件
        let input;
        if (setting.type === 'color') {
            input = document.createElement('input');
            input.type = 'color';
            input.id = key;
            input.value = setting.value;
            input.className = 'color-input';
            input.title = setting.description;
        } else if (setting.type === 'text') {
            input = document.createElement('input');
            input.type = 'text';
            input.id = key;
            input.value = setting.value;
            input.className = 'text-input';
            input.placeholder = '2-3';
            input.title = setting.description;
        } else {
            const rangeContainer = document.createElement('div');
            rangeContainer.className = 'range-container';

            input = document.createElement('input');
            input.type = 'range';
            input.id = key;
            input.min = setting.min;
            input.max = setting.max;
            input.step = setting.step;
            input.value = setting.value;
            input.className = 'range-input';
            input.title = setting.description;

            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'value-display';
            valueDisplay.textContent = setting.value;
            valueDisplay.title = setting.description;

            rangeContainer.appendChild(input);
            rangeContainer.appendChild(valueDisplay);
            controlContainer.appendChild(rangeContainer);
        }

        if (setting.type === 'color' || setting.type === 'text') {
            controlContainer.appendChild(input);
        }

        // 添加事件监听
        input.addEventListener('input', (e) => {
            let value = e.target.value;
            let isValid = true;

            if (setting.type === 'text' && setting.validate) {
                isValid = setting.validate(value);
                input.classList.toggle('invalid', !isValid);
            } else if (setting.type !== 'color') {
                value = parseInt(value);
                isValid = value >= setting.min && value <= setting.max;
                const valueDisplay = input.parentElement.querySelector('.value-display');
                if (valueDisplay) {
                    valueDisplay.textContent = value;
                }
            }

            if (isValid) {
                this.settings[key].value = value;
                if (this.callbacks.has(key)) {
                    try {
                        this.callbacks.get(key)(value);
                    } catch (error) {
                        console.error(`设置${setting.name}时发生错误:`, error);
                    }
                }
            }
        });

        settingItem.appendChild(labelContainer);
        settingItem.appendChild(controlContainer);
        return settingItem;
    }

    initUI() {
        const container = document.getElementById('settings');
        if (!container) {
            console.error('找不到设置面板容器');
            return;
        }

        container.innerHTML = '';

        // 按类别创建设置项
        for (const [categoryId, category] of Object.entries(this.categories)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'settings-category';

            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = category.name;
            
            const categoryDescription = document.createElement('div');
            categoryDescription.className = 'category-description';
            categoryDescription.textContent = category.description;

            categoryHeader.appendChild(categoryTitle);
            categoryHeader.appendChild(categoryDescription);
            categoryDiv.appendChild(categoryHeader);

            // 添加该类别的所有设置项
            let hasSettings = false;
            for (const [key, setting] of Object.entries(this.settings)) {
                if (setting.category === categoryId) {
                    const settingItem = this.createSettingItem(key, setting);
                    categoryDiv.appendChild(settingItem);
                    hasSettings = true;
                }
            }

            if (hasSettings) {
                container.appendChild(categoryDiv);
            }
        }
    }

    onSettingChange(key, callback) {
        if (!this.settings[key]) {
            console.warn(`未找到设置项: ${key}`);
            return;
        }
        this.callbacks.set(key, callback);
    }

    getSetting(key) {
        if (!this.settings[key]) {
            console.warn(`未找到设置项: ${key}`);
            return null;
        }
        return this.settings[key].value;
    }

    setSetting(key, value) {
        if (!this.settings[key]) {
            console.warn(`未找到设置项: ${key}`);
            return;
        }

        const setting = this.settings[key];
        let isValid = true;

        if (setting.type === 'text' && setting.validate) {
            isValid = setting.validate(value);
        } else if (setting.type !== 'color') {
            isValid = value >= setting.min && value <= setting.max;
        }

        if (isValid) {
            setting.value = value;
            const input = document.getElementById(key);
            if (input) {
                input.value = value;
                if (setting.type !== 'color' && setting.type !== 'text') {
                    const valueDisplay = input.parentElement.querySelector('.value-display');
                    if (valueDisplay) {
                        valueDisplay.textContent = value;
                    }
                }
            }
        } else {
            console.warn(`设置值无效: ${key} = ${value}`);
        }
    }
}

// 初始化设置
const gameSettings = new Settings(); 