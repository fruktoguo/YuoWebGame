// 游戏主入口文件
// 全局游戏实例
let game = null;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 创建游戏实例
        game = new Game();
        
        // 初始化游戏
        await game.init();
        
        // 设置全局引用
        window.game = game;
        
        console.log('游戏启动成功');
        
    } catch (error) {
        console.error('游戏启动失败:', error);
        
        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
        `;
        errorDiv.innerHTML = `
            <h2>游戏加载失败</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()">重新加载</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// 页面关闭前保存游戏
window.addEventListener('beforeunload', () => {
    if (game) {
        game.saveGame();
    }
});

// 处理页面可见性变化（后台/前台切换）
document.addEventListener('visibilitychange', () => {
    if (game) {
        if (document.hidden) {
            // 页面进入后台，暂停游戏
            game.pauseGame();
        } else {
            // 页面回到前台，恢复游戏
            game.resumeGame();
        }
    }
});

// 全局函数，供HTML调用
function allocatePoint(statName) {
    if (game && game.character) {
        if (game.character.allocatePoint(statName)) {
            game.updateAllUI();
        }
    }
}

// 测试函数 - 开发时使用
function testFunctions() {
    if (!game) {
        console.log('游戏未初始化');
        return;
    }
    
    console.log('=== 游戏测试函数 ===');
    console.log('addGold(1000) - 添加1000金币');
    console.log('addExp(100) - 添加100经验');
    console.log('generateEquipment() - 生成随机装备');
    console.log('levelUp() - 强制升级');
    console.log('resetGame() - 重置游戏');
}

// 测试用函数
function addGold(amount) {
    if (game) {
        game.addGold(amount);
    }
}

function addExp(amount) {
    if (game && game.character) {
        game.character.gainExp(amount);
        game.updateAllUI();
    }
}

function generateEquipment() {
    if (game && game.equipment) {
        const slots = game.equipment.slots;
        const randomSlot = Utils.randomChoice(slots);
        const equipment = game.equipment.generateRandomEquipment(
            game.character.level, 
            randomSlot
        );
        game.equipment.addToInventory(equipment);
        game.updateAllUI();
        console.log('生成装备:', equipment);
    }
}

function levelUp() {
    if (game && game.character) {
        const requiredExp = Calculator.calculateExpRequired(game.character.level);
        game.character.gainExp(requiredExp);
        game.updateAllUI();
    }
}

function resetGame() {
    if (confirm(T('confirm.resetGame'))) {
        localStorage.removeItem('idleGame_save');
        location.reload();
    }
}

// 暴露测试函数到全局
window.testFunctions = testFunctions;
window.addGold = addGold;
window.addExp = addExp;
window.generateEquipment = generateEquipment;
window.levelUp = levelUp;
window.resetGame = resetGame; 