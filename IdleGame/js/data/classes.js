// 职业数据配置
const ClassData = {
    warrior: {
        name: '战士',
        description: '高血量高防御的近战职业',
        icon: '⚔️',
        baseStats: {
            physicalAttack: 15,
            magicalAttack: 5,
            health: 120,
            defense: 10,
            magicResist: 5,
            critRate: 5,
            critDamage: 50,
            hitRate: 10,
            dodgeRate: 5,
            skillCooldown: 0
        },
        statGrowth: {
            physicalAttack: 3,
            magicalAttack: 1,
            health: 25,
            defense: 2,
            magicResist: 1,
            critRate: 1,
            critDamage: 2,
            hitRate: 1,
            dodgeRate: 1,
            skillCooldown: 0
        },
        preferredEquipment: ['sword', 'shield', 'heavy_armor'],
        skills: ['slash', 'shield_bash', 'berserker_rage', 'taunt', 'armor_mastery']
    },

    mage: {
        name: '法师',
        description: '高魔法攻击的远程职业',
        icon: '🔮',
        baseStats: {
            physicalAttack: 8,
            magicalAttack: 18,
            health: 80,
            defense: 5,
            magicResist: 12,
            critRate: 8,
            critDamage: 60,
            hitRate: 12,
            dodgeRate: 8,
            skillCooldown: 15
        },
        statGrowth: {
            physicalAttack: 1,
            magicalAttack: 4,
            health: 15,
            defense: 1,
            magicResist: 2,
            critRate: 1,
            critDamage: 3,
            hitRate: 2,
            dodgeRate: 1,
            skillCooldown: 2
        },
        preferredEquipment: ['staff', 'wand', 'robe'],
        skills: ['fireball', 'ice_shard', 'lightning_bolt', 'mana_shield', 'spell_mastery']
    },

    ranger: {
        name: '游侠',
        description: '高命中高暴击的平衡职业',
        icon: '🏹',
        baseStats: {
            physicalAttack: 12,
            magicalAttack: 10,
            health: 100,
            defense: 7,
            magicResist: 8,
            critRate: 12,
            critDamage: 75,
            hitRate: 15,
            dodgeRate: 10,
            skillCooldown: 8
        },
        statGrowth: {
            physicalAttack: 2,
            magicalAttack: 2,
            health: 20,
            defense: 1,
            magicResist: 1,
            critRate: 2,
            critDamage: 4,
            hitRate: 3,
            dodgeRate: 2,
            skillCooldown: 1
        },
        preferredEquipment: ['bow', 'crossbow', 'leather_armor'],
        skills: ['aimed_shot', 'multi_shot', 'trap', 'stealth', 'archery_mastery']
    },

    assassin: {
        name: '刺客',
        description: '极高暴击伤害和闪避的职业',
        icon: '🗡️',
        baseStats: {
            physicalAttack: 14,
            magicalAttack: 8,
            health: 90,
            defense: 6,
            magicResist: 7,
            critRate: 18,
            critDamage: 100,
            hitRate: 12,
            dodgeRate: 15,
            skillCooldown: 5
        },
        statGrowth: {
            physicalAttack: 3,
            magicalAttack: 1,
            health: 18,
            defense: 1,
            magicResist: 1,
            critRate: 3,
            critDamage: 5,
            hitRate: 2,
            dodgeRate: 3,
            skillCooldown: 1
        },
        preferredEquipment: ['dagger', 'throwing_knife', 'light_armor'],
        skills: ['backstab', 'poison_blade', 'shadow_step', 'evasion', 'assassination_mastery']
    }
};

// 获取职业数据
function getClassData(className) {
    return ClassData[className] || ClassData.warrior;
}

// 获取所有职业列表
function getAllClasses() {
    return Object.keys(ClassData);
}

// 计算职业在特定等级的属性
function calculateClassStats(className, level) {
    const classData = getClassData(className);
    const stats = { ...classData.baseStats };
    
    // 应用等级成长
    for (let [stat, growth] of Object.entries(classData.statGrowth)) {
        stats[stat] += growth * (level - 1);
    }
    
    return stats;
} 