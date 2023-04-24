var widget_css_style = "style='position: absolute; color: white; \
                                right: 50px; top: 50px; width: 100px; \
                                cursor: pointer; z-index: 99999999;'" 

var $widget_activated = $("<i id='webSpeechWidget' class='fas fa-microphone'" + widget_css_style + "/></i>");
var $widget_deactivated = $("<i id='webSpeechWidget' class='fas fa-microphone-slash'" + widget_css_style + "/></i>");
$('body').append($widget_deactivated);

var debug = true;
var nextVideo = 0;
var activated = false;
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var context;
var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition;
var dictating = false;
var dictatingElement = null;
var thress = 0.78;
var toArray = Array.prototype.slice;
var placeholder = '';
var elements = [];
var recognizing = false;
var elements = [];
var elementsStr = "elements,";
var dictating = false;
var dictelem = null;
var scrolltemp = "";

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function jaro_distance(s1, s2) {
    // If the strings are equal
    if (s1 == s2)
        return 1.0;

    // Length of two strings
    let len1 = s1.length, len2 = s2.length;

    if (len1 == 0 || len2 == 0)
        return 0.0;

    // Maximum distance upto which matching
    // is allowed
    let max_dist = Math.floor(Math.max(len1, len2) / 2) - 1;

    // Count of matches
    let match = 0;

    // Hash for matches
    let hash_s1 = new Array(s1.length);
    hash_s1.fill(0);
    let hash_s2 = new Array(s2.length);
    hash_s2.fill(0);

    // Traverse through the first string
    for (let i = 0; i < len1; i++) {

        // Check if there is any matches
        for (let j = Math.max(0, i - max_dist);
            j < Math.min(len2, i + max_dist + 1); j++)

            // If there is a match
            if (s1[i] == s2[j] &&
                hash_s2[j] == 0) {
                hash_s1[i] = 1;
                hash_s2[j] = 1;
                match++;
                break;
            }
    }

    // If there is no match
    if (match == 0)
        return 0.0;

    // Number of transpositions
    let t = 0;

    let point = 0;

    for (let i = 0; i < len1; i++)
        if (hash_s1[i] == 1) {

            // Find the next matched character
            // in second string
            while (hash_s2[point] == 0)
                point++;

            if (s1[i] != s2[point++])
                t++;
        }
    t /= 2;

    // Return the Jaro Similarity
    return ((match) / (len1)
        + (match) / (len2)
        + (match - t) / (match))
        / 3.0;
}

// Jaro Winkler Similarity
function distance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    let jaro_dist = jaro_distance(s1, s2);

    // If the jaro Similarity is above a threshold
    if (jaro_dist > 0.7) {

        // Find the length of common prefix
        let prefix = 0;

        for (let i = 0; i < Math.min(s1.length, s2.length); i++) {

            // If the characters match
            if (s1[i] == s2[i])
                prefix++;

            // Else break
            else
                break;
        }

        // Maximum of 4 characters are allowed in prefix
        prefix = Math.min(4, prefix);

        // Calculate jaro winkler Similarity
        jaro_dist += 0.1 * prefix * (1 - jaro_dist);
    }
    return jaro_dist.toFixed(6);
}

function simevent(action) {
    var temp = action.split(":");
    var elementType = temp[0];
    var elementName = temp[1];
    switch (elementType) {
        case "back":
            window.history.back();
            if (debug) console.log('back')
            break;
        case "refresh":
            window.location = window.location;
            if (debug) console.log('refresh')
            break;
        case "forward":
            window.history.forward();
            if (debug) console.log('forward')
            break;
        case "button":
            $('button').each(function(i, e) {
                if ($(this).text().toLowerCase() == elementName) {
                    $(this).simulate('click');
                    $(this).click();
                    $(this).trigger('click');
                    return false;
                }
            });
            break;
        case "option":
            $('option').each(function(i, e) {
                if ($(this).text().toLowerCase() == elementName) {
                    $(this).parent().val($(this).attr('value'));
                    $(this).parent().blur();
                    return false;
                }
            });
            break;
        case "a":
            $('a').each(function(i, e) {
                if ($(this).text().toLowerCase() == elementName) {
                    $(this).simulate('click');
                    $(this).click();
                    $(this).trigger('click');
                    return false;
                }
            });
            break;
        case "dictating":

            $('input,textarea').each(function(i, e) {
                if ($(this).attr('id').toLowerCase() == elementName) {
                    dictelem = $(this);
                    $(this).simulate('focus');
                    return false;
                }
            });
            var action = temp[2];
            if (action === "undo")
                $(dictelem).val($(dictelem).val().substring(0, $(dictelem).val().length - lastres.length));
            else if (action === "delete all")
                $(dictelem).val("");
            else if (action === "start") {
                $('body').append($helpdiv);
                setTimeout(function() {
                    $($helpdiv).css({'visibility': "hidden"});
                }, 10000);
            }
            else if (action === "stop") {
                $($helpdiv).css({'visibility': "hidden"});
                $('body').append($infdiv);
                setTimeout(function() {
                    $($infdiv).css({'visibility': "hidden"});
                }, 2000);
            }
            break;
        case "scroll":
            if (elementName === "up") {
                var y = $(window).scrollTop();
                $('html, body').animate({scrollTop: y - 180}, 500);
                scrolltemp = 'up';
            }
            else if (elementName === "more") {
                if (scrolltemp === "up") {
                    var y = $(window).scrollTop();
                    $('html, body').animate({scrollTop: y - 180}, 500);
                }
                else if (scrolltemp === "down") {
                    var y = $(window).scrollTop();
                    $('html, body').animate({scrollTop: y + 180}, 500);
                }
            }
            else if (elementName === "top") {
                var y = $(window).scrollTop();
                $('html, body').animate({scrollTop: y - document.documentElement.scrollHeight}, 500);
            }
            else if (elementName === "bottom") {
                var y = $(window).scrollTop();
                $('html, body').animate({scrollTop: y + document.documentElement.scrollHeight}, 500);
            }
            else {
                var y = $(window).scrollTop();
                $('html, body').animate({scrollTop: y + 180}, 500);
                scrolltemp = "down";
            }
            break;
        case "video":
            videoAppearedBufferSrc = [];
            videos = 0;
            $.each(elements, function(index, elem) {
                if ($(elem).is("video") && appear(elem)) {
                    videoAppearedBufferSrc.push($(elem).children("source").attr("src"));
                }
            });
            $.each(elements, function(index, elem) {
                if ($(elem).is("video")) {
                    videos = videos + 1;
                }
            });
            for (i = 0; i < videos; i++) {
                $("video")[i].pause();
            }
            /*
             if (videoAppearedBufferSrc.length <= 1) {
             if (elementName === "play") {
             $("video").filter(function() {
             return appear(this);
             })[0].play();
             }
             else if (elementName === "pause") {
             $("video").filter(function() {
             return appear(this);
             })[0].pause();
             }
             } else {
             // more than 1 videos
             if (elementName === "next") {
             $("video").filter(function() {
             return appear(this);
             })[nextVideo+1].play();
             nextVideo = nextVideo + 1;
             if (nextVideo === videoAppearedBufferSrc.length) {
             nextVideo = 0;
             }
             }
             }*/
            if (elementName === "play") {
                $("#video").filter(function() {
                    return appear(this);
                }).get(nextVideo).play();
            } else if (elementName === "pause") {
                $("#video").filter(function() {
                    return appear(this);
                }).get(nextVideo).pause();
            } else if (elementName === "next") {
                nextVideo = nextVideo + 1;
                $("#video").filter(function() {
                    return appear(this);
                }).get(nextVideo).play();
                if (nextVideo === videoAppearedBufferSrc.length) {
                    nextVideo = 0;
                }
            } else if (elementName === "mute") {
                for (i = 0; i < videos; i++) {
                    $("#video").get(nextVideo).prop("muted", true);
                }
            }
            break;

        default:
            $(elementType).filter(function(index) {
                return $(this).text().toLowerCase() === elementName;
            }).toggleClass('hovered');
            break;
    }
}

function commander(res) {
    if (debug) console.log("Recognized command: " + res);
    if (dictating) {
        if (distance(res, "exit writing") > thress || distance(res, "quit writing") > thress || distance(res, "quit typing") > 0.6 || distance(res, "exit typing") > thress || distance(res, "stop typing") > thress || distance(res, "stop writing") > thress) {
            tosim = "dictating:" + dictatingElement + ":" + "stop";
            dictating = false;
            dictatingElement = "";
        } else if (distance(res, "delete") > thress || distance(res, "undo") > thress) {
            tosim = "dictating:" + dictatingElement + ":" + "undo";
        } else if (distance(res, "delete all") > thress || distance(res, "clear") > thress || distance(res, "undo all") > thress) {
            tosim = "dictating:" + dictatingElement + ":" + "delete all";
        } else {
            lastres = res;
            $(dictelem).val($(dictelem).val() + lastres);
            tosim = ''
        }
    } else {
        tosim = "";
        var found = false;
        $.each(elements, function(index) {
            if (found === false) {
                if (distance($(this).text().toLowerCase(), res) > thress || distance($(this).text(), "choose " + res) > thress || distance($(this).text().toLowerCase(), 'click ' + res) > thress || distance($(this).text().toLowerCase(), "visit " + res) > thress || distance($(this).text(), "go to " + res) > thress) {
                    
                    if (debug) console.log("Execute command: " + $(this).text().toLowerCase());
                    tosim = $(this).prop("tagName").toLowerCase() + ':' + $(this).text().toLowerCase();


                    if ($(this).is("label")) {
                        dictatingElement = $(this).attr("for");
                        if ($('#' + dictatingElement).attr('type') == 'radio' || $('#' + dictatingElement).attr('type') == 'checkbox') {
                            $(this).simulate('click');
                        } else if ($('#' + dictatingElement).is('select')) {
                            $('#' + dictatingElement).simulate('mousedown');
                        } else if ($('#' + dictatingElement).attr('id') == 'datepicker') {
                            $('#datepicker').simulate('focus');
                            datepick = true;
                        } else {
                            tosim = "dictating:" + dictatingElement + ":" + "start";
                            dictating = true;
                        }
                    }
                    found = true;
                }
            }
        });

        if (datepick) {
            if (distance('previous month', res) > thress || distance("last month", res) > thress) {
                $('.ui-datepicker-prev').simulate('click')
            } else if (distance('next month', res) > thress) {
                $('.ui-datepicker-next').simulate('click')
            } else if (distance('previous year', res) > thress || distance("last year", res) > thress) {
                $('.ui-datepicker-month').val(0);
            } else if (distance('next year', res) > thress) {
                $('.ui-datepicker-month').val(0);
            } else if (distance('january', res) > thress) {
                $('.ui-datepicker-month').val(0);
            } else if (distance('february', res) > thress) {
                $('.ui-datepicker-month').val(1);
            } else if (distance('martch', res) > thress) {
                $('.ui-datepicker-month').val(2);
            } else if (distance('april', res) > thress) {
                $('.ui-datepicker-month').val(3);
            } else if (distance('may', res) > thress) {
                $('.ui-datepicker-month').val(4);
            } else if (distance('june', res) > thress) {
                $('.ui-datepicker-month').val(5);
            } else if (distance('july', res) > thress) {
                $('.ui-datepicker-month').val(6);
            } else if (distance('august', res) > thress) {
                $('.ui-datepicker-month').val(7);
            } else if (distance('september', res) > thress) {
                $('.ui-datepicker-month').val(8);
            } else if (distance('october', res) > thress) {
                $('.ui-datepicker-month').val(9);
            } else if (distance('november', res) > thress) {
                $('.ui-datepicker-month').val(10);
            } else if (distance('december', res) > thress) {
                $('.ui-datepicker-month').val(11);
            } else {
                $('.ui-datepicker-calendar a').each(function() {
                    if (distance($(this).text(), res) > 0.8)
                        $(this).simulate('click')
                    return
                })
                $('.ui-datepicker-year option').each(function() {
                    if (distance($(this).text(), res) > 0.9) {
                        $(this).parent().val($(this).attr("value"));
                        return false;
                    }

                })
            }
        }
        if (!tosim) {
            if (distance(res, "start video") > thress || distance(res, "play video") > thress || distance(res, "play the video") > thress || distance(res, "start the video") > thress) {
                tosim = "video:play";
            } else if (distance(res, "play next") > thress || distance(res, "next video") > 0.8 || distance(res, "next") > thress) {
                tosim = "video:next";
            } else if (distance(res, "video pause") > thress || distance(res, "pause video") > 0.8 || distance(res, "stop video") > 0.8 || distance(res, "stop") > thress) {
                tosim = "video:pause";
            } else if (distance(res, "mute") > thress || distance(res, "silence") > thress || distance(res, "quiet") > thress) {
                tosim = "video:mute";
            } else if (distance(res, "scroll down") > thress || distance(res, "go down") > thress)
                tosim = "scroll:down";
            else if (distance(res, "scroll up") > thress || distance(res, "go up") > thress)
                tosim = "scroll:up";
            else if (distance(res, "scroll more") > thress || distance(res, "more") > thress || distance(res, "again") > thress)
                tosim = "scroll:more";
            else if (distance(res, "scroll to bottom") > thress || distance(res, "go to end") > thress || distance(res, "go to bottom") > thress || distance(res, "all the way down") > thress)
                tosim = "scroll:bottom";
            else if (distance(res, "scroll to top") > thress || distance(res, "go to start") > thress || distance(res, "go to top") > thress || distance(res, "all the way up") > thress)
                tosim = "scroll:top";
            else if (distance(res, "refresh") > thress || distance(res, "reload") > thress || distance(res, "reload page") > thress || distance(res, "refresh page") > thress)
                tosim = "refresh:top";
            else if (distance(res, "go back") > 0.7 || distance(res, "last page") > 0.7)
                tosim = "back:top";
            else if (distance(res, "go forward") > thress || distance(res, "forward") > thress || distance(res, "next page") > thress)
                tosim = "forward:top";
        }
    }
    if (debug) console.log("Execute command: " + tosim);
    if (tosim)
        simevent(tosim);
}

function onFail(error) {
    console.log('GetUserMedia regected with error:', error);
}

function onSuccess(stream) {
    var context = new webkitAudioContext();
    var microphoneStreamer = context.createMediaStreamSource(stream);
    rec = new Recorder(microphoneStreamer);
    rec.record();
    var analyser = context.createAnalyser();
    microphoneStreamer.connect(analyser);
    stopkey = setInterval(function() {
        rec.exportWAV(function(blob) {
            ws.send(blob);
            ws.send("send-analyse");

        });
        rec.clear();
    }, 1800);
}

function elementFinder() {
    var targets = ["button", "a", "input", "textarea", "video", 'label', 'option', 'li'];
    $.each(targets, function(index, elem) {
        $(elem).each(function() {
            elements.push($(this));
        });
    });
}

function appear(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();
    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();
    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

document.getElementById("webSpeechWidget").onclick = function() {

    datepick = false;

    if (activated === false) {
        
        context = new AudioContext();
        recognition = new SpeechRecognition();
        activated = true;
        
        //setCookie("webSpeechController", true, 30);
        $('#webSpeechWidget').replaceWith($widget_activated);

        var ws;

        $helpdiv = $('<div style="border: 1px solid rgba(153, 31, 153,0); border-top-left-radius: 8px; border-bottom-left-radius: 8px; top: 110px; right: 0px; background-color: rgb(240, 109, 35); display: block; text-align: center; font-style: normal; font-variant: normal; font-weight: normal; font-size: 16px; line-height: 100%; font-family: Arial, Helvetica, sans-serif; position: fixed; margin: 0px; -webkit-box-shadow: rgba(0, 0, 0, 0.498039) 0px 0px 6px 1px; box-shadow: rgba(0, 0, 0, 0.498039) 0px 0px 6px 1px; z-index: 100000; box-sizing: content-box; visibility: visible;">&nbsp You entered dictating mode!!<p>&nbsp You can exit by saying "exit typing"<p>&nbsp To delete say "delete"</div>');
        $infdiv = $('<div style="border: 1px solid rgba(153, 31, 153,0); border-top-left-radius: 5px; border-bottom-left-radius: 5px; top: 110px; right: 0px; background-color: rgb(240, 109, 35); display: block; text-align: center; font-style: normal; font-variant: normal; font-weight: normal; font-size: 16px; line-height: 100%; font-family: Arial, Helvetica, sans-serif; position: fixed; margin: 0px; -webkit-box-shadow: rgba(0, 0, 0, 0.498039) 0px 0px 6px 1px; box-shadow: rgba(0, 0, 0, 0.498039) 0px 0px 6px 1px; z-index: 100000; box-sizing: content-box; visibility: visible;" id="speechinfo">&nbsp You exited dictating mode!!</div>');

        elementFinder();

        if (recognition) {
            recognition.continuous = true;
            recognition.interim = true;
            recognizing = false;   

            recognition.onresult = function(event) {
                final_transcript = '';
                interim_transcript = '';
                for (var i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final_transcript += event.results[i][0].transcript;
                    } else {
                        interim_transcript += event.results[i][0].transcript;
                    }
                }
                commander(final_transcript.trim());
            };

            recognition.addEventListener("end", () => {
                $('#webSpeechWidget').replaceWith($widget_deactivated);
                activated = false;
              });
            
            recognition.start();
            recognizing = true;

        } else if (navigator.getUserMedia) {
            navigator.getUserMedia({audio: true}, onSuccess, onFail);
        }
        else {
            // getUserMedia not supported
        }
    } else {
        
        $('#webSpeechWidget').replaceWith($widget_deactivated);
        activated = false;

        //setCookie("webSpeechController", false, 30);
        if (recognizing === true) {
            recognizing = false;
            recognition.stop();
        } else {
            navigator.getUserMedia({audio: false}, onSuccess, onFail);
        }
    }
};