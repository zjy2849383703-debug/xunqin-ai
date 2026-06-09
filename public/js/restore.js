/**
 * 老照片修复页
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
    zoneId: '#restore-upload-zone',
    inputId: '#restore-file',
    previewId: '#restore-preview',
  });

  const resultState = { resultUrl: null, resultB64: null };

  $('#restore-submit').addEventListener('click', async () => {
    if (!uploadState?.base64) {
      showError('请先上传老照片');
      return;
    }

    showLoading(true);
    $('#restore-submit').disabled = true;

    try {
      const data = await callAPI('/api/restore-photo', {
        image: uploadState.base64,
        mimeType: uploadState.mimeType,
      });
      showResult({
        resultBoxId: '#restore-result',
        resultImgId: '#restore-result-img',
        data,
        resultState,
      });
    } catch (err) {
      showError(err.message);
    } finally {
      showLoading(false);
      $('#restore-submit').disabled = false;
    }
  });

  setupDownload('#restore-download', resultState, '修复照片.jpg');
})();
