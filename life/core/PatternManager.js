export class PatternManager {
    constructor(game) {
        this.game = game;
        this.patternCategories = [];
        this.selectedPattern = null;
        this.loadPatterns();
        this.bindEvents();
    }

    async loadPatterns() {
        try {
            const categories = ['basic', 'oscillators', 'special'];
            const responses = await Promise.all(
                categories.map(category => 
                    fetch(`patterns/${category}.json`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`加载${category}图案失败`);
                        }
                        return response.json();
                    })
                )
            );

            this.patternCategories = responses;
            this.updatePatternsPanel();
        } catch (error) {
            console.error('加载图案错误:', error);
            const patternsContainer = document.getElementById('patterns');
            if (patternsContainer) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = '加载预设图形失败，请确保patterns目录下的JSON文件存在';
                patternsContainer.innerHTML = '';
                patternsContainer.appendChild(errorMsg);
            }
        }
    }

    addPatternAt(pattern, startX, startY) {
        try {
            // 计算图案的中心点偏移
            const offsetX = Math.floor(pattern[0].length / 2);
            const offsetY = Math.floor(pattern.length / 2);
            
            // 清除当前选中的图案
            this.selectedPattern = null;
            this.updatePatternButtons();

            // 添加图案到网格
            for (let y = 0; y < pattern.length; y++) {
                for (let x = 0; x < pattern[0].length; x++) {
                    if (pattern[y][x]) {
                        const gridX = startX - offsetX + x;
                        const gridY = startY - offsetY + y;
                        this.game.setCell(gridX, gridY, 1);
                    }
                }
            }

            // 立即重绘画布
            this.game.draw();
        } catch (error) {
            console.error('添加图案时发生错误:', error);
        }
    }

    drawPatternPreview(canvas, pattern) {
        const ctx = canvas.getContext('2d');
        const cellSize = Math.min(
            canvas.width / (pattern[0].length + 2),
            canvas.height / (pattern.length + 2)
        );
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const offsetX = (canvas.width - pattern[0].length * cellSize) / 2;
        const offsetY = (canvas.height - pattern.length * cellSize) / 2;
        
        ctx.fillStyle = '#4CAF50';
        pattern.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    ctx.fillRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize - 1,
                        cellSize - 1
                    );
                }
            });
        });
    }

    updatePatternsPanel() {
        const container = document.getElementById('patterns');
        container.innerHTML = '';

        this.patternCategories.forEach((category, categoryIndex) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'pattern-category';

            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = category.title;
            
            const categoryInfo = document.createElement('div');
            categoryInfo.className = 'category-info';
            categoryInfo.title = category.description;
            categoryInfo.textContent = 'ℹ';

            categoryHeader.appendChild(categoryTitle);
            categoryHeader.appendChild(categoryInfo);
            categoryDiv.appendChild(categoryHeader);

            const patternsDiv = document.createElement('div');
            patternsDiv.className = 'patterns-grid';

            Object.entries(category.patterns).forEach(([key, pattern]) => {
                const patternButton = document.createElement('button');
                patternButton.className = 'pattern-button';
                patternButton.title = pattern.description;
                patternButton.draggable = true;
                
                const patternName = document.createElement('span');
                patternName.textContent = pattern.name;
                
                const patternPreview = document.createElement('canvas');
                patternPreview.width = 60;
                patternPreview.height = 60;
                this.drawPatternPreview(patternPreview, pattern.pattern);

                patternButton.appendChild(patternName);
                patternButton.appendChild(patternPreview);

                // 点击选择图案
                patternButton.addEventListener('click', () => {
                    this.selectedPattern = pattern.pattern;
                    this.updatePatternButtons();
                    patternButton.classList.add('selected');
                });

                // 拖拽事件
                patternButton.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        categoryIndex: categoryIndex,
                        pattern: key
                    }));
                    patternButton.classList.add('dragging');
                });

                patternButton.addEventListener('dragend', () => {
                    patternButton.classList.remove('dragging');
                });

                patternsDiv.appendChild(patternButton);
            });

            categoryDiv.appendChild(patternsDiv);
            container.appendChild(categoryDiv);
        });
    }

    updatePatternButtons() {
        document.querySelectorAll('.pattern-button').forEach(button => {
            button.classList.remove('selected');
        });
    }

    bindEvents() {
        // 空格键控制和ESC取消选择
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.game.togglePlay();
            } else if (e.code === 'Escape') {
                this.selectedPattern = null;
                this.updatePatternButtons();
            }
        });

        // 拖拽预设图形
        this.game.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.game.canvas.style.opacity = '0.7';
        });

        this.game.canvas.addEventListener('dragleave', () => {
            this.game.canvas.style.opacity = '1';
        });

        this.game.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.game.canvas.style.opacity = '1';
            
            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const category = this.patternCategories[data.categoryIndex];
                if (category && category.patterns[data.pattern]) {
                    const pattern = category.patterns[data.pattern];
                    const pos = this.game.viewControl.screenToGrid(e.clientX, e.clientY);
                    this.addPatternAt(pattern.pattern, pos.x, pos.y);
                }
            } catch (error) {
                console.error('添加图案失败:', error);
            }
        });
    }
} 