// Matrix 效果
class MatrixEffect {
    constructor() {
        this.canvas = document.getElementById("matrixCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.fontSize = 16;
        // 扩展字符集，包含多种字符类型
        this.characterSets = {
            chinese: "永远无限未来科技世界光明黑暗空间时间生命能量宇宙星辰大地海洋风雨雷电阴阳五行天地人和智慧真理道法自然",
            english: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            numbers: "0123456789",
            special: "!@#$%^&*()_+-=[]{}|;:,./<>?~`",
            japanese: "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ",
            symbols: "✧✦★☆○●◎◇◆□■△▲▽▼※→←↑↓↔↕⇄⇅⇆⇇",
            math: "∀∂∃∅∇∈∉∋∏∑−∕∗∙√∝∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳"
        };
        
        // 合并所有字符集
        this.characters = Object.values(this.characterSets).join('');
        this.charArray = this.characters.split("");
        this.drops = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.distortionRadius = 200;
        this.distortionStrength = 60;
        this.colorSchemes = [
            { color: "rgba(0, 255, 255, 0.8)", shadow: "rgba(0, 255, 255, 0.8)" }, // 青色
            { color: "rgba(255, 0, 255, 0.8)", shadow: "rgba(255, 0, 255, 0.8)" }, // 粉色
            { color: "rgba(0, 255, 0, 0.8)", shadow: "rgba(0, 255, 0, 0.8)" },     // 绿色
            { color: "rgba(255, 255, 0, 0.8)", shadow: "rgba(255, 255, 0, 0.8)" }  // 黄色
        ];
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener("resize", () => this.resize());
        window.addEventListener("mousemove", (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = this.canvas.width / this.fontSize;
        this.drops = Array(Math.floor(this.columns)).fill(1);
    }

    // 计算点到鼠标的距离
    distanceToMouse(x, y) {
        const dx = x - this.mouseX;
        const dy = y - this.mouseY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 计算扭曲后的位置
    getDistortedPosition(x, y) {
        const distance = this.distanceToMouse(x, y);
        if (distance < this.distortionRadius) {
            const force = (1 - distance / this.distortionRadius) * this.distortionStrength;
            const angle = Math.atan2(y - this.mouseY, x - this.mouseX);
            // 添加一些随机扰动使扭曲效果更自然
            const randomOffset = Math.random() * 5;
            return {
                x: x + Math.cos(angle) * force + Math.sin(angle) * randomOffset,
                y: y + Math.sin(angle) * force + Math.cos(angle) * randomOffset
            };
        }
        return { x, y };
    }

    animate() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drops.forEach((drop, i) => {
            // 随机选择一个字符集
            const setKeys = Object.keys(this.characterSets);
            const randomSet = this.characterSets[setKeys[Math.floor(Math.random() * setKeys.length)]];
            const text = randomSet[Math.floor(Math.random() * randomSet.length)];
            
            const originalX = i * this.fontSize;
            const originalY = drop * this.fontSize;

            const { x, y } = this.getDistortedPosition(originalX, originalY);

            const gradient = this.ctx.createLinearGradient(x, y - this.fontSize * 5, x, y);
            gradient.addColorStop(0, "rgba(0, 255, 255, 0)");
            gradient.addColorStop(1, "rgba(0, 255, 255, 0.8)");
            
            const distance = this.distanceToMouse(originalX, originalY);
            if (distance < this.distortionRadius) {
                const glow = (1 - distance / this.distortionRadius) * 0.8;
                this.ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
                this.ctx.shadowBlur = 15 * glow;
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.fillStyle = gradient;
            // 根据字符类型选择合适的字体
            const isAscii = text.charCodeAt(0) <= 127;
            this.ctx.font = `${this.fontSize}px ${isAscii ? "monospace" : '"Microsoft YaHei", sans-serif'}`;
            this.ctx.fillText(text, x, y);

            if (y > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// 自定义光标效果
class CustomCursor {
    constructor() {
        this.cursor = null;
        this.outline = null;
        this.cursorVisible = true;
        this.cursorEnlarged = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.outlineX = 0;
        this.outlineY = 0;
        this.init();
    }

    init() {
        this.cursor = document.createElement("div");
        this.outline = document.createElement("div");
        this.cursor.classList.add("cursor-dot");
        this.outline.classList.add("cursor-outline");
        document.body.appendChild(this.cursor);
        document.body.appendChild(this.outline);

        this.cursor.style.pointerEvents = 'none';
        this.outline.style.pointerEvents = 'none';

        this.bindEvents();
        this.initCursorPosition();
        this.animateOutline();
    }

    initCursorPosition() {
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.outlineX = this.mouseX;
        this.outlineY = this.mouseY;
        this.updateCursorPosition();
    }

    updateCursorPosition() {
        // 光标点直接跟随
        this.cursor.style.transform = `translate(${this.mouseX}px, ${this.mouseY}px)${this.cursorEnlarged ? ' scale(2.5)' : ''}`;
    }

    animateOutline() {
        // 计算外圈的目标位置
        const targetX = this.mouseX - 15;
        const targetY = this.mouseY - 15;

        // 使用缓动效果计算新位置
        this.outlineX += (targetX - this.outlineX) * 0.15;
        this.outlineY += (targetY - this.outlineY) * 0.15;

        // 更新外圈位置
        this.outline.style.transform = `translate(${this.outlineX}px, ${this.outlineY}px)${this.cursorEnlarged ? ' scale(2.5)' : ''}`;

        // 持续动画
        requestAnimationFrame(() => this.animateOutline());
    }

    bindEvents() {
        document.addEventListener("mousemove", (e) => {
            this.mouseX = e.pageX;
            this.mouseY = e.pageY;
            this.updateCursorPosition();
        });

        document.addEventListener("mouseenter", () => {
            this.cursorVisible = true;
            this.toggleCursorVisibility();
        });

        document.addEventListener("mouseleave", () => {
            this.cursorVisible = false;
            this.toggleCursorVisibility();
        });

        const interactiveElements = document.querySelectorAll('a, button, .app-card, .app-tag');
        interactiveElements.forEach((el) => {
            el.addEventListener("mouseenter", () => {
                this.cursorEnlarged = true;
            });
            
            el.addEventListener("mouseleave", () => {
                this.cursorEnlarged = false;
            });
        });
    }

    toggleCursorVisibility() {
        if (this.cursorVisible) {
            this.cursor.style.opacity = "1";
            this.outline.style.opacity = "1";
        } else {
            this.cursor.style.opacity = "0";
            this.outline.style.opacity = "0";
        }
    }
}

// 卡片光效果
class CardEffect {
    constructor() {
        this.cards = document.querySelectorAll('.app-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                // 3D 效果
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateY = -((x - centerX) / centerX) * 10;
                const rotateX = ((y - centerY) / centerY) * 10;

                card.style.transform = `
                    perspective(1000px)
                    rotateX(${rotateX}deg)
                    rotateY(${rotateY}deg)
                    translateZ(10px)
                `;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                setTimeout(() => {
                    card.style.transform = 'none';
                }, 300);
            });
        });
    }
}

// 页面滚动动画
class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        // 初始化时先设置所有卡片可见
        document.querySelectorAll('.app-card').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                } else {
                    entry.target.style.opacity = '0.6';
                    entry.target.style.transform = 'translateY(20px)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px'
        });

        // 延迟一下再添加观察者，让初始动画完成
        setTimeout(() => {
            document.querySelectorAll('.app-card').forEach(el => {
                observer.observe(el);
            });
        }, 100);
    }
}

// 标题动画增强
class TitleEffect {
    constructor() {
        this.title = document.querySelector('.neon-title');
        this.init();
    }

    init() {
        if (this.title) {
            const text = this.title.textContent;
            this.title.setAttribute('data-text', text);
            
            this.title.addEventListener('mouseover', () => {
                this.title.style.animation = 'none';
                setTimeout(() => {
                    this.title.style.animation = 'neon 1.5s ease-in-out infinite alternate';
                }, 10);
            });
        }
    }
}

// 初始化所有效果
document.addEventListener('DOMContentLoaded', () => {
    new MatrixEffect();
    new CustomCursor();
    new CardEffect();
    new ScrollAnimations();
    new TitleEffect();
}); 