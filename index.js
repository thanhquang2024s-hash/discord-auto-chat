const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let config = {
    token: process.env.DISCORD_TOKEN || "",
    channelId: "",
    messages: ["Xin chào!", "Auto chat từ Mobile App 24/7"],
    delaySeconds: 15,
    isRandom: false,
    isRunning: false
};

let client = null;
let chatInterval = null;
let messageIndex = 0;

function startBot() {
    if (config.isRunning) return;
    if (!config.token || !config.channelId || config.messages.length === 0) return;

    client = new Client();

    client.on('ready', async () => {
        console.log(`✅ Bot đã kết nối tài khoản: ${client.user.tag}`);
        config.isRunning = true;

        chatInterval = setInterval(async () => {
            try {
                const channel = await client.channels.fetch(config.channelId);
                if (!channel) return;

                let msg = "";
                if (config.isRandom) {
                    msg = config.messages[Math.floor(Math.random() * config.messages.length)];
                } else {
                    msg = config.messages[messageIndex];
                    messageIndex = (messageIndex + 1) % config.messages.length;
                }

                await channel.send(msg);
                console.log(`[${new Date().toLocaleTimeString()}] 📨 Đã gửi: ${msg}`);
            } catch (err) {
                console.error("❌ Lỗi gửi tin:", err.message);
            }
        }, config.delaySeconds * 1000);
    });

    client.login(config.token).catch(err => console.error("❌ Lỗi Token:", err.message));
}

function stopBot() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
    if (client) {
        client.destroy();
        client = null;
    }
    config.isRunning = false;
    console.log("🔴 Đã dừng Auto Chat");
}

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auto Chat Manager</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; margin: 0; }
            .card { background: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
            h2 { font-size: 18px; margin-top: 0; color: #38bdf8; }
            label { display: block; margin: 8px 0 4px; font-size: 13px; color: #94a3b8; }
            input, textarea { width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 8px; font-size: 14px; }
            .status { font-weight: bold; padding: 6px 12px; border-radius: 20px; display: inline-block; font-size: 12px; margin-bottom: 12px; }
            .running { background: #059669; color: #fff; }
            .stopped { background: #dc2626; color: #fff; }
            .btn-group { display: flex; gap: 8px; margin-top: 12px; }
            button { flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; }
            .btn-start { background: #10b981; color: white; }
            .btn-stop { background: #ef4444; color: white; }
            .btn-save { background: #3b82f6; color: white; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>📱 Trạng Thái Bot</h2>
            <div class="status ${config.isRunning ? 'running' : 'stopped'}">
                ${config.isRunning ? '🟢 ĐANG CHẠY 24/7' : '🔴 ĐÃ DỪNG'}
            </div>
            <div class="btn-group">
                <form action="/action" method="POST" style="flex:1;"><input type="hidden" name="type" value="start"><button class="btn-start">▶ Bắt đầu</button></form>
                <form action="/action" method="POST" style="flex:1;"><input type="hidden" name="type" value="stop"><button class="btn-stop">⏹ Dừng</button></form>
            </div>
        </div>

        <div class="card">
            <h2>⚙️ Cấu Hình</h2>
            <form action="/save" method="POST">
                <label>Discord Token:</label>
                <input type="password" name="token" value="${config.token}" placeholder="Nhập User Token">
                
                <label>Channel ID (ID Kênh):</label>
                <input type="text" name="channelId" value="${config.channelId}" placeholder="Nhập ID kênh gửi tin">

                <label>Thời gian delay (giây):</label>
                <input type="number" name="delaySeconds" value="${config.delaySeconds}" min="5">

                <label>Danh sách tin nhắn (Mỗi dòng 1 tin):</label>
                <textarea name="messages" rows="5">${config.messages.join('\n')}</textarea>

                <div class="btn-group">
                    <button class="btn-save">💾 Lưu Cấu Hình</button>
                </div>
            </form>
        </div>
    </body>
    </html>
    `);
});

app.post('/save', (req, res) => {
    config.token = req.body.token.trim();
    config.channelId = req.body.channelId.trim();
    config.delaySeconds = parseInt(req.body.delaySeconds) || 15;
    config.messages = req.body.messages.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    res.redirect('/');
});

app.post('/action', (req, res) => {
    if (req.body.type === 'start') startBot();
    if (req.body.type === 'stop') stopBot();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server Web App đang chạy tại port ${PORT}`));
