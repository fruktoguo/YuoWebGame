// 游戏文本表
class GameTexts {
    static currentLanguage = 'zh-CN';
    
    static texts = {
        'zh-CN': {
            // 基础属性
            'stat.level': '等级',
            'stat.exp': '经验值',
            'stat.health': '生命值',
            'stat.mana': '魔法值',
            'stat.attack': '攻击力',
            'stat.spellPower': '法术强度',
            'stat.defense': '防御值',
            'stat.magicResist': '魔法抗性',
            'stat.critRate': '暴击率',
            'stat.critDamage': '暴击伤害',
            'stat.hitRate': '命中率',
            'stat.dodgeRate': '闪避率',
            'stat.blockRate': '格挡率',
            'stat.attackSpeed': '攻击速度',
            'stat.skillHaste': '技能急速',
            'stat.moveSpeed': '移动速度',
            'stat.healthRegen': '生命回复',
            'stat.manaRegen': '魔法回复',
            
            // 装备属性
            'stat.physicalAttack': '物理攻击',
            'stat.magicalAttack': '魔法攻击',
            'stat.skillCooldown': '技能冷却',
            
            // 属性分配
            'attr.strength': '力量',
            'attr.agility': '敏捷',
            'attr.intelligence': '智力',
            'attr.spirit': '精神',
            'attr.stamina': '耐力',
            
            'attr.strength.desc': '增加攻击力和少量生命值',
            'attr.agility.desc': '增加命中、闪避和暴击，少量增加攻击力',
            'attr.intelligence.desc': '增加法术强度和魔法值',
            'attr.spirit.desc': '增加魔法抗性和技能急速',
            'attr.stamina.desc': '增加生命值和防御值',
            
            // 标签页
            'tab.attack': '⚔️ 攻击',
            'tab.defense': '🛡️ 防御',
            'tab.other': '✨ 其他',
            
            // 装备槽位
            'slot.helmet': '头盔',
            'slot.chest': '胸甲',
            'slot.pants': '护腿',
            'slot.boots': '靴子',
            'slot.gloves': '手套',
            'slot.lefthand': '左手',
            'slot.righthand': '右手',
            'slot.necklace': '项链',
            'slot.ring1': '戒指1',
            'slot.ring2': '戒指2',
            'slot.belt': '腰带',
            'slot.shoulder': '肩甲',
            'slot.earring': '耳环',
            'slot.cloak': '斗篷',
            
            // 装备槽位（完整名称）
            'slot.lefthand.full': '左手武器',
            'slot.righthand.full': '右手武器',
            'slot.ring1.full': '戒指',
            'slot.ring2.full': '戒指',
            
            // 品质
            'quality.common': '普通',
            'quality.magic': '魔法',
            'quality.rare': '稀有',
            'quality.epic': '史诗',
            'quality.legendary': '传说',
            
            // 职业
            'class.warrior': '战士',
            'class.mage': '法师',
            'class.tank': '坦克',
            'class.priest': '牧师',
            'class.assassin': '刺客',
            'class.archer': '射手',
            
            // UI文本
            'ui.freePoints': '自由属性点',
            'ui.allocated': '已分配',
            'ui.equipment': '装备',
            'ui.materials': '材料',
            'ui.sort.quality': '品质',
            'ui.sort.level': '等级',
            'ui.sort.type': '类型',
            'ui.level': '等级',
            'ui.stats': '属性',
            'ui.slot': '部位',
            'ui.selectSkill': '选择技能',
            'ui.emptySkillSlot': '空技能槽',
            'ui.skillReady': '就绪',
            'ui.skillCooldown': '冷却',
            'ui.activeSkillSettings': '主动技能设置',
            'ui.combatLogCleared': '战斗日志已清空',
            'ui.pause': '暂停',
            'ui.resume': '继续',
            'ui.equipmentBonus': '装备加成',
            'ui.equipmentScore': '装备评分',
            
            // 通知消息
            'msg.equipped': '装备了',
            'msg.unequipped': '卸下了',
            'msg.levelUp': '升级到 {0} 级！',
            'msg.gainExp': '获得 {0} 经验值',
            'msg.gainGold': '+{0} 金币',
            'msg.gainGems': '+{0} 宝石',
            'msg.inventoryFull': '背包已满',
            'msg.noFreePoints': '没有可用的属性点',
            'msg.allocatedPoint': '增加了 {0}',
            'msg.saveSuccess': '游戏已保存',
            'msg.saveFailed': '保存游戏失败',
            'msg.loadSuccess': '游戏已加载',
            'msg.loadFailed': '加载游戏失败',
            'msg.exportSuccess': '存档已导出',
            'msg.exportFailed': '导出存档失败',
            'msg.importSuccess': '存档已导入',
            'msg.importFailed': '导入存档失败',
            'msg.gameReset': '游戏已重置',
            'msg.backupRestored': '备份已恢复',
            'msg.noSaveToExport': '没有可导出的存档',
            'msg.invalidSaveFormat': '存档格式无效',
            'msg.fileReadError': '读取文件失败',
            'msg.noFileSelected': '没有选择文件',
            'msg.saveIncompatible': '存档版本不兼容',
            
            // 确认对话框
            'confirm.resetGame': '确定要重置游戏吗？这将删除所有进度！',
            'confirm.clearInventory': '确定要清空背包吗？',
            'confirm.clearSave': '确定要清除存档吗？这将删除所有游戏进度！',
            'confirm.resetGameFull': '确定要重置游戏吗？这将清除所有进度并重新开始！',
            
            // 百分比提示
            'tooltip.critRate': '暴击率: {0}%',
            'tooltip.hitRate': '命中率: {0}%',
            'tooltip.dodgeRate': '闪避率: {0}%',
            'tooltip.blockRate': '格挡率: {0}%',
            'tooltip.defenseReduction': '物理减伤: {0}%',
            'tooltip.magicResistReduction': '魔法减伤: {0}%',
            'tooltip.skillHasteReduction': '技能冷却减少: {0}%',
            
            // 时间单位
            'time.second': '秒',
            'time.minute': '分',
            'time.hour': '小时',
        }
    };
    
    // 获取文本
    static getText(key, ...args) {
        const text = this.texts[this.currentLanguage]?.[key] || key;
        
        // 处理参数替换 {0}, {1}, {2}...
        if (args.length > 0) {
            return text.replace(/\{(\d+)\}/g, (match, index) => {
                return args[parseInt(index)] || match;
            });
        }
        
        return text;
    }
    
    // 设置语言
    static setLanguage(language) {
        if (this.texts[language]) {
            this.currentLanguage = language;
            // 触发UI更新事件
            if (window.game) {
                window.game.updateAllUI();
            }
        }
    }
    
    // 获取当前语言
    static getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // 获取可用语言列表
    static getAvailableLanguages() {
        return Object.keys(this.texts);
    }
}

// 简化的全局函数
function T(key, ...args) {
    return GameTexts.getText(key, ...args);
} 