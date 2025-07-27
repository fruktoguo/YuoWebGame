/**
 * 五行炼丹系统 - 核心JavaScript代码
 * 
 * 系统特点：
 * 1. 基于五行相生相克的属性计算
 * 2. 支持操作队列预设炼丹流程
 * 3. 火力控制影响炼化速度和效率
 * 4. 实时材料药力消耗和属性转换
 */

// ==================== 数据定义 ====================

// 从配置文件中获取数据
const elements = window.AlchemyConfig.elements;
const elementRelations = window.AlchemyConfig.elementRelations;
const materialsData = window.AlchemyConfig.materialsData;
const recipesData = window.AlchemyConfig.recipesData;
const gameConfig = window.AlchemyConfig.gameConfig;

/**
 * 五行元素对应的CSS类名
 */
const elementColors = {
    '金': 'element-gold',
    '木': 'element-wood',
    '水': 'element-water',
    '火': 'element-fire',
    '土': 'element-earth'
};

// ==================== 游戏状态管理 ====================

/**
 * 游戏全局状态
 */
let gameState = {
    currentAttributes: {},        // 当前炼化出的五行属性值
    materialQueue: [],           // 炉中材料队列
    recipeQueue: [],             // 丹方队列（替代原操作队列）

    // 模拟控制
    isRunning: false,            // 是否正在运行模拟
    currentTime: 0,              // 当前模拟时间（秒）
    endTime: gameConfig.defaultEndTime,    // 模拟结束时间
    simulationSpeed: gameConfig.defaultSimulationSpeed, // 模拟速度倍率
    fireIntensity: gameConfig.defaultFireIntensity,     // 当前火力强度

    // 目标丹药
    targetRecipe: null,          // 目标丹药名称
    targetAchieved: false,       // 是否达成目标

    // 日志系统
    logs: []                     // 操作日志
};

/**
 * 游戏主循环定时器
 */
let gameInterval = null;

// ==================== 初始化函数 ====================



/**
 * 初始化丹药选择器
 */
function initializeRecipeSelector() {
    const select = document.getElementById('selectedRecipe');
    select.innerHTML = '<option value="">-- 选择目标丹药 --</option>';

    Object.entries(recipesData).forEach(function ([recipeName, requirements]) {
        const option = document.createElement('option');
        option.value = recipeName;

        // 格式化属性需求显示
        const attrText = Object.entries(requirements)
            .map(function ([element, value]) {
                return element + ':' + value;
            })
            .join(' ');

        option.textContent = recipeName + ' (' + attrText + ')';
        select.appendChild(option);
    });
}

/**
 * 初始化丹方选择器
 */
function initializeRecipeFormulas() {
    const select = document.getElementById('recipeFormulaSelect');
    select.innerHTML = '<option value="">-- 选择预设丹方 --</option>';

    Object.keys(window.AlchemyConfig.recipeFormulas).forEach(function (recipeName) {
        const option = document.createElement('option');
        option.value = recipeName;
        option.textContent = recipeName;
        select.appendChild(option);
    });
}

/**
 * 应用选中的丹方 - 增强版：自动设置目标并重置
 */
function applySelectedRecipe() {
    const select = document.getElementById('recipeFormulaSelect');
    const selectedRecipe = select.value;

    if (!selectedRecipe) {
        addLog('请先选择一个丹方');
        return;
    }

    const formula = window.AlchemyConfig.recipeFormulas[selectedRecipe];
    if (!formula) {
        addLog('丹方配置错误：' + selectedRecipe);
        return;
    }

    // 清除炼丹日志
    gameState.logs = [];

    // 先重置模拟器状态
    resetSimulation();

    // 自动设置目标丹药
    const recipeSelect = document.getElementById('selectedRecipe');
    recipeSelect.value = selectedRecipe;
    gameState.targetRecipe = selectedRecipe;
    gameState.targetAchieved = false;

    // 执行设定目标的操作
    setTargetRecipe();

    addLog('🎯 自动设定目标丹药: ' + selectedRecipe);

    // 清空当前队列
    gameState.recipeQueue = [];

    // 添加材料操作到队列
    formula.materials.forEach(function (material) {
        gameState.recipeQueue.push({
            type: 'material',
            name: material.name,
            amount: material.amount,
            delay: material.delay,
            executed: false
        });
    });

    // 添加火力操作到队列
    formula.fireSequence.forEach(function (fire) {
        gameState.recipeQueue.push({
            type: 'fire',
            intensity: fire.intensity,
            delay: fire.delay,
            executed: false
        });
    });

    // 添加结束炼丹操作到队列
    gameState.recipeQueue.push({
        type: 'end',
        delay: formula.recommendedEndTime || gameConfig.defaultEndTime, // 使用推荐结束时间或默认
        executed: false
    });

    // 按时间排序
    gameState.recipeQueue.sort(function (a, b) {
        return a.delay - b.delay;
    });

    // 自动设置推荐的结束时间
    if (formula.recommendedEndTime) {
        gameState.endTime = formula.recommendedEndTime;
        document.getElementById('endTime').value = formula.recommendedEndTime;
        document.getElementById('endTimeDisplay').textContent = formula.recommendedEndTime;
        addLog('⏰ 自动设置炼制时长为 ' + formula.recommendedEndTime + ' 秒');
    }

    addLog('✨ 已应用丹方：' + selectedRecipe);
    addLog('📋 材料 ' + formula.materials.length + ' 种，火力调节 ' + formula.fireSequence.length + ' 次');
    addLog('🔄 模拟器已重置，准备就绪');

    // 更新所有显示
    updateRecipeQueueDisplay();
    updateTargetDisplay();
    updateDisplays();
}

/**
 * 更新丹方描述显示
 */
function updateRecipeDescription() {
    const select = document.getElementById('recipeFormulaSelect');
    const descDiv = document.getElementById('recipeDescription');
    const selectedRecipe = select.value;

    if (!selectedRecipe) {
        descDiv.textContent = '选择丹方查看详细说明';
        updateMaterialPreview(null);
        return;
    }

    const formula = window.AlchemyConfig.recipeFormulas[selectedRecipe];
    if (formula && formula.description) {
        descDiv.textContent = formula.description;
        updateMaterialPreview(formula);
    } else {
        descDiv.textContent = '暂无描述';
        updateMaterialPreview(null);
    }
}

/**
 * 清空丹方队列
 */
function clearRecipeQueue() {
    gameState.recipeQueue = [];
    addLog('🗑️ 已清空丹方队列');
    updateRecipeQueueDisplay();
}

/**
 * 处理丹方队列中的操作
 */
function processRecipeQueue() {
    if (!gameState.recipeQueue || gameState.recipeQueue.length === 0) return;

    gameState.recipeQueue.forEach(function (operation) {
        if (!operation.executed && gameState.currentTime >= operation.delay) {
            executeRecipeOperation(operation);
            operation.executed = true;
        }
    });
}

/**
 * 执行丹方操作
 */
function executeRecipeOperation(operation) {
    switch (operation.type) {
        case 'material':
            if (operation.name && operation.amount > 0) {
                // 添加材料到炉中
                const materialData = materialsData[operation.name];
                if (materialData) {
                    for (let i = 0; i < operation.amount; i++) {
                        const material = Object.assign({ name: operation.name, addedAt: gameState.currentTime }, materialData);
                        gameState.materialQueue.push(material);
                    }
                    addLog(`🌿 添加材料: <span class="material-name">${operation.name}</span> × <span class="amount">${operation.amount}</span>`);
                } else {
                    addLog(`❌ 材料数据错误: ${operation.name}`);
                }
            }
            break;

        case 'fire':
            // 火力操作现在由updateFireFromRecipeQueue()处理，这里只记录日志
            if (operation.intensity >= 1 && operation.intensity <= 10) {
                addLog(`🔥 火力调节: <span class="fire-level">${operation.intensity}</span>`);
            }
            break;

        case 'end':
            // 结束炼丹操作
            gameState.isRunning = false;
            addLog(`⚗️ 炼丹结束`);
            updateSimulationControls();
            break;

        default:
            addLog(`❌ 未知操作类型: ${operation.type}`);
            break;
    }
}

// ==================== 丹方系统 ====================

/**
 * 页面初始化主函数
 */
function initPage() {
    console.log('初始化五行炼丹系统...');



    // 初始化丹药选择器
    initializeRecipeSelector();

    // 初始化丹方选择器
    initializeRecipeFormulas();

    // 绑定事件监听器
    bindEventListeners();

    // 初始化显示
    updateDisplays();

    console.log('系统初始化完成');
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    // 目标丹药相关
    document.getElementById('setTargetBtn').addEventListener('click', setTargetRecipe);
    document.getElementById('craftBtn').addEventListener('click', craftTargetRecipe);

    // 操作按钮
    document.getElementById('addMaterialOperationBtn').addEventListener('click', addMaterialOperation);
    document.getElementById('addFireOperationBtn').addEventListener('click', addFireOperation);
    document.getElementById('addEndOperationBtn').addEventListener('click', addEndOperation);

    // 模拟控制
    document.getElementById('toggleRunning').addEventListener('click', toggleSimulation);
    document.getElementById('setEndTimeBtn').addEventListener('click', setEndTime);
    document.getElementById('simulationSpeed').addEventListener('input', updateSpeedDisplay);

    // 丹方系统
    document.getElementById('recipeFormulaSelect').addEventListener('change', updateRecipeDescription);
    document.getElementById('applyRecipeBtn').addEventListener('click', applySelectedRecipe);
    document.getElementById('clearRecipeBtn').addEventListener('click', clearRecipeQueue);
}

// ==================== 显示更新函数 ====================

/**
 * 更新丹药需求属性显示
 */
function updateRecipeDisplay() {
    const selectedRecipe = document.getElementById('selectedRecipe').value;
    const recipe = recipesData[selectedRecipe];
    const container = document.getElementById('recipeAttributes');

    container.innerHTML = '';
    Object.entries(recipe).forEach(function ([element, value]) {
        const span = document.createElement('span');
        span.className = 'inline-block mr-2 ' + elementColors[element];
        span.textContent = element + ':' + value;
        container.appendChild(span);
    });
}



// ==================== 目标丹药和模拟控制 ====================

/**
 * 设定目标丹药
 */
function setTargetRecipe() {
    const recipe = document.getElementById('selectedRecipe').value;
    gameState.targetRecipe = recipe;
    gameState.targetAchieved = false;
    addLog('🎯 设定目标丹药: ' + recipe);
    updateTargetDisplay();
}

/**
 * 设置模拟结束时间
 */
function setEndTime() {
    const endTime = parseInt(document.getElementById('endTime').value) || 30;
    gameState.endTime = endTime;
    addLog('⏰ 设置模拟结束时间: ' + endTime + '秒');
    updateCurrentTime();
}

/**
 * 更新模拟速度显示
 */
function updateSpeedDisplay() {
    const speed = document.getElementById('simulationSpeed').value;
    document.getElementById('speedDisplay').textContent = speed + 'x';
    gameState.simulationSpeed = parseFloat(speed);
}

// ==================== 游戏控制函数 ====================

/**
 * 切换模拟运行状态
 */
function toggleSimulation() {
    // 检查是否设定了目标丹药
    if (!gameState.targetRecipe) {
        addLog('❌ 请先设定目标丹药才能开始炼丹！');
        alert('请先选择并设定目标丹药，然后才能开始炼丹模拟。');
        return;
    }

    gameState.isRunning = !gameState.isRunning;

    const btn = document.getElementById('toggleRunning');

    if (gameState.isRunning) {
        // 重置丹方队列的执行状态
        gameState.recipeQueue.forEach(function (operation) {
            operation.executed = false;
        });

        btn.textContent = '⏸️ 暂停模拟';
        simulationStep();
        addLog('▶️ 开始炼丹模拟 - 目标：' + gameState.targetRecipe);
    } else {
        btn.textContent = '▶️ 开始模拟';
        addLog('⏸️ 暂停模拟');
    }
}

// ==================== 核心炼丹逻辑 ====================

/**
 * 核心炼化处理逻辑
 * 
 * 炼化算法说明：
 * 1. 根据火力计算炼化速度和效率
 * 2. 计算本秒各材料贡献的属性值
 * 3. 按属性值大小排序，依次应用五行相生相克
 * 4. 消耗材料药力
 */
function processAlchemy() {
    // 先处理属性流失（无论是否有材料）
    processAttributeDecay();

    // 根据当前时间和丹方队列更新火力
    updateFireFromRecipeQueue();

    if (gameState.materialQueue.length === 0) return;

    // 优化后的炼化参数计算
    // 炼化速度：使用更平滑的曲线，避免火力7最优的问题
    const refineRate = (gameState.fireIntensity * 0.08) + 0.02; // 线性增长：2%-82%

    // 效率计算：重新设计，让不同火力有不同适用场景
    let efficiency;
    if (gameState.fireIntensity <= 3) {
        // 低火力：高效率，适合精细炼制
        efficiency = 1.0 - (gameState.fireIntensity - 1) * 0.02; // 100%-96%
    } else if (gameState.fireIntensity <= 7) {
        // 中火力：平衡效率，适合常规炼制
        efficiency = 0.96 - (gameState.fireIntensity - 3) * 0.03; // 96%-84%
    } else {
        // 高火力：较低效率但速度快，适合快速炼制
        efficiency = 0.84 - (gameState.fireIntensity - 7) * 0.04; // 84%-72%
    }

    // 计算本秒所有材料贡献的属性值
    const thisSecondAttributes = {};
    const materialContributions = {}; // 记录每种材料的贡献

    gameState.materialQueue.forEach(function (material) {
        const materialName = material.name;
        if (!materialContributions[materialName]) {
            materialContributions[materialName] = { count: 0, contributions: {} };
        }
        materialContributions[materialName].count++;

        Object.entries(material).forEach(function ([element, value]) {
            if (element !== 'name' && element !== 'addedAt' && typeof value === 'number') {
                const refined = value * refineRate * efficiency;
                thisSecondAttributes[element] = (thisSecondAttributes[element] || 0) + refined;

                // 记录材料贡献
                if (!materialContributions[materialName].contributions[element]) {
                    materialContributions[materialName].contributions[element] = 0;
                }
                materialContributions[materialName].contributions[element] += refined;
            }
        });
    });

    // 先不记录基础炼化日志，等五行计算完成后一起记录

    // 按属性值大小排序，用于五行相生相克计算（包括负值）
    const sortedElements = Object.entries(thisSecondAttributes)
        .sort(function ([, a], [, b]) { return Math.abs(b) - Math.abs(a); }) // 按绝对值排序
        .map(function ([element]) { return element; });

    // 应用五行相生相克规则并合并日志
    const newAttributes = Object.assign({}, gameState.currentAttributes);
    const alchemyResults = []; // 存储炼化结果用于合并日志

    sortedElements.forEach(function (element) {
        const newValue = thisSecondAttributes[element];
        const currentValue = gameState.currentAttributes[element] || 0;
        let finalValue = newValue;
        let logParts = [];

        // 检查与现有属性的相生相克关系 - 修复：基于新增属性值计算
        Object.entries(gameState.currentAttributes).forEach(function ([existingElement, existingValue]) {
            if (existingValue <= 0) return; // 跳过没有值的属性

            const relation = elementRelations[existingElement];
            if (!relation) return; // 跳过未定义的关系

            if (relation.generates === element) {
                // 相生：基于新增属性值的10%加成，而不是现有属性值
                const bonus = newValue * 0.1;
                if (bonus > 0.01) {
                    finalValue += bonus;
                    logParts.push(`<span class="generate-bonus">(${existingElement}生:${newValue.toFixed(1)}×10%=+${bonus.toFixed(1)})</span>`);
                }
            } else if (relation.destroys === element) {
                // 相克：新增属性减少10%
                const beforeClash = finalValue;
                finalValue *= 0.9;
                const reduction = beforeClash - finalValue;
                if (reduction > 0.01) {
                    logParts.push(`<span class="destroy-penalty">(${existingElement}克:${beforeClash.toFixed(1)}×90%=-${reduction.toFixed(1)})</span>`);
                }
            }
        });

        // 更新最终属性值
        const totalGain = finalValue;
        newAttributes[element] = currentValue + totalGain;

        // 只记录有增量的属性
        if (Math.abs(totalGain) > 0.01) {
            const baseText = `<span class="element-${element}">${element}:+${newValue.toFixed(1)}</span>`;
            const effectsText = logParts.length > 0 ? logParts.join('') : '';
            const finalText = `→<span class="element-${element}">${totalGain.toFixed(1)}</span>`;
            alchemyResults.push(baseText + effectsText + finalText);
        }
    });

    // 合并记录炼化药力日志
    if (alchemyResults.length > 0) {
        // 生成材料构成信息
        const materialSources = Object.entries(materialContributions)
            .filter(([name, data]) => data.count > 0)
            .map(([name, data]) => {
                const contributions = Object.entries(data.contributions)
                    .filter(([element, value]) => value > 0.01)
                    .map(([element, value]) => `<span class="element-${element}">${element}:${value.toFixed(1)}</span>`)
                    .join('');
                return `<span class="material-source">${name}×${data.count}(${contributions})</span>`;
            })
            .join(' ');

        const fireInfo = `<span class="fire-info">(火力:${gameState.fireIntensity} 速度:${(refineRate * 100).toFixed(1)}% 效率:${(efficiency * 100).toFixed(0)}%)</span>`;

        // 分两行显示：第一行显示最终结果，第二行显示材料构成
        addLog(`⚗️ 炼化药力: ${alchemyResults.join(' ')} ${fireInfo}`);
        if (materialSources) {
            addLog(`📦 药力来源: ${materialSources}`);
        }
    }

    gameState.currentAttributes = newAttributes;

    // 消耗材料药力
    const beforeCount = gameState.materialQueue.length;
    gameState.materialQueue = gameState.materialQueue.map(function (material) {
        const updated = Object.assign({}, material);
        Object.keys(updated).forEach(function (key) {
            if (key !== 'name' && key !== 'addedAt' && typeof updated[key] === 'number') {
                updated[key] = Math.max(0, updated[key] - updated[key] * refineRate);
            }
        });
        return updated;
    }).filter(function (material) {
        // 移除药力耗尽的材料
        const totalPower = Object.entries(material)
            .filter(function ([key, value]) { return key !== 'name' && key !== 'addedAt' && typeof value === 'number'; })
            .reduce(function (sum, [, value]) { return sum + value; }, 0);
        return totalPower > 0.1;
    });

    // 如果有材料耗尽，记录日志
    const afterCount = gameState.materialQueue.length;
    if (afterCount < beforeCount) {
        const exhaustedCount = beforeCount - afterCount;
        addLog(`🗑️ 材料消耗: <span class="exhausted">${exhaustedCount}</span> 份材料药力耗尽，剩余 <span class="remaining">${afterCount}</span> 份`);
    }
}

/**
 * 根据丹方队列更新当前火力
 */
function updateFireFromRecipeQueue() {
    if (!gameState.recipeQueue || gameState.recipeQueue.length === 0) return;

    // 找到当前时间应该执行的最新火力操作
    let latestFireOperation = null;
    let latestFireTime = -1;

    gameState.recipeQueue.forEach(function (operation) {
        if (operation.type === 'fire' && operation.delay <= gameState.currentTime) {
            if (operation.delay > latestFireTime) {
                latestFireOperation = operation;
                latestFireTime = operation.delay;
            }
        }
    });

    // 如果找到了火力操作，更新火力
    if (latestFireOperation && latestFireOperation.intensity) {
        const newIntensity = latestFireOperation.intensity;
        if (gameState.fireIntensity !== newIntensity) {
            gameState.fireIntensity = newIntensity;
            // 火力已更新，无需同步UI（因为已删除火力控制区域）
        }
    }
}

/**
 * 处理属性流失
 * 新机制：每秒流失一次，流失速度 = 总属性值/(总属性值+10000)
 * 所有有属性值的当前属性都按相同百分比流失，单位0.1四舍五入
 */
function processAttributeDecay() {
    // 计算当前总属性值
    let totalAttributes = 0;
    elements.forEach(function (element) {
        const value = gameState.currentAttributes[element] || 0;
        if (value > 0) {
            totalAttributes += value;
        }
    });

    // 如果总属性值为0，无需流失
    if (totalAttributes <= 0) {
        return;
    }

    // 计算流失速度：x/(x+10000)
    const decayRate = totalAttributes / (totalAttributes + 10000);

    let hasDecay = false;
    const decayLog = [];

    elements.forEach(function (element) {
        const currentValue = gameState.currentAttributes[element] || 0;
        if (currentValue > 0) {
            // 计算流失量
            const decayAmount = currentValue * decayRate;
            // 四舍五入到0.1
            const roundedDecay = Math.round(decayAmount * 10) / 10;

            if (roundedDecay >= 0.1) {
                const newValue = Math.max(0, currentValue - roundedDecay);
                gameState.currentAttributes[element] = newValue;

                hasDecay = true;
                decayLog.push(element + ':' + currentValue.toFixed(1) + '→' + newValue.toFixed(1) + '(-' + roundedDecay.toFixed(1) + ')');
            }
        }
    });

    if (hasDecay) {
        const coloredDecayLog = decayLog.map(function (entry) {
            const parts = entry.split(':');
            const element = parts[0];
            const values = parts[1];
            return `<span class="element-${element}">${element}:${values}</span>`;
        });
        addLog(`💨 属性流失(<span class="decay-rate">${(decayRate * 100).toFixed(2)}%</span>): ${coloredDecayLog.join(' ')}`);
    }
}

/**
 * 检查目标丹药是否达成
 */
function checkTargetAchievement() {
    if (!gameState.targetRecipe || gameState.targetAchieved) {
        return;
    }

    const recipe = recipesData[gameState.targetRecipe];
    let canCraft = true;

    // 检查每个属性是否满足要求
    Object.entries(recipe).forEach(function ([element, required]) {
        const current = gameState.currentAttributes[element] || 0;
        if (current < required) {
            canCraft = false;
        }
    });

    if (canCraft) {
        gameState.targetAchieved = true;
        addLog('🎉 目标达成！可以炼制 ' + gameState.targetRecipe + '！');
        updateTargetDisplay();
    }
}

/**
 * 手动炼制目标丹药（消耗属性）
 */
function craftTargetRecipe() {
    if (!gameState.targetRecipe || !gameState.targetAchieved) {
        addLog('无法炼制：目标未达成或未设定');
        return;
    }

    const recipe = recipesData[gameState.targetRecipe];

    // 消耗对应属性值
    Object.entries(recipe).forEach(function ([element, required]) {
        gameState.currentAttributes[element] = Math.max(0, (gameState.currentAttributes[element] || 0) - required);
    });

    gameState.targetAchieved = false;
    addLog('✨ 成功炼制 ' + gameState.targetRecipe + '！');
    updateTargetDisplay();
}

// ==================== 日志系统 ====================

/**
 * 添加新操作
 */
function addNewOperation() {
    const newOperation = {
        type: 'material',
        delay: gameState.recipeQueue.length > 0 ? Math.max(...gameState.recipeQueue.map(op => op.delay)) + 5 : 5,
        name: '',
        amount: 1,
        executed: false
    };

    gameState.recipeQueue.push(newOperation);
    gameState.recipeQueue.sort((a, b) => a.delay - b.delay);
    updateRecipeQueueDisplay();
}

/**
 * 添加日志 - 优化颜色分类
 */
function addLog(message) {
    const timestamp = gameState.currentTime.toFixed(1);
    const logEntry = `[${timestamp}s] ${message}`;

    gameState.logs.push(logEntry);

    // 限制日志数量
    if (gameState.logs.length > gameConfig.logMaxEntries) {
        gameState.logs.shift();
    }

    updateLogs();
}

/**
 * 更新日志显示 - 支持HTML内容和丰富颜色
 */
function updateLogs() {
    const container = document.getElementById('logs');
    container.innerHTML = '';

    gameState.logs.forEach(function (log) {
        const div = document.createElement('div');
        div.className = 'log-entry';

        // 根据日志内容添加分类样式
        if (log.includes('🌿') || log.includes('添加材料')) {
            div.classList.add('material');
        } else if (log.includes('🔥') || log.includes('火力')) {
            div.classList.add('fire');
        } else if (log.includes('⚗️') || log.includes('炼化药力')) {
            div.classList.add('alchemy');
        } else if (log.includes('📦') || log.includes('药力来源')) {
            div.classList.add('source');
        } else if (log.includes('💨') || log.includes('属性流失')) {
            div.classList.add('decay');
        } else if (log.includes('❌') || log.includes('错误')) {
            div.classList.add('error');
        } else if (log.includes('⚠️') || log.includes('警告')) {
            div.classList.add('warning');
        } else if (log.includes('✨') || log.includes('成功') || log.includes('达成')) {
            div.classList.add('success');
        }

        // 使用innerHTML来支持HTML标签
        div.innerHTML = log;
        container.appendChild(div);
    });

    // 滚动到底部
    container.scrollTop = container.scrollHeight;
}

// ==================== 显示更新函数 ====================

/**
 * 更新所有显示组件
 */
function updateDisplays() {
    updateCurrentTime();
    updateCurrentAttributes();
    updateMaterialQueueDisplay();
    updateTargetDisplay();
    updateRecipeQueueDisplay();
    updateLogs();
    updateCombinedResult(); // 更新合并后的炼丹结果与品质分析
}

/**
 * 更新当前时间显示
 */
function updateCurrentTime() {
    document.getElementById('currentTime').textContent = gameState.currentTime;
    document.getElementById('endTimeDisplay').textContent = gameState.endTime;
}

/**
 * 更新目标丹药显示
 */
function updateTargetDisplay() {
    const statusText = document.getElementById('targetStatusText');
    const craftBtn = document.getElementById('craftBtn');
    const targetAttributesContainer = document.getElementById('targetAttributes');

    if (!gameState.targetRecipe) {
        statusText.textContent = '未设定目标';
        statusText.className = '';
        craftBtn.disabled = true;
        targetAttributesContainer.innerHTML = '<div class="empty-state">请先选择目标丹药</div>';
    } else {
        // 显示目标属性需求条
        updateTargetAttributesDisplay();

        if (gameState.targetAchieved) {
            statusText.textContent = '✅ 目标达成，可炼制';
            statusText.className = 'element-wood';
            craftBtn.disabled = false;
        } else {
            statusText.textContent = '⏳ 目标设定，炼制中...';
            statusText.className = 'element-fire';
            craftBtn.disabled = true;
        }
    }
}

/**
 * 更新目标属性条显示
 */
function updateTargetAttributesDisplay() {
    const container = document.getElementById('targetAttributes');

    if (!gameState.targetRecipe || !recipesData[gameState.targetRecipe]) {
        container.innerHTML = '<div class="empty-state">请先选择目标丹药</div>';
        return;
    }

    const requirements = recipesData[gameState.targetRecipe];
    const maxRequirement = Math.max(...Object.values(requirements));

    container.innerHTML = '';

    Object.entries(requirements).forEach(function ([element, required]) {
        const current = gameState.currentAttributes[element] || 0;

        const div = document.createElement('div');
        div.className = 'attribute-bar';

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        // 目标需求条（背景）
        const targetFill = document.createElement('div');
        targetFill.className = 'progress-fill';
        targetFill.style.background = '#e5e7eb';
        targetFill.style.width = ((required / maxRequirement) * 100) + '%';

        // 当前进度条（前景）
        const currentFill = document.createElement('div');
        currentFill.className = 'progress-fill progress-' + element;
        const currentPercent = Math.min(100, (current / maxRequirement) * 100);
        currentFill.style.width = currentPercent + '%';
        currentFill.style.position = 'absolute';
        currentFill.style.zIndex = '2';

        // 设置进度条容器为相对定位
        progressBar.style.position = 'relative';

        const progressValue = document.createElement('span');
        progressValue.className = 'progress-value';
        progressValue.textContent = current.toFixed(0) + '/' + required;

        progressBar.appendChild(targetFill);
        progressBar.appendChild(currentFill);
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(progressValue);

        const elementLabel = document.createElement('span');
        elementLabel.className = 'font-medium ' + elementColors[element];
        elementLabel.textContent = element;

        div.appendChild(elementLabel);
        div.appendChild(progressContainer);
        container.appendChild(div);
    });
}

/**
 * 更新当前属性值显示
 */
function updateCurrentAttributes() {
    const container = document.getElementById('currentAttributes');
    container.innerHTML = '';

    // 获取当前目标丹药的最高属性需求作为进度条基准
    let maxRequirement = 100; // 默认基准值
    if (gameState.targetRecipe && recipesData[gameState.targetRecipe]) {
        const requirements = recipesData[gameState.targetRecipe];
        maxRequirement = Math.max(...Object.values(requirements));
    }

    elements.forEach(function (element) {
        const value = gameState.currentAttributes[element] || 0;
        const div = document.createElement('div');
        div.className = 'attribute-bar';

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill progress-' + element;
        // 以目标丹药最高属性需求为100%基准
        const progressPercent = Math.min(100, Math.max(0, (value / maxRequirement) * 100));
        progressFill.style.width = progressPercent + '%';

        const progressValue = document.createElement('span');
        progressValue.className = 'progress-value';
        progressValue.textContent = value.toFixed(0);

        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(progressValue);

        const elementLabel = document.createElement('span');
        elementLabel.className = 'font-medium ' + elementColors[element];
        elementLabel.textContent = element;

        div.appendChild(elementLabel);
        div.appendChild(progressContainer);
        container.appendChild(div);
    });
}

/**
 * 更新炉中材料显示 - 显示实时属性值和颜色
 */
function updateMaterialQueueDisplay() {
    const container = document.getElementById('materialQueue');

    if (gameState.materialQueue.length === 0) {
        container.innerHTML = '<div class="empty-state">炉中无材料</div>';
        return;
    }

    container.innerHTML = '';

    gameState.materialQueue.forEach(function (material, index) {
        if (!material.name) return;

        const div = document.createElement('div');
        div.className = 'material-item';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'material-name';
        nameDiv.textContent = material.name;

        const attrsDiv = document.createElement('div');
        attrsDiv.className = 'material-attributes';

        // 显示实时的属性值（不包括name和addedAt）
        Object.entries(material).forEach(function ([attr, value]) {
            if (attr !== 'name' && attr !== 'addedAt' && typeof value === 'number' && value > 0) {
                const span = document.createElement('span');
                span.className = 'inline-block mr-2 ' + (elementColors[attr] || '');
                span.textContent = attr + ':' + value.toFixed(1);
                attrsDiv.appendChild(span);
            }
        });

        div.appendChild(nameDiv);
        div.appendChild(attrsDiv);

        container.appendChild(div);
    });
}

/**
 * 更新丹方队列显示 - 新的可编辑版本
 */
function updateRecipeQueueDisplay() {
    const container = document.getElementById('recipeQueue');

    if (!gameState.recipeQueue || gameState.recipeQueue.length === 0) {
        container.innerHTML = '<div class="empty-state">未设置丹方</div>';
        return;
    }

    container.innerHTML = '';

    gameState.recipeQueue.forEach(function (operation, index) {
        const operationDiv = createEditableOperationItem(operation, index);
        container.appendChild(operationDiv);
    });

    // 添加新操作按钮
    const addButtonDiv = document.createElement('div');
    addButtonDiv.className = 'text-center mt-3';
    addButtonDiv.innerHTML = `
        <button onclick="addNewOperation()" class="btn btn-primary btn-sm">
            ➕ 添加操作
        </button>
    `;
    container.appendChild(addButtonDiv);
}

/**
 * 创建操作字段
 */
function createOperationField(label, type, value, onchange) {
    const field = document.createElement('div');
    field.className = 'operation-field';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;

    let input;
    if (type === 'select') {
        input = document.createElement('select');
    } else {
        input = document.createElement('input');
        input.type = type;
        // 确保数值字段始终显示值，包括0
        input.value = (value !== undefined && value !== null) ? value : '';
    }

    input.addEventListener('change', function () {
        onchange(this.value);
    });

    field.appendChild(labelEl);
    field.appendChild(input);

    return field;
}

/**
 * 获取操作类型图标
 */
function getOperationTypeIcon(type) {
    switch (type) {
        case 'material':
            return '🌿';
        case 'fire':
            return '🔥';
        case 'end':
            return '⚗️';
        default:
            return '❓';
    }
}

/**
 * 获取操作类型文本
 */
function getOperationTypeText(operation) {
    const icon = getOperationTypeIcon(operation.type);
    switch (operation.type) {
        case 'material':
            return `${icon} 添加材料`;
        case 'fire':
            return `${icon} 调整火力`;
        case 'end':
            return `${icon} 结束炼丹`;
        default:
            return `${icon} 未知操作`;
    }
}

/**
 * 创建可编辑的操作项 - 优化选择框显示
 */
function createEditableOperationItem(operation, index) {
    const div = document.createElement('div');
    div.className = 'operation-item';
    div.dataset.index = index;

    // 操作头部
    const header = document.createElement('div');
    header.className = 'operation-header';

    const typeSpan = document.createElement('span');
    typeSpan.className = 'operation-type';
    typeSpan.textContent = getOperationTypeText(operation);

    const controls = document.createElement('div');
    controls.className = 'operation-controls';
    controls.innerHTML = `
        <button onclick="removeOperation(${index})" class="btn btn-danger btn-sm">🗑️</button>
    `;

    header.appendChild(typeSpan);
    header.appendChild(controls);

    // 操作字段
    const fields = document.createElement('div');
    fields.className = 'operation-fields';

    // 操作类型选择
    const typeField = createOperationField('类型', 'select', operation.type, function (value) {
        updateOperationType(index, value);
    });
    const typeSelect = typeField.querySelector('select');
    typeSelect.innerHTML = `
        <option value="material" ${operation.type === 'material' ? 'selected' : ''}>🌿 添加材料</option>
        <option value="fire" ${operation.type === 'fire' ? 'selected' : ''}>🔥 改变火力</option>
        <option value="end" ${operation.type === 'end' ? 'selected' : ''}>⚗️ 结束炼丹</option>
    `;

    // 添加选择框显示控制
    typeSelect.addEventListener('focus', function () {
        this.classList.remove('collapsed');
        // 展开时显示完整文本
        const fullText = this.getAttribute('data-full-text');
        if (fullText && this.options[this.selectedIndex]) {
            this.options[this.selectedIndex].textContent = fullText;
        }
    });

    typeSelect.addEventListener('blur', function () {
        this.classList.add('collapsed');
        updateSelectDisplay(this);
        // 收起时显示简化文本
        const displayText = this.getAttribute('data-display');
        if (displayText && this.options[this.selectedIndex]) {
            this.options[this.selectedIndex].textContent = displayText;
        }
    });

    typeSelect.addEventListener('change', function () {
        updateSelectDisplay(this);
        this.classList.add('collapsed');
        // 收起时显示简化文本
        const displayText = this.getAttribute('data-display');
        if (displayText && this.options[this.selectedIndex]) {
            this.options[this.selectedIndex].textContent = displayText;
        }
    });

    // 时间字段
    const timeField = createOperationField('时间(秒)', 'number', operation.delay, function (value) {
        updateOperationDelay(index, parseFloat(value) || 0);
    });
    timeField.querySelector('input').min = '0';
    timeField.querySelector('input').step = '0.1';

    fields.appendChild(typeField);
    fields.appendChild(timeField);

    // 根据类型添加数值字段并设置CSS类
    if (operation.type === 'material') {
        const materialField = createOperationField('材料', 'select', operation.name, function (value) {
            updateOperationMaterial(index, value);
        });
        const materialSelect = materialField.querySelector('select');
        materialSelect.innerHTML = '<option value="">选择材料</option>';
        Object.entries(materialsData).forEach(function ([materialName, attributes]) {
            const option = document.createElement('option');
            option.value = materialName;

            // 格式化属性显示
            const attrText = Object.entries(attributes)
                .map(function ([element, value]) {
                    return element + ':' + value.toFixed(1);
                })
                .join(' ');

            option.textContent = materialName + ' (' + attrText + ')';
            option.selected = operation.name === materialName;
            materialSelect.appendChild(option);
        });

        // 添加材料选择框显示控制
        materialSelect.addEventListener('focus', function () {
            this.classList.remove('collapsed');
            // 展开时显示完整文本
            const fullText = this.getAttribute('data-full-text');
            if (fullText && this.options[this.selectedIndex]) {
                this.options[this.selectedIndex].textContent = fullText;
            }
        });

        materialSelect.addEventListener('blur', function () {
            if (this.value) {
                this.classList.add('collapsed');
                // 收起时显示简化文本
                const displayText = this.getAttribute('data-display');
                if (displayText && this.options[this.selectedIndex]) {
                    this.options[this.selectedIndex].textContent = displayText;
                }
            }
            updateSelectDisplay(this);
        });

        materialSelect.addEventListener('change', function () {
            updateSelectDisplay(this);
            if (this.value) {
                this.classList.add('collapsed');
                // 收起时显示简化文本
                const displayText = this.getAttribute('data-display');
                if (displayText && this.options[this.selectedIndex]) {
                    this.options[this.selectedIndex].textContent = displayText;
                }
            }
        });

        const amountField = createOperationField('数量', 'number', operation.amount, function (value) {
            updateOperationAmount(index, parseInt(value) || 1);
        });
        const amountInput = amountField.querySelector('input');
        amountInput.min = '1';
        amountInput.value = operation.amount || 1;

        fields.appendChild(materialField);
        fields.appendChild(amountField);

        // 添加4列布局类
        fields.className = 'operation-fields four-columns';

    } else if (operation.type === 'fire') {
        const intensityField = createOperationField('火力', 'number', operation.intensity, function (value) {
            updateOperationIntensity(index, parseInt(value) || 1);
        });
        const intensityInput = intensityField.querySelector('input');
        intensityInput.min = '1';
        intensityInput.max = '10';
        intensityInput.value = operation.intensity || 3;

        fields.appendChild(intensityField);

        // 添加3列布局类
        fields.className = 'operation-fields three-columns';
    }
    // end类型保持默认2列布局

    div.appendChild(header);
    div.appendChild(fields);

    // 初始化选择框显示
    updateSelectDisplay(typeSelect);
    if (typeSelect.value) {
        typeSelect.classList.add('collapsed');
        // 设置初始显示文本
        const displayText = typeSelect.getAttribute('data-display');
        if (displayText && typeSelect.options[typeSelect.selectedIndex]) {
            typeSelect.options[typeSelect.selectedIndex].textContent = displayText;
        }
    }

    if (operation.type === 'material') {
        const materialSelect = fields.querySelector('select[onchange*="updateOperationMaterial"]');
        if (materialSelect) {
            updateSelectDisplay(materialSelect);
            if (materialSelect.value) {
                materialSelect.classList.add('collapsed');
                // 设置初始显示文本
                const displayText = materialSelect.getAttribute('data-display');
                if (displayText && materialSelect.options[materialSelect.selectedIndex]) {
                    materialSelect.options[materialSelect.selectedIndex].textContent = displayText;
                }
            }
        }
    }

    return div;
}

/**
 * 更新选择框显示（收起时只显示图标或简化文本）
 */
function updateSelectDisplay(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
        selectElement.classList.remove('collapsed');
        return;
    }

    const fullText = selectedOption.textContent;
    const isOperationType = selectElement.closest('.operation-field') &&
        selectElement.closest('.operation-field').querySelector('label').textContent === '类型';

    // 保存完整文本
    selectElement.setAttribute('data-full-text', fullText);

    if (isOperationType) {
        // 操作类型：收起时只显示图标
        const icon = fullText.split(' ')[0]; // 获取图标部分
        selectElement.setAttribute('data-display', icon);
    } else {
        // 材料选择：收起时只显示材料名
        const materialName = fullText.split(' (')[0]; // 获取材料名部分
        selectElement.setAttribute('data-display', materialName);
    }
}



/**
 * 移除操作
 */
function removeOperation(index) {
    gameState.recipeQueue.splice(index, 1);
    updateRecipeQueueDisplay();
}

/**
 * 更新操作延迟时间 - 自动排序
 */
function updateOperationDelay(index, delay) {
    gameState.recipeQueue[index].delay = delay;
    // 重新排序
    gameState.recipeQueue.sort((a, b) => a.delay - b.delay);
    updateRecipeQueueDisplay();
}

/**
 * 更新操作类型
 */
function updateOperationType(index, type) {
    const operation = gameState.recipeQueue[index];
    operation.type = type;

    // 重置类型相关的字段
    if (type === 'material') {
        operation.name = '';
        operation.amount = 1;
        delete operation.intensity;
    } else if (type === 'fire') {
        operation.intensity = 3;
        delete operation.name;
        delete operation.amount;
    } else if (type === 'end') {
        delete operation.name;
        delete operation.amount;
        delete operation.intensity;
    }

    updateRecipeQueueDisplay();
}

/**
 * 更新材料操作的材料
 */
function updateOperationMaterial(index, materialName) {
    gameState.recipeQueue[index].name = materialName;
}

/**
 * 更新材料操作的数量
 */
function updateOperationAmount(index, amount) {
    gameState.recipeQueue[index].amount = amount;
}

/**
 * 更新火力操作的强度
 */
function updateOperationIntensity(index, intensity) {
    gameState.recipeQueue[index].intensity = intensity;
}

/**
 * 主模拟循环
 */
function simulationStep() {
    if (!gameState.isRunning) return;

    // 检查是否到达结束时间
    if (gameState.currentTime >= gameState.endTime) {
        stopSimulation();
        addLog('⏰ 模拟时间结束');
        return;
    }

    // 处理丹方队列中的操作
    processRecipeQueue();

    // 处理炼化过程
    processAlchemy();

    // 检查目标达成
    checkTargetAchievement();

    // 更新时间
    gameState.currentTime += 1;

    // 更新显示
    updateDisplays();

    // 设置下一帧
    setTimeout(simulationStep, 1000 / gameState.simulationSpeed);
}





/**
 * 更新材料属性预览
 */
function updateMaterialPreview(formula) {
    const container = document.getElementById('materialPreview');

    if (!formula || !formula.materials) {
        container.innerHTML = '<div class="empty-state text-xs">选择丹方查看材料属性</div>';
        return;
    }

    container.innerHTML = '';

    // 统计所有材料的总属性
    const totalAttributes = {};

    formula.materials.forEach(function (material) {
        const materialData = materialsData[material.name];
        if (materialData) {
            // 累计总属性
            Object.entries(materialData).forEach(function ([element, value]) {
                const totalValue = value * material.amount;
                totalAttributes[element] = (totalAttributes[element] || 0) + totalValue;
            });
        }
    });

    // 只显示总属性汇总
    if (Object.keys(totalAttributes).length > 0) {
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'text-sm';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'font-medium mb-2';
        titleDiv.style.color = '#059669';
        titleDiv.textContent = '📊 总属性产出:';

        const totalDiv = document.createElement('div');
        Object.entries(totalAttributes).forEach(function ([element, value]) {
            const span = document.createElement('span');
            span.className = 'inline-block mr-3 ' + elementColors[element];
            span.style.fontSize = '14px';
            span.style.fontWeight = 'bold';
            span.textContent = element + ': ' + value.toFixed(1);
            totalDiv.appendChild(span);
        });

        summaryDiv.appendChild(titleDiv);
        summaryDiv.appendChild(totalDiv);
        container.appendChild(summaryDiv);
    }
}

// ==================== 操作按钮功能 ====================

/**
 * 添加材料操作到队列
 */
function addMaterialOperation() {
    const newOperation = {
        type: 'material',
        delay: gameState.currentTime + 1, // 默认1秒后执行
        name: '', // 默认空，需要用户在操作列表中设置
        amount: 1,
        executed: false
    };

    gameState.recipeQueue.push(newOperation);
    gameState.recipeQueue.sort((a, b) => a.delay - b.delay);

    addLog('➕ 已添加材料操作到队列，请在操作列表中设置详细参数');
    updateRecipeQueueDisplay();
}

/**
 * 添加火力操作到队列
 */
function addFireOperation() {
    const newOperation = {
        type: 'fire',
        delay: gameState.currentTime + 1, // 默认1秒后执行
        intensity: 3, // 默认火力3
        executed: false
    };

    gameState.recipeQueue.push(newOperation);
    gameState.recipeQueue.sort((a, b) => a.delay - b.delay);

    addLog('➕ 已添加火力操作到队列，请在操作列表中设置详细参数');
    updateRecipeQueueDisplay();
}

/**
 * 添加结束操作到队列
 */
function addEndOperation() {
    const newOperation = {
        type: 'end',
        delay: gameState.endTime, // 默认在结束时间执行
        executed: false
    };

    gameState.recipeQueue.push(newOperation);
    gameState.recipeQueue.sort((a, b) => a.delay - b.delay);

    addLog('➕ 已添加结束操作到队列');
    updateRecipeQueueDisplay();
}

// ==================== 品质计算系统 ====================

/**
 * 计算丹药品质
 * @param {Object} currentAttributes - 当前属性值
 * @param {Object} targetRequirements - 目标丹药需求
 * @returns {Object} 品质分析结果
 */
function calculatePillQuality(currentAttributes, targetRequirements) {
    if (!targetRequirements) {
        return null;
    }

    let baseQuality = 0;
    let impurityPenalty = 0;
    let excessPenalty = 0;
    let totalRequired = 0;
    let totalMatched = 0;
    let impurityTotal = 0;
    let excessDetails = [];

    // 计算总需求量
    totalRequired = Object.values(targetRequirements).reduce((sum, value) => sum + value, 0);

    // 计算基础品质（属性匹配度）
    Object.entries(targetRequirements).forEach(function ([element, required]) {
        const current = currentAttributes[element] || 0;
        const matched = Math.min(current, required);
        totalMatched += matched;

        // 计算过量部分（修正算法）
        if (current > required) {
            const divisor = Math.max(required, 100); // 除数最低100
            const excessRatio = ((current - required) / divisor) * 100; // 修正：(当前-需求)/max(需求,100) × 100%
            excessDetails.push({
                element: element,
                current: current,
                required: required,
                excess: current - required,
                excessRatio: excessRatio
            });
        }
    });

    // 计算杂质（无关属性）
    Object.entries(currentAttributes).forEach(function ([element, value]) {
        if (value > 0 && !targetRequirements[element]) {
            impurityTotal += value;
        }
    });

    // 基础品质 = 匹配度百分比
    baseQuality = totalRequired > 0 ? (totalMatched / totalRequired) * 100 : 0;

    // 新的杂质惩罚算法：杂质数值 ÷ 丹药所需总属性 × 系数
    const impurityRatio = totalRequired > 0 ? (impurityTotal / totalRequired) : 0;
    impurityPenalty = impurityRatio * 50; // 提升系数到50

    // 新的过量惩罚算法：按各属性过量百分比计算
    let totalExcessPenalty = 0;
    excessDetails.forEach(function (detail) {
        totalExcessPenalty += detail.excessRatio * 0.5; // 提升系数到50%
    });
    excessPenalty = totalExcessPenalty;

    // 最终品质
    const finalQuality = Math.max(0, baseQuality - impurityPenalty - excessPenalty);

    // 品质等级
    let qualityGrade, qualityColor;
    if (finalQuality < 30) {
        qualityGrade = '废丹';
        qualityColor = '#ff6b6b';
    } else if (finalQuality < 60) {
        qualityGrade = '下品';
        qualityColor = '#ffa726';
    } else if (finalQuality < 85) {
        qualityGrade = '中品';
        qualityColor = '#66bb6a';
    } else {
        qualityGrade = '上品';
        qualityColor = '#ab47bc';
    }

    return {
        baseQuality: baseQuality,
        impurityPenalty: impurityPenalty,
        excessPenalty: excessPenalty,
        finalQuality: finalQuality,
        qualityGrade: qualityGrade,
        qualityColor: qualityColor,
        totalRequired: totalRequired,
        totalMatched: totalMatched,
        impurityTotal: impurityTotal,
        impurityRatio: impurityRatio,
        excessDetails: excessDetails
    };
}

/**
 * 更新合并后的炼丹结果与品质分析显示
 */
function updateCombinedResult() {
    const container = document.getElementById('combinedResult');

    if (!gameState.targetRecipe) {
        container.innerHTML = '<div class="empty-state">设定目标后显示分析结果</div>';
        return;
    }

    const requirements = recipesData[gameState.targetRecipe];
    const quality = calculatePillQuality(gameState.currentAttributes, requirements);

    if (!quality) {
        container.innerHTML = '<div class="empty-state">无法计算结果</div>';
        return;
    }

    container.innerHTML = '';

    // 目标丹药信息
    const targetDiv = document.createElement('div');
    targetDiv.className = 'mb-3';
    targetDiv.innerHTML = `
        <div class="font-medium mb-2">🎯 目标丹药: ${gameState.targetRecipe}</div>
        <div class="text-xs">
            ${Object.entries(requirements).map(function ([element, value]) {
        const current = gameState.currentAttributes[element] || 0;
        const status = current >= value ? '✅' : '❌';
        return `${status} ${element}: ${current.toFixed(1)}/${value}`;
    }).join('<br/>')}
        </div>
    `;
    container.appendChild(targetDiv);

    // 品质等级显示
    const gradeDiv = document.createElement('div');
    gradeDiv.className = 'text-center mb-3';
    gradeDiv.innerHTML = `
        <div style="font-size: 20px; font-weight: bold; color: ${quality.qualityColor};">
            ${quality.qualityGrade}
        </div>
        <div style="font-size: 16px; font-weight: bold; color: ${quality.qualityColor};">
            ${quality.finalQuality.toFixed(1)}%
        </div>
    `;
    container.appendChild(gradeDiv);

    // 详细分析
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'text-xs';
    analysisDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
            <strong style="color: #96ceb4;">📊 品质分析:</strong><br/>
            <span style="color: #4ecdc4;">基础品质: ${quality.baseQuality.toFixed(1)}%</span><br/>
            <span style="color: #ff6b6b;">杂质惩罚: -${quality.impurityPenalty.toFixed(1)}%</span><br/>
            <span style="color: #ffa726;">过量惩罚: -${quality.excessPenalty.toFixed(1)}%</span>
        </div>
        <div style="margin-bottom: 8px;">
            <strong style="color: #96ceb4;">📈 属性统计:</strong><br/>
            <span style="color: #4ecdc4;">需求匹配: ${quality.totalMatched.toFixed(1)}/${quality.totalRequired}</span><br/>
            <span style="color: #ff6b6b;">杂质总量: ${quality.impurityTotal.toFixed(1)} (${(quality.impurityRatio * 100).toFixed(1)}%)</span><br/>
            <span style="color: #ffa726;">过量详情: ${quality.excessDetails.length > 0 ?
            quality.excessDetails.map(d => `${d.element}(超出${d.excessRatio.toFixed(1)}%)`).join(', ') :
            '无过量'}</span>
        </div>
    `;
    container.appendChild(analysisDiv);
}

// ==================== 页面加载 ====================

/**
 * 页面加载完成后自动初始化系统
 */
document.addEventListener('DOMContentLoaded', initPage);

/**
 * 重置模拟状态 - 增强版：保持丹方选择
 */
function resetSimulation() {
    gameState.isRunning = false;
    gameState.currentTime = 0;
    gameState.currentAttributes = {};
    gameState.materialQueue = [];
    gameState.targetAchieved = false;
    gameState.logs = [];

    // 重置丹方队列的执行状态（如果存在）
    if (gameState.recipeQueue) {
        gameState.recipeQueue.forEach(function (operation) {
            operation.executed = false;
        });
    }

    // 重置UI
    document.getElementById('toggleRunning').textContent = '▶️ 开始模拟';

    // 不清空目标丹药和丹方选择，保持用户的选择
    addLog('🔄 模拟已重置');
    updateDisplays();
}

/**
 * 清空日志
 */
function clearLogs() {
    gameState.logs = [];
    addLog('日志已清空');
    updateLogs();
}

/**
 * 全局函数，供HTML中的onclick使用
 */
window.resetSimulation = resetSimulation;