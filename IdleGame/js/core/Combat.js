// 战斗系统类
class Combat {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.currentEnemy = null;
        this.stage = 1;
        this.autoMode = true;
        this.lastAttackTime = 0;
        this.attackInterval = 1000; // 1秒攻击一次
    }

    // 开始战斗
    startCombat() {
        if (!this.currentEnemy) {
            this.generateEnemy();
        }
        this.isActive = true;
    }

    // 停止战斗
    stopCombat() {
        this.isActive = false;
    }

    // 生成敌人
    generateEnemy() {
        const enemyTypes = [
            { name: '骷髅战士', icon: '💀', baseHP: 50, baseAttack: 8 },
            { name: '树皮怪', icon: '🌳', baseHP: 80, baseAttack: 6 },
            { name: '石头人', icon: '🗿', baseHP: 120, baseAttack: 10 },
            { name: '火焰精灵', icon: '🔥', baseHP: 60, baseAttack: 12 }
        ];

        const enemyType = Utils.randomChoice(enemyTypes);
        const level = Math.max(1, this.stage + Utils.randomInt(-2, 2));
        
        this.currentEnemy = {
            name: enemyType.name,
            icon: enemyType.icon,
            level: level,
            maxHP: Math.floor(enemyType.baseHP * (1 + (level - 1) * 0.3)),
            attack: Math.floor(enemyType.baseAttack * (1 + (level - 1) * 0.2)),
            defense: Math.floor(5 * (1 + (level - 1) * 0.15)),
            magicResist: Math.floor(3 * (1 + (level - 1) * 0.15))
        };
        
        this.currentEnemy.currentHP = this.currentEnemy.maxHP;
    }

    // 更新战斗
    update(deltaTime) {
        if (!this.isActive || !this.currentEnemy) return;

        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackInterval) {
            this.performAttack();
            this.lastAttackTime = now;
        }
    }

    // 执行攻击
    performAttack() {
        if (!this.game.character.isAlive() || !this.currentEnemy) return;

        // 玩家攻击敌人
        const playerDamage = Calculator.calculateDamage(this.game.character, this.currentEnemy);
        this.currentEnemy.currentHP -= playerDamage.damage;

        this.addCombatLog(`你对 ${this.currentEnemy.name} 造成了 ${playerDamage.damage} 点伤害${playerDamage.isCrit ? ' (暴击!)' : ''}`);

        // 检查敌人是否死亡
        if (this.currentEnemy.currentHP <= 0) {
            this.onEnemyDeath();
            return;
        }

        // 敌人攻击玩家
        const enemyDamage = Calculator.calculateDamage(this.currentEnemy, this.game.character);
        const isDead = this.game.character.takeDamage(enemyDamage.damage);

        this.addCombatLog(`${this.currentEnemy.name} 对你造成了 ${enemyDamage.damage} 点伤害${enemyDamage.isCrit ? ' (暴击!)' : ''}`);

        if (isDead) {
            this.onPlayerDeath();
        }
    }

    // 敌人死亡处理
    onEnemyDeath() {
        this.addCombatLog(`${this.currentEnemy.name} 被击败了！`);
        
        // 触发游戏的敌人死亡事件
        this.game.onEnemyDeath(this.currentEnemy);
        
        // 生成新敌人
        this.generateEnemy();
        
        // 有概率进入下一关
        if (Math.random() < 0.1) { // 10%概率
            this.stage++;
            this.addCombatLog(`进入第 ${this.stage} 关！`);
        }
    }

    // 玩家死亡处理
    onPlayerDeath() {
        this.addCombatLog('你被击败了！');
        this.stopCombat();
        
        // 复活玩家
        setTimeout(() => {
            this.game.character.currentHP = this.game.character.maxHP;
            this.addCombatLog('你复活了！');
            if (this.autoMode) {
                this.startCombat();
            }
        }, 3000);
    }

    // 添加战斗日志
    addCombatLog(message) {
        const logContainer = document.getElementById('combat-log');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = message;

        logContainer.appendChild(logEntry);

        // 保持最多50条日志
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }

        // 滚动到底部
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // 获取当前敌人信息
    getCurrentEnemy() {
        return this.currentEnemy;
    }

    // 设置自动模式
    setAutoMode(enabled) {
        this.autoMode = enabled;
        if (enabled && !this.isActive) {
            this.startCombat();
        } else if (!enabled) {
            this.stopCombat();
        }
    }

    // 获取DPS统计
    getDPS() {
        // 简单计算，实际可以更复杂
        const character = this.game.character;
        const avgDamage = (character.physicalAttack + character.magicalAttack) / 2;
        const attackSpeed = 1000 / this.attackInterval; // 每秒攻击次数
        return Math.floor(avgDamage * attackSpeed);
    }

    // 获取经验/小时
    getExpPerHour() {
        if (!this.currentEnemy) return 0;
        const expPerKill = Math.floor(this.currentEnemy.level * 10);
        const killsPerHour = 3600 / (this.attackInterval / 1000 * 5); // 假设5次攻击击杀
        return Math.floor(expPerKill * killsPerHour);
    }

    // 获取金币/小时
    getGoldPerHour() {
        if (!this.currentEnemy) return 0;
        const goldPerKill = Math.floor(this.currentEnemy.level * 5);
        const killsPerHour = 3600 / (this.attackInterval / 1000 * 5);
        return Math.floor(goldPerKill * killsPerHour);
    }

    // 暂停战斗
    pause() {
        this.isPaused = true;
    }

    // 恢复战斗
    resume() {
        this.isPaused = false;
    }

    // 获取战斗数据
    getCombatData() {
        return {
            stage: this.stage,
            autoMode: this.autoMode,
            isActive: this.isActive
        };
    }

    // 加载战斗数据
    loadCombatData(data) {
        if (data.stage) this.stage = data.stage;
        if (data.autoMode !== undefined) this.autoMode = data.autoMode;
        if (data.isActive !== undefined) this.isActive = data.isActive;
    }
} 