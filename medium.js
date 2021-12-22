var supportMsg = document.getElementById('msg');
var speechSynthesis = window.SpeechSynthesis || window.webkitSpeechSynthesis;
var recognition = new webkitSpeechRecognition();
var utterence = "";
//Depreciated functions
var speechMsgInput = document.getElementById('speech-msg');
var witText = document.getElementById('speech-msg');
var button = document.getElementById('speak');
var errorMsg = "";
var errorLineNumber = "";
var errors = Array;
var cleanReason = "";
var participantId = "";
var taskId = "";
const tasks = [1,2,3,4,5];
var taskTimeLog = new Array();
var timeStamp =""
var recording = 0;
var recognizing = false;
var codeSample = `//**Code snip-its will appear here...**`

var exampleCode = `//Example
  console.log("Example: Hello, World!");;`

var code01 = `//Task 1
  console.log("Task 1: Hello, World!";`

var code02 = `//Task 2
  console.log"Task 2: Hello, World!");`

var code03 = `//Task 3
  console.log("Task 3 Hello, World!");`

var code04 = `//Task 4
  console.log("Task 4:: Hello, World!");`

var code05 = `//Task 5
  function helloWorld(){
  alert("Hello, World!");
  console.log("Hello, World!");;
  name = prompt("What is your name?")
  alert("Hello, " + name + "!");
  console.log("Hello, " + name + "!";
}`

var endCode = `//**End of tasks**`

var extendedErrorMsg = "";
const linter = new Vue({
    data: () => ({
        value: codeSample
    }),

    mounted: function() {
        this.editor = new CodeMirror(this.$refs.codemirror, {
            lineNumbers: true,
            tabSize: 2,
            value: this.value,
            mode: "javascript",
            theme: "monokai",
            gutters: ["CodeMirror-lint-markers"],
            lint: false
        });

    },

    template: `
      <div>
        <div ref="codemirror"></div>
      </div>
    `
});

function example(){
    document.getElementById("exampleBtn").blur();
    taskId = 'Example';
    linter.editor.getDoc().setValue(exampleCode);
    reset();
    manageTimer();
}


function next(){
    document.getElementById("nextBtn").blur();
    var currentTasks = Array;
    currentTasks = tasks
    console.log(currentTasks);

    const random = Math.floor(Math.random() * currentTasks.length);
    let selectedTask = currentTasks[random];
    console.log(selectedTask);

    _.remove(currentTasks, function(e) {
        return e === selectedTask;
    });
    console.log(currentTasks);

    codeId = selectedTask;
    console.log(codeId);

    //console.log(codeId);
    if (codeId == undefined) {
        linter.editor.getDoc().setValue(endCode);
        //blob(taskTimeLog);
    } else {
        switch (codeId){
            case 1:
                taskId = 'Task 1';
                linter.editor.getDoc().setValue(code01);
                reset();
                manageTimer();
                break;

            case 2:
                taskId = 'Task 2';
                linter.editor.getDoc().setValue(code02);
                reset()
                manageTimer();
                break;

            case 3:
                taskId = 'Task 3';
                linter.editor.getDoc().setValue(code03);
                reset()
                manageTimer();
                break;

            case 4:
                taskId = 'Task 4';
                linter.editor.getDoc().setValue(code04);
                reset()
                manageTimer();
                break;

            case 5:
                taskId = 'Task 5';
                linter.editor.getDoc().setValue(code05);
                reset()
                manageTimer();
                break;


        }//end switch
    }//end else

}//end then

function reset(){
    linter.value = linter.editor.getValue();
    linter.editor.clearGutter('error');
    linter.editor.setOption("lint",false);
    utterence = "";
    document.getElementById('speech-msg').value = 'Voice capture input...';
    reloadErrors();
}

function reloadErrors(){
    JSHINT(linter.value);
    errors = Array.isArray(JSHINT.errors) ? JSHINT.errors : [];
    linter.editor.on('changes', () => {
        linter.value = linter.editor.getValue();
        JSHINT(linter.value);
        errors = Array.isArray(JSHINT.errors) ? JSHINT.errors : [];
    });


}

linter.$mount('#my-linter');

if ('speechSynthesis' in window) {
    supportMsg.innerHTML = '<span class="ok">&#x2611;</span> Your browser <strong>supports</strong> speech synthesis.';
} else {
    supportMsg.innerHTML = '<span class="notok">&#x2612;</span> Sorry your browser <strong>does not support</strong> speech synthesis.';
    supportMsg.classList.add('not-supported');
}

function stopRec(){
    recognition.stop();
    recognition.stop();
    recognition.stop();
}
document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
        window.scrollTo(0, 0);
        console.log('Space pressed');
        if(recording == 1){
            console.log('stop record');
            //queryWit();
            recording = 0;
        }else{
            if(recording == 0) {
                console.log('start record')
                recognition.start();
                record();
                recording = 1;
            }
        }
    }
});

function record(){

    var final_transcript;
    recognition.continuous = true;
    recognition.lang = "en-GB";
    recognition.interimResults = true;

    recognition.onstart = function () {
        recognizing = true;
    },
        recognition.onend = function () {
            recognizing = false;
            if (!final_transcript) {
                return;
            }

        },

        recognition.onresult = function(event) {
            document.getElementById('speech-msg').value = event.results[0][0].transcript;


            final_transcript = '';
            var interim_transcript = '';
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = final_transcript;

        }
    //utterence = event.results[0][0].transcript;
    utterence = final_transcript;
    recording=0;

    //word to numberals...***!!!
    if (utterence.match(/one/g)){
        var remWordNum = utterence.replace(/[one]/g, '1');
        console.log('record: ' + utterence);
    }else{
        console.log('record: ' + utterence);
    }//End else
    queryWit();
    //recognition.start();

}
function speak(text) {
    var msg = new window.SpeechSynthesisUtterance();
    msg.text = text;
    window.speechSynthesis.speak(msg);
}

function talk(property) {
    //console.log(document.getElementById(property).value)
    textToSpeak = document.getElementById(property).value;
    if (textToSpeak.length > 0) {
        speak(textToSpeak);  }
}

function queryWit() {
    //recognition.stop();
    reloadErrors();


    console.log('querywit: ' + utterence);

    const ACCESS_TOKEN = '';
    return fetch(
        `https://api.wit.ai/message?q=${utterence}`,
        {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        }).then(res => res.json())
        .then((data) => {
            const responseArray = data.entities

            if (!data.intents[0]){
                textToSpeak = ("I'm sorry, I didn't understand that, please phrase your instruction in a different way")
                speak(textToSpeak); //sends error msg to speach function
                throw "Undefinded Intents";

            } else {
                switch (data.intents[0].name){
                    case 'confirmRequest':
                        console.log('confirmRequest:');
                        break;

                    case 'describeError':
                        reloadErrors()

                        if (utterence.match(/\d+/g) == null){
                            console.log('no line number given!');
                            textToSpeak = ("I'm sorry, I didn't understand that, please state the line number of the error you want me to describe")
                            speak(textToSpeak); //sends error msg to speach function
                        }else{
                            if (typeof errors[0] == 'undefined'){
                                console.log('no errors found! [Discribe]');
                                pauseTimer();
                                textToSpeak = ("There are no errors found in this code");
                                speak(textToSpeak); //sends error msg to speach function

                            } else {
                                // capture the error line number from the utterence
                                descErrLN = utterence.match(/\d+/g).map(n => parseInt(n));
                                console.log('errorLineNumber: ' + descErrLN);

                                // capture the error description
                                errorLineNumber = parseInt(descErrLN);
                                let selectedError = errors.find(error => error.line === errorLineNumber);
                                console.log('selectedError line Number: '+ selectedError.reason);

                                // capture the error ID code
                                //console.log(JSHINT.data());
                                let errorId = selectedError.code
                                console.log('error code :'+ errorId);
                                altErrorMsg(errorId)

                                if (typeof selectedError == 'undefined'){
                                    console.log('no errors found on this line!');
                                    pauseTimer();
                                    textToSpeak = ("There are no errors found on line number" + descErrLN);
                                    speak(textToSpeak); //sends error msg to speach function

                                } else {
                                    if(extendedErrorMsg == 'null'){
                                        console.log('Std error msg');

                                        errorMsg = selectedError.reason;
                                        console.log(selectedError.reason);
                                        var removeChars = errorMsg.replace(/[)]/g, 'bracket');
                                        removeChars = removeChars.replace(/[(]/g, 'bracket');
                                        removeChars = removeChars.replace(/[;]/g, 'semi colon');
                                        //console.log(removeChars);
                                        errorMsg = removeChars;
                                        console.log(errorMsg);
                                        //sends contents of errorMsg to speach function
                                        speak(errorMsg);

                                    } else {
                                        console.log('Alt error msg');
                                        speak(extendedErrorMsg);


                                    }//end else
                                }//end else
                            }//end else
                        }//end else
                        break;

                    case 'gotoLineNumber':
                        console.log('gotoLineNumber');
                        if (utterence.match(/\d+/g) == null){
                            console.log('error catch!');
                            textToSpeak = ("I'm sorry, I didn't understand that, please phrase your instruction in a different way")
                            speak(textToSpeak); //sends error msg to speach function
                        }else{
                            console.log (utterence);
                            let gotoErrLN = utterence.match(/\d+/g).map(n => parseInt(n));
                            goToLine(gotoErrLN);
                            textToSpeak = ("cursor is now at line number" + gotoErrLN)
                            speak(textToSpeak); //sends error msg to speach function
                            //grabs line number from utterance (witText.value)
                        }//end else
                        break;

                    case 'highlightError':
                        console.log('highlightError:');
                        reloadErrors()
                        if (typeof errors[0] == 'undefined'){
                            pauseTimer();
                            console.log('no errors found! [Highlight]');
                            textToSpeak = ("There are no errors found in this code")
                            speak(textToSpeak); //sends error msg to speach function

                        } else {
                            linter.editor.setOption("lint",true);

                            textToSpeak = ("Any errors in the code, have been highlighted, by icons next to the line numbers");
                            speak(textToSpeak); //sends error msg to speach function
                        }//end else
                        break;

                }//end switch
            }//end else

        })//end else
        .catch(console.error);
}

function altErrorMsg(errorId){
    console.log('altErrorMsg errorId :' + errorId);
    record();

    let modeValue = document.getElementById('mode').value
    console.log('mode value :' + modeValue);

    if (modeValue == 2){
        switch (errorId){
            case 'W032':
                extendedErrorMsg = (errorMsg + ' remove the semicolon');
                break;

            case 'W033':
                extendedErrorMsg = (errorMsg + ' add a semicolon');
                break;

            case 'E021':
                extendedErrorMsg = (errorMsg + ' add a bracket');
                break;
        }
    }else{
        if (modeValue == 3){
            switch (errorId){
                case 'W032':
                    extendedErrorMsg = ('Go to line number ' + errorLineNumber + ' and then,  locate and delete  the second semicolon');
                    break;

                case 'W033':
                    extendedErrorMsg = ('Go to line number ' + errorLineNumber + ' and then,  at the end of the line,  inset a semicolon');
                    break;

                case 'E021':
                    extendedErrorMsg = ('Go to line number ' + errorLineNumber + ' and then,  at the end of the line, add a righthand bracket before the semicolon');
                    break;
            }

        }else{
            console.log('altErrorMsg not required');
            extendedErrorMsg = ('null');
        }//end else


    }//end else

}
function goToLine(data){
    console.log('gotoLineFunction: ' + data);
    //let lineNumber = witText.value.

    linter.editor.setCursor({line:data-1,});
    //leave the 'ch' field of a position as null/undefined to indicate the end of the line.
    linter.editor.focus();
}
function manageTimer() {
    resetTimer();
    startTimer();

}

//const timer = document.querySelector('#time');
//const start_btn = document.querySelector('#start_btn');
//const pause_btn = document.querySelector('#pause_btn');
//const reset_btn = document.querySelector('#reset_btn');

let time = 0,
    interval;

function showTime() {
    record();
    time += 1;
//timer.innerHTML = toHHMMSS(time);
}

function startTimer() {

    interval = setInterval(showTime, 1000);
//hideBtn([start_btn]);
//showBtn([pause_btn, reset_btn]);
}

function pauseTimer() {
    logTaskTime();
    if (interval) {
        clearInterval(interval);
        interval = null;
        //pause_btn.innerHTML = 'RESUME';
    } else {
        interval = setInterval(showTime, 1000);
        //pause_btn.innerHTML = 'PAUSE';
    }
}

function resetTimer() {
    clearInterval(interval);
    interval = null;
//pause_btn.innerHTML = 'PAUSE';
    time = 0;
//timer.innerHTML = toHHMMSS(time);
//hideBtn([pause_btn, reset_btn]);
//showBtn([start_btn]);
}

function toHHMMSS(time) {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - hours * 3600) / 60);
    let seconds = time - hours * 3600 - minutes * 60;

    hours = `${hours}`.padStart(2, '0');
    minutes = `${minutes}`.padStart(2, '0');
    seconds = `${seconds}`.padStart(2, '0');

    return hours + ':' + minutes + ':' + seconds;
}

function showBtn(btnArr) {
    btnArr.forEach((btn) => (btn.style.display = 'inline-block'));
}
function hideBtn(btnArr) {
    btnArr.forEach((btn) => (btn.style.display = 'none'));
}

function logTaskTime() {
    time = toHHMMSS(time);
    console.log('logTaskTime' + time)
    participantId = document.getElementById('participant-id').value;
    timeStamp = participantId + ',' + taskId + ',' + 'Time: ' + time;
    console.log(timeStamp);
    taskTimeLog.push(timeStamp);
    console.log(taskTimeLog);
    time = 0;
//timer.innerHTML = toHHMMSS(time);

}

function blob(data) {
    var blob = new Blob(data, {type: "text/plain;charset=utf-8"});
    saveAs(blob, "testdata.txt");
}
