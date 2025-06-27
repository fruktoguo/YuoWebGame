// 游戏主控制器
class Game {
    constructor() {
        this.isInitialized = false;
        this.lastUpdate = 0;
        this.gameLoop = null;
        
        // 游戏组件
        this.character = null;
        this.equipment = null;
        this.skills = null;
        this.combat = null;
        
        // UI组件
        this.characterUI = null;
        this.equipmentUI = null;
        this.skillUI = null;
        this.combatUI = null;
        
        // 游戏设置
        this.autoSaveInterval = 30000; // 30秒自动保存
        this.autoSaveTimer = null;
        
        this.gold = 0;
        this.gems = 0;
        this.currentStage = 1;
        this.settings = {
            autoSave: true,
            saveInterval: 30000, // 30秒
            notifications: true
        };
    }

    // 初始化游戏
    async init() {
        try {
            console.log('游戏初始化开始...');
            
            // 初始化游戏组件
            this.initComponents();
            
            // 初始化UI组件
            this.initUI();
            
            // 加载游戏数据
            this.loadGame();
            
            // 启动游戏循环
            this.startGameLoop();
            
            // 启动自动保存
            this.startAutoSave();
            
            // 绑定页面事件
            this.bindEvents();
            
            this.isInitialized = true;
            console.log('游戏初始化完成！');
            
            // 如果开启了自动战斗，开始战斗
            if (this.combat.autoMode) {
                this.combat.startCombat();
            }
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
        }
    }

    // 初始化游戏组件
    initComponents() {
        this.character = new Character();
        this.equipment = new Equipment(this);
        this.skills = new Skills(this);
        this.combat = new Combat(this);
    }

    // 初始化UI组件
    initUI() {
        this.characterUI = new CharacterUI(this);
        this.equipmentUI = new EquipmentUI(this);
        this.skillUI = new SkillUI(this.skills);
        this.combatUI = new CombatUI(this);
        
        // 创建ui对象来组织所有UI组件
        this.ui = {
            character: this.characterUI,
            equipment: this.equipmentUI,
            skill: this.skillUI,
            combat: this.combatUI
        };
        
        // 将UI组件设为全局变量，便于调试和访问
        window.characterUI = this.characterUI;
        window.equipmentUI = this.equipmentUI;
        window.skillUI = this.skillUI;
        window.combatUI = this.combatUI;
    }

    // 绑定页面事件
    bindEvents() {
        // 绑定导航切换
        this.bindNavigation();
        
        // 绑定窗口事件
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });
        
        // 绑定可见性变化事件
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGame();
            }
        });
    }

    // 绑定导航
    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const pages = document.querySelectorAll('.page');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPage = item.dataset.page;
                
                // 更新导航状态
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // 更新页面显示
                pages.forEach(page => page.classList.remove('active'));
                const targetPageElement = document.getElementById(`${targetPage}-page`);
                if (targetPageElement) {
                    targetPageElement.classList.add('active');
                }
                
                // 更新对应的UI
                this.updatePageUI(targetPage);
            });
        });
    }

    // 更新页面UI
    updatePageUI(pageName) {
            switch (pageName) {
                case 'character':
                this.characterUI.update();
                    break;
                case 'equipment':
                this.equipmentUI.update();
                    break;
                case 'skills':
                this.skillUI.update();
                break;
            case 'combat':
                this.combatUI.update();
                    break;
        }
    }

    // 启动游戏循环
    startGameLoop() {
        this.lastUpdate = performance.now();
        this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
    }

    // 游戏更新循环
    update(timestamp) {
        if (!this.isInitialized) return;
        
        const deltaTime = timestamp - this.lastUpdate;
        this.lastUpdate = timestamp;

        // 更新游戏组件
        this.character.update(deltaTime);
            this.combat.update(deltaTime);
        
        // 更新UI（降低频率以提高性能）
        if (timestamp % 100 < deltaTime) { // 大约每100ms更新一次UI
            this.updateUI();
        }

        // 继续游戏循环
        this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
    }

    // 更新所有UI
    updateUI() {
        // 更新资源显示
        this.updateResourceDisplay();
        
        // 更新当前活跃页面的UI
        const activePage = document.querySelector('.nav-item.active');
        if (activePage) {
            this.updatePageUI(activePage.dataset.page);
        }
    }

    // 更新资源显示
    updateResourceDisplay() {
        const goldElement = document.getElementById('gold');
        const gemsElement = document.getElementById('gems');
        
        if (goldElement && this.character) {
            goldElement.textContent = Utils.formatNumber(this.character.gold || 0);
        }
        
        if (gemsElement && this.character) {
            gemsElement.textContent = Utils.formatNumber(this.character.gems || 0);
        }
    }

    // 启动自动保存
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.saveGame();
        }, this.autoSaveInterval);
    }

    // 停止自动保存
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // 保存游戏
    saveGame() {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                character: this.character.getCharacterData(),
                equipment: this.equipment.getEquipmentData(),
                skills: this.skills.getSkillsData(),
                combat: this.combat.getCombatData()
            };

            Storage.saveGame(saveData);
            console.log('游戏保存成功');
            
        } catch (error) {
            console.error('游戏保存失败:', error);
        }
    }

    // 加载游戏
    loadGame() {
        try {
            const saveData = Storage.loadGame();
            
            if (saveData) {
                console.log('正在加载游戏数据...');
                
                // 加载角色数据
                if (saveData.character) {
                    this.character.loadCharacterData(saveData.character);
                }
                
                // 加载装备数据
                if (saveData.equipment) {
                    this.equipment.loadEquipmentData(saveData.equipment);
                }
                
                // 加载技能数据
                if (saveData.skills) {
                    this.skills.loadSkillsData(saveData.skills);
                    // 让SkillUI也加载技能数据
                    if (this.skillUI && saveData.skills.skillUI) {
                        this.skillUI.loadSkillData(saveData.skills.skillUI);
                    }
                }
                
                // 加载战斗数据
                if (saveData.combat) {
                    this.combat.loadCombatData(saveData.combat);
                }
                
                // 加载战斗状态（关卡进度和自动战斗）
                this.combat.loadCombatState();
                
                console.log('游戏数据加载完成');
            } else {
                console.log('未找到存档，开始新游戏');
                this.startNewGame();
            }
            
        } catch (error) {
            console.error('游戏加载失败:', error);
            this.startNewGame();
        }
    }

    // 开始新游戏
    startNewGame() {
        console.log('开始新游戏...');
        
        // 重置所有组件到初始状态
        this.character.reset();
        this.equipment.reset();
        this.skills.resetSkills();
        
        // 重置战斗状态
        this.combat.isActive = false;
        this.combat.currentEnemies = [];
        this.combat.currentEnemyIndex = 0;
        this.combat.stage = 1;
        
        // 设置初始装备
        this.giveStarterEquipment();
        
        console.log('新游戏初始化完成');
    }

    // 给予新手装备
    giveStarterEquipment() {
            // 生成一些基础装备
        const starterEquipment = [
            { slot: 'lefthand', level: 1, quality: 'common' },
            { slot: 'chest', level: 1, quality: 'common' },
            { slot: 'pants', level: 1, quality: 'common' },
            { slot: 'boots', level: 1, quality: 'common' }
        ];

        starterEquipment.forEach(item => {
            const equipment = this.equipment.generateRandomEquipment(item.level, item.slot, item.quality);
            if (equipment) {
                this.equipment.addToInventory(equipment);
            }
            });
    }

    // 重置游戏
    resetGame() {
        if (confirm('确定要重置游戏吗？这将删除所有进度！')) {
            Storage.clearSave();
            location.reload();
        }
    }

    // 暂停游戏
    pauseGame() {
        this.combat.pause();
        this.stopAutoSave();
    }

    // 恢复游戏
    resumeGame() {
        this.combat.resume();
        this.startAutoSave();
    }

    // 获取游戏统计
    getGameStats() {
        return {
            character: {
                level: this.character.level,
                exp: this.character.exp,
                gold: this.character.gold,
                gems: this.character.gems
            },
            combat: {
                stage: this.combat.stage,
                isActive: this.combat.isActive
            },
            equipment: {
                inventoryCount: this.equipment.inventory.length,
                equippedCount: Object.keys(this.equipment.equipped).filter(slot => this.equipment.equipped[slot]).length
            },
            skills: {
                skillPoints: this.skills.points
            }
        };
    }

    // 处理敌人死亡事件（兼容旧版本）
    onEnemyDeath(enemy) {
        // 这个方法现在由Combat类直接处理
        // 保留接口以防兼容性问题
        console.log(`敌人 ${enemy.name} 死亡事件已由Combat类处理`);
    }

    // 销毁游戏实例
    destroy() {
        // 停止游戏循环
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        // 停止自动保存
        this.stopAutoSave();
        
        // 保存游戏
        this.saveGame();
        
        // 清理组件
        this.character = null;
        this.equipment = null;
        this.skills = null;
        this.combat = null;
        
        this.isInitialized = false;
        console.log('游戏实例已销毁');
    }
} 