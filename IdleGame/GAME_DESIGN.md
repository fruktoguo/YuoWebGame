# 放置挂机战斗游戏 - AI开发设计文档

## 项目概述
一个基于Web的放置挂机战斗游戏，玩家通过自动战斗、装备收集、角色成长来推进游戏进度。
- **技术栈**: 纯前端JavaScript (ES6+), HTML5, CSS3
- **部署方式**: 通过SFTP实时更新到 http://yuohira.com/IdleGame/,不要本地运行
- **数据存储**: localStorage本地存储
- **架构模式**: 模块化组件系统

## AI开发指导原则

### 1. 代码组织原则
- **单一职责**: 每个类只负责一个核心功能
- **数据驱动**: 所有游戏配置通过JSON数据文件管理
- **事件驱动**: 使用观察者模式处理系统间通信
- **状态管理**: 集中式状态管理，便于存档和同步

### 2. 开发优先级
```
第一优先级: 核心战斗循环 (自动战斗、伤害计算、升级)
第二优先级: 装备系统 (随机生成、装备穿戴、属性加成)
第三优先级: 技能系统 (技能树、自动释放、职业差异)
第四优先级: UI优化和数据平衡
```

### 3. 性能要求
- 游戏循环: 100ms (10 FPS)
- UI更新: 节流更新，避免频繁DOM操作
- 数据计算: 缓存计算结果，避免重复计算
- 存档频率: 30秒自动存档

## 核心系统架构

### 1. 系统依赖关系
```
Game (主控制器)
├── Character (角色系统)
├── Combat (战斗系统) 
├── Equipment (装备系统)
├── Skills (技能系统)
└── UI Controllers
    ├── CharacterUI
    ├── CombatUI  
    ├── EquipmentUI
    └── SkillUI
```

### 2. 数据流架构
```
用户操作 → UI事件 → Game控制器 → 核心系统 → 数据更新 → UI刷新
```

## 详细系统设计

### 1. 角色属性系统

#### 1.1 数据结构定义
```javascript
// Character类核心属性
class Character {
    constructor(name, characterClass) {
        this.name = string;           // 角色名称
        this.class = string;          // 职业类型
        this.level = number;          // 当前等级
        this.exp = number;            // 当前经验值
        this.freePoints = number;     // 自由属性点
        
        // 基础属性 (可分配点数影响)
        this.baseStats = {
            physicalAttack: number,   // 物理攻击力
            magicalAttack: number,    // 魔法攻击力  
            health: number,           // 生命值上限
            defense: number,          // 物理防御
            magicResist: number,      // 魔法抗性
            critRate: number,         // 暴击率
            critDamage: number,       // 暴击伤害
            hitRate: number,          // 命中率
            dodgeRate: number,        // 闪避率
            skillCooldown: number     // 技能冷却减少
        };
        
        // 当前状态
        this.currentHP = number;      // 当前生命值
        this.currentMP = number;      // 当前法力值
        
        // 加成属性
        this.equipmentBonus = {};     // 装备加成
        this.skillBonus = {};         // 技能加成
        this.buffs = [];              // 临时增益效果
    }
}
```

#### 1.2 属性计算公式
```javascript
// 最终属性 = 基础属性 + 等级成长 + 装备加成 + 技能加成 + Buff加成
finalStat = baseStat + levelGrowth + equipmentBonus + skillBonus + buffBonus;

// 百分比属性计算 (用于防御、暴击率等)
percentage = value / (value + baseValue);
// baseValue根据游戏进度动态调整
```

#### 1.3 关键方法接口
```javascript
// 必须实现的方法
calculateFinalStats()           // 重新计算所有最终属性
gainExp(amount)                 // 获得经验值，自动处理升级
allocatePoint(statName)         // 分配自由属性点
takeDamage(damage)              // 受到伤害，返回是否死亡
addBuff(buff)                   // 添加临时增益效果
updateBuffs()                   // 更新Buff状态，移除过期效果
```

### 2. 战斗系统

#### 2.1 数据结构定义
```javascript
class Combat {
    constructor(game) {
        this.game = game;
        this.currentEnemy = null;     // 当前敌人
        this.battleState = 'idle';    // 'idle', 'fighting', 'victory', 'defeat'
        this.lastAttackTime = 0;      // 上次攻击时间
        this.attackInterval = 1000;   // 攻击间隔(ms)
        this.battleLog = [];          // 战斗日志
        this.autoSkills = [];         // 自动释放技能列表
    }
}

// 敌人数据结构
class Enemy {
    constructor(data) {
        this.name = string;
        this.level = number;
        this.maxHP = number;
        this.currentHP = number;
        this.stats = {
            physicalAttack: number,
            magicalAttack: number,
            defense: number,
            magicResist: number,
            // ... 其他属性
        };
        this.rewards = {
            exp: number,
            gold: number,
            dropTable: []             // 掉落表
        };
    }
}
```

#### 2.2 伤害计算公式
```javascript
// 基础伤害计算
function calculateDamage(attacker, defender, skill) {
    // 1. 获取基础攻击力
    let baseDamage = skill.isPhysical ? 
        attacker.physicalAttack : attacker.magicalAttack;
    
    // 2. 技能倍率
    baseDamage *= (skill.damageMultiplier || 1.0);
    
    // 3. 防御减伤
    let defense = skill.isPhysical ? 
        defender.defense : defender.magicResist;
    let defenseReduction = defense / (defense + getDefenseBase());
    
    // 4. 应用减伤
    let damage = baseDamage * (1 - defenseReduction);
    
    // 5. 暴击计算
    let critChance = attacker.critRate / (attacker.critRate + getCritBase());
    if (Math.random() < critChance) {
        damage *= (1 + attacker.critDamage / 100);
    }
    
    // 6. 命中检测
    let hitChance = (attacker.hitRate + 100) / 
        (attacker.hitRate + 100 + defender.dodgeRate);
    if (Math.random() > hitChance) {
        damage = 0; // 未命中
    }
    
    return Math.max(1, Math.floor(damage));
}
```

#### 2.3 战斗流程
```javascript
// 战斗更新循环
update(deltaTime) {
    if (this.battleState !== 'fighting') return;
    
    // 1. 检查攻击间隔
    if (Date.now() - this.lastAttackTime >= this.attackInterval) {
        // 2. 玩家攻击
        this.playerAttack();
        
        // 3. 敌人攻击 (如果存活)
        if (this.currentEnemy.isAlive()) {
            this.enemyAttack();
        }
        
        // 4. 检查战斗结果
        this.checkBattleResult();
        
        this.lastAttackTime = Date.now();
    }
    
    // 5. 更新自动技能
    this.updateAutoSkills(deltaTime);
}
```

### 3. 装备系统

#### 3.1 装备数据结构
```javascript
class Equipment {
    constructor(data) {
        this.id = string;             // 唯一标识
        this.slot = string;           // 装备部位
        this.level = number;          // 装备等级
        this.quality = string;        // 品质: 'common', 'magic', 'rare', 'epic', 'legendary'
        this.stats = {};              // 属性加成
        this.requirements = {         // 装备需求
            level: number,
            class: string[]
        };
    }
}

// 装备部位定义
const EQUIPMENT_SLOTS = {
    'helmet': '头盔',     'necklace': '项链',   'shoulder': '肩甲',
    'lefthand': '左手',   'chest': '胸甲',      'righthand': '右手', 
    'gloves': '手套',     'belt': '腰带',       'ring1': '戒指1',
    'pants': '护腿',      'ring2': '戒指2',     'boots': '靴子',
    'earring': '耳环'
};
```

#### 3.2 装备生成算法
```javascript
// 随机装备生成
function generateRandomEquipment(level, slot) {
    // 1. 确定品质
    let quality = rollQuality(level);
    
    // 2. 确定基础属性数量
    let statCount = getStatCountByQuality(quality);
    
    // 3. 随机选择属性
    let availableStats = getAvailableStatsForSlot(slot);
    let selectedStats = Utils.randomSelect(availableStats, statCount);
    
    // 4. 计算属性数值
    let stats = {};
    selectedStats.forEach(stat => {
        let range = getStatRange(stat, level, quality);
        stats[stat] = Utils.randomBetween(range.min, range.max);
    });
    
    return new Equipment({
        slot: slot,
        level: level,
        quality: quality,
        stats: stats
    });
}
```

#### 3.3 装备评估系统
```javascript
// 装备价值评估
function calculateEquipmentValue(equipment) {
    let totalValue = 0;
    
    for (let [stat, value] of Object.entries(equipment.stats)) {
        let weight = STAT_WEIGHTS[stat] || 1.0;
        totalValue += value * weight;
    }
    
    // 品质加成
    totalValue *= QUALITY_MULTIPLIERS[equipment.quality];
    
    return totalValue;
}
```

### 4. 技能系统

#### 4.1 技能数据结构
```javascript
class Skill {
    constructor(data) {
        this.id = string;             // 技能ID
        this.name = string;           // 技能名称
        this.type = string;           // 'passive', 'active', 'aura'
        this.class = string;          // 所属职业
        this.maxLevel = number;       // 最大等级
        this.currentLevel = 0;        // 当前等级
        this.requirements = {         // 学习需求
            level: number,
            skills: []                // 前置技能
        };
        
        // 技能效果 (根据等级缩放)
        this.effects = {
            damage: number,           // 伤害倍率
            cooldown: number,         // 冷却时间
            manaCost: number,         // 法力消耗
            stats: {},               // 属性加成
            buffs: []                // 附加效果
        };
        
        // 自动释放设置
        this.autocast = {
            enabled: false,
            priority: 0,
            conditions: []            // 释放条件
        };
    }
}
```

#### 4.2 技能树结构
```javascript
// 职业技能树定义
const SKILL_TREES = {
    warrior: {
        'power_strike': {          // 强力攻击
            type: 'active',
            effects: { damage: 1.5, cooldown: 3000 }
        },
        'tough_skin': {            // 坚韧皮肤
            type: 'passive', 
            effects: { stats: { defense: 10 } }
        },
        'battle_cry': {            // 战吼
            type: 'aura',
            effects: { stats: { physicalAttack: 20 } }
        }
    },
    // ... 其他职业
};
```

### 5. UI系统架构

#### 5.1 UI组件结构
```javascript
// UI基类
class BaseUI {
    constructor(game) {
        this.game = game;
        this.element = null;
        this.isVisible = false;
    }
    
    // 必须实现的方法
    init() {}                     // 初始化UI元素
    update() {}                   // 更新显示数据
    show() {}                     // 显示UI
    hide() {}                     // 隐藏UI
    destroy() {}                  // 销毁UI
}
```

#### 5.2 页面布局定义
```html
<!-- 主界面结构 -->
<div class="game-container">
    <!-- 左侧导航 (固定宽度) -->
    <nav class="sidebar">
        <div class="nav-item" data-page="character">👤 角色</div>
        <div class="nav-item" data-page="equipment">🛡️ 背包</div>
        <div class="nav-item" data-page="skills">⚡ 技能</div>
    </nav>
    
    <!-- 主内容区 -->
    <main class="main-content">
        <!-- 资源栏 -->
        <div class="resource-bar">
            <span id="gold">💰 0</span>
            <span id="gems">💎 0</span>
        </div>
        
        <!-- 左右分栏 (各占50%) -->
        <div class="game-layout">
            <div class="left-panel"><!-- 功能页面 --></div>
            <div class="right-panel"><!-- 战斗页面 --></div>
        </div>
    </main>
</div>
```

### 6. 数据配置系统

#### 6.1 配置文件结构
```javascript
// js/data/classes.js - 职业配置
const CLASS_DATA = {
    warrior: {
        name: '战士',
        baseStats: {
            physicalAttack: 15,
            magicalAttack: 5,
            health: 120,
            defense: 10,
            magicResist: 5
        },
        statGrowth: {
            physicalAttack: 2,
            health: 8,
            defense: 1
        }
    }
    // ... 其他职业
};

// js/data/monsters.js - 怪物配置  
const MONSTER_DATA = {
    skeleton_warrior: {
        name: '骷髅战士',
        baseLevel: 1,
        stats: {
            physicalAttack: 12,
            health: 80,
            defense: 8
        },
        rewards: {
            exp: 10,
            gold: 5
        }
    }
    // ... 其他怪物
};
```

#### 6.2 平衡性参数
```javascript
// js/utils/Calculator.js - 平衡参数
const BALANCE_CONFIG = {
    // 属性基准值 (用于百分比计算)
    defenseBase: 100,
    critBase: 100,
    hitBase: 100,
    
    // 经验需求公式
    expFormula: (level) => Math.floor(100 * Math.pow(1.2, level - 1)),
    
    // 装备品质概率
    qualityRates: {
        common: 0.5,
        magic: 0.3, 
        rare: 0.15,
        epic: 0.04,
        legendary: 0.01
    },
    
    // 属性权重 (用于装备评估)
    statWeights: {
        physicalAttack: 1.0,
        magicalAttack: 1.0,
        health: 0.1,
        defense: 0.8,
        critRate: 1.2
    }
};
```

## 开发实现指南

### 1. 开发步骤
```
步骤1: 完善Character类的属性计算和升级逻辑
步骤2: 实现Combat类的自动战斗循环
步骤3: 完善Equipment类的随机生成和装备系统
步骤4: 实现Skills类的技能树和自动释放
步骤5: 优化UI响应和数据显示
步骤6: 添加存档系统和离线计算
步骤7: 数据平衡和性能优化
```

### 2. 调试和测试
```javascript
// 开发者控制台命令
window.game.character.gainExp(1000);        // 获得经验
window.game.character.freePoints = 10;      // 获得属性点
window.game.game.addGold(10000);                 // 获得金币
window.game.equipment.generateRandomEquipment(10, 'weapon'); // 生成装备
```

### 3. 性能优化要点
- **避免频繁DOM操作**: 使用DocumentFragment批量更新
- **计算结果缓存**: 缓存复杂的属性计算结果
- **事件节流**: UI更新使用requestAnimationFrame
- **内存管理**: 及时清理不用的对象引用

### 4. 错误处理
```javascript
// 统一错误处理
class GameError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.timestamp = Date.now();
    }
}

// 关键操作都要包装try-catch
try {
    this.character.levelUp();
} catch (error) {
    console.error('升级失败:', error);
    Utils.showNotification('升级失败', 'error');
}
```

## 扩展开发方向

### 1. 短期目标 (1-2周)
- 完善战斗循环和伤害计算
- 实现装备随机生成和穿戴
- 添加基础技能系统

### 2. 中期目标 (1个月)  
- 多职业平衡调整
- 复杂技能效果和组合
- 离线挂机收益系统

### 3. 长期目标 (2-3个月)
- 成就系统和里程碑
- 多角色队伍系统
- 公会和社交功能

## 注意事项

### 1. 代码规范
- 使用ES6+语法，避免var声明
- 类名使用PascalCase，方法名使用camelCase
- 常量使用UPPER_SNAKE_CASE
- 添加必要的注释，特别是复杂算法

### 2. 兼容性
- 目标浏览器: Chrome 70+, Firefox 65+, Safari 12+
- 移动端适配: 响应式设计，触摸友好
- 存档兼容: 版本升级时保持存档兼容性

### 3. 安全考虑
- 客户端验证: 所有用户输入都要验证
- 数据完整性: 存档数据要校验合法性
- 防作弊: 关键数值计算要有合理性检查

---

*本文档将随着开发进度持续更新和完善* 