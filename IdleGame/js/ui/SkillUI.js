// 技能UI管理类 - 基于五属性的极坐标依赖驱动布局
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
        this.minScale = 0.2;
        this.maxScale = 3.0;
        
        // 性能优化
        this.dragThrottle = null;
        this.isTransforming = false;
        
        // 新的极坐标布局系统
        this.centerX = 1000;
        this.centerY = 1000;
        this.skillPositions = new Map(); // 存储所有技能节点的极坐标位置
        this.baseAttributeNodes = new Map(); // 五个基础属性节点
        this.dependencyGraph = new Map(); // 技能依赖图
        this.baseExtensionDistance = 120; // 基础延伸距离
        
        // 延迟初始化，确保所有脚本都已加载
        setTimeout(() => {
            this.initializeUI();
            this.bindEvents();
        }, 0);
    }

    initializeUI() {
        // 如果数据还没加载，再等一下
        if (!window.SkillTreeData) {
            console.warn('SkillTreeData not ready, retrying in 100ms...');
            setTimeout(() => this.initializeUI(), 100);
            return;
        }
        
        this.createSkillPageStructure();
        this.initializeBaseAttributes();
        this.buildSkillDependencyGraph();
        this.calculateAllNodePositions();
        this.renderAllSkillNodes();
    }

    createSkillPageStructure() {
        const skillsPage = document.querySelector('.skills-page');
        if (!skillsPage) return;

        skillsPage.innerHTML = `
            <div class="skills-header">
                <h2>技能树 - 五属性体系</h2>
                <div class="skill-points-display">
                    可用技能点: <span id="available-skill-points">0</span>
                </div>
                <div class="current-class-display">
                    当前职业: <span id="current-class-name">战士</span>
                </div>
            </div>
            
            <!-- 技能网状图 -->
            <div class="skill-network-container" id="skill-network-container">
                <div class="skill-controls">
                    <button class="control-button" onclick="skillUI.resetView()">重置视图</button>
                    <button class="control-button" onclick="skillUI.centerView()">居中</button>
                    <button class="control-button" onclick="skillUI.focusCurrentClass()">聚焦当前职业</button>
                </div>
                
                <div class="zoom-controls">
                    <button class="zoom-button" onclick="skillUI.zoomIn()">+</button>
                    <button class="zoom-button" onclick="skillUI.zoomOut()">-</button>
                </div>
                
                <div class="zoom-level" id="zoom-level">100%</div>
                
                <div class="skill-network-viewport" id="skill-network-viewport">
                    <div class="skill-network-grid"></div>
                    <div class="skill-radial-lines" id="skill-radial-lines">
                        <!-- 五属性辐射线 -->
                    </div>
                    <div class="skill-network-center"></div>
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

    // 初始化五个基础属性节点
    initializeBaseAttributes() {
        const baseAttributes = [
            { id: 'base_strength', name: '力量', icon: '💪', description: '增加物理伤害和生命值', color: '#e74c3c' },
            { id: 'base_dexterity', name: '敏捷', icon: '🏃', description: '增加攻击速度和闪避', color: '#27ae60' },
            { id: 'base_intelligence', name: '智力', icon: '🧠', description: '增加魔法伤害和法力值', color: '#3498db' },
            { id: 'base_constitution', name: '体质', icon: '❤️', description: '增加生命值和防御力', color: '#f39c12' },
            { id: 'base_spirit', name: '精神', icon: '✨', description: '增加法力回复和抗性', color: '#9b59b6' }
        ];

        // 按72度间隔排布五个基础属性
        baseAttributes.forEach((attr, index) => {
            const angle = (index * 72) * Math.PI / 180; // 转换为弧度
            const distance = 200; // 距离中心的距离
            
            const position = {
                angle: angle,
                distance: distance,
                x: this.centerX + Math.cos(angle) * distance,
                y: this.centerY + Math.sin(angle) * distance,
                skill: {
                    id: attr.id,
                    name: attr.name,
                    icon: attr.icon,
                    description: attr.description,
                    type: 'base_attribute',
                    cost: 0,
                    prerequisites: [],
                    effects: {}
                },
                nodeType: 'base_attribute',
                color: attr.color
            };
            
            this.baseAttributeNodes.set(attr.id, position);
            this.skillPositions.set(attr.id, position);
        });
    }

    // 构建技能依赖图
    buildSkillDependencyGraph() {
        this.dependencyGraph.clear();
        
        // 检查 SkillTreeData 是否存在
        if (!window.SkillTreeData) {
            console.error('SkillTreeData is not defined in buildSkillDependencyGraph');
            return;
        }
        
        // 遍历所有属性的技能数据
        Object.values(window.SkillTreeData).forEach((attributeData, index) => {
            if (!attributeData) {
                console.warn(`AttributeData at index ${index} is undefined`);
                return;
            }
            
            if (!attributeData.skills) {
                console.warn(`AttributeData.skills is undefined for:`, attributeData);
                return;
            }
            
            attributeData.skills.forEach(skill => {
                if (!skill || !skill.id) {
                    console.warn('Invalid skill data:', skill);
                    return;
                }
                
                this.dependencyGraph.set(skill.id, {
                    skill: skill,
                    dependencies: skill.prerequisites || [],
                    dependents: [],
                    attributeType: this.determineAttributeType(skill)
                });
            });
        });

        // 建立反向依赖关系
        this.dependencyGraph.forEach((node, skillId) => {
            node.dependencies.forEach(depId => {
                const depNode = this.dependencyGraph.get(depId);
                if (depNode) {
                    depNode.dependents.push(skillId);
                }
            });
        });
        
        console.log('Dependency graph built with', this.dependencyGraph.size, 'skills');
    }

    // 确定技能的主要属性类型
    determineAttributeType(skill) {
        // 根据技能ID前缀直接确定属性类型
        if (skill.id.startsWith('strength_')) {
            return 'base_strength';
        } else if (skill.id.startsWith('dexterity_')) {
            return 'base_dexterity';
        } else if (skill.id.startsWith('intelligence_')) {
            return 'base_intelligence';
        } else if (skill.id.startsWith('constitution_')) {
            return 'base_constitution';
        } else if (skill.id.startsWith('spirit_')) {
            return 'base_spirit';
        }
        
        // 如果是基础属性节点本身
        if (skill.type === 'base_attribute') {
            return skill.id;
        }
        
        // 默认返回力量
        return 'base_strength';
    }

    // 计算所有节点位置
    calculateAllNodePositions() {
        // 使用拓扑排序确保依赖节点先计算位置
        const visited = new Set();
        const calculating = new Set();
        
        // 为没有前置条件的技能分配基础属性依赖
        this.dependencyGraph.forEach((node, skillId) => {
            if (node.dependencies.length === 0) {
                // 没有依赖的技能，添加对应的基础属性作为依赖
                node.dependencies.push(node.attributeType);
            }
        });
        
        // 递归计算所有节点位置
        this.dependencyGraph.forEach((node, skillId) => {
            this.calculateNodePosition(skillId, visited, calculating);
        });
    }

    // 递归计算单个节点位置
    calculateNodePosition(skillId, visited, calculating) {
        if (visited.has(skillId)) return;
        if (calculating.has(skillId)) {
            console.warn(`循环依赖检测到: ${skillId}`);
            return;
        }
        
        // 如果是基础属性节点，已经计算过位置
        if (this.baseAttributeNodes.has(skillId)) {
            visited.add(skillId);
            return;
        }
        
        const node = this.dependencyGraph.get(skillId);
        if (!node) return;
        
        calculating.add(skillId);
        
        // 确保所有依赖节点都已计算位置
        const dependencyPositions = [];
        node.dependencies.forEach(depId => {
            this.calculateNodePosition(depId, visited, calculating);
            const depPos = this.skillPositions.get(depId);
            if (depPos) {
                dependencyPositions.push(depPos);
            }
        });
        
        calculating.delete(skillId);
        
        // 计算当前节点位置
        if (dependencyPositions.length > 0) {
            const position = this.calculatePositionFromDependencies(node.skill, dependencyPositions);
            this.skillPositions.set(skillId, position);
        }
        
        visited.add(skillId);
    }

    // 根据依赖节点计算新节点位置
    calculatePositionFromDependencies(skill, dependencyPositions) {
        let centerAngle, centerDistance;
        
        if (dependencyPositions.length === 1) {
            // 单依赖：沿依赖节点角度向外延伸
            const dep = dependencyPositions[0];
            centerAngle = dep.angle;
            centerDistance = dep.distance + this.baseExtensionDistance;
        } else {
            // 多依赖：计算依赖节点的质心位置
            let totalX = 0, totalY = 0;
            dependencyPositions.forEach(pos => {
                totalX += pos.x;
                totalY += pos.y;
            });
            
            const centerX = totalX / dependencyPositions.length;
            const centerY = totalY / dependencyPositions.length;
            
            // 计算质心相对于中心的角度和距离
            const deltaX = centerX - this.centerX;
            const deltaY = centerY - this.centerY;
            centerAngle = Math.atan2(deltaY, deltaX);
            centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + this.baseExtensionDistance;
        }
        
        // 添加一些随机偏移避免节点重叠
        const angleOffset = (Math.random() - 0.5) * 0.3; // ±0.15弧度的角度偏移
        const distanceOffset = (Math.random() - 0.5) * 40; // ±20像素的距离偏移
        
        const finalAngle = centerAngle + angleOffset;
        const finalDistance = Math.max(100, centerDistance + distanceOffset); // 确保最小距离
        
        const x = this.centerX + Math.cos(finalAngle) * finalDistance;
        const y = this.centerY + Math.sin(finalAngle) * finalDistance;
        
        return {
            angle: finalAngle,
            distance: finalDistance,
            x: x,
            y: y,
            skill: skill,
            nodeType: this.getNodeType(skill),
            dependencies: dependencyPositions.map(pos => pos.skill.id)
        };
    }

    // 确定节点类型
    getNodeType(skill) {
        if (skill.type === 'base_attribute') return 'base_attribute';
        if (skill.cost >= 4) return 'keystone';
        if (skill.cost >= 2) return 'notable';
        return 'small';
    }

    bindEvents() {
        // 拖拽事件（性能优化）
        const container = document.getElementById('skill-network-container');
        if (container) {
            container.addEventListener('mousedown', (e) => this.startDrag(e), { passive: false });
            container.addEventListener('mousemove', (e) => this.throttledDrag(e), { passive: false });
            container.addEventListener('mouseup', (e) => this.endDrag(e), { passive: true });
            container.addEventListener('mouseleave', (e) => this.endDrag(e), { passive: true });

            // 滚轮缩放（性能优化）
            container.addEventListener('wheel', (e) => this.throttledWheel(e), { passive: false });

            // 触摸事件
            container.addEventListener('touchstart', (e) => this.startTouch(e), { passive: false });
            container.addEventListener('touchmove', (e) => this.handleTouch(e), { passive: false });
            container.addEventListener('touchend', (e) => this.endTouch(e), { passive: true });
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

    // 渲染所有技能节点
    renderAllSkillNodes() {
        if (!this.viewport) return;

        // 清空现有内容
        const existingNodes = this.viewport.querySelectorAll('.skill-node');
        existingNodes.forEach(node => node.remove());

        const svgContainer = document.getElementById('skill-connections');
        svgContainer.innerHTML = '';
        this.connections.clear();

        // 创建所有技能节点
        this.skillPositions.forEach((position, skillId) => {
            const skillNode = this.createSkillNode(position.skill, position.x, position.y, position.nodeType);
            this.viewport.appendChild(skillNode);
        });

        // 绘制连接线
        setTimeout(() => {
            this.drawAllConnections();
        }, 50);

        this.updateSkillStates();
    }

    createSkillNode(skill, x, y, nodeType) {
        const node = document.createElement('div');
        
        // 根据节点类型设置类名和尺寸
        let nodeClasses = `skill-node locked`;
        let offsetX = 16, offsetY = 16; // 默认小节点的偏移
        
        switch (nodeType) {
            case 'small':
                nodeClasses += ' small-node';
                offsetX = offsetY = 16;
                break;
            case 'notable':
                nodeClasses += ' notable-node';
                offsetX = offsetY = 24;
                break;
            case 'keystone':
                nodeClasses += ' keystone-node';
                offsetX = offsetY = 32;
                break;
            case 'core':
                nodeClasses += ' core-node';
                offsetX = offsetY = 40;
                break;
            case 'base_attribute':
                nodeClasses += ' base-attribute-node';
                offsetX = offsetY = 48;
                break;
        }
        
        node.className = nodeClasses;
        node.dataset.skillId = skill.id;
        node.dataset.nodeType = nodeType;
        node.style.left = `${x - offsetX}px`;
        node.style.top = `${y - offsetY}px`;
        
        // 根据节点类型显示不同内容
        let classLabel = '';
        if (nodeType !== 'base_attribute') {
            const attrType = this.determineAttributeType(skill);
            const attrNames = {
                'base_strength': '力量',
                'base_dexterity': '敏捷', 
                'base_intelligence': '智力',
                'base_constitution': '体质',
                'base_spirit': '精神'
            };
            classLabel = `<div class="skill-class-label">${attrNames[attrType] || '通用'}</div>`;
        }
        
        node.innerHTML = `
            ${skill.icon}
            <div class="skill-level">0</div>
            <div class="skill-name-label">${skill.name}</div>
            ${classLabel}
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
        if (!svgContainer) return;
        
        // 清除现有连接线
        svgContainer.innerHTML = '';
        this.connections.clear();
        
        // 设置SVG尺寸
        svgContainer.setAttribute('width', '100%');
        svgContainer.setAttribute('height', '100%');

        // 绘制所有技能的依赖连接线
        this.skillPositions.forEach((position, skillId) => {
            if (position.dependencies && position.dependencies.length > 0) {
                position.dependencies.forEach(depId => {
                    this.drawConnection(svgContainer, depId, skillId);
                });
            }
        });
        
        // 为基础属性节点创建中心辐射线
        this.createAttributeRadialLines();
    }

    drawConnection(svgContainer, fromSkillId, toSkillId) {
        const fromPos = this.skillPositions.get(fromSkillId);
        const toPos = this.skillPositions.get(toSkillId);
        
        if (!fromPos || !toPos) return;

        // 创建连接线
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromPos.x);
        line.setAttribute('y1', fromPos.y);
        line.setAttribute('x2', toPos.x);
        line.setAttribute('y2', toPos.y);
        
        // 根据节点类型设置连接线样式
        let lineClass = 'skill-connection';
        if (fromPos.nodeType === 'base_attribute') {
            lineClass += ' base-attribute-connection';
        } else if (fromPos.nodeType === 'keystone' || toPos.nodeType === 'keystone') {
            lineClass += ' keystone-connection';
        } else if (fromPos.nodeType === 'notable' || toPos.nodeType === 'notable') {
            lineClass += ' notable-connection';
        } else {
            lineClass += ' small-connection';
        }
        
        line.setAttribute('class', lineClass);
        
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
    
    // 创建基础属性的辐射线
    createAttributeRadialLines() {
        const radialContainer = document.getElementById('skill-radial-lines');
        if (!radialContainer) return;

        // 清除现有辐射线
        radialContainer.innerHTML = '';

        // 为每个基础属性创建辐射线
        this.baseAttributeNodes.forEach((position, attrId) => {
            const radialLine = document.createElement('div');
            radialLine.className = `radial-line attribute-${attrId}`;
            radialLine.style.transform = `rotate(${position.angle}rad)`;
            radialLine.style.background = `linear-gradient(to right, 
                ${position.color}40 0%, 
                ${position.color}20 50%, 
                transparent 100%)`;
            
            radialContainer.appendChild(radialLine);
        });
    }

    // 性能优化的拖拽处理
    startDrag(e) {
        if (e.target.classList.contains('skill-node')) return;
        
        this.isDragging = true;
        this.dragStart.x = e.clientX - this.currentTransform.x;
        this.dragStart.y = e.clientY - this.currentTransform.y;
        
        const container = document.getElementById('skill-network-container');
        container.style.cursor = 'grabbing';
        
        // 禁用过渡效果以提高性能
        if (this.viewport) {
            this.viewport.style.transition = 'none';
        }
    }

    throttledDrag(e) {
        if (!this.isDragging) return;
        
        // 使用 requestAnimationFrame 节流
        if (this.dragThrottle) return;
        
        this.dragThrottle = requestAnimationFrame(() => {
            this.drag(e);
            this.dragThrottle = null;
        });
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
        
        // 恢复过渡效果
        if (this.viewport) {
            this.viewport.style.transition = 'transform 0.1s ease-out';
        }
        
        // 清除节流
        if (this.dragThrottle) {
            cancelAnimationFrame(this.dragThrottle);
            this.dragThrottle = null;
        }
    }

    // 性能优化的滚轮处理
    throttledWheel(e) {
        e.preventDefault();
        
        if (this.isTransforming) return;
        
        this.isTransforming = true;
        requestAnimationFrame(() => {
            this.handleWheel(e);
            this.isTransforming = false;
        });
    }

    handleWheel(e) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.currentTransform.scale * delta));
        
        if (newScale !== this.currentTransform.scale) {
            // 计算缩放中心点 - 修复getBoundingClientRect错误
            const container = document.getElementById('skill-network-container');
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
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
            this.throttledDrag({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
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

    // 聚焦当前职业
    focusCurrentClass() {
        const classPos = this.classPositions.get(this.currentClass);
        if (!classPos) return;
        
        const container = document.getElementById('skill-network-container');
        if (!container) return;
        
        // 计算当前职业技能的平均位置
        const classSkills = Array.from(this.allSkillPositions.entries())
            .filter(([_, pos]) => pos.class === this.currentClass);
        
        if (classSkills.length === 0) return;
        
        // 找到职业技能的边界
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        classSkills.forEach(([_, pos]) => {
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        });
        
        // 计算职业区域的中心
        const classCenterX = (minX + maxX) / 2;
        const classCenterY = (minY + maxY) / 2;
        
        const rect = container.getBoundingClientRect();
        this.currentTransform.x = rect.width / 2 - classCenterX;
        this.currentTransform.y = rect.height / 2 - classCenterY;
        this.currentTransform.scale = 1.5;
        
        this.updateTransform();
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
        this.currentTransform = { x: -300, y: -300, scale: 0.8 };
        this.updateTransform();
    }

    centerView() {
        const container = document.getElementById('skill-network-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        this.currentTransform.x = rect.width / 2 - 1000; // 1000是新的布局中心X
        this.currentTransform.y = rect.height / 2 - 1000; // 1000是新的布局中心Y
        this.currentTransform.scale = 0.7;
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

            // 更新透明度
            if (connection.class === this.currentClass) {
                connection.element.style.opacity = '1';
            } else {
                connection.element.style.opacity = '0.3';
            }
        });
    }

    getSkillById(skillId) {
        // 先检查基础属性节点
        const baseAttr = this.baseAttributeNodes.get(skillId);
        if (baseAttr) return baseAttr.skill;
        
        // 检查所有属性技能
        if (window.SkillTreeData) {
            for (const attributeData of Object.values(window.SkillTreeData)) {
                if (attributeData && attributeData.skills) {
                    const skill = attributeData.skills.find(s => s.id === skillId);
                    if (skill) return skill;
                }
            }
        }
        
        // 检查技能位置中的技能
        const position = this.skillPositions.get(skillId);
        return position ? position.skill : null;
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
        
        // 更新当前职业显示
        const currentClassElement = document.getElementById('current-class-name');
        if (currentClassElement) {
            const classData = window.SkillTreeData?.[characterClass];
            currentClassElement.textContent = classData ? classData.name : characterClass;
        }
        
        this.updateSkillStates();
        this.updateConnections();
        this.updateAutoCastSettings();
        this.updateRadialLines();
    }

    // 更新辐射线
    updateRadialLines() {
        const radialLines = document.querySelectorAll('.radial-line');
        radialLines.forEach(line => {
            const className = line.className.split(' ')[1]; // 获取职业名
            if (className === this.currentClass) {
                line.style.opacity = '0.8';
            } else {
                line.style.opacity = '0.3';
            }
        });
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
            container.innerHTML = `
                <div style="text-align: center; color: #bdc3c7; padding: 20px;">
                    <div style="font-size: 1.1em; margin-bottom: 10px;">🎯 暂无可自动施法的技能</div>
                    <div style="font-size: 0.9em; opacity: 0.8;">学习主动技能或光环技能后，可在此处设置自动施法</div>
                </div>
            `;
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

.skill-class-label {
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.3em;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 15;
}

.skill-node:hover .skill-class-label {
    opacity: 0.8;
}

.current-class-display {
    font-size: 1.2em;
    color: #4CAF50;
    margin-top: 10px;
}
`;
document.head.appendChild(style);

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillUI;
}