// ==UserScript==
// @name         洛谷通过题目比较器 - yyfcpp
// @namespace    http://tampermonkey.net/
// @version      1.3.2
// @description  比较你和其他用户在洛谷通过的题目
// @author       yyfcpp, qq1010903229
// @match        https://www.luogu.org/space/*
// @grant        none
// ==/UserScript==

/*
 * 这是一个注释区，用于保存 TODO 之类的东西
 * 如果网络不是很好，可能会出现卡顿的情况。
 * 现在使用的是 O(n^2) 的比较算法。如果出现了 AC 了数千题神犇，或许需要改为二分算法。
*/

function clearData(acs) {
  var res = new Array();
  res.push(new Array());
  res.push(new Array());
  var g = 0;
  for (var i = 1; i < acs.length; i++) // 把每一行非题号字符删掉（从 1 开始循环为了避开 split 之后产生的垃圾）
  {
    var tmpStr = "";
    for (var j = 0; j < acs[i].length; j++) {
      if (acs[i][j] != '"') // 引号后面的不是题号部分字符
      {
        tmpStr = tmpStr.concat(acs[i][j]); // 拼接字符串
      }
      else {
        break;
      }
    }
    res[g].push(tmpStr);
    if (acs[i].length > 50) // 这是最后一个题目 / 下一个是「尝试过的题目」
    {
      g++;
    }
  }
  return res;
}

function extractData(content) {
  // 如果你有一个问题打算用正则表达式来解决，那么就是两个问题了。
  // 所以窝还是用 split() 解决这一个问题吧！
  var acs = content.replace(/<span style=\"display:none\">\n.*?\n<\/span>/g, ''); // 把随机的干扰题号去除
  acs = acs.split('[<a data-pjax href="/problem/show?pid='); // 使用 split() 方法把通过的题目分割出来
  acs = clearData(acs); // 把分割好的数据清洁一下
  return acs;
}

function getAc(uid) {
  // 向指定的个人空间发送 get 请求，获取 AC 列表
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://' + window.location.host + '/space/show?uid=' + uid, false);
  xhr.send(null);
  console.log('got ' + uid + "'s AC list: " + xhr.status);
  if (xhr.status == 200) {
    return extractData(xhr.responseText); // 返回 AC 列表
  }
  else {
    return []; // 空列表
  }
}

function changeStyle(pid, meToo) // AC 过的题目
{
  var cssSelector = "a[href='/problem/show?pid=" + pid + "']";
  // 由于洛谷使用随机页面结构，导致了一点小问题，所以要 querySelectorAll，防止染色失败
  var elements = document.querySelectorAll(cssSelector);
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.color = meToo ? "#008000" : "red";
  }
}

function changeStyle2(pid, meToo) // 尝试过的题目
{
  var cssSelector = "a[href='/problem/show?pid=" + pid + "']";
  var elements = document.querySelectorAll(cssSelector);
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.color = meToo ? "#ff8c00" : "red";
  }
}

function displayTot(tot) {
  var cssSelector = "body > div.am-cf.lg-main > div.lg-content > div.am-g.lg-main-content > div.am-u-md-4.lg-right > div > h2";
  document.querySelector(cssSelector).style.fontSize = "18px"; // 避免在一些低分辨率显示器上一行显示不开
  document.querySelector(cssSelector).textContent = "通过题目（其中有 " + tot + " 道题你尚未 AC）";
}

function compare(hisAc, myAc, myAttempt) {
  var tot = hisAc.length; // 对方 AC 自己却没有 AC 的总数
  for (var i = 0; i < hisAc.length; i++) {
    var meToo = false; // 自己是否 AC 过
    for (var j = 0; j < myAc.length; j++) {
      if (hisAc[i] == myAc[j]) // 也 AC 了
      {
        meToo = true;
        tot--;
        break;
      }
    }
    changeStyle(hisAc[i], meToo);
    if (!meToo) {
      for (var j2 = 0; j2 < myAttempt.length; j2++) // 变量名为 j2 为了避免傻逼油猴的警告
      {
        if (hisAc[i] == myAttempt[j2]) // 没有 AC 却尝试过
        {
          meToo = true;
          break;
        }
      }
      changeStyle2(hisAc[i], meToo);
    }
  }
  displayTot(tot); // 显示未 AC 总数
}

function changeAcColor(cssSelector, AcCnt) {
  if (AcCnt >= 1275)
    document.querySelector(cssSelector).style = "color:#FF0000;";
  else if (AcCnt >= 867)
    document.querySelector(cssSelector).style = "color:rgb(255," + ((1275 - AcCnt) / 2) + ",0);";
  else if (AcCnt >= 765)
    document.querySelector(cssSelector).style = "color:rgb(" + ((AcCnt - 357) / 2) + "," + ((1275 - AcCnt) / 2) + ",0);";
  else if (AcCnt >= 459)
    document.querySelector(cssSelector).style = "color:rgb(" + ((AcCnt - 357) / 2) + ",255,0);";
  else if (AcCnt >= 357)
    document.querySelector(cssSelector).style = "color:rgb(51," + ((AcCnt + 51) / 2) + "," + (459 - AcCnt) + ");";
  else if (AcCnt >= 204)
    document.querySelector(cssSelector).style = "color:rgb(51," + (AcCnt - 153) + "," + (459 - AcCnt) + ");";
  else
    document.querySelector(cssSelector).style = "color:rgb(51,51," + (51 + AcCnt) + ");";
}

function displayAcCnt(AcCnt) {
  for (var i = 2; i <= 3; i++) // 解决页面结构不稳定导致的 AC 数无法正常显示问题
  {
    var cssSelector = "body > div.am-cf.lg-main > div.lg-content > div.am-g.lg-main-content > div.am-u-md-4.lg-right > section > div > ul > li:nth-child(" + i + ") > ul > li:nth-child(2) > span.lg-bignum-num";
    if (document.querySelector(cssSelector) != null) // 确定了 AC 数的选择器
    {
      document.querySelector(cssSelector).textContent = AcCnt; // 更新 AC 数
      // changeAcColor(cssSelector, AcCnt); // 据用户反应，颜色关掉吧
      break;
    }
  }
}

function work() {
  var myAc = getAc(myUid);
  var hisAc = getAc(hisUid);
  // console.log(myAc);
  // console.log(hisAc);
  if (hisAc[0].length > 0) // 对方没开完全隐私保护
  {
    compare(hisAc[0], myAc[0], myAc[1]);
    displayAcCnt(hisAc[0].length);
  }
  else {
    console.log("对方开启了完全隐私保护，无法比较。");
  }
}

const myUid = document.getElementsByClassName("am-topbar-brand")[0].attributes["myuid"].value; // 获取当前登录账号的 uid
const hisUid = window.location.href.match(/ uid = [0 - 9] + /)[0].substr(4);                   // 获取当前所在个人空间主人的 UID

if (myUid != hisUid) // 只有访问他人个人空间才进行比较（将 URL 比较转换为 UID 比较）
{
  work();
}
else {
  var myAcCnt = getAc(myUid)[0].length;
  displayAcCnt(myAcCnt);
}