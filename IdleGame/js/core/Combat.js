// 战斗系统类
class Combat {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.isPaused = false;
        this.stage = 1;
        this.maxStage = 1; // 历史最高关卡

        // 当前关卡的所有敌人（同时存在）
        this.currentEnemies = [];
        this.aliveEnemies = []; // 存活的敌人

        // 战斗统计
        this.combatStartTime = 0;
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.totalExpGained = 0;
        this.totalGoldGained = 0;

        // 当前关卡统计
        this.currentStageDamageDealt = 0;
        this.currentStageDamageTaken = 0;

        this.animationDuration = 500;
    }

    // 开始战斗
    startCombat() {
        if (this.isActive) return;

        this.isActive = true;
        this.isPaused = false;
        this.combatStartTime = Date.now();

        // 生成当前关卡的敌人
        this.generateStage();

        // 保存战斗状态
        this.saveCombatState();

        this.addCombatLog(`开始战斗 - 第 ${this.stage} 关！`);
        console.log(`战斗开始 - 第 ${this.stage} 关`);
    }

    // 停止战斗
    stopCombat() {
        this.isActive = false;
        this.isPaused = false;
        this.currentEnemies = [];
        this.aliveEnemies = [];

        // 重置到第一关
        this.stage = 1;
        this.currentStageDamageDealt = 0;
        this.currentStageDamageTaken = 0;

        // 清除保存的战斗状态
        this.clearCombatState();

        this.addCombatLog('战斗已停止，回到第一关');
        console.log('战斗已停止');
    }

    // 暂停战斗
    pause() {
        this.isPaused = true;
    }

    // 恢复战斗
    resume() {
        this.isPaused = false;
    }

    // 生成关卡敌人
    generateStage() {
        this.currentEnemies = generateStageEnemies(this.stage);
        this.aliveEnemies = [...this.currentEnemies];

        // 给每个敌人分配唯一ID
        this.currentEnemies.forEach((enemy, index) => {
            enemy.id = `enemy_${this.stage}_${index}`;
        });

        // 重置当前关卡统计
        this.currentStageDamageDealt = 0;
        this.currentStageDamageTaken = 0;

        console.log(`第 ${this.stage} 关生成了 ${this.currentEnemies.length} 个敌人`);
    }

    // 获取当前敌人（用于UI显示，显示第一个存活的敌人）
    getCurrentEnemy() {
        return this.aliveEnemies.length > 0 ? this.aliveEnemies[0] : null;
    }

    // 更新战斗
    update(deltaTime) {
        if (!this.isActive || this.isPaused || this.aliveEnemies.length === 0) return;

        var character = this.game.character;

        // 更新玩家行动条
        if (character.canAct()) {
            character.startAction('attack');
            // console.log('玩家开始攻击行动'); // 调试信息
        }

        var completedAction = character.update(deltaTime);
        if (completedAction === 'attack') {
            // console.log('玩家完成攻击行动'); // 调试信息
            this.playerAttack();
        }

        // 更新每个敌人的行动条
        this.aliveEnemies.forEach(function (enemy) {
            if (enemy.canAct && enemy.canAct()) {
                enemy.startAction('attack');
            }

            var enemyCompletedAction = enemy.update ? enemy.update(deltaTime) : null;
            if (enemyCompletedAction === 'attack') {
                this.enemyAttack(enemy);
            }
        }.bind(this));
    }

    // 玩家攻击（攻击随机存活敌人）
    playerAttack() {
        if (this.aliveEnemies.length === 0) return;

        const character = this.game.character;

        // 随机选择一个存活的敌人攻击
        const targetEnemy = this.aliveEnemies[Math.floor(Math.random() * this.aliveEnemies.length)];
        const damage = this.calculateDamage(character, targetEnemy);

        // console.log(`玩家攻击 ${targetEnemy.name}，伤害计算结果:`, damage); // 调试信息

        // 播放攻击动画
        this.playAttackAnimation('player', targetEnemy);

        // 记录日志和处理伤害
        if (damage.isDodged) {
            // 攻击被闪避
            this.addCombatLog(`${targetEnemy.name} 闪避了你的攻击！`);
            // 显示MISS文本
            if (this.game.combatUI) {
                this.game.combatUI.showMissText('enemy', targetEnemy);
            }
        } else {
            // 攻击命中，应用伤害
            targetEnemy.takeDamage(damage.total);
            this.totalDamageDealt += damage.total;
            this.currentStageDamageDealt += damage.total;

            // 显示伤害数字
            this.showDamageNumber(damage.total, damage.isCrit, 'enemy', targetEnemy, damage.damageType);

            // 记录伤害日志
            let logMessage = `你对 ${targetEnemy.name} 造成了 ${damage.total} 点伤害`;
            if (damage.isCrit) {
                logMessage += ' (暴击!)';
            }
            this.addCombatLog(logMessage);

            // 检查敌人是否死亡
            if (!targetEnemy.isAlive()) {
                this.onEnemyDeath(targetEnemy);
            }
        }
    }

    // 敌人攻击
    enemyAttack(enemy) {
        if (!enemy.isAlive()) return;

        const character = this.game.character;
        const damage = this.calculateDamage(enemy, character);

        // 播放攻击动画
        this.playAttackAnimation('enemy', enemy);

        // 记录日志和处理伤害
        if (damage.isDodged) {
            // 攻击被闪避
            this.addCombatLog(`你闪避了 ${enemy.name} 的攻击！`);
            // 显示MISS文本
            if (this.game.combatUI) {
                this.game.combatUI.showMissText('player');
            }
        } else {
            // 攻击命中，应用伤害
            const isDead = character.takeDamage(damage.total);
            this.totalDamageTaken += damage.total;
            this.currentStageDamageTaken += damage.total;

            // 显示伤害数字
            this.showDamageNumber(damage.total, damage.isCrit, 'player', enemy, damage.damageType);

            // 记录伤害日志
            let logMessage = `${enemy.name} 对你造成了 ${damage.total} 点伤害`;
            if (damage.isCrit) {
                logMessage += ' (暴击!)';
            }
            this.addCombatLog(logMessage);

            if (isDead) {
                this.onPlayerDeath();
                return;
            }
        }
    }

    // 计算伤害
    calculateDamage(attacker, defender) {
        const result = {
            total: 0,
            isCrit: false,
            isDodged: false,
            damageType: 'physical' // 'physical' 或 'magical'
        };

        // 简化的命中计算：
        // 1. 获取攻击者的命中率和防御者的闪避率
        const attackerHit = attacker.hitRate || 100;  // 攻击者命中值
        const defenderDodge = defender.dodgeRate || 0; // 防御者闪避值

        const dodgeChance = defenderDodge / (defenderDodge + 100); // 基础闪避概率
        
        const finalAttackerHit = attackerHit * (1 - dodgeChance);
        const finalHitChance = finalAttackerHit / (finalAttackerHit + 100); // 基础命中概率

        // console.log(`命中计算: 攻击者命中=${attackerHit}, 防御者闪避=${defenderDodge}, 最终命中=${finalAttackerHit.toFixed(1)}, 最终命中概率=${finalHitChance.toFixed(3)}`); // 调试信息

        // 4. 判定是否命中
        if (Math.random() > finalHitChance) {
            result.isDodged = true;
            // console.log('攻击被闪避！'); // 调试信息
            return result;
        }

        // 普通攻击只造成物理伤害
        let baseDamage;
        let defenseValue;

        // 普通攻击固定为物理伤害
        result.damageType = 'physical';
        baseDamage = attacker.physicalAttack || 0;
        defenseValue = defender.defense || 0;

        // 计算防御减伤
        const damageReduction = defenseValue / (defenseValue + 100);
        let finalDamage = baseDamage * (1 - damageReduction);

        // 检查暴击
        const critChance = attacker.critRate || 0;
        if (Math.random() * 100 < critChance) {
            result.isCrit = true;
            const critMultiplier = attacker.critDamage ? (attacker.critDamage / 100) : 1.5;
            finalDamage *= critMultiplier;
        }

        // 随机浮动 ±10%
        finalDamage *= (0.9 + Math.random() * 0.2);

        result.total = Math.max(1, Math.floor(finalDamage));
        return result;
    }

    // 播放攻击动画
    playAttackAnimation(attacker, targetEnemy = null) {
        if (attacker === 'player') {
            const element = document.querySelector('.character-avatar-box');
            if (element) {
                element.classList.add('attacking');
                setTimeout(() => {
                    element.classList.remove('attacking');
                }, this.animationDuration);
            }
        } else if (attacker === 'enemy' && targetEnemy) {
            const element = document.querySelector(`[data-enemy-id="${targetEnemy.id}"]`);
            if (element) {
                element.classList.add('attacking');
                setTimeout(() => {
                    element.classList.remove('attacking');
                }, this.animationDuration);
            }
        }
    }

    // 显示伤害数字
    showDamageNumber(damage, isCrit, target, targetEnemy = null, damageType = 'physical') {
        let targetElement;

        if (target === 'player') {
            targetElement = document.querySelector('.character-avatar-box');
        } else if (target === 'enemy' && targetEnemy) {
            targetElement = document.querySelector(`[data-enemy-id="${targetEnemy.id}"]`);
        }

        if (!targetElement) return;

        const damageElement = document.createElement('div');
        damageElement.className = `damage-number ${isCrit ? 'crit' : ''} ${damageType}`;
        
        // 根据暴击添加符号提示
        const critSymbol = isCrit ? '💥' : '';
        damageElement.textContent = `${critSymbol}-${damage}`;

        // 设置随机位置，确保不会出屏幕
        const rect = targetElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 计算安全的显示区域
        const minLeft = Math.max(10, rect.left - 50);
        const maxLeft = Math.min(viewportWidth - 100, rect.right + 50);
        const minTop = Math.max(10, rect.top - 30);
        const maxTop = Math.min(viewportHeight - 50, rect.bottom + 30);
        
        damageElement.style.position = 'absolute';
        damageElement.style.left = `${minLeft + Math.random() * (maxLeft - minLeft)}px`;
        damageElement.style.top = `${minTop + Math.random() * (maxTop - minTop)}px`;
        damageElement.style.zIndex = '1000';
        damageElement.style.pointerEvents = 'none';
        
        // 根据伤害类型设置颜色
        let baseColor;
        if (damageType === 'physical') {
            baseColor = isCrit ? '#ff3333' : '#ff6666'; // 物理伤害：红色
        } else {
            baseColor = isCrit ? '#3366ff' : '#6699ff'; // 魔法伤害：蓝色
        }
        
        damageElement.style.color = baseColor;
        damageElement.style.fontSize = isCrit ? '24px' : '18px';
        damageElement.style.fontWeight = 'bold';
        damageElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';

        document.body.appendChild(damageElement);

        // 动画效果
        let opacity = 1;
        let translateY = 0;
        const animation = setInterval(() => {
            opacity -= 0.05;
            translateY -= 2;
            damageElement.style.opacity = opacity;
            damageElement.style.transform = `translateY(${translateY}px)`;

            if (opacity <= 0) {
                clearInterval(animation);
                if (damageElement.parentNode) {
                    damageElement.parentNode.removeChild(damageElement);
                }
            }
        }, 50);
    }

    // 敌人死亡处理
    onEnemyDeath(enemy) {
        // 播放死亡动画
        this.playDeathAnimation('enemy', enemy);

        // 从存活敌人列表中移除
        this.aliveEnemies = this.aliveEnemies.filter(e => e.id !== enemy.id);

        // 获得经验和金币
        const expGained = enemy.expReward || 10;
        const goldGained = enemy.goldReward || 5;

        this.game.character.gainExp(expGained);
        this.game.character.gold = (this.game.character.gold || 0) + goldGained;

        this.totalExpGained += expGained;
        this.totalGoldGained += goldGained;

        this.addCombatLog(`击败了 ${enemy.name}！获得 ${expGained} 经验，${goldGained} 金币`);

        // 检查是否所有敌人都死亡
        if (this.aliveEnemies.length === 0) {
            this.onStageComplete();
        }
    }

    // 关卡完成
    onStageComplete() {
        this.addCombatLog(`第 ${this.stage} 关完成！`);

        // 更新历史最高关卡
        if (this.stage > this.maxStage) {
            this.maxStage = this.stage;
        }

        // 进入下一关
        this.stage++;

        // 保存战斗状态
        this.saveCombatState();

        // 短暂延迟后生成新关卡
        setTimeout(() => {
            if (this.isActive) {
                this.generateStage();
                this.addCombatLog(`进入第 ${this.stage} 关！`);
            }
        }, 1000);
    }

    // 播放死亡动画
    playDeathAnimation(target, targetEnemy = null) {
        let element;

        if (target === 'player') {
            element = document.querySelector('.character-avatar-box');
        } else if (target === 'enemy' && targetEnemy) {
            element = document.querySelector(`[data-enemy-id="${targetEnemy.id}"]`);
        }

        if (element) {
            element.classList.add('death');
            setTimeout(() => {
                element.classList.remove('death');
            }, this.animationDuration * 2);
        }
    }

    // 玩家死亡处理
    onPlayerDeath() {
        this.playDeathAnimation('player');
        this.addCombatLog('你死了！战斗结束。');

        // 停止战斗
        this.stopCombat();

        // 复活玩家（恢复一半血量）
        setTimeout(() => {
            this.game.character.currentHP = Math.floor(this.game.character.maxHP * 0.5);
            this.addCombatLog('你复活了！');
        }, 2000);
    }

    // 添加战斗日志
    addCombatLog(message) {
        const logElement = document.getElementById('combat-log');
        if (logElement) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

            logElement.appendChild(logEntry);

            // 限制日志条数
            const entries = logElement.querySelectorAll('.log-entry');
            if (entries.length > 100) {
                entries[0].remove();
            }

            // 滚动到底部
            logElement.scrollTop = logElement.scrollHeight;
        }
    }

    // 清空战斗日志
    clearLog() {
        const logElement = document.getElementById('combat-log');
        if (logElement) {
            logElement.innerHTML = '<div class="log-entry">战斗日志已清空</div>';
        }
    }

    // 设置自动模式
    setAutoMode(enabled) {
        this.autoMode = enabled;
    }

    // 获取战斗统计
    getCombatStats() {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.combatStartTime) / 1000; // 秒

        return {
            stage: this.stage,
            maxStage: this.maxStage,
            totalEnemies: this.currentEnemies.length,
            aliveEnemies: this.aliveEnemies.length,
            totalDamageDealt: this.totalDamageDealt,
            totalDamageTaken: this.totalDamageTaken,
            currentStageDamageDealt: this.currentStageDamageDealt,
            currentStageDamageTaken: this.currentStageDamageTaken,
            totalExp: this.totalExpGained,
            totalGold: this.totalGoldGained,
            elapsedTime: elapsedTime
        };
    }

    // 计算DPS
    calculateDPS() {
        const elapsedTime = (Date.now() - this.combatStartTime) / 1000;
        return elapsedTime > 0 ? Math.floor(this.totalDamageDealt / elapsedTime) : 0;
    }

    // 计算每小时经验
    calculateExpPerHour() {
        const elapsedTime = (Date.now() - this.combatStartTime) / 1000;
        return elapsedTime > 0 ? Math.floor(this.totalExpGained * 3600 / elapsedTime) : 0;
    }

    // 计算每小时金币
    calculateGoldPerHour() {
        const elapsedTime = (Date.now() - this.combatStartTime) / 1000;
        return elapsedTime > 0 ? Math.floor(this.totalGoldGained * 3600 / elapsedTime) : 0;
    }

    // 获取战斗数据（用于存档）
    getCombatData() {
        return {
            stage: this.stage,
            maxStage: this.maxStage,
            isActive: this.isActive,
            totalDamageDealt: this.totalDamageDealt,
            totalDamageTaken: this.totalDamageTaken,
            totalExpGained: this.totalExpGained,
            totalGoldGained: this.totalGoldGained,
            currentStageDamageDealt: this.currentStageDamageDealt,
            currentStageDamageTaken: this.currentStageDamageTaken
        };
    }

    // 加载战斗数据
    loadCombatData(data) {
        if (data) {
            this.stage = data.stage || 1;
            this.maxStage = data.maxStage || 1;
            this.totalDamageDealt = data.totalDamageDealt || 0;
            this.totalDamageTaken = data.totalDamageTaken || 0;
            this.totalExpGained = data.totalExpGained || 0;
            this.totalGoldGained = data.totalGoldGained || 0;
            this.currentStageDamageDealt = data.currentStageDamageDealt || 0;
            this.currentStageDamageTaken = data.currentStageDamageTaken || 0;

            // 不自动恢复战斗状态，让玩家手动开始
            this.isActive = false;
            this.isPaused = false;
        }
    }

    // 跳转到指定关卡
    jumpToStage(stage) {
        this.stage = Math.max(1, stage);
        if (this.isActive) {
            this.generateStage();
        }
    }

    // 跳转到下一关
    nextStage() {
        if (this.isActive) {
            // 如果战斗中，直接完成当前关卡
            this.aliveEnemies = [];
            this.onStageComplete();
        } else {
            // 如果未战斗，直接跳转到下一关
            this.stage++;
            this.saveCombatState();
            this.addCombatLog(`跳转到第 ${this.stage} 关`);
        }
    }

    // 保存战斗状态
    saveCombatState() {
        const combatState = {
            isActive: this.isActive,
            stage: this.stage,
            maxStage: this.maxStage,
            totalDamageDealt: this.totalDamageDealt,
            totalDamageTaken: this.totalDamageTaken,
            totalExpGained: this.totalExpGained,
            totalGoldGained: this.totalGoldGained,
            combatStartTime: this.combatStartTime
        };
        localStorage.setItem('combatState', JSON.stringify(combatState));
    }

    // 加载战斗状态
    loadCombatState() {
        const savedState = localStorage.getItem('combatState');
        if (savedState) {
            try {
                const combatState = JSON.parse(savedState);
                this.stage = combatState.stage || 1;
                this.maxStage = combatState.maxStage || 1;
                this.totalDamageDealt = combatState.totalDamageDealt || 0;
                this.totalDamageTaken = combatState.totalDamageTaken || 0;
                this.totalExpGained = combatState.totalExpGained || 0;
                this.totalGoldGained = combatState.totalGoldGained || 0;
                this.combatStartTime = combatState.combatStartTime || Date.now();
                
                // 如果之前在战斗中，自动恢复战斗
                if (combatState.isActive) {
                    setTimeout(() => {
                        this.startCombat();
                    }, 500); // 延迟500ms确保UI初始化完成
                }
            } catch (e) {
                console.error('加载战斗状态失败:', e);
            }
        }
    }

    // 清除战斗状态
    clearCombatState() {
        localStorage.removeItem('combatState');
    }
} 