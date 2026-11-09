/* 빨간 색연필 표시의 모양 계산. 그리는 일(SVG)은 app.js 가 하고, 여기는 점만 만드는 순수 함수라 node 로 시험할 수 있습니다.
   같은 seed 면 늘 같은 모양이라, 화면을 다시 그려도 표시가 달라지지 않습니다. */
(function (root) {
  "use strict";

  function rng(seed) {  // mulberry32
    var a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var RAD = Math.PI / 180;

  // 정답 동그라미: 한 획으로 쓱 그은 약간 납작한 타원 호.
  // 수학 좌표(y가 위)로 약 240°(왼쪽 아래)에서 시작해 반시계로 약 345° 돌고 끝납니다.
  // 닫히지 않고(끝점이 시작점 근처에 틈을 남김), 꼬리·루프·겹침이 없습니다. 완벽한 원도 아닙니다(가로:세로 1.15~1.3, 기울기 -10~-20°).
  // majorDiameter: 타원 긴 지름(px). 돌려주는 점들은 (cx, cy)가 중심인 화면 좌표(y가 아래)입니다.
  function circleArc(cx, cy, majorDiameter, seed) {
    var rand = rng(seed + 1);
    var ratio = 1.15 + rand() * 0.15;                 // rx : ry
    var tiltDeg = -(10 + rand() * 10);                 // 화면에서 반시계로 기울임
    var startDeg = 240 + (rand() - 0.5) * 12;          // 234~246°
    var sweepDeg = 344 + rand();                       // 344~345°: 끝이 시작 근처이되 닫히지 않게
    var a = majorDiameter / 2, b = a / ratio;
    var ph1 = rand() * 6.28, ph2 = rand() * 6.28, T = tiltDeg * RAD;
    var jx = (rand() - 0.5) * 1.6, jy = (rand() - 0.5) * 1.6;
    var N = 72, pts = [];
    for (var i = 0; i <= N; i++) {
      var th = startDeg + sweepDeg * (i / N);          // 반시계(수학 각도 증가)
      var t = th * RAD;
      // 반지름이 각도에 따라 조금씩 변함(손글씨). 각도의 함수라 시작·끝이 가까워 두 점의 반지름도 비슷합니다.
      var f = 1 + 0.035 * Math.sin(t + ph1) + 0.02 * Math.sin(2 * t + ph2);
      var px = a * f * Math.cos(t), py = -b * f * Math.sin(t);   // y 뒤집기(수학 → 화면)
      pts.push([cx + jx + px * Math.cos(T) - py * Math.sin(T), cy + jy + px * Math.sin(T) + py * Math.cos(T)]);
    }
    return { points: pts, startDeg: startDeg, sweepDeg: sweepDeg, a: a, b: b, ratio: ratio, tiltDeg: tiltDeg, center: [cx + jx, cy + jy] };
  }

  // 오답 사선: 왼쪽 아래 → 오른쪽 위로 번호보다 길게 긋는 한 줄(w: 번호 상자 한 변, pad: 상자 밖으로 번지는 여유)
  function slashLine(w, pad, seed) {
    var rand = rng(seed + 1);
    var x0 = -pad * 0.9 + (rand() - 0.5) * 2, y0 = w + pad * 0.95 + (rand() - 0.5) * 2;
    var x1 = w + pad * 0.95 + (rand() - 0.5) * 2, y1 = -pad * 0.95 + (rand() - 0.5) * 2;
    var bow = (rand() - 0.5) * 4, N = 30, out = [];
    for (var i = 0; i <= N; i++) {
      var u = i / N, wob = Math.sin(u * 9 + rand()) * 0.5;
      out.push([x0 + (x1 - x0) * u + bow * Math.sin(u * Math.PI) * 0.6 + wob, y0 + (y1 - y0) * u - bow * Math.sin(u * Math.PI) * 0.6 + wob * 0.6]);
    }
    return out;
  }

  function smoothPath(pts) {  // 점들을 부드러운 곡선(2차 베지어) 경로로
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += "Q" + pts[i][0].toFixed(1) + " " + pts[i][1].toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
    }
    var last = pts[pts.length - 1];
    return d + "L" + last[0].toFixed(1) + " " + last[1].toFixed(1);
  }

  var api = { rng: rng, circleArc: circleArc, slashLine: slashLine, smoothPath: smoothPath };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PenShape = api;
})(typeof window !== "undefined" ? window : this);
