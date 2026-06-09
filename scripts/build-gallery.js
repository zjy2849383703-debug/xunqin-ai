/**
 * 每张素材图 → 一个展示格，信息按文件序号从 poster-meta.json 读取
 */
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(
  'C:',
  'Users',
  '普鲁士蓝',
  '.cursor',
  'projects',
  'c-xunqin',
  'assets'
);
const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'children');
const JSON_OUT = path.join(__dirname, '..', 'public', 'data', 'children.json');
const META_FILE = path.join(__dirname, 'poster-meta.json');

function parseAssetNum(filename) {
  const m = filename.match(/_(\d+)_6-/);
  return m ? parseInt(m[1], 10) : 0;
}

function main() {
  const metaByNum = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));

  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .map((f) => ({
      name: f,
      path: path.join(ASSETS_DIR, f),
      num: parseAssetNum(f),
    }))
    .filter((f) => f.num > 0)
    .sort((a, b) => a.num - b.num || a.name.localeCompare(b.name));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (/\.(png|jpe?g|webp)$/i.test(f)) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const children = files.map((file, index) => {
    const slot = String(index + 1).padStart(2, '0');
    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    const outName = `${slot}${ext === '.png' ? '.png' : '.jpg'}`;
    fs.copyFileSync(file.path, path.join(OUT_DIR, outName));

    const key = String(file.num);
    const meta = metaByNum[key];

    if (!meta) {
      console.warn(`警告: 序号 ${file.num} 无文字信息，仅导入图片`);
      return { image: `images/children/${outName}` };
    }

    return {
      ...meta,
      image: `images/children/${outName}`,
    };
  });

  fs.writeFileSync(JSON_OUT, JSON.stringify(children, null, 2), 'utf8');
  console.log(`共 ${children.length} 张图 → ${children.length} 个展示格`);
}

main();
