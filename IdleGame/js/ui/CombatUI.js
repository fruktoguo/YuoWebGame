// 战斗界面UI类
class CombatUI {
    constructor(game) {
        this.game = game;
        this.maxLogEntries = 50;
        this.initializeUI();
    }

    initializeUI() {
        this.bindEvents();
        this.update();
    }

    bindEvents() {
        // 绑定技能栏点击事件
        this.bindSkillSlotEvents();
    }

    bindSkillSlotEvents() {
        const skillSlots = document.querySelectorAll('.skill-slot-large');
        skillSlots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.toggleSkillDropdown(index);
            });
        });
    }

    toggleSkillDropdown(slotIndex) {
        const skillSlots = document.querySelectorAll('.skill-slot-large');
        const targetSlot = skillSlots[slotIndex];
        if (!targetSlot) return;

        const dropdown = targetSlot.querySelector('.skill-dropdown');
        if (!dropdown) return;

        // 关闭其他下拉菜单
        skillSlots.forEach((slot, index) => {
            if (index !== slotIndex) {
                const otherDropdown = slot.querySelector('.skill-dropdown');
                if (otherDropdown) {
                    otherDropdown.classList.add('hidden');
                }
            }
        });

        // 切换当前下拉菜单
        dropdown.classList.toggle('hidden');

        // 如果打开了下拉菜单，填充技能选项
        if (!dropdown.classList.contains('hidden')) {
            this.populateSkillDropdown(dropdown, slotIndex);
        }
    }

    populateSkillDropdown(dropdown, slotIndex) {
        const select = dropdown.querySelector('.skill-select');
        if (!select) return;

        // 清空现有选项
        select.innerHTML = '<option value="">选择技能</option>';

        // 获取可用技能
        const character = this.game.character;
        if (!character) return;

        const availableSkills = this.getAvailableSkills();
        availableSkills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill.id;
            option.textContent = skill.name;
            select.appendChild(option);
        });

        // 绑定选择事件
        select.onchange = (e) => {
            const skillId = e.target.value;
            if (skillId) {
                this.assignSkillToSlot(slotIndex, skillId);
            }
            dropdown.classList.add('hidden');
        };
    }

    getAvailableSkills() {
        // 返回角色已学习的技能
        const character = this.game.character;
        if (!character || !this.game.skills) return [];

        return this.game.skills.getLearnedSkills(character.class);
    }

    assignSkillToSlot(slotIndex, skillId) {
        // 将技能分配到快捷栏
        if (this.game.skills) {
            this.game.skills.assignToQuickSlot(slotIndex, skillId);
            this.updateSkillSlotDisplay(slotIndex, skillId);
        }
    }

    updateSkillSlotDisplay(slotIndex, skillId) {
        const skillSlots = document.querySelectorAll('.skill-slot-large');
        const slot = skillSlots[slotIndex];
        if (!slot) return;

        const icon = slot.querySelector('.skill-icon');
        if (!icon) return;

        if (skillId) {
            const skill = this.game.skills.getSkillById(skillId);
            if (skill) {
                icon.textContent = skill.icon || '⚡';
                slot.title = skill.name;
            }
        } else {
            icon.textContent = '❓';
            slot.title = '空技能槽';
        }
    }

    update() {
        this.updateEnemyInfo();
        this.updatePlayerInfo();
        this.updateCombatStats();
    }

    updatePlayerInfo() {
        const character = this.game.character;
        if (!character) return;

        // 更新玩家血量条
        const playerHpFill = document.getElementById('player-hp-fill');
        if (playerHpFill) {
            const hpPercent = (character.currentHP / character.maxHP) * 100;
            playerHpFill.style.width = `${hpPercent}%`;
        }

        // 更新玩家魔法值条（暂时设为满值）
        const playerMpFill = document.getElementById('player-mp-fill');
        if (playerMpFill) {
            playerMpFill.style.width = '100%';
        }
    }

    updateEnemyInfo() {
        const enemy = this.game.combat.currentEnemy;
        if (!enemy) return;

        // 更新战斗页面的敌人信息
        const battleNameElement = document.getElementById('battle-enemy-name');
        if (battleNameElement) {
            battleNameElement.textContent = enemy.name;
        }

        // 更新敌人等级
        const battleLevelElement = document.getElementById('battle-enemy-level');
        if (battleLevelElement) {
            battleLevelElement.textContent = enemy.level;
        }

        // 更新敌人血量
        this.updateEnemyHP();

        // 更新敌人图片
        const battleImageElement = document.getElementById('battle-enemy-image');
        if (battleImageElement) {
            battleImageElement.src = enemy.image || '';
        }
    }

    updateEnemyHP() {
        const enemy = this.game.combat.currentEnemy;
        if (!enemy) return;

        const hpFill = document.getElementById('enemy-hp-fill');
        const hpCurrent = document.getElementById('enemy-hp-current');
        const hpMax = document.getElementById('enemy-hp-max');

        if (hpFill && hpCurrent && hpMax) {
            const hpPercent = (enemy.currentHP / enemy.maxHP) * 100;
            hpFill.style.width = `${hpPercent}%`;
            hpCurrent.textContent = Math.floor(enemy.currentHP);
            hpMax.textContent = Math.floor(enemy.maxHP);
        }
    }

    updateCombatStats() {
        // 更新DPS统计
        const dpsElement = document.getElementById('dps-stat');
        if (dpsElement) {
            const dps = this.game.combat.getDPS();
            dpsElement.textContent = Utils.formatNumber(dps);
        }

        // 更新经验/小时
        const expPerHourElement = document.getElementById('exp-per-hour');
        if (expPerHourElement) {
            const expPerHour = this.game.combat.getExpPerHour();
            expPerHourElement.textContent = Utils.formatNumber(expPerHour);
        }

        // 更新金币/小时
        const goldPerHourElement = document.getElementById('gold-per-hour');
        if (goldPerHourElement) {
            const goldPerHour = this.game.combat.getGoldPerHour();
            goldPerHourElement.textContent = Utils.formatNumber(goldPerHour);
        }
    }

    addLogEntry(message, type = 'normal') {
        const logContent = document.getElementById('combat-log');
        if (!logContent) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
            <span class="log-message">${message}</span>
        `;

        logContent.appendChild(logEntry);

        // 限制日志条目数量
        while (logContent.children.length > this.maxLogEntries) {
            logContent.removeChild(logContent.firstChild);
        }

        // 自动滚动到底部
        logContent.scrollTop = logContent.scrollHeight;
    }

    clearLog() {
        const logContent = document.getElementById('combat-log');
        if (logContent) {
            logContent.innerHTML = '<div class="log-entry">战斗日志已清空</div>';
        }
    }

    togglePause() {
        if (this.game.combat.isPaused) {
            this.game.combat.resume();
        } else {
            this.game.combat.pause();
        }
        this.updatePauseButton();
    }

    updatePauseButton() {
        const pauseBtn = document.getElementById('pause-combat-btn');
        if (pauseBtn) {
            pauseBtn.textContent = this.game.combat.isPaused ? '继续' : '暂停';
        }
    }

    // 显示伤害数字动画
    showDamageNumber(damage, isCrit = false) {
        const combatArea = document.querySelector('.combat-area');
        if (!combatArea) return;

        const damageElement = document.createElement('div');
        damageElement.className = `damage-number ${isCrit ? 'crit' : ''}`;
        damageElement.textContent = `-${Utils.formatNumber(damage)}`;
        
        // 随机位置
        damageElement.style.left = `${Math.random() * 200 + 100}px`;
        damageElement.style.top = `${Math.random() * 50 + 50}px`;
        
        combatArea.appendChild(damageElement);

        // 动画结束后移除
        setTimeout(() => {
            if (damageElement.parentNode) {
                damageElement.parentNode.removeChild(damageElement);
            }
        }, 2000);
    }

    // 显示治疗数字动画
    showHealNumber(heal) {
        const combatArea = document.querySelector('.combat-area');
        if (!combatArea) return;

        const healElement = document.createElement('div');
        healElement.className = 'heal-number';
        healElement.textContent = `+${Utils.formatNumber(heal)}`;
        
        healElement.style.left = `${Math.random() * 200 + 100}px`;
        healElement.style.top = `${Math.random() * 50 + 150}px`;
        
        combatArea.appendChild(healElement);

        setTimeout(() => {
            if (healElement.parentNode) {
                healElement.parentNode.removeChild(healElement);
            }
        }, 2000);
    }

    // 显示经验获得
    showExpGain(exp) {
        this.addLogEntry(`获得 ${exp} 经验值`, 'exp');
    }

    // 显示金币获得
    showGoldGain(gold) {
        this.addLogEntry(`获得 ${gold} 金币`, 'gold');
    }

    // 显示装备掉落
    showEquipmentDrop(equipment) {
        this.addLogEntry(`获得装备: ${equipment.name}`, 'equipment');
    }

    // 显示敌人死亡
    showEnemyDeath(enemy) {
        this.addLogEntry(`击败了 ${enemy.name}`, 'victory');
    }

    // 显示新关卡
    showNewStage(stage) {
        this.addLogEntry(`进入第 ${stage} 关`, 'stage');
    }
} 