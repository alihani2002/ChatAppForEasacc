using Chat.Application.Interfaces.Services.Chat;
using Chat.Core.Entities;
using Chat.Core.Enums;


namespace Chat.Application.Services
{
    public class ChatService : IChatService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ChatService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ChatSession> CreateSessionAsync(string userId)
        {
            var session = new ChatSession
            {
                UserId = userId,
                IsClosed = false
            };

            await _unitOfWork.ChatSessions.Add(session);
            _unitOfWork.Complete();

            return session;
        }

        public async Task<Message> SendMessageAsync(int sessionId, string senderId, string content)
        {
            var session = await _unitOfWork.ChatSessions.GetById(sessionId);
            if (session == null || session.IsClosed)
                throw new Exception("Session closed");

            var message = new Message
            {
                ChatSessionId = sessionId,
                SenderId = senderId,
                Content = content,
                MessageType = MessageType.Text,
                Status = MessageStatus.Sent,
                CreatedOn = DateTime.Now ,
                
            };

            session.LastMessageOn = DateTime.Now;

            await _unitOfWork.Messages.Add(message);
            _unitOfWork.ChatSessions.Update(session);
            _unitOfWork.Complete();

            return message;
        }


        public async Task CloseSessionAsync(string userId)
        {
            var user = await _unitOfWork.ApplicationUsers.GetByName(userId);
            var sessions = _unitOfWork.ChatSessions
                .GetQueryable()
                .Where(s => s.User.Id == user!.Id)
                .OrderByDescending(s => s.CreatedOn)
                .ToList();

            foreach (var session in sessions)
            {
                session.IsClosed = true;
                _unitOfWork.ChatSessions.Update(session);
            }

            _unitOfWork.Complete();
        }

        public async Task<IEnumerable<Message>> GetMessagesAsync(int sessionId)
        {
            return await _unitOfWork.Messages.FindAll(x => x.ChatSessionId == sessionId);
        }
    }

}
