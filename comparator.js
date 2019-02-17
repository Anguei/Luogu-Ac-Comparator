// ==UserScript==
// @name         洛谷通过题目比较器 - yyfcpp
// @namespace    http://tampermonkey.net/
// @version      1.5.1
// @description  比较你和其他用户在洛谷通过的题目
// @author       yyfcpp, qq1010903229
// @match        https://www.luogu.org/space/*
// @grant        none
// ==/UserScript==



// 几个开关，可根据用户喜好自行定义
var totDisplaying = false; // 是否显示比较后的未 AC 总数（待完成）
var colorChanging = false; // 是否根据该用户 AC 总数显示 AC 总数的颜色
var onlyExact = false; // 是否只显示精确 AC 总数而不进行题目详细比较


function getAc(uid) {
    // 向指定的个人空间发送 get 请求，获取 AC 列表
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://' + window.location.host + '/space/show?uid=' + uid, false);
    xhr.send(null);
    console.log('got ' + uid + "'s AC list: " + xhr.status);
    if (xhr.status == 200) {
        return extractData(xhr.responseText); // 返回 AC 列表
    } else {
        return []; // 空列表
    }

    function extractData(content) {
        // 如果你有一个问题打算用正则表达式来解决，那么就是两个问题了。
        // 所以窝还是用 split() 解决这一个问题吧！
        var acs = content.replace(/<span style=\"display:none\">\n.*?\n<\/span>/g, ''); // 把随机的干扰题号去除
        acs = acs.split('[<a data-pjax href="/problem/show?pid='); // 使用 split() 方法把通过的题目分割出来
        acs = clearData(acs); // 把分割好的数据清洁一下
        return acs;

        function clearData(acs) {
            var res = new Array();
            res.push(new Array());
            res.push(new Array());
            var g = 0;
            for (var i = 1; i < acs.length; i++) { // 把每一行非题号字符删掉（从 1 开始循环为了避开 split 之后产生的垃圾）
                var tmpStr = "";
                for (var j = 0; j < acs[i].length; j++) {
                    if (acs[i][j] != '"') { // 引号后面的不是题号部分字符
                        tmpStr = tmpStr.concat(acs[i][j]); // 拼接字符串
                    }
                    else break;
                }
                res[g].push(tmpStr);
                if (acs[i].length > 50) { // 这是最后一个题目 / 下一个是「尝试过的题目」
                    g++;
                }
            }
            return res;
        }
    }
}


function compare_new(hisAc, myAc, myAttempt) {
    myAc.sort(); // 排序，用于二分查找
    myAttempt.sort();
    var tot = hisAc.length;
    for (var i = 0; i < hisAc.length; i++) {
        var meToo = false;
        if (binarySerach(hisAc[i], myAc)) {
            meToo = true;
            tot--;
        }
        changeStyle(hisAc[i], meToo); // 改变题号颜色
        if (!meToo) { // 没 AC 过，有没有尝试过？
            if (binarySerach(hisAc[i], myAttempt)) {
                meToo = true;
            }
            changeStyle2(hisAc[i], meToo);
        }
    }
    if (totDisplaying) { // 如果打开显示未 AC 总数的开关
        displayTot(tot); // 显示 AC 总数
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
        var cssSelector = "#app-body-new > div.am-g.lg-main-content > div.am-u-md-4.lg-right > div:nth-child(2) > h2";
        document.querySelector(cssSelector).style.fontSize = "18px"; // 避免在一些低分辨率显示器上一行显示不开
        document.querySelector(cssSelector).textContent = "通过题目（其中有 " + tot + " 道题你尚未 AC）";
    }

    function binarySerach(target, array) { // 使用二分查找算法进行比较
        var l = 0, r = array.length;
        while (l < r) {
            var mid = parseInt((l + r) / 2); // JavaScript 除法默认不是整数。。
            if (target == array[mid]) return true;
            else if (target > array[mid]) l = mid + 1;
            else r = mid;
        }
        return false;
    }
}


function displayAcCnt(AcCnt) {
    for (var i = 2; i <= 3; i++) { // 解决页面结构不稳定导致的 AC 数无法正常显示问题
        var cssSelector = "#app-body-new > div.am-g.lg-main-content > div.am-u-md-4.lg-right > section > div > ul > li:nth-child(" + i + ") > ul > li:nth-child(2) > span.lg-bignum-num"; // 适配新的洛谷 UI
        if (document.querySelector(cssSelector) != null) { // 确定了 AC 数的选择器
            document.querySelector(cssSelector).textContent = AcCnt; // 更新 AC 数
            if (colorChanging) { // 如果打开颜色变化的开关
                changeAcColor(cssSelector, AcCnt);
            }
            break;
        }
    }

    function changeAcColor(cssSelector, AcCnt) {
        if (AcCnt >= 1275) document.querySelector(cssSelector).style = "color:#FF0000;";
        else if (AcCnt >= 867) document.querySelector(cssSelector).style = "color:rgb(255," + ((1275 - AcCnt) / 2) + ",0);";
        else if (AcCnt >= 765) document.querySelector(cssSelector).style = "color:rgb(" + ((AcCnt - 357) / 2) + "," + ((1275 - AcCnt) / 2) + ",0);";
        else if (AcCnt >= 459) document.querySelector(cssSelector).style = "color:rgb(" + ((AcCnt - 357) / 2) + ",255,0);";
        else if (AcCnt >= 357) document.querySelector(cssSelector).style = "color:rgb(51," + ((AcCnt + 51) / 2) + "," + (459 - AcCnt) + ");";
        else if (AcCnt >= 204) document.querySelector(cssSelector).style = "color:rgb(51," + (AcCnt - 153) + "," + (459 - AcCnt) + ");";
        else document.querySelector(cssSelector).style = "color:rgb(51,51," + (51 + AcCnt) + ");";
    }
}


function work() {
    var myAc = getAc(myUid);
    var hisAc = getAc(hisUid);
    // console.log(myAc);
    // console.log(hisAc);
    if (hisAc[0].length > 0) { // 对方没开完全隐私保护
        if (!onlyExact) {
            var start = new Date();
            compare_new(hisAc[0], myAc[0], myAc[1]);
            console.log('比较耗时：' + (new Date() - start) + 'ms');
        }
        displayAcCnt(hisAc[0].length);
    } else {
        console.log("对方开启了完全隐私保护，无法比较。");
    }
}


var hisUid = window.location.href.match(/uid=[0-9]+/)[0].substr(4); // 获取当前所在个人空间主人的 UID
if (document.getElementsByClassName('am-btn am-btn-sm am-btn-primary')[0].attributes['href'] == undefined) { // 在自己的个人主页
    var myAcCnt = getAc(hisUid)[0].length;
    displayAcCnt(myAcCnt);
} else { // 在别人的主页
    var myUid = document.getElementsByClassName('am-btn am-btn-sm am-btn-primary')[0].attributes['href'].value.match(/[0-9]+/)[0] // 获取当前登录账号的 uid（洛谷前端改版后）
    work();
}
