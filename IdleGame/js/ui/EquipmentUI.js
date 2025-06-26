// 装备界面UI类
class EquipmentUI {
    constructor(game) {
        this.game = game;
        this.selectedItem = null;
        this.sortBy = 'level'; // 背包排序方式
        
        this.initializeUI();
    }

    // 初始化UI
    initializeUI() {
        this.bindEvents();
        this.update();
    }

    // 绑定事件
    bindEvents() {
        // 装备槽点击事件
        document.querySelectorAll('.equipment-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotName = slot.getAttribute('data-slot');
                this.onEquipmentSlotClick(slotName);
            });
        });

        // 背包排序
        const sortSelect = document.getElementById('inventory-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.updateInventory();
            });
        }

        // 装备详情关闭按钮
        const detailClose = document.getElementById('equipment-detail-close');
        if (detailClose) {
            detailClose.addEventListener('click', () => {
                this.hideEquipmentDetail();
            });
        }
    }

    // 更新装备界面
    update() {
        this.updateEquipmentSlots();
        this.updateInventory();
        this.updateEquipmentStats();
    }

    // 更新装备槽
    updateEquipmentSlots() {
        const equipment = this.game.equipment;
        
        equipment.slots.forEach(slotName => {
            const slotElement = document.querySelector(`[data-slot="${slotName}"]`);
            if (!slotElement) return;

            const equippedItem = equipment.equipped[slotName];
            
            if (equippedItem) {
                slotElement.classList.add('has-item');
                slotElement.title = equippedItem.name;
            } else {
                slotElement.classList.remove('has-item');
                slotElement.title = '';
            }
        });
    }

    // 更新背包
    updateInventory() {
        // 简化的背包更新
        console.log('背包物品数量:', this.game.equipment.inventory.length);
    }

    // 更新装备统计
    updateEquipmentStats() {
        const statsElement = document.getElementById('equipment-stats');
        if (!statsElement) return;

        const totalScore = this.game.equipment.getTotalEquipmentScore();
        const equipmentBonus = this.game.character.equipmentBonus;

        let statsHTML = `
            <div class="stat-header">装备加成</div>
            <div class="stat-item">
                <span class="stat-label">装备评分</span>
                <span class="stat-value">${totalScore}</span>
            </div>
        `;

        // 显示装备属性加成
        for (let [stat, value] of Object.entries(equipmentBonus)) {
            if (value > 0) {
                const statName = this.getStatDisplayName(stat);
                statsHTML += `
                    <div class="stat-item">
                        <span class="stat-label">${statName}</span>
                        <span class="stat-value">+${value}</span>
                    </div>
                `;
            }
        }

        statsElement.innerHTML = statsHTML;
    }

    // 装备槽点击事件
    onEquipmentSlotClick(slotName) {
        const equippedItem = this.game.equipment.equipped[slotName];
        
        if (equippedItem) {
            if (confirm(`卸下 ${equippedItem.name}？`)) {
                this.game.equipment.unequipItem(slotName);
                this.update();
            }
        }
    }

    // 获取物品图标
    getItemIcon(item) {
        const icons = {
            helmet: '🪖', chest: '👕', pants: '👖', boots: '👢',
            gloves: '🧤', lefthand: '⚔️', righthand: '🗡️',
            necklace: '📿', ring1: '💍', ring2: '💍',
            belt: '🔗', shoulder: '🛡️', cloak: '🧥', earring: '💎'
        };
        return icons[item.slot] || '📦';
    }

    // 获取属性显示名称
    getStatDisplayName(stat) {
        const names = {
            physicalAttack: '物理攻击',
            magicalAttack: '魔法攻击',
            health: '生命值',
            defense: '防御值',
            magicResist: '魔法抗性',
            critRate: '暴击率',
            critDamage: '暴击伤害',
            hitRate: '命中率',
            dodgeRate: '闪避率',
            skillCooldown: '技能冷却'
        };
        return names[stat] || stat;
    }

    // 获取槽位显示名称
    getSlotDisplayName(slot) {
        const names = {
            helmet: '头盔',
            chest: '胸甲',
            pants: '护腿',
            boots: '靴子',
            gloves: '手套',
            lefthand: '左手武器',
            righthand: '右手武器',
            necklace: '项链',
            ring1: '戒指',
            ring2: '戒指',
            belt: '腰带',
            shoulder: '肩甲',
            cloak: '斗篷',
            earring: '耳环'
        };
        return names[slot] || slot;
    }

    // 隐藏装备详情
    hideEquipmentDetail() {
        const detailElement = document.getElementById('equipment-detail');
        if (detailElement) {
            detailElement.style.display = 'none';
        }
    }
}

// 全局变量，供HTML调用
let equipmentUI = null; 