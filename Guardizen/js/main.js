/*// ---------------- 5/24(일) 통합과정 ----------------------
var startTime;
var checkTime;
var u_uuid = "5BCE9431-6C75-32AB-AFE0-2EC108A30860";
var sendToServerArray = new Array( 200 );
var sendToServerArray_i=0;
var sendToServerFlag = 0;
var successMac = new Array();
var successMac_i=0;


 * //Import other JS File. function loadScript(url, callback) { var script =
 * document.createElement('script'); script.src = url; script.onload = callback;
 * document.getElementsByTagName('head')[0].appendChild(script); } var myloaded =
 * function() { document.write(str); // hello 출력됨 }
 * loadScript('import_hello.js', myloaded);
 

// Initialize function
var init = function() {
	// TODO:: Do your initialization job
	console.log("init() called");

	powerOn();

	// add eventListener for tizenhwkey
	document.addEventListener('tizenhwkey', function(e) {
		if (e.keyName == "back") {
			try {
				tizen.application.getCurrentApplication().exit();
			} catch (error) {
				console.error("getCurrentApplication(): " + error.message);
			}
		}
	});
};

// window.onload can work without <body onload="">
window.onload = init;
(function() {
	window
			.addEventListener(
					'tizenhwkey',
					function(ev) {
						if (ev.keyName == "back") {
							var page = document
									.getElementsByClassName('ui-page-active')[0], pageid = page ? page.id
									: "";
							if (pageid === "main") {
								try {
									tizen.application.getCurrentApplication()
											.exit();
								} catch (ignore) {
								}
							} else {
								window.history.back();
							}
						}
					});
}());

// Bluetooth code
var adapter = tizen.bluetooth.getDefaultAdapter();
var bluetoothSwitchAppControl = new tizen.ApplicationControl(
		"http://tizen.org/appcontrol/operation/edit", null,
		"application/x-bluetooth-on-off");
var u = 0;
var devices_length = 0;
var devices_length2 = 0;
var devices_address;
var devices_address_for_balzee;
var balzeeflag = 0;
var reportFlag = 0;
var discoveryFlag = 0;
var wasReport = 0;
var storeMacArray;  // 서버로부터 받아온 전자발찌 MAC 주소 리스트 배열

function onBondingSuccess(device) {
	console.log("Device Name:" + device.name);
	console.log("Device Address:" + device.address);
	console.log("Device Service UUIDs:" + device.uuids.join("\n"));
}

function bluetoothClick() {
	u=0;
	if (discoveryFlag == 1 && reportFlag == 0) {
		wasReport = 1;
		reportFlag = 1;
		discoveryFlag = 0;
	} else if (discoveryFlag == 1 && reportFlag == 1) {
		discoveryFlag = 0;
	} else {
		startDiscovery();
	}

}
function changeFlag() {
	alert("test clicked");
	if (discoveryFlag == 0) {
		alert("button flag = 0");
		discoveryFlag = 1;
		adapter.setName("Guardizen", startDiscovery2, function() {
			alert("Error");
		});

	} else if (discoveryFlag == 1) {
		discoveryFlag = 0;
	}
}

function onBondingSuccessCallback(device) {
	var uuids = device.uuids;
	// alert(uuids);
	if (devices_length != u) {
		// alert("Now find " + (u+1) + " / " + devices_length);
		document.getElementById("menu").innerHTML += "Start to connect : "
				+ devices_address[u] + "<br>";
		// alert("start onBondingSuccessCallback before if u:"+u);
		if (device.deviceClass.major == tizen.bluetooth.deviceMajor.COMPUTER) {
			// Shows computer icon for this device
			// alert("Device is computer");
			document.getElementById("menu").innerHTML += "Device is computer. find next.<br><br>";
			// alert("onBondingSuccessCallback computer u : "+u);

			adapter.getDevice(devices_address[++u], onBondingSuccessCallback,
					function(e) {
						console.log("Fail : " + e);
					});
		} else if (device.deviceClass.major == tizen.bluetooth.deviceMajor.PHONE) {
			// Shows phone icon
			// alert("Device is a Phone");

			// alert("A bonding is created - name: " + device.name +
			// device.address);
			if (uuids.indexOf(u_uuid) != -1) {
				device.connectToServiceByUUID(u_uuid, function(socket, error) {
					// alert("socket connected");
					// alert("onBondingSuccessCallback phone u : "+u);
					onSocketConnected(socket);
					// alert("good");
				}, function(socket, error) {
					// alert("error : " + error.message);
					
					console.log("Error while connecting: " + error.message);
					// alert("onBondingSuccessCallback error u : "+u);

					socket.onclose = function() {
						// alert("Bonding socket Close");
						console.log("Socket closed with " + socket.peer.name);
					};

					if (devices_length != ++u) {
						// alert("onBondingSuccessCallback error reconnected u :
						// "+u);
						adapter.getDevice(devices_address[u],
								onBondingSuccessCallback, function(e) {
									console.log("Fail : " + e);
								});
					}
				});
			} else {
				adapter.getDevice(devices_address[++u],
						onBondingSuccessCallback, function(e) {
							console.log("Fail : " + e);
						});
			}

			// alert("start FRCOMM");
			// adapter.registerRFCOMMServiceByUUID("5BCE9431-6C75-32AB-AFE0-2EC108A30860",
			// "haha"
			// , chatservicecallback, function(e){
			// alert("errorRFCOMM");
			// });

		} else {
			alert("NOthiNG");
			adapter.getDevice(devices_address[++u], onBondingSuccessCallback,
					function(e) {
						console.log("Fail : " + e);
					});
		}
		// if last, print END
		//alert("device_length: " + devices_length + "u: " + u);
		
		if (devices_length == u){
			//alert(sendToServerArray.toString());
			paycheck2();
			alert("paycheck2");
			document.getElementById("menu").innerHTML += "END";
			if(wasReport == 1){
				discoveryFlag = 1;
				reportFlag = 0;
				adapter.setName("Guardizen", startDiscovery2,
						startDiscovery2);
			}
		}
	}
}

function onSocketConnected(socket) {

	console.log("Opened connection to remote device");
	socket.onmessage = function() {
		// Has got a message from peer, reads it
		 //alert("get message");
		var data = socket.readData();
		var recvmsg = '';
		var msgobj;
		for (var i = 0; i < data.length; i++) {
			recvmsg += String.fromCharCode(data[i]);
		}
		msgobj = JSON.parse(recvmsg);
		 //alert("count : "+msgobj.count+" - x : "+msgobj.x+" - y : "+msgobj.y);
		document.getElementById("menu").innerHTML += recvmsg + "count : "
				+ msgobj.count + " - x : " + msgobj.x + " - y : " + msgobj.y
				+ +"<br><br>";
		sendToServerArray[sendToServerArray_i++] = msgobj.mac;
		sendToServerArray[sendToServerArray_i++] = msgobj.x;
		sendToServerArray[sendToServerArray_i++] = msgobj.y;
		sendToServerArray[sendToServerArray_i++] = msgobj.h;
		sendToServerArray[sendToServerArray_i++] = msgobj.rssi;
		sendToServerFlag++;
		successMac[successMac_i++] = msgobj.mac;
		
		socket.close();
	};

	socket.onclose = function() {
		// alert("onSocketConnected Close");
		console.log("Socket closed with " + socket.peer.name);
		
		//alert("device_length" + devices_length + "u" + u);
		if (devices_length != ++u) {

			// alert("Start to connect : " + devices_address[u]);

			// document.getElementById("menu").innerHTML += "Start to connect :
			// " + devices_address[u] + "<br>";
			adapter.getDevice(devices_address[u], onBondingSuccessCallback,
					function(e) {
						console.log("Fail : " + e);

					});
		} else {
			// if last, print END
			//alert(sendToServerArray.toString());
			paycheck2();
			alert("paycheck2");
			document.getElementById("menu").innerHTML += "END";
			if(wasReport == 1){
				discoveryFlag = 1;
				reportFlag = 0;
				adapter.setName("Guardizen", startDiscovery2,
						startDiscovery2);
			}
			
		}
			
	};

	// Sends data to peer.
	// var textmsg = "Gap";
	var sendTxtmsg = [];
	var textmsg = {
		count : 0,
		call : encodeURIComponent("010-3333-4444")
	};
	textmsg = JSON.stringify(textmsg);

	var sendtextmsg = new Array();
	for (var i = 0; i < textmsg.length; i++) {
		sendTxtmsg[i] = textmsg.charCodeAt(i);
	}
	socket.writeData(sendTxtmsg);

	//document.getElementById("menu").innerHTML += recvmsg + "<br><br>";
	// alert(recvmsg);

	// socket.close();

}

function onErrorCallback(e) {
	alert("Cannot create a bonding, reason: " + e.message);
}

// Bluetooth On
function powerOn() {
	// If adapter is not powered on
	if (!adapter.powered) {
		// Initiates power on
		adapter.setPowered(true, function() {
			console.log("Bluetooth powered on success.");
			showMe();
		}, function(e) {
			console.log("Failed to power on Bluetooth: " + e.message);
		});
	}
}

// Bluetooth visible
function showMe() {
	if (adapter.visible == false) {
		// Shows device
		adapter.setVisible(true, function() {
			console.log("Device is visible to other devices for 3 minutes.");
		}, function(e) {
			console.log("Error: ' + e.message + '(' + e.name + ')");
		});
	} else {
		console.log("Device is already in discoverable mode.");
	}
}

// connecting bluetooth devices name
var discoverDevicesSuccessCallback = {
	ondevicefound : function(device) {
		// alert("Found device - name: " + device.name);
	}
}

// connecting bluetooth devices number
function onGotDevices(devices) {
	alert("The number of known devices: " + devices.length);
}

function startDiscovery() {
	var discoverDevicesSuccessCallback = {
		onstarted : function() {
			console.log("Device discovery started...");
		},
		ondevicefound : function(device) {
			console.log("Found device - name: " + device.name + ", Address: "
					+ device.address);
			// Shows the device to user to check if this is the device user is
			// looking for.
			// For example, add this to list view.
			cancelDiscovery();
		},
		ondevicedisappeared : function(address) {
			console.log("Device disappeared: " + address);
			// Removes from list, as it is no longer valid.
		},
		onfinished : function(devices) {
			console.log("Found Devices");
			document.getElementById("menu").innerHTML = "";

			devices_length = devices.length;
			devices_address = new Array(devices_length);

			// alert(devices[0].RSSI);

			for (var i = 0; i < devices.length; i++) {
				document.getElementById("menu").innerHTML += "Name: "
						+ devices[i].name + ", Address: " + devices[i].address
						+ "<br>";
				devices_address[i] = devices[i].address;
			}
			document.getElementById("menu").innerHTML += "<br>";
			console.log("Total: " + devices.length);
			if (devices.length != 0) {

				
				 * //start search offenders' mac if(typeof(Worker) !==
				 * "undefined"){ var search_offender = new
				 * Worker("./offender.js"); search_offender.onmessage =
				 * function(event){ // get message from worker alert("detect :
				 * "+event.data); } alert("1");
				 * search_offender.postMessage(offender_mac); } else{
				 * alert("Sorry, your browser does not support Web Workers..."); }
				 
				// alert("start bonding");
				adapter.getDevice(devices_address[u], onBondingSuccessCallback,
						function(e) {
							console.log("Fail : " + e);

						});
			}

		}
	};
	// Starts searching for nearby devices, for about 12 sec.
	adapter.discoverDevices(discoverDevicesSuccessCallback, function(e) {
		console.log("Failed to search devices: " + e.message + "(" + e.name
				+ ")");
	});
}

function startDiscovery2() {
	var discoverDevicesSuccessCallback = {
		onstarted : function() {
			
			console.log("Device discovery started...");
		},
		ondevicefound : function(device) {
			console.log("Found device - name: " + device.name + ", Address: "
					+ device.address);
			// Shows the device to user to check if this is the device user is
			// looking for.
			// For example, add this to list view.
			for(var i = 0; i < storeMacArray.length - 1;i++){ // length - 1 해야 모든 값 들어옴
				//alert(device.address.toLowerCase().indexOf(storeMacArray[i].toLowerCase()));
				if(device.address.toLowerCase().trim() == storeMacArray[i].toLowerCase().trim())
					alert("전자발찌 범죄자가 주변에 있습니다");
      	  	}
			cancelDiscovery();
		},
		ondevicedisappeared : function(address) {
			console.log("Device disappeared: " + address);
			// Removes from list, as it is no longer valid.
		},
		onfinished : function(devices) {
			console.log("Found Devices");
			// document.getElementById("menu").innerHTML = "";

			devices_length2 = devices.length;
			devices_address_for_balzee = new Array(devices_length2);
			
			
			var gapgap = "40:B0:FA:5B:BB:42";
			for (var i = 0; i < devices.length; i++) {
				// for(var j=0 ; j<balzee.length; j++){
				// if(devices[i].address == balzee[j]){
				// alert("balzee discover");
				// }
				// }
				// alert(devices[i].address + " - " + gapgap);
				if (devices[i].address == gapgap) {
					balzeeflag++;
				}

			}
			//document.getElementById("menu").innerHTML += "<br>";
			document.getElementById("menu").innerHTML += "1<br>";

			if (discoveryFlag == 0 && reportFlag == 1 ) {
				return startDiscovery();
			} else if (discoveryFlag == 0 && reportFlag == 0 && wasReport == 0) {
				document.getElementById("menu").innerHTML += "전자발찌 자동 감시를 종료합니다.<br>";
				return;
			} else {
				alert("report = "+reportFlag+"discovery = "+discoveryFlag+"wasReport"+wasReport);
				return adapter.setName("Guardizen", startDiscovery2,
						startDiscovery2);
			}

		}
	};
	// Starts searching for nearby devices, for about 12 sec.

	adapter.discoverDevices(discoverDevicesSuccessCallback, function(e) {
		console.log("Failed to search devices: " + e.message + "(" + e.name
				+ ")");
		
	});

}
function setDiscovery() {
	fileCheck();
	if (discoveryFlag == 0) {
		discoveryFlag = 1;
		adapter.setName("Guardizen", startDiscovery2, startDiscovery2);
	} else {
		alert("");
		discoveryFlag = 0;
		wasReport = 0;
	}
}


// 여기서부터 http request
var xhr;
//서버로부터 받은 MAC 주소 리스트 file write - choi
function viewMessage() {
	var data,mac,msgobj;
	
	if (xhr.readyState == 4) {
		if (xhr.status == 200) {
			//alert(xhr.responseText);
			data = xhr.responseText;
			msgobj = JSON.parse(xhr.responseText);
			mac = decodeURIComponent(msgobj.mac);
			document.getElementById("menu").innerHTML += "Offender's MAC address list<br>"
			for (var k = 0; k < msgobj.length; k++) {
				document.getElementById("menu").innerHTML += "mac : "
						+ msgobj[k].mac + "<br>";
			}
			
			var curDir = "/opt/usr/media/Documents/offender";
			var newDir, newFile;
			tizen.filesystem.resolve("documents", function(dir) 
			                         {	
										dir.deleteDirectory(curDir, true, onDelete);
										newDir = dir.createDirectory("offender");
			                            newFile = newDir.createFile("offender_list.txt");
			                            alert("정보가 갱신되었습니다");
			                            newFile.openStream(
			                            "w",
			                            function(fs){
			                            	for (var k = 0; k < msgobj.length; k++) {
			                            		fs.write(msgobj[k].mac + "\n");
			                    			}
			                       
			                            	fs.close();
			                            }, function(e){
			                            	console.log("Error " + e.message);
			                            	alert("error"); 
			                            }, "UTF-8");
			                            
 			                         });

		}
	}
}

//deleteDirectory - choi
function onDelete()
{
   console.log("deletedFile() is successfully done.");
}

//서버 DB로 요청 - choi
function requestDB() {
	var formdata = new FormData();
	formdata.append("post_data", "gapsa");

	xhr = new XMLHttpRequest();
	xhr.onreadystatechange = viewMessage;
	xhr.open("POST", "http://jong1.dothome.co.kr/getOffender.php", true);

	xhr.send(null);
}

//file read Message - choi
function fileCheck(){
	var readMacText;
	tizen.filesystem.resolve("documents", function(dir) 
            {
              file = dir.resolve("offender/offender_list.txt");
              file.openStream(
                    "r", 
                    function(fs) {
                    	  readMacText = fs.read(file.fileSize);  // 파일에서 변수 Text로 저장
                          fs.close();
                          storeMacArray = readMacText.split('\n'); // 배열에 저장
                         
                        }, function(e) {
                          console.log("Error " + e.message);
                        }, "UTF-8");
            });
}

//onreadystatechange - choi
function readState(){
 if(xhr.readyState == 4){
    if(xhr.status == 200){
       alert(xhr.responseText);
    }else{
       document.getElementbyId("menu").innerHTML("인터넷에 연결되어 있지 않습니다. 주변 기기를 통해 전송하겠습니다.");
       sendToBase();
      
    }
 }
}

//서버로 보내기 - choi
function paycheck2(){
	var yourArray = {
		    "call": "01011112222",
		    "base_count" : sendToServerFlag,
		    "base" : [ 
		                { "mac" : sendToServerArray, "x" : "37.2789147", "y" : "127.0338099", "h" : "8", "rssi" : "-77"},
		                { "mac" : "22-33-44-55-66-77", "x" : "37.2789047", "y" : "127.0338099", "h" : "2", "rssi" : "-60"},
		                { "mac" : "33-44-55-66-77-88", "x" : "37.2789240", "y" : "127.0338110", "h" : "7", "rssi" : "-75"}
		             ]
		    "base" : []
		};
	if(sendToServerFlag == 0) {
		alert("주변에 기기들이 존재하지 않습니다");
		return;
	}
	else {
		//var temp = new Array();
		for(var cnt = 0; cnt < sendToServerFlag; cnt++) {
			//yourArray['base'].push(temp);
			yourArray['base'].push({"mac": sendToServerArray[5 * cnt], "x" : sendToServerArray[5 * cnt + 1], "y" : sendToServerArray[5 * cnt + 2],
					"h" : sendToServerArray[5 * cnt + 3], "rssi" : sendToServerArray[5 * cnt + 4]});
		}
	}
	
	alert("서버로보내는 값!!!!:" + yourArray);
	
	var myJsonString = JSON.stringify(yourArray);
	var formdata = new FormData();
	formdata.append("json", myJsonString); 
	xhr = new XMLHttpRequest();
	//xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.onreadystatechange = readState;
	xhr.open("POST", "http://jong1.dothome.co.kr/insert_victim.php", true);
	xhr.send(formdata);
}





function sendToBase(){
	var uu = (Math.floor(Math.random()*100) % successMac.length);
	 adapter.getDevice(successMac[uu], onBondingSuccessCallback_tagogagi,
				function(e) {
					console.log("Fail Tagogagi: " + e);
				});
}


function onSocketConnected_tagogagi(socket) {
	socket.onmessage = function() {
		// Has got a message from peer, reads it
		 //alert("get message");
		var data = socket.readData();
		var recvmsg = '';
		var msgobj;
		for (var i = 0; i < data.length; i++) {
			recvmsg += String.fromCharCode(data[i]);
		}
		msgobj = JSON.parse(recvmsg);

		if(msgobj.count == -2){
			alert("success");
		}
		else{
			alert("fail");
		}
		
		socket.close();
	};

	socket.onclose = function() {
		// alert("onSocketConnected Close");
		console.log("Socket closed with " + socket.peer.name);			
	};

	// Sends data to peer.
	// var textmsg = "Gap";
	var sendTxtmsg = [];
	var textmsg = {
		"count" : "3",
		"call" : "01011112222",
		"base" : [],
		"past" : []
	};
	
	//검색된 base 배열에 저장
	for(var cnt = 0; cnt < sendToServerFlag; cnt++) {
		//yourArray['base'].push(temp);
		textmsg['base'].push({"mac": sendToServerArray[5 * cnt], "x" : sendToServerArray[5 * cnt + 1], "y" : sendToServerArray[5 * cnt + 2],
				"h" : sendToServerArray[5 * cnt + 3], "rssi" : sendToServerArray[5 * cnt + 4]});
	}
	alert(adapter.address);
	textmsg["past"].push({"mac" : adapter.address});


	alert("안드로이드로보내는 값!!!!:" + textmsg);
	
	var myJsonString = JSON.stringify(textmsg);

	
	for (var i = 0; i < myJsonString.length; i++) {
		sendTxtmsg[i] = myJsonString.charCodeAt(i);
	}
	socket.writeData(sendTxtmsg);
	
}

function onBondingSuccessCallback_tagogagi(device){
	var uuids = device.uuids;
	alert(uuids);
	
	if (device.deviceClass.major == tizen.bluetooth.deviceMajor.PHONE){
		if (uuids.indexOf(u_uuid) != -1) {
			device.connectToServiceByUUID(u_uuid, function(socket, error) {
				// alert("socket connected");
				// alert("onBondingSuccessCallback phone u : "+u);
				onSocketConnected_tagogagi(socket);
				// alert("good");
			}, function(socket, error) {
				// alert("error : " + error.message);
				
				console.log("Error while connecting: " + error.message);
				// alert("onBondingSuccessCallback error u : "+u);

				socket.onclose = function() {
					// alert("Bonding socket Close");
					console.log("Socket closed with " + socket.peer.name);
				};
				
				
				//소켓 에러시 다시 실행
				sendToBase();
			});
		} else {
			//소켓 에러시 다시 실행
			sendToBase();
		}		
	}

}*/

// ---------------- 5/24(일) 최종 통합과정 ----------------------
var startTime;
var checkTime;
var u_uuid = "5BCE9431-6C75-32AB-AFE0-2EC108A30860";
var sendToServerArray = new Array( 200 );
var sendToServerArray_i=0;
var sendToServerFlag = 0;
var successMac = new Array();
var successMac_i=0;
var uu=0;

/*
 * //Import other JS File. function loadScript(url, callback) { var script =
 * document.createElement('script'); script.src = url; script.onload = callback;
 * document.getElementsByTagName('head')[0].appendChild(script); } var myloaded =
 * function() { document.write(str); // hello 출력됨 }
 * loadScript('import_hello.js', myloaded);
 */

// Initialize function
var init = function() {
	// TODO:: Do your initialization job
	console.log("init() called");

	powerOn();

	// add eventListener for tizenhwkey
	document.addEventListener('tizenhwkey', function(e) {
		if (e.keyName == "back") {
			try {
				tizen.application.getCurrentApplication().exit();
			} catch (error) {
				console.error("getCurrentApplication(): " + error.message);
			}
		}
	});
};

// window.onload can work without <body onload="">
window.onload = init;
(function() {
	window
			.addEventListener(
					'tizenhwkey',
					function(ev) {
						if (ev.keyName == "back") {
							var page = document
									.getElementsByClassName('ui-page-active')[0], pageid = page ? page.id
									: "";
							if (pageid === "main") {
								try {
									tizen.application.getCurrentApplication()
											.exit();
								} catch (ignore) {
								}
							} else {
								window.history.back();
							}
						}
					});
}());

// Bluetooth code
var adapter = tizen.bluetooth.getDefaultAdapter();
var bluetoothSwitchAppControl = new tizen.ApplicationControl(
		"http://tizen.org/appcontrol/operation/edit", null,
		"application/x-bluetooth-on-off");
var u = 0;
var devices_length = 0;
var devices_length2 = 0;
var devices_address;
var devices_address_for_balzee;
var balzeeflag = 0;
var reportFlag = 0;
var discoveryFlag = 0;
var wasReport = 0;
var storeMacArray;  // 서버로부터 받아온 전자발찌 MAC 주소 리스트 배열

function onBondingSuccess(device) {
	console.log("Device Name:" + device.name);
	console.log("Device Address:" + device.address);
	console.log("Device Service UUIDs:" + device.uuids.join("\n"));
}

function bluetoothClick() {
	u=0;
	storeMacArray = new Array();
	sendToServerArray = new Array( 200 );
	sendToServerArray_i=0;
	sendToServerFlag = 0;
	successMac = new Array();
	successMac_i=0;
	
	if (discoveryFlag == 1 && reportFlag == 0) {
		wasReport = 1;
		reportFlag = 1;
		discoveryFlag = 0;
	} else if (discoveryFlag == 1 && reportFlag == 1) {
		discoveryFlag = 0;
	} else {
		startDiscovery();
	}

}
function changeFlag() {
	alert("test clicked");
	if (discoveryFlag == 0) {
		alert("button flag = 0");
		discoveryFlag = 1;
		adapter.setName("Guardizen", startDiscovery2, function() {
			alert("Error");
		});

	} else if (discoveryFlag == 1) {
		discoveryFlag = 0;
	}
}

function onBondingSuccessCallback(device) {
	var uuids = device.uuids;
	// alert(uuids);
	if (devices_length != u) {
		// alert("Now find " + (u+1) + " / " + devices_length);
		document.getElementById("menu").innerHTML += "Start to connect : "
				+ devices_address[u] + "<br>";
		// alert("start onBondingSuccessCallback before if u:"+u);
		if (device.deviceClass.major == tizen.bluetooth.deviceMajor.COMPUTER) {
			// Shows computer icon for this device
			// alert("Device is computer");
			document.getElementById("menu").innerHTML += "Device is computer. find next.<br><br>";
			// alert("onBondingSuccessCallback computer u : "+u);

			adapter.getDevice(devices_address[++u], onBondingSuccessCallback,
					function(e) {
						console.log("Fail : " + e);
					});
		} else if (device.deviceClass.major == tizen.bluetooth.deviceMajor.PHONE) {
			// Shows phone icon
			// alert("Device is a Phone");

			// alert("A bonding is created - name: " + device.name +
			// device.address);
			if (uuids.indexOf(u_uuid) != -1) {
				device.connectToServiceByUUID(u_uuid, function(socket, error) {
					// alert("socket connected");
					// alert("onBondingSuccessCallback phone u : "+u);
					onSocketConnected(socket);
					// alert("good");
				}, function(error) {
					// alert("error : " + error.message);
					adapter.getDevice(devices_address[u++],
							onBondingSuccessCallback, function(e) {
								console.log("Fail : " + e);
							});
					console.log("Error while connecting: " + error.message);
					// alert("onBondingSuccessCallback error u : "+u);

					
				});
			} else {
				adapter.getDevice(devices_address[++u],
						onBondingSuccessCallback, function(e) {
							console.log("Fail : " + e);
							
						});
			}

			// alert("start FRCOMM");
			// adapter.registerRFCOMMServiceByUUID("5BCE9431-6C75-32AB-AFE0-2EC108A30860",
			// "haha"
			// , chatservicecallback, function(e){
			// alert("errorRFCOMM");
			// });

		} else {
			alert("NOthiNG");
			adapter.getDevice(devices_address[++u], onBondingSuccessCallback,
					function(e) {
						console.log("Fail : " + e);
					});
		}
		// if last, print END
		//alert("device_length: " + devices_length + "u: " + u);
		
	}

	if (devices_length == u){
		//alert(sendToServerArray.toString());
		paycheck2();
		document.getElementById("menu").innerHTML += "<br>서버로 데이터 전송 완료<br>";
		document.getElementById("menu").innerHTML += "END";
		if(wasReport == 1){
			discoveryFlag = 1;
			reportFlag = 0;
			adapter.setName("Guardizen", startDiscovery2,
					startDiscovery2);
		}
	}
}

function onSocketConnected(socket) {

	console.log("Opened connection to remote device");
	socket.onmessage = function() {
		// Has got a message from peer, reads it
		 //alert("get message");
		var data = socket.readData();
		var recvmsg = '';
		var msgobj;
		for (var i = 0; i < data.length; i++) {
			recvmsg += String.fromCharCode(data[i]);
		}
		msgobj = JSON.parse(recvmsg);
		 //alert("count : "+msgobj.count+" - x : "+msgobj.x+" - y : "+msgobj.y);
		document.getElementById("menu").innerHTML += recvmsg /*+ "count : "
				+ msgobj.count + " - x : " + msgobj.x + " - y : " + msgobj.y
				+ */+"<br><br>";
		sendToServerArray[sendToServerArray_i++] = msgobj.mac;
		sendToServerArray[sendToServerArray_i++] = msgobj.x;
		sendToServerArray[sendToServerArray_i++] = msgobj.y;
		sendToServerArray[sendToServerArray_i++] = msgobj.h;
		sendToServerArray[sendToServerArray_i++] = msgobj.rssi;
		sendToServerFlag++;
		successMac[successMac_i++] = msgobj.mac;
		
		socket.close();
	};

	socket.onclose = function() {
		// alert("onSocketConnected Close");
		console.log("Socket closed with " + socket.peer.name);
		
		//alert("device_length" + devices_length + "u" + u);
		if (devices_length != ++u) {

			// alert("Start to connect : " + devices_address[u]);

			// document.getElementById("menu").innerHTML += "Start to connect :
			// " + devices_address[u] + "<br>";
			adapter.getDevice(devices_address[u], onBondingSuccessCallback,
					function(e) {
						console.log("Fail : " + e);

					});
		} else {
			// if last, print END
			//alert(sendToServerArray.toString());
			paycheck2();
			document.getElementById("menu").innerHTML += "<br>서버로 데이터 전송 완료<br>";
			document.getElementById("menu").innerHTML += "END";
			if(wasReport == 1){
				discoveryFlag = 1;
				reportFlag = 0;
				adapter.setName("Guardizen", startDiscovery2,
						startDiscovery2);
			}
			
		}
			
	};

	// Sends data to peer.
	// var textmsg = "Gap";
	var sendTxtmsg = [];
	var textmsg = {
		count : 0,
		call : encodeURIComponent("010-3333-4444")
	};
	textmsg = JSON.stringify(textmsg);

	var sendtextmsg = new Array();
	for (var i = 0; i < textmsg.length; i++) {
		sendTxtmsg[i] = textmsg.charCodeAt(i);
	}
	socket.writeData(sendTxtmsg);

	//document.getElementById("menu").innerHTML += recvmsg + "<br><br>";
	// alert(recvmsg);

	// socket.close();

}

function onErrorCallback(e) {
	alert("Cannot create a bonding, reason: " + e.message);
	
	
}

// Bluetooth On
function powerOn() {
	// If adapter is not powered on
	if (!adapter.powered) {
		// Initiates power on
		adapter.setPowered(true, function() {
			console.log("Bluetooth powered on success.");
			showMe();
		}, function(e) {
			console.log("Failed to power on Bluetooth: " + e.message);
		});
	}
}

// Bluetooth visible
function showMe() {
	if (adapter.visible == false) {
		// Shows device
		adapter.setVisible(true, function() {
			console.log("Device is visible to other devices for 3 minutes.");
		}, function(e) {
			console.log("Error: ' + e.message + '(' + e.name + ')");
		});
	} else {
		console.log("Device is already in discoverable mode.");
	}
}

// connecting bluetooth devices name
var discoverDevicesSuccessCallback = {
	ondevicefound : function(device) {
		// alert("Found device - name: " + device.name);
	}
}

// connecting bluetooth devices number
function onGotDevices(devices) {
	alert("The number of known devices: " + devices.length);
}

function startDiscovery() {
	var discoverDevicesSuccessCallback = {
		onstarted : function() {
			console.log("Device discovery started...");
		},
		ondevicefound : function(device) {
			console.log("Found device - name: " + device.name + ", Address: "
					+ device.address);
			// Shows the device to user to check if this is the device user is
			// looking for.
			// For example, add this to list view.
			cancelDiscovery();
		},
		ondevicedisappeared : function(address) {
			console.log("Device disappeared: " + address);
			// Removes from list, as it is no longer valid.
		},
		onfinished : function(devices) {
			console.log("Found Devices");
			document.getElementById("menu").innerHTML = "";

			devices_length = devices.length;
			devices_address = new Array(devices_length);

			// alert(devices[0].RSSI);

			for (var i = 0; i < devices.length; i++) {
				document.getElementById("menu").innerHTML += "Name: "
						+ devices[i].name + ", Address: " + devices[i].address
						+ "<br>";
				devices_address[i] = devices[i].address;
			}
			document.getElementById("menu").innerHTML += "<br>";
			console.log("Total: " + devices.length);
			if (devices.length != 0) {

				/*
				 * //start search offenders' mac if(typeof(Worker) !==
				 * "undefined"){ var search_offender = new
				 * Worker("./offender.js"); search_offender.onmessage =
				 * function(event){ // get message from worker alert("detect :
				 * "+event.data); } alert("1");
				 * search_offender.postMessage(offender_mac); } else{
				 * alert("Sorry, your browser does not support Web Workers..."); }
				 */
				// alert("start bonding");
				adapter.getDevice(devices_address[u], onBondingSuccessCallback,
						function(e) {
							console.log("Fail : " + e);

						});
			}

		}
	};
	// Starts searching for nearby devices, for about 12 sec.
	adapter.discoverDevices(discoverDevicesSuccessCallback, function(e) {
		console.log("Failed to search devices: " + e.message + "(" + e.name
				+ ")");
	});
}

function startDiscovery2() {
	var discoverDevicesSuccessCallback = {
		onstarted : function() {
			
			console.log("Device discovery started...");
		},
		ondevicefound : function(device) {
			console.log("Found device - name: " + device.name + ", Address: "
					+ device.address);
			// Shows the device to user to check if this is the device user is
			// looking for.
			// For example, add this to list view.
			for(var i = 0; i < storeMacArray.length - 1;i++){ // length - 1 해야 모든 값 들어옴
				//alert(device.address.toLowerCase().indexOf(storeMacArray[i].toLowerCase()));
				if(device.address.toLowerCase().trim() == storeMacArray[i].toLowerCase().trim())
					alert("전자발찌 범죄자가 주변에 있습니다");
      	  	}
			cancelDiscovery();
		},
		ondevicedisappeared : function(address) {
			console.log("Device disappeared: " + address);
			// Removes from list, as it is no longer valid.
		},
		onfinished : function(devices) {
			console.log("Found Devices");
			// document.getElementById("menu").innerHTML = "";

			devices_length2 = devices.length;
			devices_address_for_balzee = new Array(devices_length2);
			
			/*
			var gapgap = "40:B0:FA:5B:BB:42";
			for (var i = 0; i < devices.length; i++) {
				// for(var j=0 ; j<balzee.length; j++){
				// if(devices[i].address == balzee[j]){
				// alert("balzee discover");
				// }
				// }
				// alert(devices[i].address + " - " + gapgap);
				if (devices[i].address == gapgap) {
					balzeeflag++;
				}

			}*/
			document.getElementById("menu").innerHTML += "전자발찌감시중...<br>";
			
			/*var x = getTime();
			while(getTime()-x == 10000){
				
			}*/
			
			if (discoveryFlag == 0 && reportFlag == 1 ) {
				return startDiscovery();
			} else if (discoveryFlag == 0 && reportFlag == 0 && wasReport == 0) {
				document.getElementById("menu").innerHTML += "<br>전자발찌 자동 감시를 종료합니다.<br>";
				return;
			} else {
				return adapter.setName("Guardizen", startDiscovery2,
						startDiscovery2);
			}

		}
	};
	// Starts searching for nearby devices, for about 12 sec.

	adapter.discoverDevices(discoverDevicesSuccessCallback, function(e) {
		console.log("Failed to search devices: " + e.message + "(" + e.name
				+ ")");
		
	});

}
function setDiscovery() {
	fileCheck();
	if (discoveryFlag == 0) {
		discoveryFlag = 1;
		adapter.setName("Guardizen", startDiscovery2, startDiscovery2);
	} else {
		alert("전자발찌 탐색을 종료합니다");
		discoveryFlag = 0;
		wasReport = 0;
	}
}


// 여기서부터 http request
var xhr;
//서버로부터 받은 MAC 주소 리스트 file write - choi
function viewMessage() {
	var data,mac,msgobj;
	
	if (xhr.readyState == 4) {
		if (xhr.status == 200) {
			//alert(xhr.responseText);
			data = xhr.responseText;
			msgobj = JSON.parse(xhr.responseText);
			mac = decodeURIComponent(msgobj.mac);
			/*document.getElementById("menu").innerHTML += "Offender's MAC address list<br>"
			for (var k = 0; k < msgobj.length; k++) {
				document.getElementById("menu").innerHTML += "mac : "
						+ msgobj[k].mac + "<br>";
			}*/
			
			var curDir = "/opt/usr/media/Documents/offender";
			var newDir, newFile;
			tizen.filesystem.resolve("documents", function(dir) 
			                         {	
										dir.deleteDirectory(curDir, true, onDelete);
										newDir = dir.createDirectory("offender");
			                            newFile = newDir.createFile("offender_list.txt");
			                            alert("정보가 갱신되었습니다");
			                            newFile.openStream(
			                            "w",
			                            function(fs){
			                            	for (var k = 0; k < msgobj.length; k++) {
			                            		fs.write(msgobj[k].mac + "\n");
			                    			}
			                       
			                            	fs.close();
			                            }, function(e){
			                            	console.log("Error " + e.message);
			                            	alert("error"); 
			                            }, "UTF-8");
			                            
 			                         });

		}
	}
}

//deleteDirectory - choi
function onDelete()
{
   console.log("deletedFile() is successfully done.");
}

//서버 DB로 요청 - choi
function requestDB() {
	var formdata = new FormData();
	formdata.append("post_data", "gapsa");

	xhr = new XMLHttpRequest();
	xhr.onreadystatechange = viewMessage;
	xhr.open("POST", "http://jong1.dothome.co.kr/getOffender.php", true);

	xhr.send(null);
}

//file read Message - choi
function fileCheck(){
	var readMacText;
	tizen.filesystem.resolve("documents", function(dir) 
            {
              file = dir.resolve("offender/offender_list.txt");
              file.openStream(
                    "r", 
                    function(fs) {
                    	  readMacText = fs.read(file.fileSize);  // 파일에서 변수 Text로 저장
                          fs.close();
                          storeMacArray = readMacText.split('\n'); // 배열에 저장
                         
                        }, function(e) {
                          console.log("Error " + e.message);
                        }, "UTF-8");
            });
}

//onreadystatechange - choi
function readState(){
 if(xhr.readyState == 4){
    if(xhr.status == 200){
    }else{
       document.getElementById("menu").innerHTML += "<br>인터넷에 연결되어 있지 않습니다. 주변 기기를 통해 전송하겠습니다.<br>";
       sendToBase();
    }
 }
}

//서버로 보내기 - choi
function paycheck2(){
	var yourArray = {
		    "call": "01011112222",
		    "base_count" : sendToServerFlag,
		    /*"base" : [ 
		                { "mac" : sendToServerArray, "x" : "37.2789147", "y" : "127.0338099", "h" : "8", "rssi" : "-77"},
		                { "mac" : "22-33-44-55-66-77", "x" : "37.2789047", "y" : "127.0338099", "h" : "2", "rssi" : "-60"},
		                { "mac" : "33-44-55-66-77-88", "x" : "37.2789240", "y" : "127.0338110", "h" : "7", "rssi" : "-75"}
		             ]*/
		    "base" : []
		};
	if(sendToServerFlag == 0) {
		document.getElementById("menu").innerHTML += "<br>주변에 기기들이 존재하지 않습니다<br>";
		return;
	}
	else {
		//var temp = new Array();
		for(var cnt = 0; cnt < sendToServerFlag; cnt++) {
			//yourArray['base'].push(temp);
			yourArray['base'].push({"mac": sendToServerArray[5 * cnt], "x" : sendToServerArray[5 * cnt + 1], "y" : sendToServerArray[5 * cnt + 2],
					"h" : sendToServerArray[5 * cnt + 3], "rssi" : sendToServerArray[5 * cnt + 4]});
		}
	}
	
	var myJsonString = JSON.stringify(yourArray);
	var formdata = new FormData();
	formdata.append("json", myJsonString); 
	xhr = new XMLHttpRequest();
	//xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.onreadystatechange = readState;
	xhr.open("POST", "http://jong1.dothome.co.kr/insert_victim.php", true);
	xhr.send(formdata);
}





function sendToBase(){
	//var uu = (Math.floor(Math.random()*100) % successMac.length);
	if( uu == successMac.length){
		document.getElementById("menu").innerHTML += "타고가기가 끝났어요<br>";
	}else{
		adapter.getDevice(successMac[uu++], onBondingSuccessCallback_tagogagi,
				function(e) {
					console.log("Fail Tagogagi: " + e);
				});
	}
	 
}


function onSocketConnected_tagogagi(socket) {
	socket.onmessage = function() {
		// Has got a message from peer, reads it
		 //alert("get message");
		var data = socket.readData();
		var recvmsg = '';
		var msgobj;
		for (var i = 0; i < data.length; i++) {
			recvmsg += String.fromCharCode(data[i]);
		}
		msgobj = JSON.parse(recvmsg);

		if(msgobj.count == -2){
			document.getElementById("menu").innerHTML += sendToServerArray[5 * (uu-1)]+ "로 타고가기 성공<br>";
			sendToBase();
		}
		else{
			document.getElementById("menu").innerHTML += sendToServerArray[5 * (uu-1)]+ "로 타고가기 실패<br>";
			sendToBase();
		}
		
		socket.close();
	};

	socket.onclose = function() {
		// alert("onSocketConnected Close");
		console.log("Socket closed with " + socket.peer.name);			
	};

	// Sends data to peer.
	// var textmsg = "Gap";
	var sendTxtmsg = [];
	var textmsg = {
		"count" : "3",
		"call" : "01011112222",
		"base_count" : sendToServerFlag,
		"base" : [],
		"past" : []
	};
	
	//검색된 base 배열에 저장
	for(var cnt = 0; cnt < sendToServerFlag; cnt++) {
		//yourArray['base'].push(temp);
		textmsg['base'].push({"mac": sendToServerArray[5 * cnt], "x" : sendToServerArray[5 * cnt + 1], "y" : sendToServerArray[5 * cnt + 2],
				"h" : sendToServerArray[5 * cnt + 3], "rssi" : sendToServerArray[5 * cnt + 4]});
	}
	
	textmsg["past"].push({"mac" : adapter.address});

	var myJsonString = JSON.stringify(textmsg);

	for (var i = 0; i < myJsonString.length; i++) {
		sendTxtmsg[i] = myJsonString.charCodeAt(i);
	}
	socket.writeData(sendTxtmsg);
	
}

function onBondingSuccessCallback_tagogagi(device){
	var uuids = device.uuids;
	
	if (device.deviceClass.major == tizen.bluetooth.deviceMajor.PHONE){
		if (uuids.indexOf(u_uuid) != -1) {
			device.connectToServiceByUUID(u_uuid, function(socket, error) {
				// alert("socket connected");
				// alert("onBondingSuccessCallback phone u : "+u);
				onSocketConnected_tagogagi(socket);
				// alert("good");
			}, function(socket, error) {
				// alert("error : " + error.message);
				
				console.log("Error while connecting: " + error.message);
				// alert("onBondingSuccessCallback error u : "+u);

				socket.onclose = function() {
					// alert("Bonding socket Close");
					console.log("Socket closed with " + socket.peer.name);
				};
				
				
				//소켓 에러시 다시 실행
				sendToBase();
			});
		} else {
			//소켓 에러시 다시 실행
			sendToBase();
		}		
	}

}