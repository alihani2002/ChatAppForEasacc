namespace Chat.Application.Services
{
    public class ChatService : IChatService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ChatService(IUnitOfWork unitOfWork , IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            
        }

        public async Task<MessageVM> SendFileMessageAsync(int sessionId, string senderId,
            string fileUrl,string fileName, MessageType messageType
        )
        {
            var session = await _unitOfWork.ChatSessions.GetById(sessionId);
            if (session == null || session.IsClosed)
                throw new Exception("Session closed");

            var message = new Message
            {
                ChatSessionId = sessionId,
                SenderId = senderId,
                FileUrl = fileUrl,
                FileName = fileName,
                MessageType = messageType,
                Status = MessageStatus.Sent,
                CreatedOn = DateTime.Now ,
                
            };

            session.LastMessageOn = DateTime.Now;

            await _unitOfWork.Messages.Add(message);
            _unitOfWork.ChatSessions.Update(session);
            _unitOfWork.Complete();

            return _mapper.Map<MessageVM>(message);
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

        public async Task<MessageVM> SendMessageAsync(int sessionId, string senderId, string content)
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
                CreatedOn = DateTime.Now
            };

            session.LastMessageOn = DateTime.Now;

            await _unitOfWork.Messages.Add(message);
            _unitOfWork.ChatSessions.Update(session);
            _unitOfWork.Complete();

    return _mapper.Map<MessageVM>(message);
        }

        public async Task CloseSessionAsync(string userId)
        {
            var user = await _unitOfWork.ApplicationUsers.GetByName(userId);
            var sessions = _unitOfWork.ChatSessions
                .GetQueryable()
                .Where(s => s.User.Id == user!.Id && !s.IsClosed)
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
            return await _unitOfWork.Messages
                .FindAll(x => x.ChatSessionId == sessionId);
        }

        public async Task<Message?> GetMessageAsync(int messageId)
        {
            return await _unitOfWork.Messages.GetById(messageId);
        }

        public async Task<bool> UpdateMessageStatusAsync(int messageId, MessageStatus status)
        {
            var message = await _unitOfWork.Messages.GetById(messageId);
            if (message == null) return false;

            message.Status = status;
            _unitOfWork.Messages.Update(message);
            _unitOfWork.Complete();

            return true;
        }

        public async Task<IEnumerable<ChatSession>> GetActiveSessionsAsync()
        {
            return await _unitOfWork.ChatSessions
                .FindAll(s => !s.IsClosed && s.AdminId == null);
        }

        public async Task AssignAdminToSessionAsync(int sessionId, string adminId)
        {
            var session = await _unitOfWork.ChatSessions.GetById(sessionId);
            if (session == null) return;

            session.AdminId = adminId;
            _unitOfWork.ChatSessions.Update(session);
            _unitOfWork.Complete();
        }

    }
}