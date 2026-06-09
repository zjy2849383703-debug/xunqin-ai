/**
 * 线索上报页
 */
(function () {
  const { $, initNav, showError, callAPI } = window.Xunqin;

  initNav();

  const MAX_PHOTOS = 5;
  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
  const photos = [];

  const form = $('#clue-form');
  const photoInput = $('#clue-photos');
  const photoList = $('#clue-photo-list');
  const photoAdd = $('#clue-photo-add');
  const submitBtn = $('#clue-submit');
  const successBox = $('#clue-success');

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: file.type,
          preview: dataUrl,
        });
      };
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.readAsDataURL(file);
    });
  }

  function renderPhotos() {
    if (!photoList) return;
    photoList.innerHTML = photos
      .map(
        (item, index) => `
        <figure class="clue-photo-item">
          <img src="${item.preview}" alt="现场照片 ${index + 1}" />
          <button type="button" class="clue-photo-remove" data-index="${index}" aria-label="删除照片">×</button>
        </figure>`
      )
      .join('');

    photoList.querySelectorAll('.clue-photo-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.index, 10);
        photos.splice(i, 1);
        renderPhotos();
        updatePhotoAddState();
      });
    });

    updatePhotoAddState();
  }

  function updatePhotoAddState() {
    if (!photoAdd) return;
    const full = photos.length >= MAX_PHOTOS;
    photoAdd.disabled = full;
    photoAdd.classList.toggle('hidden', full);
  }

  photoAdd?.addEventListener('click', () => photoInput?.click());

  photoInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    photoInput.value = '';

    for (const file of files) {
      if (photos.length >= MAX_PHOTOS) {
        showError(`最多上传 ${MAX_PHOTOS} 张照片`);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        showError('仅支持 JPG、PNG 格式');
        continue;
      }
      if (file.size > MAX_SIZE) {
        showError('图片大小不能超过 10MB');
        continue;
      }
      try {
        const data = await readImageFile(file);
        photos.push(data);
      } catch (err) {
        showError(err.message);
      }
    }
    renderPhotos();
  });

  function validateForm() {
    const description = $('#clue-description')?.value.trim();
    const location = $('#clue-location')?.value.trim();
    const foundAt = $('#clue-found-at')?.value;

    if (!description) {
      showError('请填写线索描述');
      return null;
    }
    if (!location) {
      showError('请填写发现地点');
      return null;
    }
    if (!foundAt) {
      showError('请选择发现时间');
      return null;
    }

    return {
      description,
      location,
      foundAt,
      contact: $('#clue-contact')?.value.trim() || '',
      photos: photos.map((p) => ({
        base64: p.base64,
        mimeType: p.mimeType,
      })),
    };
  }

  function showSuccess() {
    form?.classList.add('hidden');
    successBox?.classList.remove('hidden');
    document.querySelector('.clue-privacy')?.classList.add('hidden');
  }

  function resetForm() {
    form?.reset();
    photos.length = 0;
    renderPhotos();
    form?.classList.remove('hidden');
    successBox?.classList.add('hidden');
    document.querySelector('.clue-privacy')?.classList.remove('hidden');
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = validateForm();
    if (!payload) return;

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '提交中…';

    try {
      await callAPI('/api/clues', payload);
      showSuccess();
    } catch (err) {
      showError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  $('#clue-reset')?.addEventListener('click', resetForm);

  renderPhotos();
})();
