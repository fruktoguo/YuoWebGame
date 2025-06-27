// 技能系统核心类
class Skills {
    constructor(game) {
        this.game = game;
        this.learnedSkills = {}; // 已学习的技能 {skillId: level}
        this.activeSkills = []; // 当前激活的技能配置
        this.cooldowns = {}; // 技能冷却时间
        this.skillPoints = 0; // 技能点数
        
        // 初始化技能
        this.initializeSkills();
    }

    // 初始化技能
    initializeSkills() {
        // 新的技能树系统不需要初始技能，由角色创建时分配技能点
    }

    // 学习技能
    learnSkill(skillId, level = 1) {
        const skillData = this.getSkillData(skillId);
        if (!skillData) {
            console.warn(`技能不存在: ${skillId}`);
            return false;
        }

        // 检查前置条件
        if (!this.canLearnSkill(skillData, this.game.character)) {
            return false;
        }

        // 消耗技能点
        const cost = skillData.cost;
        if (this.skillPoints < cost) {
            Utils.showNotification('技能点不足', 'error');
            return false;
        }

        this.skillPoints -= cost;
        this.learnedSkills[skillId] = level;

        // 如果是被动技能，立即应用效果
        if (skillData.type === 'passive') {
            this.applyPassiveSkill(skillId, level);
        }

        Utils.showNotification(`学会了 ${skillData.name}`, 'success');
        return true;
    }

    // 升级技能（新技能树系统中暂不支持升级）
    upgradeSkill(skillId) {
        Utils.showNotification('当前技能树系统不支持技能升级', 'info');
        return false;
    }

    // 检查是否可以学习技能
    canLearnSkill(skill, character) {
        if (!character) return false;
        
        // 检查技能点
        if (character.skillPoints < skill.cost) return false;
        
        // 检查前置技能
        if (skill.prerequisites && skill.prerequisites.length > 0) {
            const learnedSkills = character.learnedSkills || {};
            return skill.prerequisites.every(prereqId => learnedSkills[prereqId] > 0);
        }
        
        return true;
    }

    // 获取技能数据
    getSkillData(skillId) {
        for (const className in SkillTreeData) {
            const classData = SkillTreeData[className];
            for (const branchName in classData.branches) {
                const branchData = classData.branches[branchName];
                for (const tierKey in branchData.skills) {
                    const skill = branchData.skills[tierKey].find(s => s.id === skillId);
                    if (skill) return skill;
                }
            }
        }
        return null;
    }

    // 应用被动技能
    applyPassiveSkill(skillId, level) {
        const skillData = this.getSkillData(skillId);
        if (!skillData || skillData.type !== 'passive') return;

        // 应用技能效果到角色
        this.applySkillEffects(skillData, this.game.character);
    }

    // 应用技能效果
    applySkillEffects(skill, character) {
        if (!skill.effects) return;
        
        // 根据技能效果修改角色属性
        Object.entries(skill.effects).forEach(([effectType, value]) => {
            switch (effectType) {
                case 'physicalDamage':
                    character.physicalAttack = Math.floor(character.physicalAttack * value);
                    break;
                case 'magicDamage':
                    character.magicalAttack = Math.floor(character.magicalAttack * value);
                    break;
                case 'health':
                    character.maxHP = Math.floor(character.maxHP * value);
                    character.currentHP = Math.min(character.currentHP, character.maxHP);
                    break;
                case 'mana':
                    character.maxMP = Math.floor(character.maxMP * value);
                    character.currentMP = Math.min(character.currentMP, character.maxMP);
                    break;
                case 'attackSpeed':
                    character.attackSpeed = Math.floor(character.attackSpeed * value);
                    break;
                // 更多效果类型可以在这里添加
            }
        });
    }

    // 使用主动技能
    useSkill(skillId, target = null) {
        const skillData = this.getSkillData(skillId);
        if (!skillData || skillData.type !== 'active') {
            return false;
        }

        // 检查是否学习了该技能
        const skillLevel = this.learnedSkills[skillId] || 0;
        if (skillLevel === 0) {
            return false;
        }

        // 检查冷却时间
        if (this.isOnCooldown(skillId)) {
            return false;
        }

        // 检查法力值消耗
        const manaCost = this.getSkillManaCost(skillId, skillLevel);
        if (!this.game.character.consumeMP(manaCost)) {
            return false;
        }

        // 执行技能效果
        this.executeSkillEffect(skillId, skillLevel, target);

        // 设置冷却时间
        const cooldown = skillData.effects?.cooldown || 0;
        this.setCooldown(skillId, cooldown);

        return true;
    }

    // 执行技能效果
    executeSkillEffect(skillId, level, target) {
        const skillData = this.getSkillData(skillId);
        if (!skillData || !skillData.effects) return;

        // 根据技能效果执行相应操作
        Object.entries(skillData.effects).forEach(([effectType, value]) => {
            switch (effectType) {
                case 'damageMultiplier':
                    if (target) {
                        const baseDamage = this.game.character.physicalAttack;
                        const damage = Math.floor(baseDamage * value);
                        target.takeDamage(damage);
                        this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，造成 ${damage} 点伤害`);
                    }
                    break;

                case 'heal':
                    const healAmount = Math.floor(this.game.character.maxHP * value);
                    this.game.character.heal(healAmount);
                    this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，恢复 ${healAmount} 点生命值`);
                    break;

                case 'instantHeal':
                    const instantHealAmount = Math.floor(this.game.character.maxHP * value);
                    this.game.character.heal(instantHealAmount);
                    this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，瞬间恢复 ${instantHealAmount} 点生命值`);
                    break;

                case 'attackSpeed':
                    // 临时增益效果
                    const duration = skillData.effects.duration || 30;
                    this.game.character.addTempBuff('attackSpeed', value, duration);
                    this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，攻击速度提升`);
                    break;

                case 'damageBonus':
                    // 临时增益效果
                    const buffDuration = skillData.effects.duration || 60;
                    this.game.character.addTempBuff('damage', value, buffDuration);
                    this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，攻击力提升`);
                    break;
            }
        });
    }

    // 计算技能伤害
    calculateSkillDamage(skillId, level, effect) {
        const skillData = this.getSkillData(skillId);
        if (!skillData) return 0;

        let baseDamage = 0;
        
        // 根据技能类型确定基础伤害
        if (skillData.effects?.damageType === 'magic') {
            baseDamage = this.game.character.magicalAttack;
        } else {
            baseDamage = this.game.character.physicalAttack;
        }

        // 应用技能倍率
        const multiplier = skillData.effects?.damageMultiplier || 1.0;
        return Math.floor(baseDamage * multiplier);
    }

    // 获取技能法力消耗
    getSkillManaCost(skillId, level) {
        const skillData = this.getSkillData(skillId);
        return skillData?.effects?.manaCost || 0;
    }

    // 获取技能冷却时间
    getSkillCooldown(skillId, level) {
        const skillData = this.getSkillData(skillId);
        return skillData?.effects?.cooldown || 0;
    }

    // 设置技能冷却
    setCooldown(skillId, duration) {
        this.cooldowns[skillId] = Date.now() + duration * 1000;
    }

    // 检查技能是否在冷却中
    isOnCooldown(skillId) {
        const cooldownEnd = this.cooldowns[skillId];
        return cooldownEnd && Date.now() < cooldownEnd;
    }

    // 获取剩余冷却时间
    getRemainingCooldown(skillId) {
        const cooldownEnd = this.cooldowns[skillId];
        if (!cooldownEnd || Date.now() >= cooldownEnd) {
            return 0;
        }
        return Math.ceil((cooldownEnd - Date.now()) / 1000);
    }

    // 更新冷却时间
    updateCooldowns(deltaTime) {
        // 冷却时间基于实际时间，不需要更新
    }

    // 设置自动技能
    setAutoSkill(skillId, enabled) {
        if (!this.game.character.autoCastSkills) {
            this.game.character.autoCastSkills = [];
        }

        const index = this.game.character.autoCastSkills.indexOf(skillId);
        
        if (enabled && index === -1) {
            this.game.character.autoCastSkills.push(skillId);
        } else if (!enabled && index !== -1) {
            this.game.character.autoCastSkills.splice(index, 1);
        }
    }

    // 自动使用技能
    autoUseSkills(target) {
        const autoCastSkills = this.getAutoCastSkills();
        
        for (const skill of autoCastSkills) {
            if (skill.type === 'active' && !this.isOnCooldown(skill.id)) {
                this.useSkill(skill.id, target);
                break; // 一次只使用一个技能
            }
        }
    }

    // 获取技能树数据
    getSkillTreeData() {
        return SkillTreeData;
    }

    // 获取已学习的技能
    getLearnedSkills() {
        return this.learnedSkills;
    }

    // 获取自动施法技能列表
    getAutoCastSkills() {
        if (!this.autoCastSkills) this.autoCastSkills = [];
        return this.autoCastSkills.map(skillId => this.getSkillData(skillId)).filter(Boolean);
    }

    // 设置技能自动施法
    setAutocast(skillId, enabled) {
        if (!this.autoCastSkills) this.autoCastSkills = [];
        
        const index = this.autoCastSkills.indexOf(skillId);
        if (enabled && index === -1) {
            this.autoCastSkills.push(skillId);
        } else if (!enabled && index !== -1) {
            this.autoCastSkills.splice(index, 1);
        }
    }

    // 检查技能是否设置为自动施法
    isAutocast(skillId) {
        if (!this.autoCastSkills) this.autoCastSkills = [];
        return this.autoCastSkills.includes(skillId);
    }

    // 重置所有技能
    resetAllSkills() {
        this.learnedSkills = {};
        this.autoCastSkills = [];
        this.cooldowns = {};
        
        // 重新计算角色属性
        if (this.game?.character) {
            this.game.character.calculateFinalStats();
        }
    }

    // 添加技能点
    addSkillPoints(amount) {
        this.skillPoints += amount;
        if (this.game.character) {
            this.game.character.skillPoints = this.skillPoints;
        }
    }

    // 重置技能
    resetSkills() {
        // 计算已使用的技能点
        let usedPoints = 0;
        for (const skillId in this.learnedSkills) {
            const skill = this.getSkillData(skillId);
            if (skill) {
                usedPoints += skill.cost;
            }
        }

        // 重置技能数据
        this.learnedSkills = {};
        this.activeSkills = [];
        this.cooldowns = {};
        
        // 返还技能点
        this.skillPoints += usedPoints;
        if (this.game.character) {
            this.game.character.skillPoints = this.skillPoints;
            this.game.character.learnedSkills = {};
            this.game.character.autoCastSkills = [];
        }

        // 重新计算角色属性
        if (this.game.character?.calculateStats) {
            this.game.character.calculateStats();
        }

        Utils.showNotification('技能已重置', 'info');
    }

    // 获取技能数据（用于存档）
    getSkillsData() {
        return {
            learnedSkills: this.learnedSkills,
            skillPoints: this.skillPoints,
            autoCastSkills: this.game.character?.autoCastSkills || [],
            skillUI: this.game.skillUI ? this.game.skillUI.saveSkillData() : null
        };
    }

    // 加载技能数据（用于读档）
    loadSkillsData(data) {
        this.learnedSkills = data.learnedSkills || {};
        this.skillPoints = data.skillPoints || 0;
        
        if (this.game.character) {
            this.game.character.learnedSkills = this.learnedSkills;
            this.game.character.skillPoints = this.skillPoints;
            this.game.character.autoCastSkills = data.autoCastSkills || [];
        }

        // 重新应用所有被动技能效果
        for (const skillId in this.learnedSkills) {
            this.applyPassiveSkill(skillId, this.learnedSkills[skillId]);
        }
    }
} 