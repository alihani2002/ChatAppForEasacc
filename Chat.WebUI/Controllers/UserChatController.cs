using Chat.Application.Interfaces.Services.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Chat.WebUI.Controllers
{
    [Authorize]
    public class UserChatController : Controller
    {
        private readonly IChatService _chatService;

        public UserChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        public async Task<IActionResult> Index()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var session = await _chatService.CreateSessionAsync(userId);
            return View(session);
        }
    }

}
