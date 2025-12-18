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
        public async Task<List<ChatSessionDetailsVM>> GetSessionsByUserAsync(string userId)
        {
            var sessions = await _unitOfWork.ChatSessions
                .GetQueryable()
                .Where(s => s.UserId == userId)
                .Include(s => s.Messages)
                .OrderByDescending(s => s.CreatedOn)
                .ToListAsync();

            return sessions.Select(session => new ChatSessionDetailsVM
            {
                SessionId = session.Id,
                UserId = session.UserId,
                IsClosed = session.IsClosed,
                Messages = session.Messages
                    .OrderBy(m => m.CreatedOn)
                    .Select(m => new MessageVM
                    {
                        Id = m.Id,
                        SenderId = m.SenderId,
                        Content = m.Content,
                        MessageType = m.MessageType,
                        Status = m.Status,
                        CreatedOn = m.CreatedOn
                    })
                    .ToList()
            }).ToList();
        }


        public async Task<IEnumerable<ChatSessionVM>> GetAllSessionsAsync()
        {
            return await _unitOfWork.ChatSessions
                .GetQueryable().Where(s => !s.IsClosed)
                .Select(s => new ChatSessionVM
                {
                    Id = s.Id,
                    UserId = s.UserId,
                    IsClosed = s.IsClosed,
                    MessagesCount = s.Messages.Count,
                    CreatedOn = s.CreatedOn,
                    LastMessageOn = s.LastMessageOn
                })
        .OrderByDescending(x => x.Id)
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
        public async Task<List<ChatSessionDashboardVM>> GetDashboardAsync()
        {
            var sessions = await _unitOfWork.ChatSessions
                .GetQueryable()
                .Include(s => s.Messages)
                .ToListAsync();

            var result = sessions
                .GroupBy(s => s.UserId)
                .Select(g =>
                {
                    var lastSession = g
                        .OrderByDescending(x => x.CreatedOn)
                        .First();

                    return new ChatSessionDashboardVM
                    {
                        UserId = g.Key,
                        SessionId = lastSession.Id,           // ✅ آخر Session فقط
                        IsClosed = lastSession.IsClosed,

                        MessagesCount = g.Sum(x => x.Messages.Count), // ✅ مجموع الرسائل
                        CreatedOn = lastSession.CreatedOn,
                        LastMessageOn = g
                            .SelectMany(x => x.Messages)
                            .OrderByDescending(m => m.CreatedOn)
                            .Select(m => (DateTime?)m.CreatedOn)
                            .FirstOrDefault()
                    };
                })
                .OrderByDescending(x => x.LastMessageOn)
                .ToList();

            return result;
        }

        public async Task<IEnumerable<ChatSession>> GetActiveSessionsAsync()
        {
            return await _unitOfWork.ChatSessions.GetQueryable()
                .Where(s => !s.IsClosed)
                .OrderByDescending(s => s.LastMessageOn)
                .ToListAsync();
        }

    }

}
