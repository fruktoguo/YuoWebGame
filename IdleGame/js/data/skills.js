// 技能数据配置
const SkillData = {
    // 战士技能
    slash: {
        id: 'slash',
        name: '重击',
        description: '造成150%物理伤害',
        icon: '⚔️',
        class: 'warrior',
        type: 'active',
        isPhysical: true,
        damageMultiplier: 1.5,
        cooldown: 3,
        manaCost: 0,
        requiredLevel: 1,
        maxLevel: 10,
        effects: {
            1: { damageMultiplier: 1.5 },
            5: { damageMultiplier: 1.8 },
            10: { damageMultiplier: 2.2 }
        }
    },

    shield_bash: {
        id: 'shield_bash',
        name: '盾击',
        description: '造成物理伤害并有概率眩晕敌人',
        icon: '🛡️',
        class: 'warrior',
        type: 'active',
        isPhysical: true,
        damageMultiplier: 1.2,
        cooldown: 5,
        manaCost: 0,
        requiredLevel: 5,
        maxLevel: 10,
        effects: {
            1: { damageMultiplier: 1.2, stunChance: 0.2 },
            5: { damageMultiplier: 1.4, stunChance: 0.3 },
            10: { damageMultiplier: 1.6, stunChance: 0.4 }
        }
    },

    berserker_rage: {
        id: 'berserker_rage',
        name: '狂暴',
        description: '增加攻击力和攻击速度，持续10秒',
        icon: '😡',
        class: 'warrior',
        type: 'buff',
        isPhysical: true,
        cooldown: 30,
        duration: 10,
        manaCost: 0,
        requiredLevel: 10,
        maxLevel: 10,
        effects: {
            1: { attackBonus: 0.5, speedBonus: 0.3 },
            5: { attackBonus: 0.8, speedBonus: 0.5 },
            10: { attackBonus: 1.2, speedBonus: 0.8 }
        }
    },

    armor_mastery: {
        id: 'armor_mastery',
        name: '护甲精通',
        description: '被动增加防御力',
        icon: '🛡️',
        class: 'warrior',
        type: 'passive',
        requiredLevel: 15,
        maxLevel: 10,
        effects: {
            1: { defenseBonus: 10 },
            5: { defenseBonus: 25 },
            10: { defenseBonus: 50 }
        }
    },

    // 法师技能
    fireball: {
        id: 'fireball',
        name: '火球术',
        description: '发射火球造成魔法伤害',
        icon: '🔥',
        class: 'mage',
        type: 'active',
        isPhysical: false,
        damageMultiplier: 1.8,
        cooldown: 2,
        manaCost: 15,
        requiredLevel: 1,
        maxLevel: 10,
        effects: {
            1: { damageMultiplier: 1.8 },
            5: { damageMultiplier: 2.2 },
            10: { damageMultiplier: 2.8 }
        }
    },

    ice_shard: {
        id: 'ice_shard',
        name: '冰锥术',
        description: '发射冰锥造成魔法伤害并减速敌人',
        icon: '❄️',
        class: 'mage',
        type: 'active',
        isPhysical: false,
        damageMultiplier: 1.6,
        cooldown: 3,
        manaCost: 12,
        requiredLevel: 3,
        maxLevel: 10,
        effects: {
            1: { damageMultiplier: 1.6, slowChance: 0.5 },
            5: { damageMultiplier: 2.0, slowChance: 0.7 },
            10: { damageMultiplier: 2.5, slowChance: 0.9 }
        }
    },

    lightning_bolt: {
        id: 'lightning_bolt',
        name: '闪电箭',
        description: '召唤闪电造成高额魔法伤害',
        icon: '⚡',
        class: 'mage',
        type: 'active',
        isPhysical: false,
        damageMultiplier: 2.2,
        cooldown: 4,
        manaCost: 20,
        requiredLevel: 8,
        maxLevel: 10,
        effects: {
            1: { damageMultiplier: 2.2 },
            5: { damageMultiplier: 2.8 },
            10: { damageMultiplier: 3.5 }
        }
    },

    mana_shield: {
        id: 'mana_shield',
        name: '法力护盾',
        description: '消耗法力值来吸收伤害',
        icon: '🔮',
        class: 'mage',
        type: 'buff',
        cooldown: 25,
        duration: 15,
        manaCost: 30,
        requiredLevel: 12,
        maxLevel: 10,
        effects: {
            1: { absorption: 0.5 },
            5: { absorption: 0.7 },
            10: { absorption: 0.9 }
        }
    },

    spell_mastery: {
        id: 'spell_mastery',
        name: '法术精通',
        description: '被动增加魔法攻击力和减少技能冷却',
        icon: '📚',
        class: 'mage',
        type: 'passive',
        requiredLevel: 15,
        maxLevel: 10,
        effects: {
            1: { magicalAttackBonus: 15, cooldownReduction: 5 },
            5: { magicalAttackBonus: 35, cooldownReduction: 12 },
            10: { magicalAttackBonus: 60, cooldownReduction: 20 }
        }
    },

    // 游侠技能
    aimed_shot: {
        id: 'aimed_shot',
        name: '瞄准射击',
        description: '精确射击，必定命中并增加暴击率',
        icon: '🎯',
        class: 'ranger',
        type: 'active',
        isPhysical: true,
        damageMultiplier: 1.4,
        cooldown: 4,
        manaCost: 10,
        requiredLevel: 1,
        maxLevel: 10,
        effects: {
            1: { damageMultiplier: 1.4, critBonus: 0.3 },
            5: { damageMultiplier: 1.7, critBonus: 0.5 },
            10: { damageMultiplier: 2.1, critBonus: 0.8 }
        }
    },

    multi_shot: {
        id: 'multi_shot',
        name: '多重射击',
        description: '同时射出多支箭矢',
        icon: '🏹',
        class: 'ranger',
        type: 'active',
        isPhysical: true,
        damageMultiplier: 0.8,
        cooldown: 6,
        manaCost: 15,
        requiredLevel: 6,
        maxLevel: 10,
        effects: {
            1: { damageMultiplier: 0.8, arrows: 3 },
            5: { damageMultiplier: 0.9, arrows: 4 },
            10: { damageMultiplier: 1.0, arrows: 5 }
        }
    },

    stealth: {
        id: 'stealth',
        name: '潜行',
        description: '进入隐身状态，增加闪避率和下次攻击伤害',
        icon: '👤',
        class: 'ranger',
        type: 'buff',
        cooldown: 20,
        duration: 8,
        manaCost: 12,
        requiredLevel: 10,
        maxLevel: 10,
        effects: {
            1: { dodgeBonus: 0.5, nextAttackBonus: 1.5 },
            5: { dodgeBonus: 0.8, nextAttackBonus: 2.0 },
            10: { dodgeBonus: 1.2, nextAttackBonus: 2.8 }
        }
    },

    archery_mastery: {
        id: 'archery_mastery',
        name: '射术精通',
        description: '被动增加命中率和暴击率',
        icon: '🏹',
        class: 'ranger',
        type: 'passive',
        requiredLevel: 15,
        maxLevel: 10,
        effects: {
            1: { hitRateBonus: 15, critRateBonus: 8 },
            5: { hitRateBonus: 35, critRateBonus: 18 },
            10: { hitRateBonus: 60, critRateBonus: 30 }
        }
    },

    // 刺客技能
    backstab: {
        id: 'backstab',
        name: '背刺',
        description: '从背后攻击，造成巨额伤害',
        icon: '🗡️',
        class: 'assassin',
        type: 'active',
        isPhysical: true,
        damageMultiplier: 2.5,
        cooldown: 8,
        manaCost: 12,
        requiredLevel: 1,
        maxLevel: 10,
        effects: {
            1: { damageMultiplier: 2.5 },
            5: { damageMultiplier: 3.2 },
            10: { damageMultiplier: 4.0 }
        }
    },

    poison_blade: {
        id: 'poison_blade',
        name: '毒刃',
        description: '武器附毒，攻击造成持续伤害',
        icon: '☠️',
        class: 'assassin',
        type: 'buff',
        cooldown: 15,
        duration: 20,
        manaCost: 15,
        requiredLevel: 5,
        maxLevel: 10,
        effects: {
            1: { poisonDamage: 5, poisonDuration: 5 },
            5: { poisonDamage: 12, poisonDuration: 8 },
            10: { poisonDamage: 25, poisonDuration: 12 }
        }
    },

    shadow_step: {
        id: 'shadow_step',
        name: '暗影步',
        description: '瞬间移动到敌人身后，下次攻击必定暴击',
        icon: '👻',
        class: 'assassin',
        type: 'active',
        cooldown: 12,
        manaCost: 18,
        requiredLevel: 8,
        maxLevel: 10,
        effects: {
            1: { guaranteedCrit: true, critDamageBonus: 0.5 },
            5: { guaranteedCrit: true, critDamageBonus: 0.8 },
            10: { guaranteedCrit: true, critDamageBonus: 1.2 }
        }
    },

    evasion: {
        id: 'evasion',
        name: '闪避精通',
        description: '被动增加闪避率',
        icon: '💨',
        class: 'assassin',
        type: 'passive',
        requiredLevel: 12,
        maxLevel: 10,
        effects: {
            1: { dodgeRateBonus: 20 },
            5: { dodgeRateBonus: 45 },
            10: { dodgeRateBonus: 80 }
        }
    },

    assassination_mastery: {
        id: 'assassination_mastery',
        name: '暗杀精通',
        description: '被动增加暴击伤害',
        icon: '🎭',
        class: 'assassin',
        type: 'passive',
        requiredLevel: 15,
        maxLevel: 10,
        effects: {
            1: { critDamageBonus: 25 },
            5: { critDamageBonus: 60 },
            10: { critDamageBonus: 120 }
        }
    }
};

// 获取技能数据
function getSkillData(skillId) {
    return SkillData[skillId];
}

// 获取职业技能列表
function getClassSkills(className) {
    return Object.values(SkillData).filter(skill => skill.class === className);
}

// 获取技能在特定等级的效果
function getSkillEffect(skillId, level) {
    const skill = getSkillData(skillId);
    if (!skill || !skill.effects) return {};
    
    // 找到最接近的等级效果
    const availableLevels = Object.keys(skill.effects).map(Number).sort((a, b) => a - b);
    let effectLevel = availableLevels[0];
    
    for (let lvl of availableLevels) {
        if (level >= lvl) {
            effectLevel = lvl;
        } else {
            break;
        }
    }
    
    return skill.effects[effectLevel] || {};
}

// 计算技能伤害
function calculateSkillDamage(skillId, skillLevel, caster) {
    const skill = getSkillData(skillId);
    const effect = getSkillEffect(skillId, skillLevel);
    
    if (!skill || skill.type !== 'active') return 0;
    
    const baseDamage = skill.isPhysical === false ? caster.magicalAttack : caster.physicalAttack;
    const multiplier = effect.damageMultiplier || skill.damageMultiplier || 1.0;
    
    return baseDamage * multiplier;
}

// 检查技能是否可用
function canUseSkill(skillId, skillLevel, caster) {
    const skill = getSkillData(skillId);
    if (!skill) return false;
    
    // 检查等级要求
    if (caster.level < skill.requiredLevel) return false;
    
    // 检查法力值
    if (skill.manaCost && caster.currentMP < skill.manaCost) return false;
    
    return true;
} 