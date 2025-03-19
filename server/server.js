const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.send('Welcome to the Image Generator API!');
});

app.post('/upload', upload.single('avatar'), async (req, res) => {
  try {
    console.log('Received upload request:', { title: req.body.title, nickname: req.body.nickname, file: !!req.file });

    if (!req.file || !req.file.buffer) {
      return res.status(400).send('请上传头像文件（avatar）');
    }
    const { title = '默认头衔', nickname = '默认昵称' } = req.body;
    const avatarBuffer = req.file.buffer;

    const baseImagePath = path.join(__dirname, 'base_image.jpg');
    const coverImagePath = path.join(__dirname, 'cover_thumb.png');
    const fontPath = path.join(__dirname, 'LXGWWenKaiMonoGB-Regular.ttf');

    console.log('Checking files:', {
      baseImage: fs.existsSync(baseImagePath),
      coverImage: fs.existsSync(coverImagePath),
      font: fs.existsSync(fontPath),
    });

    if (!fs.existsSync(baseImagePath) || !fs.existsSync(coverImagePath) || !fs.existsSync(fontPath)) {
      return res.status(500).send(`服务器缺少文件：${[
        !fs.existsSync(baseImagePath) && 'base_image.jpg',
        !fs.existsSync(coverImagePath) && 'cover_thumb.png',
        !fs.existsSync(fontPath) && 'LXGWWenKaiMonoGB-Regular.ttf',
      ].filter(Boolean).join(', ')}`);
    }

    console.log('Processing avatar...');
    const avatar = await sharp(avatarBuffer).resize(280, 280).toBuffer();
    console.log('Loading base image...');
    const baseImage = await sharp(baseImagePath).toBuffer();
    console.log('Loading cover image...');
    const coverImage = await sharp(coverImagePath).toBuffer();

    console.log('Compositing avatar...');
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

    console.log('Adding title...');
    const titleImage = await sharp({
      text: {
        text: title,
        font: 'LXGWWenKaiMonoGB-Regular',
        fontfile: fontPath,
        width: 600,  // 仅保留 width，移除 height
        dpi: 300,   // 使用 dpi 控制文字大小
        rgba: true,
      },
    })
      .png()  // 确保输出 PNG 格式
      .toBuffer();

    const titledImage = await sharp(avataredImage)
      .composite([
        {
          input: await sharp(titleImage)
            .rotate(-20, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer(),
          top: 375,
          left: 525,
        },
      ])
      .toBuffer();

    console.log('Adding nickname...');
    const nicknameImage = await sharp({
      text: {
        text: nickname,
        font: 'LXGWWenKaiMonoGB-Regular',
        fontfile: fontPath,
        width: 600,  // 仅保留 width，移除 height
        dpi: 300,   // 使用 dpi 控制文字大小
        rgba: true,
      },
    })
      .png()  // 确保输出 PNG 格式
      .toBuffer();

    const namedImage = await sharp(titledImage)
      .composite([
        {
          input: await sharp(nicknameImage)
            .rotate(-20, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer(),
          top: 575,
          left: 625,
        },
      ])
      .toBuffer();

    console.log('Adding cover image...');
    const finalImage = await sharp(namedImage)
      .composite([{ input: coverImage, top: 0, left: 5 }])
      .toBuffer();

    console.log('Sending response...');
    res.set('Content-Type', 'image/jpeg');
    res.send(finalImage);
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).send(`生成图片失败：${error.message}`);
  }
});

module.exports = app;