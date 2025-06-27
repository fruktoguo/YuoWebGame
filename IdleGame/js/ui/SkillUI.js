// 技能UI管理类 - 可拖拽缩放网状图
class SkillUI {
    constructor(skillsSystem) {
        this.skillsSystem = skillsSystem;
        this.currentClass = 'warrior';
        this.tooltip = null;
        this.learnedSkills = new Set();
        this.connections = new Map();
        
        // 网状图控制
        this.viewport = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.currentTransform = { x: 0, y: 0, scale: 1 };
        this.minScale = 0.3;
        this.maxScale = 2.0;
        
        // 技能节点位置
        this.skillPositions = new Map();
        
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        this.createSkillPageStructure();
        this.generateSkillLayout();
    }

    createSkillPageStructure() {
        const skillsPage = document.querySelector('.skills-page');
        if (!skillsPage) return;

        skillsPage.innerHTML = `
            <div class="skills-header">
                <h2>技能树</h2>
                <div class="skill-points-display">
                    可用技能点: <span id="available-skill-points">0</span>
                </div>
            </div>
            
            <!-- 职业标签页 -->
            <div class="class-tabs" id="class-tabs">
                ${Object.keys(SkillTreeData).map(className => `
                    <button class="class-tab ${className === this.currentClass ? 'active' : ''}" 
                            data-class="${className}">
                        ${SkillTreeData[className].name}
                    </button>
                `).join('')}
            </div>
            
            <!-- 技能网状图 -->
            <div class="skill-network-container" id="skill-network-container">
                <div class="skill-controls">
                    <button class="control-button" onclick="skillUI.resetView()">重置视图</button>
                    <button class="control-button" onclick="skillUI.centerView()">居中</button>
                </div>
                
                <div class="zoom-controls">
                    <button class="zoom-button" onclick="skillUI.zoomIn()">+</button>
                    <button class="zoom-button" onclick="skillUI.zoomOut()">-</button>
                </div>
                
                <div class="zoom-level" id="zoom-level">100%</div>
                
                <div class="skill-network-viewport" id="skill-network-viewport">
                    <div class="skill-network-grid"></div>
                    <svg class="skill-connections" id="skill-connections">
                        <!-- 连接线将在这里动态生成 -->
                    </svg>
                    <!-- 技能节点将在这里动态生成 -->
                </div>
            </div>
            
            <div class="autocast-settings">
                <h3>自动施法设置</h3>
                <div class="autocast-skill-list" id="autocast-skill-list">
                    <!-- 自动施法技能列表 -->
                </div>
            </div>
        `;

        this.viewport = document.getElementById('skill-network-viewport');
    }

    bindEvents() {
        // 职业标签页切换
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('class-tab')) {
                this.switchClass(e.target.dataset.class);
            }
        });

        // 拖拽事件
        const container = document.getElementById('skill-network-container');
        if (container) {
            container.addEventListener('mousedown', (e) => this.startDrag(e));
            container.addEventListener('mousemove', (e) => this.drag(e));
            container.addEventListener('mouseup', (e) => this.endDrag(e));
            container.addEventListener('mouseleave', (e) => this.endDrag(e));

            // 滚轮缩放
            container.addEventListener('wheel', (e) => this.handleWheel(e));

            // 触摸事件（移动端支持）
            container.addEventListener('touchstart', (e) => this.startTouch(e));
            container.addEventListener('touchmove', (e) => this.handleTouch(e));
            container.addEventListener('touchend', (e) => this.endTouch(e));
        }
        
        // 监听职业变化
        window.addEventListener('characterClassChanged', (event) => {
            this.updateForClass(event.detail.class);
        });
        
        // 监听技能点变化
        window.addEventListener('skillPointsChanged', () => {
            this.updateSkillPoints();
            this.updateSkillStates();
        });

        // 全局引用
        window.skillUI = this;
    }

    switchClass(className) {
        this.currentClass = className;
        
        // 更新标签页状态
        document.querySelectorAll('.class-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.class === className);
        });

        this.generateSkillLayout();
        this.renderSkillNetwork();
        this.updateSkillPoints();
        this.updateAutoCastSettings();
    }

    // 生成技能布局位置
    generateSkillLayout() {
        if (!this.currentClass) return;

        const classData = SkillTreeData[this.currentClass];
        if (!classData) return;

        this.skillPositions.clear();

        // 网状图布局算法
        const centerX = 400;
        const centerY = 300;
        const branchAngle = (2 * Math.PI) / Object.keys(classData.branches).length;
        
        let branchIndex = 0;
        Object.entries(classData.branches).forEach(([branchKey, branchData]) => {
            const angle = branchIndex * branchAngle;
            const branchCenterX = centerX + Math.cos(angle) * 200;
            const branchCenterY = centerY + Math.sin(angle) * 200;
            
            let skillIndex = 0;
            const totalSkills = Object.values(branchData.skills).flat().length;
            
            Object.entries(branchData.skills).forEach(([tierKey, skills]) => {
                skills.forEach((skill, index) => {
                    // 计算技能在分支中的位置
                    const skillAngle = angle + (skillIndex - totalSkills / 2) * 0.3;
                    const distance = 80 + (tierKey === 'basic' ? 0 : 
                                         tierKey === 'advanced' ? 60 : 
                                         tierKey === 'expert' ? 120 : 180);
                    
                    const x = branchCenterX + Math.cos(skillAngle) * distance;
                    const y = branchCenterY + Math.sin(skillAngle) * distance;
                    
                    this.skillPositions.set(skill.id, {
                        x: x,
                        y: y,
                        branch: branchKey,
                        tier: tierKey,
                        skill: skill
                    });
                    
                    skillIndex++;
                });
            });
            
            branchIndex++;
        });
    }

    // 渲染技能网状图
    renderSkillNetwork() {
        if (!this.viewport) return;

        // 清空现有内容（保留网格和SVG）
        const existingNodes = this.viewport.querySelectorAll('.skill-node');
        existingNodes.forEach(node => node.remove());

        const svgContainer = document.getElementById('skill-connections');
        svgContainer.innerHTML = '';
        this.connections.clear();

        // 创建技能节点
        this.skillPositions.forEach((position, skillId) => {
            const skillNode = this.createSkillNode(position.skill, position.x, position.y);
            this.viewport.appendChild(skillNode);
        });

        // 绘制连接线
        setTimeout(() => {
            this.drawAllConnections();
        }, 50);

        this.updateSkillStates();
    }

    createSkillNode(skill, x, y) {
        const node = document.createElement('div');
        node.className = 'skill-node locked';
        node.dataset.skillId = skill.id;
        node.style.left = `${x - 40}px`; // 居中对齐
        node.style.top = `${y - 40}px`;
        
        node.innerHTML = `
            ${skill.icon}
            <div class="skill-level">0</div>
            <div class="skill-name-label">${skill.name}</div>
        `;

        // 添加事件监听
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSkillClick(e, skill);
        });
        node.addEventListener('mouseenter', (e) => this.showTooltip(e, skill));
        node.addEventListener('mouseleave', () => this.hideTooltip());

        return node;
    }

    // 绘制所有连接线
    drawAllConnections() {
        const svgContainer = document.getElementById('skill-connections');
        const classData = SkillTreeData[this.currentClass];
        if (!classData) return;

        // 设置SVG尺寸
        svgContainer.setAttribute('width', '100%');
        svgContainer.setAttribute('height', '100%');

        // 遍历所有技能，绘制前置技能连接线
        Object.values(classData.branches).forEach(branchData => {
            Object.values(branchData.skills).flat().forEach(skill => {
                if (skill.prerequisites && skill.prerequisites.length > 0) {
                    skill.prerequisites.forEach(prereqId => {
                        this.drawConnection(svgContainer, prereqId, skill.id, branchData.color);
                    });
                }
            });
        });
    }

    drawConnection(svgContainer, fromSkillId, toSkillId, color) {
        const fromPos = this.skillPositions.get(fromSkillId);
        const toPos = this.skillPositions.get(toSkillId);
        
        if (!fromPos || !toPos) return;

        // 创建连接线
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromPos.x);
        line.setAttribute('y1', fromPos.y);
        line.setAttribute('x2', toPos.x);
        line.setAttribute('y2', toPos.y);
        line.setAttribute('class', `skill-connection ${this.currentClass}`);
        
        // 检查连接状态
        const fromLearned = this.learnedSkills.has(fromSkillId);
        const toLearned = this.learnedSkills.has(toSkillId);
        
        if (fromLearned && toLearned) {
            line.classList.add('active');
        } else if (fromLearned && !toLearned) {
            line.classList.add('prerequisite');
        }
        
        svgContainer.appendChild(line);
        
        // 存储连接信息
        this.connections.set(`${fromSkillId}-${toSkillId}`, {
            element: line,
            from: fromSkillId,
            to: toSkillId
        });
    }

    // 拖拽控制
    startDrag(e) {
        if (e.target.classList.contains('skill-node')) return;
        
        this.isDragging = true;
        this.dragStart.x = e.clientX - this.currentTransform.x;
        this.dragStart.y = e.clientY - this.currentTransform.y;
        
        const container = document.getElementById('skill-network-container');
        container.style.cursor = 'grabbing';
    }

    drag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        this.currentTransform.x = e.clientX - this.dragStart.x;
        this.currentTransform.y = e.clientY - this.dragStart.y;
        
        this.updateTransform();
    }

    endDrag(e) {
        this.isDragging = false;
        const container = document.getElementById('skill-network-container');
        container.style.cursor = 'grab';
    }

    // 滚轮缩放
    handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.currentTransform.scale * delta));
        
        if (newScale !== this.currentTransform.scale) {
            // 计算缩放中心点
            const rect = e.currentTarget.getBoundingClientRect();
            const centerX = e.clientX - rect.left;
            const centerY = e.clientY - rect.top;
            
            // 调整平移以保持缩放中心点
            const scaleDiff = newScale / this.currentTransform.scale;
            this.currentTransform.x = centerX - (centerX - this.currentTransform.x) * scaleDiff;
            this.currentTransform.y = centerY - (centerY - this.currentTransform.y) * scaleDiff;
            this.currentTransform.scale = newScale;
            
            this.updateTransform();
        }
    }

    // 触摸事件处理
    startTouch(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.startDrag({ clientX: touch.clientX, clientY: touch.clientY, target: e.target });
        }
    }

    handleTouch(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            this.drag({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
        }
    }

    endTouch(e) {
        this.endDrag(e);
    }

    // 更新变换
    updateTransform() {
        if (!this.viewport) return;
        
        this.viewport.style.transform = `translate(${this.currentTransform.x}px, ${this.currentTransform.y}px) scale(${this.currentTransform.scale})`;
        
        // 更新缩放显示
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.currentTransform.scale * 100)}%`;
        }
    }

    // 缩放控制
    zoomIn() {
        const newScale = Math.min(this.maxScale, this.currentTransform.scale * 1.2);
        this.currentTransform.scale = newScale;
        this.updateTransform();
    }

    zoomOut() {
        const newScale = Math.max(this.minScale, this.currentTransform.scale / 1.2);
        this.currentTransform.scale = newScale;
        this.updateTransform();
    }

    resetView() {
        this.currentTransform = { x: 0, y: 0, scale: 1 };
        this.updateTransform();
    }

    centerView() {
        const container = document.getElementById('skill-network-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        this.currentTransform.x = rect.width / 2 - 400; // 400是布局中心X
        this.currentTransform.y = rect.height / 2 - 300; // 300是布局中心Y
        this.updateTransform();
    }

    // 技能点击处理
    handleSkillClick(event, skill) {
        event.preventDefault();
        
        const node = event.currentTarget;
        if (node.classList.contains('locked')) return;
        
        if (node.classList.contains('available')) {
            this.learnSkill(skill);
        }
    }

    learnSkill(skill) {
        const character = window.game?.character;
        if (!character || !character.skillPoints || character.skillPoints < skill.cost) {
            return;
        }

        // 检查前置条件
        if (!this.checkPrerequisites(skill)) {
            return;
        }

        // 学习技能
        character.skillPoints -= skill.cost;
        this.skillsSystem.learnSkill(skill.id);
        this.learnedSkills.add(skill.id);

        // 更新UI
        this.updateSkillPoints();
        this.updateSkillStates();
        this.updateConnections();
        this.updateAutoCastSettings();

        // 播放学习动画
        const skillNode = document.querySelector(`[data-skill-id="${skill.id}"]`);
        if (skillNode) {
            skillNode.style.animation = 'none';
            setTimeout(() => {
                skillNode.style.animation = 'skill-unlock 0.6s ease-out';
            }, 10);
        }

        // 触发事件
        window.dispatchEvent(new CustomEvent('skillLearned', {
            detail: { skill: skill }
        }));
    }

    checkPrerequisites(skill) {
        if (!skill.prerequisites || skill.prerequisites.length === 0) {
            return true;
        }

        return skill.prerequisites.every(prereqId => 
            this.learnedSkills.has(prereqId)
        );
    }

    updateSkillStates() {
        const character = window.game?.character;
        if (!character) return;

        const skillNodes = document.querySelectorAll('.skill-node');
        skillNodes.forEach(node => {
            const skillId = node.dataset.skillId;
            const skill = this.getSkillById(skillId);
            if (!skill) return;

            // 重置状态
            node.classList.remove('locked', 'available', 'learned', 'maxed');

            if (this.learnedSkills.has(skillId)) {
                node.classList.add('learned');
                node.querySelector('.skill-level').textContent = '1';
            } else if (this.checkPrerequisites(skill)) {
                if (character.skillPoints >= skill.cost) {
                    node.classList.add('available');
                } else {
                    node.classList.add('locked');
                }
                node.querySelector('.skill-level').textContent = '0';
            } else {
                node.classList.add('locked');
                node.querySelector('.skill-level').textContent = '0';
            }
        });
    }

    updateConnections() {
        // 更新连接线状态
        this.connections.forEach((connection, key) => {
            const fromLearned = this.learnedSkills.has(connection.from);
            const toLearned = this.learnedSkills.has(connection.to);
            
            connection.element.classList.remove('active', 'prerequisite');
            
            if (fromLearned && toLearned) {
                connection.element.classList.add('active');
            } else if (fromLearned && !toLearned) {
                connection.element.classList.add('prerequisite');
            }
        });
    }

    getSkillById(skillId) {
        if (!this.currentClass) return null;
        
        const classData = SkillTreeData[this.currentClass];
        if (!classData) return null;

        for (const branchData of Object.values(classData.branches)) {
            for (const skills of Object.values(branchData.skills)) {
                const skill = skills.find(s => s.id === skillId);
                if (skill) return skill;
            }
        }
        return null;
    }

    // 更新UI显示
    update() {
        const character = window.game?.character;
        if (character && character.class !== this.currentClass) {
            this.updateForClass(character.class);
        }
        this.updateSkillPoints();
        this.updateSkillStates();
    }

    updateForClass(characterClass) {
        this.currentClass = characterClass;
        
        // 更新标签页状态
        document.querySelectorAll('.class-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.class === characterClass);
        });
        
        this.generateSkillLayout();
        this.renderSkillNetwork();
        this.updateSkillPoints();
        this.updateAutoCastSettings();
    }

    updateSkillPoints() {
        const character = window.game?.character;
        const pointsElement = document.getElementById('available-skill-points');
        if (pointsElement && character) {
            const points = character.skillPoints || 0;
            pointsElement.textContent = points;
        }
    }

    updateAutoCastSettings() {
        const container = document.getElementById('autocast-skill-list');
        if (!container) return;

        container.innerHTML = '';

        // 获取已学会的主动技能和光环技能
        const learnedActiveSkills = [];
        const learnedAuraSkills = [];

        this.learnedSkills.forEach(skillId => {
            const skill = this.getSkillById(skillId);
            if (skill) {
                if (skill.type === 'active') {
                    learnedActiveSkills.push(skill);
                } else if (skill.type === 'aura') {
                    learnedAuraSkills.push(skill);
                }
            }
        });

        // 创建主动技能自动施法选项
        if (learnedActiveSkills.length > 0) {
            learnedActiveSkills.forEach(skill => {
                const item = document.createElement('div');
                item.className = 'autocast-skill-item';
                item.innerHTML = `
                    <input type="checkbox" id="autocast-${skill.id}" 
                           ${this.skillsSystem.isAutocast(skill.id) ? 'checked' : ''}>
                    <label for="autocast-${skill.id}">
                        ${skill.icon} ${skill.name}
                    </label>
                `;

                const checkbox = item.querySelector('input');
                checkbox.addEventListener('change', (e) => {
                    this.skillsSystem.setAutocast(skill.id, e.target.checked);
                });

                container.appendChild(item);
            });
        }

        // 创建光环技能自动施法选项
        if (learnedAuraSkills.length > 0) {
            learnedAuraSkills.forEach(skill => {
                const item = document.createElement('div');
                item.className = 'autocast-skill-item';
                item.innerHTML = `
                    <input type="checkbox" id="autocast-${skill.id}" 
                           ${this.skillsSystem.isAutocast(skill.id) ? 'checked' : ''}>
                    <label for="autocast-${skill.id}">
                        ${skill.icon} ${skill.name} (光环)
                    </label>
                `;

                const checkbox = item.querySelector('input');
                checkbox.addEventListener('change', (e) => {
                    this.skillsSystem.setAutocast(skill.id, e.target.checked);
                });

                container.appendChild(item);
            });
        }

        if (learnedActiveSkills.length === 0 && learnedAuraSkills.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666;">暂无可自动施法的技能</div>';
        }
    }

    showTooltip(event, skill) {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        
        // 构建前置条件文本
        let prerequisitesText = '';
        if (skill.prerequisites && skill.prerequisites.length > 0) {
            const prereqNames = skill.prerequisites.map(id => {
                const prereqSkill = this.getSkillById(id);
                return prereqSkill ? prereqSkill.name : id;
            });
            prerequisitesText = `<div class="prerequisites">前置条件: ${prereqNames.join(', ')}</div>`;
        }

        // 构建效果文本
        let effectsText = '';
        if (skill.effects) {
            const effects = [];
            Object.entries(skill.effects).forEach(([key, value]) => {
                effects.push(`${key}: ${value}`);
            });
            effectsText = `<div class="skill-effects">${effects.join('<br>')}</div>`;
        }

        tooltip.innerHTML = `
            <h4>${skill.icon} ${skill.name}</h4>
            <div class="skill-type ${skill.type}">${this.getTypeText(skill.type)}</div>
            <div class="skill-cost">消耗技能点: ${skill.cost}</div>
            <div class="skill-description">${skill.description}</div>
            ${effectsText}
            ${prerequisitesText}
        `;

        document.body.appendChild(tooltip);
        this.tooltip = tooltip;

        // 定位工具提示
        const rect = event.currentTarget.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - tooltipRect.height - 10;

        // 边界检查
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) {
            top = rect.bottom + 10;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        
        // 显示动画
        setTimeout(() => tooltip.classList.add('show'), 10);
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    getTypeText(type) {
        const typeMap = {
            'passive': '被动',
            'active': '主动',
            'aura': '光环'
        };
        return typeMap[type] || type;
    }

    // 重置技能点（开发者选项）
    resetSkillPoints() {
        const character = window.game?.character;
        if (!character) return;

        // 重置技能点
        character.skillPoints = character.level - 1; // 每级1点，1级时为0点
        
        // 清除已学技能
        this.learnedSkills.clear();
        this.skillsSystem.resetAllSkills();

        // 更新UI
        this.updateSkillPoints();
        this.updateSkillStates();
        this.updateConnections();
        this.updateAutoCastSettings();

        console.log('技能点已重置');
    }

    // 保存技能数据
    saveSkillData() {
        return {
            learnedSkills: Array.from(this.learnedSkills),
            currentClass: this.currentClass,
            transform: this.currentTransform
        };
    }

    // 加载技能数据
    loadSkillData(data) {
        if (data) {
            this.learnedSkills = new Set(data.learnedSkills || []);
            this.currentClass = data.currentClass || 'warrior';
            
            if (data.transform) {
                this.currentTransform = { ...data.transform };
                this.updateTransform();
            }
            
            // 恢复技能系统状态
            this.learnedSkills.forEach(skillId => {
                this.skillsSystem.learnSkill(skillId);
            });
        }
    }
}

// 添加技能学习动画CSS
const style = document.createElement('style');
style.textContent = `
@keyframes skill-unlock {
    0% {
        transform: scale(1);
        box-shadow: 0 0 20px rgba(39, 174, 96, 0.4);
    }
    50% {
        transform: scale(1.3);
        box-shadow: 0 0 50px rgba(39, 174, 96, 0.8);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 0 20px rgba(39, 174, 96, 0.4);
    }
}
`;
document.head.appendChild(style);

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillUI;
}