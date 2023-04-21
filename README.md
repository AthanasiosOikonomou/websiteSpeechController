# Website Speech Controller
WebsiteSpeechController.js is an automated script that adds speech control capabilities to the website that includes it. It is based at [web speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) so that there is not need for additional software installation at PC or device and allows people with disabilities to navigate at any web content through simple speech commands. 

It detects automatically all the DOM elements and supports out of the box simple and natural voice commands. The main idea is to use it without the user be limited by specific commands. 

Examples of commands are: "scroll down", "scroll up", "repeat", "again", "more", "click button XXX", "open page XXX", "click tab XXX", "play video", "pause video", "play again" and many more.

When the javascript script is included in a website a small microphone icon is appeared in the upper right corner. In order to be activated/deactivated the user must click it.  For security reasons, this activation/deactivation affects only the selected page and not all the pages of the website. For example, "www.website.com/index.html" and "www.website.com/about.html" need different activation/deactivation.  

Demo available at [link](https://athanoiko.github.io/websiteSpeechController/demo).

# How to use it
Include at the end of the html file that you want to activate the speech recognition the following code. Web speech controller uses [jquery](https://jquery.com/) in order to identify the DOM elements and the eventsimulation.js library in order to simulate all the user's keyboard and mouse behavior. 

```html
<script src=".../jquery.js"></script>
<script src=".../eventsimulation.js"></script>
<script src=".../webspeechcontroller.js"></script>
```

In order to use the predefined activation/deactivation widget, [fontawesome](https://fontawesome.com/) must be included in your website.  

# Modification
Modification in the microphone's icon, css style or position can be done by editing webspechcontroller.js lines:

```javascript
var widget_css_style = "style='position: absolute; color: white; \
                                right: 50px; top: 50px; width: 100px; \
                                cursor: pointer; z-index: 99999999;'" 

var $widget_activated = $("<i id='webSpeechWidget' class='fas fa-microphone'" + widget_css_style + "/></i>");
var $widget_deactivated = $("<i id='webSpeechWidget' class='fas fa-microphone-slash'" + widget_css_style + "/></i>");
$('body').append($widget_deactivated);
```

The id of the widget (''webSpeechWidget') must remain the same.
