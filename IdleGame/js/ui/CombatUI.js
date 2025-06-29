// 战斗界面UI类
class CombatUI {
    constructor(game) {
        this.game = game;
        this.maxLogEntries = 50;
        this.updateInterval = null;
        this.initializeUI();
    }

    initializeUI() {
        this.bindEvents();
        this.addCombatControls();
        this.addCombatStats();
        this.initializeTooltips();
        this.updateCombatControls(); // 初始化按钮状态
        this.startUpdateLoop();
    }

    bindEvents() {
        // 绑定技能栏点击事件
        this.bindSkillSlotEvents();
        // 绑定角色悬浮提示事件
        this.bindCharacterTooltipEvents();
    }

    // 添加战斗控制按钮
    addCombatControls() {
        const logHeader = document.querySelector('.log-header');
        if (logHeader) {
            // 只添加清空按钮，保留现有的开始战斗按钮
            logHeader.innerHTML = `
                <span>战斗日志</span>
                <button class="combat-btn" id="clear-log-btn" onclick="combatUI.clearLog()" style="background: none; border: 1px solid #666; color: #ccc; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">清空</button>
            `;
        }
    }

    // 添加战斗统计（使用HTML中已有的统计区域）
    addCombatStats() {
        // HTML中已经有战斗统计区域，不需要重复创建
        // 只需要确保统计数据能正确更新
    }

    bindSkillSlotEvents() {
        // 技能栏现在只用于显示，不需要点击事件
        // 技能将根据技能页面的自动施法配置来显示
    }

    // 更新技能栏显示（根据技能页面的自动施法配置）
    updateSkillBar() {
        if (!this.game.skills) return;
        
        // 获取自动施法配置的技能
        const autoCastSkills = this.game.skills.getAutoCastSkills();
        
        // 更新每个技能槽
        const skillSlots = document.querySelectorAll('.skill-slot-large');
        skillSlots.forEach((slot, index) => {
        const icon = slot.querySelector('.skill-icon');
        if (!icon) return;

            if (autoCastSkills[index]) {
                const skill = autoCastSkills[index];
                icon.textContent = skill.icon || '⚡';
                slot.title = skill.name;
                slot.classList.add('has-skill');
        } else {
            icon.textContent = '❓';
                slot.title = '空技能槽';
                slot.classList.remove('has-skill');
        }
        });
    }



    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 100); // 每100ms更新一次UI
    }

    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    update() {
        this.updatePlayerInfo();
        this.updateEnemyInfo();
        this.updateCombatStats();
        this.updateCombatControls();
        this.updateSkillBar();
    }

    updatePlayerInfo() {
        const character = this.game.character;
        if (!character) return;

        // 更新玩家血量条
        var playerHpFill = document.getElementById('player-hp-fill');
        var playerHpText = document.getElementById('player-hp-text');
        if (playerHpFill && playerHpText) {
            var hpPercent = (character.currentHP / character.maxHP) * 100;
            playerHpFill.style.width = hpPercent + '%';
            playerHpText.textContent = Math.ceil(character.currentHP) + '/' + character.maxHP;
        }

        // 更新玩家魔法值条
        var playerMpFill = document.getElementById('player-mp-fill');
        var playerMpText = document.getElementById('player-mp-text');
        if (playerMpFill && playerMpText) {
            var mpPercent = (character.currentMP / character.maxMP) * 100;
            playerMpFill.style.width = mpPercent + '%';
            playerMpText.textContent = Math.ceil(character.currentMP) + '/' + character.maxMP;
        }

        // 更新玩家行动条
        this.updateActionBar('player', character);
    }

    // 更新行动条
    updateActionBar(type, character) {
        var actionFill = document.getElementById(type + '-action-fill');
        if (!actionFill) return;

        // 如果角色正在行动，显示进度
        if (character.isActing && character.actionProgress !== undefined) {
            var percent = (character.actionProgress / character.actionTime) * 100;
            actionFill.style.width = percent + '%';
        } else {
            actionFill.style.width = '0%';
        }
    }

    // 初始化角色悬浮提示
    initializeTooltips() {
        this.tooltip = document.getElementById('character-tooltip');
    }

    // 绑定角色悬浮提示事件
    bindCharacterTooltipEvents() {
        var self = this;
        
        // 玩家角色悬浮提示
        var playerCharacter = document.getElementById('player-character');
        if (playerCharacter) {
            playerCharacter.addEventListener('mouseenter', function(e) {
                self.showCharacterTooltip(e, 'player');
            });
            playerCharacter.addEventListener('mouseleave', function() {
                self.hideCharacterTooltip();
            });
            playerCharacter.addEventListener('mousemove', function(e) {
                self.updateTooltipPosition(e);
            });
        }

        // 敌人角色悬浮提示（使用事件委托）
        var enemyContainer = document.getElementById('enemy-characters');
        if (enemyContainer) {
            enemyContainer.addEventListener('mouseenter', function(e) {
                if (e.target.closest('.enemy-avatar-box')) {
                    var enemyId = e.target.closest('.enemy-avatar-box').getAttribute('data-enemy-id');
                    self.showCharacterTooltip(e, 'enemy', enemyId);
                }
            }, true);
            enemyContainer.addEventListener('mouseleave', function(e) {
                if (!e.relatedTarget || !e.relatedTarget.closest('.enemy-avatar-box')) {
                    self.hideCharacterTooltip();
                }
            }, true);
            enemyContainer.addEventListener('mousemove', function(e) {
                if (e.target.closest('.enemy-avatar-box')) {
                    self.updateTooltipPosition(e);
                }
            }, true);
        }
        }

    // 显示角色悬浮提示
    showCharacterTooltip(event, type, enemyId) {
        if (!this.tooltip) return;

        var character;
        var name;
        
        if (type === 'player') {
            character = this.game.character;
            name = '玩家角色';
        } else if (type === 'enemy' && enemyId) {
            var combat = this.game.combat;
            if (combat) {
                character = combat.aliveEnemies.find(function(enemy) {
                    return enemy.id == enemyId;
                });
                name = character ? character.name : '未知敌人';
            }
        }

        if (!character) return;

        // 更新提示框内容
        this.updateTooltipContent(character, name);
        
        // 显示提示框
        this.tooltip.classList.add('show');
        this.updateTooltipPosition(event);
    }

    // 隐藏角色悬浮提示
    hideCharacterTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
        }
    }

    // 更新提示框位置
    updateTooltipPosition(event) {
        if (!this.tooltip || !this.tooltip.classList.contains('show')) return;

        var x = event.clientX + 15;
        var y = event.clientY - this.tooltip.offsetHeight / 2;

        // 防止提示框超出视窗边界
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        
        if (x + this.tooltip.offsetWidth > windowWidth) {
            x = event.clientX - this.tooltip.offsetWidth - 15;
        }
        
        if (y < 0) {
            y = 10;
        } else if (y + this.tooltip.offsetHeight > windowHeight) {
            y = windowHeight - this.tooltip.offsetHeight - 10;
        }

        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
    }

    // 更新提示框内容
    updateTooltipContent(character, name) {
        if (!this.tooltip) return;

        // 更新基本信息
        var nameElement = document.getElementById('tooltip-character-name');
        var levelElement = document.getElementById('tooltip-character-level');
        var healthElement = document.getElementById('tooltip-character-health');
        var manaElement = document.getElementById('tooltip-character-mana');
        var statsElement = document.getElementById('tooltip-character-stats');

        if (nameElement) nameElement.textContent = name;
        if (levelElement) levelElement.textContent = '等级 ' + character.level;
        if (healthElement) {
            healthElement.textContent = '生命值: ' + Math.ceil(character.currentHP) + '/' + character.maxHP;
        }
        if (manaElement) {
            var currentMP = character.currentMP || 0;
            var maxMP = character.maxMP || 0;
            manaElement.textContent = '魔法值: ' + Math.ceil(currentMP) + '/' + maxMP;
        }

        // 更新属性信息
        if (statsElement) {
            var stats = [
                ['攻击力', character.physicalAttack || 0],
                ['法术强度', character.magicalAttack || 0],
                ['防御值', character.defense || 0],
                ['魔法抗性', character.magicResist || 0],
                ['暴击率', character.critRate || 0],
                ['闪避率', character.dodgeRate || 0],
                ['命中率', character.hitRate || 100],
                ['攻击速度', (character.attackSpeed || 1.0).toFixed(1)]
            ];

            statsElement.innerHTML = '';
            stats.forEach(function(stat) {
                var statDiv = document.createElement('div');
                statDiv.className = 'tooltip-stat';
                statDiv.innerHTML = '<span class="tooltip-stat-name">' + stat[0] + '</span><span class="tooltip-stat-value">' + stat[1] + '</span>';
                statsElement.appendChild(statDiv);
            });
        }
    }

    updateEnemyInfo() {
        const combat = this.game.combat;
        if (!combat) return;

        const enemyContainer = document.getElementById('enemy-characters');
        if (!enemyContainer) return;

        // 如果有存活的敌人，清除"无敌人"提示
        if (combat.aliveEnemies.length > 0) {
            const noEnemiesDiv = enemyContainer.querySelector('.no-enemies');
            if (noEnemiesDiv) {
                noEnemiesDiv.remove();
            }
        }

        // 移除已死亡的敌人
        var existingEnemies = enemyContainer.querySelectorAll('.enemy-avatar-box');
        existingEnemies.forEach(function(enemyElement) {
            var enemyId = enemyElement.getAttribute('data-enemy-id');
            var stillAlive = combat.aliveEnemies.some(function(enemy) {
                return enemy.id == enemyId;
            });
            if (!stillAlive) {
                enemyElement.remove();
            }
        });

        // 显示所有存活的敌人
        combat.aliveEnemies.forEach(function(enemy, index) {
            var existingBox = document.querySelector('[data-enemy-id="' + enemy.id + '"]');
            
            if (existingBox) {
                // 更新现有敌人的血量和魔法值
                var hpFill = existingBox.querySelector('.hp-fill');
                var hpText = existingBox.querySelector('.hp-text');
                var mpFill = existingBox.querySelector('.mp-fill');
                var mpText = existingBox.querySelector('.mp-text');

                if (hpFill && hpText) {
                    var hpPercent = (enemy.currentHP / enemy.maxHP) * 100;
                    hpFill.style.width = hpPercent + '%';
                    hpText.textContent = Math.ceil(enemy.currentHP) + '/' + enemy.maxHP;
                }
                
                if (mpFill && mpText) {
                    var mpPercent = (enemy.currentMP / enemy.maxMP) * 100;
                    mpFill.style.width = mpPercent + '%';
                    mpText.textContent = Math.ceil(enemy.currentMP) + '/' + enemy.maxMP;
                }
            } else {
                // 创建新的敌人显示
                var enemyBox = document.createElement('div');
                enemyBox.className = 'enemy-avatar-box';
                enemyBox.setAttribute('data-enemy-id', enemy.id);
                
                enemyBox.innerHTML = `
                    <div class="enemy-portrait">
                        <img src="${enemy.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNzIxYzI0IiByeD0iOCIvPgo8cGF0aCBkPSJNMzIgMTZDMzUuMzEzNyAxNiAzOCAxOC42ODYzIDM4IDIyQzM4IDI1LjMxMzcgMzUuMzEzNyAyOCAzMiAyOEMyOC42ODYzIDI4IDI2IDI1LjMxMzcgMjYgMjJDMjYgMTguNjg2MyAyOC42ODYzIDE2IDMyIDE2WiIgZmlsbD0iI0ZGQzEwNyIvPgo8cGF0aCBkPSJNMjAgNDhDMjAgNDAuMjY4IDI2LjI2OCAzNCAzNCAzNEMzNS4zMTM3IDM0IDM2LjU1IDM0LjI0NzEgMzcuNjc4NCAzNC42OTg1QzM5LjA0NzEgMzUuMjM1MyAzOS44OTQ3IDM0LjkxMTggNDEuMzE1OCAzNC4zMTU4QzQyLjczNjggMzMuNzE5NyA0My45NDczIDMzLjQ0NzQgNDUuMzE1OCAzMy4zMTU4QzQ2LjY4NDIgMzMuMTg0MiA0OCAzMy4zMTU4IDQ4IDM0QzQ4IDM0IDQ4IDQyIDQ4IDQ4SDIwWiIgZmlsbD0iIzMzNzNEQyIvPgo8L3N2Zz4K'}" alt="${enemy.name}">
                    </div>
                    <div class="enemy-bars">
                        <div class="hp-bar">
                            <div class="hp-fill" style="width: ${(enemy.currentHP / enemy.maxHP) * 100}%"></div>
                            <div class="hp-text">${Math.ceil(enemy.currentHP)}/${enemy.maxHP}</div>
                        </div>
                        <div class="mp-bar">
                            <div class="mp-fill" style="width: ${(enemy.currentMP / enemy.maxMP) * 100}%"></div>
                            <div class="mp-text">${Math.ceil(enemy.currentMP)}/${enemy.maxMP}</div>
                        </div>
                        <div class="action-bar">
                            <div class="action-fill" id="enemy-${enemy.id}-action-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="enemy-info">
                        <div class="enemy-name">${enemy.name}</div>
                        <div class="enemy-level">等级 ${enemy.level}</div>
                    </div>
                `;
                
                enemyContainer.appendChild(enemyBox);
            }
            
            // 更新敌人行动条
            this.updateActionBar('enemy-' + enemy.id, enemy);
        }.bind(this));

        // 如果没有敌人，显示空状态
        if (combat.aliveEnemies.length === 0) {
            enemyContainer.innerHTML = `
                <div class="no-enemies">
                    <div class="no-enemies-text">无敌人</div>
                </div>
            `;
        }
    }

    updateCombatStats() {
        const combat = this.game.combat;
        if (!combat) return;

        const stats = combat.getCombatStats();

        // 更新当前关卡
        const stageElement = document.getElementById('current-stage');
        if (stageElement) {
            stageElement.textContent = stats.stage;
        }

        // 更新历史最高关卡
        const maxStageElement = document.getElementById('max-stage');
        if (maxStageElement) {
            maxStageElement.textContent = stats.maxStage;
        }

        // 更新敌人数量
        const enemyCountElement = document.getElementById('enemy-count');
        if (enemyCountElement) {
            enemyCountElement.textContent = `${stats.aliveEnemies}/${stats.totalEnemies}`;
        }

        // 更新当前关卡造成伤害
        const damageDealtElement = document.getElementById('damage-dealt');
        if (damageDealtElement) {
            damageDealtElement.textContent = Utils.formatNumber(stats.currentStageDamageDealt);
        }

        // 更新当前关卡受到伤害
        const damageTakenElement = document.getElementById('damage-taken');
        if (damageTakenElement) {
            damageTakenElement.textContent = Utils.formatNumber(stats.currentStageDamageTaken);
        }
    }

    updateCombatControls() {
        const startBtn = document.getElementById('start-combat-btn');
        const pauseBtn = document.getElementById('pause-combat-btn');
        const stopBtn = document.getElementById('stop-combat-btn');
        const nextStageBtn = document.getElementById('next-stage-btn');

        if (startBtn) {
            startBtn.disabled = this.game.combat.isActive;
        }

        if (pauseBtn) {
            if (this.game.combat.isActive) {
                if (this.game.combat.isPaused) {
                    pauseBtn.textContent = '继续';
                    pauseBtn.classList.add('pause');
                } else {
                    pauseBtn.textContent = '暂停';
                    pauseBtn.classList.remove('pause');
                }
                pauseBtn.disabled = false;
            } else {
                pauseBtn.disabled = true;
            }
        }

        if (stopBtn) {
            stopBtn.disabled = !this.game.combat.isActive;
        }

        if (nextStageBtn) {
            nextStageBtn.disabled = false; // 下一关按钮始终可用
        }

        // 更新页面状态类
        const combatPage = document.querySelector('.combat-page');
        if (combatPage) {
            combatPage.classList.toggle('paused', this.game.combat.isPaused);
        }
    }

    // 战斗控制方法
    togglePause() {
        if (this.game.combat.isActive) {
            if (this.game.combat.isPaused) {
                this.game.combat.resume();
            } else {
                this.game.combat.pause();
            }
        }
        this.updateCombatControls();
    }

    stopCombat() {
        this.game.combat.stopCombat();
        this.updateCombatControls();
    }

    clearLog() {
        this.game.combat.clearLog();
    }

    // 添加日志条目
    addLogEntry(message, type = 'normal') {
        const logContainer = document.getElementById('combat-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;

        logContainer.appendChild(logEntry);
        
        // 保持最多指定数量的日志
        while (logContainer.children.length > this.maxLogEntries) {
            logContainer.removeChild(logContainer.firstChild);
        }

        // 滚动到底部
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // 显示伤害数字（与Combat类中的方法配合）
    showDamageNumber(damage, isCrit = false, target = 'enemy') {
        // 这个方法在Combat类中已经实现，这里保留接口
        console.log(`伤害数字: ${damage} (${isCrit ? '暴击' : '普通'}) -> ${target}`);
    }

    // 显示治疗数字
    showHealNumber(heal, target = 'player') {
        const targetElement = target === 'player' ? 
            document.querySelector('.character-avatar-box') : 
            document.querySelector('.enemy-avatar-box');
            
        if (!targetElement) return;

        const healElement = document.createElement('div');
        healElement.className = 'heal-number';
        healElement.textContent = `+${heal}`;
        healElement.style.position = 'absolute';
        healElement.style.color = '#4CAF50';
        healElement.style.fontSize = '18px';
        healElement.style.fontWeight = 'bold';
        healElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        healElement.style.pointerEvents = 'none';
        healElement.style.zIndex = '1000';
        
        const rect = targetElement.getBoundingClientRect();
        healElement.style.left = `${rect.left + Math.random() * rect.width}px`;
        healElement.style.top = `${rect.top + Math.random() * rect.height}px`;
        
        document.body.appendChild(healElement);

        // 动画效果
        let opacity = 1;
        let translateY = 0;
        const animation = setInterval(() => {
            opacity -= 0.05;
            translateY -= 2;
            healElement.style.opacity = opacity;
            healElement.style.transform = `translateY(${translateY}px)`;
            
            if (opacity <= 0) {
                clearInterval(animation);
                document.body.removeChild(healElement);
            }
        }, 50);
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
        this.addLogEntry(`${enemy.name} 被击败！`, 'victory');
    }

    // 显示新关卡
    showNewStage(stage) {
        this.addLogEntry(`进入第 ${stage} 关！`, 'stage');
    }

    // 显示胜利效果
    showVictoryEffect() {
        const combatPage = document.querySelector('.combat-page');
        if (combatPage) {
            combatPage.classList.add('victory');
            setTimeout(() => {
                combatPage.classList.remove('victory');
            }, 1500);
        }
    }

    // 显示失败效果
    showDefeatEffect() {
        const combatPage = document.querySelector('.combat-page');
        if (combatPage) {
            combatPage.classList.add('defeat');
            setTimeout(() => {
                combatPage.classList.remove('defeat');
            }, 1000);
        }
    }

    // 显示Miss文本
    showMissText(target, targetEnemy = null) {
        let targetElement;

        if (target === 'player') {
            targetElement = document.querySelector('.character-avatar-box');
        } else if (target === 'enemy' && targetEnemy) {
            targetElement = document.querySelector(`[data-enemy-id="${targetEnemy.id}"]`);
        }

        if (!targetElement) return;

        const missElement = document.createElement('div');
        missElement.className = 'miss-text';
        missElement.textContent = 'MISS';

        // 设置随机位置
        const rect = targetElement.getBoundingClientRect();
        missElement.style.position = 'absolute';
        missElement.style.left = `${rect.left + Math.random() * rect.width}px`;
        missElement.style.top = `${rect.top + Math.random() * rect.height}px`;
        missElement.style.zIndex = '1000';
        missElement.style.pointerEvents = 'none';
        missElement.style.color = '#888';
        missElement.style.fontSize = '16px';
        missElement.style.fontWeight = 'bold';
        missElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';

        document.body.appendChild(missElement);

        // 动画效果
        let opacity = 1;
        let translateY = 0;
        const animation = setInterval(() => {
            opacity -= 0.05;
            translateY -= 2;
            missElement.style.opacity = opacity;
            missElement.style.transform = `translateY(${translateY}px)`;

            if (opacity <= 0) {
                clearInterval(animation);
                if (missElement.parentNode) {
                    missElement.parentNode.removeChild(missElement);
                }
            }
        }, 50);
    }

    // 销毁UI
    destroy() {
        this.stopUpdateLoop();
    }
}

// 全局函数 - 用于HTML按钮点击事件
window.startCombat = function() {
    if (window.game && window.game.combat) {
        window.game.combat.startCombat();
    }
};

window.pauseCombat = function() {
    if (window.game && window.game.combat) {
        if (window.game.combat.isPaused) {
            window.game.combat.resume();
        } else {
            window.game.combat.pause();
        }
    }
};

window.stopCombat = function() {
    if (window.game && window.game.combat) {
        window.game.combat.stopCombat();
    }
};

window.clearCombatLog = function() {
    if (window.game && window.game.combat) {
        window.game.combat.clearLog();
    }
};

window.nextStage = function() {
    if (window.game && window.game.combat) {
        window.game.combat.nextStage();
    }
}; 