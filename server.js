// AIGC START
/**
 * 寻亲 AI · 老照片修复 — 后端服务
 * Node.js + Express，代理豆包 Seedream 图像 API
 */
require('dotenv').config();

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;
const API_BASE_URL =
  process.env.API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const SEEDREAM_MODEL =
  process.env.SEEDREAM_MODEL || 'doubao-seedream-5-0-260128';

// 固定提示词模板
const PROMPTS = {
  growAge: {
    positive: (photoAge, targetAge, gender) =>
      `根据上传的${gender}童正面人像照片（拍摄时约${photoAge}岁），生成该${gender === '男' ? '男孩' : '女孩'}成长至${targetAge}岁时的写实高清证件照风格人脸照片。仅生成人脸特写，构图类似身份证或护照证件照：正面平视、双肩以上或头肩特写、人脸居中占画面主体，纯色或浅灰/白色简洁背景，无场景、无道具、无身体大面积展示。需自然体现从${photoAge}岁到${targetAge}岁约${targetAge - photoAge}年的面部成熟与年龄变化，符合${gender}性成年面部特征，同时五官核心特征、脸型结构、眉眼鼻唇比例完全继承原图，皮肤自然，真实人像，高清8K，适合寻亲比对，细节还原精准，不改变五官长相与种族特征`,
    negative:
      '避免：畸形脸、五官错位、模糊、卡通、动漫、美颜过度、背景杂乱、侧脸、多个人像、水印、全身照、半身生活照、户外场景、复杂背景、戴帽遮挡、墨镜遮挡、夸张表情、艺术写真风格',
  },
  restore: {
    positive:
      '修复老旧破损模糊照片，去除划痕、污渍、褶皱，补全缺失面部细节，高清还原面部五官，优化清晰度，色彩自然真实，黑白照片可智能上色，保持原图人物样貌不变，8K高清，质感自然',
    negative:
      '避免：改变人物长相、添加多余元素、卡通化、过度美颜、背景篡改、模糊失真',
  },
};

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/** 将纯 base64 转为 API 可用的 data URL */
function toDataUrl(base64, mimeType = 'image/jpeg') {
  if (!base64) return null;
  if (base64.startsWith('data:')) return base64;
  return `data:${mimeType};base64,${base64}`;
}

/** 调用豆包 Seedream 图生图 API */
async function callSeedreamAPI(prompt, imageDataUrl) {
  if (!API_KEY) {
    throw new Error('未配置 API_KEY，请在 .env 文件中设置');
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}/images/generations`;

  const body = {
    model: SEEDREAM_MODEL,
    prompt,
    image: imageDataUrl,
    size: '2K',
    sequential_image_generation: 'disabled',
    stream: false,
    response_format: 'url',
    watermark: false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `API 请求失败 (${response.status})`;
    throw new Error(msg);
  }

  const item = data?.data?.[0];
  if (!item) {
    throw new Error('API 未返回图片数据');
  }

  return {
    url: item.url || null,
    b64: item.b64_json || null,
  };
}

/** 寻亲年龄生成 */
app.post('/api/grow-age', async (req, res) => {
  try {
    const { image, photoAge, targetAge, gender, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: '请上传图片' });
    }

    const current = parseInt(photoAge, 10);
    const target = parseInt(targetAge, 10);
    if (!current || current < 1 || current > 18) {
      return res
        .status(400)
        .json({ success: false, message: '请输入有效的照片年龄（1-18）' });
    }
    if (!target || target < 2 || target > 120) {
      return res
        .status(400)
        .json({ success: false, message: '请输入有效的目标年龄（2-120）' });
    }
    if (target <= current) {
      return res
        .status(400)
        .json({ success: false, message: '目标年龄须大于照片年龄' });
    }
    if (gender !== '男' && gender !== '女') {
      return res
        .status(400)
        .json({ success: false, message: '请选择有效的性别（男或女）' });
    }

    const imageDataUrl = toDataUrl(image, mimeType || 'image/jpeg');
    const prompt = `${PROMPTS.growAge.positive(current, target, gender)}。${PROMPTS.growAge.negative}`;

    const result = await callSeedreamAPI(prompt, imageDataUrl);

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[grow-age]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/** 老照片修复 */
app.post('/api/restore-photo', async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: '请上传图片' });
    }

    const imageDataUrl = toDataUrl(image, mimeType || 'image/jpeg');
    const prompt = `${PROMPTS.restore.positive}。${PROMPTS.restore.negative}`;

    const result = await callSeedreamAPI(prompt, imageDataUrl);

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[restore-photo]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

const CLUES_FILE = path.join(__dirname, 'data', 'clues.json');
const MAX_CLUE_PHOTOS = 5;

async function loadClues() {
  try {
    const raw = await fs.readFile(CLUES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function saveClues(clues) {
  await fs.mkdir(path.dirname(CLUES_FILE), { recursive: true });
  await fs.writeFile(CLUES_FILE, JSON.stringify(clues, null, 2), 'utf8');
}

/** 线索上报 */
app.post('/api/clues', async (req, res) => {
  try {
    const { description, location, foundAt, contact, photos } = req.body;

    if (!description?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: '请填写线索描述' });
    }
    if (!location?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: '请填写发现地点' });
    }
    if (!foundAt) {
      return res
        .status(400)
        .json({ success: false, message: '请选择发现时间' });
    }

    const photoList = Array.isArray(photos) ? photos : [];
    if (photoList.length > MAX_CLUE_PHOTOS) {
      return res
        .status(400)
        .json({ success: false, message: `最多上传 ${MAX_CLUE_PHOTOS} 张照片` });
    }

    const clues = await loadClues();
    const entry = {
      id: `clue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      description: description.trim(),
      location: location.trim(),
      foundAt,
      contact: contact?.trim() || '',
      photos: photoList.map((p) => ({
        mimeType: p.mimeType || 'image/jpeg',
        base64: p.base64,
      })),
      createdAt: new Date().toISOString(),
    };

    clues.push(entry);
    await saveClues(clues);

    res.json({ success: true, id: entry.id });
  } catch (err) {
    console.error('[clues]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/** 代理下载（避免跨域导致下载失败） */
app.get('/api/download', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ message: '缺少图片地址' });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('图片下载失败');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="result.jpg"'
    );
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn('警告: 未设置 API_KEY，请在 .env 中配置后重启');
  }
});
// AIGC END
