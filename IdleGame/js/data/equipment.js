// 装备数据配置
const EQUIPMENT_DATA = {
    // 装备品质配置
    qualities: {
        common: {
            name: '普通',
            color: '#ffffff',
            statCount: 1,
            multiplier: 1.0
        },
        magic: {
            name: '魔法',
            color: '#4A90E2',
            statCount: 2,
            multiplier: 1.3
        },
        rare: {
            name: '稀有',
            color: '#F5A623',
            statCount: 3,
            multiplier: 1.7
        },
        epic: {
            name: '史诗',
            color: '#9013FE',
            statCount: 4,
            multiplier: 2.2
        },
        legendary: {
            name: '传说',
            color: '#FF6B35',
            statCount: 5,
            multiplier: 3.0
        }
    },

    // 装备槽位配置
    slots: {
        helmet: {
            name: '头盔',
            icon: '🪖',
            statPools: ['health', 'defense', 'magicResist']
        },
        chest: {
            name: '胸甲',
            icon: '👕',
            statPools: ['health', 'defense', 'magicResist']
        },
        pants: {
            name: '护腿',
            icon: '👖',
            statPools: ['health', 'defense', 'magicResist']
        },
        boots: {
            name: '靴子',
            icon: '👢',
            statPools: ['health', 'defense', 'dodgeRate']
        },
        gloves: {
            name: '手套',
            icon: '🧤',
            statPools: ['physicalAttack', 'critRate', 'critDamage']
        },
        lefthand: {
            name: '左手武器',
            icon: '⚔️',
            statPools: ['physicalAttack', 'magicalAttack', 'critRate', 'critDamage']
        },
        righthand: {
            name: '右手武器',
            icon: '🗡️',
            statPools: ['physicalAttack', 'magicalAttack', 'critRate', 'critDamage']
        },
        necklace: {
            name: '项链',
            icon: '📿',
            statPools: ['physicalAttack', 'magicalAttack', 'health', 'critRate']
        },
        ring1: {
            name: '戒指',
            icon: '💍',
            statPools: ['physicalAttack', 'magicalAttack', 'critRate', 'critDamage']
        },
        ring2: {
            name: '戒指',
            icon: '💍',
            statPools: ['physicalAttack', 'magicalAttack', 'critRate', 'critDamage']
        },
        belt: {
            name: '腰带',
            icon: '🔗',
            statPools: ['health', 'defense', 'magicResist']
        },
        shoulder: {
            name: '肩甲',
            icon: '🛡️',
            statPools: ['health', 'defense', 'magicResist']
        },
        cloak: {
            name: '斗篷',
            icon: '🧥',
            statPools: ['health', 'dodgeRate', 'magicResist']
        },
        earring: {
            name: '耳环',
            icon: '💎',
            statPools: ['magicalAttack', 'critRate', 'skillCooldown']
        }
    },

    // 属性基础值配置
    statBaseValues: {
        physicalAttack: {
            base: 5,
            perLevel: 2,
            weight: 1.0
        },
        magicalAttack: {
            base: 5,
            perLevel: 2,
            weight: 1.0
        },
        health: {
            base: 20,
            perLevel: 5,
            weight: 0.2
        },
        defense: {
            base: 2,
            perLevel: 1,
            weight: 1.5
        },
        magicResist: {
            base: 2,
            perLevel: 1,
            weight: 1.5
        },
        critRate: {
            base: 5,
            perLevel: 0.5,
            weight: 2.0
        },
        critDamage: {
            base: 10,
            perLevel: 1,
            weight: 1.0
        },
        hitRate: {
            base: 5,
            perLevel: 0.5,
            weight: 1.5
        },
        dodgeRate: {
            base: 5,
            perLevel: 0.5,
            weight: 2.0
        },
        skillCooldown: {
            base: 1,
            perLevel: 0.5,
            weight: 1.5
        }
    },

    // 装备名称前缀
    prefixes: {
        common: ['破旧的', '普通的', '简陋的'],
        magic: ['魔法', '附魔的', '神秘的'],
        rare: ['稀有的', '精制的', '优质的'],
        epic: ['史诗', '传奇的', '英雄的'],
        legendary: ['传说', '神话', '至尊']
    }
};

// 获取装备数据
function getEquipmentData() {
    return EQUIPMENT_DATA;
}

// 获取装备品质数据
function getEquipmentQuality(quality) {
    return EQUIPMENT_DATA.qualities[quality];
}

// 获取装备槽位数据
function getEquipmentSlot(slot) {
    return EQUIPMENT_DATA.slots[slot];
}

// 获取属性基础值
function getStatBaseValue(stat, level) {
    const statData = EQUIPMENT_DATA.statBaseValues[stat];
    if (!statData) return level;
    
    return statData.base + statData.perLevel * level;
}

// 获取属性权重
function getStatWeight(stat) {
    const statData = EQUIPMENT_DATA.statBaseValues[stat];
    return statData ? statData.weight : 1.0;
} 