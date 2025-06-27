// 角色UI管理类
class CharacterUI {
    constructor(game) {
        this.game = game;
        this.initializeEvents();
    }

    // 初始化事件监听
    initializeEvents() {
        // 属性点分配按钮
        const pointButtons = document.querySelectorAll('.point-btn');
        pointButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const attr = e.target.getAttribute('data-attr');
                this.allocatePoint(attr);
            });
        });

        // 属性标签页切换
        const statTabButtons = document.querySelectorAll('.stat-tab-btn');
        statTabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-stat-tab');
                this.switchStatTab(tabName);
            });
        });
    }

    // 切换属性标签页
    switchStatTab(tabName) {
        // 移除所有按钮的active状态
        document.querySelectorAll('.stat-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 隐藏所有标签页内容
        document.querySelectorAll('.stat-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 激活当前按钮和对应的标签页
        document.querySelector(`[data-stat-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    // 分配属性点
    allocatePoint(attrName) {
        const pointModeSelect = document.getElementById('point-mode');
        const pointMode = pointModeSelect ? pointModeSelect.value : '1';
        let pointsToAllocate = 1;
        
        // 确定要分配的点数
        if (pointMode === 'all') {
            pointsToAllocate = this.game.character.freePoints;
        } else {
            pointsToAllocate = Math.min(parseInt(pointMode), this.game.character.freePoints);
        }

        if (pointsToAllocate <= 0) {
            Utils.showNotification(T('msg.noFreePoints'), 'warning');
            return;
        }

        let successCount = 0;
        for (let i = 0; i < pointsToAllocate; i++) {
            if (this.game.character.allocatePoint(attrName)) {
                successCount++;
            } else {
                break;
            }
        }

        if (successCount > 0) {
            this.update();
            const message = successCount === 1 ? 
                T('msg.allocatedPoint', this.getAttrDisplayName(attrName)) : 
                `分配了 ${successCount} 点${this.getAttrDisplayName(attrName)}`;
            Utils.showNotification(message, 'success');
        } else {
            Utils.showNotification(T('msg.noFreePoints'), 'warning');
        }
    }

    // 获取属性显示名称
    getAttrDisplayName(attrName) {
        return T(`attr.${attrName}`) || attrName;
    }

    // 更新UI
    update() {
        this.updateStats();
        this.updateFreePoints();
        this.updateAllocatedPoints();
        this.updateTexts();
    }

    // 更新属性显示
    updateStats() {
        const character = this.game.character;
        const stats = character.stats;

        // 攻击属性 - 直接显示数值
        this.updateElement('stat-physical-attack', Math.floor(stats.physicalAttack || 0));
        this.updateElement('stat-magical-attack', Math.floor(stats.magicalAttack || 0));
        this.updateElement('stat-crit-rate', Math.floor(stats.critRate || 0));
        this.updateElement('stat-crit-damage', `${Math.floor(stats.critDamage || 150)}%`);
        this.updateElement('stat-hit-rate', Math.floor(stats.hitRate || 0));
        this.updateElement('stat-attack-speed', (stats.attackSpeed || 1.0).toFixed(1));

        // 防御属性 - 直接显示数值
        this.updateElement('stat-defense', Math.floor(stats.defense || 0));
        this.updateElement('stat-magic-resist', Math.floor(stats.magicResist || 0));
        this.updateElement('stat-dodge-rate', Math.floor(stats.dodgeRate || 0));
        this.updateElement('stat-block-rate', Math.floor(stats.blockRate || 0));

        // 基础信息（等级和经验）
        this.updateElement('stat-level', character.level || 1);
        const expRequired = Calculator.calculateExpRequired(character.level);
        this.updateElement('stat-exp', `${character.exp || 0}/${expRequired}`);
        
        // 当前生命值和魔法值
        this.updateElement('stat-current-health', `${Math.floor(character.currentHP || 0)}/${Math.floor(character.maxHP || 0)}`);
        this.updateElement('stat-current-mana', `${Math.floor(character.currentMP || 0)}/${Math.floor(character.maxMP || 0)}`);
        
        // 其他属性 - 直接显示数值
        this.updateElement('stat-move-speed', Math.floor(stats.moveSpeed || 100));
        this.updateElement('stat-skill-cooldown', Math.floor(stats.skillCooldown || 0));
        this.updateElement('stat-health-regen', `${Math.floor(stats.healthRegen || 1)}/${T('time.second')}`);
        this.updateElement('stat-mana-regen', `${Math.floor(stats.manaRegen || 2)}/${T('time.second')}`);
    }

    // 更新单个元素
    updateElement(elementId, value) {
            const element = document.getElementById(elementId);
            if (element) {
            element.textContent = value;
            
            // 为需要显示百分比的属性添加悬浮提示
            this.addPercentageTooltip(element, elementId);
        }
    }

    // 为属性元素添加百分比悬浮提示
    addPercentageTooltip(element, elementId) {
        const character = this.game.character;
        if (!character) return;

        let tooltipText = '';
        
        switch (elementId) {
            case 'stat-crit-rate':
                const critPercent = (character.getCritRatePercentage() * 100).toFixed(1);
                tooltipText = T('tooltip.critRate', critPercent);
                break;
            case 'stat-hit-rate':
                const hitPercent = (character.getHitRatePercentage() * 100).toFixed(1);
                tooltipText = T('tooltip.hitRate', hitPercent);
                break;
            case 'stat-dodge-rate':
                const dodgePercent = (character.getDodgeRatePercentage() * 100).toFixed(1);
                tooltipText = T('tooltip.dodgeRate', dodgePercent);
                break;
            case 'stat-block-rate':
                const blockPercent = (character.getBlockRatePercentage() * 100).toFixed(1);
                tooltipText = T('tooltip.blockRate', blockPercent);
                break;
            case 'stat-defense':
                const defensePercent = (character.getDefenseReduction() * 100).toFixed(1);
                tooltipText = T('tooltip.defenseReduction', defensePercent);
                break;
            case 'stat-magic-resist':
                const magicResistPercent = (character.getMagicResistReduction() * 100).toFixed(1);
                tooltipText = T('tooltip.magicResistReduction', magicResistPercent);
                break;
            case 'stat-skill-cooldown':
                const cooldownPercent = (character.getSkillHastePercentage() * 100).toFixed(1);
                tooltipText = T('tooltip.skillHasteReduction', cooldownPercent);
                break;
            default:
                return; // 不需要提示的属性直接返回
        }
        
        if (tooltipText) {
            element.title = tooltipText;
            element.style.cursor = 'help';
        }
    }

    // 添加属性工具提示
    addStatTooltip(element, statName, value) {
        const character = this.game.character;
        let tooltipText = `${this.getAttrDisplayName(statName)}: ${Math.floor(value || 0)}`;

        // 为百分比属性添加百分比显示
        switch (statName) {
            case 'defense':
                const defensePercent = character.getDefenseReduction() * 100;
                tooltipText += `\n${T('tooltip.defenseReduction', defensePercent.toFixed(1))}`;
                break;
            case 'magic-resist':
                const magicResistPercent = character.getMagicResistReduction() * 100;
                tooltipText += `\n${T('tooltip.magicResistReduction', magicResistPercent.toFixed(1))}`;
                break;
            case 'crit-rate':
                const critPercent = character.getCritRatePercentage() * 100;
                tooltipText += `\n${T('tooltip.critRate', critPercent.toFixed(1))}`;
                break;
        }

        element.setAttribute('title', tooltipText);
    }

    // 更新自由属性点
    updateFreePoints() {
        const freePointsElement = document.getElementById('free-points');
        if (freePointsElement) {
            freePointsElement.textContent = this.game.character.freePoints;
        }

        // 更新按钮状态
        const pointButtons = document.querySelectorAll('.point-btn');
        pointButtons.forEach(button => {
            button.disabled = this.game.character.freePoints <= 0;
        });
    }

    // 更新已分配的属性点数显示
    updateAllocatedPoints() {
        const character = this.game.character;
        if (!character.allocatedAttributes) return;

        Object.entries(character.allocatedAttributes).forEach(([attr, points]) => {
            const element = document.getElementById(`allocated-${attr}`);
            if (element) {
                // 显示格式：总点数(分配点数+装备加成)
                const equipmentBonus = character.equipmentBonus[attr] || 0;
                const totalPoints = points + equipmentBonus;
                
                if (equipmentBonus > 0) {
                    element.textContent = `${totalPoints}(${points}+${equipmentBonus})`;
                } else {
                    element.textContent = points;
                }
            }
        });
    }

    // 更新所有文本（用于语言切换）
    updateTexts() {
        // 更新所有带有data-text属性的元素
        document.querySelectorAll('[data-text]').forEach(element => {
            const textKey = element.getAttribute('data-text');
            if (textKey) {
                element.textContent = T(textKey);
            }
        });
    }

    // 显示角色详细信息
    showCharacterDetails() {
        const character = this.game.character;
        const details = `
            角色名称: ${character.name}
            职业: ${getClassData(character.class).name}
            等级: ${character.level}
            经验值: ${character.exp}
            自由属性点: ${character.freePoints}
            
            === 属性 ===
            物理攻击: ${character.physicalAttack}
            魔法攻击: ${character.magicalAttack}
            生命值: ${character.maxHP}
            防御值: ${character.defense} (减伤: ${(character.getDefenseReduction() * 100).toFixed(1)}%)
            魔法抗性: ${character.magicResist} (减伤: ${(character.getMagicResistReduction() * 100).toFixed(1)}%)
            暴击率: ${character.critRate} (${(character.getCritRatePercentage() * 100).toFixed(1)}%)
            暴击伤害: ${character.critDamage}%
        `;
        
        console.log(details);
        return details;
    }
} 