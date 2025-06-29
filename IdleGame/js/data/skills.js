// 技能树数据 - 五属性分支系统
const SkillTreeData = {
    // 力量分支技能
    strength: {
        name: "力量",
        color: "#e74c3c",
        skills: [
            {
                id: "strength_1",
                name: "基础力量",
                description: "增加15%物理伤害",
                icon: "💪",
                type: "passive",
                cost: 1,
                prerequisites: [],
                effects: { physicalDamage: 1.15 }
            },
            {
                id: "strength_2", 
                name: "重击",
                description: "造成200%物理伤害的主动技能",
                icon: "⚔️",
                type: "active",
                cost: 2,
                prerequisites: ["strength_1"],
                effects: { 
                    damageMultiplier: 2.0,
                    cooldown: 5,
                    manaCost: 15
                }
            },
            {
                id: "strength_3",
                name: "狂战士",
                description: "终极力量形态，大幅提升物理能力",
                icon: "👹",
                type: "aura",
                cost: 3,
                prerequisites: ["strength_2"],
                effects: {
                    physicalDamage: 1.5,
                    attackSpeed: 1.3,
                    critChance: 0.2,
                    duration: 30,
                    cooldown: 60,
                    manaCost: 50
                }
            }
        ]
    },

    // 敏捷分支技能
    dexterity: {
        name: "敏捷",
        color: "#27ae60",
        skills: [
            {
                id: "dexterity_1",
                name: "基础敏捷",
                description: "增加20%攻击速度和10%闪避",
                icon: "🏃",
                type: "passive",
                cost: 1,
                prerequisites: [],
                effects: { 
                    attackSpeed: 1.2,
                    dodgeChance: 0.1
                }
            },
            {
                id: "dexterity_2",
                name: "疾风步",
                description: "瞬间移动并造成伤害",
                icon: "💨",
                type: "active",
                cost: 2,
                prerequisites: ["dexterity_1"],
                effects: {
                    damageMultiplier: 1.5,
                    dodgeBonus: 0.5,
                    cooldown: 8,
                    manaCost: 20
                }
            },
            {
                id: "dexterity_3",
                name: "影舞者",
                description: "极致速度，攻击必定暴击",
                icon: "🥷",
                type: "aura",
                cost: 3,
                prerequisites: ["dexterity_2"],
                effects: {
                    attackSpeed: 2.0,
                    critChance: 1.0,
                    dodgeChance: 0.3,
                    duration: 20,
                    cooldown: 80,
                    manaCost: 60
                }
            }
        ]
    },

    // 智力分支技能
    intelligence: {
        name: "智力",
        color: "#3498db",
        skills: [
            {
                id: "intelligence_1",
                name: "基础智力",
                description: "增加25%法力值和15%魔法伤害",
                icon: "🧠",
                type: "passive",
                cost: 1,
                prerequisites: [],
                effects: { 
                    mana: 1.25,
                    magicDamage: 1.15
                }
            },
            {
                id: "intelligence_2",
                name: "火球术",
                description: "发射火球造成魔法伤害",
                icon: "🔥",
                type: "active",
                cost: 2,
                prerequisites: ["intelligence_1"],
                effects: {
                    damageMultiplier: 1.8,
                    damageType: "magic",
                    cooldown: 4,
                    manaCost: 25
                }
            },
            {
                id: "intelligence_3",
                name: "大法师",
                description: "掌控元素力量的终极形态",
                icon: "🧙‍♂️",
                type: "aura",
                cost: 3,
                prerequisites: ["intelligence_2"],
                effects: {
                    magicDamage: 2.0,
                    mana: 1.5,
                    manaRegen: 3.0,
                    allSpellCooldown: 0.5,
                    duration: 25,
                    cooldown: 90,
                    manaCost: 80
                }
            }
        ]
    },

    // 体质分支技能
    constitution: {
        name: "体质",
        color: "#f39c12",
        skills: [
            {
                id: "constitution_1",
                name: "基础体质",
                description: "增加30%最大生命值",
                icon: "❤️",
                type: "passive",
                cost: 1,
                prerequisites: [],
                effects: { 
                    health: 1.3
                }
            },
            {
                id: "constitution_2",
                name: "治疗术",
                description: "快速恢复生命值",
                icon: "💊",
                type: "active",
                cost: 2,
                prerequisites: ["constitution_1"],
                effects: {
                    healAmount: 0.5,
                    cooldown: 10,
                    manaCost: 30
                }
            },
            {
                id: "constitution_3",
                name: "不朽之躯",
                description: "获得强大的生存能力",
                icon: "🛡️",
                type: "aura",
                cost: 3,
                prerequisites: ["constitution_2"],
                effects: {
                    health: 2.0,
                    healthRegen: 5.0,
                    damageReduction: 0.3,
                    immuneToDebuffs: true,
                    duration: 40,
                    cooldown: 120,
                    manaCost: 70
                }
            }
        ]
    },

    // 精神分支技能
    spirit: {
        name: "精神",
        color: "#9b59b6",
        skills: [
            {
                id: "spirit_1",
                name: "基础精神",
                description: "增加20%法力回复和10%全抗性",
                icon: "✨",
                type: "passive",
                cost: 1,
                prerequisites: [],
                effects: { 
                    manaRegen: 1.2,
                    allResistance: 0.1
                }
            },
            {
                id: "spirit_2",
                name: "神圣护盾",
                description: "创造吸收伤害的护盾",
                icon: "🔮",
                type: "active",
                cost: 2,
                prerequisites: ["spirit_1"],
                effects: {
                    shieldAmount: 0.8,
                    duration: 15,
                    cooldown: 12,
                    manaCost: 35
                }
            },
            {
                id: "spirit_3",
                name: "圣者",
                description: "获得神圣力量的庇护",
                icon: "👼",
                type: "aura",
                cost: 3,
                prerequisites: ["spirit_2"],
                effects: {
                    manaRegen: 3.0,
                    allResistance: 0.5,
                    healOverTime: 0.05,
                    holyDamageBonus: 1.5,
                    duration: 35,
                    cooldown: 100,
                    manaCost: 90
                }
            }
        ]
    }
};

// 获取技能数据的辅助函数
function getSkillData(skillId) {
    if (!window.SkillTreeData) return null;
    for (const attributeData of Object.values(window.SkillTreeData)) {
        const skill = attributeData.skills.find(s => s.id === skillId);
        if (skill) return skill;
    }
    return null;
}

function getAllSkills() {
    if (!window.SkillTreeData) return [];
    const allSkills = [];
    Object.values(window.SkillTreeData).forEach(attributeData => {
        allSkills.push(...attributeData.skills);
    });
    return allSkills;
}

function getAttributeSkills(attributeName) {
    return window.SkillTreeData?.[attributeName]?.skills || [];
}

function getSkillEffect(skillId, level) {
    const skill = getSkillData(skillId);
    if (!skill) return {};
    
    // 根据等级调整效果
    const effects = { ...skill.effects };
    Object.keys(effects).forEach(key => {
        if (typeof effects[key] === 'number' && key.includes('Multiplier')) {
            effects[key] = 1 + (effects[key] - 1) * level;
        } else if (typeof effects[key] === 'number' && effects[key] > 1) {
            effects[key] = 1 + (effects[key] - 1) * level;
        }
    });
    
    return effects;
}

function getSkillCost(skillId, targetLevel) {
    const skill = getSkillData(skillId);
    if (!skill) return 0;
    
    return skill.cost * targetLevel;
}

function canLearnSkill(skillId, currentLevel, character, learnedSkills) {
    const skill = getSkillData(skillId);
    if (!skill) return false;
    
    // 检查前置条件
    if (skill.prerequisites.length > 0) {
        for (const prereqId of skill.prerequisites) {
            if (!learnedSkills.has(prereqId)) {
                return false;
            }
        }
    }
    
    // 检查技能点
    const cost = getSkillCost(skillId, currentLevel + 1);
    if (character.skillPoints < cost) {
        return false;
    }
    
    return true;
}

function calculateSkillDamage(skillId, skillLevel, caster) {
    const skill = getSkillData(skillId);
    if (!skill || skill.type !== 'active') return 0;
    
    const effects = getSkillEffect(skillId, skillLevel);
    let baseDamage = 0;
    
    if (effects.damageType === 'magic') {
        baseDamage = caster.magicPower || caster.intelligence * 2;
    } else {
        baseDamage = caster.physicalPower || caster.strength * 2;
    }
    
    return baseDamage * (effects.damageMultiplier || 1);
}

function canUseSkill(skillId, skillLevel, caster) {
    const skill = getSkillData(skillId);
    if (!skill || skill.type !== 'active') return false;
    
    const effects = getSkillEffect(skillId, skillLevel);
    
    // 检查法力消耗
    if (effects.manaCost && caster.currentMana < effects.manaCost) {
        return false;
    }
    
    // 检查冷却时间
    const lastUsed = caster.skillCooldowns?.[skillId] || 0;
    const cooldown = (effects.cooldown || 0) * 1000; // 转换为毫秒
    if (Date.now() - lastUsed < cooldown) {
        return false;
    }
    
    return true;
}

// 暴露到全局作用域
window.SkillTreeData = SkillTreeData;