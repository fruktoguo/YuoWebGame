// 开发者调试工具

// 角色相关测试函数
function debugAddExp() {
    const expInput = document.getElementById('exp-input');
    const exp = parseInt(expInput.value) || 100;
    
    if (window.game && window.game.character) {
        window.game.character.gainExp(exp);
        console.log(`添加了 ${exp} 经验值`);
    }
}

function debugAddGold() {
    const goldInput = document.getElementById('gold-input');
    const gold = parseInt(goldInput.value) || 1000;
    
    if (window.game && window.game.character) {
        window.game.character.gold += gold;
        console.log(`添加了 ${gold} 金币`);
    }
}

function debugAddGems() {
    const gemsInput = document.getElementById('gems-input');
    const gems = parseInt(gemsInput.value) || 100;
    
    if (window.game && window.game.character) {
        window.game.character.gems += gems;
        console.log(`添加了 ${gems} 宝石`);
    }
}

function debugLevelUp() {
    if (window.game && window.game.character) {
        window.game.character.levelUp();
        console.log('角色强制升级');
    }
}

function debugFullHeal() {
    if (window.game && window.game.character) {
        window.game.character.currentHP = window.game.character.maxHP;
        window.game.character.currentMP = window.game.character.maxMP;
        console.log('角色完全恢复');
    }
}

function debugResetAttributes() {
    if (window.game && window.game.character) {
        const totalPoints = Object.values(window.game.character.allocatedAttributes).reduce((sum, val) => sum + val, 0);
        
        window.game.character.allocatedAttributes = {
            strength: 0,
            agility: 0,
            intelligence: 0,
            spirit: 0,
            stamina: 0
        };
        
        window.game.character.freePoints += totalPoints;
        window.game.character.calculateFinalStats();
        
        console.log(`重置属性点，返还 ${totalPoints} 个自由属性点`);
    }
}

function debugResetSkillPoints() {
    if (window.game && window.game.ui && window.game.ui.skill) {
        window.game.ui.skill.resetSkillPoints();
        console.log('技能点已重置');
    } else if (window.skillUI) {
        window.skillUI.resetSkillPoints();
        console.log('技能点已重置');
    } else {
        console.log('技能UI未找到');
    }
}

// 装备相关测试函数
function debugGenerateEquipment() {
    const slotSelect = document.getElementById('equipment-slot');
    const qualitySelect = document.getElementById('equipment-quality');
    const levelInput = document.getElementById('equipment-level');
    
    const slot = slotSelect.value;
    const quality = qualitySelect.value;
    const level = parseInt(levelInput.value) || 1;
    
    if (window.game && window.game.equipment) {
        const equipment = window.game.equipment.generateRandomEquipment(level, slot, quality);
        if (equipment) {
            window.game.equipment.addToInventory(equipment);
            console.log(`生成了 ${quality} 品质的 ${slot} 装备 (等级 ${level})`);
        }
    }
}

function debugClearInventory() {
    if (confirm('确定要清空背包吗？')) {
        if (window.game && window.game.equipment) {
            window.game.equipment.inventory = [];
            console.log('背包已清空');
        }
    }
}

function debugFillInventory() {
    if (window.game && window.game.equipment) {
        const slots = ['helmet', 'chest', 'pants', 'boots', 'gloves', 'lefthand', 'righthand', 'necklace', 'ring1', 'belt'];
        const qualities = ['common', 'magic', 'rare', 'epic', 'legendary'];
        
        for (let i = 0; i < 20; i++) {
            const slot = slots[Math.floor(Math.random() * slots.length)];
            const quality = qualities[Math.floor(Math.random() * qualities.length)];
            const level = Math.floor(Math.random() * 10) + 1;
            
            const equipment = window.game.equipment.generateRandomEquipment(level, slot, quality);
            if (equipment) {
                window.game.equipment.addToInventory(equipment);
            }
        }
        console.log('背包已填满随机装备');
    }
}

// 材料相关测试函数
function debugAddMaterial() {
    const typeSelect = document.getElementById('material-type');
    const countInput = document.getElementById('material-count');
    
    const type = typeSelect.value;
    const count = parseInt(countInput.value) || 10;
    
    console.log(`添加了 ${count} 个 ${type} 材料`);
}

// 系统相关测试函数
function debugPrintSave() {
    console.log('=== 内存中的游戏数据 ===');
    if (window.game) {
        const saveData = {
            character: window.game.character.getCharacterData(),
            equipment: window.game.equipment.getEquipmentData(),
            skills: window.game.skills.getSkillsData(),
            combat: window.game.combat.getCombatData()
        };
        console.log('当前游戏状态:', JSON.stringify(saveData, null, 2));
    }
    
    console.log('=== localStorage中的存档数据 ===');
    debugCheckLocalStorage();
}

function debugCheckLocalStorage() {
    const saveData = localStorage.getItem('idleGame_save');
    if (saveData) {
        console.log('本地存储数据:', JSON.parse(saveData));
    } else {
        console.log('未找到本地存储数据');
    }
}

function debugClearSave() {
    if (confirm('确定要清除存档吗？这将删除所有游戏数据并重新加载页面！')) {
        // 清除存档
        localStorage.removeItem('idleGame_save');
        console.log('存档已清除');
        
        // 刷新页面让游戏重新开始
        location.reload();
    }
}

function debugSaveGame() {
    if (window.game) {
        window.game.saveGame();
        console.log('游戏已手动保存');
    }
}

function debugToggleAutoSave() {
    if (window.game) {
        if (window.game.autoSaveTimer) {
            window.game.stopAutoSave();
            console.log('自动保存已关闭');
        } else {
            window.game.startAutoSave();
            console.log('自动保存已开启');
        }
    }
}

function debugShowGameInfo() {
    if (window.game) {
        const stats = window.game.getGameStats();
        console.log('游戏信息:', stats);
        
        console.log('=== 游戏状态信息 ===');
        console.log(`角色等级: ${stats.character.level}`);
        console.log(`经验值: ${stats.character.exp}`);
        console.log(`金币: ${stats.character.gold}`);
        console.log(`宝石: ${stats.character.gems}`);
        console.log(`当前关卡: ${stats.combat.stage}`);
        console.log(`背包物品数: ${stats.equipment.inventoryCount}`);
        console.log(`已装备物品数: ${stats.equipment.equippedCount}`);
    }
}

// 战斗相关测试函数
function debugKillEnemy() {
    if (window.game && window.game.combat) {
        const currentEnemy = window.game.combat.getCurrentEnemy();
        if (currentEnemy) {
            currentEnemy.currentHP = 0;
            console.log(`击败了当前敌人: ${currentEnemy.name}`);
        } else {
            console.log('当前没有敌人');
        }
    }
}

function debugNextStage() {
    if (window.game && window.game.combat) {
        window.game.combat.stage++;
        window.game.combat.generateStage();
        console.log(`跳到第 ${window.game.combat.stage} 关`);
    }
}

function debugJumpToStage() {
    const stageInput = document.getElementById('stage-input');
    const stage = parseInt(stageInput.value) || 1;
    
    if (window.game && window.game.combat) {
        window.game.combat.jumpToStage(stage);
        console.log(`跳转到第 ${stage} 关`);
    }
}

// 战斗控制调试功能
function debugStartCombat() {
    if (window.game && window.game.combat) {
        window.game.combat.startCombat();
        console.log('开始战斗');
    }
}

function debugStopCombat() {
    if (window.game && window.game.combat) {
        window.game.combat.stopCombat();
        console.log('停止战斗');
    }
}

function debugPauseCombat() {
    if (window.game && window.game.combat) {
        if (window.game.combat.isPaused) {
            window.game.combat.resume();
            console.log('恢复战斗');
        } else {
            window.game.combat.pause();
            console.log('暂停战斗');
        }
    }
}

// 显示当前敌人信息
function debugShowEnemyInfo() {
    if (window.game && window.game.combat) {
        const enemies = window.game.combat.currentEnemies;
        const currentIndex = window.game.combat.currentEnemyIndex;
        
        console.log('=== 当前关卡敌人信息 ===');
        console.log(`关卡: ${window.game.combat.stage}`);
        console.log(`剩余敌人: ${enemies.length}/${window.game.combat.totalEnemies}`);
        console.log(`DPS: ${window.game.combat.dps}`);
    }
}