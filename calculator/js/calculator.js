/**
 * 计算器核心模块 - 第一部分
 * 包含计算器基本功能和构造函数
 */
class Calculator {
    constructor(settings, storage, display) {
        // 依赖注入
        this.settings = settings;
        this.storage = storage;
        this.display = display;
        
        // 获取当前设置
        this.settingsObj = settings.getSettings ? settings.getSettings() : settings;
        
        // 默认设置值 - 按照截图修改默认值
        if(!this.settingsObj.decimalPlaces) this.settingsObj.decimalPlaces = 10;
        if(!this.settingsObj.maxHistoryItems) this.settingsObj.maxHistoryItems = 50;
        
        // DOM元素
        this.currentInput = document.getElementById('currentInput');
        this.historyDisplay = document.getElementById('history');
        this.allButtons = document.querySelectorAll('.btn');
        this.copyBtn = document.getElementById('copyBtn');
        this.errorDisplay = document.getElementById('errorDisplay');
        this.constantsList = document.getElementById('constantsList');
    
        // 状态
        this.displayValue = '0';
        this.memory = 0;
        this.angleMode = 'DEG'; // 角度模式，默认 DEG
        this.lastResult = null;
        this.history = [];
        this.historyExpressions = [];
        this.lastBackupData = null; // 用于数据恢复
        this.constants = {}; // 用户定义的常量
        
        // 当前表达式
        this.expression = '';
        
        // 从存储加载数据
        this.loadFromStorage();
        
        // 初始化
        this.init();
        
        // 监听设置变更
        document.addEventListener('settingsChanged', (e) => {
            this.settingsObj = e.detail.settings;
            this.updateDisplay(); // 刷新显示以应用新设置
        });
        
        // 监听数据清除事件
        document.addEventListener('calculatorDataCleared', () => {
            // 备份当前数据以便恢复
            this.backupDataBeforeClear();
            
            this.history = [];
            this.historyExpressions = [];
            this.expression = '0';
            this.constants = {};
            this.updateHistory();
            this.updateDisplay();
            this.renderConstants();
            
            // 启用恢复按钮
            const undoBtn = document.getElementById('undoClearData');
            if (undoBtn) {
                undoBtn.disabled = false;
            }
        });
        
        // 数据恢复按钮
        const undoBtn = document.getElementById('undoClearData');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.restoreDataFromBackup();
            });
        }
    
        
        // 初始化常量功能
        this.initConstantsPanel();
    }
    
    // 从存储加载数据
    loadFromStorage() {
        // 加载历史记录
        const savedHistory = this.storage.loadHistory();
        if (savedHistory && savedHistory.length > 0) {
            this.history = savedHistory.map(item => {
                // 确保每个历史项都有text属性
                if (!item.text && item.expression && item.result) {
                    return {
                        ...item,
                        text: `${item.expression} = ${item.result}`
                    };
                }
                return item;
            });
            
            // 提取表达式部分作为historyExpressions
            this.historyExpressions = this.history.map(item => item.text || '');
        }
        
        // 加载当前表达式
        const savedExpression = this.storage.loadExpression();
        if (savedExpression) {
            this.expression = savedExpression;
        }
        
        // 加载用户定义的常量
        const savedConstants = this.storage.loadConstants();
        if (savedConstants) {
            this.constants = savedConstants;
        }
    }
    
    // 初始化
    init() {
        // 添加按钮点击效果
        this.allButtons.forEach(button => {
            button.addEventListener('mousedown', () => {
                button.classList.add('active');
            });
            button.addEventListener('mouseup', () => {
                button.classList.remove('active');
            });
            button.addEventListener('mouseleave', () => {
                button.classList.remove('active');
            });
            
            button.addEventListener('click', () => {
                this.addButtonPressEffect(button);
                
                // 检查当前焦点是否在其他输入元素上
                const activeElement = document.activeElement;
                const isInputActive = activeElement.tagName === 'INPUT' && 
                                      activeElement !== this.currentInput &&
                                      (activeElement.type === 'text' || activeElement.type === 'number');
                
                // 只有当焦点不在其他输入元素上时，才聚焦到计算器输入框
                if (!isInputActive) {
                    this.currentInput.focus();
                }
                
                if (button.classList.contains('number')) {
                    this.insertTextAtCursor(button.dataset.value);
                } else if (button.classList.contains('operator')) {
                    this.handleOperator(button.dataset.action);
                } else if (button.classList.contains('equals')) {
                    this.evaluate();
                } else if (button.classList.contains('function')) {
                    this.handleFunction(button.dataset.action);
                } else if (button.classList.contains('function-key')) {
                    // 处理函数快捷键
                    if (button.dataset.action === 'insert-function' && button.dataset.function) {
                        this.insertFunction(button.dataset.function);
                        this.updateDisplay();
                    }
                }
            });
        });
        
        // 初始化函数快捷键
        this.initFunctionKeys();
        
        // 键盘支持
        document.addEventListener('keydown', (event) => {
            // 确保只有在计算器输入框有焦点时才处理键盘事件
            if (document.activeElement === this.currentInput) {
                // 处理特殊按键
                this.handleKeyboardInput(event);
            }
        });
        
        // 设置历史记录点击事件代理
        this.historyDisplay.addEventListener('click', (event) => {
            // 判断点击的是否为历史条目
            const historyItem = event.target.closest('.history-item');
            if (historyItem && historyItem.dataset.expression) {
                this.loadHistoryExpression(historyItem.dataset.expression);
            }
        });

        // 为输入框添加事件监听
        this.currentInput.addEventListener('input', (e) => {
            // 获取当前值和光标位置
            const value = e.target.value;
            const cursorPos = this.currentInput.selectionStart;
            
            // 过滤不合法字符，保留有效的计算器字符，包括字母
            const validChars = /[0-9a-zA-Z+\-*/().%^πe×÷!,\[\]=_]/g;
            let filteredValue = '';
            
            // 提取所有有效字符
            const matches = value.match(validChars);
            if (matches) {
                filteredValue = matches.join('');
            }
            
            // 如果值为空，设置为"0"
            if (filteredValue === '') {
                filteredValue = '0';
            }
            
            // 特殊处理：如果当前值是"0"，并且新输入是数字，替换0
            if (this.expression === '0' && filteredValue.length > 1 && /^\d/.test(filteredValue)) {
                filteredValue = filteredValue.substring(1);
            }
            
            // 更新表达式
            this.expression = filteredValue;
            
            // 更新显示内容
            this.currentInput.value = this.expression;
            
            // 自动调整高度
            this.adjustTextareaHeight();
            
            // 设置光标位置
            // 尝试维持原来的光标位置
            let newPos = cursorPos;
            if (value !== filteredValue) {
                // 如果内容被过滤，调整光标
                newPos = Math.min(filteredValue.length, Math.max(0, cursorPos));
            }
            this.currentInput.setSelectionRange(newPos, newPos);
            
            // 保存到本地存储
            this.saveExpressionToStorage();
            
            // 更新复制按钮状态
            this.updateCopyButtonState();
        });

        // 监听粘贴事件，确保粘贴后也调整高度
        this.currentInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.adjustTextareaHeight();
            }, 0);
        });

        // 监听删除键事件，确保删除后也调整高度
        this.currentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                setTimeout(() => {
                    this.adjustTextareaHeight();
                }, 0);
            }
        });

        // 监听值变化事件（作为备用）
        this.currentInput.addEventListener('propertychange', () => {
            this.adjustTextareaHeight();
        });

        // 当输入框获得焦点时，如果内容为0，选择所有文本
        this.currentInput.addEventListener('focus', () => {
            if (this.currentInput.value === '0') {
                this.currentInput.select();
            }
            // 焦点时也调整一次高度
            setTimeout(() => {
                this.adjustTextareaHeight();
            }, 0);
        });
        
        // 复制按钮点击事件
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => {
                this.copyResult();
            });
        }
        
        // 初始化显示
        this.updateDisplay();
        this.updateHistory();
        
        // 初始化角度模式按钮
        this.updateAngleModeButtons();
        
        // 添加角度模式按钮点击事件
        const angleBtns = document.querySelectorAll('.angle-mode-btn');
        angleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setAngleMode(btn.dataset.mode);
            });
        });
        
        // 初始化错误显示
        if (this.errorDisplay) {
            this.clearErrorMessage();
        }
        
        // 监听窗口大小变化，确保在屏幕尺寸变化时自动调整高度
        window.addEventListener('resize', () => {
            this.adjustTextareaHeight();
        });
        
        // 初始化时调整高度
        setTimeout(() => {
            this.adjustTextareaHeight();
        }, 0);
        
        // 添加内联样式确保正确显示
        const style = document.createElement('style');
        style.textContent = `
            /* 全局强制禁用滚动条 */
            .current-input, .display, .result-container, textarea {
                scrollbar-width: none !important;
            }
            .current-input::-webkit-scrollbar, 
            .display::-webkit-scrollbar,
            textarea::-webkit-scrollbar {
                width: 0 !important;
                height: 0 !important;
                display: none !important;
            }
            
            /* 布局适应 */
            .result-container {
                width: 100% !important;
                display: block !important;
                position: relative !important;
            }
            
            /* 输入框样式 */
            .current-input {
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
                padding: 8px 35px 8px 8px !important;
                min-height: 40px !important;
                white-space: pre-wrap !important;
            }
            
            /* 强制禁用resize和滚动条 */
            textarea.current-input {
                resize: none !important;
                overflow: hidden !important;
            }
            
            /* 复制按钮定位 */
            .copy-btn {
                position: absolute !important;
                top: 5px !important;
                right: 5px !important;
                z-index: 10 !important;
            }
        `;
        document.head.appendChild(style);
        
        // 初始化时调整一次高度，确保正确显示
        setTimeout(() => {
            // 多次调用确保在各种浏览器中生效
            this.adjustTextareaHeight();
            
            // 在调整后重新聚焦到输入框末尾
            if (this.currentInput) {
                this.currentInput.focus();
                const length = this.currentInput.value.length;
                this.currentInput.setSelectionRange(length, length);
            }
            
            // 10毫秒后再次调整，确保渲染完成
            setTimeout(() => this.adjustTextareaHeight(), 10);
            // 100毫秒后再次调整，确保字体加载完成
            setTimeout(() => this.adjustTextareaHeight(), 100);
        }, 0);
    }
    
    // 初始化函数快捷键
    initFunctionKeys() {
        const functionKeys = document.querySelectorAll('.function-key');
        functionKeys.forEach(key => {
            key.addEventListener('click', () => {
                this.addButtonPressEffect(key);
                
                // 检查当前焦点是否在其他输入元素上
                const activeElement = document.activeElement;
                const isInputActive = activeElement.tagName === 'INPUT' && 
                                      activeElement !== this.currentInput &&
                                      (activeElement.type === 'text' || activeElement.type === 'number');
                
                // 只有当焦点不在其他输入元素上时，才聚焦到计算器输入框
                if (!isInputActive) {
                    this.currentInput.focus();
                    
                    if (key.dataset.action === 'insert-function' && key.dataset.function) {
                        console.log(`快捷键点击: ${key.dataset.function}`);
                        this.insertFunction(key.dataset.function);
                        this.updateDisplay();
                    }
                }
            });
        });
    }
    
    // 添加按钮按下效果
    addButtonPressEffect(button) {
        button.classList.add('btn-clicked');
        setTimeout(() => {
            button.classList.remove('btn-clicked');
        }, 100);
    }
    
    // 更新显示
    updateDisplay() {
        // 更新输入框
        if (this.expression === '') {
            this.currentInput.value = '0';
        } else {
            this.currentInput.value = this.expression;
        }
        
        // 自动调整输入框高度以适应内容
        this.adjustTextareaHeight();
        
        // 更新复制按钮状态
        this.updateCopyButtonState();
    }
    
    // 自动调整textarea高度以适应内容
    adjustTextareaHeight() {
        if (!this.currentInput) return;
        
        // 保存当前的光标位置
        const cursorStart = this.currentInput.selectionStart;
        const cursorEnd = this.currentInput.selectionEnd;
        
        const content = this.currentInput.value;
        
        // 1. 强制重置高度为最小值，这是关键步骤
        this.currentInput.style.height = '40px';
        
        // 2. 如果内容为空或只是"0"，保持最小高度
        if (!content || content.trim() === '' || content === '0') {
            this.updateDisplayContainerHeight(40);
            console.log('设置最小高度: 40px');
            return;
        }
        
        // 3. 强制浏览器重新计算布局
        // 通过访问offsetHeight来触发重新计算
        const forceReflow = this.currentInput.offsetHeight;
        
        // 4. 获取内容所需的实际高度
        const scrollHeight = this.currentInput.scrollHeight;
        
        // 5. 计算最终高度，确保在合理范围内
        const minHeight = 40;
        const maxHeight = 300;
        const finalHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
        
        // 6. 应用最终高度
        this.currentInput.style.height = finalHeight + 'px';
        
        // 7. 更新父容器高度
        this.updateDisplayContainerHeight(finalHeight);
        
        // 8. 恢复光标位置
        requestAnimationFrame(() => {
            if (this.currentInput) {
                this.currentInput.setSelectionRange(cursorStart, cursorEnd);
            }
        });
        
        console.log(`高度调整: 内容="${content.substring(0, 20)}${content.length > 20 ? '...' : ''}", scrollHeight=${scrollHeight}px, 最终高度=${finalHeight}px`);
    }
    
    // 更新显示容器高度
    updateDisplayContainerHeight(inputHeight) {
        const displayContainer = this.currentInput.closest('.display');
        if (displayContainer) {
            // 计算容器需要的高度：输入框高度 + 内边距 + 错误显示区域
            const padding = 30; // 15px * 2 (上下内边距)
            const errorSpace = 25; // 错误显示区域
            const containerHeight = Math.max(95, inputHeight + padding + errorSpace);
            
            displayContainer.style.height = containerHeight + 'px';
            console.log(`容器高度调整: ${containerHeight}px`);
        }
    }
    
    // 强制移除滚动条
    forceRemoveScrollbars() {
        this.currentInput.style.overflow = 'hidden';
        
        const displayContainer = this.currentInput.closest('.display');
        if (displayContainer) {
            displayContainer.style.overflow = 'visible';
        }
    }
    
    // 更新复制按钮状态
    updateCopyButtonState() {
        if (!this.copyBtn) return;
        
        const value = this.currentInput.value;
        const isError = value.toLowerCase().includes('error');
        const isInitial = value === '0';
        
        if (isError || isInitial) {
            this.copyBtn.disabled = true;
            this.copyBtn.style.opacity = '0.3';
            this.copyBtn.title = '没有可复制的结果';
        } else {
            this.copyBtn.disabled = false;
            this.copyBtn.style.opacity = '1';
            this.copyBtn.title = '复制结果';
        }
    }
    
    // 在光标位置插入文本
    insertTextAtCursor(text) {
        const cursorPos = this.currentInput.selectionStart;
        const cursorEnd = this.currentInput.selectionEnd;
        const currentValue = this.currentInput.value;
        
        // 如果全选了，或者当前值为'0'，替换整个内容
        if (cursorPos === 0 && cursorEnd === currentValue.length) {
            this.expression = text;
        } 
        // 如果值为默认值'0'并且是数字输入，替换整个内容
        else if (currentValue === '0' && /[0-9π.e]/.test(text)) {
            this.expression = text;
        } 
        // 在光标位置插入
        else {
            const beforeText = currentValue.substring(0, cursorPos);
            const afterText = currentValue.substring(cursorEnd);
            this.expression = beforeText + text + afterText;
        }
        
        // 更新显示
        this.updateDisplay();
        
        // 自动调整输入框高度
        this.adjustTextareaHeight();
        
        // 设置新的光标位置
        const newCursorPos = cursorPos === cursorEnd 
            ? cursorPos + text.length 
            : cursorPos + text.length;
        
        // 设置光标位置
        this.setCursorPosition(newCursorPos);
        
        // 保存到本地存储
        this.saveExpressionToStorage();
    }
    
    // 处理运算符
    handleOperator(action) {
        const operators = {
            'add': '+',
            'subtract': '-',
            'multiply': '×',
            'divide': '÷',
            'percent': '%',
            'power': '^',
            'leftParen': '(',
            'rightParen': ')',
            'factorial': '!',
            'decimal': '.'
        };
        
        if (operators[action]) {
            // 将界面符号转换为计算符号
            let operator = operators[action];
            
            // 插入运算符
            this.insertTextAtCursor(operator);
        }
    }
    
    // 处理函数
    handleFunction(action) {
        this.clearErrorMessage();
        console.log(`处理函数按钮: ${action}`);
        
        switch(action) {
            case 'clear':
                this.clear();
                break;
            case 'delete':
                this.delete();
                break;
            case 'memory-add':
                this.memoryAdd();
                break;
            case 'memory-subtract':
                this.memorySubtract();
                break;
            case 'memory-recall':
                this.memoryRecall();
                break;
            case 'memory-clear':
                this.memoryClear();
                break;
            case 'pi':
                this.insertTextAtCursor('π');
                break;
            case 'e':
                this.insertTextAtCursor('e');
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
            case 'sqrt':
            case 'abs':
            // 添加新的函数
            case 'asin':
            case 'acos':
            case 'atan':
                this.insertFunction(action);
                break;
            case 'cbrt':
                this.handleCubeRoot();
                break;
            case 'floor':
                this.handleFloor();
                break;
            case 'ceil':
                this.handleCeil();
                break;
            case 'round':
                this.handleRound();
                break;
            case 'mod':
                this.insertTextAtCursor('%');
                break;
            case 'square':
                this.handleSquare();
                break;
            case 'cube':
                this.handleCube();
                break;
            case 'powten':
                this.insertFunction('10^');
                break;
            case 'power':
                this.insertTextAtCursor('^');
                break;
            case 'factorial':
                this.insertTextAtCursor('!');
                break;
            case 'toggle-sign':
                this.toggleSign();
                break;
            case 'exp':
                this.handleEXP();
                break;
            case 'percent':
                this.insertTextAtCursor('%');
                break;
            case 'rand':
                this.insertRandom();
                break;
            // 新增函数处理
            case 'gcd':
                this.insertFunction('gcd');
                break;
            case 'lcm':
                this.insertFunction('lcm');
                break;
            case 'perm':
                this.insertFunction('perm');
                break;
            case 'comb':
                this.insertFunction('comb');
                break;
            case 'set-angle-mode':
                // 由角度模式按钮直接处理，这里不需要额外代码
                break;
            default:
                // 对于未知的函数，显示错误消息
                this.showErrorMessage(`未知函数: ${action}`);
        }
        
        this.updateDisplay();
    }
    
    // 插入函数
    insertFunction(func) {
        const functions = {
            'sin': 'sin(',
            'cos': 'cos(',
            'tan': 'tan(',
            'log': 'log(',
            'ln': 'ln(',
            'sqrt': 'sqrt(',
            'abs': 'abs(',
            '10^': '10^',
            // 新增函数
            'asin': 'asin(',
            'acos': 'acos(',
            'atan': 'atan(',
            'cbrt': 'cbrt(',
            'floor': 'floor(',
            'ceil': 'ceil(',
            'round': 'round(',
            // 新增阶乘相关函数
            'gcd': 'gcd(',
            'lcm': 'lcm(',
            'perm': 'perm(',
            'comb': 'comb('
        };
        
        // 针对特殊函数的处理
        const specialFunctions = {
            'abs': (expr) => {
                // 如果当前有选中内容，把选中内容放入绝对值中
                const cursorPos = this.currentInput.selectionStart;
                const cursorEnd = this.currentInput.selectionEnd;
                
                if (cursorPos !== cursorEnd) {
                    const selectedText = this.expression.substring(cursorPos, cursorEnd);
                    const beforeText = this.expression.substring(0, cursorPos);
                    const afterText = this.expression.substring(cursorEnd);
                    
                    this.expression = beforeText + 'abs(' + selectedText + ')' + afterText;
                    this.updateDisplay();
                    
                    // 设置光标位置到括号后
                    const newPos = cursorPos + 4 + selectedText.length + 1;
                    this.currentInput.setSelectionRange(newPos, newPos);
                    return true;
                }
                return false;
            },
            'sqrt': (expr) => {
                // 如果当前有选中内容，把选中内容放入开方根号中
                const cursorPos = this.currentInput.selectionStart;
                const cursorEnd = this.currentInput.selectionEnd;
                
                if (cursorPos !== cursorEnd) {
                    const selectedText = this.expression.substring(cursorPos, cursorEnd);
                    const beforeText = this.expression.substring(0, cursorPos);
                    const afterText = this.expression.substring(cursorEnd);
                    
                    this.expression = beforeText + 'sqrt(' + selectedText + ')' + afterText;
                    this.updateDisplay();
                    
                    // 设置光标位置到括号后
                    const newPos = cursorPos + 5 + selectedText.length + 1;
                    this.currentInput.setSelectionRange(newPos, newPos);
                    return true;
                }
                return false;
            }
        };
        
        // 首先检查是否需要特殊处理
        if (func in specialFunctions) {
            // 如果特殊处理成功，则返回
            if (specialFunctions[func](this.expression)) {
                this.saveExpressionToStorage();
                return;
            }
        }
        
        // 常规函数处理
        if (functions[func]) {
            console.log(`插入函数: ${func} -> ${functions[func]}`);
            this.insertTextAtCursor(functions[func]);
        } else {
            console.log(`未知函数: ${func}`);
            this.showErrorMessage(`未知函数: ${func}`);
        }
    }
    
    // 切换角度模式
    toggleAngleMode() {
        // 在三种模式之间切换：DEG（度）、RAD（弧度）、GRAD（百分度）
        const modes = ['DEG', 'RAD', 'GRAD'];
        const currentIndex = modes.indexOf(this.angleMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setAngleMode(modes[nextIndex]);
    }
    
    // 清除
    clear() {
        this.expression = '0';
        this.updateDisplay();
        // 确保清除后立即调整高度
        this.adjustTextareaHeight();
        this.saveExpressionToStorage();
    }
    
    // 删除
    delete() {
        const cursorPos = this.currentInput.selectionStart;
        const cursorEnd = this.currentInput.selectionEnd;
        const currentValue = this.currentInput.value;
        
        // 如果选择了文本，删除选中部分
        if (cursorPos !== cursorEnd) {
            const beforeText = currentValue.substring(0, cursorPos);
            const afterText = currentValue.substring(cursorEnd);
            this.expression = beforeText + afterText;
            
            // 更新显示
            this.updateDisplay();
            
            // 调整高度
            this.adjustTextareaHeight();
            
            // 设置光标位置
            this.setCursorPosition(cursorPos);
        } 
        // 删除光标前一个字符
        else if (cursorPos > 0) {
            const beforeText = currentValue.substring(0, cursorPos - 1);
            const afterText = currentValue.substring(cursorPos);
            this.expression = beforeText + afterText;
            
            // 更新显示
            this.updateDisplay();
            
            // 调整高度
            this.adjustTextareaHeight();
            
            // 设置光标位置
            this.setCursorPosition(cursorPos - 1);
        }
        
        // 如果表达式为空，显示0
        if (this.expression === '') {
            this.expression = '0';
            this.updateDisplay();
            
            // 调整高度
            this.adjustTextareaHeight();
            
            // 设置光标位置
            this.setCursorPosition(1);
        }
        
        this.saveExpressionToStorage();
    }
    
    // 求值
    evaluate() {
        if (this.expression === '0') return;
        
        try {
            // 清除任何错误状态
            this.clearErrorMessage();
            
            // 检查表达式有效性
            if (!this.checkBalancedParentheses(this.expression)) {
                throw new Error("括号不匹配");
            }
            
            // 准备计算表达式
            let expr = this.prepareExpression(this.expression);
            
            // 记录原始表达式用于显示
            const originalExpr = this.expression;
            
            // 计算结果
            const result = this.calculateExpression(expr);
            
            // 如果结果是有效数字
            if (!isNaN(result) && isFinite(result)) {
                // 格式化结果
                let formattedResult;
                if (this.settingsObj.useScientificNotation && Math.abs(result) > 1e10) {
                    formattedResult = this.display.formatNumber(result, 10, true);
                } else {
                    formattedResult = this.display.formatNumber(result, this.settingsObj.decimalPlaces);
                }
                
                // 记录上一次结果
                this.lastResult = result;
                
                // 添加到历史
                this.addToHistory(originalExpr, formattedResult);
                
                // 更新表达式和显示
                this.expression = formattedResult;
                this.updateDisplay();
                
                // 确保结果完全显示
                this.adjustTextareaHeight();
                
                // 全选结果以便用户进一步操作
                this.currentInput.select();
            } else {
                throw new Error("计算结果无效");
            }
        } catch (error) {
            console.error("计算错误:", error);
            this.showErrorMessage(error.message || "计算错误");
            
            // 确保错误显示在输入框上方
            this.expression = this.expression || '0';
            this.updateDisplay();
        }
        
        this.saveExpressionToStorage();
    }
    
    // 准备表达式用于计算
    prepareExpression(expr) {
        // 替换特殊字符
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E');
        
        // 处理百分号
        expr = this.handlePercentInExpression(expr);
        
        // 处理阶乘
        expr = this.handleFactorialInExpression(expr);
        
        // 处理科学函数
        expr = this.handleScientificFunctions(expr);
        
        return expr;
    }
    
    // 处理表达式中的百分号
    handlePercentInExpression(expr) {
        // 简单处理：将x%替换为x/100
        return expr.replace(/(\d+(\.\d+)?|\))%/g, function(match, p1) {
            return `(${p1})/100`;
        });
    }
    
    // 处理表达式中的阶乘
    handleFactorialInExpression(expr) {
        // 改进正则表达式，同时支持数字和括号表达式的阶乘
        const result = expr.replace(/(\d+|\([^()]+\))!/g, (match, p1) => {
            console.log(`处理阶乘表达式: ${match}`);
            // 如果是括号表达式，去掉外层括号
            if (p1.startsWith('(') && p1.endsWith(')')) {
                p1 = p1.substring(1, p1.length - 1);
            }
            return `factorial(${p1})`;
        });
        
        console.log("处理后的表达式:", result);
        return result;
    }
    
    // 处理科学函数
    handleScientificFunctions(expr) {
        let modifiedExpr = expr;
        
        // 使用正则表达式匹配三角函数并添加角度转换
        // 先处理三角函数
        const handleTrig = (funcName, mathFunc) => {
            const pattern = new RegExp(`${funcName}\\(([^)]+)\\)`, 'g');
            modifiedExpr = modifiedExpr.replace(pattern, (match, args) => {
                // 根据角度模式进行转换
                switch(this.angleMode) {
                    case 'DEG':
                        return `Math.${mathFunc}((Math.PI/180)*(${args}))`;
                    case 'GRAD':
                        return `Math.${mathFunc}((Math.PI/200)*(${args}))`;
                    case 'RAD':
                    default:
                        return `Math.${mathFunc}(${args})`;
                }
            });
        };
        
        // 处理反三角函数(结果需要根据角度模式转换)
        const handleInverseTrig = (funcName, mathFunc) => {
            const pattern = new RegExp(`${funcName}\\(([^)]+)\\)`, 'g');
            modifiedExpr = modifiedExpr.replace(pattern, (match, args) => {
                // 计算后需要根据角度模式转换结果
                switch(this.angleMode) {
                    case 'DEG':
                        return `(180/Math.PI)*Math.${mathFunc}(${args})`;
                    case 'GRAD':
                        return `(200/Math.PI)*Math.${mathFunc}(${args})`;
                    case 'RAD':
                    default:
                        return `Math.${mathFunc}(${args})`;
                }
            });
        };
        
        // 处理三角函数
        handleTrig('sin', 'sin');
        handleTrig('cos', 'cos');
        handleTrig('tan', 'tan');
        
        // 处理反三角函数
        handleInverseTrig('asin', 'asin');
        handleInverseTrig('acos', 'acos');
        handleInverseTrig('atan', 'atan');
        
        // 处理其他数学函数
        const mathFunctions = {
            'log\\(': 'Math.log10(',
            'ln\\(': 'Math.log(',
            'sqrt\\(': 'Math.sqrt(',
            'abs\\(': 'Math.abs(',
            'cbrt\\(': 'Math.cbrt(',
            'floor\\(': 'Math.floor(',
            'ceil\\(': 'Math.ceil(',
            'round\\(': 'Math.round('
        };
        
        // 依次替换每个函数
        for (const pattern in mathFunctions) {
            if (Object.prototype.hasOwnProperty.call(mathFunctions, pattern)) {
                const replacement = mathFunctions[pattern];
                modifiedExpr = modifiedExpr.replace(new RegExp(pattern, 'g'), replacement);
            }
        }
        
        // 处理10^x表达式
        modifiedExpr = modifiedExpr.replace(/10\^/g, '10**');
        
        // 处理阶乘相关函数
        modifiedExpr = modifiedExpr.replace(/gcd\(([^)]+)\)/g, (match, args) => {
            return `gcdFunc(${args})`;
        });
        
        modifiedExpr = modifiedExpr.replace(/lcm\(([^)]+)\)/g, (match, args) => {
            return `lcmFunc(${args})`;
        });
        
        modifiedExpr = modifiedExpr.replace(/perm\(([^)]+)\)/g, (match, args) => {
            return `permFunc(${args})`;
        });
        
        modifiedExpr = modifiedExpr.replace(/comb\(([^)]+)\)/g, (match, args) => {
            return `combFunc(${args})`;
        });
        
        return modifiedExpr;
    }
    
    // 计算表达式（使用Function构造函数实现安全的表达式计算）
    calculateExpression(expr) {
        try {
            // 安全性检查：验证表达式只包含合法字符和函数
            this.validateExpression(expr);
            
            // 检查括号平衡
            if (!this.checkBalancedParentheses(expr)) {
                throw new Error("不平衡的括号");
            }
            
            console.log("准备计算表达式:", expr);
            
            // 创建一个引用Calculator实例的变量
            const self = this;
            
            // 替换用户定义的常量
            for (const name in this.constants) {
                if (Object.prototype.hasOwnProperty.call(this.constants, name)) {
                    const value = this.constants[name];
                    // 使用正则表达式只替换完整的单词，避免替换部分字符串
                    const regex = new RegExp('\\b' + name + '\\b', 'g');
                    expr = expr.replace(regex, value);
                }
            }
            
            // 使用Function但增加额外的安全检查
            const safeFunctions = {
                Math: Math,
                factorial: function(n) {
                    console.log("调用阶乘函数:", n);
                    return self.factorial(n);
                },
                gcdFunc: function(a, b) {
                    console.log("调用最大公约数函数:", a, b);
                    return self.gcd(a, b);
                },
                lcmFunc: function(a, b) {
                    console.log("调用最小公倍数函数:", a, b);
                    return self.lcm(a, b);
                },
                permFunc: function(n, r) {
                    console.log("调用排列数函数:", n, r);
                    return self.permutation(n, r);
                },
                combFunc: function(n, r) {
                    console.log("调用组合数函数:", n, r);
                    return self.combination(n, r);
                }
            };
            
            // 包装在立即执行函数中以提供安全的上下文
            // eslint-disable-next-line no-new-func
            const calculate = new Function('context', `
                with(context) {
                    try {
                        return ${expr};
                    } catch(e) {
                        console.error("计算表达式错误:", e);
                        throw new Error("计算错误: " + e.message);
                    }
                }
            `);
            
            const result = calculate(safeFunctions);
            console.log("计算结果:", result);
            return result;
        } catch (error) {
            console.error("计算错误:", error, expr);
            throw error;
        }
    }
    
    // 验证表达式安全性
    validateExpression(expr) {
        // 检查是否包含可疑代码
        const suspiciousPatterns = [
            'eval\\(', 'Function\\(', 'setTimeout\\(', 'setInterval\\(',
            'XMLHttpRequest', 'fetch\\(', 'document\\.', 'window\\.',
            'localStorage', 'sessionStorage', 'alert\\(', 'console\\.'
        ];
        
        const suspiciousRegex = new RegExp(suspiciousPatterns.join('|'), 'i');
        if (suspiciousRegex.test(expr)) {
            throw new Error("表达式包含不允许的函数或操作");
        }
        
        return true;
    }
    
    // 检查括号是否平衡
    checkBalancedParentheses(expr) {
        const stack = [];
        const pairs = {
            '(': ')',
            '[': ']',
            '{': '}'
        };
        
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            if ('([{'.includes(char)) {
                stack.push(char);
            } else if (')]}'.includes(char)) {
                const last = stack.pop();
                if (pairs[last] !== char) {
                    return false;
                }
            }
        }
        
        return stack.length === 0;
    }
    
    // 计算阶乘
    factorial(n) {
        console.log(`计算阶乘: ${n}`);
        
        // 如果n不是整数或为负数，抛出错误
        if (n < 0 || n % 1 !== 0) {
            throw new Error("阶乘只适用于非负整数");
        }
        
        // 0!和1!都等于1
        if (n <= 1) return 1;
        
        // 递归计算阶乘，对于大数使用迭代以避免栈溢出
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
            // 如果结果太大，返回Infinity
            if (!isFinite(result)) break;
        }
        
        console.log(`阶乘结果: ${result}`);
        return result;
    }
    
    // 计算最大公约数
    gcd(a, b) {
        // 转换为整数
        a = Math.round(Math.abs(a));
        b = Math.round(Math.abs(b));
        
        // 确保a和b都是有效的正整数
        if (a === 0 && b === 0) {
            throw new Error("GCD(0,0)未定义");
        }
        if (a === 0) return b;
        if (b === 0) return a;
        
        // 使用欧几里得算法
        while (b !== 0) {
            let t = b;
            b = a % b;
            a = t;
        }
        
        return a;
    }
    
    // 计算最小公倍数
    lcm(a, b) {
        // 转换为整数
        a = Math.round(Math.abs(a));
        b = Math.round(Math.abs(b));
        
        // 验证输入
        if (a === 0 || b === 0) {
            return 0; // 任何数与0的最小公倍数为0
        }
        
        // 使用公式: lcm(a,b) = (a*b)/gcd(a,b)
        return (a * b) / this.gcd(a, b);
    }
    
    // 计算排列数 P(n,r)
    permutation(n, r) {
        // 验证输入
        if (n < 0 || r < 0 || n % 1 !== 0 || r % 1 !== 0) {
            throw new Error("排列数要求非负整数");
        }
        if (r > n) {
            throw new Error("r不能大于n");
        }
        
        // 使用公式: P(n,r) = n!/(n-r)!
        let result = 1;
        for (let i = n - r + 1; i <= n; i++) {
            result *= i;
            if (!isFinite(result)) break;
        }
        
        return result;
    }
    
    // 计算组合数 C(n,r)
    combination(n, r) {
        // 验证输入
        if (n < 0 || r < 0 || n % 1 !== 0 || r % 1 !== 0) {
            throw new Error("组合数要求非负整数");
        }
        if (r > n) {
            throw new Error("r不能大于n");
        }
        
        // 使用性质: C(n,r) = C(n,n-r)
        if (r > n / 2) {
            r = n - r;
        }
        
        // 使用公式: C(n,r) = n!/(r!*(n-r)!)
        let result = 1;
        for (let i = 1; i <= r; i++) {
            result *= (n - r + i) / i;
        }
        
        return Math.round(result); // 四舍五入以处理浮点精度问题
    }
    
    // 更新历史记录
    updateHistory() {
        if (!this.historyDisplay) return;
        
        // 清空历史显示
        this.historyDisplay.innerHTML = '';
        
        // 倒序显示历史记录（最新的在上面）
        for (let i = this.history.length - 1; i >= 0; i--) {
            const item = this.history[i];
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.expression = item.expression || '';
            
            // 创建表达式容器
            const expressionDiv = document.createElement('div');
            expressionDiv.className = 'history-expression';
            expressionDiv.textContent = item.text || `${item.expression} = ${item.result}`;
            historyItem.appendChild(expressionDiv);
            
            // 仅当设置开启且有时间戳时添加时间戳
            if (this.settingsObj.showTimestamps && item.timestamp) {
                const timestampDiv = document.createElement('div');
                timestampDiv.className = 'history-timestamp';
                timestampDiv.textContent = this.display.formatTimestamp(item.timestamp);
                historyItem.appendChild(timestampDiv);
            }
            
            this.historyDisplay.appendChild(historyItem);
        }
    }
    
    // 添加到历史记录
    addToHistory(expression, result) {
        const historyEntry = {
            expression: expression,
            result: result,
            text: `${expression} = ${result}`,
            timestamp: new Date().toISOString()
        };
        
        // 添加到历史记录
        this.history.push(historyEntry);
        this.historyExpressions.push(historyEntry.text);
        
        // 如果设置了最大历史记录数量，保持历史记录在限制以内
        const maxHistoryLength = this.settingsObj.maxHistoryItems || 10;
        if (this.history.length > maxHistoryLength) {
            this.history = this.history.slice(-maxHistoryLength);
            this.historyExpressions = this.historyExpressions.slice(-maxHistoryLength);
        }
        
        // 更新历史显示
        this.updateHistory();
        
        // 保存到本地存储
        this.saveHistoryToStorage();
    }
    
    // 加载历史表达式
    loadHistoryExpression(expressionText) {
        // 从历史记录文本中提取表达式部分
        const match = expressionText.match(/(.*?)\s*=\s*.*/);
        if (match && match[1]) {
            this.expression = match[1];
        } else {
            this.expression = expressionText;
        }
        this.updateDisplay();
        // 确保加载历史后调整高度
        this.adjustTextareaHeight();
        this.saveExpressionToStorage();
    }
    
    // 保存表达式到本地存储
    saveExpressionToStorage() {
        this.storage.saveExpression(this.expression);
    }
    
    // 保存历史记录到本地存储
    saveHistoryToStorage() {
        this.storage.saveHistory(this.history);
    }
    
    // 内存相关操作
    memoryAdd() {
        try {
            // 尝试求值当前表达式
            const currentValue = this.calculateExpression(this.prepareExpression(this.expression));
            if (!isNaN(currentValue) && isFinite(currentValue)) {
                this.memory += currentValue;
                this.showOperation('M+ ' + currentValue);
            }
        } catch (error) {
            this.showErrorMessage('无法添加到内存: ' + error.message);
        }
    }
    
    memorySubtract() {
        try {
            // 尝试求值当前表达式
            const currentValue = this.calculateExpression(this.prepareExpression(this.expression));
            if (!isNaN(currentValue) && isFinite(currentValue)) {
                this.memory -= currentValue;
                this.showOperation('M- ' + currentValue);
            }
        } catch (error) {
            this.showErrorMessage('无法从内存减去: ' + error.message);
        }
    }
    
    memoryRecall() {
        if (this.memory === 0) {
            this.showOperation('内存为空');
            return;
        }
        
        // 如果当前表达式是0或者正在输入中，直接替换
        if (this.expression === '0') {
            this.expression = this.memory.toString();
        } else {
            // 否则在光标位置插入内存值
            this.insertTextAtCursor(this.memory.toString());
        }
        
        this.updateDisplay();
        this.showOperation('MR: ' + this.memory);
    }
    
    memoryClear() {
        this.memory = 0;
        this.showOperation('内存已清除');
    }
    
    // 切换正负号
    toggleSign() {
        const cursorPos = this.currentInput.selectionStart;
        const cursorEnd = this.currentInput.selectionEnd;
        const currentValue = this.currentInput.value;
        
        // 如果有选择文本，仅对选择部分进行操作
        if (cursorPos !== cursorEnd) {
            const selectedText = currentValue.substring(cursorPos, cursorEnd);
            const negatedText = this.negateExpression(selectedText);
            
            const beforeText = currentValue.substring(0, cursorPos);
            const afterText = currentValue.substring(cursorEnd);
            
            this.expression = beforeText + negatedText + afterText;
            this.updateDisplay();
            
            // 设置新的光标位置
            this.currentInput.setSelectionRange(
                cursorPos,
                cursorPos + negatedText.length
            );
        } 
        // 如果表达式以"-"开头，去掉这个负号
        else if (this.expression.startsWith('-')) {
            this.expression = this.expression.substring(1);
            this.updateDisplay();
            this.currentInput.setSelectionRange(cursorPos - 1, cursorPos - 1);
        } 
        // 否则，在表达式开头添加负号
        else {
            this.expression = '-' + this.expression;
            this.updateDisplay();
            this.currentInput.setSelectionRange(cursorPos + 1, cursorPos + 1);
        }
        
        this.saveExpressionToStorage();
    }
    
    // 处理表达式取反
    negateExpression(expr) {
        // 如果表达式以"-"开头，去掉这个负号
        if (expr.startsWith('-')) {
            return expr.substring(1);
        } 
        // 否则，在表达式开头添加负号
        else {
            return '-' + expr;
        }
    }
    
    // 复制结果
    copyResult() {
        if (!this.copyBtn || this.copyBtn.disabled) return;
        
        try {
            const textToCopy = this.currentInput.value;
            
            // 创建临时textarea元素
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            
            // 选择并复制
            textarea.select();
            document.execCommand('copy');
            
            // 删除临时元素
            document.body.removeChild(textarea);
            
            // 复制成功的视觉反馈
            this.copyBtn.classList.add('copied');
            this.copyBtn.title = '已复制!';
            
            setTimeout(() => {
                this.copyBtn.classList.remove('copied');
                this.copyBtn.title = '复制结果';
            }, 1500);
        } catch (error) {
            console.error("复制失败:", error);
            this.copyBtn.title = '复制失败';
        }
    }
    
    // 处理键盘输入
    handleKeyboardInput(event) {
        // 防止特殊按键的默认行为（如 / 触发页内搜索）
        const preventDefaultKeys = ['/', '*', '+', '-', '=', 'Enter'];
        if (preventDefaultKeys.includes(event.key)) {
            event.preventDefault();
        }
        
        // 处理各种按键输入
        switch(event.key) {
            case 'Enter':
            case '=':
                this.evaluate();
                event.preventDefault();
                break;
            case 'Escape':
                this.clear();
                event.preventDefault();
                break;
            case 'Delete':
                this.clear();
                event.preventDefault();
                break;
            case 'Backspace':
                // 让浏览器自己处理退格键
                break;
            case '+':
                this.insertTextAtCursor('+');
                event.preventDefault();
                break;
            case '-':
                this.insertTextAtCursor('-');
                event.preventDefault();
                break;
            case '*':
                this.insertTextAtCursor('×');
                event.preventDefault();
                break;
            case '/':
                this.insertTextAtCursor('÷');
                event.preventDefault();
                break;
            case '%':
                this.insertTextAtCursor('%');
                event.preventDefault();
                break;
            case '^':
                this.insertTextAtCursor('^');
                event.preventDefault();
                break;
            case '(':
                this.insertTextAtCursor('(');
                event.preventDefault();
                break;
            case ')':
                this.insertTextAtCursor(')');
                event.preventDefault();
                break;
            case '[':
                this.insertTextAtCursor('[');
                event.preventDefault();
                break;
            case ']':
                this.insertTextAtCursor(']');
                event.preventDefault();
                break;
            case 'p':
                if (event.ctrlKey || event.metaKey) return; // 避免干扰复制粘贴等操作
                this.insertTextAtCursor('π');
                event.preventDefault();
                break;
            case 'e':
                if (event.ctrlKey || event.metaKey) return; // 避免干扰复制粘贴等操作
                this.insertTextAtCursor('e');
                event.preventDefault();
                break;
            case '!':
                this.insertTextAtCursor('!');
                event.preventDefault();
                break;
        }
    }
    
    // 备份数据
    backupDataBeforeClear() {
        this.lastBackupData = {
            history: [...this.history],
            expression: this.expression,
            memory: this.memory,
            angleMode: this.angleMode,
            constants: {...this.constants}
        };
    }
    
    // 从备份恢复数据
    restoreDataFromBackup() {
        if (!this.lastBackupData) return;
        
        this.history = [...this.lastBackupData.history];
        this.expression = this.lastBackupData.expression;
        this.memory = this.lastBackupData.memory;
        this.angleMode = this.lastBackupData.angleMode;
        this.constants = {...this.lastBackupData.constants};
        
        // 更新UI
        this.updateHistory();
        this.updateDisplay();
        this.updateAngleModeButtons();
        this.renderConstants();
        
        // 禁用恢复按钮
        const undoBtn = document.getElementById('undoClearData');
        if (undoBtn) {
            undoBtn.disabled = true;
        }
        
        // 保存到存储
        this.saveHistoryToStorage();
        this.saveExpressionToStorage();
        this.saveConstantsToStorage();
    }
    
    // 更新角度模式按钮状态
    updateAngleModeButtons() {
        const angleBtns = document.querySelectorAll('.angle-mode-btn');
        angleBtns.forEach(btn => {
            if (btn.dataset.mode === this.angleMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // 设置角度模式
    setAngleMode(mode) {
        if (['DEG', 'RAD', 'GRAD'].includes(mode)) {
            this.angleMode = mode;
            this.updateAngleModeButtons();
        }
    }
    
    // 显示错误消息
    showErrorMessage(message) {
        if (this.errorDisplay) {
            this.errorDisplay.textContent = message;
            this.errorDisplay.style.opacity = '1';
            this.currentInput.classList.add('error');
            
            // 调整错误消息的显示高度
            this.adjustTextareaHeight();
            
            console.error("计算器错误:", message);
            
            // 3秒后自动清除错误
            setTimeout(() => {
                this.clearErrorMessage();
            }, 3000);
        }
    }
    
    // 清除错误消息
    clearErrorMessage() {
        if (this.errorDisplay) {
            this.errorDisplay.textContent = '';
            this.errorDisplay.style.opacity = '0';
            this.currentInput.classList.remove('error');
        }
    }
    
    // 显示临时操作消息
    showOperation(message) {
        if (this.errorDisplay) {
            this.errorDisplay.textContent = message;
            this.errorDisplay.style.opacity = '1';
            
            // 1.5秒后自动清除消息
            setTimeout(() => {
                this.clearErrorMessage();
            }, 1500);
        }
    }
    
    // 处理EXP按钮（科学计数法输入）
    handleEXP() {
        // 检查表达式中是否已有数字
        if (this.expression && /\d/.test(this.expression)) {
            this.insertTextAtCursor('e');
        } else {
            this.showErrorMessage('请先输入数字');
        }
    }
    
    // 插入随机数
    insertRandom() {
        // 生成0到1之间的随机数，并保留设置的小数位数
        const decimalPlaces = this.settingsObj.decimalPlaces || 5;
        const randomNumber = Math.random().toFixed(decimalPlaces);
        this.insertTextAtCursor(randomNumber);
        this.saveExpressionToStorage(); // 保存更改到存储
    }
    
    // 处理平方
    handleSquare() {
        try {
            const cursorPos = this.currentInput.selectionStart;
            const textBefore = this.expression.substring(0, cursorPos);
            
            // 检查光标前是否有完整的数字或表达式
            const lastNumberRegex = /(\d+(\.\d+)?|\)|\])$/;
            const match = textBefore.match(lastNumberRegex);
            
            if (match) {
                // 找到了数字或闭合括号
                const startPos = textBefore.lastIndexOf(match[0]);
                const numberOrExpr = match[0];
                
                // 在数字后面添加^2
                this.expression = textBefore.substring(0, startPos) + 
                                  '(' + numberOrExpr + ')^2' + 
                                  this.expression.substring(cursorPos);
                
                // 更新显示并设置光标位置
                this.updateDisplay();
                const newCursorPos = startPos + numberOrExpr.length + 3;
                this.currentInput.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                // 没找到数字，直接添加 x^2
                this.insertTextAtCursor('x^2');
            }
        } catch (error) {
            console.error('平方操作错误:', error);
            this.insertTextAtCursor('^2');
        }
    }
    
    // 处理立方
    handleCube() {
        try {
            const cursorPos = this.currentInput.selectionStart;
            const textBefore = this.expression.substring(0, cursorPos);
            
            // 检查光标前是否有完整的数字或表达式
            const lastNumberRegex = /(\d+(\.\d+)?|\)|\])$/;
            const match = textBefore.match(lastNumberRegex);
            
            if (match) {
                // 找到了数字或闭合括号
                const startPos = textBefore.lastIndexOf(match[0]);
                const numberOrExpr = match[0];
                
                // 在数字后面添加^3
                this.expression = textBefore.substring(0, startPos) + 
                                  '(' + numberOrExpr + ')^3' + 
                                  this.expression.substring(cursorPos);
                
                // 更新显示并设置光标位置
                this.updateDisplay();
                const newCursorPos = startPos + numberOrExpr.length + 3;
                this.currentInput.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                // 没找到数字，直接添加 x^3
                this.insertTextAtCursor('x^3');
            }
        } catch (error) {
            console.error('立方操作错误:', error);
            this.insertTextAtCursor('^3');
        }
    }
    
    // 处理立方根
    handleCubeRoot() {
        try {
            const cursorPos = this.currentInput.selectionStart;
            const textBefore = this.expression.substring(0, cursorPos);
            
            // 检查光标前是否有完整的数字或表达式
            const lastNumberRegex = /(\d+(\.\d+)?|\)|\])$/;
            const match = textBefore.match(lastNumberRegex);
            
            if (match) {
                // 找到了数字或闭合括号
                const startPos = textBefore.lastIndexOf(match[0]);
                const numberOrExpr = match[0];
                
                // 在数字上应用立方根
                this.expression = textBefore.substring(0, startPos) + 
                                  'cbrt(' + numberOrExpr + ')' + 
                                  this.expression.substring(cursorPos);
                
                // 更新显示并设置光标位置
                this.updateDisplay();
                const newCursorPos = startPos + 5 + numberOrExpr.length + 1;
                this.currentInput.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                // 没找到数字，插入函数
                this.insertFunction('cbrt');
            }
        } catch (error) {
            console.error('立方根操作错误:', error);
            this.insertFunction('cbrt');
        }
    }
    
    // 处理向上取整
    handleCeil() {
        try {
            const cursorPos = this.currentInput.selectionStart;
            const textBefore = this.expression.substring(0, cursorPos);
            
            // 检查光标前是否有完整的数字或表达式
            const lastNumberRegex = /(\d+(\.\d+)?|\)|\])$/;
            const match = textBefore.match(lastNumberRegex);
            
            if (match) {
                // 找到了数字或闭合括号
                const startPos = textBefore.lastIndexOf(match[0]);
                const numberOrExpr = match[0];
                
                // 应用向上取整
                this.expression = textBefore.substring(0, startPos) + 
                                  'ceil(' + numberOrExpr + ')' + 
                                  this.expression.substring(cursorPos);
                
                // 更新显示并设置光标位置
                this.updateDisplay();
                const newCursorPos = startPos + 5 + numberOrExpr.length + 1;
                this.currentInput.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                // 没找到数字，插入函数
                this.insertFunction('ceil');
            }
        } catch (error) {
            console.error('向上取整操作错误:', error);
            this.insertFunction('ceil');
        }
    }
    
    // 处理向下取整
    handleFloor() {
        try {
            const cursorPos = this.currentInput.selectionStart;
            const textBefore = this.expression.substring(0, cursorPos);
            
            // 检查光标前是否有完整的数字或表达式
            const lastNumberRegex = /(\d+(\.\d+)?|\)|\])$/;
            const match = textBefore.match(lastNumberRegex);
            
            if (match) {
                // 找到了数字或闭合括号
                const startPos = textBefore.lastIndexOf(match[0]);
                const numberOrExpr = match[0];
                
                // 应用向下取整
                this.expression = textBefore.substring(0, startPos) + 
                                  'floor(' + numberOrExpr + ')' + 
                                  this.expression.substring(cursorPos);
                
                // 更新显示并设置光标位置
                this.updateDisplay();
                const newCursorPos = startPos + 6 + numberOrExpr.length + 1;
                this.currentInput.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                // 没找到数字，插入函数
                this.insertFunction('floor');
            }
        } catch (error) {
            console.error('向下取整操作错误:', error);
            this.insertFunction('floor');
        }
    }
    
    // 处理四舍五入
    handleRound() {
        try {
            const cursorPos = this.currentInput.selectionStart;
            const textBefore = this.expression.substring(0, cursorPos);
            
            // 检查光标前是否有完整的数字或表达式
            const lastNumberRegex = /(\d+(\.\d+)?|\)|\])$/;
            const match = textBefore.match(lastNumberRegex);
            
            if (match) {
                // 找到了数字或闭合括号
                const startPos = textBefore.lastIndexOf(match[0]);
                const numberOrExpr = match[0];
                
                // 应用四舍五入
                this.expression = textBefore.substring(0, startPos) + 
                                  'round(' + numberOrExpr + ')' + 
                                  this.expression.substring(cursorPos);
                
                // 更新显示并设置光标位置
                this.updateDisplay();
                const newCursorPos = startPos + 6 + numberOrExpr.length + 1;
                this.currentInput.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                // 没找到数字，插入函数
                this.insertFunction('round');
            }
        } catch (error) {
            console.error('四舍五入操作错误:', error);
            this.insertFunction('round');
        }
    }
    
    // 初始化常量面板
    initConstantsPanel() {
        const addBtn = document.getElementById('addConstant');
        const nameInput = document.getElementById('constantName');
        const valueInput = document.getElementById('constantValue');
        const clearBtn = document.getElementById('clearConstants');
        
        if (addBtn && nameInput && valueInput) {
            // 添加常量按钮
            addBtn.addEventListener('click', (e) => {
                // 防止默认行为导致失去焦点
                e.preventDefault();
                
                this.addConstant(nameInput.value, valueInput.value);
                nameInput.value = '';
                valueInput.value = '';
                nameInput.focus();
            });
            
            // 回车键添加常量
            const handleEnterKey = (e) => {
                if (e.key === 'Enter' && nameInput.value && valueInput.value) {
                    e.preventDefault();
                    this.addConstant(nameInput.value, valueInput.value);
                    nameInput.value = '';
                    valueInput.value = '';
                    nameInput.focus();
                }
            };
            
            nameInput.addEventListener('keydown', handleEnterKey);
            valueInput.addEventListener('keydown', handleEnterKey);
        }
        
        // 清除所有常量
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                // 防止可能的冒泡和默认行为导致失去焦点
                e.preventDefault();
                e.stopPropagation();
                
                if (confirm('确定要清除所有常量吗?')) {
                    this.constants = {};
                    this.renderConstants();
                    this.saveConstantsToStorage();
                }
            });
        }
        
        // 初始化常量列表
        this.renderConstants();
    }
    
    // 添加常量
    addConstant(name, value) {
        if (!name || !value) {
            this.showErrorMessage("常量名和值不能为空");
            return;
        }
        
        // 验证常量名是否符合变量命名规范
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
            this.showErrorMessage("常量名必须以字母或下划线开头");
            return;
        }
        
        // 尝试计算常量值
        try {
            // 替换常量值中可能出现的其他常量引用
            let evaluatedValue = value;
            for (const [constName, constVal] of Object.entries(this.constants)) {
                evaluatedValue = evaluatedValue.replace(new RegExp('\\b' + constName + '\\b', 'g'), constVal);
            }
            
            // 替换特殊字符
            evaluatedValue = evaluatedValue.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E');
            
            // 计算值
            const result = this.calculateExpression(evaluatedValue);
            
            // 保存常量
            this.constants[name] = result;
            this.renderConstants();
            this.saveConstantsToStorage();
            
            this.showOperation(`常量 ${name} = ${result} 已添加`);
        } catch (error) {
            this.showErrorMessage(`常量值计算错误: ${error.message}`);
        }
    }
    
    // 删除常量
    deleteConstant(name) {
        if (name in this.constants) {
            delete this.constants[name];
            this.renderConstants();
            this.saveConstantsToStorage();
            this.showOperation(`常量 ${name} 已删除`);
        }
    }
    
    // 使用常量
    useConstant(name) {
        if (name in this.constants) {
            this.insertTextAtCursor(name);
        }
    }
    
    // 渲染常量列表
    renderConstants() {
        if (!this.constantsList) return;
        
        this.constantsList.innerHTML = '';
        
        // 按字母顺序排序常量
        const sortedConstants = Object.entries(this.constants).sort((a, b) => a[0].localeCompare(b[0]));
        
        sortedConstants.forEach(([name, value]) => {
            const constantItem = document.createElement('div');
            constantItem.className = 'constant-item';
            
            const definition = document.createElement('div');
            definition.className = 'constant-definition';
            definition.textContent = `${name} = ${value}`;
            
            const actions = document.createElement('div');
            actions.className = 'constant-actions';
            
            // 使用常量按钮
            const useBtn = document.createElement('button');
            useBtn.className = 'use-constant-btn';
            useBtn.innerHTML = '➕';
            useBtn.title = `使用常量 ${name}`;
            useBtn.addEventListener('click', (e) => {
                // 阻止事件冒泡和默认行为
                e.preventDefault();
                e.stopPropagation();
                
                // 检查当前是否在输入框中
                const activeElement = document.activeElement;
                if (activeElement.tagName === 'INPUT' && activeElement.type === 'text') {
                    // 如果在输入框中，检查是否在常量名或值输入框中
                    const constantName = document.getElementById('constantName');
                    const constantValue = document.getElementById('constantValue');
                    
                    if (activeElement === constantName || activeElement === constantValue) {
                        // 在当前输入框插入常量名
                        const cursorPos = activeElement.selectionStart;
                        const value = activeElement.value;
                        activeElement.value = value.substring(0, cursorPos) + name + value.substring(cursorPos);
                        activeElement.setSelectionRange(cursorPos + name.length, cursorPos + name.length);
                    } else {
                        // 否则使用默认行为
                        this.useConstant(name);
                    }
                } else {
                    // 如果不在输入框中，使用默认行为
                    this.useConstant(name);
                }
            });
            
            // 删除常量按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-constant-btn';
            deleteBtn.innerHTML = '✕';
            deleteBtn.title = `删除常量 ${name}`;
            deleteBtn.addEventListener('click', (e) => {
                // 阻止事件冒泡和默认行为
                e.preventDefault();
                e.stopPropagation();
                
                this.deleteConstant(name);
            });
            
            actions.appendChild(useBtn);
            actions.appendChild(deleteBtn);
            
            constantItem.appendChild(definition);
            constantItem.appendChild(actions);
            
            this.constantsList.appendChild(constantItem);
        });
    }
    
    // 保存常量到存储
    saveConstantsToStorage() {
        this.storage.saveConstants(this.constants);
    }

    /**
     * 设置输入框的光标位置，确保在不同浏览器中都能正常工作
     * @param {number} start - 光标起始位置
     * @param {number} end - 光标结束位置，默认与起始位置相同
     */
    setCursorPosition(start, end = start) {
        // 确保输入框获得焦点
        this.currentInput.focus();
        
        // 延迟设置光标位置以确保在多行文本区域中正常工作
        setTimeout(() => {
            this.currentInput.selectionStart = start;
            this.currentInput.selectionEnd = end;
        }, 0);
    }
}

// 导出
export default Calculator; 