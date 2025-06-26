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
    }

    // 分配属性点
    allocatePoint(attrName) {
        if (this.game.character.allocatePoint(attrName)) {
            this.update();
            Utils.showNotification(`增加了 ${this.getAttrDisplayName(attrName)}`, 'success');
        } else {
            Utils.showNotification('没有可用的属性点', 'warning');
        }
    }

    // 获取属性显示名称
    getAttrDisplayName(attrName) {
        const names = {
            physicalAttack: '物理攻击',
            magicalAttack: '魔法攻击',
            health: '生命值',
            defense: '防御值',
            magicResist: '魔法抗性',
            critRate: '暴击率',
            critDamage: '暴击伤害',
            hitRate: '命中率',
            dodgeRate: '闪避率'
        };
        return names[attrName] || attrName;
    }

    // 更新UI
    update() {
        this.updateStats();
        this.updateFreePoints();
    }

    // 更新属性显示
    updateStats() {
        const character = this.game.character;
        const stats = character.stats;

        // 更新各个属性值
        const statElements = {
            'stat-physical-attack': stats.physicalAttack,
            'stat-magical-attack': stats.magicalAttack,
            'stat-health': stats.health,
            'stat-defense': stats.defense,
            'stat-magic-resist': stats.magicResist,
            'stat-crit-rate': stats.critRate
        };

        for (let [elementId, value] of Object.entries(statElements)) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = Math.floor(value || 0);
                
                // 添加工具提示
                this.addStatTooltip(element, elementId.replace('stat-', ''), value);
            }
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
                tooltipText += `\n减伤: ${defensePercent.toFixed(1)}%`;
                break;
            case 'magic-resist':
                const magicResistPercent = character.getMagicResistReduction() * 100;
                tooltipText += `\n魔法减伤: ${magicResistPercent.toFixed(1)}%`;
                break;
            case 'crit-rate':
                const critPercent = character.getCritRatePercentage() * 100;
                tooltipText += `\n暴击率: ${critPercent.toFixed(1)}%`;
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