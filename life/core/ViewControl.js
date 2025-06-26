export class ViewControl {
    constructor(game) {
        this.game = game;
        this.bindEvents();
    }

    // 坐标转换方法
    screenToGrid(screenX, screenY) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = screenX - rect.left;
        const y = screenY - rect.top;
        return {
            x: Math.floor((x / this.game.scale + this.game.viewX) / this.game.cellSize),
            y: Math.floor((y / this.game.scale + this.game.viewY) / this.game.cellSize)
        };
    }

    gridToScreen(gridX, gridY) {
        return {
            x: (gridX * this.game.cellSize - this.game.viewX) * this.game.scale,
            y: (gridY * this.game.cellSize - this.game.viewY) * this.game.scale
        };
    }

    // 缩放处理
    handleWheel(e) {
        e.preventDefault();
        const rect = this.game.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 记录鼠标位置对应的世界坐标
        const worldX = (mouseX / this.game.scale) + this.game.viewX;
        const worldY = (mouseY / this.game.scale) + this.game.viewY;

        // 计算新的缩放比例
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.game.scale *= delta;
        this.game.scale = Math.max(0.1, Math.min(5, this.game.scale));

        // 调整视图位置，使鼠标指向的世界坐标保持不变
        this.game.viewX = worldX - (mouseX / this.game.scale);
        this.game.viewY = worldY - (mouseY / this.game.scale);

        this.game.draw();
    }

    // 事件处理
    bindEvents() {
        // 鼠标拖动事件
        this.game.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2) { // 中键或右键拖动
                e.preventDefault();
                this.game.isDragging = true;
                this.game.lastX = e.clientX;
                this.game.lastY = e.clientY;
                this.game.canvas.style.cursor = 'grabbing';
            } else if (e.button === 0) { // 左键绘制或放置图案
                const pos = this.screenToGrid(e.clientX, e.clientY);
                if (this.game.selectedPattern) {
                    this.game.addPatternAt(this.game.selectedPattern, pos.x, pos.y);
                } else {
                    this.game.setCell(pos.x, pos.y, !this.game.getCell(pos.x, pos.y));
                    this.game.draw();
                }
            }
        });

        this.game.canvas.addEventListener('mousemove', (e) => {
            if (this.game.isDragging) {
                const dx = e.clientX - this.game.lastX;
                const dy = e.clientY - this.game.lastY;
                this.game.viewX -= dx / this.game.scale;
                this.game.viewY -= dy / this.game.scale;
                this.game.lastX = e.clientX;
                this.game.lastY = e.clientY;
                this.game.draw();
            }
        });

        this.game.canvas.addEventListener('mouseup', () => {
            this.game.isDragging = false;
            this.game.canvas.style.cursor = 'default';
        });

        this.game.canvas.addEventListener('mouseleave', () => {
            this.game.isDragging = false;
            this.game.canvas.style.cursor = 'default';
        });

        // 阻止右键菜单
        this.game.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 添加缩放支持
        this.game.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    }
} 