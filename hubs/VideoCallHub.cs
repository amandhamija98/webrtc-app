using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using webrtc_app.Models;
using System.Collections;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SignalRChat.Hubs
{
    public class VideoCallHub : Hub
    {    

        public async Task NewUser(string UserName){
            UserInfo NewUserInfo = new UserInfo(){UserName = UserName, ConnectionId  = Context.ConnectionId , OnCall = false};
            await Clients.Others.SendAsync("NewUserJoined",NewUserInfo);
        }

        public async Task GreetNewUser(string NewUserConnectionId, string ExistingUserName, bool ExistingUserOnCall){
            UserInfo ExistingUserInfo = new UserInfo(){UserName = ExistingUserName, ConnectionId  = Context.ConnectionId , OnCall = ExistingUserOnCall};
            await Clients.Client(NewUserConnectionId).SendAsync("ExistingUserGreeting", ExistingUserInfo);
        }
        
        public async Task SendVideoOffer(RTCMessage message){
            message.Sender = Context.ConnectionId;
            await Clients.Client(message.Target).SendAsync("ReceiveVideoOffer",message);
        }

        public async Task SendVideoAnswer(RTCMessage message){
            message.Sender = Context.ConnectionId;
            await Clients.Client(message.Target).SendAsync("ReceiveVideoAnswer",message);
        }

        public async Task SendNewIceCandidate(RTCMessage message){
            message.Sender = Context.ConnectionId;
            await Clients.Client(message.Target).SendAsync("ReceiveNewIceCAndidate",message);
        }
    }
}