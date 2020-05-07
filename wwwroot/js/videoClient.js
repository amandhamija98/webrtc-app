"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/videoCallHub").build();
document.getElementById("vid").innerHTML = UserName;
