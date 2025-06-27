// 装备系统核心类
class Equipment {
    constructor(game) {
        this.game = game;
        this.equipped = {}; // 已装备的物品
        this.inventory = []; // 背包物品
        this.maxInventorySize = 50;
        
        // 装备槽位定义
        this.slots = [
            'helmet', 'necklace', 'shoulder', 'lefthand', 'chest', 'righthand',
            'gloves', 'belt', 'pants', 'ring1', 'ring2', 'boots', 'cloak', 'earring'
        ];
        
        // 初始化装备槽
        this.initializeSlots();
    }

    // 初始化装备槽
    initializeSlots() {
        this.slots.forEach(slot => {
            this.equipped[slot] = null;
        });
    }

    // 装备物品
    equipItem(item, slot) {
        if (!this.canEquip(item, slot)) {
            return false;
        }

        // 卸下当前装备
        const oldItem = this.equipped[slot];
        if (oldItem) {
            this.addToInventory(oldItem);
        }

        // 装备新物品
        this.equipped[slot] = item;
        this.removeFromInventory(item);
        
        // 更新角色属性
        this.updateCharacterStats();
        
        // 更新所有相关UI
        if (this.game.ui.equipment) {
            this.game.ui.equipment.update();
        }
        if (this.game.ui.character) {
            this.game.ui.character.update();
        }
        
        Utils.showNotification(`装备了 ${item.name}`, 'success');
        return true;
    }

    // 卸下装备
    unequipItem(slot) {
        const item = this.equipped[slot];
        if (!item) return false;

        if (!this.hasInventorySpace()) {
            Utils.showNotification('背包已满', 'error');
            return false;
        }

        this.equipped[slot] = null;
        this.addToInventory(item);
        this.updateCharacterStats();
        
        // 更新所有相关UI
        if (this.game.ui.equipment) {
            this.game.ui.equipment.update();
        }
        if (this.game.ui.character) {
            this.game.ui.character.update();
        }
        
        Utils.showNotification(`卸下了 ${item.name}`, 'info');
        return true;
    }

    // 检查是否可以装备
    canEquip(item, slot) {
        if (!item || !slot) return false;
        if (!this.slots.includes(slot)) return false;
        if (item.slot !== slot) return false;
        
        // 检查职业限制
        if (item.classRestriction && item.classRestriction !== this.game.character.class) {
            Utils.showNotification('职业不符合要求', 'error');
            return false;
        }
        
        // 检查等级要求
        if (item.levelRequirement > this.game.character.level) {
            Utils.showNotification('等级不足', 'error');
            return false;
        }
        
        return true;
    }

    // 添加到背包
    addToInventory(item) {
        if (this.inventory.length >= this.maxInventorySize) {
            Utils.showNotification('背包已满', 'error');
            return false;
        }
        
        this.inventory.push(item);
        return true;
    }

    // 从背包移除
    removeFromInventory(item) {
        const index = this.inventory.indexOf(item);
        if (index !== -1) {
            this.inventory.splice(index, 1);
            return true;
        }
        return false;
    }

    // 检查背包空间
    hasInventorySpace() {
        return this.inventory.length < this.maxInventorySize;
    }

    // 更新角色属性
    updateCharacterStats() {
        const equipmentBonus = {};
        
        // 计算所有装备的属性加成
        for (let slot of this.slots) {
            const item = this.equipped[slot];
            if (item && item.stats) {
                for (let [stat, value] of Object.entries(item.stats)) {
                    equipmentBonus[stat] = (equipmentBonus[stat] || 0) + value;
                }
            }
        }
        
        // 更新角色的装备加成
        this.game.character.updateEquipmentBonus(equipmentBonus);
    }

    // 获取装备总评分
    getTotalEquipmentScore() {
        let totalScore = 0;
        for (let slot of this.slots) {
            const item = this.equipped[slot];
            if (item) {
                totalScore += this.calculateItemScore(item);
            }
        }
        return totalScore;
    }

    // 计算单个装备评分
    calculateItemScore(item) {
        if (!item || !item.stats) return 0;
        
        return Calculator.calculateEquipmentScore(item);
    }

    // 生成随机装备
    generateRandomEquipment(level, slot, quality = null) {
        // 如果没有指定品质，随机生成
        if (!quality) {
            quality = this.rollEquipmentQuality();
        }
        
        const item = {
            id: Utils.generateId(),
            name: this.generateEquipmentName(slot, quality),
            slot: slot,
            level: level,
            quality: quality,
            stats: {},
            levelRequirement: Math.max(1, level - 2)
        };
        
        // 生成属性
        this.generateEquipmentStats(item);
        
        return item;
    }

    // 随机品质
    rollEquipmentQuality() {
        const rand = Math.random();
        if (rand < 0.5) return 'common';      // 50% 普通
        if (rand < 0.75) return 'magic';      // 25% 魔法
        if (rand < 0.9) return 'rare';        // 15% 稀有
        if (rand < 0.98) return 'epic';       // 8% 史诗
        return 'legendary';                    // 2% 传说
    }

    // 生成装备名称
    generateEquipmentName(slot, quality) {
        const qualityNames = {
            common: '普通的',
            magic: '魔法',
            rare: '稀有的',
            epic: '史诗',
            legendary: '传说'
        };
        
        const slotNames = {
            helmet: '头盔',
            chest: '胸甲',
            pants: '护腿',
            boots: '靴子',
            gloves: '手套',
            lefthand: '武器',
            righthand: '武器',
            necklace: '项链',
            ring1: '戒指',
            ring2: '戒指',
            belt: '腰带',
            shoulder: '肩甲',
            cloak: '斗篷',
            earring: '耳环'
        };
        
        return `${qualityNames[quality]}${slotNames[slot]}`;
    }

    // 生成装备属性
    generateEquipmentStats(item) {
        const statPool = this.getStatPoolForSlot(item.slot);
        const qualityMultiplier = this.getQualityMultiplier(item.quality);
        const statCount = this.getStatCountForQuality(item.quality);
        
        // 随机选择属性
        const selectedStats = Utils.getRandomElements(statPool, statCount);
        
        selectedStats.forEach(stat => {
            const baseValue = this.getBaseStatValue(stat, item.level);
            const finalValue = Math.floor(baseValue * qualityMultiplier * (0.8 + Math.random() * 0.4));
            item.stats[stat] = finalValue;
        });
    }

    // 获取槽位可用属性池
    getStatPoolForSlot(slot) {
        const weaponStats = ['physicalAttack', 'magicalAttack', 'critRate', 'critDamage'];
        const armorStats = ['health', 'defense', 'magicResist'];
        const accessoryStats = ['physicalAttack', 'magicalAttack', 'health', 'critRate', 'critDamage', 'hitRate', 'dodgeRate'];
        const attributeStats = ['strength', 'agility', 'intelligence', 'spirit', 'stamina'];
        
        let baseStats = [];
        if (['lefthand', 'righthand'].includes(slot)) {
            baseStats = weaponStats;
        } else if (['helmet', 'chest', 'pants', 'boots', 'gloves', 'shoulder', 'cloak'].includes(slot)) {
            baseStats = [...armorStats, ...accessoryStats];
        } else {
            baseStats = accessoryStats;
        }
        
        // 所有装备都可能随机获得五维属性
        return [...baseStats, ...attributeStats];
    }

    // 获取品质倍数
    getQualityMultiplier(quality) {
        const multipliers = {
            common: 1.0,
            magic: 1.3,
            rare: 1.7,
            epic: 2.2,
            legendary: 3.0
        };
        return multipliers[quality] || 1.0;
    }

    // 获取品质对应的属性数量
    getStatCountForQuality(quality) {
        const counts = {
            common: 1,
            magic: 2,
            rare: 3,
            epic: 4,
            legendary: 5
        };
        return counts[quality] || 1;
    }

    // 获取属性基础值
    getBaseStatValue(stat, level) {
        const baseValues = {
            physicalAttack: 5 + level * 2,
            magicalAttack: 5 + level * 2,
            health: 20 + level * 5,
            defense: 2 + level * 1,
            magicResist: 2 + level * 1,
            critRate: 5 + level * 0.5,
            critDamage: 10 + level * 1,
            hitRate: 5 + level * 0.5,
            dodgeRate: 5 + level * 0.5,
            skillCooldown: level * 0.5,
            // 五维属性
            strength: 1 + level * 0.3,
            agility: 1 + level * 0.3,
            intelligence: 1 + level * 0.3,
            spirit: 1 + level * 0.3,
            stamina: 1 + level * 0.3
        };
        return baseValues[stat] || level;
    }

    // 出售装备
    sellItem(item) {
        const sellPrice = this.calculateSellPrice(item);
        this.removeFromInventory(item);
        this.game.addGold(sellPrice);
        Utils.showNotification(`出售 ${item.name}，获得 ${sellPrice} 金币`, 'success');
    }

    // 计算出售价格
    calculateSellPrice(item) {
        const basePrice = item.level * 10;
        const qualityMultiplier = this.getQualityMultiplier(item.quality);
        return Math.floor(basePrice * qualityMultiplier);
    }

    // 获取装备数据
    getEquipmentData() {
        return {
            equipped: this.equipped,
            inventory: this.inventory
        };
    }

    // 加载装备数据
    loadEquipmentData(data) {
        if (data.equipped) this.equipped = data.equipped;
        if (data.inventory) this.inventory = data.inventory;
        this.updateCharacterStats();
    }

    // 重置装备系统
    reset() {
        // 清空所有装备槽
        this.initializeSlots();
        
        // 清空背包
        this.inventory = [];
        
        // 更新角色属性
        this.updateCharacterStats();
        
        console.log('装备系统已重置');
    }
} 