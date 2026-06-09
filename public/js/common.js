/**
 * 寻亲 AI — 公共前端工具
 */
(function (global) {
  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  function $(sel) {
    return document.querySelector(sel);
  }

  function showLoading(show) {
    const el = $('#loading-overlay');
    if (!el) return;
    el.classList.toggle('show', show);
  }

  function showError(msg) {
    const modal = $('#error-modal');
    const message = $('#error-message');
    if (!modal || !message) return;
    message.textContent = msg;
    modal.classList.add('show');
  }

  function hideError() {
    const modal = $('#error-modal');
    if (modal) modal.classList.remove('show');
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('请选择图片文件'));
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        reject(new Error('仅支持 JPG、PNG 格式'));
        return;
      }
      if (file.size > MAX_SIZE) {
        reject(new Error('图片大小不能超过 10MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: file.type,
          dataUrl,
        });
      };
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.readAsDataURL(file);
    });
  }

  function setupUpload({ zoneId, inputId, previewId, onReady }) {
    const zone = $(zoneId);
    const input = $(inputId);
    const preview = $(previewId);
    if (!zone || !input) return null;

    const state = { base64: null, mimeType: null };

    zone.addEventListener('click', () => input.click());

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = await readImageFile(file);
        state.base64 = data.base64;
        state.mimeType = data.mimeType;
        if (preview) {
          preview.src = data.dataUrl;
          preview.classList.remove('hidden');
        }
        onReady?.(data);
      } catch (err) {
        showError(err.message);
        input.value = '';
      }
    });

    ['dragenter', 'dragover'].forEach((ev) => {
      zone.addEventListener(ev, (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((ev) => {
      zone.addEventListener(ev, (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
      });
    });

    zone.addEventListener('drop', async (e) => {
      const file = e.dataTransfer.files[0];
      if (!file) return;
      try {
        const data = await readImageFile(file);
        state.base64 = data.base64;
        state.mimeType = data.mimeType;
        if (preview) {
          preview.src = data.dataUrl;
          preview.classList.remove('hidden');
        }
        onReady?.(data);
      } catch (err) {
        showError(err.message);
      }
    });

    return state;
  }

  function getAPIBase() {
    return (window.XunqinConfig && window.XunqinConfig.API_BASE) || '';
  }

  async function callAPI(endpoint, body) {
    const base = getAPIBase();
    const res = await fetch(base + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '请求失败，请稍后重试');
    }
    return data;
  }

  function showResult({ resultBoxId, resultImgId, data, resultState }) {
    const resultBox = $(resultBoxId);
    const resultImg = $(resultImgId);
    if (!resultBox || !resultImg) return;

    if (data.b64) {
      resultState.resultB64 = data.b64;
      resultState.resultUrl = null;
      resultImg.src = `data:image/jpeg;base64,${data.b64}`;
    } else if (data.url) {
      resultState.resultUrl = data.url;
      resultState.resultB64 = null;
      resultImg.src = data.url;
    }

    resultBox.classList.remove('hidden');
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setupDownload(btnSelector, resultState, filename) {
    const btn = document.querySelector(btnSelector);
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (resultState.resultB64) {
        const a = document.createElement('a');
        a.href = `data:image/jpeg;base64,${resultState.resultB64}`;
        a.download = filename;
        a.click();
        return;
      }
      if (resultState.resultUrl) {
        // 直接 fetch 图片流下载，不经过后端代理
        fetch(resultState.resultUrl)
          .then((r) => r.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          })
          .catch(() => showError('图片下载失败，请右键另存为'));
        return;
      }
      showError('暂无可下载的图片，请先生成');
    });
  }

  function initNav() {
    const current =
      window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((link) => {
      const href = link.getAttribute('href');
      const target = href.split('/').pop() || 'index.html';
      const isCurrent =
        current === target ||
        (current === '' && target === 'index.html');
      link.classList.toggle('active', isCurrent);
    });

    const closeBtn = $('#error-close');
    if (closeBtn) closeBtn.addEventListener('click', hideError);
  }

  global.Xunqin = {
    $,
    showLoading,
    showError,
    hideError,
    setupUpload,
    callAPI,
    showResult,
    setupDownload,
    initNav,
  };
})(window);
