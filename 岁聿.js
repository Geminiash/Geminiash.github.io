// 岁聿.js
// 世界上最浪漫的星空告白 —— 纯粹、温柔、永恒
// 没有任何交互功能，只有流淌的星光与偶然的流星，以及心底的那一句“爱你如初”

(function() {
    "use strict";

    // --- 获取画布与上下文 ---
    const canvas = document.getElementById('岁聿Canvas');
    const ctx = canvas.getContext('2d');

    // --- 全局变量 ---
    let width, height;                  // 画布实时尺寸
    let stars = [];                     // 星星数组
    let meteors = [];                   // 流星数组
    let animationFrame = null;           // requestAnimationFrame ID

    // 月亮参数：固定在右上区域，温暖模糊
    const moon = {
        x: 0.8,          // 相对横坐标 (比例)
        y: 0.18,         // 相对纵坐标
        radius: 48,      // 基础半径 (px)
        glow: 30,        // 光晕半径
    };

    // --- 星星参数 ---
    const STAR_COUNT = 130;              // 星星数量
    const MAX_STAR_RADIUS = 2.6;          // 最大半径(px)
    const MIN_STAR_RADIUS = 0.8;          // 最小半径

    // --- 流星参数 ---
    const METEOR_SPEED = 0.008;           // 每帧移动步长比例 (相对长边)
    const METEOR_LENGTH = 0.15;            // 流星尾迹长度 (相对长边)
    const METEOR_BRIGHTNESS = 0.9;         // 基础亮度
    const NEW_METEOR_PROB = 0.012;         // 每帧生成新流星的概率

    // --- 辅助函数：生成随机浮点数范围 ---
    const rand = (min, max) => Math.random() * (max - min) + min;
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // --- 初始化星星 (基于当前画布尺寸) ---
    function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            // 位置归一化 (0~1)，保证不论窗口大小，星星分布均匀
            const x = Math.random();
            const y = Math.random();
            // 半径 (px) 固定范围，小一些更自然
            const radius = rand(MIN_STAR_RADIUS, MAX_STAR_RADIUS);
            // 基础亮度 0.4~1.0 之间，个别暗一些
            const baseBright = rand(0.4, 1.0);
            // 闪烁速度：每个星星有自己的节奏 (0.002~0.02)
            const twinkleSpeed = rand(0.003, 0.018);
            // 相位偏移，让闪烁不同步
            const phase = rand(0, 2 * Math.PI);
            stars.push({
                x, y, radius,
                baseBright,
                twinkleSpeed,
                phase,
            });
        }
    }

    // --- 生成一颗新流星 (起点、终点、进度) ---
    function createMeteor() {
        // 流星的起点在画布外或边缘，方向随机偏右下至左上常见，也可任意
        // 为了浪漫，让流星从左上向右下划过，也可以随机
        const edge = randInt(0, 3); // 0:左,1:上,2:右,3:下
        let startX, startY, endX, endY;
        const padding = 20; // 稍微超出画布，避免出现点生硬

        // 决定方向向量，让流星有长轨迹
        const angle = rand(-0.6, 0.6) + Math.PI / 4; // 主要倾向45度方向，但有一定变化
        const dx = Math.cos(angle) * width * METEOR_LENGTH;
        const dy = Math.sin(angle) * width * METEOR_LENGTH; // 用宽度做基准

        switch(edge) {
            case 0: // 左边缘
                startX = -padding;
                startY = rand(padding, height - padding);
                endX = startX + dx;
                endY = startY + dy;
                break;
            case 1: // 上边缘
                startX = rand(padding, width - padding);
                startY = -padding;
                endX = startX + dx;
                endY = startY + dy;
                break;
            case 2: // 右边缘
                startX = width + padding;
                startY = rand(padding, height - padding);
                endX = startX - dx; // 反向，让流星从右往左
                endY = startY - dy;
                break;
            case 3: // 下边缘
                startX = rand(padding, width - padding);
                startY = height + padding;
                endX = startX - dx;
                endY = startY - dy;
                break;
            default: break;
        }

        // 确保终点也可能超出画布，没关系
        return {
            startX, startY,
            endX, endY,
            progress: 0.0,        // 从0开始
            speed: rand(0.005, 0.015), // 每帧进度增量
            width: rand(1.2, 2.5), // 流星头部宽度
        };
    }

    // --- 调整画布尺寸 & 重置星星分布(保持比例) ---
    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // 重新生成星星 (适应新尺寸的比例分布自动保留，但绝对像素无影响)
        initStars();

        // 清空流星 (或者保持原有？但尺寸突变流星可能会错位，简单清掉)
        meteors = [];
    }

    // --- 绘制夜空背景 (渐变) ---
    function drawSky() {
        // 从深邃蓝紫到暖紫的渐变，接近地平线处透出微红光，寓意黎明或思念
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a1030');    // 顶部深蓝
        gradient.addColorStop(0.45, '#1a1f3a');
        gradient.addColorStop(0.75, '#3b2c44');
        gradient.addColorStop(1, '#6d4c5c');    // 底部暖棕调，模拟城市极微光或晚霞余韵
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 额外增加一层薄雾，柔和
        ctx.fillStyle = 'rgba(70, 50, 80, 0.06)';
        ctx.fillRect(0, 0, width, height);
    }

    // --- 绘制月亮 (带光晕) ---
    function drawMoon() {
        const moonX = moon.x * width;
        const moonY = moon.y * height;
        const radius = moon.radius * (height / 800); // 根据屏幕高度微调，保持比例
        const glow = moon.glow * (height / 800);

        // 多层光晕
        for (let i = 3; i > 0; i--) {
            const alpha = 0.1 + i * 0.06;
            ctx.beginPath();
            ctx.arc(moonX, moonY, radius + glow * i * 0.8, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255, 220, 180, ${alpha})`;
            ctx.fill();
        }

        // 月亮本体
        ctx.beginPath();
        ctx.arc(moonX, moonY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#fbe9d2';
        ctx.shadowColor = '#ffd9b0';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0; // 重置阴影

        // 一点点月面细节 (随意)
        ctx.beginPath();
        ctx.arc(moonX - radius*0.2, moonY - radius*0.1, radius*0.15, 0, 2*Math.PI);
        ctx.fillStyle = 'rgba(180, 140, 110, 0.3)';
        ctx.fill();
    }

    // --- 绘制星星 (包含闪烁效果) ---
    function drawStars(now) {
        for (let s of stars) {
            // 计算实时亮度: 在基础亮度上叠加正弦波动，幅度0.2~0.35
            const twinkle = Math.sin(now * s.twinkleSpeed + s.phase) * 0.2 + 0.25;
            let bright = s.baseBright + twinkle;
            if (bright > 1.0) bright = 1.0;
            if (bright < 0.3) bright = 0.3; // 最小亮度

            const x = s.x * width;
            const y = s.y * height;
            const radius = s.radius * (height / 700); // 轻微响应高度

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255, 245, 230, ${bright})`;
            ctx.fill();

            // 偶尔给较亮的星星加一点星芒（极简）
            if (s.baseBright > 0.85 && radius > 1.5) {
                ctx.shadowColor = `rgba(255, 200, 170, ${bright*0.5})`;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    // --- 更新并绘制流星 ---
    function drawMeteors() {
        if (!meteors.length) return;

        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            // 根据进度计算当前位置
            const curX = m.startX + (m.endX - m.startX) * m.progress;
            const curY = m.startY + (m.endY - m.startY) * m.progress;
            // 尾巴方向向量
            const dirX = m.endX - m.startX;
            const dirY = m.endY - m.startY;
            const len = Math.hypot(dirX, dirY);
            if (len < 0.1) { meteors.splice(i, 1); continue; } // 异常移除

            // 尾迹终点 (向后延伸一段)
            const tailFactor = 0.5; // 尾迹长度比例
            const tailX = curX - dirX * tailFactor;
            const tailY = curY - dirY * tailFactor;

            // 绘制流星光尾 (渐变线段)
            const gradient = ctx.createLinearGradient(tailX, tailY, curX, curY);
            gradient.addColorStop(0, 'rgba(255, 250, 240, 0)');
            gradient.addColorStop(0.4, `rgba(255, 240, 210, ${METEOR_BRIGHTNESS * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 255, 250, ${METEOR_BRIGHTNESS})`);

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(curX, curY);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = m.width * (height / 800);
            ctx.lineCap = 'round';
            ctx.stroke();

            // 头部亮点
            ctx.beginPath();
            ctx.arc(curX, curY, m.width * 0.8, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255, 255, 250, ${METEOR_BRIGHTNESS})`;
            ctx.fill();

            // 更新进度
            m.progress += m.speed;
            // 如果超出终点太多或者起点终点都不可见，移除
            if (m.progress > 1.5) { // 超过1.2就移除
                meteors.splice(i, 1);
            }
        }
    }

    // --- 动画主循环 (timestamp) ---
    function draw(timestamp) {
        if (!width || !height) return;

        // 清空画布 (但我们会重绘全部)
        ctx.clearRect(0, 0, width, height);

        // 1. 绘制夜空渐变
        drawSky();

        // 2. 绘制月亮 (置于底层但星星在上会更自然)
        drawMoon();

        // 3. 绘制星星 (传入时间戳用于闪烁)
        drawStars(timestamp);

        // 4. 尝试生成新流星
        if (Math.random() < NEW_METEOR_PROB && meteors.length < 3) { // 同时最多3颗流星
            meteors.push(createMeteor());
        }

        // 5. 绘制流星
        drawMeteors();

        // 继续下一帧
        animationFrame = requestAnimationFrame(draw);
    }

    // --- 窗口resize事件处理 (防抖) ---
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeCanvas();
        }, 80);
    });

    // --- 初始化启动 ---
    function init() {
        resizeCanvas();          // 设置尺寸 + 初始化星星
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        animationFrame = requestAnimationFrame(draw);
    }

    init();


    console.log('%c🌙 岁聿云暮，星河长明。\n❤️ ', 'color: #ffb6a5; font-size: 16px; font-family: Georgia; padding: 8px; background: #1a1326; border-radius: 20px; border: 1px solid #d68b6c;');

})();