using System;
using System.ComponentModel.DataAnnotations;

namespace webrtc_app.Models
{
    public class UserInfo
    {
        public string UserName { get; set; }
        public string ConnectionId  { get; set; }
        public bool OnCall {get; set;}
    }
}