const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// 允许跨域请求
app.use(cors());

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 处理文件上传和图片生成
app.post('/upload', upload.single('avatar'), async (req, res) => {
    try {
        const { title } = req.body;
        const { nickname } = req.body;
        const avatarBuffer = req.file.buffer;

        // 处理头像
        const avatar = await sharp(avatarBuffer)
            .resize(280, 280)
            .toBuffer();

        // 加载底图
        const baseImagePath = path.join(__dirname, 'base_image.jpg');
        const baseImage = await sharp(baseImagePath).toBuffer();
        const coverImagePath = path.join(__dirname, 'cover_thumb.png');
        const coverImage = await sharp(coverImagePath).toBuffer();


        // 合成图片
        const avataredImage = await sharp(baseImage)
            .composite([
                {
                    input: await sharp(avatar)
                        .rotate(-19, { background: { r: 0, g: 0, b: 0, alpha: 0 } }) // 旋转 20 度，背景透明
                        .toBuffer(),
                    top: 530, // 头像位置
                    left: 135,
                },
            ])
            .toBuffer();

        // 添加头衔
        const titledImage = await sharp(avataredImage)
        .composite([
            {
                input: await sharp(Buffer.from(
                    `<svg width="600" height="80">
                        <text x="10" y="50" font-size="40" fill="black">${title}</text>
                    </svg>`
                ))
                .rotate(-20, { background: { r: 0, g: 0, b: 0, alpha: 0 } }) // 旋转 20 度，背景透明
                .toBuffer(),
                top: 325, // 昵称位置
                left: 505,
            },
        ])
        .toBuffer();


        // 添加昵称
        const namedImage = await sharp(titledImage)
        .composite([
            {
                input: await sharp(Buffer.from(
                    `<svg width="600" height="80">
                        <text x="10" y="50" font-size="40" fill="black">${nickname}</text>
                    </svg>`
                ))
                .rotate(-20, { background: { r: 0, g: 0, b: 0, alpha: 0 } }) // 旋转 20 度，背景透明
                .toBuffer(),
                top: 525, // 昵称位置
                left: 605,
            },
        ])
        .toBuffer();

        const finalImage = await sharp(namedImage)
            .composite([
                {
                    input: await sharp(coverImage)
                        .toBuffer(),
                    top: 0, // 大拇指覆盖
                    left: 5,
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