// 游戏数值计算工具类
class Calculator {
    // 百分比属性计算公式 (防御、暴击率等)
    // 基准值固定为100，即100时为50%
    static calculatePercentage(value, baseValue = 100) {
        return value / (value + baseValue);
    }

    // 获取防御基准值
    static getDefenseBase(level = 1) {
        return 100;
    }

    // 获取暴击基准值
    static getCritBase(level = 1) {
        return 100;
    }

    // 获取命中基准值
    static getHitBase(level = 1) {
        return 100;
    }

    // 获取闪避基准值
    static getDodgeBase(level = 1) {
        return 100;
    }

    // 伤害计算
    static calculateDamage(attacker, defender, skill = null) {
        // 基础伤害
        let baseDamage = skill && skill.isPhysical === false ? 
            attacker.magicalAttack : attacker.physicalAttack;
        
        // 技能伤害倍数
        if (skill && skill.damageMultiplier) {
            baseDamage *= skill.damageMultiplier;
        }

        // 防御减伤
        let defense = skill && skill.isPhysical === false ? 
            defender.magicResist : defender.defense;
        let defenseReduction = this.calculatePercentage(defense, this.getDefenseBase(defender.level || 1));
        
        let damage = baseDamage * (1 - defenseReduction);

        // 暴击计算
        let critRate = this.calculatePercentage(attacker.critRate || 0, this.getCritBase(attacker.level || 1));
        if (Math.random() < critRate) {
            damage *= (1 + (attacker.critDamage || 50) / 100);
            return { damage: Math.max(1, Math.floor(damage)), isCrit: true };
        }

        return { damage: Math.max(1, Math.floor(damage)), isCrit: false };
    }

    // 命中计算
    static calculateHitChance(attacker, defender) {
        let hitRate = this.calculatePercentage(attacker.hitRate || 0, this.getHitBase(attacker.level || 1));
        let dodgeRate = this.calculatePercentage(defender.dodgeRate || 0, this.getDodgeBase(defender.level || 1));
        return Math.max(0.05, hitRate - dodgeRate); // 最少5%命中率
    }

    // 经验值计算
    static calculateExpGain(playerLevel, monsterLevel, baseExp = 10) {
        let levelDiff = monsterLevel - playerLevel;
        let multiplier = 1;
        
        if (levelDiff > 0) {
            multiplier = 1 + levelDiff * 0.1; // 高等级怪物额外经验
        } else if (levelDiff < -5) {
            multiplier = Math.max(0.1, 1 + levelDiff * 0.05); // 低等级怪物经验惩罚
        }
        
        return Math.floor(baseExp * multiplier);
    }

    // 升级所需经验计算
    static calculateExpRequired(level) {
        return Math.floor(100 * Math.pow(1.15, level - 1));
    }

    // 金币掉落计算
    static calculateGoldDrop(monsterLevel, baseGold = 5) {
        let multiplier = 1 + (monsterLevel - 1) * 0.2;
        let randomFactor = Utils.random(0.8, 1.2);
        return Math.floor(baseGold * multiplier * randomFactor);
    }

    // 装备掉落率计算
    static calculateDropChance(playerLevel, monsterLevel, baseChance = 0.1) {
        let levelBonus = Math.max(0, monsterLevel - playerLevel) * 0.01;
        return Math.min(0.5, baseChance + levelBonus);
    }

    // 装备品质计算
    static calculateEquipmentQuality(playerLevel, monsterLevel) {
        let qualityRoll = Math.random();
        let levelBonus = Math.max(0, monsterLevel - playerLevel) * 0.01;
        
        // 品质概率 (受等级差影响)
        let commonChance = Math.max(0.1, 0.6 - levelBonus);
        let magicChance = Math.max(0.1, 0.25 - levelBonus * 0.5);
        let rareChance = Math.max(0.05, 0.1 - levelBonus * 0.3);
        let epicChance = Math.max(0.02, 0.04 + levelBonus * 0.5);
        let legendaryChance = Math.max(0.005, 0.01 + levelBonus);

        if (qualityRoll < legendaryChance) return 'legendary';
        if (qualityRoll < legendaryChance + epicChance) return 'epic';
        if (qualityRoll < legendaryChance + epicChance + rareChance) return 'rare';
        if (qualityRoll < legendaryChance + epicChance + rareChance + magicChance) return 'magic';
        return 'common';
    }

    // 装备属性值计算
    static calculateEquipmentStats(level, quality, slot) {
        const baseValues = {
            weapon: { physicalAttack: 10, magicalAttack: 8 },
            helmet: { defense: 5, health: 20 },
            chest: { defense: 8, health: 30 },
            pants: { defense: 6, health: 25 },
            boots: { defense: 4, health: 15, dodgeRate: 2 },
            gloves: { defense: 3, critRate: 3 },
            necklace: { health: 40, magicalAttack: 5 },
            ring: { critRate: 5, critDamage: 8 },
            earring: { magicalAttack: 6, magicResist: 4 }
        };

        const qualityMultipliers = {
            common: 1.0,
            magic: 1.3,
            rare: 1.6,
            epic: 2.0,
            legendary: 2.5
        };

        const levelMultiplier = 1 + (level - 1) * 0.15;
        const qualityMultiplier = qualityMultipliers[quality] || 1.0;
        const randomFactor = Utils.random(0.9, 1.1);

        const baseStats = baseValues[slot] || {};
        const finalStats = {};

        for (let [stat, value] of Object.entries(baseStats)) {
            finalStats[stat] = Math.floor(value * levelMultiplier * qualityMultiplier * randomFactor);
        }

        return finalStats;
    }

    // 怪物属性缩放
    static scaleMonsterStats(baseStats, level) {
        const scaleFactor = 1 + (level - 1) * 0.2;
        const scaled = {};
        
        for (let [stat, value] of Object.entries(baseStats)) {
            scaled[stat] = Math.floor(value * scaleFactor);
        }
        
        return scaled;
    }

    // 技能冷却时间计算
    static calculateSkillCooldown(baseCooldown, cooldownReduction = 0) {
        let reductionPercent = this.calculatePercentage(cooldownReduction);
        return Math.max(0.5, baseCooldown * (1 - reductionPercent));
    }

    // 攻击速度计算
    static calculateAttackSpeed(baseSpeed, speedBonus = 0) {
        return baseSpeed + speedBonus * 0.01;
    }

    // 生命偷取计算
    static calculateLifeSteal(damage, lifeStealPercent) {
        return Math.floor(damage * lifeStealPercent / 100);
    }

    // 装备总价值评估
    static calculateEquipmentValue(equipment) {
        const statWeights = {
            physicalAttack: 2.0,
            magicalAttack: 2.0,
            health: 0.5,
            defense: 1.5,
            magicResist: 1.5,
            critRate: 3.0,
            critDamage: 2.0,
            hitRate: 1.0,
            dodgeRate: 1.5,
            skillCooldown: 2.5
        };

        let totalValue = 0;
        for (let [stat, value] of Object.entries(equipment.stats || {})) {
            const weight = statWeights[stat] || 1.0;
            totalValue += value * weight;
        }

        return totalValue;
    }

    // DPS计算
    static calculateDPS(character) {
        const attackSpeed = this.calculateAttackSpeed(1.0, character.attackSpeedBonus || 0);
        const avgDamage = (character.physicalAttack + character.magicalAttack) / 2;
        const critRate = this.calculatePercentage(character.critRate || 0, this.getCritBase(character.level || 1));
        const critMultiplier = 1 + (character.critDamage || 50) / 100;
        const avgCritDamage = avgDamage * (1 + critRate * (critMultiplier - 1));
        
        return avgCritDamage * attackSpeed;
    }

    // 离线收益计算
    static calculateOfflineRewards(character, offlineTime) {
        const maxOfflineHours = 12; // 最大离线收益时间
        const effectiveTime = Math.min(offlineTime / 3600, maxOfflineHours);
        
        const dps = this.calculateDPS(character);
        const monstersKilled = Math.floor(dps * effectiveTime * 10); // 假设每个怪物需要0.1秒
        
        return {
            exp: monstersKilled * 5,
            gold: monstersKilled * 3,
            time: effectiveTime
        };
    }
} 