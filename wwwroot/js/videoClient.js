"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/videoCallHub").build();
var currentUserName = UserName;
var activeUsers = [];
var onCall = false;

connection.start().then(()=> {
    console.log("SignalR connection begun");
}).then(()=>{
    connection.invoke("NewUser",currentUserName);
}).then(()=>{
    console.log("Others have been informed");
}).catch( (err) => {
    return console.error(err.toString());
});

connection.on("NewUserJoined",(newUserInfo)=>{
    activeUsers.push(newUserInfo);
    var newUserCard = makeNewUserCard(newUserInfo["userName"]);
    document.getElementById("activeUsersList").appendChild(newUserCard);
    connection.invoke("GreetNewUser",newUserInfo["connectionId"],currentUserName,onCall);
},(err)=> {
    console.error(err.toString());
});

connection.on("ExistingUserGreeting",(existingUserInfo)=>{
    activeUsers.push(existingUserInfo);
    var existingUserCard = makeNewUserCard(existingUserInfo["userName"]);
    document.getElementById("activeUsersList").appendChild(existingUserCard);
}, (err)=>{
    console.error(err.toString());
});

//Utility Functions

function makeNewUserCard(name){
    var card = document.createElement("div");
    card.classList.add("card");
    var cardBody = document.createElement("div");
    cardBody.classList.add("card-body");
    cardBody.innerText = name;
    card.appendChild(cardBody);
    return card;
}

document.getElementById("vid").innerHTML = UserName;

