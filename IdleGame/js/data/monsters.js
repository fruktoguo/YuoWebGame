// 怪物数据配置
const MONSTER_DATA = {
    // 怪物类型
    types: {
        skeleton: {
            name: '骷髅',
            baseStats: {
                health: 50,
                physicalAttack: 8,
                defense: 3,
                magicResist: 2
            },
            rewards: {
                exp: 10,
                gold: 5
            },
            dropRates: {
                equipment: 0.1
            }
        },
        goblin: {
            name: '哥布林',
            baseStats: {
                health: 40,
                physicalAttack: 12,
                defense: 2,
                magicResist: 1
            },
            rewards: {
                exp: 8,
                gold: 7
            },
            dropRates: {
                equipment: 0.12
            }
        },
        orc: {
            name: '兽人',
            baseStats: {
                health: 80,
                physicalAttack: 15,
                defense: 5,
                magicResist: 3
            },
            rewards: {
                exp: 15,
                gold: 10
            },
            dropRates: {
                equipment: 0.15
            }
        },
        spider: {
            name: '毒蜘蛛',
            baseStats: {
                health: 30,
                physicalAttack: 10,
                defense: 1,
                magicResist: 4
            },
            rewards: {
                exp: 12,
                gold: 6
            },
            dropRates: {
                equipment: 0.08
            }
        },
        troll: {
            name: '巨魔',
            baseStats: {
                health: 150,
                physicalAttack: 20,
                defense: 8,
                magicResist: 5
            },
            rewards: {
                exp: 25,
                gold: 15
            },
            dropRates: {
                equipment: 0.2
            }
        },
        dragon: {
            name: '幼龙',
            baseStats: {
                health: 300,
                physicalAttack: 35,
                magicalAttack: 25,
                defense: 12,
                magicResist: 15
            },
            rewards: {
                exp: 50,
                gold: 30
            },
            dropRates: {
                equipment: 0.3
            }
        }
    },

    // Boss怪物
    bosses: {
        1: {
            name: '骷髅王',
            type: 'skeleton',
            multiplier: 3.0,
            specialAbilities: ['regeneration']
        },
        10: {
            name: '兽人酋长',
            type: 'orc',
            multiplier: 2.5,
            specialAbilities: ['berserk']
        },
        20: {
            name: '蜘蛛女王',
            type: 'spider',
            multiplier: 4.0,
            specialAbilities: ['poison', 'web']
        },
        50: {
            name: '古代巨龙',
            type: 'dragon',
            multiplier: 5.0,
            specialAbilities: ['fire_breath', 'fly']
        }
    },

    // 区域配置
    areas: {
        1: {
            name: '新手村',
            stages: [1, 10],
            monsters: ['skeleton', 'goblin'],
            bossStage: 10
        },
        2: {
            name: '黑暗森林',
            stages: [11, 25],
            monsters: ['spider', 'orc', 'goblin'],
            bossStage: 20
        },
        3: {
            name: '荒芜山谷',
            stages: [26, 50],
            monsters: ['troll', 'orc', 'skeleton'],
            bossStage: 50
        },
        4: {
            name: '龙之巢穴',
            stages: [51, 100],
            monsters: ['dragon', 'troll'],
            bossStage: 100
        }
    }
};

// 怪物类
class Monster {
    constructor(type, level, stage) {
        this.type = type;
        this.level = level;
        this.stage = stage;
        
        const monsterData = MONSTER_DATA.types[type];
        if (!monsterData) {
            throw new Error(`未知的怪物类型: ${type}`);
        }
        
        this.name = monsterData.name;
        this.baseStats = { ...monsterData.baseStats };
        this.rewards = { ...monsterData.rewards };
        this.dropRates = { ...monsterData.dropRates };
        
        // 检查是否为Boss
        this.isBoss = MONSTER_DATA.bosses[stage];
        if (this.isBoss) {
            const bossData = MONSTER_DATA.bosses[stage];
            this.name = bossData.name;
            this.bossMultiplier = bossData.multiplier;
            this.specialAbilities = bossData.specialAbilities || [];
        }
        
        this.calculateStats();
        this.currentHP = this.maxHP;
    }

    // 计算怪物属性
    calculateStats() {
        const levelMultiplier = 1 + (this.level - 1) * 0.1;
        const stageMultiplier = 1 + (this.stage - 1) * 0.05;
        const bossMultiplier = this.isBoss ? this.bossMultiplier : 1;
        
        const totalMultiplier = levelMultiplier * stageMultiplier * bossMultiplier;
        
        // 计算最终属性
        this.maxHP = Math.floor(this.baseStats.health * totalMultiplier);
        this.physicalAttack = Math.floor((this.baseStats.physicalAttack || 0) * totalMultiplier);
        this.magicalAttack = Math.floor((this.baseStats.magicalAttack || 0) * totalMultiplier);
        this.defense = Math.floor((this.baseStats.defense || 0) * totalMultiplier);
        this.magicResist = Math.floor((this.baseStats.magicResist || 0) * totalMultiplier);
        
        // 计算奖励
        this.expReward = Math.floor(this.rewards.exp * totalMultiplier);
        this.goldReward = Math.floor(this.rewards.gold * totalMultiplier);
    }

    // 受到伤害
    takeDamage(damage) {
        this.currentHP = Math.max(0, this.currentHP - damage);
        return this.currentHP <= 0; // 返回是否死亡
    }

    // 是否存活
    isAlive() {
        return this.currentHP > 0;
    }

    // 获取攻击力
    getAttackPower() {
        return this.physicalAttack + this.magicalAttack;
    }

    // 获取防御减伤
    getDefenseReduction() {
        return Calculator.calculatePercentage(this.defense, 100);
    }

    // 获取魔抗减伤
    getMagicResistReduction() {
        return Calculator.calculatePercentage(this.magicResist, 100);
    }

    // 获取掉落物品
    getDrops() {
        const drops = [];
        
        // 检查装备掉落
        if (Math.random() < this.dropRates.equipment) {
            const equipment = this.generateEquipmentDrop();
            if (equipment) {
                drops.push(equipment);
            }
        }
        
        return drops;
    }

    // 生成装备掉落
    generateEquipmentDrop() {
        // 使用装备系统生成随机装备
        if (window.game && window.game.equipment) {
            const slots = window.game.equipment.slots;
            const randomSlot = Utils.getRandomElement(slots);
            return window.game.equipment.generateRandomEquipment(this.level, randomSlot);
        }
        return null;
    }
}

// 获取怪物数据
function getMonsterData() {
    return MONSTER_DATA;
}

// 获取怪物类型数据
function getMonsterType(type) {
    return MONSTER_DATA.types[type];
}

// 根据关卡生成怪物
function generateMonster(stage) {
    // 确定区域
    let area = null;
    for (let [areaId, areaData] of Object.entries(MONSTER_DATA.areas)) {
        if (stage >= areaData.stages[0] && stage <= areaData.stages[1]) {
            area = areaData;
            break;
        }
    }
    
    if (!area) {
        // 如果没有找到对应区域，使用最后一个区域
        const lastAreaId = Math.max(...Object.keys(MONSTER_DATA.areas).map(Number));
        area = MONSTER_DATA.areas[lastAreaId];
    }
    
    // 检查是否为Boss关卡
    if (MONSTER_DATA.bosses[stage]) {
        const bossData = MONSTER_DATA.bosses[stage];
        return new Monster(bossData.type, stage, stage);
    }
    
    // 随机选择怪物类型
    const monsterType = Utils.getRandomElement(area.monsters);
    return new Monster(monsterType, stage, stage);
}

// 获取区域信息
function getAreaInfo(stage) {
    for (let [areaId, areaData] of Object.entries(MONSTER_DATA.areas)) {
        if (stage >= areaData.stages[0] && stage <= areaData.stages[1]) {
            return areaData;
        }
    }
    return null;
} 