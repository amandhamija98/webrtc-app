using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace webrtc_app.Pages
{
    public class VideoCallModel : PageModel
    {
        private string _userName;
        private readonly ILogger<VideoCallModel> _logger;

        public VideoCallModel(ILogger<VideoCallModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
        }
        
        public void OnPost()
        {
            _userName = Request.Form["UserName"].FirstOrDefault();
            //_logger.LogInformation(_userName);
        }
    }
}
