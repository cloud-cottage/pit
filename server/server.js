const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // 添加 fs 模块检查文件

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.send('Welcome to the image generator API!');
});

app.post('/upload', upload.single('avatar'), async (req, res) => {
  try {
    // 检查上传文件
    if (!req.file || !req.file.buffer) {
      return res.status(400).send('请上传头像文件（avatar）');
    }
    const { title = '默认头衔', nickname = '默认昵称' } = req.body; // 设置默认值
    const avatarBuffer = req.file.buffer;

    // 检查本地文件是否存在
    const baseImagePath = path.join(__dirname, 'base_image.jpg');
    const coverImagePath = path.join(__dirname, 'cover_thumb.png');
    if (!fs.existsSync(baseImagePath) || !fs.existsSync(coverImagePath)) {
      return res.status(500).send('服务器缺少底图文件');
    }

    const avatar = await sharp(avatarBuffer).resize(280, 280).toBuffer();
    const baseImage = await sharp(baseImagePath).toBuffer();
    const coverImage = await sharp(coverImagePath).toBuffer();

    const avataredImage = await sharp(baseImage)
      .composite([
        {
          input: await sharp(avatar)
            .rotate(-19, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer(),
          top: 530,
          left: 135,
        },
      ])
      .toBuffer();

    const titledImage = await sharp(avataredImage)
      .composite([
        {
          input: await sharp(
            Buffer.from(
              `<svg width="600" height="80"><text x="10" y="50" font-size="40" fill="black">${title}</text></svg>`
            )
          )
            .rotate(-20, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer(),
          top: 325,
          left: 505,
        },
      ])
      .toBuffer();

    const namedImage = await sharp(titledImage)
      .composite([
        {
          input: await sharp(
            Buffer.from(
              `<svg width="600" height="80"><text x="10" y="50" font-size="40" fill="black">${nickname}</text></svg>`
            )
          )
            .rotate(-20, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer(),
          top: 525,
          left: 605,
        },
      ])
      .toBuffer();

    const finalImage = await sharp(namedImage)
      .composite([{ input: coverImage, top: 0, left: 5 }])
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(finalImage);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`生成图片失败：${error.message}`);
  }
});

module.exports = app;