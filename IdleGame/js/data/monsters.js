// 怪物数据配置
const MONSTER_DATA = {
    // 基础怪物类型
    types: {
        skeleton: {
            name: '骷髅战士',
            icon: '💀',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzMzMzMzIiByeD0iOCIvPgo8cGF0aCBkPSJNMzIgMTZDMzUuMzEzNyAxNiAzOCAxOC42ODYzIDM4IDIyQzM4IDI1LjMxMzcgMzUuMzEzNyAyOCAzMiAyOEMyOC42ODYzIDI4IDI2IDI1LjMxMzcgMjYgMjJDMjYgMTguNjg2MyAyOC42ODYzIDE2IDMyIDE2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAuMjY4IDI2LjI2OCAzNCAzNCAzNEM0MS43MzIgMzQgNDggNDAuMjY4IDQ4IDQ4SDIwWiIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K',
            baseStats: {
                strength: 8,      // 力量
                agility: 6,       // 敏捷
                intelligence: 3,  // 智力
                spirit: 4,        // 精神
                stamina: 10       // 耐力
            },
            rewards: {
                exp: 15,
                gold: 8
            }
        },
        goblin: {
            name: '哥布林',
            icon: '👹',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzM3MzMzIiByeD0iOCIvPgo8cGF0aCBkPSJNMzIgMTZDMzUuMzEzNyAxNiAzOCAxOC42ODYzIDM4IDIyQzM4IDI1LjMxMzcgMzUuMzEzNyAyOCAzMiAyOEMyOC42ODYzIDI4IDI2IDI1LjMxMzcgMjYgMjJDMjYgMTguNjg2MyAyOC42ODYzIDE2IDMyIDE2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAuMjY4IDI2LjI2OCAzNCAzNCAzNEM0MS43MzIgMzQgNDggNDAuMjY4IDQ4IDQ4SDIwWiIgZmlsbD0iIzMzNzMzMyIvPgo8L3N2Zz4K',
            baseStats: {
                strength: 6,
                agility: 12,
                intelligence: 4,
                spirit: 3,
                stamina: 8
            },
            rewards: {
                exp: 12,
                gold: 10
            }
        },
        orc: {
            name: '兽人战士',
            icon: '🧌',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNjY0NDIyIiByeD0iOCIvPgo8cGF0aCBkPSJNMzIgMTZDMzUuMzEzNyAxNiAzOCAxOC42ODYzIDM4IDIyQzM4IDI1LjMxMzcgMzUuMzEzNyAyOCAzMiAyOEMyOC42ODYzIDI4IDI2IDI1LjMxMzcgMjYgMjJDMjYgMTguNjg2MyAyOC42ODYzIDE2IDMyIDE2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAuMjY4IDI2LjI2OCAzNCAzNCAzNEM0MS43MzIgMzQgNDggNDAuMjY4IDQ4IDQ4SDIwWiIgZmlsbD0iIzY2NDQyMiIvPgo8L3N2Zz4K',
            baseStats: {
                strength: 15,
                agility: 5,
                intelligence: 2,
                spirit: 6,
                stamina: 16
            },
            rewards: {
                exp: 20,
                gold: 15
            }
        },
        spider: {
            name: '毒蜘蛛',
            icon: '🕷️',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNDQyMjQ0IiByeD0iOCIvPgo8cGF0aCBkPSJNMzIgMTZDMzUuMzEzNyAxNiAzOCAxOC42ODYzIDM4IDIyQzM4IDI1LjMxMzcgMzUuMzEzNyAyOCAzMiAyOEMyOC42ODYzIDI4IDI2IDI1LjMxMzcgMjYgMjJDMjYgMTguNjg2MyAyOC42ODYzIDE2IDMyIDE2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAuMjY4IDI2LjI2OCAzNCAzNCAzNEM0MS43MzIgMzQgNDggNDAuMjY4IDQ4IDQ4SDIwWiIgZmlsbD0iIzQ0MjI0NCIvPgo8L3N2Zz4K',
            baseStats: {
                strength: 4,
                agility: 18,
                intelligence: 8,
                spirit: 7,
                stamina: 6
            },
            rewards: {
                exp: 18,
                gold: 12
            }
        },
        troll: {
            name: '巨魔',
            icon: '👹',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNjY2NjY2IiByeD0iOCIvPgo8cGF0aCBkPSJNMzIgMTZDMzUuMzEzNyAxNiAzOCAxOC42ODYzIDM4IDIyQzM4IDI1LjMxMzcgMzUuMzEzNyAyOCAzMiAyOEMyOC42ODYzIDI4IDI2IDI1LjMxMzcgMjYgMjJDMjYgMTguNjg2MyAyOC42ODYzIDE2IDMyIDE2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAuMjY4IDI2LjI2OCAzNCAzNCAzNEM0MS43MzIgMzQgNDggNDAuMjY4IDQ4IDQ4SDIwWiIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4K',
            baseStats: {
                strength: 20,
                agility: 3,
                intelligence: 1,
                spirit: 8,
                stamina: 25
            },
            rewards: {
                exp: 35,
                gold: 25
            }
        },
        elemental: {
            name: '元素精灵',
            icon: '🔥',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRkY0NDAwIiByeD0iOCIvPgo8cGF0aCBkPSJNMzIgMTZDMzUuMzEzNyAxNiAzOCAxOC42ODYzIDM4IDIyQzM4IDI1LjMxMzcgMzUuMzEzNyAyOCAzMiAyOEMyOC42ODYzIDI4IDI2IDI1LjMxMzcgMjYgMjJDMjYgMTguNjg2MyAyOC42ODYzIDE2IDMyIDE2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAuMjY4IDI2LjI2OCAzNCAzNCAzNEM0MS43MzIgMzQgNDggNDAuMjY4IDQ4IDQ4SDIwWiIgZmlsbD0iI0ZGNDQwMCIvPgo8L3N2Zz4K',
            baseStats: {
                strength: 3,
                agility: 10,
                intelligence: 20,
                spirit: 15,
                stamina: 8
            },
            rewards: {
                exp: 30,
                gold: 20
            }
        }
    },

    // 关卡配置
    stageConfig: {
        // 每关的敌人数量范围
        enemyCount: {
            min: 1,
            max: 5
        },
        // 根据关卡确定可能出现的怪物类型
        getAvailableMonsters: (stage) => {
            if (stage <= 10) {
                return ['skeleton', 'goblin'];
            } else if (stage <= 25) {
                return ['skeleton', 'goblin', 'orc', 'spider'];
            } else if (stage <= 50) {
                return ['orc', 'spider', 'troll'];
            } else {
                return ['troll', 'elemental'];
            }
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
        this.icon = monsterData.icon;
        this.image = monsterData.image;
        this.baseStats = { ...monsterData.baseStats };
        this.rewards = { ...monsterData.rewards };
        
        // 计算最终属性
        this.calculateStats();
        this.currentHP = this.maxHP;
        this.currentMP = this.maxMP;
        
        // 行动条相关
        this.isActing = false;
        this.actionProgress = 0;
        this.actionTime = 1000;
        this.actionType = null;
        
        // 生成唯一ID
        this.id = Date.now() + Math.random();
    }

    // 计算怪物属性
    calculateStats() {
        // 等级成长系数
        const levelMultiplier = 1 + (this.level - 1) * 0.15;
        // 关卡难度系数
        const stageMultiplier = 1 + (this.stage - 1) * 0.08;
        // 随机浮动 ±20%
        const randomMultiplier = 0.8 + Math.random() * 0.4;
        
        const totalMultiplier = levelMultiplier * stageMultiplier * randomMultiplier;
        
        // 计算5维属性
        this.strength = Math.max(1, Math.floor(this.baseStats.strength * totalMultiplier));
        this.agility = Math.max(1, Math.floor(this.baseStats.agility * totalMultiplier));
        this.intelligence = Math.max(1, Math.floor(this.baseStats.intelligence * totalMultiplier));
        this.spirit = Math.max(1, Math.floor(this.baseStats.spirit * totalMultiplier));
        this.stamina = Math.max(1, Math.floor(this.baseStats.stamina * totalMultiplier));
        
        // 根据5维属性计算战斗数值
        this.maxHP = this.stamina * 8 + this.strength * 2; // 耐力主要影响血量
        this.maxMP = this.intelligence * 6 + this.spirit * 4; // 智力和精神影响魔法值
        this.physicalAttack = this.strength * 2 + this.agility * 0.5; // 力量主要影响物理攻击
        this.magicalAttack = this.intelligence * 1.5 + this.spirit * 0.5; // 智力主要影响魔法攻击
        this.defense = this.stamina * 0.8 + this.strength * 0.3; // 耐力和力量影响防御
        this.magicResist = this.spirit * 0.8 + this.intelligence * 0.3; // 精神和智力影响魔抗
        this.hitRate = 90 + this.agility * 0.5; // 敏捷影响命中
        this.dodgeRate = this.agility * 0.8; // 敏捷影响闪避
        this.critRate = this.agility * 0.3; // 敏捷影响暴击
        this.attackSpeed = 1.0 + this.agility * 0.01; // 敏捷影响攻击速度
        
        // 确保数值合理
        this.maxHP = Math.floor(this.maxHP);
        this.maxMP = Math.floor(this.maxMP);
        this.physicalAttack = Math.floor(this.physicalAttack);
        this.magicalAttack = Math.floor(this.magicalAttack);
        this.defense = Math.floor(this.defense);
        this.magicResist = Math.floor(this.magicResist);
        this.hitRate = Math.min(100, Math.floor(this.hitRate));
        this.dodgeRate = Math.min(50, Math.floor(this.dodgeRate));
        this.critRate = Math.min(30, Math.floor(this.critRate));
        
        // 计算奖励
        this.expReward = Math.floor(this.rewards.exp * totalMultiplier);
        this.goldReward = Math.floor(this.rewards.gold * totalMultiplier);
    }

    // 受到伤害
    takeDamage(damage) {
        this.currentHP -= damage;
        if (this.currentHP < 0) this.currentHP = 0;
        return this.currentHP <= 0;
    }

    // 是否存活
    isAlive() {
        return this.currentHP > 0;
    }

    // 获取攻击力（随机选择物理或魔法攻击）
    getAttackPower() {
        return Math.random() < 0.7 ? this.physicalAttack : this.magicalAttack;
    }

    // 获取防御减伤
    getDefenseReduction() {
        return this.defense;
    }

    // 获取魔抗减伤
    getMagicResistReduction() {
        return this.magicResist;
    }

    // 获取掉落物品
    getDrops() {
        const drops = {
            exp: this.expReward,
            gold: this.goldReward,
            items: []
        };
        
        // 装备掉落概率
        const equipmentDropChance = 0.1 + (this.stage - 1) * 0.005; // 关卡越高概率越大
        if (Math.random() < equipmentDropChance) {
            drops.items.push(this.generateEquipmentDrop());
        }
        
        return drops;
    }

    // 生成装备掉落
    generateEquipmentDrop() {
        // 简单的装备掉落逻辑，实际可以更复杂
        const equipmentTypes = ['helmet', 'chest', 'pants', 'boots', 'gloves', 'lefthand', 'righthand'];
        const randomType = Utils.randomChoice(equipmentTypes);
        
        return {
            type: randomType,
            level: this.level,
            quality: this.getRandomQuality()
        };
    }

    // 获取随机品质
    getRandomQuality() {
        var rand = Math.random();
        if (rand < 0.6) return 'common';
        if (rand < 0.85) return 'magic';
        if (rand < 0.95) return 'rare';
        if (rand < 0.99) return 'epic';
        return 'legendary';
    }

    // 行动条相关方法
    startAction(actionType, actionTime) {
        this.isActing = true;
        this.actionType = actionType;
        this.actionTime = actionTime || this.getActionTime(actionType);
        this.actionProgress = 0;
    }

    cancelAction() {
        this.isActing = false;
        this.actionType = null;
        this.actionProgress = 0;
    }

    completeAction() {
        var actionType = this.actionType;
        this.isActing = false;
        this.actionType = null;
        this.actionProgress = 0;
        return actionType;
    }

    updateActionBar(deltaTime) {
        if (this.isActing && this.actionTime > 0) {
            this.actionProgress += deltaTime;
            
            if (this.actionProgress >= this.actionTime) {
                return this.completeAction();
            }
        }
        return null;
    }

    getActionTime(actionType) {
        var baseTime = 1000;
        
        switch (actionType) {
            case 'attack':
                return baseTime / (this.attackSpeed || 1.0);
            case 'cast':
            case 'skill':
                return baseTime * 1.5;
            default:
                return baseTime;
        }
    }

    canAct() {
        return this.isAlive() && !this.isActing;
    }

    // 更新怪物状态
    update(deltaTime) {
        return this.updateActionBar(deltaTime);
    }
}

// 生成关卡敌人
function generateStageEnemies(stage) {
    const enemies = [];
    const config = MONSTER_DATA.stageConfig;
    
    // 确定敌人数量
    const enemyCount = Utils.randomInt(config.enemyCount.min, config.enemyCount.max);
    
    // 获取可用的怪物类型
    const availableMonsters = config.getAvailableMonsters(stage);
    
    // 生成敌人
    for (let i = 0; i < enemyCount; i++) {
        const monsterType = Utils.randomChoice(availableMonsters);
        const level = Math.max(1, stage + Utils.randomInt(-2, 2)); // 等级在关卡±2范围内
        const enemy = new Monster(monsterType, level, stage);
        enemies.push(enemy);
    }
    
    return enemies;
}

// 获取怪物数据
function getMonsterData() {
    return MONSTER_DATA;
}

// 获取怪物类型
function getMonsterType(type) {
    return MONSTER_DATA.types[type];
} 