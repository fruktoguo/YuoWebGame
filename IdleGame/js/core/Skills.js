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
        const classData = getClassData(this.game.character.class);
        
        // 学习初始技能
        if (classData.initialSkills) {
            classData.initialSkills.forEach(skillId => {
                this.learnSkill(skillId, 1);
            });
        }
    }

    // 学习技能
    learnSkill(skillId, level = 1) {
        const skillData = getSkillData(skillId);
        if (!skillData) {
            console.warn(`技能不存在: ${skillId}`);
            return false;
        }

        // 检查前置条件
        if (!this.canLearnSkill(skillId, level)) {
            return false;
        }

        // 消耗技能点
        const cost = this.getSkillCost(skillId, level);
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

        Utils.showNotification(`学会了 ${skillData.name} Lv.${level}`, 'success');
        return true;
    }

    // 升级技能
    upgradeSkill(skillId) {
        const currentLevel = this.learnedSkills[skillId] || 0;
        if (currentLevel === 0) {
            return this.learnSkill(skillId, 1);
        }

        const skillData = getSkillData(skillId);
        if (!skillData || currentLevel >= skillData.maxLevel) {
            Utils.showNotification('技能已达最高等级', 'error');
            return false;
        }

        return this.learnSkill(skillId, currentLevel + 1);
    }

    // 检查是否可以学习技能
    canLearnSkill(skillId, level) {
        const skillData = getSkillData(skillId);
        if (!skillData) return false;

        // 检查等级要求
        if (this.game.character.level < skillData.levelRequirement) {
            Utils.showNotification(`需要 ${skillData.levelRequirement} 级`, 'error');
            return false;
        }

        // 检查前置技能
        if (skillData.prerequisites) {
            for (let prereq of skillData.prerequisites) {
                const prereqLevel = this.learnedSkills[prereq.skillId] || 0;
                if (prereqLevel < prereq.level) {
                    Utils.showNotification(`需要先学习 ${getSkillData(prereq.skillId).name}`, 'error');
                    return false;
                }
            }
        }

        return true;
    }

    // 获取技能消耗
    getSkillCost(skillId, level) {
        const skillData = getSkillData(skillId);
        if (!skillData) return 0;

        return skillData.baseCost + (level - 1) * skillData.levelCost;
    }

    // 应用被动技能
    applyPassiveSkill(skillId, level) {
        const skillData = getSkillData(skillId);
        if (!skillData || skillData.type !== 'passive') return;

        // 计算技能加成
        const skillBonus = {};
        if (skillData.effects) {
            for (let effect of skillData.effects) {
                const value = effect.baseValue + (level - 1) * effect.levelScale;
                skillBonus[effect.stat] = (skillBonus[effect.stat] || 0) + value;
            }
        }

        // 更新角色技能加成
        this.updateCharacterSkillBonus();
    }

    // 更新角色技能加成
    updateCharacterSkillBonus() {
        const totalSkillBonus = {};

        // 遍历所有已学习的被动技能
        for (let [skillId, level] of Object.entries(this.learnedSkills)) {
            const skillData = getSkillData(skillId);
            if (skillData && skillData.type === 'passive' && skillData.effects) {
                for (let effect of skillData.effects) {
                    const value = effect.baseValue + (level - 1) * effect.levelScale;
                    totalSkillBonus[effect.stat] = (totalSkillBonus[effect.stat] || 0) + value;
                }
            }
        }

        this.game.character.updateSkillBonus(totalSkillBonus);
    }

    // 使用主动技能
    useSkill(skillId, target = null) {
        const skillData = getSkillData(skillId);
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
        this.setCooldown(skillId, this.getSkillCooldown(skillId, skillLevel));

        return true;
    }

    // 执行技能效果
    executeSkillEffect(skillId, level, target) {
        const skillData = getSkillData(skillId);
        if (!skillData || !skillData.effects) return;

        for (let effect of skillData.effects) {
            const value = effect.baseValue + (level - 1) * effect.levelScale;

            switch (effect.type) {
                case 'damage':
                    if (target) {
                        const damage = this.calculateSkillDamage(skillId, level, effect);
                        target.takeDamage(damage);
                        this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，造成 ${damage} 点伤害`);
                    }
                    break;

                case 'heal':
                    this.game.character.heal(value);
                    this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，恢复 ${value} 点生命值`);
                    break;

                case 'buff':
                    this.game.character.addBuff({
                        name: skillData.name,
                        duration: effect.duration,
                        stats: { [effect.stat]: value }
                    });
                    this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，获得增益效果`);
                    break;

                case 'debuff':
                    if (target && target.addBuff) {
                        target.addBuff({
                            name: skillData.name,
                            duration: effect.duration,
                            stats: { [effect.stat]: -value }
                        });
                        this.game.ui.combat.addLogEntry(`使用 ${skillData.name}，敌人获得减益效果`);
                    }
                    break;
            }
        }
    }

    // 计算技能伤害
    calculateSkillDamage(skillId, level, effect) {
        const skillData = getSkillData(skillId);
        const character = this.game.character;
        
        let baseDamage = effect.baseValue + (level - 1) * effect.levelScale;
        
        // 根据技能类型应用攻击力加成
        if (effect.damageType === 'physical') {
            baseDamage += character.physicalAttack * (effect.attackRatio || 1);
        } else if (effect.damageType === 'magical') {
            baseDamage += character.magicalAttack * (effect.attackRatio || 1);
        }

        return Math.floor(baseDamage);
    }

    // 获取技能法力消耗
    getSkillManaCost(skillId, level) {
        const skillData = getSkillData(skillId);
        if (!skillData) return 0;

        return skillData.baseMana + (level - 1) * skillData.manaCostPerLevel;
    }

    // 获取技能冷却时间
    getSkillCooldown(skillId, level) {
        const skillData = getSkillData(skillId);
        if (!skillData) return 0;

        let cooldown = skillData.baseCooldown - (level - 1) * skillData.cooldownReduction;
        
        // 应用角色的技能冷却减少
        const cdReduction = this.game.character.getStatPercentage('skillCooldown', 100);
        cooldown *= (1 - cdReduction);

        return Math.max(0.5, cooldown); // 最小0.5秒冷却
    }

    // 设置冷却时间
    setCooldown(skillId, duration) {
        this.cooldowns[skillId] = Date.now() + (duration * 1000);
    }

    // 检查是否在冷却中
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
        return (cooldownEnd - Date.now()) / 1000;
    }

    // 更新冷却时间
    updateCooldowns(deltaTime) {
        // 冷却时间由时间戳管理，不需要手动更新
    }

    // 设置自动释放技能
    setAutoSkill(skillId, enabled) {
        if (enabled) {
            if (!this.activeSkills.includes(skillId)) {
                this.activeSkills.push(skillId);
            }
        } else {
            const index = this.activeSkills.indexOf(skillId);
            if (index !== -1) {
                this.activeSkills.splice(index, 1);
            }
        }
    }

    // 自动释放技能
    autoUseSkills(target) {
        for (let skillId of this.activeSkills) {
            if (this.useSkill(skillId, target)) {
                break; // 每次只释放一个技能
            }
        }
    }

    // 获取技能树数据
    getSkillTreeData() {
        const classData = getClassData(this.game.character.class);
        return classData.skillTree || [];
    }

    // 获取已学习技能列表
    getLearnedSkills() {
        return Object.keys(this.learnedSkills).map(skillId => ({
            id: skillId,
            level: this.learnedSkills[skillId],
            data: getSkillData(skillId)
        }));
    }

    // 添加技能点
    addSkillPoints(amount) {
        this.skillPoints += amount;
        Utils.showNotification(`获得 ${amount} 技能点`, 'info');
    }

    // 重置技能
    resetSkills() {
        // 返还技能点
        let totalRefund = 0;
        for (let [skillId, level] of Object.entries(this.learnedSkills)) {
            for (let i = 1; i <= level; i++) {
                totalRefund += this.getSkillCost(skillId, i);
            }
        }

        this.skillPoints += totalRefund;
        this.learnedSkills = {};
        this.activeSkills = [];
        this.cooldowns = {};

        // 重新初始化
        this.initializeSkills();
        this.updateCharacterSkillBonus();

        Utils.showNotification(`技能重置完成，返还 ${totalRefund} 技能点`, 'success');
    }

    // 获取技能数据
    getSkillsData() {
        return {
            learnedSkills: this.learnedSkills,
            activeSkills: this.activeSkills,
            skillPoints: this.skillPoints
        };
    }

    // 加载技能数据
    loadSkillsData(data) {
        if (data.learnedSkills) this.learnedSkills = data.learnedSkills;
        if (data.activeSkills) this.activeSkills = data.activeSkills;
        if (data.skillPoints !== undefined) this.skillPoints = data.skillPoints;
        
        this.updateCharacterSkillBonus();
    }
} 