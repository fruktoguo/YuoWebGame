// 技能树数据 - 自然分叉结构
const SkillTreeData = {
    // 战士 - 力量、防御、武器三大分支交互
    warrior: {
        name: "战士",
        branches: {
            strength: {
                name: "力量分支",
                color: "#ff4444",
                skills: {
                    // 基础技能
                    basic: [
                        {
                            id: "warrior_str_1",
                            name: "基础力量",
                            description: "增加10%物理伤害",
                            icon: "💪",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { physicalDamage: 1.1 }
                        }
                    ],
                    // 进阶技能 - 需要基础技能
                    advanced: [
                        {
                            id: "warrior_str_2",
                            name: "重击",
                            description: "造成150%物理伤害的主动技能",
                            icon: "⚔️",
                            type: "active",
                            cost: 2,
                            prerequisites: ["warrior_str_1"],
                            effects: { 
                                damageMultiplier: 1.5,
                                cooldown: 3,
                                manaCost: 10
                            }
                        },
                        {
                            id: "warrior_str_3",
                            name: "狂怒",
                            description: "增加攻击速度，但降低防御",
                            icon: "😡",
                            type: "passive",
                            cost: 2,
                            prerequisites: ["warrior_str_1"],
                            effects: { 
                                attackSpeed: 1.3,
                                physicalDamage: 1.15,
                                defense: 0.9
                            }
                        }
                    ],
                    // 专精技能 - 需要进阶技能或交叉技能
                    expert: [
                        {
                            id: "warrior_str_4",
                            name: "致命打击",
                            description: "重击有几率造成额外伤害",
                            icon: "💥",
                            type: "passive",
                            cost: 3,
                            prerequisites: ["warrior_str_2"],
                            effects: {
                                critChance: 0.15,
                                critMultiplier: 2.0
                            }
                        },
                        {
                            id: "warrior_str_5",
                            name: "狂暴冲锋",
                            description: "需要狂怒状态，造成大量伤害",
                            icon: "🏃‍♂️",
                            type: "active",
                            cost: 3,
                            prerequisites: ["warrior_str_3"],
                            effects: {
                                damageMultiplier: 2.5,
                                cooldown: 15,
                                manaCost: 30
                            }
                        },
                        {
                            id: "warrior_cross_1",
                            name: "战斗专精",
                            description: "需要力量和武器分支，全面提升",
                            icon: "⚔️",
                            type: "passive",
                            cost: 4,
                            prerequisites: ["warrior_str_1", "warrior_wpn_1"],
                            effects: {
                                physicalDamage: 1.25,
                                attackSpeed: 1.15,
                                critChance: 0.1
                            }
                        }
                    ],
                    // 终极技能
                    ultimate: [
                        {
                            id: "warrior_str_ultimate",
                            name: "无双战神",
                            description: "需要多个前置技能的终极形态",
                            icon: "👑",
                            type: "aura",
                            cost: 5,
                            prerequisites: ["warrior_str_4", "warrior_str_5", "warrior_cross_1"],
                            effects: {
                                physicalDamage: 2.0,
                                attackSpeed: 1.8,
                                critChance: 0.5,
                                duration: 60,
                                cooldown: 180,
                                manaCost: 100
                            }
                        }
                    ]
                }
            },
            defense: {
                name: "防御分支",
                color: "#4444ff",
                skills: {
                    basic: [
                        {
                            id: "warrior_def_1",
                            name: "基础防御",
                            description: "增加15%最大生命值",
                            icon: "🛡️",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { health: 1.15 }
                        }
                    ],
                    advanced: [
                        {
                            id: "warrior_def_2",
                            name: "护甲精通",
                            description: "增加25%最大生命值和防御力",
                            icon: "🛡️",
                            type: "passive",
                            cost: 2,
                            prerequisites: ["warrior_def_1"],
                            effects: { 
                                health: 1.25,
                                defense: 1.2
                            }
                        },
                        {
                            id: "warrior_def_3",
                            name: "反击",
                            description: "被攻击时有几率反击",
                            icon: "⚔️",
                            type: "passive",
                            cost: 2,
                            prerequisites: ["warrior_def_1"],
                            effects: {
                                counterChance: 0.25,
                                counterDamage: 1.5
                            }
                        }
                    ],
                    expert: [
                        {
                            id: "warrior_def_4",
                            name: "钢铁意志",
                            description: "大幅提升生存能力",
                            icon: "🏰",
                            type: "passive",
                            cost: 3,
                            prerequisites: ["warrior_def_2"],
                            effects: {
                                health: 1.4,
                                healthRegen: 2.0,
                                damageReduction: 0.15
                            }
                        },
                        {
                            id: "warrior_def_5",
                            name: "致命反击",
                            description: "反击伤害大幅提升",
                            icon: "💀",
                            type: "passive",
                            cost: 3,
                            prerequisites: ["warrior_def_3"],
                            effects: {
                                counterChance: 0.4,
                                counterDamage: 3.0,
                                counterCrit: 0.5
                            }
                        },
                        {
                            id: "warrior_cross_2",
                            name: "守护战士",
                            description: "需要防御和力量分支",
                            icon: "🛡️",
                            type: "passive",
                            cost: 4,
                            prerequisites: ["warrior_def_1", "warrior_str_1"],
                            effects: {
                                health: 1.3,
                                physicalDamage: 1.1,
                                damageReduction: 0.1
                            }
                        }
                    ],
                    ultimate: [
                        {
                            id: "warrior_def_ultimate",
                            name: "不朽堡垒",
                            description: "终极防御形态",
                            icon: "🏰",
                            type: "aura",
                            cost: 5,
                            prerequisites: ["warrior_def_4", "warrior_def_5", "warrior_cross_2"],
                            effects: {
                                health: 2.5,
                                damageReduction: 0.5,
                                healthRegen: 5.0,
                                counterChance: 0.8,
                                counterDamage: 4.0,
                                duration: 90,
                                cooldown: 200,
                                manaCost: 150
                            }
                        }
                    ]
                }
            },
            weapon: {
                name: "武器分支",
                color: "#ff8800",
                skills: {
                    basic: [
                        {
                            id: "warrior_wpn_1",
                            name: "武器精通",
                            description: "增加10%攻击速度",
                            icon: "⚔️",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { attackSpeed: 1.1 }
                        }
                    ],
                    advanced: [
                        {
                            id: "warrior_wpn_2",
                            name: "双武器",
                            description: "装备双武器，攻击速度大增",
                            icon: "⚔️",
                            type: "passive",
                            cost: 2,
                            prerequisites: ["warrior_wpn_1"],
                            effects: { 
                                attackSpeed: 1.4,
                                physicalDamage: 1.1
                            }
                        },
                        {
                            id: "warrior_wpn_3",
                            name: "武器大师",
                            description: "精通各种武器",
                            icon: "🗡️",
                            type: "passive",
                            cost: 2,
                            prerequisites: ["warrior_wpn_1"],
                            effects: {
                                physicalDamage: 1.2,
                                critChance: 0.1
                            }
                        }
                    ],
                    expert: [
                        {
                            id: "warrior_wpn_4",
                            name: "风暴连击",
                            description: "连续攻击技能",
                            icon: "🌪️",
                            type: "active",
                            cost: 3,
                            prerequisites: ["warrior_wpn_2"],
                            effects: {
                                multiHit: 5,
                                damagePerHit: 0.8,
                                cooldown: 20,
                                manaCost: 40
                            }
                        },
                        {
                            id: "warrior_wpn_5",
                            name: "完美技巧",
                            description: "攻击必定命中和暴击",
                            icon: "🎯",
                            type: "passive",
                            cost: 3,
                            prerequisites: ["warrior_wpn_3"],
                            effects: {
                                hitRate: 999,
                                critChance: 0.3,
                                critMultiplier: 2.5
                            }
                        },
                        {
                            id: "warrior_cross_3",
                            name: "武装要塞",
                            description: "需要武器和防御分支",
                            icon: "🏰",
                            type: "passive",
                            cost: 4,
                            prerequisites: ["warrior_wpn_1", "warrior_def_1"],
                            effects: {
                                attackSpeed: 1.2,
                                health: 1.2,
                                blockChance: 0.2
                            }
                        }
                    ],
                    ultimate: [
                        {
                            id: "warrior_wpn_ultimate",
                            name: "剑圣",
                            description: "武器技巧的巅峰",
                            icon: "👑",
                            type: "aura",
                            cost: 5,
                            prerequisites: ["warrior_wpn_4", "warrior_wpn_5", "warrior_cross_3"],
                            effects: {
                                physicalDamage: 3.0,
                                attackSpeed: 2.5,
                                critChance: 0.8,
                                critMultiplier: 4.0,
                                multiHit: 3,
                                duration: 45,
                                cooldown: 150,
                                manaCost: 120
                            }
                        }
                    ]
                }
            }
        }
    },

    // 法师 - 元素交互系统
    mage: {
        name: "法师",
        branches: {
            fire: {
                name: "火系分支",
                color: "#ff2222",
                skills: {
                    basic: [
                        {
                            id: "mage_fire_1",
                            name: "火焰亲和",
                            description: "增加15%魔法伤害",
                            icon: "🔥",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { magicDamage: 1.15 }
                        }
                    ],
                    advanced: [
                        {
                            id: "mage_fire_2",
                            name: "火球术",
                            description: "发射火球造成魔法伤害",
                            icon: "🔥",
                            type: "active",
                            cost: 2,
                            prerequisites: ["mage_fire_1"],
                            effects: {
                                damageMultiplier: 2.0,
                                damageType: "magic",
                                cooldown: 2,
                                manaCost: 15
                            }
                        },
                        {
                            id: "mage_fire_3",
                            name: "燃烧",
                            description: "攻击附带燃烧效果",
                            icon: "🌋",
                            type: "passive",
                            cost: 2,
                            prerequisites: ["mage_fire_1"],
                            effects: {
                                burnChance: 0.3,
                                burnDamage: 1.5,
                                burnDuration: 5
                            }
                        }
                    ],
                    expert: [
                        {
                            id: "mage_fire_4",
                            name: "烈焰爆发",
                            description: "范围火焰伤害",
                            icon: "💥",
                            type: "active",
                            cost: 3,
                            prerequisites: ["mage_fire_2"],
                            effects: {
                                damageMultiplier: 3.0,
                                areaEffect: true,
                                cooldown: 8,
                                manaCost: 35
                            }
                        },
                        {
                            id: "mage_fire_5",
                            name: "地狱之火",
                            description: "持续燃烧领域",
                            icon: "🌋",
                            type: "aura",
                            cost: 3,
                            prerequisites: ["mage_fire_3"],
                            effects: {
                                burnAura: true,
                                areaBurnDamage: 2.0,
                                duration: 30,
                                cooldown: 60,
                                manaCost: 50
                            }
                        },
                        {
                            id: "mage_element_1",
                            name: "元素融合",
                            description: "需要火系和冰系",
                            icon: "🌪️",
                            type: "active",
                            cost: 4,
                            prerequisites: ["mage_fire_1", "mage_ice_1"],
                            effects: {
                                steamDamage: 2.5,
                                damageType: "steam",
                                cooldown: 12,
                                manaCost: 40
                            }
                        }
                    ],
                    ultimate: [
                        {
                            id: "mage_fire_ultimate",
                            name: "炎魔降临",
                            description: "火系终极形态",
                            icon: "👹",
                            type: "aura",
                            cost: 5,
                            prerequisites: ["mage_fire_4", "mage_fire_5", "mage_element_1"],
                            effects: {
                                magicDamage: 3.0,
                                burnChance: 1.0,
                                burnDamage: 4.0,
                                areaEffect: true,
                                fireImmunity: true,
                                duration: 60,
                                cooldown: 180,
                                manaCost: 100
                            }
                        }
                    ]
                }
            },
            ice: {
                name: "冰系分支",
                color: "#2288ff",
                skills: {
                    basic: [
                        {
                            id: "mage_ice_1",
                            name: "冰霜亲和",
                            description: "增加魔法伤害和魔法值",
                            icon: "❄️",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { 
                                magicDamage: 1.1,
                                mana: 1.15
                            }
                        }
                    ],
                    advanced: [
                        {
                            id: "mage_ice_2",
                            name: "冰箭术",
                            description: "减速敌人的冰箭",
                            icon: "🧊",
                            type: "active",
                            cost: 2,
                            prerequisites: ["mage_ice_1"],
                            effects: {
                                damageMultiplier: 1.8,
                                slowEffect: 0.3,
                                slowDuration: 3,
                                cooldown: 2.5,
                                manaCost: 12
                            }
                        },
                        {
                            id: "mage_ice_3",
                            name: "冰甲术",
                            description: "冰霜护甲保护",
                            icon: "🛡️",
                            type: "active",
                            cost: 2,
                            prerequisites: ["mage_ice_1"],
                            effects: {
                                iceArmor: true,
                                damageReduction: 0.3,
                                reflectDamage: 1.5,
                                duration: 60,
                                cooldown: 30,
                                manaCost: 25
                            }
                        }
                    ],
                    expert: [
                        {
                            id: "mage_ice_4",
                            name: "冰风暴",
                            description: "范围冰冻攻击",
                            icon: "🌨️",
                            type: "active",
                            cost: 3,
                            prerequisites: ["mage_ice_2"],
                            effects: {
                                damageMultiplier: 2.5,
                                freezeChance: 0.4,
                                areaEffect: true,
                                cooldown: 10,
                                manaCost: 40
                            }
                        },
                        {
                            id: "mage_ice_5",
                            name: "绝对零度",
                            description: "冰冻一切",
                            icon: "❄️",
                            type: "active",
                            cost: 3,
                            prerequisites: ["mage_ice_3"],
                            effects: {
                                massFreeze: true,
                                freezeDuration: 8,
                                damageMultiplier: 4.0,
                                cooldown: 45,
                                manaCost: 80
                            }
                        },
                        {
                            id: "mage_element_2",
                            name: "雷暴",
                            description: "需要冰系和闪电系",
                            icon: "⛈️",
                            type: "active",
                            cost: 4,
                            prerequisites: ["mage_ice_1", "mage_lightning_1"],
                            effects: {
                                stormDamage: 3.0,
                                chainLightning: 5,
                                cooldown: 15,
                                manaCost: 50
                            }
                        }
                    ],
                    ultimate: [
                        {
                            id: "mage_ice_ultimate",
                            name: "冰霜女王",
                            description: "冰系终极形态",
                            icon: "👸",
                            type: "aura",
                            cost: 5,
                            prerequisites: ["mage_ice_4", "mage_ice_5", "mage_element_2"],
                            effects: {
                                magicDamage: 2.5,
                                freezeChance: 0.8,
                                iceImmunity: true,
                                mana: 2.0,
                                manaRegen: 3.0,
                                areaFreeze: true,
                                duration: 90,
                                cooldown: 200,
                                manaCost: 120
                            }
                        }
                    ]
                }
            },
            lightning: {
                name: "闪电分支",
                color: "#ffff22",
                skills: {
                    basic: [
                        {
                            id: "mage_lightning_1",
                            name: "电流掌控",
                            description: "增加魔法值恢复",
                            icon: "⚡",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { manaRegen: 1.5 }
                        }
                    ],
                    advanced: [
                        {
                            id: "mage_lightning_2",
                            name: "闪电箭",
                            description: "快速闪电攻击",
                            icon: "⚡",
                            type: "active",
                            cost: 2,
                            prerequisites: ["mage_lightning_1"],
                            effects: {
                                damageMultiplier: 1.6,
                                instantCast: true,
                                cooldown: 1,
                                manaCost: 8
                            }
                        },
                        {
                            id: "mage_lightning_3",
                            name: "静电场",
                            description: "被动电击反击",
                            icon: "⚡",
                            type: "passive",
                            cost: 2,
                            prerequisites: ["mage_lightning_1"],
                            effects: {
                                staticField: true,
                                shockChance: 0.3,
                                shockDamage: 1.2
                            }
                        }
                    ],
                    expert: [
                        {
                            id: "mage_lightning_4",
                            name: "连锁闪电",
                            description: "跳跃的闪电",
                            icon: "🌩️",
                            type: "active",
                            cost: 3,
                            prerequisites: ["mage_lightning_2"],
                            effects: {
                                damageMultiplier: 2.2,
                                chainTargets: 5,
                                cooldown: 6,
                                manaCost: 30
                            }
                        },
                        {
                            id: "mage_lightning_5",
                            name: "雷神之怒",
                            description: "召唤雷暴",
                            icon: "⛈️",
                            type: "aura",
                            cost: 3,
                            prerequisites: ["mage_lightning_3"],
                            effects: {
                                lightningStorm: true,
                                stormDamage: 2.5,
                                duration: 20,
                                cooldown: 40,
                                manaCost: 60
                            }
                        },
                        {
                            id: "mage_element_3",
                            name: "元素风暴",
                            description: "需要三系元素",
                            icon: "🌪️",
                            type: "active",
                            cost: 5,
                            prerequisites: ["mage_fire_1", "mage_ice_1", "mage_lightning_1"],
                            effects: {
                                triElemental: true,
                                massiveAreaDamage: 5.0,
                                cooldown: 60,
                                manaCost: 100
                            }
                        }
                    ],
                    ultimate: [
                        {
                            id: "mage_lightning_ultimate",
                            name: "雷神",
                            description: "闪电系终极形态",
                            icon: "⚡",
                            type: "aura",
                            cost: 5,
                            prerequisites: ["mage_lightning_4", "mage_lightning_5", "mage_element_3"],
                            effects: {
                                magicDamage: 2.8,
                                lightningImmunity: true,
                                instantCast: true,
                                chainLightning: 10,
                                mana: 3.0,
                                duration: 75,
                                cooldown: 150,
                                manaCost: 80
                            }
                        }
                    ]
                }
            }
        }
    },

    // 其他职业保持类似结构但简化
    tank: {
        name: "坦克",
        branches: {
            shield: {
                name: "护盾分支",
                color: "#888888",
                skills: {
                    basic: [
                        {
                            id: "tank_shield_1",
                            name: "护盾训练",
                            description: "增加20%最大生命值",
                            icon: "🛡️",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { health: 1.2 }
                        }
                    ],
                    advanced: [
                        {
                            id: "tank_shield_2",
                            name: "护盾格挡",
                            description: "增加格挡几率",
                            icon: "🛡️",
                            type: "passive",
                            cost: 2,
                            prerequisites: ["tank_shield_1"],
                            effects: { 
                                health: 1.35,
                                blockChance: 0.3
                            }
                        }
                    ]
                }
            }
        }
    },

    priest: {
        name: "牧师",
        branches: {
            healing: {
                name: "治疗分支",
                color: "#ffdd00",
                skills: {
                    basic: [
                        {
                            id: "priest_heal_1",
                            name: "治疗术",
                            description: "恢复20%最大生命值",
                            icon: "❤️",
                            type: "active",
                            cost: 1,
                            prerequisites: [],
                            effects: {
                                heal: 0.2,
                                cooldown: 5,
                                manaCost: 15
                            }
                        }
                    ]
                }
            }
        }
    },

    assassin: {
        name: "刺客",
        branches: {
            stealth: {
                name: "潜行分支",
                color: "#660066",
                skills: {
                    basic: [
                        {
                            id: "assassin_stealth_1",
                            name: "影子步伐",
                            description: "增加15%攻击速度",
                            icon: "👤",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { attackSpeed: 1.15 }
                        }
                    ]
                }
            }
        }
    },

    archer: {
        name: "射手",
        branches: {
            precision: {
                name: "精准分支",
                color: "#008800",
                skills: {
                    basic: [
                        {
                            id: "archer_precision_1",
                            name: "鹰眼",
                            description: "增加15%暴击几率",
                            icon: "🦅",
                            type: "passive",
                            cost: 1,
                            prerequisites: [],
                            effects: { critChance: 0.15 }
                        }
                    ]
                }
            }
        }
    }
};

// 兼容性函数 - 保持与现有代码的兼容
function getSkillData(skillId) {
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

function getClassSkillTree(className) {
    return SkillTreeData[className] || null;
}

function getClassSkills(className) {
    const classData = SkillTreeData[className];
    if (!classData) return [];
    
    const skills = [];
    for (const branchName in classData.branches) {
        const branchData = classData.branches[branchName];
        for (const tierKey in branchData.skills) {
            skills.push(...branchData.skills[tierKey]);
        }
    }
    return skills;
}

// 获取技能在特定等级的效果
function getSkillEffect(skillId, level) {
    const skill = getSkillData(skillId);
    if (!skill || !skill.effects) return {};
    
    const effects = {};
    for (let effectType in skill.effects) {
        const effect = skill.effects[effectType];
        effects[effectType] = effect.base + (level - 1) * effect.perLevel;
    }
    return effects;
}

// 计算技能学习成本
function getSkillCost(skillId, targetLevel) {
    const skill = getSkillData(skillId);
    if (!skill) return 0;
    
    return skill.baseCost + (targetLevel - 1) * skill.levelCost;
}

// 检查技能学习条件
function canLearnSkill(skillId, currentLevel, character, learnedSkills) {
    const skill = getSkillData(skillId);
    if (!skill) return false;
    
    // 检查是否已达最高等级
    if (currentLevel >= skill.maxLevel) return false;
    
    // 检查角色等级
    if (character.level < skill.requirements.level) return false;
    
    // 检查前置技能
    if (skill.requirements.skills) {
        for (let prereqId in skill.requirements.skills) {
            const requiredLevel = skill.requirements.skills[prereqId];
            const currentPrereqLevel = learnedSkills[prereqId] || 0;
            if (currentPrereqLevel < requiredLevel) return false;
        }
    }
    
    // 检查属性要求
    if (skill.requirements.stats) {
        for (let statName in skill.requirements.stats) {
            const requiredValue = skill.requirements.stats[statName];
            const currentValue = character.getStat(statName);
            if (currentValue < requiredValue) return false;
        }
    }
    
    return true;
}

// 计算技能伤害
function calculateSkillDamage(skillId, skillLevel, caster) {
    const skill = getSkillData(skillId);
    const effects = getSkillEffect(skillId, skillLevel);
    
    if (!skill || skill.type !== 'active') return 0;
    
    const baseDamage = skill.id.includes('fire') || skill.id.includes('ice') || skill.id.includes('heal') ? 
                      caster.magicalAttack : caster.physicalAttack;
    const multiplier = effects.damage || 1.0;
    
    return Math.floor(baseDamage * multiplier);
}

// 检查技能是否可用
function canUseSkill(skillId, skillLevel, caster) {
    const skill = getSkillData(skillId);
    const effects = getSkillEffect(skillId, skillLevel);
    
    if (!skill) return false;
    
    // 检查法力值
    if (effects.manaCost && caster.currentMP < effects.manaCost) return false;
    
    return true;
} 