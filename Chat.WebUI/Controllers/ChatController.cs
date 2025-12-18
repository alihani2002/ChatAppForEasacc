using Chat.Application.Interfaces.Services.Chat;
using Chat.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chat.WebUI.Controllers
{
    [Authorize(Roles = AppRoles.Admin)]
    public class ChatController : Controller
    {
        private readonly IChatAdminService _chatAdminService;

        public ChatController(IChatAdminService chatAdminService)
        {
            _chatAdminService = chatAdminService;
        }

        // 🟢 Dashboard
        public async Task<IActionResult> Index()
        {
            var sessions = await _chatAdminService.GetAllSessionsAsync();
            return View(sessions);
        }

        // 🟢 Open Chat
        public async Task<IActionResult> Open(int id)
        {
            var session = await _chatAdminService.GetSessionWithMessagesAsync(id);
            return View(session);
        }

        public async Task<IActionResult> UserChats(string userId)
        {
            var sessions = await _chatAdminService.GetSessionsByUserAsync(userId);
            return PartialView("_UserChatHistory", sessions);
        }
      
    }

}