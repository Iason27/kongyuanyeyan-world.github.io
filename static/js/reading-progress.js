/* 阅读进度记忆:文章页记录滚动位置,下次进来自动续读。
   仅对文章内容(.post-content)存在且为长内容的页面生效。 */
(function () {
  var content = document.querySelector('.post-content');
  if (!content) return; // 非文章页不启用

  // 短内容(不足一屏)无需记忆
  if (document.documentElement.scrollHeight <= window.innerHeight * 1.2) return;

  var KEY = 'reading-progress:' + location.pathname;

  // 恢复上次进度(等页面完全渲染后再定位,避免图片加载导致偏移)
  function restore() {
    var saved = null;
    try { saved = parseFloat(localStorage.getItem(KEY)); } catch (e) {}
    if (!saved || saved <= 0) return;
    // 首次在 DOM 就绪后尝试,之后按需重试
    var tries = 0;
    (function tryScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 10 && tries < 30) {
        window.scrollTo(0, saved * max);
        if (Math.abs(window.scrollY - saved * max) > 4 && tries < 20) {
          tries++;
          setTimeout(tryScroll, 400);
        }
      }
    })();
  }

  // 节流记录进度
  var ticking = false;
  function save() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    var ratio = Math.min(1, Math.max(0, window.scrollY / max));
    try { localStorage.setItem(KEY, String(ratio)); } catch (e) {}
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      save();
      ticking = false;
    });
  });
  window.addEventListener('beforeunload', save);

  restore();
})();
