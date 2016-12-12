/*
* Copyright (c) 2015 Samsung Electronics Co., Ltd.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are
* met:
*
* * Redistributions of source code must retain the above copyright
* notice, this list of conditions and the following disclaimer.
* * Redistributions in binary form must reproduce the above
* copyright notice, this list of conditions and the following disclaimer
* in the documentation and/or other materials provided with the
* distribution.
* * Neither the name of Samsung Electronics Co., Ltd. nor the names of its
* contributors may be used to endorse or promote products derived from
* this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
* "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
* LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
* A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
* OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
* SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
* LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
* DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
* THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
function getBytes(str) 
{
var bytes = [];
  for (var i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;

}
function hexToBase64(str) {
    return getBytes(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

var SAAgent,
    SASocket,
    connectionListener,
    responseTxt = document.getElementById("responseTxt");

/* Make Provider application running in background */
//tizen.application.getCurrentApplication().hide();

function createHTML(log_string)
{
    var content = document.getElementById("toast-content");
    content.innerHTML = log_string;
    tau.openPopup("#toast");
}

function createImg(img)
{
   var content = document.getElementById("1btn-popup");
   
   var child = document.getElementById("toast-content");
   while ( child.hasChildNodes() )
   {
        child.removeChild( child.firstChild );       
   }
   
   content.innerHTML = "스마트폰에 누군가 접근했습니다!!";
   content.appendChild(img);
   tau.openPopup("#1btnPopup");
}

connectionListener = {
    /* Remote peer agent (Consumer) requests a service (Provider) connection */
    onrequest: function (peerAgent) {

        createHTML("peerAgent: peerAgent.appName<br />" +
                    "is requsting Service conncetion...");

        /* Check connecting peer by appName*/
        if (peerAgent.appName === "PYPI") {
            SAAgent.acceptServiceConnectionRequest(peerAgent);
            createHTML("Service connection request accepted.");

        } else {
            SAAgent.rejectServiceConnectionRequest(peerAgent);
            createHTML("Service connection request rejected.");

        }
    },

    /* Connection between Provider and Consumer is established */
    onconnect: function (socket) {
        var onConnectionLost,
            dataOnReceive;

        createHTML("Service connection established");

        /* Obtaining socket */
        SASocket = socket;

        onConnectionLost = function onConnectionLost (reason) {
            createHTML("Service Connection disconnected due to following reason:<br />" + reason);
        };

        /* Inform when connection would get lost */
        SASocket.setSocketStatusListener(onConnectionLost);

        dataOnReceive =  function dataOnReceive (channelId, data) {
        	
        	var newData;
            var separator = "-";

            if (!SAAgent.channelIds[0]) {
                createHTML("Something goes wrong...NO CHANNEL ID!");
                return;
            }
            
            if ( data.indexOf(separator) !== -1 ) 
            	newData = data.split(separator);
            
            switch( newData[0] ){
            	
            // 	lock manage
            case '1': 
        	{
            	switch( newData[1] ){
            	case '1':
            		
            		if ( newData[2] === '1') // lockactivation btn state changed
            			document.getElementById("lockActivation").checked = true;
            		else
            			document.getElementById("lockActivation").checked = false;
            		
            		break;
            		
            	case '2':	
            		// password changed ; android to tizen 의 상황에선 발생하지 않음
            		break;
            		
            	case '3':	// receive capture img when someone's touch
                	var img = document.createElement('img');
                	img.src = 'data:image/jpeg;base64,' + newData[2];
                	createImg(img);
            		break;
            	}
            	
            	break;
        	}
            	
        	// app manage
            case '2': 
            {
            	var inner = "<div class=\"ui-toggleswitch\"> " +
            					"<input type=\"checkbox\" class=\"ui-switch-input\" id=\"appActivation\" onchange=\"appToggleAction(this.id)\">" +
            					"<div class=\"ui-switch-button\"></div>" +
							"</div>"
            			
				var label = document.getElementById("app-label");
            	
            	if( newData[1] === '1' ){
            		if ( newData[2] === '1') // appactivation btn state changed
            		{
            		    label.innerHTML = "Public" + inner;
            		    document.getElementById("appActivation").checked = true;
            		}
            		else
        			{
            			label.innerHTML = "Private" + inner;
            			document.getElementById("appActivation").checked = false;
        			}
            		
            		break;
            	}
        	}
            	break;
            	
        	// account manage
            case '3': 
        	{
            	var obj;
            	var jsonData = '{"accounts":' + newData[1] + '}';
            	obj = JSON.parse(jsonData);

            	var	parent = document.getElementById("account-content"),
            		elmUL = document.createElement("ul"),
            		elmRow;
				            	
            	while ( parent.hasChildNodes() ){
            		parent.removeChild( parent.firstChild );
            	}
            		       

            	elmUL.className = "ui-listview";
            	elmUL.id = "account-list";
            	parent.appendChild(elmUL);
            	
            	for( var i = 0; i < obj.accounts.length; i++ )
        		{
                	var TITLE = obj.accounts[i].TITLE;
                	var ACCOUNT = obj.accounts[i].ACCOUNT;
                	var PASSWORD = obj.accounts[i].PASSWORD;
                	
                	elmRow = document.createElement("li");
                	elmRow.className = "li-has-multiline li-has-2line-sub";
                	elmRow.innerHTML = '<a>' +	TITLE +
						'<span class="ui-li-sub-text li-text-sub"> ID : ' + ACCOUNT + '</span>' +
						'<span class="ui-li-sub-text li-text-sub"> PW : ' + PASSWORD + '</span>' + '</a>' + '</li>';
                	elmUL.appendChild(elmRow);
        		}
            	
        	}
        	break;
            	
            // missing manage
            case '4': {
            	if( newData[1] === '1' ){
            		if ( newData[2] === '1') // missingactivation btn state changed
            			document.getElementById("missingActivation").checked = true;
            		
            		else
            			document.getElementById("missingActivation").checked = false;
            		
            		break;
            	}
            }
            
            	break;
            	
            default:
            	break;
            }
            
            SASocket.sendData(SAAgent.channelIds[0], "gear received!");
            /*
             * newData = "gear " + data;

            // Send new data to Consumer 
            SASocket.sendData(SAAgent.channelIds[0], newData);
            createHTML("Send massage:<br />" +
                        newData);
                        */
        };

        /* Set listener for incoming data from Consumer */
        SASocket.setDataReceiveListener(dataOnReceive);
    },
    onerror: function (errorCode) {
        createHTML("Service connection error<br />errorCode: " + errorCode);
    }
};

function requestOnSuccess (agents) {
    var i = 0;

    for (i; i < agents.length; i += 1) {
        if (agents[i].role === "PROVIDER") {
            createHTML("Service Provider found!<br />" +
                        "Name: " +  agents[i].name);
            SAAgent = agents[i];
            break;
        }
    }

    /* Set listener for upcoming connection from Consumer */
    SAAgent.setServiceConnectionListener(connectionListener);
};

function requestOnError (e) {
    createHTML("requestSAAgent Error" +
                "Error name : " + e.name + "<br />" +
                "Error message : " + e.message);
};

/* Requests the SAAgent specified in the Accessory Service Profile */
webapis.sa.requestSAAgent(requestOnSuccess, requestOnError);


(function () {
    /* Basic Gear gesture & buttons handler */
    window.addEventListener('tizenhwkey', function(ev) {
        var page,
            pageid;

        if (ev.keyName === "back") {
            page = document.getElementsByClassName('ui-page-active')[0];
            pageid = page ? page.id : "";
            if (pageid === "main") {
                try {
                    tizen.application.getCurrentApplication().exit();
                } catch (ignore) {
                }
            } else {
                window.history.back();
            }
        }
    });
}());

(function(tau) {
    var toastPopup = document.getElementById('toast');

    toastPopup.addEventListener('popupshow', function(ev){
        setTimeout(function () {
            tau.closePopup();
        }, 3000);
    }, false);
})(window.tau);

/* lock manage - send */
function lockToggleAction(id){
	
	var data;
	var byteData = [];

	if(document.getElementById(id).checked) {
		data = '1-1-1';
		alter("잠금 설정을 활성화 되었습니다.");
	}
	else{
		data = '1-1-2';
		alter("잠금 설정을 해제합니다.");
	}
	
	SASocket.sendData(SAAgent.channelIds[0], data );
}

/* app manage - send */
function appToggleAction(id){
	
	var data;
	var byteData = [];

	if(document.getElementById(id).checked) {
		data = '2-1-1';
		alter("Public모드로 전환합니다.");
	}
	else{
		data = '2-1-2';
		alter("Private모드로 전환합니다.");
	}
	
	SASocket.sendData(SAAgent.channelIds[0], data );
}

/* missing manage - send */
function missingToggleAction(id){
	document.getElementById(id).checked = !document.getElementById(id).checked;
}

document.getElementById('2btnPopup-ok').addEventListener('click', function(ev){
	var data = '4-2-2'
	SASocket.sendData(SAAgent.channelIds[0], data );
});
	

