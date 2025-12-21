namespace Chat.Application.Services
{
    public class ChatAdminService : IChatAdminService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;   

        public ChatAdminService(IUnitOfWork unitOfWork ,IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }


        public async Task<List<ChatSessionDetailsVM>> GetSessionsByUserAsync(string userId)
        {
            var sessions = await _unitOfWork.ChatSessions.GetQueryable()
                .Where(s => s.UserId == userId)
                .Include(s => s.Messages)
                .OrderByDescending(s => s.CreatedOn)
                .ToListAsync();

            return _mapper.Map<List<ChatSessionDetailsVM>>(sessions);

        }


        public async Task<IEnumerable<ChatSessionVM>> GetAllActiveSessionsAsync()
        {
            var sessions = await _unitOfWork.ChatSessions.GetQueryable()
                .Where(c => !c.IsClosed).OrderByDescending(x => x.Id).ToListAsync();

            return _mapper.Map<List<ChatSessionVM>>(sessions);
        }

        public async Task<ChatSessionDetailsVM> GetSessionWithMessagesAsync(int sessionId)
        {
            var session = await _unitOfWork.ChatSessions
                .Find(x => x.Id == sessionId, q => q.Include(x => x.Messages));

            if (session == null)
                throw new Exception("Session not found");

            return _mapper.Map<ChatSessionDetailsVM>(session);
        }

    }
}
