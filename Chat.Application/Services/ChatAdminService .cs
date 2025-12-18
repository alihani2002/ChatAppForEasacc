using Chat.Application.Interfaces.Services.Chat;
using Chat.Application.Models;
using Chat.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Chat.Application.Services
{
    public class ChatAdminService : IChatAdminService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ChatAdminService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<ChatSessionVM>> GetAllSessionsAsync()
        {
            return await _unitOfWork.ChatSessions
                .GetQueryable()
                .Select(s => new ChatSessionVM
                {
                    Id = s.Id,
                    UserId = s.UserId,
                    IsClosed = s.IsClosed,
                    MessagesCount = s.Messages.Count,
                    CreatedOn = s.CreatedOn
                })
                .ToListAsync();
        }

        public async Task<ChatSessionDetailsVM> GetSessionWithMessagesAsync(int sessionId)
        {
            var session = await _unitOfWork.ChatSessions
                .Find(x => x.Id == sessionId,
                      q => q.Include(x => x.Messages));

            if (session == null)
                throw new Exception("Session not found");

            return new ChatSessionDetailsVM
            {
                SessionId = session.Id,
                UserId = session.UserId,
                IsClosed = session.IsClosed,
                Messages = session.Messages
                    .OrderBy(x => x.CreatedOn)
                    .Select(m => new MessageVM
                    {
                        Id = m.Id,
                        SenderId = m.SenderId,
                        Content = m.Content,
                        MessageType = m.MessageType,
                        Status = m.Status,
                        CreatedOn = m.CreatedOn
                    }).ToList()
            };
        }

      
    }

}
