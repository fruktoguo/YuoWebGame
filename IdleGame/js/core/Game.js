// 游戏主控制器
class Game {
    constructor() {
        this.character = null;
        this.combat = null;
        this.equipment = null;
        this.skills = null;
        this.ui = {};
        
        this.gold = 0;
        this.gems = 0;
        this.currentStage = 1;
        this.settings = {
            autoSave: true,
            saveInterval: 30000, // 30秒
            notifications: true
        };
        
        this.gameLoop = null;
        this.lastUpdate = Date.now();
        this.isPaused = false;
    }

    // 初始化游戏
    async init() {
        try {
            console.log('正在初始化游戏...');
            
            // 加载存档
            await this.loadGame();
            
            // 初始化核心系统
            this.initializeSystems();
            
            // 初始化UI
            this.initializeUI();
            
            // 启动游戏循环
            this.startGameLoop();
            
            // 初始化自动存档
            if (this.settings.autoSave) {
                this.initAutoSave();
            }
            
            console.log('游戏初始化完成');
            Utils.showNotification('游戏已加载', 'success');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            Utils.showNotification('游戏初始化失败', 'error');
        }
    }

    // 初始化核心系统
    initializeSystems() {
        // 如果没有角色数据，创建新角色
        if (!this.character) {
            this.character = new Character('冒险者', 'warrior');
        }
        
        // 初始化其他系统
        this.equipment = new Equipment(this);
        this.skills = new Skills(this);
        this.combat = new Combat(this);
    }

    // 初始化UI
    initializeUI() {
        this.ui.character = new CharacterUI(this);
        this.ui.combat = new CombatUI(this);
        this.ui.equipment = new EquipmentUI(this);
        this.ui.skill = new SkillUI(this);
        
        // 初始化导航
        this.initializeNavigation();
        
        // 更新所有UI
        this.updateAllUI();
    }

    // 初始化导航系统
    initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const pages = document.querySelectorAll('.page');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPage = item.getAttribute('data-page');
                this.switchPage(targetPage);
                
                // 更新导航状态
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    // 切换页面
    switchPage(pageName) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // 触发页面特定的更新
            switch (pageName) {
                case 'character':
                    this.ui.character.update();
                    break;
                case 'equipment':
                    this.ui.equipment.update();
                    break;
                case 'skills':
                    this.ui.skill.update();
                    break;
            }
        }
    }

    // 启动游戏循环
    startGameLoop() {
        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                const now = Date.now();
                const deltaTime = (now - this.lastUpdate) / 1000;
                this.lastUpdate = now;
                
                this.update(deltaTime);
            }
        }, 100); // 10 FPS
    }

    // 游戏主更新循环
    update(deltaTime) {
        // 更新角色Buff
        if (this.character) {
            this.character.updateBuffs();
        }
        
        // 更新战斗系统
        if (this.combat) {
            this.combat.update(deltaTime);
        }
        
        // 更新技能冷却
        if (this.skills) {
            this.skills.updateCooldowns(deltaTime);
        }
        
        // 更新UI (节流更新)
        if (Math.random() < 0.1) { // 10%概率更新UI，避免频繁更新
            this.updateResourcesUI();
            // 更新战斗UI
            if (this.ui.combat) {
                this.ui.combat.update();
            }
        }
    }

    // 更新所有UI
    updateAllUI() {
        this.updateResourcesUI();
        
        // 更新各个页面UI
        Object.values(this.ui).forEach(ui => {
            if (ui.update) ui.update();
        });
    }

    // 更新资源UI
    updateResourcesUI() {
        const goldElement = document.getElementById('gold');
        const gemsElement = document.getElementById('gems');
        
        if (goldElement) goldElement.textContent = Utils.formatNumber(this.gold);
        if (gemsElement) gemsElement.textContent = Utils.formatNumber(this.gems);
    }



    // 加载游戏存档
    async loadGame() {
        try {
            const saveData = Storage.loadGame();
            if (saveData) {
                // 加载基础数据
                this.gold = saveData.gold || 0;
                this.gems = saveData.gems || 0;
                this.currentStage = saveData.currentStage || 1;
                this.settings = { ...this.settings, ...saveData.settings };
                
                // 加载角色数据
                if (saveData.character) {
                    this.character = new Character();
                    this.character.loadCharacterData(saveData.character);
                }
                
                console.log('存档加载成功');
            } else {
                console.log('没有找到存档，开始新游戏');
                this.startNewGame();
            }
        } catch (error) {
            console.error('加载存档失败:', error);
            this.startNewGame();
        }
    }

    // 开始新游戏
    startNewGame() {
        this.character = new Character('冒险者', 'warrior');
        this.gold = 100;
        this.gems = 0;
        this.currentStage = 1;
        
        // 给新玩家一些初始装备
        this.giveStarterEquipment();
    }

    // 给予初始装备
    giveStarterEquipment() {
        if (this.equipment) {
            // 生成一些基础装备
            const starterSlots = ['lefthand', 'chest', 'helmet'];
            starterSlots.forEach(slot => {
                const equipment = this.equipment.generateRandomEquipment(1, slot, 'common');
                this.equipment.addToInventory(equipment);
            });
        }
    }

    // 保存游戏
    saveGame() {
        try {
            const saveData = {
                gold: this.gold,
                gems: this.gems,
                currentStage: this.currentStage,
                settings: this.settings,
                character: this.character ? this.character.getCharacterData() : null,
                equipment: this.equipment ? this.equipment.getEquipmentData() : null,
                skills: this.skills ? this.skills.getSkillsData() : null,
                combat: this.combat ? this.combat.getCombatData() : null,
                timestamp: Date.now()
            };
            
            Storage.saveGame(saveData);
            console.log('游戏已保存');
        } catch (error) {
            console.error('保存游戏失败:', error);
        }
    }

    // 初始化自动存档
    initAutoSave() {
        setInterval(() => {
            this.saveGame();
        }, this.settings.saveInterval);
    }

    // 添加金币
    addGold(amount) {
        this.gold += amount;
        this.updateResourcesUI();
        
        if (this.settings.notifications) {
            Utils.showNotification(`+${amount} 金币`, 'gold');
        }
    }

    // 添加宝石
    addGems(amount) {
        this.gems += amount;
        this.updateResourcesUI();
        
        if (this.settings.notifications) {
            Utils.showNotification(`+${amount} 宝石`, 'gems');
        }
    }

    // 角色升级事件
    onCharacterLevelUp() {
        // 给予技能点
        this.skills.addSkillPoints(1);
        
        // 更新UI
        this.updateAllUI();
        
        // 显示升级效果
        Utils.showNotification(`升级到 ${this.character.level} 级！`, 'levelup');
    }

    // 敌人死亡事件
    onEnemyDeath(enemy) {
        // 给予经验和金币
        this.character.gainExp(enemy.expReward);
        this.addGold(enemy.goldReward);
        
        // 检查装备掉落
        const drops = enemy.getDrops();
        drops.forEach(item => {
            if (this.equipment.addToInventory(item)) {
                this.ui.combat.addLogEntry(`获得装备: ${item.name}`, 'equipment');
            }
        });
        
        // 进入下一关
        this.currentStage++;
        this.ui.combat.addLogEntry(`进入第 ${this.currentStage} 关`, 'stage');
        
        // 更新UI
        this.updateAllUI();
    }

    // 暂停游戏
    pause() {
        this.isPaused = true;
    }

    // 恢复游戏
    resume() {
        this.isPaused = false;
        this.lastUpdate = Date.now(); // 重置时间，避免大的deltaTime
    }

    // 销毁游戏
    destroy() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        // 保存游戏
        this.saveGame();
    }
}

// 全局游戏实例
let game = null; 