// 技能UI管理类 - 职业标签页 + 统一分支显示
class SkillUI {
    constructor(skillsSystem) {
        this.skillsSystem = skillsSystem;
        this.currentClass = 'warrior';
        this.tooltip = null;
        this.learnedSkills = new Set();
        this.connections = new Map(); // 存储连接线信息
        
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        // 创建技能页面结构
        this.createSkillPageStructure();
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
            
            <div class="skill-tree-container" id="skill-tree-container">
                <svg class="skill-connections" id="skill-connections">
                    <!-- 连接线将在这里动态生成 -->
                </svg>
                <!-- 技能分支将在这里动态生成 -->
            </div>
            
            <div class="autocast-settings">
                <h3>自动施法设置</h3>
                <div class="autocast-skill-list" id="autocast-skill-list">
                    <!-- 自动施法技能列表 -->
                </div>
            </div>
        `;
    }

    bindEvents() {
        // 职业标签页切换
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('class-tab')) {
                this.switchClass(e.target.dataset.class);
            }
        });
        
        // 监听职业变化
        window.addEventListener('characterClassChanged', (event) => {
            this.updateForClass(event.detail.class);
        });
        
        // 监听技能点变化
        window.addEventListener('skillPointsChanged', () => {
            this.updateSkillPoints();
            this.updateSkillStates();
        });
    }

    switchClass(className) {
        this.currentClass = className;
        
        // 更新标签页状态
        document.querySelectorAll('.class-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.class === className);
        });

        this.renderSkillTree();
        this.updateSkillPoints();
        this.updateAutoCastSettings();
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
        
        this.renderSkillTree();
        this.updateSkillPoints();
        this.updateAutoCastSettings();
    }

    renderSkillTree() {
        const container = document.getElementById('skill-tree-container');
        const svgContainer = document.getElementById('skill-connections');
        if (!container || !this.currentClass) return;

        const classData = SkillTreeData[this.currentClass];
        if (!classData) return;

        // 清空现有内容（保留SVG）
        const existingElements = container.querySelectorAll(':not(svg)');
        existingElements.forEach(el => el.remove());
        svgContainer.innerHTML = '';
        this.connections.clear();

        // 为每个分支创建容器
        Object.entries(classData.branches).forEach(([branchKey, branchData]) => {
            const branchElement = this.createBranchElement(branchKey, branchData);
            container.appendChild(branchElement);
        });

        // 绘制连接线
        setTimeout(() => {
            this.drawConnections(svgContainer, classData);
        }, 100); // 延迟确保DOM已渲染

        // 更新技能状态
        this.updateSkillStates();
    }

    createBranchElement(branchKey, branchData) {
        const branchDiv = document.createElement('div');
        branchDiv.className = 'skill-branch';
        branchDiv.style.borderColor = branchData.color;

        // 分支标题
        const header = document.createElement('div');
        header.className = 'branch-header';
        header.innerHTML = `
            <div class="branch-title" style="color: ${branchData.color}">
                ${branchData.name}
            </div>
        `;

        // 技能节点容器
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'skill-nodes';

        // 按等级组织技能
        const skillsByTier = this.organizeSkillsByTier(branchData.skills);
        
        // 创建技能节点
        Object.entries(skillsByTier).forEach(([tierKey, skills]) => {
            if (skills.length > 0) {
                const tierDiv = document.createElement('div');
                tierDiv.className = 'skill-tier';
                tierDiv.dataset.tier = tierKey;
                
                skills.forEach(skill => {
                    const skillNode = this.createSkillNode(skill, branchData.color);
                    tierDiv.appendChild(skillNode);
                });
                
                nodesContainer.appendChild(tierDiv);
            }
        });

        branchDiv.appendChild(header);
        branchDiv.appendChild(nodesContainer);

        return branchDiv;
    }

    organizeSkillsByTier(skillsData) {
        // 将技能按层级组织
        const organized = {
            basic: [],
            advanced: [],
            expert: [],
            ultimate: []
        };

        Object.entries(skillsData).forEach(([tierKey, skills]) => {
            if (organized[tierKey]) {
                organized[tierKey] = skills;
            }
        });

        return organized;
    }

    createSkillNode(skill, branchColor) {
        const node = document.createElement('div');
        node.className = 'skill-node locked';
        node.dataset.skillId = skill.id;
        node.innerHTML = `
            ${skill.icon}
            <div class="skill-level">0</div>
        `;

        // 添加事件监听
        node.addEventListener('click', (e) => this.handleSkillClick(e, skill));
        node.addEventListener('mouseenter', (e) => this.showTooltip(e, skill));
        node.addEventListener('mouseleave', () => this.hideTooltip());

        return node;
    }

    drawConnections(svgContainer, classData) {
        const container = document.getElementById('skill-tree-container');
        const containerRect = container.getBoundingClientRect();
        
        // 设置SVG尺寸
        svgContainer.style.width = '100%';
        svgContainer.style.height = '100%';
        
        // 遍历所有技能，绘制前置技能连接线
        Object.values(classData.branches).forEach(branchData => {
            Object.values(branchData.skills).flat().forEach(skill => {
                if (skill.prerequisites && skill.prerequisites.length > 0) {
                    skill.prerequisites.forEach(prereqId => {
                        this.drawConnection(svgContainer, prereqId, skill.id, branchData.color, containerRect);
                    });
                }
            });
        });
    }

    drawConnection(svgContainer, fromSkillId, toSkillId, color, containerRect) {
        const fromNode = document.querySelector(`[data-skill-id="${fromSkillId}"]`);
        const toNode = document.querySelector(`[data-skill-id="${toSkillId}"]`);
        
        if (!fromNode || !toNode) return;

        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();

        // 计算相对于容器的坐标
        const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
        const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
        const toX = toRect.left - containerRect.left + toRect.width / 2;
        const toY = toRect.top - containerRect.top + toRect.height / 2;

        // 创建连接线
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromX);
        line.setAttribute('y1', fromY);
        line.setAttribute('x2', toX);
        line.setAttribute('y2', toY);
        line.setAttribute('class', 'skill-connection');
        
        // 检查连接状态
        const character = window.game?.character;
        const fromLearned = this.learnedSkills.has(fromSkillId);
        const toLearned = this.learnedSkills.has(toSkillId);
        
        if (fromLearned && toLearned) {
            line.classList.add('active');
        } else if (fromLearned && !toLearned) {
            line.classList.add('prerequisite');
        }
        
        line.style.stroke = color;
        svgContainer.appendChild(line);
        
        // 存储连接信息
        this.connections.set(`${fromSkillId}-${toSkillId}`, {
            element: line,
            from: fromSkillId,
            to: toSkillId
        });
    }

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
            currentClass: this.currentClass
        };
    }

    // 加载技能数据
    loadSkillData(data) {
        if (data) {
            this.learnedSkills = new Set(data.learnedSkills || []);
            this.currentClass = data.currentClass || 'warrior';
            
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