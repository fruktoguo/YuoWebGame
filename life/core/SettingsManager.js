export class SettingsManager {
    constructor(game) {
        this.game = game;
        this.bindSettings();
    }

    bindSettings() {
        try {
            // 速度设置
            gameSettings.onSettingChange('speed', (value) => {
                this.game.speed = value;
            });
            this.game.speed = gameSettings.getSetting('speed') || 5;

            // 网格大小设置
            gameSettings.onSettingChange('cellSize', (value) => {
                this.game.cellSize = value;
                this.game.viewportCols = Math.floor(this.game.canvas.width / this.game.cellSize);
                this.game.viewportRows = Math.floor(this.game.canvas.height / this.game.cellSize);
                this.game.draw();
            });
            this.game.cellSize = gameSettings.getSetting('cellSize') || 20;

            // 游戏规则设置
            gameSettings.onSettingChange('survivalRule', (value) => {
                const [min, max] = value.split('-').map(Number);
                this.game.survivalMin = min;
                this.game.survivalMax = max;
            });
            const survivalRule = gameSettings.getSetting('survivalRule') || '2-3';
            const [min, max] = survivalRule.split('-').map(Number);
            this.game.survivalMin = min;
            this.game.survivalMax = max;

            gameSettings.onSettingChange('birthRule', (value) => {
                this.game.birthNeighbors = value;
            });
            this.game.birthNeighbors = gameSettings.getSetting('birthRule') || 3;

        } catch (error) {
            console.error('绑定设置时发生错误:', error);
            // 使用默认值
            this.game.speed = 5;
            this.game.cellSize = 20;
            this.game.survivalMin = 2;
            this.game.survivalMax = 3;
            this.game.birthNeighbors = 3;
        }
    }
} 