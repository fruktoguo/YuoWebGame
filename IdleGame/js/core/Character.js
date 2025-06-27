// 角色系统核心类
class Character {
    constructor(name = '冒险者', characterClass = 'warrior') {
        this.name = name;
        this.class = characterClass;
        this.level = 1;
        this.exp = 0;
        this.freePoints = 0;
        this.skillPoints = 0; // 技能点
        this.gold = 0;
        this.gems = 0;
        
        // 属性分配点数记录（用于存档和重新计算）
        this.allocatedAttributes = {
            strength: 0,      // 力量 - 增加攻击力和少量生命值
            agility: 0,       // 敏捷 - 增加命中、闪避和暴击，少量增加攻击力
            intelligence: 0,  // 智力 - 增加法术强度和魔法值
            spirit: 0,        // 精神 - 增加魔法抗性和技能急速
            stamina: 0        // 耐力 - 增加生命值和防御值
        };
        
        // 初始化基础属性
        this.initializeStats();
        
        // 当前状态
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP || 100;
        
        // 装备加成属性
        this.equipmentBonus = {};
        
        // 技能加成属性
        this.skillBonus = {};
        
        // 临时Buff
        this.buffs = [];
        
        // 行动条相关
        this.isActing = false;
        this.actionProgress = 0;
        this.actionTime = 1000; // 默认行动时间1秒
        this.actionType = null; // 'attack', 'cast', 'skill'
    }

    // 初始化属性
    initializeStats() {
        // 计算最终属性
        this.calculateFinalStats();
    }

    // 计算最终属性
    calculateFinalStats() {
        const classData = getClassData(this.class);
        
        // 从基础属性开始
        this.stats = { ...classData.baseStats };
        
        // 应用等级成长
        for (let [stat, growth] of Object.entries(classData.statGrowth || {})) {
            this.stats[stat] = (this.stats[stat] || 0) + growth * (this.level - 1);
        }
        
        // 应用分配的属性点
        const allocated = this.allocatedAttributes || {};
        
        // 力量：增加攻击力和少量生命值
        if (allocated.strength) {
            this.stats.physicalAttack = (this.stats.physicalAttack || 0) + allocated.strength * 2;
            this.stats.health = (this.stats.health || 0) + allocated.strength * 5;
        }
        
        // 敏捷：增加命中、闪避和暴击，少量增加攻击力
        if (allocated.agility) {
            this.stats.hitRate = (this.stats.hitRate || 0) + allocated.agility * 3;
            this.stats.dodgeRate = (this.stats.dodgeRate || 0) + allocated.agility * 2;
            this.stats.critRate = (this.stats.critRate || 0) + allocated.agility * 1.5;
            this.stats.physicalAttack = (this.stats.physicalAttack || 0) + allocated.agility * 0.5;
        }
        
        // 智力：增加法术强度和魔法值
        if (allocated.intelligence) {
            this.stats.magicalAttack = (this.stats.magicalAttack || 0) + allocated.intelligence * 2;
            this.stats.maxMP = (this.stats.maxMP || 0) + allocated.intelligence * 10;
        }
        
        // 精神：增加魔法抗性和技能急速
        if (allocated.spirit) {
            this.stats.magicResist = (this.stats.magicResist || 0) + allocated.spirit * 1.5;
            this.stats.skillCooldown = (this.stats.skillCooldown || 0) + allocated.spirit * 2;
        }
        
        // 耐力：增加生命值和防御值
        if (allocated.stamina) {
            this.stats.health = (this.stats.health || 0) + allocated.stamina * 10;
            this.stats.defense = (this.stats.defense || 0) + allocated.stamina * 1.5;
        }
        
        // 应用装备加成
        for (let [stat, bonus] of Object.entries(this.equipmentBonus || {})) {
            if (['strength', 'agility', 'intelligence', 'spirit', 'stamina'].includes(stat)) {
                // 装备上的五维属性需要转换为对应的效果
                this.applyAttributeBonus(stat, bonus);
            } else {
                // 直接属性加成
            this.stats[stat] = (this.stats[stat] || 0) + bonus;
            }
        }
        
        // 应用技能加成
        for (let [stat, bonus] of Object.entries(this.skillBonus || {})) {
            this.stats[stat] = (this.stats[stat] || 0) + bonus;
        }
        
        // 应用临时Buff
        for (let buff of this.buffs || []) {
            if (buff.stats) {
                for (let [stat, bonus] of Object.entries(buff.stats)) {
                    this.stats[stat] = (this.stats[stat] || 0) + bonus;
                }
            }
        }
        
        // 设置快捷访问属性
        this.physicalAttack = this.stats.physicalAttack || 0;
        this.magicalAttack = this.stats.magicalAttack || 0;
        this.maxHP = this.stats.health || 100;
        this.maxMP = this.stats.maxMP || 100;
        this.defense = this.stats.defense || 0;
        this.magicResist = this.stats.magicResist || 0;
        this.critRate = this.stats.critRate || 0;
        this.critDamage = this.stats.critDamage || 50;
        this.hitRate = this.stats.hitRate || 100; // 初始命中100点，即50%
        this.dodgeRate = this.stats.dodgeRate || 0;
        this.blockRate = this.stats.blockRate || 0;
        this.skillCooldown = this.stats.skillCooldown || 0;
        this.moveSpeed = this.stats.moveSpeed || 100;
        this.healthRegen = this.stats.healthRegen || 1;
        this.manaRegen = this.stats.manaRegen || 2;
        this.attackSpeed = this.stats.attackSpeed || 1.0;
        
        // 确保当前血量不超过最大血量
        if (this.currentHP > this.maxHP) {
            this.currentHP = this.maxHP;
        }
    }

    // 应用五维属性加成（来自装备）
    applyAttributeBonus(attributeName, bonus) {
        switch (attributeName) {
            case 'strength':
                this.stats.physicalAttack = (this.stats.physicalAttack || 0) + bonus * 2;
                this.stats.health = (this.stats.health || 0) + bonus * 5;
                break;
            case 'agility':
                this.stats.hitRate = (this.stats.hitRate || 0) + bonus * 3;
                this.stats.dodgeRate = (this.stats.dodgeRate || 0) + bonus * 2;
                this.stats.critRate = (this.stats.critRate || 0) + bonus * 1.5;
                this.stats.physicalAttack = (this.stats.physicalAttack || 0) + bonus * 0.5;
                break;
            case 'intelligence':
                this.stats.magicalAttack = (this.stats.magicalAttack || 0) + bonus * 2;
                this.stats.maxMP = (this.stats.maxMP || 0) + bonus * 10;
                break;
            case 'spirit':
                this.stats.magicResist = (this.stats.magicResist || 0) + bonus * 1.5;
                this.stats.skillCooldown = (this.stats.skillCooldown || 0) + bonus * 2;
                break;
            case 'stamina':
                this.stats.health = (this.stats.health || 0) + bonus * 10;
                this.stats.defense = (this.stats.defense || 0) + bonus * 1.5;
                break;
        }
    }

    // 获得经验值
    gainExp(amount) {
        this.exp += amount;
        
        // 检查升级
        while (this.canLevelUp()) {
            this.levelUp();
        }
    }

    // 检查是否可以升级
    canLevelUp() {
        const requiredExp = Calculator.calculateExpRequired(this.level);
        return this.exp >= requiredExp;
    }

    // 升级
    levelUp() {
        const requiredExp = Calculator.calculateExpRequired(this.level);
        this.exp -= requiredExp;
        this.level++;
        this.freePoints += 5; // 每级获得5个自由属性点
        
        // 每升级给1点技能点
        if (!this.skillPoints) this.skillPoints = 0;
        this.skillPoints += 1;
        
        // 重新计算属性
        this.calculateFinalStats();
        
        // 恢复满血
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP || 100;
        
        console.log(`角色升级到 ${this.level} 级！`);
    }

    // 分配属性点
    allocatePoint(statName) {
        if (this.freePoints <= 0) {
            return false;
        }
        
        if (this.allocatedAttributes.hasOwnProperty(statName)) {
            this.allocatedAttributes[statName]++;
            this.freePoints--;
            this.calculateFinalStats();
            
            // 更新UI
            if (window.game && window.game.ui.character) {
                window.game.ui.character.update();
            }
            
            return true;
        }
        
        return false;
    }

    // 受到伤害
    takeDamage(damage) {
        this.currentHP = Math.max(0, this.currentHP - damage);
        return this.currentHP <= 0; // 返回是否死亡
    }

    // 治疗
    heal(amount) {
        this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    }

    // 恢复法力值
    restoreMP(amount) {
        this.currentMP = Math.min(this.maxMP || 100, this.currentMP + amount);
    }

    // 消耗法力值
    consumeMP(amount) {
        if (this.currentMP >= amount) {
            this.currentMP -= amount;
            return true;
        }
        return false;
    }

    // 是否存活
    isAlive() {
        return this.currentHP > 0;
    }

    // 添加Buff
    addBuff(buff) {
        this.buffs = this.buffs || [];
        this.buffs.push({
            ...buff,
            startTime: Date.now(),
            endTime: Date.now() + (buff.duration * 1000)
        });
        this.calculateFinalStats();
    }

    // 移除过期Buff
    updateBuffs() {
        const now = Date.now();
        this.buffs = this.buffs || [];
        const oldLength = this.buffs.length;
        
        this.buffs = this.buffs.filter(buff => now < buff.endTime);
        
        // 如果有Buff被移除，重新计算属性
        if (this.buffs.length !== oldLength) {
            this.calculateFinalStats();
        }
    }

    // 清除所有Buff
    clearBuffs() {
        this.buffs = [];
        this.calculateFinalStats();
    }

    // 更新装备加成
    updateEquipmentBonus(equipmentBonus) {
        this.equipmentBonus = { ...equipmentBonus } || {};
        this.calculateFinalStats();
    }

    // 更新技能加成
    updateSkillBonus(skillBonus) {
        this.skillBonus = { ...skillBonus } || {};
        this.calculateFinalStats();
    }

    // 获取属性百分比显示
    getStatPercentage(statName) {
        const value = this.stats[statName] || 0;
        return Calculator.calculatePercentage(value);
    }

    // 获取防御减伤百分比
    getDefenseReduction() {
        return this.getStatPercentage('defense');
    }

    // 获取魔抗减伤百分比
    getMagicResistReduction() {
        return this.getStatPercentage('magicResist');
    }

    // 获取暴击率百分比
    getCritRatePercentage() {
        return this.getStatPercentage('critRate');
    }

    // 获取命中率百分比
    getHitRatePercentage() {
        return this.getStatPercentage('hitRate');
    }

    // 获取闪避率百分比
    getDodgeRatePercentage() {
        return this.getStatPercentage('dodgeRate');
    }

    // 获取格挡率百分比
    getBlockRatePercentage() {
        return this.getStatPercentage('blockRate');
    }

    // 获取技能急速百分比
    getSkillHastePercentage() {
        return this.getStatPercentage('skillCooldown');
    }

    // 获取属性详细信息（用于显示 x(a+b) 格式）
    getStatDetail(statName) {
        const finalValue = Math.floor(this.stats[statName] || 0);
        
        // 计算基础值（职业基础 + 等级成长 + 分配的属性点）
        const baseValue = this.calculateBaseStatValue(statName);
        
        // 加成值 = 最终值 - 基础值（装备、技能、Buff等加成）
        const bonusValue = finalValue - baseValue;
        
        return {
            final: finalValue,
            base: baseValue,
            bonus: bonusValue,
            display: `${finalValue}(${baseValue}+${bonusValue})`
        };
    }

    // 计算某个属性的基础值（不包括装备、技能、Buff加成）
    calculateBaseStatValue(statName) {
        const classData = getClassData(this.class);
        
        // 职业基础属性
        let baseValue = classData.baseStats[statName] || 0;
        
        // 等级成长
        const growth = classData.statGrowth?.[statName] || 0;
        baseValue += growth * (this.level - 1);
        
        // 分配的属性点影响
        const allocated = this.allocatedAttributes || {};
        switch (statName) {
            case 'physicalAttack':
                baseValue += (allocated.strength || 0) * 2;
                baseValue += (allocated.agility || 0) * 0.5;
                break;
            case 'magicalAttack':
                baseValue += (allocated.intelligence || 0) * 2;
                break;
            case 'health':
                baseValue += (allocated.strength || 0) * 5;
                baseValue += (allocated.stamina || 0) * 10;
                break;
            case 'defense':
                baseValue += (allocated.stamina || 0) * 1.5;
                break;
            case 'magicResist':
                baseValue += (allocated.spirit || 0) * 1.5;
                break;
            case 'critRate':
                baseValue += (allocated.agility || 0) * 1.5;
                break;
            case 'hitRate':
                baseValue += (allocated.agility || 0) * 3;
                break;
            case 'dodgeRate':
                baseValue += (allocated.agility || 0) * 2;
                break;
            case 'blockRate':
                // blockRate目前没有属性点影响，保持基础值
                break;
            case 'skillCooldown':
                baseValue += (allocated.spirit || 0) * 2;
                break;
            case 'maxMP':
                baseValue += (allocated.intelligence || 0) * 10;
                break;
            // 其他属性保持基础值
            default:
                break;
        }
        
        return Math.floor(baseValue);
    }

    // 获取角色概要信息
    getSummary() {
        return {
            name: this.name,
            class: this.class,
            level: this.level,
            exp: this.exp,
            hp: `${this.currentHP}/${this.maxHP}`,
            mp: `${this.currentMP}/${this.maxMP || 100}`,
            stats: this.stats
        };
    }

    // 重置角色到初始状态（保留等级和经验）
    reset() {
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP || 100;
        this.buffs = [];
        this.calculateFinalStats();
    }

    // 完全重置角色（包括等级和经验）
    fullReset() {
        this.level = 1;
        this.exp = 0;
        this.freePoints = 0;
        this.skillPoints = 0; // 重置技能点
        this.gold = 0;
        this.gems = 0;
        this.allocatedAttributes = {
            strength: 0,
            agility: 0,
            intelligence: 0,
            spirit: 0,
            stamina: 0
        };
        this.equipmentBonus = {};
        this.skillBonus = {};
        this.buffs = [];
        
        // 重新初始化基础属性
        this.initializeStats();
        
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP || 100;
    }

    // 获取角色数据（用于保存）
    getCharacterData() {
        return {
            name: this.name,
            class: this.class,
            level: this.level,
            exp: this.exp,
            freePoints: this.freePoints,
            skillPoints: this.skillPoints, // 添加技能点保存
            gold: this.gold,
            gems: this.gems,
            allocatedAttributes: this.allocatedAttributes,
            currentHP: this.currentHP,
            currentMP: this.currentMP,
            equipmentBonus: this.equipmentBonus,
            skillBonus: this.skillBonus,
            buffs: this.buffs
        };
    }

    // 加载角色数据（用于读档）
    loadCharacterData(data) {
        if (!data) return;
        
        this.name = data.name || '冒险者';
        this.class = data.class || 'warrior';
        this.level = data.level || 1;
        this.exp = data.exp || 0;
        this.freePoints = data.freePoints || 0;
        this.skillPoints = data.skillPoints || Math.max(0, this.level - 1); // 加载技能点，如果没有则根据等级计算
        this.gold = data.gold || 0;
        this.gems = data.gems || 0;
        
        // 加载分配的属性点，如果没有则初始化为空
        this.allocatedAttributes = data.allocatedAttributes || data.allocatedPoints || {
            strength: 0,
            agility: 0,
            intelligence: 0,
            spirit: 0,
            stamina: 0
        };
        
        // 兼容旧存档：如果有baseStats但没有allocatedPoints，则转换为新的属性系统
        if (data.baseStats && !data.allocatedPoints) {
            // 旧存档转换为新的五属性系统，简单分配到对应属性
            this.allocatedPoints = {
                strength: Math.max(0, Math.floor((data.baseStats.physicalAttack || 0) / 2)),
                agility: 0,
                intelligence: Math.max(0, Math.floor((data.baseStats.magicalAttack || 0) / 2)),
                spirit: Math.max(0, Math.floor((data.baseStats.magicResist || 0) / 1.5)),
                stamina: Math.max(0, Math.floor((data.baseStats.health || 0) / 10))
            };
        }
        
        this.currentHP = data.currentHP || 100;
        this.currentMP = data.currentMP || 100;
        this.equipmentBonus = data.equipmentBonus || {};
        this.skillBonus = data.skillBonus || {};
        this.buffs = data.buffs || [];
        
        // 重新计算属性
        this.calculateFinalStats();
    }

    // 更新角色状态（游戏循环调用）
    update(deltaTime) {
        // 更新Buff状态
        this.updateBuffs();
        
        // 更新行动条
        var completedAction = this.updateActionBar(deltaTime);
        
        // 生命值回复（每秒回复）
        if (this.currentHP < this.maxHP && this.stats.healthRegen > 0) {
            var regenAmount = (this.stats.healthRegen || 1) * (deltaTime / 1000);
            this.heal(regenAmount);
        }
        
        // 魔法值回复（每秒回复）
        if (this.currentMP < this.maxMP && this.stats.manaRegen > 0) {
            var regenAmount = (this.stats.manaRegen || 2) * (deltaTime / 1000);
            this.restoreMP(regenAmount);
        }
        
        return completedAction;
    }

    // 开始行动
    startAction(actionType, actionTime) {
        this.isActing = true;
        this.actionType = actionType;
        this.actionTime = actionTime || this.getActionTime(actionType);
        this.actionProgress = 0;
    }

    // 取消行动
    cancelAction() {
        this.isActing = false;
        this.actionType = null;
        this.actionProgress = 0;
    }

    // 完成行动
    completeAction() {
        var actionType = this.actionType;
        this.isActing = false;
        this.actionType = null;
        this.actionProgress = 0;
        return actionType;
    }

    // 更新行动条
    updateActionBar(deltaTime) {
        if (this.isActing && this.actionTime > 0) {
            this.actionProgress += deltaTime;
            
            // 行动完成
            if (this.actionProgress >= this.actionTime) {
                return this.completeAction();
            }
        }
        return null;
    }

    // 获取行动时间
    getActionTime(actionType) {
        var baseTime = 1000; // 基础1秒
        
        switch (actionType) {
            case 'attack':
                // 攻击时间受攻击速度影响
                return baseTime / (this.attackSpeed || 1.0);
            case 'cast':
            case 'skill':
                // 施法时间固定
                return baseTime * 1.5;
            default:
                return baseTime;
        }
    }

    // 检查是否可以行动
    canAct() {
        return this.isAlive() && !this.isActing;
    }
}
