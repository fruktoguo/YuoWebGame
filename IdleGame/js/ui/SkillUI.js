// 技能界面UI类
class SkillUI {
    constructor(game) {
        this.game = game;
        this.initializeUI();
    }

    initializeUI() {
        this.bindEvents();
        this.update();
    }

    bindEvents() {
        // 技能升级按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('skill-upgrade-btn')) {
                const skillId = e.target.getAttribute('data-skill-id');
                this.upgradeSkill(skillId);
            }
        });

        // 自动释放切换
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('skill-auto-toggle')) {
                const skillId = e.target.getAttribute('data-skill-id');
                this.toggleAutoSkill(skillId, e.target.checked);
            }
        });
    }

    update() {
        this.updateSkillPoints();
        this.updateSkillTree();
        this.updateActiveSkills();
    }

    updateSkillPoints() {
        const pointsElement = document.getElementById('skill-points');
        if (pointsElement) {
            pointsElement.textContent = this.game.skills.skillPoints;
        }
    }

    updateSkillTree() {
        const treeElement = document.getElementById('skill-tree');
        if (!treeElement) return;

        const skillTreeData = this.game.skills.getSkillTreeData();
        let treeHTML = '';

        skillTreeData.forEach(category => {
            treeHTML += `
                <div class="skill-category">
                    <div class="category-header">${category.name}</div>
                    <div class="skill-list">
            `;

            category.skills.forEach(skillId => {
                const skillData = getSkillData(skillId);
                const currentLevel = this.game.skills.learnedSkills[skillId] || 0;
                const canLearn = this.game.skills.canLearnSkill(skillId, currentLevel + 1);
                const cost = this.game.skills.getSkillCost(skillId, currentLevel + 1);

                treeHTML += `
                    <div class="skill-item ${currentLevel > 0 ? 'learned' : ''} ${canLearn ? 'available' : 'locked'}">
                        <div class="skill-icon">${this.getSkillIcon(skillData)}</div>
                        <div class="skill-info">
                            <div class="skill-name">${skillData.name}</div>
                            <div class="skill-level">等级: ${currentLevel}/${skillData.maxLevel}</div>
                            <div class="skill-description">${skillData.description}</div>
                            ${currentLevel < skillData.maxLevel ? `
                                <button class="skill-upgrade-btn ${canLearn && this.game.skills.skillPoints >= cost ? '' : 'disabled'}" 
                                        data-skill-id="${skillId}">
                                    升级 (${cost} 点)
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            treeHTML += `
                    </div>
                </div>
            `;
        });

        treeElement.innerHTML = treeHTML;
    }

    updateActiveSkills() {
        const activeElement = document.getElementById('active-skills');
        if (!activeElement) return;

        const learnedSkills = this.game.skills.getLearnedSkills();
        const activeSkills = learnedSkills.filter(skill => skill.data.type === 'active');

        let activeHTML = '<div class="active-skills-header">主动技能设置</div>';

        activeSkills.forEach(skill => {
            const isAuto = this.game.skills.activeSkills.includes(skill.id);
            const cooldown = this.game.skills.getRemainingCooldown(skill.id);

            activeHTML += `
                <div class="active-skill-item">
                    <div class="skill-icon">${this.getSkillIcon(skill.data)}</div>
                    <div class="skill-info">
                        <div class="skill-name">${skill.data.name} Lv.${skill.level}</div>
                        <div class="skill-cooldown">
                            ${cooldown > 0 ? `冷却: ${cooldown.toFixed(1)}s` : '就绪'}
                        </div>
                    </div>
                    <div class="skill-controls">
                        <label class="auto-toggle">
                            <input type="checkbox" class="skill-auto-toggle" 
                                   data-skill-id="${skill.id}" ${isAuto ? 'checked' : ''}>
                            自动释放
                        </label>
                    </div>
                </div>
            `;
        });

        activeElement.innerHTML = activeHTML;
    }

    upgradeSkill(skillId) {
        if (this.game.skills.upgradeSkill(skillId)) {
            this.update();
        }
    }

    toggleAutoSkill(skillId, enabled) {
        this.game.skills.setAutoSkill(skillId, enabled);
    }

    getSkillIcon(skillData) {
        const icons = {
            attack: '⚔️',
            defense: '🛡️',
            magic: '🔮',
            heal: '💚',
            buff: '✨',
            passive: '📈'
        };
        return icons[skillData.category] || '⚡';
    }
} 