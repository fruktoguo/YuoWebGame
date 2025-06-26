// 角色系统核心类
class Character {
    constructor(name = '冒险者', characterClass = 'warrior') {
        this.name = name;
        this.class = characterClass;
        this.level = 1;
        this.exp = 0;
        this.freePoints = 0;
        
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
    }

    // 初始化属性
    initializeStats() {
        const classData = getClassData(this.class);
        
        // 基础属性
        this.baseStats = { ...classData.baseStats };
        
        // 计算最终属性
        this.calculateFinalStats();
    }

    // 计算最终属性
    calculateFinalStats() {
        const classData = getClassData(this.class);
        this.stats = { ...this.baseStats };
        
        // 应用等级成长
        for (let [stat, growth] of Object.entries(classData.statGrowth)) {
            this.stats[stat] += growth * (this.level - 1);
        }
        
        // 应用装备加成
        for (let [stat, bonus] of Object.entries(this.equipmentBonus)) {
            this.stats[stat] = (this.stats[stat] || 0) + bonus;
        }
        
        // 应用技能加成
        for (let [stat, bonus] of Object.entries(this.skillBonus)) {
            this.stats[stat] = (this.stats[stat] || 0) + bonus;
        }
        
        // 应用临时Buff
        for (let buff of this.buffs) {
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
        this.defense = this.stats.defense || 0;
        this.magicResist = this.stats.magicResist || 0;
        this.critRate = this.stats.critRate || 0;
        this.critDamage = this.stats.critDamage || 50;
        this.hitRate = this.stats.hitRate || 0;
        this.dodgeRate = this.stats.dodgeRate || 0;
        this.skillCooldown = this.stats.skillCooldown || 0;
        
        // 确保当前血量不超过最大血量
        if (this.currentHP > this.maxHP) {
            this.currentHP = this.maxHP;
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
        
        // 重新计算属性
        this.calculateFinalStats();
        
        // 恢复满血
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP || 100;
        
        // 触发升级事件
        if (window.game) {
            window.game.onCharacterLevelUp();
        }
        
        console.log(`角色升级到 ${this.level} 级！`);
    }

    // 分配属性点
    allocatePoint(statName) {
        if (this.freePoints <= 0) {
            return false;
        }
        
        if (this.baseStats.hasOwnProperty(statName)) {
            this.baseStats[statName]++;
            this.freePoints--;
            this.calculateFinalStats();
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
        this.equipmentBonus = { ...equipmentBonus };
        this.calculateFinalStats();
    }

    // 更新技能加成
    updateSkillBonus(skillBonus) {
        this.skillBonus = { ...skillBonus };
        this.calculateFinalStats();
    }

    // 获取属性百分比显示
    getStatPercentage(statName, baseValue) {
        const value = this.stats[statName] || 0;
        return Calculator.calculatePercentage(value, baseValue);
    }

    // 获取防御减伤百分比
    getDefenseReduction() {
        return this.getStatPercentage('defense', Calculator.getDefenseBase(this.level));
    }

    // 获取魔抗减伤百分比
    getMagicResistReduction() {
        return this.getStatPercentage('magicResist', Calculator.getDefenseBase(this.level));
    }

    // 获取暴击率百分比
    getCritRatePercentage() {
        return this.getStatPercentage('critRate', Calculator.getCritBase(this.level));
    }

    // 获取命中率百分比
    getHitRatePercentage() {
        return this.getStatPercentage('hitRate', Calculator.getHitBase(this.level));
    }

    // 获取闪避率百分比
    getDodgeRatePercentage() {
        return this.getStatPercentage('dodgeRate', Calculator.getDodgeBase(this.level));
    }

    // 获取角色信息摘要
    getSummary() {
        return {
            name: this.name,
            class: this.class,
            level: this.level,
            exp: this.exp,
            hp: `${Math.floor(this.currentHP)}/${Math.floor(this.maxHP)}`,
            stats: this.stats,
            freePoints: this.freePoints
        };
    }

    // 重置角色 (保留等级和经验)
    reset() {
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP || 100;
        this.buffs = [];
        this.calculateFinalStats();
    }

    // 完全重置角色
    fullReset() {
        this.level = 1;
        this.exp = 0;
        this.freePoints = 0;
        this.initializeStats();
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP || 100;
        this.buffs = [];
        this.equipmentBonus = {};
        this.skillBonus = {};
    }

    // 获取完整角色数据 (用于存档)
    getCharacterData() {
        return {
            name: this.name,
            class: this.class,
            level: this.level,
            exp: this.exp,
            freePoints: this.freePoints,
            baseStats: this.baseStats,
            currentHP: this.currentHP,
            currentMP: this.currentMP,
            equipmentBonus: this.equipmentBonus,
            skillBonus: this.skillBonus,
            buffs: this.buffs
        };
    }

    // 加载角色数据 (从存档)
    loadCharacterData(data) {
        this.name = data.name || '冒险者';
        this.class = data.class || 'warrior';
        this.level = data.level || 1;
        this.exp = data.exp || 0;
        this.freePoints = data.freePoints || 0;
        this.baseStats = data.baseStats || {};
        this.currentHP = data.currentHP || 100;
        this.currentMP = data.currentMP || 100;
        this.equipmentBonus = data.equipmentBonus || {};
        this.skillBonus = data.skillBonus || {};
        this.buffs = data.buffs || [];
        
        // 重新计算属性
        this.calculateFinalStats();
    }
} 