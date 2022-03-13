const ipc = require('electron').ipcRenderer;
const BrowserWindow = require('electron').remote.BrowserWindow;
const {dialog} = require('electron').remote;
window.$ = window.jQuery = require('../assets/js/jquery.js');
// var {htmlAdd,htmlSelect } = require('../assets/js/usertest.js');
const fs = require('fs');
const path = require('path');
const fuzzy = require('js-levenshtein');
const natural = require('natural');
const _ = require("lodash");
var authorizationEndpoint = "../assets/js/token.php";
//var keyboard = require('virtual-keyboard');
var posTagger = require( 'wink-pos-tagger' );
var nlp = require( 'wink-nlp-utils' );
var tagger = posTagger();
var files = {};
var newFileCount = 0;
var showHints = 0;
var userDataPath;
// let mic_btn = document.getElementById('open_mic');
// var startRecognizeOnceAsyncButton = document.getElementById("startRecognizeOnceAsyncButton");
var subscriptionKey = document.getElementById("subscriptionKey");
var serviceRegion = document.getElementById("serviceRegion");
var clickStatus =0;
var authorizationToken;
var SpeechSDK;
var recognizer;
var fileCreatedFlag =0;
var editMode = 0;
var voicetext ="";
var markedText;
var selectedText;
var t3=[];
var isHtmlCode=0;
var FileName="";
var copyText = "";
var initial_line =0;
var initial_char =0;
var final_char=0;
var final_line=0;
var startReco =0;
var speechType=0;
var taskShuffle = [];
var taskCategoryShuffle = [];
var taskConditionShuffle =[];
var practiceMode=0;
const punctLists = [
    {name: 'star', tag: '*'},
    {name: 'bracket', tag: ')'},
    {name: 'close bracket', tag: '('},
    {name: 'dot', tag: '.'},
    {name: 'period', tag: '.'},
    {name: 'open tag', tag: '<'},
    {name: 'close tag', tag: '</'},
    {name: 'semicolon', tag: ':'},
    {name: 'double equals', tag: '=='},
    {name: 'equal', tag: '='},
    {name: 'plus', tag: '+'},
    {name: 'minus', tag: '-'},
    {name: 'multiply', tag: '*'},
    {name: 'times', tag: '*'},
    {name: 'percent', tag: '%'},
    {name: 'open curly bracket', tag: '{'},
    {name: 'close curley bracket', tag: '}'},
    {name: 'double quotes', tag: '"'},
    {name: 'quotes', tag: "'"},
    {name: 'space', tag: ' '},
    {name: 'comma', tag: ','},
    {name: 'greater than', tag: '>'},
    {name: 'less than', tag: '<'}
];
function startTest(){
    const modalPath = path.join('file://', __dirname, 'openTest.html')
    let win = new BrowserWindow({ width: 500, height: 500 })
    win.on('close', function () { win = null })
    win.loadURL(modalPath)
    win.show();
}
document.getElementById('languageOptions').addEventListener('change', (evt) => {
    localStorage.removeItem("speechLanguage");
    var speechLanguage = document.getElementById('languageOptions').value;
    localStorage.setItem("speechLanguage", speechLanguage);
});
var speechConfig;
if (authorizationToken) {
    speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authorizationToken, serviceRegion.value);
} else {
    if (subscriptionKey.value === "" || subscriptionKey.value === "subscription") {
        console.log("Please enter your Microsoft Cognitive Services Speech subscription key!");
        //return;
    }
    speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey.value, serviceRegion.value);
}
speechConfig.speechRecognitionLanguage = localStorage.getItem("speechLanguage");

//if (e.ctrlKey && e.keyCode == 84) {
function startRecognising(){
    startReco=1;
    //document.getElementById('voiceText').style.backgroundColor = "red";
    // document.getElementById("loader").style.display="block";
    var audioConfig  = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    document.getElementById('displaySpeech').style.display='block';
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    recognizer.startContinuousRecognitionAsync(function () {}, function (err) {
        console.trace("err - " + err);
    });
    recognizer.recognizing = function (s, e) {
        speechType=1;
        document.getElementById('voiceText').innerHTML=text_truncate(e.result.text,66);
        setTimeout(function(){
            document.getElementById("voiceText").innerHTML = '';
        }, 500000);

    }
    // The event recognized signals that a final recognition result is received.
    recognizer.recognized = function(s, e){

        // console.log(e.result);
        //if(e.result.)
        insertintotext(e.result.text.replace(/.\s*$/,""));
    };
    //mic_btn.style.color = 'red';
}
function stopRecognising(){
    if(startReco==1){
        startReco=0;
        //document.getElementById('voiceText').style.backgroundColor = "green";
        document.getElementById('voiceText').innerHTML="";
        document.getElementById('displaySpeech').style.display='none';
        recognizer.stopContinuousRecognitionAsync(
            function () {
                recognizer.close();
                recognizer = undefined;
            },
            function (err) {
                recognizer.close();
                recognizer = undefined;
            });
    }
}

if (!!window.SpeechSDK) {
    SpeechSDK = window.SpeechSDK;
    // startRecognizeOnceAsyncButton.disabled = false;

    // in case we have a function for getting an authorization token, call it.
    if (typeof RequestAuthorizationToken === "function") {
        RequestAuthorizationToken();
    }
}

document.getElementById('editorContent').onkeypress = function (evt) {
    if(practiceMode==0){
        var keyLogged = localStorage.getItem('pid')+', '+localStorage.getItem('taskNumber')+','+Date.now()+',Key Pressed: '+String.fromCharCode(evt.which || evt.keyCode)+'\r\n';
        fs.appendFileSync(localStorage.getItem("filename"), keyLogged, 'utf-8');
    }
};
document.getElementById('editors').addEventListener("contextmenu", function(e){
    e.preventDefault();
}, false);
document.getElementById('editorContent').addEventListener("mouseover", function(event){
    var pid=localStorage.getItem("pid");
    var tid = localStorage.getItem("taskId");
    var taskNumber = localStorage.getItem("taskNumber");
    var folderName = localStorage.getItem("folderName");
    if(pid > 0 && practiceMode==0){
        var cursorFileName = folderName+"/cursor_part_"+tid+".txt";
        var x = event.clientX;
        var y = event.clientY;
        var coor =  taskNumber + ","+x + "," + y+','+Date.now()+"\r\n";
        if(!cursorFileName){
            fs.writeFileSync(cursorFileName, coor, 'utf-8');
        }
        else {
            fs.appendFileSync(cursorFileName, coor, 'utf-8');
        }
    }
});
$('#keyboarddiv').hover(function(){
    window.mytimeout = setTimeout(function(){
        displayKeyboard();
    }, 1000);
}, function(){
    clearTimeout(window.mytimeout);
});


// editor initialisation

function initEditor(editor_id){

    let configuration = {
        lineNumbers: true,
        theme: 'one-dark',
        styleActiveLine: true,
        keyMap: "sublime",
        lineWrapping: true,
        foldGutter: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        showTrailingSpace: true,
        styleActiveSelected: true,
        styleSelectedText: true,
        matchBrackets: true,
        mode: 'text/html',
        matchTags:{bothTags: false},
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
        highlightSelectionMatches: {annotateScrollbar: true},
        // hintOptions: {hint: synonyms},
        scrollbarStyle: "simple",
        indentWithTabs: true,
        profile: 'xhtml'
    };
    let editor = emmetCodeMirror(CodeMirror.fromTextArea(editor_id, configuration));
    editor.focus();
    editor.on('focus', function () { $(".CodeMirror-cursors").css('visibility', 'visible'); });
    editor.on("mouseover", function(){

    })
    editor.on("focus", function (cm, event) {
        if (!cm.state.completionActive) {
            //CodeMirror.commands.autocomplete(cm, null, {completeSingle: false});
        }
    });
    return editor;
}
document.getElementById('editors').addEventListener('keyup', function(e){

    e.preventDefault();

    //if(typeof e==='object'){

    if(e.altKey && e.keyCode==80  && startReco==0){
        // e.preventDefault();
        startRecognising();

    }
    else if(e.altKey && e.keyCode==80 && startReco==1){
        // e.preventDefault();
        stopRecognising();

    }

    //}
});
document.getElementById('displaySpeech').addEventListener('keyup', function(e){

    e.preventDefault();
    //if(typeof e==='object'){

    if(e.altKey && e.keyCode==80 && startReco==0){
        //e.preventDefault();
        startRecognising();

    }
    else if(e.altKey && e.keyCode==80  && startReco==1){
        // e.preventDefault();
        stopRecognising();

    }
    //}
});
document.addEventListener('keyup', function(e){
    if (e.ctrlKey && e.keyCode == 81) {
        stopRecording();
    }
    if(e.ctrlKey && e.keyCode ==84){
        startRecognising();
    }
    if(e.ctrlKey && e.keyCode ==85){
        stopRecognising();
    }
});

document.getElementById('pId').addEventListener('change', function(){
    taskConditionShuffle.push(_.shuffle(["Keyboard","Gaze"]));
    taskCategoryShuffle.push(_.shuffle([1,2]));
    var t1=_.shuffle(["HTML","CSS"]);
    var t4=_.shuffle([1]);
    var t5=_.shuffle([5]);


    if(t1[0]=="HTML"){
        t3.push(t4,t5);
    }
    else {
        t3.push(t5,t4);
    }
    t3=_.flatten(t3);

    document.getElementById('taskconditionOrder').innerHTML ="<b>Task category Order:</b>"+_.flatten(t3);
    //document.getElementById('taskcategoryOrder').innerHTML ="<b>Task category Order:</b>"+taskCategoryShuffle;
})

function displayTaskNumber(){

    localStorage.removeItem("pid");
    localStorage.removeItem("folderName");
    document.getElementById('displayInitialScreen').style.display= "none";
    document.getElementById('displayTaskNumber').style.display= "block";
    $(".tab-content").hide();
    $(".nav-tabs").hide();
    let pid= document.getElementById('pId').value;
    localStorage.setItem("pid", pid);
    //Create folder for the user
    var folderName = "user_"+pid;
    if (!fs.existsSync(folderName)){
        fs.mkdirSync(folderName);
    }
    localStorage.setItem("folderName", folderName);
    // document.getElementById('taskOrder').innerHTML =taskShuffle;
    starttesting();
    changeTasks();
}
function starttesting(){
    document.getElementById('displayInitialScreen').style.display= "none";
    document.getElementById('displayTaskNumber').style.display= "block";
    document.getElementById('taskId').innerHTML =t3[0];
    $(".tab-content").hide();
    $(".nav-tabs").hide();
}

function changeTasks(){
    taskShuffle =[];
    taskShuffle.push(([1,2,3,4,5,6,7,8,9,10]));
    document.getElementById('taskOrder').innerHTML =taskShuffle;
}
function startPractice(){
    practiceMode=1;
    $(".tab-content").show();
    $(".nav-tabs").show();
    document.getElementById('displayTaskNumber').style.display= "none";
    document.getElementById('displayInitialScreen').style.display="none";
    document.getElementById('editors').style.pointerEvents= "auto";
    let filepath='C:\\Users\\ID918980\\Desktop\\development\\eyegaze\\index.html';
    let data = fs.readFileSync(filepath, 'utf-8');
    openFile(data, filepath);
    // let filepath2='C:\\Users\\ID918980\\Desktop\\development\\eyegaze\\test.html';
    // closeCurrentFile(filepath2);

//let filename='abc.html';
}

function starttasks(){
    if(taskShuffle.length!=0){
        document.getElementById('startBtn').disabled = false;
    }
    else if(taskShuffle.length==0){
        document.getElementById('taskId').innerHTML =t3[0];
        // t3.shift();
        // changeTasks();
        // document.getElementById('startBtn').disabled = false;
    }
    practiceMode=0;
    $(".tab-content").show();
    $(".nav-tabs").show();
    document.getElementById('displayTaskNumber').style.display= "none";
    let [fArray] = taskShuffle[0];
    localStorage.removeItem("taskNumber")
    localStorage.removeItem("filename");
    localStorage.removeItem("taskId");
    localStorage.removeItem("fileType");
    let tid = t3[0];

    if(tid=='1' )
    {
        localStorage.setItem("fileType","htmlAdd");
        //openHtmlFile();
    }

    else if(tid=='5')
    {
        localStorage.setItem("fileType","cssAdd");
        //openCSSFile();
    }
    var fType=localStorage.getItem('fileType');
    if(fType.startsWith("css")==true){
        openCSSFile();
    }
    else if(fType.startsWith("html")==true) {
        openHtmlFile();
    }
    if(fArray==1){
        if(fType=="htmlAdd") {
            editor.setValue(htmlAdd.one.code);
            editor.setCursor({line: htmlAdd.one.line, ch: htmlAdd.one.character});
        }
    }

    else if(fArray==5){

        if(fType=="cssEdit"){
            editor.setValue(cssEdit.five.code);
            editor.setCursor({line: cssEdit.five.line, ch: cssEdit.five.character});
        }
    }

    //if(fArray > 8){
    //startRecognising();
    //}
    FileName= localStorage.getItem("folderName")+"/user_"+tid+".txt";
    if(fType.startsWith("css")==true){
        var cssFileName = localStorage.getItem("folderName")+"/user_"+tid+".css";
    }
    else {
        var htmlFileName = localStorage.getItem("folderName")+"/user_"+tid+".html";
    }
    localStorage.setItem("filename", FileName);
    localStorage.setItem("htmlfilename",htmlFileName);
    localStorage.setItem("cssfilename",cssFileName);
    localStorage.setItem("taskNumber", fArray);
    localStorage.setItem("taskId", tid);
    var sTime = localStorage.getItem('pid')+', '+localStorage.getItem('taskNumber')+','+Date.now()+',Started\r\n';
    if(!FileName) {
        fs.writeFileSync(FileName, sTime, 'utf-8');
    }
    else {
        fs.appendFileSync(FileName, sTime, 'utf-8');
    }
    if(!htmlFileName) {
        fs.writeFileSync(htmlFileName, "", 'utf-8');
    }
    else {
        fs.appendFileSync(htmlFileName, "", 'utf-8');
    }
    if(!cssFileName) {
        fs.writeFileSync(cssFileName, "", 'utf-8');
    }
    else {
        fs.appendFileSync(cssFileName, "", 'utf-8');
    }
}
function startRecording(){
    document.getElementById('displayInitialScreen').style.display= "none";
    let pid= document.getElementById('pId').value;
    let tid = document.getElementById('taskId').value;
    var lines = '';
    localStorage.removeItem("filename");
    localStorage.removeItem("taskId");
    localStorage.removeItem("fileType");
    localStorage.removeItem("pid");
    localStorage.removeItem("folderName");
    //let taskStart = ' Task Id:'+tid +'\nStart Task: '+new Date()+'\n\n';
    var folderName = "user_"+pid;
    if (!fs.existsSync(folderName)){
        fs.mkdirSync(folderName);
    }
    localStorage.setItem("folderName", folderName);
    FileName= folderName+"/user_"+tid+".txt";
    localStorage.setItem("filename", FileName);
    localStorage.setItem("taskId", tid);
    localStorage.setItem("pid", pid);
    if(!FileName) {
        fs.writeFileSync(FileName, lines, 'utf-8');
    }
    else {
        fs.appendFileSync(FileName, lines, 'utf-8');
    }
    // createCursorFocus(pid);
}
var replacer = function(tpl, data) {
    var re = /\$\(([^\)]+)?\)/g, match;
    while(match = re.exec(tpl)) {
        tpl = tpl.replace(match[0], data[match[1]])
        re.lastIndex = 0;
    }
    return tpl;
}
function stopRecording(){
    stopRecognising();
    var eTime = localStorage.getItem('pid')+', '+localStorage.getItem('taskNumber')+','+Date.now()+',stopped\r\n';
    if(localStorage.getItem("fileType").startsWith("html")==true){
        var getEditorValue = "<--"+localStorage.getItem("fileType") +"-TaskID:"+localStorage.getItem("taskNumber")+"-->\r\n"+editor.getValue()+"\r\n\r\n\r\n\r\n";
        fs.appendFileSync(localStorage.getItem("htmlfilename"), getEditorValue, 'utf-8');
    }
    else if(localStorage.getItem("fileType").startsWith("css")==true){
        var getEditorValue ="/*"+localStorage.getItem("fileType") +"-TaskID:"+localStorage.getItem("taskNumber")+"*/\r\n"+editor.getValue()+"\r\n\r\n\r\n\r\n";
        fs.appendFileSync(localStorage.getItem("cssfilename"), getEditorValue, 'utf-8');
    }
    fs.appendFileSync(localStorage.getItem("filename"), eTime, 'utf-8');
    starttesting();

    document.getElementById('taskOrder').innerHTML = "";
    document.getElementById('taskOrder').innerHTML =taskShuffle;
    taskShuffle[0].shift();
    let remainingTasks = 11-taskShuffle[0].length;
    document.getElementById('taskId').readOnly=true;
    document.getElementById('taskOrder').innerHTML = "Tasks:"+remainingTasks+"/10           (" +taskShuffle+")" ;
    if(taskShuffle[0].length==0){
        t3.shift();
        document.getElementById('taskId').innerHTML =t3[0];
        changeTasks();
    }
    else {
        document.getElementById('startBtn').disabled = false;
    }
}
function createCursorFocus(pid){

}
function updatePreview() {
    document.getElementById("previewBar").style.width = "95%";
    document.getElementById("previewBar").style.height = "100%";
    document.getElementById("mainEditor").style.width = "0px";
    document.getElementById("mainEditor").style.marginRight = "95%";
    var previewFrame = document.getElementById('html-preview');
    var preview =  previewFrame.contentDocument ||  previewFrame.contentWindow.document;
    preview.open();
    preview.write(editor.getValue());
    preview.close();
    displayKeyboard(false);
}

// get userData path
function getUserDataPath(){
    if(! userDataPath) userDataPath = ipc.sendSync('getUserDataPath');
    // return ipc.sendSync('getUserDataPath');
    return userDataPath;
}
//Initialise the Speech authorisation key
function RequestAuthorizationToken() {
    if (authorizationEndpoint) {
        var a = new XMLHttpRequest();
        a.open("GET", authorizationEndpoint);
        a.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        a.send("");
        a.onload = function() {
            var token = JSON.parse(atob(this.responseText.split(".")[1]));
            serviceRegion.value = token.region;
            authorizationToken = this.responseText;
            subscriptionKey.disabled = true;
            subscriptionKey.value = "using authorization token (hit F5 to refresh)";
            console.log("Got an authorization token: " + token);
        }
    }
}

// auto mod selector
// var editor = "";
CodeMirror.modeURL = "../assets/editor/mode/%N/%N.js";
// var editor = "";
// var file = "";
var editor;
//newFile();
let filepath='C:\\Users\\ID918980\\Desktop\\development\\eyegaze\\test.html';
let data = fs.readFileSync(filepath, 'utf-8');
// //let filename='abc.html';
openFile(data, filepath);

ipc.on('currentWorkingFile', function(event){
    event.sender.send('getCurrentWorkingFile', file.name);
});


function taskRecord(pressedKey,fType){
    startRecognising();
    var eTime = "\r\nTask type:"+fType+"\r\n Task Number:"+pressedKey+"\r\nstart time:"+new Date().toLocaleTimeString()+"\r\n";
    fs.appendFileSync(localStorage.getItem("filename"), eTime, 'utf-8');
}

function newTab(filepath, filecount ,filename, data, remote_path){
    let file_id = "new" + filecount;
    $('#code_mirror_editors').append('<li id = "file_tab_'+file_id+'"><a href="" data-target="#' + file_id + '" role="tab" data-toggle="tab"><span id = "filename_'+file_id+'" onclick = "opentab(this)">' + filename + '</span></a></li>');
    $('#editors').append('<div class="tab-pane" id = "'+file_id+'"><textarea id="file_'+file_id+'" autofocus></textarea></div>');
    let temp = initEditor(document.getElementById('file_' + file_id));
    temp.setValue(data);
    chagneEditorMode(filename,temp);

    temp.refresh();
    // temp.refresh();
    addPanel('bottom',temp, file_id);
    files['#'+ file_id] = {
        path: filepath,
        name: filename,
        remote_path:remote_path,
        id: file_id,
        editor: temp
    }
    temp.on("change", function() {
        closeToDot();
    });
}

text_truncate = function(str, length, ending) {
    if (length == null) {
        length = 100;
    }
    if (ending == null) {
        ending = '';
    }
    if (str.length > length) {
        return str.substring(0, length - ending.length) + ending;
    } else {
        return str;
    }
};
//Voice function
function insertintotext(text){
    text = text.toLowerCase();  //change the text into lowercase
    var firstword =text.replace(/ .*/,''); //get the first word

    var pos = editor.getCursor(); //Get the cursor
    // text = text.replace("dot","."); //Replace all the dots and commas
    text = text.replace("go to one","go to 1"); //Replace all the dots and commas
    text = text.replace("delete line one","delete line 1"); //Replace all the dots and commas
    text = text.replace("select line one","select line 1"); //Replace all the dots and commas
    // text = text.replace("comma", ",");
    // if(startReco==1){
    //     if(speechType > 0) {
    //document.getElementById('loader').style.display='none';


    //document.getElementById('loader').style.display='block';

    //     }
    // }

    //Replace punctuations

    //Function to replace punctuation
    function ReplaceText(input) {
        return punctLists.reduce((acc, a) => {
            const re = new RegExp(a.name,"g");
            return acc.replace(re, a.tag);
        }, input);
    }

    if(localStorage.getItem("filename")){
        var startDate =Date.now();
        var voiceCommands = localStorage.getItem('pid')+', '+localStorage.getItem('taskNumber')+','+startDate+',Voice action,'+text +' \r\n';
        fs.appendFileSync(localStorage.getItem("filename"), voiceCommands, 'utf-8');
    }
    if(['star', 'open tag', 'close tag','open bracket','close bracket','dot','period','semicolon','double equals','equal','plus','minus','times','multiply','percent','quotes','space','comma','double quotes'].some(item=>text.includes(item))){
        // editor.replaceRange(ReplaceText(text),pos);
    }

    var tagFuzzy = natural.JaroWinklerDistance("tab",firstword) //Handling the fuzzy word
    var createFuzzy = natural.JaroWinklerDistance("create", firstword);
    var editFuzzy = natural.JaroWinklerDistance("edit", firstword);
    var eolFuzzy = natural.JaroWinklerDistance("end of line", text);
    var deleteFuzzy = natural.JaroWinklerDistance("delete", text);
    var setFuzzy = natural.JaroWinklerDistance("set", firstword);
    if(['create file', 'new file', 'new javascript file', 'new html file', 'create html file', 'create a file', 'create css file', 'new css file'].some(item =>text.includes(item))){
        handlefiles(text);
    }
    if(editor.getMode().name =="htmlmixed") {  //If the editor is in html mode
        // if(tagFuzzy > 0.6 ) {
        // matchHtmlTags(text, pos);
        //}
        if(firstword=="preview"){
            updatePreview();
        }
        else if(firstword=="bootstrap"){
            putBootstrap(text);
        }
    }
    if(text.includes("select property")) {
        tagForward(text);
    }

    if(firstword=="type"){
        writeCode(text,pos,true);
    }
    if(firstword=="add"){
        handleAdds(text, pos);
    }
    if(text.includes("open css")){
        openCSSFile();
    }
    if(text.includes("html")){
        openHtmlFile();
    }
    if(text.includes("backspace")){
        const ev ={
            type:"backspace",
            ctrlKey:true,
            keyCode:8
        }
        editor.triggerOnKeyDown(ev);
    }
    if(text.includes("undo")){
        // var currentPosition=editor.getCursor();
        editor.undo();
        // editor.focus();
        // editor.setCursor(currentPosition);
    }
    if(text.includes("redo")){
        editor.redo();
    }
    if(text.includes("delete")){
        deleteContent(text);

    }
    if(text.includes("new line")){
        editor.execCommand("newlineAndIndent");

    }
    if(text.includes("format")){
        // formatCode();
    }
    if(text.includes("close preview")){
        closeNav();
    }
    /*This will be used for autocompletion, which is not the feature now


    if($('ul.CodeMirror-hints').length > 0 && text.includes("down")){

        var currentItem = $('li.CodeMirror-hint-active');
        var nextItem=currentItem.next();
        console.log(currentItem,nextItem);
        currentItem.removeClass('CodeMirror-hint-active');
        nextItem.addClass('CodeMirror-hint-active');
        currentItem.nextSibling;

    }
    if($('ul.CodeMirror-hints').length > 0 && text.includes("select")){

        var currentItem = $('li.CodeMirror-hint-active');
        var elementSelected=currentItem[0].innerText;
        const ev ={
            type:"backspace",
            ctrlKey:true,
            keyCode:8
        }
        editor.triggerOnKeyDown(ev);
        editor.replaceRange(elementSelected,pos);
        const ev1 = {
            type:"tab",
            keyCode:9
        }
        editor.triggerOnKeyDown(ev1);
    }
    End of Hints
      */
    if(text.includes("open keyboard")){
        displayKeyboard(true);
    }
    if(text.includes("close keyboard")){
        displayKeyboard(false);
    }

    if(text.includes("go")){
        var lineNumber = parseInt(text.split("to")[1]);

        editor.scrollIntoView({line:lineNumber+20, ch:0}, 200);
        editor.setCursor({line:lineNumber-1, ch:0});
        editor.execCommand("goLineStartSmart");
        editor.focus();
        // editor.execCommand("goColumnRight");
        //editContent(text,lineNumber);
        editor.setCursor(editor.getCursor());
        // markedText.clear();
    }
    if(text.includes("select")){
        lineSelect(text);
    }
    if(text.includes("unselect")){
        editor.removeLineClass(editor.getCursor().line, "background","CodeMirror-selected" )
    }
    if(text.includes("save")){
        //editor.execCommand('saveCtrl');
    }
    if(text.includes("format")){
        formatCode();
    }
    if(text.includes("comment")){
        commentCode(text);
    }
    if(firstword =="space"){
        let currentPosition = editor.getCursor();
        editor.replaceRange(' ',currentPosition);
        //moveCursor('Space', 32,currentPosition);
        editor.setCursor({line:currentPosition.line, ch: currentPosition.ch + 1});
        editor.focus();
        triggerRightMouse();
    }
    if(['edit', 'editline', 'redline', 'read line', 'readline'].some(item =>text.includes(item))){
        editMode=1;
        var selectedLine = parseInt(text.split(" ").pop());
        editContent(text,selectedLine);
    }

    if(eolFuzzy > 0.6){
        let currentlength=editor.getCursor().line;
        editor.execCommand('goLineEnd');
    }
    if(text.includes("begin")){

        initial_line = editor.getCursor().line;
        initial_char = editor.getCursor().ch;
        console.log(initial_line, initial_char);
    }
    if(text.includes("stop")){
        final_line=editor.getCursor().line;
        final_char=editor.getCursor().ch;

    }
    if(text.includes("mark") || text.includes("select"))
    {
        if(markedText){
            markedText.clear();
        }
        markedText= editor.markText({ line: initial_line,
            ch:initial_char}, {   line: final_line,
            ch: final_char},{
            className: "styled-background"
        });
    }
    if(text.includes("clear")) {
        document.getElementById("editors").classList.remove("CodeMirror-selected");

        if(markedText){
            markedText.clear();
        }
        editor.operation(function() {
            for (var i = 0, e = editor.lineCount(); i < e; ++i)
                editor.clearMarker(i);
        });

    }
    if(text.includes("left")){
        let initialChPos=editor.getCursor();
        initial_line = initialChPos.line;
        initial_char = initialChPos.ch;
        var occurance=0;
        var lineNumber = parseInt(text.split("left")[1]) || 0;

        if(text.split("left")[1] > 0){
            occurance=text.split("left")[1]
        }
        else if(lineNumber > 0){
            occurance=lineNumber;
        }
        else{
            occurance = text.split("left").length - 1 ;
        }
        for(var i=0; i<occurance;i++) {


            goOneLineLeft(pos, occurance);
            if (markedText) {
                markedText.clear();
            }
            //triggerRightMouse();

            var doc = editor.getDoc();
            var cursor = doc.getCursor(); // gets the line number in the cursor position
            editor.setCursor(cursor);
            editor.focus();

            markedText = editor.markText({
                line: cursor.line,
                ch: cursor.ch
            }, {
                line: cursor.line,
                ch: initialChPos.ch
            }, {
                className: "styled-background"
            });
        }
    }
    if(text.includes("middle")){
        var getLine=editor.getCursor().line;
        var test=editor.getLine(getLine).length;
        editor.setCursor({line:getLine,ch:test/2});
    }
    if(text.includes("right")){
        let initialChPos=editor.getCursor();
        initial_line = initialChPos.line;
        initial_char = initialChPos.ch;
        var occurance=0;
        var lineNumber = parseInt(text.split("right")[1]) || 0;

        if(text.split("right")[1] > 0){
            occurance=text.split("right")[1]
        }
        else if(lineNumber > 0){
            occurance=lineNumber;
        }
        else{
            occurance = text.split("right").length - 1 ;
        }

        editor.execCommand("goWordRightAlt");
        for(var i=0; i<occurance; i++)
        {


            if(markedText){
                markedText.clear();
            }

            var doc = editor.getDoc();
            var cursor = doc.getCursor(); // gets the line number in the cursor position
            editor.setCursor(cursor);
            var A1 = editor.getCursor().line;
            var str = editor.getLine(A1);
            let attributes = str.match(/\w+/g);

            var A2 = editor.getCursor().ch;
            var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
            var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
            var fw = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});
            //if(fw.match(/[a-z]/i)==null && isHtmlCode==0) {
            editor.triggerOnKeyDown({
                type: 'keyRight',
                keyCode: 39
            });
            //console.log("nothing");
            var A1 = editor.getCursor().line;
            var A2 = editor.getCursor().ch;
            var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
            var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
            var fw = editor.getRange({line: A1, ch: B1}, {line: A1, ch: B2});
            var ress = attributes.find(element => element.includes(fw));

            var fw2 = editor.getRange({line: A1, ch: B1}, {line: A1, ch: B1 + ress.length});
            markedText = editor.markText({
                line: A1,
                ch: B1
            }, {
                line: A1,
                ch: B1 + ress.length
            }, {
                className: "styled-background"
            });
            editor.setCursor({line: A1, ch: B1 + ress.length});
            // }


            copyText=fw;
            final_line = cursor.line;
            final_char = cursor.ch;
        }

    }
    if(text.includes("up")){
        var occurance=0;
        if(text.split("up")[1] > 0){
            occurance=text.split("up")[1]
        }
        else{
            occurance = text.split("up").length - 1 ;
        }
        goOneLineUP(pos,occurance);
    }
    if(text.includes("down")){
        var occurance=0;
        if(text.split("down")[1] > 0){
            occurance=text.split("up")[1]
        }
        else{
            occurance = text.split("down").length - 1 ;
        }
        goOneLineDown(pos,occurance);
    }
    if(text.includes("copy")){

        // var A1 = initial_line;
        // var A2 = initial_char;
        // var B1 = final_line;
        // var B2 = final_char;
        // var fw = editor.getRange({line: A1,ch: A2}, {line: B1,ch: B2});
        var A1 = editor.getCursor().line;
        console.log(A1);
        var A2 = editor.getCursor().ch;
        var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
        var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
        var fw = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});
        // editor.markText({line: A1,ch: A2}, {line: B1,ch: B2}, {
        //     className: "styled-background"
        // });
        copyText=fw;
    }
    if(text.includes("cut")){

        var A1 = initial_line;
        var A2 = initial_char;
        var B1 = final_line;
        var B2 = final_char;
        var fw = editor.getRange({line: A1,ch: A2}, {line: B1,ch: B2});
        copyText=fw;
        editor.replaceRange("",{line: A1,ch: A2}, {line: B1,ch:B2});
    }
    if(text.includes("paste")){
        let curPos=editor.getCursor();
        editor.replaceRange(copyText,curPos);
    }
}
function openCSSFile(){
    let filepath='C:\\Users\\ID918980\\Desktop\\development\\eyegaze\\style.css';
    let data = fs.readFileSync(filepath, 'utf-8');
//let filename='abc.html';
    openFile(data, filepath);
}

function openHtmlFile(){
    let filepath='C:\\Users\\ID918980\\Desktop\\development\\eyegaze\\test.html';
    let data = fs.readFileSync(filepath, 'utf-8');
//let filename='abc.html';
    openFile(data, filepath);
}

function lineSelect(text){
    //Find the text after select
    var selectCriteria = text.split("select")[1];
    if(selectCriteria.length==0 || selectCriteria=="" ) {
        if(markedText){
            markedText.clear();
        }
        var A1 = editor.getCursor().line;
        var A2 = editor.getCursor().ch;
        var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
        var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
        var fw = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});
        copyText=fw;
        editor.markText({  line: A1,
            ch:B1}, {   line: A1,
            ch: B2},{
            className: "CodeMirror-selected"
        });
        editor.setCursor({line:A1, ch:B2});
    }

    else {
        //Get the line numbers
        var lineNumbers = selectCriteria.match(/\d+/g).map(n => parseInt(n));

        //If only one line is selected or no line selected
        if(lineNumbers.length==1){
            var lineNumber = lineNumbers[0] || editor.getCursor().line;
            editor.scrollIntoView({line:lineNumber+4, ch:0}, 200);
            selectedText=editor.addLineClass(lineNumber-1, "background", "CodeMirror-selected");
            editor.setCursor({line:lineNumber-1, ch:0});
            editor.execCommand("goLineStartSmart");
            editor.focus();
        }
        //if multiple lines are given
        else if(lineNumbers.length==2){

            editor.markText({  line: lineNumbers[0]-1,
                ch:0}, {   line: lineNumbers[1]-1,
                ch: 100},{
                className: "CodeMirror-selected"
            });
            editor.setCursor({line:lineNumbers[1], ch:100});
        }

    }

}
function tagForward(text){

    let initialChPos=editor.getCursor();
    initial_line = initialChPos.line;
    initial_char = initialChPos.ch;
    var occurance=0;

    if(markedText){
        markedText.clear();
    }
    if(editor.getMode().name=="css"){
        if(editor.getLine(pos.line).includes(':')){


            let cssattributes = editor.getLine(pos.line).split(':');
            goOneLineRight(pos,occurance);
            var doc = editor.getDoc();
            var cursor = doc.getCursor(); // gets the line number in the cursor position
            editor.setCursor(cursor);
            editor.focus();
            markedText= editor.markText({  line: pos.line,
                ch:initialChPos.ch}, {   line: cursor.line,
                ch: cursor.ch},{
                className: "styled-background"
            });
            var fw = editor.getRange({  line: pos.line,
                ch:initialChPos.ch}, {   line: cursor.line,
                ch: cursor.ch});
            copyText=fw;
            final_line = pos.line;
            final_char = pos.ch;
            //editor.setCursor({line: pos.line, ch:pos.ch+cssattributes[1].length});
        }
        else {
            editor.triggerOnKeyDown({type: 'keyRight',
                keyCode: 39
            });
            //console.log("nothing");
            var A1 = editor.getCursor().line;
            var A2 = editor.getCursor().ch;
            var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
            var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
            var fw = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});
            copyText=fw;
            final_line = pos.line;
            final_char = pos.ch;
            var ress=attributes.find(element =>element.includes(fw));

            var fw2 = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B1+ress.length});
            markedText= editor.markText({  line: A1,
                ch:B1}, {   line: A1,
                ch: B1+ress.length},{
                className: "styled-background"
            });
            editor.setCursor({line:A1,ch:B1+ress.length});

        }

    }
    else {
        var A1 = editor.getCursor().line;
        var str = editor.getLine(A1);
        let attributes = str.match(/[\w-]+="[^"]*"/g);

        var A2 = editor.getCursor().ch;
        var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
        var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
        var fw = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});
        if(fw.match(/[a-z]/i)==null && isHtmlCode==0)
        {
            editor.triggerOnKeyDown({type: 'keyRight',
                keyCode: 39
            });
            //console.log("nothing");
            var A1 = editor.getCursor().line;
            var A2 = editor.getCursor().ch;
            var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
            var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
            var fw = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});
            var ress=attributes.find(element =>element.includes(fw));

            var fw2 = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B1+ress.length});
            copyText=fw;
            markedText= editor.markText({  line: A1,
                ch:B1}, {   line: A1,
                ch: B1+ress.length},{
                className: "styled-background"
            });
            editor.setCursor({line:A1,ch:B1+ress.length});

        }
        else if(isHtmlCode==1) {
            goOneLineRight(pos,occurance);
            var doc = editor.getDoc();
            var cursor = doc.getCursor(); // gets the line number in the cursor position
            editor.setCursor(cursor);
            editor.focus();
            markedText= editor.markText({  line: A1,
                ch:initialChPos.ch}, {   line: A1,
                ch: cursor.ch},{
                className: "styled-background"
            });
        }
    }
}

function deleteContent(text){
    var deleteCriteria = text.split("delete")[1];

    var A1 = editor.getCursor().line;
    var A2 = editor.getCursor().ch;
    var lineContent = editor.getLine(A1);
    if(deleteCriteria.includes('line')){
        var lineNumbers = deleteCriteria.match(/\d+/g).map(n => parseInt(n));
        if(lineNumbers.length==1)
        {
            editor.setCursor({line:lineNumbers-1, ch:0});
            editor.execCommand('deleteLine');
        }
        else if(lineNumbers.length==2){
            editor.replaceRange("", {line:lineNumbers[0]-1, ch:0}, {line:lineNumbers[1]-1, ch:200} )
        }

    }
    else if(deleteCriteria.includes("tag") && deleteCriteria.length > 0) {
        var tagToDelete = lineContent.substring(
            lineContent.lastIndexOf("<") + 1,
            lineContent.lastIndexOf(">")
        );
        editor.replaceRange("", {line: A1, ch: A2}, {line: A1, ch: A2 + tagToDelete.length-1});

        //editor.replaceSelection(" ",tagToDelete);
    }

    else if(deleteCriteria.includes("left")){
        const ev ={
            type:"delete",
            ctrlKey:true,
            keyCode:8
        }
        editor.triggerOnKeyDown(ev);
    }

    else if(deleteCriteria.includes("selected")){

        var A1 = editor.getCursor().line;
        var A2 = editor.getCursor().ch;
        var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
        var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
        var fw = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});


        editor.replaceRange("",{line: A1,ch: editor.getAllMarks()[0].lines[0].markedSpans[0].from}, {line: A1,ch: editor.getAllMarks()[0].lines[0].markedSpans[0].to});

    }

    // else if(deleteCriteria.length == 0 ){
    //     const ev ={
    //         type:"delete",
    //         ctrlKey:true,
    //         keyCode:46
    //     }
    //     editor.triggerOnKeyDown(ev);
    // }
}
function handlefiles(text){
    var fileName = text.split('file')[1];
    // console.log(fileName);
    fileName = fileName.replace("dot", "."); //remove dot
    fileName = fileName.replace(/\s/g, ''); //remove spaces
    var newFname="";

    var fileExtension = text.split('file')[0];
    var fileExtensionfurther = fileExtension.split(' ')[1];

    var fext = (fileExtensionfurther=="css")?".css": (fileExtensionfurther=="javascript")?".js":"";
    if(fileExtension){
        newFname = fileName+fext;
    }
    else{
        newFname = fileName;
    }
    document.getElementById('createFile').value=newFname;
    document.getElementById('createFile').focus();
    document.getElementById('createFile').style.zoom = 1.8;
    document.getElementById('inputkeyboard').style.display='block';
    displayInputKeyboard();
}

function editContent(text,selectedLine){

    editor.setCursor({line:selectedLine-1, ch:0});
    editor.scrollIntoView({line:selectedLine+4, ch:0}, 200);
    editor.execCommand("goLineStartSmart");
    editor.focus();

    var A1 = editor.getCursor().line;
    var A2 = editor.getCursor().ch;

    var B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
    var B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
    var fw = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});
    if(markedText){
        markedText.clear();
    }
    if(editor.getMode().name=="css"){
        if(editor.getLine(selectedLine-1).includes(':')){

            let cssattributes = editor.getLine(selectedLine-1).split(':');
            markedText= editor.markText({line: A1,ch: B1}, {line: A1,ch: B1+cssattributes[0].length}, {
                className: "styled-background"
            });
            editor.setCursor({line: A1, ch:B1+cssattributes[0].length});
        }
        else {
            markedText= editor.markText({line: A1,ch: B1}, {line: A1,ch: B2},{
                className: "styled-background"
            });
        }

    }
    else if(editor.getMode().name =="htmlmixed") {
        var [, firstWord] = editor.getLine(selectedLine-1).match(/[^a-z]([a-z]+)[^a-z]/i);
        var tags =[];
        var flength = firstWord.length;

        if(fw.match(/[a-z]/i)==null)
        {
            //goOneLineRight({line: A1,ch: B1},1);
            editor.setCursor({line: A1,ch: B2});
            markedText= editor.markText({line: A1,ch: B2}, {line: A1,ch: B2+flength},{
                className: "styled-background"
            });
            isHtmlCode=0;

        }
        else {
            markedText= editor.markText({line: A1,ch: B1}, {line: A1,ch: B2},{
                className: "styled-background"
            });
            isHtmlCode=1;
            //goOneLineRight(editor.getCursor());
        }
        goOneLineRight(editor.getCursor());
    }

    // console.log(editor.getLine(selectedLine-1).split(':'));

    //goOneLineRight(editor.getCursor());
    // console.log(editor.getCursor());
    //console.log(fw.match(/[a-z]/i));
    //editor.setCursor({line: A1,ch: B1});
    // editor.markText({line: A1,ch: B1}, {line: A1,ch: B2},{
    //     className: "styled-background"
    // });
    //displayKeyboard(true);
}
function writeCode(text,pos,status){
    editor.replaceRange(tobeinserted,pos);
    editor.setCursor({line:pos.line, ch:pos.ch+tobeinserted.length});
}
function formatCode(){
    //var totalLines = editor.lineCount();
    //editor.autoFormatRange({line:0, ch:0}, {line:totalLines});
}
function commentCode(text){
    var commentLine = editor.getCursor().line;
    var getcontent = editor.getLine(commentLine);
    editor.lineComment({line:commentLine, ch:0},{line:commentLine, ch:getcontent.length} );
}
function triggerRightMouse(){
    //console.log("key triggered");
    //const ev = new KeyboardEvent('keydown',{'keyCode':32,'which':32});
    editor.trigger({
        type: 'mousedown',
        which: 3
    });
}
function getHintsCode(text, pos){

}
function goOneLineLeft(pos, occurance){
    const ev = {
        type: 'keyLeft',
        ctrlKey:true,
        keyCode: 37 // the keycode for the left arrow key, use any keycode here
    }
    editor.triggerOnKeyDown(ev);
}
function goOneLineRight(pos, occurance){
    const ev = {
        type: 'keyRight',
        ctrlKey:true,
        keyCode: 39 // the keycode for the left arrow key, use any keycode here
    }
    editor.triggerOnKeyDown(ev);

}
function goOneLineUP(pos, occurance){
    const ev = {
        type: 'upRight',
        keyCode: 38 // the keycode for the left arrow key, use any keycode here
    }
    editor.triggerOnKeyDown(ev);
    var position=editor.getCursor();
    editor.scrollIntoView({line:position.line, ch:0}, 200);
    editor.focus();
}
function goOneLineDown(pos, occurance){
    const ev = {
        type: 'downRight',
        keyCode: 40 // the keycode for the left arrow key, use any keycode here
    }
    editor.triggerOnKeyDown(ev);
    var position=editor.getCursor();
    editor.scrollIntoView({line:position.line, ch:0}, 200);
    editor.focus();
}
function handleAdds(text, pos){

}

//Create html tags
function matchHtmlTags(text, pos){
    let tokenizer = new natural.TreebankWordTokenizer();
    let wordListAll = tokenizer.tokenize(text);
    let wordList = nlp.tokens.removeWords(wordListAll);
    if(wordList.length <= 1){
        editor.replaceRange(' ',pos);
        editor.focus();
        triggerRightMouse();
        getHintsCode(text, pos);
    }
    else{
        let secondAttribute = wordList[1];
        let thirdAttribute = wordList[2];
        let fourthAttribute = wordList[3];
        const taglists = [
            {name: 'paragraph', tag: 'p'},
            {name: 'div', tag: 'div'},
            {name: 'bold', tag: 'b'},
            {name: 'heading one', tag: 'h1'},
            {name: 'heading two', tag: 'h2'},
            {name: 'heading three', tag: 'h3'},
            {name: 'heading four', tag: 'h4'},
            {name: 'heading five', tag: 'h5'},
            {name: 'heading six', tag: 'h6'},
            {name: 'table', tag: 'table'},
            {name: 'header', tag: 'header'},
            {name: 'main', tag: 'main'},
            {name: 'section', tag: 'section'},
            {name: 'article', tag: 'article'},
            {name: 'aside', tag: 'aside'},
            {name: 'footer', tag: 'footer'},
            {name: 'row', tag: 'tr'},
            {name: 'column', tag: 'td'},
            {name: 'table head', tag: 'thead'},
            {name: 'table body', tag: 'tbody'},
            {name: 'header cell', tag: 'th'},
            {name: 'head', tag: 'head'},
            {name: 'title', tag: 'title'},
            {name: 'html', tag: 'HTML'},
            {name: 'body', tag: 'body'}
        ];
        const match = taglists.find( tag => tag.name === secondAttribute );
        if(match) {
            tobeinserted= fourthAttribute ? '<'+match.tag+' '+thirdAttribute+' = "'+fourthAttribute+'">\t\n\n</'+match.tag+'>' : '<'+match.tag+'>\t\n\n</'+match.tag+'>';
            // editor.replaceRange(tobeinserted,pos);
            //editor.focus();
            //let currentlength = fourthAttribute ? (match.tag + thirdAttribute + fourthAttribute).length: match.tag.length;
            //editor.setCursor({line :pos.line , ch : pos.ch + currentlength +1});
        }
    }
}
function moveCursor(type,code,pos){

    const ev = {
        type:type,
        keyCode:code
    }
    editor.triggerOnKeyDown(ev);
    editor.focus();
    editor.setCursor(pos);
}
// check is file already opened

function isFileAlreadyOpened(filepath){
    for(i in files){
        if(files[i].path == filepath && filepath != undefined) return true;
    }
    return false;
}
//Preview
// function openNav() {
//     document.getElementById("previewBar").style.width = "50%";
//     document.getElementById("mainEditor").style.marginRight = "50%";
// }

function closeNav() {
    document.getElementById("previewBar").style.width = "0";
    //document.getElementById("mainEditor").style.marginRight= "0";
    document.getElementById("mainEditor").style.width = "100%";
    displayKeyboard(true);
}

// end here

// get File ID from filepath

function getFileID(filepath){
    for(i in files){
        if(files[i].path == filepath) return files[i].id;
    }
    return undefined;
}

// end here


// Open File

function openFile(data, filepath, filename, remote_path){
    // filepath='C:\\Users\\ID918980\\Desktop\\development\\eyegaze\\';
    //     filename='abc.html';
    if(isFileAlreadyOpened(filepath)){
        // console.log($('#filename_'+getFileID(filepath)));
        $('#filename_'+getFileID(filepath)).click();
    }else{
        newFileCount++;
        newTab(filepath, newFileCount , (filename != undefined) ? filename : ((filepath == undefined) ? 'untitled': path.basename(filepath)),data, remote_path);

        $('#filename_new'+newFileCount).click();
    }
}

function renderHTMLFileAndOpen(filename){
    if(isFileAlreadyOpened(path.join(__dirname, filename))){
        $('#filename_'+getFileID(path.join(__dirname, filename))).click();
    }else{
        newFileCount++;
        let file_id = "new" + newFileCount;
        fs.readFile(path.join(__dirname, filename), function(err,data){
            if(err) console.log(err);
            $('#code_mirror_editors').append('<li id = "file_tab_'+file_id+'"><a href="" data-target="#' + file_id + '" role="tab" data-toggle="tab"><span id = "filename_'+file_id+'" onclick = "opentab(this)">' + filename.split('.')[0] + '</span><span onclick = "closeAnyFile(this)" class="close black"></span></a></li>');
            $('#editors').append('<div class="tab-pane" id = "'+file_id+'">'+data+'</div>');
            files['#'+ file_id] = {
                path: path.join(__dirname, filename),
                name: undefined,
                id: file_id,
                editor: undefined
            }
            $('#filename_new'+newFileCount).click();
        });
    }
}

ipc.on('openFile',function(event, data, filepath){
    openFile(data,filepath);
})

ipc.on('openTest', function(event){
    renderHTMLFileAndOpen('openTest.html')
});

// close current file

function findNextFile(deleted_file_count){
    for(let i = deleted_file_count + 1; i <= newFileCount; i++){
        let key = '#new' + i;
        if(files.hasOwnProperty(key)) return i;
    }
    for(let i = deleted_file_count - 1; i > 0; i--){
        let key = '#new' + i;
        if(files.hasOwnProperty(key)) return i;
    }
    return undefined;
}

function closeAnyFile(button){
    // console.log($(button).parent().data('target'));
    closeCurrentFile(files[$(button).parent().data('target')]);
}

function closeCurrentFile(file){
    let filecount = parseInt(file.id.split('new')[1]);
    // console.log(nextFile);
    let nextfilecount = findNextFile(filecount);

    if(nextfilecount != undefined){

        // console.log(filecount);

        $('#file_tab_' + file.id).remove();
        $('#'+ file.id).remove();
        delete files['#'+file.id];
        let nextFile = '#new' + nextfilecount;
        file = files[nextFile];
        editor = file.editor;
        // console.log($('#filename_' + nextFile.split('#')[1]).parent());
        $('#filename_' + nextFile.split('#')[1]).click();
    }else{
        // console.log(files['#' + file.id].filepath, files);
        if(files['#' + file.id].path != undefined){
            $('#file_tab_' + file.id).remove();
            $('#'+ file.id).remove();
            delete files['#'+file.id];
            newFile();
        }
        // ipc.send('close-app');
    }
    // console.log(files.hasOwnProperty(nextFile));
}

ipc.on('closeFile',function(event){
    closeCurrentFile(file);
});

// generate valid ID from path

function pathToId(filepath){
    filepath = filepath.replace(/ /g, '_');
    filepath = filepath.replace(/:/g, '');
    let tokens = filepath.split(path.sep);
    let ID = '';
    for(let i = 0; i < tokens.length; i++){
        ID += tokens[i];
    }
    // console.log(ID);
    return ID;
}

// open folder

function openFolder(){
    let structure = {};
    structure = {
        path: 'C:\\Users\\ID918980\\Desktop\\development\\eyegaze',
        name: 'eyegaze'
    }
    let response = '<ul class="file-tree" id="fileList"><li><a href="#"><span class = "label" onclick = "createDirectoryForSpecificDirpath(this)" data-path = "' + structure.path + '">' + structure.name + '</span></a><ul id = "' + pathToId(structure.path) + '"></ul>';
    $('#project-structure').html(response);
    // console.log($('#project-structure'));
    $(".file-tree").filetree();
    //createDirectoryForSpecificDirpath(this);
    openProjectStructure(true);

}
ipc.on('openFolder', function(event,structure){
    openFolder(structure);
});

// create directory for specific Dirpath


function createDirectoryForSpecificDirpath(folder){
    ipc.send('createDirectoryForSpecificDirpath', folder.getAttribute('data-path'));
}

ipc.on('getDirectroyForSpecificDirpath', function(event, structure){
    openSpecificDirectory(structure);
});

function openSpecificDirectory(dir_structure){
    $('#' + pathToId(dir_structure.path)).html(makeDirectoryTree(dir_structure.children));
    $('#' + pathToId(dir_structure.path)).filetree();
}
// create tree structure for opened folder

function makeDirectoryTree(structure){
    var response = "";
    structure.forEach(function(obj){
        if(obj.type == "folder"){
            // response += '<li><a href="#"><span class = "label">'+ obj.name + '</span></a><ul>' + makeDirectoryTree(obj.children) + '</ul></li>';
            response += '<li><a href="#"><span class = "label" onclick = "createDirectoryForSpecificDirpath(this)" data-path = "' + obj.path + '">'+ obj.name + '</span></a><ul id = "' + pathToId(obj.path) + '"></ul></li>';
        }else{
            response += '<li data-extension = "'+obj.name+'"><a href="#"><span onclick = "openFileFromSidebar(this)" class = "label" data-name = "'+ obj.name +'" data-path = "'+ obj.path +'">' + obj.name + '</span></a></li>';
        }
    });
    return response;
}


function openFileFromSidebar(file, remote){
    let filepath = file.getAttribute('data-path');
    ipc.send('openFileFromSidebar', filepath);
}

// new File
function newFile(){

    fileCreatedFlag =1;
    newFileCount ++;
    var filename ='undefined';
    // document.getElementById('createFile').style.zoom = 1.0;
    // console.log(filename);
    newTab(undefined , newFileCount , filename, '');
    saveFileHelper(filename);
    $('#filename_new'+newFileCount).click();
}

function saveFileHelper(filename){

    saveFile("", "C:\\Users\\ID918980\\Desktop\\development\\eyegaze\\"+filename);
}
ipc.on('newFile',function(event){
    newFile();
    // editor.getDoc().setValue('');
})

ipc.on('saveAs', function(event){
    if(editor != undefined){
        var data = editor.getValue();
        // console.log(data);

        ipc.send('saveAs-data', data);
    }
})

// document.getElementById('scrollup').addEventListener('click', function() {
//     scroll(0,-50);
// });
// // document.getElementById('scrolldown').addEventListener('click', function() {
// //     scroll(0,50);
// // });
//scroll the files
function scroll(x,y){
    document.getElementsByClassName('file-list').scrollBy(x, y);
}


function saveFile(data, filepath, remote){
    pathname = 'C:\\Users\\ID918980\\Desktop\\development\\eyegaze';
    //file.name = path.basename(filepath);
    fname = $("#createFile").val();
    //update file in last session end here
    if(remote){
        return ipc.sendSync('saveRemoteFile', data, pathname);
    }else{
        ipc.send('save-data', data, filepath);
    }
}

ipc.on('save', function(event){
    if(editor != undefined){
        let data = editor.getValue();
        saveFile(data, file.path);
    }
});

ipc.on('data-saved',function(event,filepath, data){
    //file.path = filepath;
    file.pathname = 'C:\\Users\\ID918980\\Desktop\\development\\eyegaze';
    file.name = path.basename(filepath);
    //file.name = $("#createFile").val();
    // console.log(file);
    if(file.editor.getValue() == ''){
        file.editor.setValue(data);
        file.editor.refresh();
    }

    // console.log('Hello');
    dotToClose();
})

// change mod automatically

function chagneEditorMode(filename, current_editor){
    // console.log(event,filename);
    var val = filename, m, mode, spec;
    // console.log(val)
    if (m = /.+\.([^.]+)$/.exec(val)) {
        // console.log(m);
        var info = CodeMirror.findModeByExtension(m[1]);
        if (info) {
            mode = info.mode;
            spec = info.mime;
        }
    } else if (/\//.test(val)) {
        var info = CodeMirror.findModeByMIME(val);
        if (info) {
            mode = info.mode;
            spec = val;
        }
    } else {
        mode = spec = val;
    }
    //console.log(spec,mode);
    if (mode && mode != 'untitled') {
        current_editor.setOption("mode", spec);
        CodeMirror.autoLoadMode(current_editor, mode);
        if(fileCreatedFlag==1 && mode=="htmlmixed"){
            current_editor.setValue('<html>\n' +
                '  <head>\n' +
                '    <title>New Title</title>\n' +
                '  </head>\n' +
                '  <body>\n' +
                '\n' +
                '  </body>\n' +
                '</html>');
            current_editor.setCursor(6,0);
        }

        // console.log(editor.getOption('mode'));
        // document.getElementById("modeinfo").textContent = spec;
    } else {
        current_editor.setOption("mode", "text/text");
    }
}

ipc.on('change-mod', function(event, filename){
    chagneEditorMode(filename, editor);
})

// for creating panels

function makePanel(where,file_id,editor) {
    var node = document.createElement("div");
    var widget, close, label;

    node.id = "footer_" + file_id;
    node.className = "footer panel " + where;
    left = node.appendChild(document.createElement("div"));
    left.className = "left";
    label = left.appendChild(document.createElement("span"));
    label.className = 'label';
    label.textContent = "Line : ";
    line = label.appendChild(document.createElement("span"));
    line.id = "line"
    label2 = left.appendChild(document.createElement("span"));
    label2.className = 'label';
    label2.textContent = "Column : ";
    column = label2.appendChild(document.createElement("span"));
    column.id = "column";
    right = node.appendChild(document.createElement("div"));
    right.className = "right";
    label = right.appendChild(document.createElement("span"));
    label.className = "label"
    label.textContent = "Tab Size : " + editor.options.tabSize;
    tabsize = label.appendChild(document.createElement("span"));
    tabsize.id = "tabsize";
    label = right.appendChild(document.createElement("span"));
    label.className = "label";
    label.id = "mode";
    return node;
}
function addPanel(where,editor,file_id) {
    var node = makePanel(where,file_id,editor);
    editor.addPanel(node, {position: where, stable: true});
}
// check where curson is and what is the current mod of editor

setInterval(function(){
    if(editor != undefined){
        line = editor.getCursor().line;
        column = editor.getCursor().ch;
        $('#filename_' + file['id']).html(file.name);
        $('#footer_' + file['id'] ).find('#line').html(line + 1);
        $('#footer_' + file['id'] ).find('#column').html(column + 1);
        // document.getElementById('line').innerHTML = line + 1;
        // document.getElementById('column').innerHTML = column + 1;
        let temp = editor.options.mode.split('/')[1];
        // console.log(temp);
        if(temp != undefined && temp.indexOf('-') > -1){
            temp = temp.split('-')[1];
        }
        $('#footer_' + file['id'] ).find('#mode').html(temp);
        // document.getElementById('mode').innerHTML = temp ;
    }
},100);

// trigger left side-bar

$(".panel-left").resizable({
    handleSelector: ".splitter",
    resizeHeight: false
});


$(".panel-middle").resizable({
    handleSelector: ".splitter2",
    resizeHeight: false
});

// error dialog

ipc.on('error', function(event, message){
    dialog.showErrorBox('Error',message);
});

function isCurrentFileSaved(){
    var data = editor.getValue();
    ipc.send('save-data', data, file.path);
    if(file.path != undefined) return true;
    else return false;
}

// open project structure

function openProjectStructure(call_from_menu = true){
    if($('.panel-left').css('display') == "block"){
        $('.panel-left').css('display','block');
        $('.panel-left').css('width','150px');
        $('.fa-folder-o').addClass('side-nav-button-active');
    }else if($('.panel-left').css('display') == "block" && call_from_menu == false){
        $('.panel-left').css('display','true');
        $('.fa-folder-o').removeClass('side-nav-button-active');
    }
}

ipc.on('openProjectStructure', function(event){
    openProjectStructure();
});

// change dot to close if file has saved
function dotToClose(){
    $('#file_tab_'+file.id).find('.dot').addClass('black');
    $('#file_tab_'+file.id).find('.dot').addClass('close');
    $('#file_tab_'+file.id).find('.dot').removeClass('dot');
}


// change close to do if file not saved
function closeToDot(){
    $('#file_tab_'+file.id).find('.close').removeClass('black');
    $('#file_tab_'+file.id).find('.close').addClass('dot');
    $('#file_tab_'+file.id).find('.close').removeClass('close');
}


// Increase or Decrease font size

ipc.on('increaseFontSize', function(event){
    increaseFontSize();
});

ipc.on('decreaseFontSize', function(event){
    decreaseFontSize();
});

function increaseFontSize(){
    let currentFontSize = parseInt($('.CodeMirror').css('font-size').split('px'));
    // console.log(currentFontSize);
    $('.CodeMirror').css('font-size',++currentFontSize);
    editor.refresh();
}

function decreaseFontSize(){
    let currentFontSize = parseInt($('.CodeMirror').css('font-size').split('px'));
    // console.log(currentFontSize);
    $('.CodeMirror').css('font-size',--currentFontSize);
    editor.refresh();
}

// click on tab

function opentab(tab){
    file = files[$(tab).parent().data('target')];
    editor = file.editor;
    if(editor != undefined){
        // editor.refresh();
        setTimeout(function(){
            editor.refresh();
            editor.focus();
        },1);
    }
}

//var flaginput =0;


function createfilename(){
    flaginput=1;
    //displayKeyboard();
}

let isOpen = false;
let keyboard_area = document.getElementById('keyboard');
let keyboard_btn = document.getElementById('open_keyboard');
let panel_container = document.getElementById('panel-container');

function displayKeyboard(status) {
    if (status!=true) {
        keyboard_area.style.display = 'none';
        panel_container.style.height = '100%';
    }
    else {
        keyboard_area.style.display = 'block';
        //panel_container.style.height = 'calc(100% - 230px)';
    }
    isOpen = !isOpen;
}

var write = editor,
    shift = false,
    displayToggel=0,
    capslock = false;


$('#keyboard input').click(function(e){
    e.preventDefault();
    var $this = $(this),
        character = $this.val(); // If it's a lowercase letter, nothing happens to this variable
    if(localStorage.getItem("filename")){
        var startDate =Date.now();
        var keyboardCommands = localStorage.getItem('pid')+', '+localStorage.getItem('taskNumber')+','+startDate+',Keyboard action,'+character +' \r\n';
        fs.appendFileSync(localStorage.getItem("filename"), keyboardCommands, 'utf-8');
    }
    var doc = editor.getDoc();
    var cursor = doc.getCursor(); // gets the line number in the cursor position
    editor.setCursor(cursor);
    editor.focus();
    // Shift keys
    if ($this.hasClass('left-shift') && displayToggel==0) {

        $('.letter').hide();
        $('.uparrow').hide();
        $('.downarrow').hide();
        $('.rightarrow').hide();
        $('.leftarrow').hide();
        $('.downarrow').hide();
        $('.capslock').hide();
        $('.symbol').show();
        $(".left-shift").val('abc');

        displayToggel=1;
        return false;
        //shift = (shift === true) ? false : true;
    }
    if ($this.hasClass('left-shift') && displayToggel==1) {
        $('.letter').show();
        $('.uparrow').show();
        $('.downarrow').show();
        $('.rightarrow').show();
        $('.leftarrow').show();
        $('.tab').show();
        $('.capslock').show();
        $('.symbol').hide();
        $('.backspace').show();
        $('.delete').show();
        displayToggel=0;
        $(".left-shift").val('?123');
        return false;
        //shift = (shift === true) ? false : true;
    }

    // Caps lock
    if ($this.hasClass('capslock')) {
        $('.letter').toggleClass('uppercase');
        capslock = true;
        return false;
    }

    // Special characters
    if ($this.hasClass('symbol')) character = $this.val();
    if ($this.hasClass('space')) character = ' ';
    if ($this.hasClass('tab')) {

        moveCursor("tab",9, editor.getCursor());
        character ='';
        // var lengthCount = editor.getLine(cursor.line).length;
        // editor.setCursor({line:cursor.line,ch:lengthCount-1});
        editor.focus();
    }
    if($this.hasClass('leftarrow')){
        // const ev = {
        //     type: 'keyLeft',
        //     keyCode: 37 // the keycode for the left arrow key, use any keycode here
        // }
        // character='';
        // editor.triggerOnKeyDown(ev);
        // editor.focus();
        character='';
        editor.execCommand('goCharLeft');
    }
    if($this.hasClass('rightarrow')){
        character='';
        editor.execCommand('goCharRight');
    }
    if($this.hasClass('uparrow')){
        character='';
        editor.execCommand('goLineUp');
        // editor.execCommand('goLineUp');
        // $(".CodeMirror-hints").triggerOnKeyDown({keyCode:38});
    }
    if($this.hasClass('downarrow')){
        character='';
        editor.execCommand('goLineDown');
    }
    if ($this.hasClass('return')){
        character = "\n";
        editor.setCursor(cursor);
        editor.focus();
    }
    if ($this.hasClass('delete')){
        character = '';
        editor.execCommand('delCharAfter');
    }
    // Uppercase letter
    if ($this.hasClass('uppercase')) character = character.toUpperCase();

    // Remove shift once a key is clicked.
    if (shift === true) {
        $('.symbol span').toggle();
        if (capslock === false) $('.letter').toggleClass('uppercase');

        shift = false;
    }
    var line = doc.getLine(cursor.line); // get the line contents
    if ($this.hasClass('backspace'))  {
        let pptr = {line: cursor.line, ch: cursor.ch};
        if (pptr.ch === 0) {
            if (pptr.line > 0) {
                pptr.line--;
                let prev_line = doc.getLine(pptr.line);
                pptr.ch = prev_line.length;
            }
        } else {
            pptr.ch--;
        }
        doc.replaceRange('', pptr, cursor);
    } else {

        doc.replaceRange(character, cursor);
    }
});
