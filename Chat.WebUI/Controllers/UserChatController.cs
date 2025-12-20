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

        [HttpPost]
        [Route("UserChat/{chatId}/upload")]
        public async Task<IActionResult> UploadFile(
            int chatId,
            IFormFile file,
            MessageType messageType)
        {
            try
            {
                var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(senderId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "Invalid file or file is empty" });
                }

                // Validate file size (10MB limit)
                const long maxFileSize = 10 * 1024 * 1024; // 10MB
                if (file.Length > maxFileSize)
                {
                    return BadRequest(new { error = $"File size exceeds the maximum allowed size of {maxFileSize / (1024 * 1024)}MB" });
                }

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
                    id = message.Id,
                    fileUrl = message.FileUrl,
                    messageType = (int)message.MessageType,
                    fileName = message.FileName,
                    time = message.CreatedOn.ToString("HH:mm"),
                    senderId = senderId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while uploading the file", details = ex.Message });
            }
        }
    }
}