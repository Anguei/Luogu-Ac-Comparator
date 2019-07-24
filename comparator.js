// ==UserScript==
// @name         洛谷通过题目比较器 - yyfcpp
// @namespace    http://tampermonkey.net/
// @version      3.23
// @description  比较你和其他用户在洛谷通过的题目
// @author       yyfcpp, qq1010903229
// @match        https://www.luogu.org/space/*
// @match        https://www.luogu.org/recordnew/lists*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==



// 几个开关，可根据用户喜好自行定义
var settings = {};
var colored = 0;

var myUid = GM_getValue("myUid");
if (myUid == undefined || myUid == 'undefined')
    myUid = prompt("比较器脚本更新，请正确输入您的 uid（数字）以保障插件正常运行");
GM_setValue("myUid", myUid);



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
        if (binarySearch(hisAc[i], myAc)) {
            meToo = true;
            tot--;
        }
        if (++colored <= settings['limOfColoring']) { // 如果尚未超过阈值
            changeStyle(hisAc[i], meToo); // 改变题号颜色
        }
        if (!meToo) { // 没 AC 过，有没有尝试过？
            if (binarySearch(hisAc[i], myAttempt)) {
                meToo = true;
            }
            if (colored <= settings['limOfColoring']) {
                changeStyle2(hisAc[i], meToo);
            }
        }
    }
    if (settings['totDisplaying']) { // 如果打开显示未 AC 总数的开关
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
}


function binarySearch(target, array) { // 使用二分查找算法进行比较
    var l = 0, r = array.length;
    while (l < r) {
        var mid = parseInt((l + r) / 2); // JavaScript 除法默认不是整数。。
        if (target == array[mid]) return true;
        else if (target > array[mid]) l = mid + 1;
        else r = mid;
    }
    return false;
}


function displayAcCnt(AcCnt) {
    for (var i = 2; i <= 3; i++) { // 解决页面结构不稳定导致的 AC 数无法正常显示问题
        var cssSelector = "#app-body-new > div.am-g.lg-main-content > div.am-u-md-4.lg-right > section > div > ul > li:nth-child(" + i + ") > ul > li:nth-child(2) > span.lg-bignum-num"; // 适配新的洛谷 UI
        if (document.querySelector(cssSelector) != null) { // 确定了 AC 数的选择器
            document.querySelector(cssSelector).innerHTML = AcCnt + '<small></small>'; // 更新 AC 数
            if (settings['colorChanging']) { // 如果打开颜色变化的开关
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
        var start = new Date();
        compare_new(hisAc[0], myAc[0], myAc[1]);
        console.log('比较耗时：' + (new Date() - start) + 'ms');
        displayAcCnt(getAcCnt());
    } else {
        console.log("对方开启了完全隐私保护，无法比较。");
    }
}


function setSettings() {
    alert('首次运行新版比较器，请进行初步设置');
    if (GM_getValue('CompSettings') == undefined || GM_getValue('CompSettings') == 'undefined') {
        settings = {};
    }
    settings['limOfColoring'] = prompt('请设置红橙绿染色的题目上限（染色量太大会降低页面加载速度）（-1 表示不限量）')
    settings['totDisplaying'] = confirm('是否显示对方 AC 而您却未 AC 的题目总数？');
    settings['colorChanging'] = confirm('是否根据用户 AC 数量显示 AC 数不同颜色？');
    settings['repairAcCount'] = confirm('是否实时更新 AC 数并把一千以上的 AC 数转化为精准数字？\n解释：洛谷个人空间的 AC 数非实时更新，开启该功能可实现实时更新');
    if (settings['limOfColoring'] == '-1') {
        settings['limOfColoring'] = '99999';
    }
    GM_setValue('CompSettings', settings);
    alert('设置成功，您可以随时在任意用户的个人空间点击「更改」按钮修改设置。')
}


settings = GM_getValue('CompSettings');
if (settings == undefined || settings == 'undefined') {
    setSettings();
    settings = GM_getValue('CompSettings');
} else if (settings['records'] == undefined || settings['records'] == 'undefined') {
    // 这个 else 的内容下次更新可以删除
    settings['records'] = 1;
    GM_setValue('CompSettings', settings);
    // $.post("/api/discuss/reply/" + '60968', { content: 'records 版本报道', verify: verify });
    alert('比较器更新，现在支持评测记录页面的比较！');
}


function getAcCnt() {
    var colors = document.getElementsByTagName('table')[0].firstElementChild.innerText.match(/[0-9]+/g);
    var res = 0;
    for (var i = 0; i < colors.length; i++) {
        res += parseInt(colors[i]);
    }
    console.log('acCnt = ' + res);
    return res;
}


if (window.location.href.match(/space/) != null) { // 个人空间页面
    $('#app-body-new > div.am-g.lg-main-content > div.am-u-md-4.lg-right > section > div > p').append('<button class="am-btn am-btn-sm am-btn-primary" id="changeComp">更改</button>')
    $('#changeComp').click(setSettings);

    var hisUid = window.location.href.match(/uid=[0-9]+/)[0].substr(4); // 获取当前所在个人空间主人的 UID
    if (document.getElementsByClassName('am-btn am-btn-sm am-btn-primary')[0].attributes['href'] == undefined) { // 在自己的个人主页
        if (settings['repairAcCount']) {
            displayAcCnt(getAcCnt());
        }
    } else { // 在别人的主页
        // var myUid = document.getElementsByClassName('am-btn am-btn-sm am-btn-primary')[0].attributes['href'].value.match(/[0-9]+/)[0]; // 获取当前登录账号的 uid（洛谷前端改版后）
        var myUid = GM_getValue("myUid");
        work();
    }
} else if (window.location.href.match(/recordnew/) != null) { // 评测记录页面
    var hisUidOrName = window.location.href.match(/uid=*/)[0].substr(4); // 如果是一道题目的全部评测记录页面，这里会出现异常，直接退出，刚好不需要比较
    var hisUid = '';
    $.get("/space/ajax_getuid?username=" + hisUidOrName, // 把用户名转化为 uid
        function (data) {
            hiaUid = eval('(' + data + ')')['more']['uid'];
        });
    // var myUid = document.cookie.match(/_uid=[0-9]+/)[0].substr(5);
    var myUid = GM_getValue("myUid");
    if (hisUid != myUid) {
        console.log(myUid);
        recordsWork();

        function recordsWork() {
            var myAc = getAc(myUid);
            var myAttempt = myAc[1];
            myAc = myAc[0];
            myAc.sort();
            myAttempt.sort();

            var pageAcs = document.getElementsByClassName('am-g lg-table-bg0 lg-table-row');
            for (var i = 0; i < pageAcs.length; i++) {
                var thisPid = pageAcs[i].innerText.split('\n')[4].split(' ')[0];
                // var thisColor = pageAcs[i].lastElementChild.firstElementChild.style.color;
                if (binarySearch(thisPid, myAc)) { // 也 AC
                    pageAcs[i].lastElementChild.firstElementChild.style.color = '#008000';
                } else if (binarySearch(thisPid, myAttempt)) { // 尝试过
                    pageAcs[i].lastElementChild.firstElementChild.style.color = '#ff8c00';
                } else { // 未 AC
                    pageAcs[i].lastElementChild.firstElementChild.style.color = 'red';
                }
            }
        }
    }
}