/* 사진 줄이기 도구. 휴대폰 사진은 5MB를 넘기 쉬워서, 올리기 전에 브라우저에서 줄입니다.
   fitSize 는 계산만 하므로 node 로도 시험할 수 있습니다. */
(function (root) {
  "use strict";

  var MAX_SIDE = 1600;
  var JPEG_QUALITY = 0.85;
  var UNREADABLE = "이 사진 형식은 읽을 수 없어요. 캡처하거나 JPEG로 저장해 다시 올려 주세요.";
  var ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

  // 긴 변이 max 를 넘으면 비율을 지켜 줄입니다(늘리지는 않음).
  function fitSize(width, height, max) {
    max = max || MAX_SIDE;
    var longest = Math.max(width, height);
    if (!(longest > 0)) return { width: 0, height: 0, scale: 1 };
    var scale = longest > max ? max / longest : 1;
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), scale: scale };
  }

  function decode(file) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(file).catch(function () { return decodeWithImage(file); });
    }
    return decodeWithImage(file);
  }

  function decodeWithImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  function toBlob(canvas) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY); });
  }

  // 사진을 긴 변 1600px, JPEG 품질 0.85 로 줄입니다. 디코딩에 실패하면(HEIC 등) 쉬운 한국어 오류를 던집니다.
  // 결과가 원본보다 커지고 원본이 서버가 받는 형식(PNG·JPEG·WebP)이면 원본을 그대로 씁니다.
  function shrinkImage(file) {
    return decode(file).then(function (bitmap) {
      var w = bitmap.width || bitmap.naturalWidth, h = bitmap.height || bitmap.naturalHeight;
      var size = fitSize(w, h, MAX_SIDE);
      if (!size.width) throw new Error("empty");
      var canvas = document.createElement("canvas");
      canvas.width = size.width; canvas.height = size.height;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";  // PNG 의 투명한 부분은 흰색으로
      ctx.fillRect(0, 0, size.width, size.height);
      ctx.drawImage(bitmap, 0, 0, size.width, size.height);
      if (bitmap.close) bitmap.close();
      return toBlob(canvas).then(function (blob) {
        if (!blob) throw new Error("encode");
        if (blob.size >= file.size && ACCEPTED.indexOf(file.type) >= 0 && size.scale === 1) return file;
        var name = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
        return new File([blob], name, { type: "image/jpeg" });
      });
    }).catch(function () { throw new Error(UNREADABLE); });
  }

  var api = { fitSize: fitSize, shrinkImage: shrinkImage, MAX_SIDE: MAX_SIDE, JPEG_QUALITY: JPEG_QUALITY, UNREADABLE: UNREADABLE };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ImageUtil = api;
})(typeof window !== "undefined" ? window : this);
