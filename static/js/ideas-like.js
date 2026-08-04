/* 脑洞记录页点赞:借用 Waline 服务端 article 计数接口存储,
   数据落在 Neon 数据库 wl_counter 表(time 字段,前端未启用 pageview,闲置可用)。
   每浏览器仅能赞一次(localStorage 记录)。 */
(function () {
  var SERVER = window.IDEAS_LIKE_SERVER;
  var btns = document.querySelectorAll('.idea-like');
  if (!SERVER || !btns.length) return;

  var LS_KEY = 'idea-liked-v1';
  var liked = {};
  try { liked = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) {}

  // minify 可能把属性里的中文转成百分号编码,这里先解码再统一编码,避免双重编码
  function normUrl(raw) {
    try { return encodeURIComponent(decodeURIComponent(raw)); }
    catch (e) { return encodeURIComponent(raw); }
  }

  // 取回原始未编码路径(用于 POST body,服务端原样存储)
  function rawUrl(raw) {
    try { return decodeURIComponent(raw); } catch (e) { return raw; }
  }

  // 逐个读取当前计数
  btns.forEach(function (btn) {
    var url = btn.dataset.url;
    if (liked[url]) btn.classList.add('liked');
    fetch(SERVER + '/api/article?path=' + normUrl(url))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var n = d && d.data && d.data[0] ? (d.data[0].time || 0) : 0;
        var c = btn.querySelector('.like-count');
        if (c) c.textContent = n;
      })
      .catch(function () {});
  });

  // 点赞
  btns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (btn.classList.contains('liked')) return;
      var url = btn.dataset.url;
      // 实测:POST 的 path 必须放 JSON body(服务端才接收),query 方式不生效
      fetch(SERVER + '/api/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: rawUrl(url) })
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          var c = btn.querySelector('.like-count');
          if (c) c.textContent = (parseInt(c.textContent || '0', 10) || 0) + 1;
          btn.classList.add('liked');
          liked[url] = true;
          try { localStorage.setItem(LS_KEY, JSON.stringify(liked)); } catch (err) {}
        })
        .catch(function () {});
    });
  });
})();
