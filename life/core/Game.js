export class Game {
    constructor(canvas, cellSize = 20) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = cellSize;
        this.running = false;
        this.speed = 5;

        // 游戏规则设置
        this.survivalMin = 2;
        this.survivalMax = 3;
        this.birthNeighbors = 3;
        this.randomDensity = 30;

        // 视图状态
        this.viewX = 0;
        this.viewY = 0;
        this.scale = 1;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;

        // 设置画布大小
        this.canvas.width = Math.floor(window.innerWidth * 0.6);
        this.canvas.height = Math.floor(window.innerHeight * 0.7);

        // 无限网格实现
        this.cells = new Map();
        this.nextCells = new Map();

        // 视口范围
        this.viewportCols = Math.floor(this.canvas.width / this.cellSize);
        this.viewportRows = Math.floor(this.canvas.height / this.cellSize);
    }

    // 细胞状态管理
    getCell(x, y) {
        return this.cells.get(`${x},${y}`) || 0;
    }

    setCell(x, y, value) {
        if (value) {
            this.cells.set(`${x},${y}`, 1);
        } else {
            this.cells.delete(`${x},${y}`);
        }
    }

    setNextCell(x, y, value) {
        if (value) {
            this.nextCells.set(`${x},${y}`, 1);
        } else {
            this.nextCells.delete(`${x},${y}`);
        }
    }

    // 游戏逻辑
    update() {
        try {
            this.nextCells.clear();
            const activeCells = new Set();

            // 收集所有活细胞及其邻居的坐标
            for (let pos of this.cells.keys()) {
                const [x, y] = pos.split(',').map(Number);
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        activeCells.add(`${x + i},${y + j}`);
                    }
                }
            }

            // 对所有可能变化的细胞进行计算
            for (let pos of activeCells) {
                const [x, y] = pos.split(',').map(Number);
                let neighbors = 0;

                // 统计邻居数量
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        if (this.getCell(x + i, y + j)) {
                            neighbors++;
                        }
                    }
                }

                // 应用生命游戏规则
                const cell = this.getCell(x, y);
                if (cell && (neighbors >= this.survivalMin && neighbors <= this.survivalMax)) {
                    this.setNextCell(x, y, 1);
                } else if (!cell && neighbors === this.birthNeighbors) {
                    this.setNextCell(x, y, 1);
                }
            }

            // 更新状态
            [this.cells, this.nextCells] = [this.nextCells, this.cells];
        } catch (error) {
            console.error('更新游戏状态时发生错误:', error);
            this.running = false; // 停止游戏
        }
    }

    draw() {
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 保存当前转换状态
            this.ctx.save();
            
            // 应用缩放和平移
            this.ctx.translate(-this.viewX * this.scale, -this.viewY * this.scale);
            this.ctx.scale(this.scale, this.scale);

            // 计算可见区域的网格范围
            const startX = Math.floor(this.viewX / this.cellSize);
            const startY = Math.floor(this.viewY / this.cellSize);
            const endX = startX + Math.ceil(this.canvas.width / (this.cellSize * this.scale));
            const endY = startY + Math.ceil(this.canvas.height / (this.cellSize * this.scale));

            // 绘制网格线
            this.ctx.beginPath();
            this.ctx.strokeStyle = gameSettings.getSetting('gridColor') || '#ddd';
            this.ctx.lineWidth = 0.5 / this.scale;
            
            // 垂直线
            for (let x = startX; x <= endX; x++) {
                this.ctx.moveTo(x * this.cellSize, startY * this.cellSize);
                this.ctx.lineTo(x * this.cellSize, endY * this.cellSize);
            }
            
            // 水平线
            for (let y = startY; y <= endY; y++) {
                this.ctx.moveTo(startX * this.cellSize, y * this.cellSize);
                this.ctx.lineTo(endX * this.cellSize, y * this.cellSize);
            }
            
            this.ctx.stroke();

            // 绘制活细胞
            this.ctx.fillStyle = gameSettings.getSetting('cellColor') || '#4CAF50';
            for (let pos of this.cells.keys()) {
                const [x, y] = pos.split(',').map(Number);
                if (x >= startX && x <= endX && y >= startY && y <= endY) {
                    this.ctx.fillRect(
                        x * this.cellSize + 1,
                        y * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }

            // 恢复转换状态
            this.ctx.restore();
        } catch (error) {
            console.error('绘制游戏画面时发生错误:', error);
        }
    }

    clear() {
        this.cells.clear();
        this.draw();
    }

    randomize() {
        this.clear();
        const range = 50;
        for (let y = -range/2; y < range/2; y++) {
            for (let x = -range/2; x < range/2; x++) {
                if (Math.random() * 100 < this.randomDensity) {
                    this.setCell(x, y, 1);
                }
            }
        }
        this.draw();
    }

    run() {
        if (!this.running) return;
        this.update();
        this.draw();
        setTimeout(() => requestAnimationFrame(() => this.run()), 1000 / this.speed);
    }

    togglePlay() {
        this.running = !this.running;
        if (this.running) {
            this.run();
        }
    }
} 