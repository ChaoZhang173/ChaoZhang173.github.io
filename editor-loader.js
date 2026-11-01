/* The online editor loads photos on demand; ZIP exports retain an offline bundle. */
(() => {
  'use strict';
  const online=/^https?:$/.test(location.protocol);
  function load(path) {
    return new Promise((resolve,reject) => {
      const script=document.createElement('script');
      script.src=online ? path+'?v='+(path==='content.js'?Date.now():'20261102-live-content') : path;
      script.onload=resolve;
      script.onerror=()=>reject(new Error('无法载入 '+path+'，请检查网络后重新打开编辑器。'));
      document.head.append(script);
    });
  }
  (async () => {
    if (location.protocol==='file:') await load('editor-bundle.js');
    await Promise.all([load('content.js'),load('editor-export.js'),load('editor-publish.js')]);
    await load('editor.js');
  })().catch(error => {
    const status=document.getElementById('save-status');
    status.textContent=error.message;status.dataset.state='error';
  });
})();
