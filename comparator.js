// ==UserScript==
// @name         洛谷通过题目比较器 - yyfcpp
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  比较你和其他用户在洛谷通过的题目
// @author       yyfcpp, qq1010903229
// @match        https://www.luogu.org/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==



// 几个开关，可根据用户喜好自行定义
var settings = {};
var colored = 0;

//alert(document.body.innerHTML.match('uid=([0-9]+)')[0]);
// console.log(document.body.innerHTML);
var myUid = GM_getValue("myUid");
if (myUid == undefined || myUid == 'undefined')
    myUid = prompt("比较器脚本更新，请正确输入您的 uid（数字）以保障插件正常运行");
GM_setValue("myUid", myUid);


function getAc(uid) {
    // 向指定的个人空间发送 get 请求，获取 AC 列表
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://' + window.location.host + '/user/' + uid, false);
    xhr.send(null);
    console.log('got ' + uid + "'s AC list: " + xhr.status);
    if (xhr.status == 200) {
        return extractData(xhr.responseText); // 返回 AC 列表
    } else {
        return []; // 空列表
    }

    function extractData(content) {
        var _feInjection=JSON.parse(decodeURIComponent(content.split('window._feInjection = JSON.parse(decodeURIComponent("')[1].split('"));')[0]));  // 使用 split() 方法把 _feInjection 分割出来
        var res = new Array();
        res.push(new Array());
        res.push(new Array());
        for (var i = 0; i < _feInjection.currentData.passedProblems.length; i++) {
            res[0].push(_feInjection.currentData.passedProblems[i].pid);
        }
        for (var i = 0; i < _feInjection.currentData.submittedProblems.length; i++) {
            res[1].push(_feInjection.currentData.submittedProblems[i].pid);
        }

        return res;
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
    //if (settings['totDisplaying']) { // 如果打开显示未 AC 总数的开关
    //    displayTot(tot); // 显示 AC 总数
    //}

    function changeStyle(pid, meToo) // AC 过的题目
    {
        // 直接插入style节点
        if(meToo){
            var style = document.createElement("style");style.innerHTML="a[href='/problem/" + pid + "']{color:#52c41a !important;}";// 使用个人中心 v4.0 颜色
            document.body.append(style);
        }
    }

    function changeStyle2(pid, meToo) // 尝试过的题目
    {
        // 直接插入style节点
        var style = document.createElement("style");style.innerHTML="a[href='/problem/" + pid + "']{color:" +( meToo ? "#f39c11" : "#fe4c61")+ " !important;}";// 使用个人中心 v4.0 颜色
        document.body.append(style);
    }

   // function displayTot(tot) {
   //     var cssSelector = "#app > div.main-container > main.lfe-body > div#app-old > div.am-g.lg-main-content > div.am-u-md-4.lg-right > div:nth-child(3) > h2";
   //     if(getAchievementElement() != undefined) cssSelector = "#app > div.main-container > main.lfe-body > div#app-old > div.am-g.lg-main-content > div.am-u-md-4.lg-right > div:nth-child(4) > h2";// 有“成就”标签
   //     document.querySelector(cssSelector).style.fontSize = "18px"; // 避免在一些低分辨率显示器上一行显示不开
   //     document.querySelector(cssSelector).textContent = "通过题目（其中有 " + tot + " 道题你尚未 AC）";
   // }
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
    if(document.querySelector('#app > div.main-container > main.lfe-body > div > div > div.user-header-bottom > div.user-stat-data > div > div:nth-child(4) > span.value') == null){ // 个人空间 4.0 的元素会延迟加载
        setTimeout(displayAcCnt.bind(null,AcCnt),100);
    }else{
        document.querySelector('#app > div.main-container > main.lfe-body > div > div > div.user-header-bottom > div.user-stat-data > div > div:nth-child(4) > span.value').innerHTML=AcCnt;
        if (settings['colorChanging']) { // 如果打开颜色变化的开关
            changeAcColor('#app > div.main-container > main.lfe-body > div > div > div.user-header-bottom > div.user-stat-data > div > div:nth-child(4) > span.value', AcCnt);
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
        displayAcCnt(getAcCnt(hisAc));
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
    alert('设置成功，您可以随时在任意用户的个人空间点击「比较器设置」按钮修改设置。')
}


settings = GM_getValue('CompSettings');
if (settings == undefined || settings == 'undefined') {
    setSettings();
    settings = GM_getValue('CompSettings');
}

function getAcCnt(acs) {
    return acs[0].length;
}

function putButton(button){
    if(document.querySelector('#app > div.main-container > main.lfe-body > div > div > div.user-header-top > div.user-action') == null){ // 个人空间 4.0 的元素会延迟加载
        setTimeout(putButton.bind(null,button),100);
    }else{
        document.querySelector('#app > div.main-container > main.lfe-body > div > div > div.user-header-top > div.user-action').append(button);
    }
}
var locationReloaded=false;
function checkLocation(uid){
    if (locationReloaded)return;
    if (window.location.href.indexOf("/user/"+uid) == -1)locationReloaded=true,window.location.reload();
}
function checkLocation2(){
    if (locationReloaded)return;
    if (window.location.href.indexOf("/user/") != -1)locationReloaded=true,window.location.reload();
}
if (window.location.href.match(/\/user\//) != null) { // 个人空间页面
    var button=document.createElement("button");
    button.className="btn btn-config lfe-form-sz-middle";
    button.innerHTML="比较器设置";
    button.addEventListener("click",setSettings);
    button.setAttribute("data-v-dc8d06e8",1);//可能会变化
    putButton(button);
    var hisUid = window.location.href.match(/\/user\/[0-9]+/)[0].substr(6); // 获取当前所在个人空间主人的 UID
    if (hisUid == GM_getValue("myUid")) { // 在自己的个人主页
        if (settings['repairAcCount']) {
            displayAcCnt(getAcCnt(getAc(GM_getValue("myUid"))));
        }
    } else { // 在别人的主页
        // var myUid = document.getElementsByClassName('am-btn am-btn-sm am-btn-primary')[0].attributes['href'].value.match(/[0-9]+/)[0]; // 获取当前登录账号的 uid（洛谷前端改版后）
        var myUid = GM_getValue("myUid");
        work();
    }
    setInterval(checkLocation.bind(null,hisUid),100);//防止脚本失效
}else{
    setInterval(checkLocation2,100);//若进入个人中心，刷新页面使脚本生效
}
