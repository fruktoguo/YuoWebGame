import { Game } from './core/Game.js';
import { ViewControl } from './core/ViewControl.js';
import { PatternManager } from './core/PatternManager.js';
import { SettingsManager } from './core/SettingsManager.js';

class GameOfLife extends Game {
    constructor(canvas) {
        super(canvas);
        
        // 初始化各个管理器
        this.viewControl = new ViewControl(this);
        this.patternManager = new PatternManager(this);
        this.settingsManager = new SettingsManager(this);
        
        // 初始绘制
        this.draw();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new GameOfLife(canvas);
    
    // 按钮事件
    document.getElementById('startBtn').addEventListener('click', () => {
        game.togglePlay();
    });
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        game.clear();
    });
    
    document.getElementById('randomBtn').addEventListener('click', () => {
        game.randomize();
    });
}); 