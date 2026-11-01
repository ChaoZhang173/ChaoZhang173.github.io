/* Read the published revision before rendering, so browser caches cannot hide edits. */
(() => {
  'use strict';
  const online=/^https?:$/.test(location.protocol);
  function loadScript(path) {
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=path;
      script.onload=resolve;script.onerror=()=>reject(new Error('页面功能暂时无法加载，请刷新重试。'));
      document.head.append(script);
    });
  }
  async function read(path) {
    const response=await fetch(new URL(path,location.href),{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error('页面内容暂时无法加载，请刷新重试。');
    return response.text();
  }
  (async()=>{
    if(online) {
      let version=null;
      try {version=JSON.parse(await read('site-version.json?check='+Date.now()));} catch(_) {}
      const revision=typeof version?.id==='string' && /^[a-zA-Z0-9-]{1,80}$/.test(version.id)?version.id:String(Date.now());
      const source=await read('content.js?v='+encodeURIComponent(revision));
      const match=/^(?:\s*\/\/[^\n]*(?:\n|$))*\s*window\.SITE_CONTENT\s*=\s*([\s\S]*);\s*$/.exec(source);
      if(!match)throw new Error('页面内容暂时无法读取，请稍后刷新。');
      window.SITE_CONTENT=JSON.parse(match[1]);
      window.SITE_ASSET_VERSIONS=version?.assets || {};
    } else await loadScript('content.js');
    await loadScript('script.js'+(online?'?v=20261102-live-content':''));
    // Content is rendered asynchronously; align incoming section links afterwards.
    if(location.hash) {
      let id;try {id=decodeURIComponent(location.hash.slice(1));} catch(_) {return;}
      document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'});
    }
  })().catch(error=>{
    const message=document.createElement('p');message.setAttribute('role','alert');
    message.textContent=error.message;message.style.cssText='margin:24px;padding:16px;background:#fff4e8;color:#733e29';
    document.body.prepend(message);
  });
})();
