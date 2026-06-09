/**
 * 儿童成长预测页
 */
(function () {
  const {
    $,
    initNav,
    setupUpload,
    showLoading,
    showError,
    callAPI,
    showResult,
    setupDownload,
  } = window.Xunqin;

  initNav();

  const uploadState = setupUpload({
    zoneId: '#grow-upload-zone',
    inputId: '#grow-file',
    previewId: '#grow-preview',
  });

  const resultState = { resultUrl: null, resultB64: null };

  $('#grow-submit').addEventListener('click', async () => {
    if (!uploadState?.base64) {
      showError('请先上传儿童照片');
      return;
    }

    const photoAge = parseInt($('#photo-age').value, 10);
    const targetAge = parseInt($('#target-age').value, 10);

    if (!photoAge || photoAge < 1 || photoAge > 18) {
      showError('请输入有效的照片年龄（1–18 岁）');
      return;
    }
    if (!targetAge || targetAge < 2 || targetAge > 120) {
      showError('请输入有效的目标年龄（2–120 岁）');
      return;
    }
    if (targetAge <= photoAge) {
      showError('目标年龄须大于照片年龄');
      return;
    }

    const genderInput = document.querySelector('input[name="grow-gender"]:checked');
    const gender = genderInput?.value;
    if (gender !== '男' && gender !== '女') {
      showError('请选择性别');
      return;
    }

    showLoading(true);
    $('#grow-submit').disabled = true;

    try {
      const data = await callAPI('/api/grow-age', {
        image: uploadState.base64,
        mimeType: uploadState.mimeType,
        photoAge,
        targetAge,
        gender,
      });
      showResult({
        resultBoxId: '#grow-result',
        resultImgId: '#grow-result-img',
        data,
        resultState,
      });
    } catch (err) {
      showError(err.message);
    } finally {
      showLoading(false);
      $('#grow-submit').disabled = false;
    }
  });

  setupDownload('#grow-download', resultState, '寻亲成年照.jpg');
})();
