// Matrix 动画效果
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

// 设置 canvas 尺寸
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Matrix 雨滴效果
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const fontSize = 14;
const columns = Math.floor(canvas.width / fontSize);
const drops = new Array(columns).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0F0';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50);

// Base64 功能实现
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');

// 编码功能
encodeBtn.addEventListener('click', () => {
    try {
        const input = inputText.value;
        const encoded = btoa(unescape(encodeURIComponent(input)));
        outputText.value = encoded;
    } catch (e) {
        outputText.value = '编码错误：请检查输入内容';
    }
});

// 解码功能
decodeBtn.addEventListener('click', () => {
    try {
        const input = inputText.value;
        const decoded = decodeURIComponent(escape(atob(input)));
        outputText.value = decoded;
    } catch (e) {
        outputText.value = '解码错误：请检查输入是否为有效的 Base64 字符串';
    }
});

// 清空功能
clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
});

// 复制功能
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(outputText.value);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制！';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('复制失败:', err);
    }
});

// 添加文件拖放支持
document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            inputText.value = content;
        };
        reader.readAsText(file);
    }
}); 