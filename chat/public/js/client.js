window.onload = function () {
    var conn; //websocket实例
    var chatHistory = document.getElementById("chatHistory");
    var username;
    var users;
    var channel;

    function appendLog(item) {
        var doScroll = chatHistory.scrollTop > chatHistory.scrollHeight - chatHistory.clientHeight - 1;
        chatHistory.appendChild(item);
        if (doScroll) {
            chatHistory.scrollTop = chatHistory.scrollHeight - chatHistory.clientHeight;
        }
    }

    // show tip
    function tip(type, name) {
        var tip,title;
        switch(type){
            case 'online':
                tip = name + ' is online now.';
                title = 'Online Notify';
                break;
            case 'offline':
                tip = name + ' is offline now.';
                title = 'Offline Notify';
                break;
            case 'message':
                tip = name + ' is saying now.'
                title = 'Message Notify';
                break;
        }
        var pop=new Pop(title, tip);
    };

    // show login panel
    function showLogin() {
        $("#loginView").show();
        $("#chatHistory").hide();
        $("#toolbar").hide();
        $("#loginError").hide();
        $("#loginUser").focus();
    };

    // show chat panel
    function showChat() {
        $("#loginView").hide();
        $("#loginError").hide();
        $("#toolbar").show();
        $("#chatHistory").show();
        $("#entry").focus();
        // scrollDown(base);
    };

    // add user in user list
    function addUser(data) {
        var user = data.user
        var slElement = $(document.createElement("option"));
        slElement.attr("value", user);
        slElement.text(user);
        $("#usersList").append(slElement);
        tip('online', user);
    };

    function removeUser(data) {
        var user = data.user
        $("#usersList option").each(
            function() {
                if($(this).val() === user) $(this).remove();
            });
        tip('offline', user);
    };

    function removeAllUser() {
        $("#usersList option").each(
            function() {
                if($(this).val() !== '*') $(this).remove();
            });
    };

    // set your name
    function setName() {
        $("#name").text(username);
    };

// set your room
    function setRoom() {
        $("#room").text(channel);
    };

    // init user list
    function initUserList(data) {
        removeAllUser()
        users = data.users;
        for(var i = 0; i < users.length; i++) {
            var slElement = $(document.createElement("option"));
            slElement.attr("value", users[i]);
            slElement.text(users[i]);
            $("#usersList").append(slElement);
        }
    };

    $("#entry").keypress(function (e) {
        if(e.keyCode != 13) return;
        var content = $("#entry").attr("value").replace("\n", "");
        var target = $("#usersList").val();
        var msg = {
            content: content,
            target: target
        }
        if (!conn) {
            console.log('conn nil')
            return false;
        }
        conn.send(JSON.stringify(msg));
        $("#entry").attr("value", ""); // clear the entry field.

        var item = document.createElement("div");
        item.innerText = JSON.stringify(msg);
        appendLog(item);
        return false;
    });

    showLogin()

    if (window["WebSocket"]) {

        var lockReconnect = false;//避免重复连接
        var connecting = false;
        var wsUrl;

        $("#login").click(function () {
            username = $("#username").attr("value")
            channel = $("#channel").attr("value")
            wsUrl = "ws://" + document.location.host + "/ws?channel=" + channel +"&username=" + username;
            console.log(wsUrl)

            showChat()
            setName()
            setRoom()
            createWebSocket(wsUrl);
        });

        function createWebSocket(url) {
            try {
                conn = new WebSocket(url);
                initEventHandle();
                console.log('create success')
            } catch (e) {
                console.log('create error---->%j', e)
                reconnect(wsUrl);
            }
        }

        function initEventHandle() {
            conn.onclose = function () {
                connecting = false;
                var item = document.createElement("div");
                item.innerHTML = "<b>Connection closed.</b>";
                appendLog(item);

                // 如果连接被关闭有可能是断网了，在一段时间后发起重连操作
                console.log('onclose')
                reconnect(wsUrl);
            };
            conn.onerror = function (error) {
                connecting = false;
                console.log('onError--------->%j', error)
                reconnect(wsUrl);
            };
            conn.onopen = function (err) {
                console.log('onopen---------->%j', err)
                connecting = false;
                lockReconnect = false
            };
            conn.onmessage = function (event) {
                var messages = event.data.split('\n');
                for (var i = 0; i < messages.length; i++) {
                    var message = JSON.parse(messages[i])
                    console.log(JSON.stringify(message))
                    switch (message.action) {
                        case "onGetUsers" :
                            initUserList(message)
                            break
                        case "onAddUser":
                            addUser(message)
                            break
                        case "onLeave":
                            removeUser(message)
                    }

                    var item = document.createElement("div");
                    item.innerText = JSON.stringify(message);
                    appendLog(item);
                }
            }
        }

        function reconnect(url) {
            if (lockReconnect) {
                return
            }
            lockReconnect = true
            console.log('reconnect')
            //设置一个定时器，一秒钟重连一次
            var reconnectTicker = setInterval(function () {
                console.log('interval reconnect')
                if (lockReconnect) {
                    if (!connecting) {
                        console.log('create conn')
                        createWebSocket(url);
                        connecting = true;
                    }
                } else {
                    console.log('clear internal')
                    clearInterval(reconnectTicker)
                }
            }, 1000);
        }

    } else {
        var item = document.createElement("div");
        item.innerHTML = "<b>Your browser does not support WebSockets.</b>";
        appendLog(item);
    }
};