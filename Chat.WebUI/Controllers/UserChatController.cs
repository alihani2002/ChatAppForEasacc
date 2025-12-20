using Chat.Application.Interfaces.Services;
using Chat.Application.Interfaces.Services.Chat;
using Chat.Core.Enums;
using Chat.WebUI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Chat.WebUI.Controllers
{
    [Authorize]
    public class UserChatController : Controller
    {
        private readonly IChatService _chatService;
        private readonly IFileService _fileService;

        public UserChatController(IChatService chatService, IFileService fileService)
        {
            _chatService = chatService;
            _fileService = fileService;
        }

        public async Task<IActionResult> Index()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            await _chatService.CloseSessionAsync(userId);
            ViewBag.UserId = userId;
            var session = await _chatService.CreateSessionAsync(userId);
            return View(session);
        }

        [Authorize]
        [HttpPost("{chatId}/upload")]
        public async Task<IActionResult> UploadFile(
            int chatId,
            IFormFile file,
            MessageType messageType
        )
        {
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            if (file == null || file.Length == 0)
                return BadRequest("Invalid file");

            var folder = messageType switch
            {
                MessageType.Image => "images",
                MessageType.Document => "documents",
                MessageType.Video => "videos",
                MessageType.Voice => "voices",
                _ => "others"
            };

            var fileUrl = await _fileService.UploadAsync(file, folder);

            var message = await _chatService.SendFileMessageAsync(
                chatId,
                senderId,
                fileUrl,
                file.FileName,
                messageType
            );

            return Ok(new
            {
                message.Id,
                message.FileUrl,
                MessageType = (int)message.MessageType, // تحويل إلى int
                message.FileName,
                Time = message.CreatedOn.ToString("HH:mm"),
                SenderId = senderId
            });
        }
    }
}