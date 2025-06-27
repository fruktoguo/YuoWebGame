// 装备界面UI类
class EquipmentUI {
    constructor(game) {
        this.game = game;
        this.selectedItem = null;
        this.sortBy = 'quality'; // 背包排序方式
        this.currentTab = 'equipment'; // 当前标签页
        
        this.initializeUI();
    }

    // 初始化UI
    initializeUI() {
        this.bindEvents();
        this.update();
    }

    // 绑定事件
    bindEvents() {
        // 装备槽点击事件和拖拽事件
        document.querySelectorAll('.equipment-slot').forEach(slot => {
            // 双击卸下装备
            slot.addEventListener('dblclick', (e) => {
                const slotName = slot.getAttribute('data-slot');
                this.onEquipmentSlotDoubleClick(slotName);
            });

            // 拖拽放置事件
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.onDragOver(e, slot);
            });

            slot.addEventListener('dragleave', (e) => {
                this.onDragLeave(e, slot);
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                this.onDrop(e, slot);
            });

            // 悬浮提示（已装备的装备）
            slot.addEventListener('mouseenter', (e) => {
                const slotName = slot.getAttribute('data-slot');
                const equippedItem = this.game.equipment.equipped[slotName];
                if (equippedItem) {
                    this.showTooltip(e, equippedItem);
                }
            });

            slot.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });

        // 背包标签页切换
        const self = this;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.getAttribute('data-tab');
                self.switchTab(tab);
            });
        });

        // 背包排序
        const sortSelect = document.getElementById('sort-select');
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
                slotElement.classList.add('equipped');
                slotElement.title = equippedItem.name;
            } else {
                slotElement.classList.remove('equipped');
                slotElement.title = '';
            }
        });
    }

    // 切换标签页
    switchTab(tab) {
        this.currentTab = tab;
        
        // 更新标签页样式
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // 更新背包内容
        this.updateInventory();
    }

    // 更新背包
    updateInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid) return;

        let items = [];
        
        if (this.currentTab === 'equipment') {
            // 显示装备
            items = this.game.equipment.inventory.filter(item => item && item.slot);
        } else if (this.currentTab === 'materials') {
            // 显示材料（暂时为空，后续可扩展）
            items = [];
        }

        // 排序物品
        items = this.sortItems(items);

        // 计算需要的行数（每行10个）
        const itemsPerRow = 10;
        const totalRows = Math.max(4, Math.ceil(items.length / itemsPerRow)); // 至少4行
        const totalSlots = totalRows * itemsPerRow;

        // 生成背包格子
        inventoryGrid.innerHTML = '';
        
        // 创建物品格子
        for (let i = 0; i < totalSlots; i++) {
            if (i < items.length) {
                const itemElement = this.createInventoryItem(items[i], i);
                inventoryGrid.appendChild(itemElement);
            } else {
                const emptyElement = this.createEmptySlot();
                inventoryGrid.appendChild(emptyElement);
            }
        }
    }

    // 排序物品
    sortItems(items) {
        return items.sort((a, b) => {
            switch (this.sortBy) {
                case 'quality':
                    const qualityOrder = { 'legendary': 5, 'epic': 4, 'rare': 3, 'magic': 2, 'common': 1 };
                    return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
                case 'level':
                    return (b.level || 0) - (a.level || 0);
                case 'type':
                    return (a.slot || '').localeCompare(b.slot || '');
                default:
                    return 0;
            }
        });
    }

    // 创建背包物品元素
    createInventoryItem(item, index) {
        const itemElement = document.createElement('div');
        itemElement.className = `inventory-item quality-${item.quality}`;
        itemElement.draggable = true;
        itemElement.dataset.itemIndex = index;
        
        itemElement.innerHTML = `
            <div class="item-icon">${this.getItemIcon(item)}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-level">Lv.${item.level}</div>
        `;

        // 悬浮提示
        itemElement.addEventListener('mouseenter', (e) => {
            this.showTooltip(e, item);
        });
        
        itemElement.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });

        // 双击事件
        itemElement.addEventListener('dblclick', () => {
            this.onItemDoubleClick(item, index);
        });

        // 拖拽事件
        itemElement.addEventListener('dragstart', (e) => {
            this.onDragStart(e, item, index);
        });

        itemElement.addEventListener('dragend', (e) => {
            this.onDragEnd(e);
        });

        return itemElement;
    }

    // 创建空格子
    createEmptySlot() {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'inventory-item empty';
        return emptyElement;
    }

    // 获取物品提示信息
    getItemTooltip(item) {
        let tooltip = `${item.name}\n${T('ui.level')}: ${item.level}\n${T('quality.' + item.quality)}`;
        
        if (item.stats) {
            tooltip += `\n${T('ui.stats')}:`;
            for (let [stat, value] of Object.entries(item.stats)) {
                tooltip += `\n${this.getStatDisplayName(stat)}: +${value}`;
            }
        }
        
        return tooltip;
    }

    // 获取品质名称
    getQualityName(quality) {
        return T('quality.' + quality);
    }

    // 物品双击事件
    onItemDoubleClick(item, index) {
        if (item.slot) {
            // 装备物品
            if (this.game.equipment.canEquip(item, item.slot)) {
                this.game.equipment.equipItem(item, item.slot);
                this.update();
            }
        }
    }

    // 装备槽双击事件（卸下装备）
    onEquipmentSlotDoubleClick(slotName) {
        const equippedItem = this.game.equipment.equipped[slotName];
        if (equippedItem) {
            this.game.equipment.unequipItem(slotName);
            this.update();
        }
    }

    // 拖拽开始
    onDragStart(e, item, index) {
        this.draggedItem = item;
        this.draggedIndex = index;
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            item: item,
            index: index,
            type: 'inventory'
        }));
        e.target.classList.add('dragging');
    }

    // 拖拽结束
    onDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedItem = null;
        this.draggedIndex = null;
    }

    // 拖拽悬停
    onDragOver(e, slot) {
        // 在dragover事件中，dataTransfer.getData可能无法获取数据
        // 我们使用一个临时存储来记录拖拽的物品
        if (!this.draggedItem) return;

        const slotName = slot.getAttribute('data-slot');

        // 检查是否可以装备到这个槽位
        if (this.draggedItem.slot === slotName) {
            slot.classList.add('drag-over');
            slot.classList.remove('drag-invalid');
        } else {
            slot.classList.add('drag-invalid');
            slot.classList.remove('drag-over');
        }
    }

    // 拖拽离开
    onDragLeave(e, slot) {
        slot.classList.remove('drag-over', 'drag-invalid');
    }

    // 拖拽放置
    onDrop(e, slot) {
        slot.classList.remove('drag-over', 'drag-invalid');
        
        if (!this.draggedItem) return;

        const slotName = slot.getAttribute('data-slot');

        // 检查是否可以装备到这个槽位
        if (this.draggedItem.slot === slotName && this.game.equipment.canEquip(this.draggedItem, slotName)) {
            this.game.equipment.equipItem(this.draggedItem, slotName);
            this.update();
        }
    }

    // 显示悬浮提示
    showTooltip(e, item) {
        this.hideTooltip(); // 先隐藏之前的提示

        const tooltip = document.createElement('div');
        tooltip.className = 'equipment-tooltip';
        tooltip.id = 'equipment-tooltip';
        
        let tooltipHTML = `
            <div class="tooltip-title quality-${item.quality}">${item.name}</div>
            <div class="tooltip-level">${T('ui.level')}: ${item.level}</div>
            <div class="tooltip-quality">${T('quality.' + item.quality)}</div>
            <div class="tooltip-slot">${T('ui.slot')}: ${this.getSlotDisplayName(item.slot)}</div>
        `;
        
        if (item.stats) {
            tooltipHTML += `<div class="tooltip-stats">${T('ui.stats')}:</div>`;
            for (let [stat, value] of Object.entries(item.stats)) {
                tooltipHTML += `<div class="tooltip-stat">+${value} ${this.getStatDisplayName(stat)}</div>`;
            }
        }
        
        tooltip.innerHTML = tooltipHTML;
        document.body.appendChild(tooltip);

        // 定位提示框
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = (rect.right + 10) + 'px';
        tooltip.style.top = rect.top + 'px';

        // 确保提示框不会超出屏幕
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = (rect.left - tooltipRect.width - 10) + 'px';
        }
        if (tooltipRect.bottom > window.innerHeight) {
            tooltip.style.top = (window.innerHeight - tooltipRect.height - 10) + 'px';
        }
    }

    // 隐藏悬浮提示
    hideTooltip() {
        const tooltip = document.getElementById('equipment-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // 更新装备统计
    updateEquipmentStats() {
        const statsElement = document.getElementById('equipment-stats');
        if (!statsElement) return;

        const totalScore = this.game.equipment.getTotalEquipmentScore();
        const equipmentBonus = this.game.character.equipmentBonus;

        let statsHTML = `
            <div class="stat-header">${T('ui.equipmentBonus')}</div>
            <div class="stat-item">
                <span class="stat-label">${T('ui.equipmentScore')}</span>
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

    // 获取物品图标
    getItemIcon(item) {
        if (item.icon) return item.icon;
        
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
        // 尝试从GameTexts获取属性名称
        const statKey = 'stat.' + stat;
        const text = T(statKey);
        
        // 如果GameTexts中没有对应的键，返回原始名称
        if (text === statKey) {
            // 备用映射表
        const names = {
                physicalAttack: T('stat.physicalAttack'),
                magicalAttack: T('stat.magicalAttack'),
                health: T('stat.health'),
                defense: T('stat.defense'),
                magicResist: T('stat.magicResist'),
                critRate: T('stat.critRate'),
                critDamage: T('stat.critDamage'),
                hitRate: T('stat.hitRate'),
                dodgeRate: T('stat.dodgeRate'),
                skillCooldown: T('stat.skillCooldown'),
                strength: T('attr.strength'),
                agility: T('attr.agility'),
                intelligence: T('attr.intelligence'),
                spirit: T('attr.spirit'),
                stamina: T('attr.stamina')
        };
        return names[stat] || stat;
        }
        
        return text;
    }

    // 获取槽位显示名称
    getSlotDisplayName(slot) {
        // 尝试获取完整名称
        const fullKey = 'slot.' + slot + '.full';
        const fullText = T(fullKey);
        
        if (fullText !== fullKey) {
            return fullText;
        }
        
        // 获取普通名称
        return T('slot.' + slot);
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