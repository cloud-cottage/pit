const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// 静态文件服务
app.use(express.static('public'));

// 处理文件上传和图片生成
app.post('/upload', upload.single('avatar'), async (req, res) => {
    try {
        const { nickname } = req.body;
        const avatarPath = req.file.path;

        // 处理头像
        const avatar = await sharp(avatarPath)
            .resize(200, 200)
            .toBuffer();

        // 加载底图
        const baseImagePath = path.join(__dirname, 'base_image.jpg');
        const outputImagePath = path.join(__dirname, 'output_image.jpg');

        // 合成图片
        await sharp(baseImagePath)
            .composite([
                { input: avatar, top: 100, left: 100 }, // 头像位置
            ])
            .toFile(outputImagePath);

        // 添加昵称
        await sharp(outputImagePath)
            .composite([
                {
                    input: Buffer.from(
                        `<svg width="500" height="100">
                            <text x="10" y="50" font-size="30" fill="white">${nickname}</text>
                        </svg>`
                    ),
                    top: 300, // 昵称位置
                    left: 100,
                },
            ])
            .toFile(outputImagePath);

        // 返回生成的图片 URL
        const imageUrl = `/output_image.jpg?t=${Date.now()}`;
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('生成图片失败！');
    }
});

// 提供生成的图片
app.get('/output_image.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'output_image.jpg'));
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});