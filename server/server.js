const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // 使用内存存储，不保存文件

// 允许跨域请求
app.use(cors());

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 处理文件上传和图片生成
app.post('/upload', upload.single('avatar'), async (req, res) => {
    try {
        const { nickname } = req.body;
        const avatarBuffer = req.file.buffer; // 从内存中获取文件

        // 处理头像
        const avatar = await sharp(avatarBuffer)
            .resize(200, 200)
            .toBuffer();

        // 加载底图
        const baseImagePath = path.join(__dirname, 'base_image.jpg');
        const baseImage = await sharp(baseImagePath).toBuffer();

        // 合成图片
        const outputImage = await sharp(baseImage)
            .composite([
                { input: avatar, top: 100, left: 100 }, // 头像位置
            ])
            .toBuffer();

        // 添加昵称
        const finalImage = await sharp(outputImage)
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
            .toBuffer();

        // 返回生成的图片
        res.set('Content-Type', 'image/jpeg');
        res.send(finalImage);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('生成图片失败！');
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});