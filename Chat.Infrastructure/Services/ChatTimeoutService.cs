using Chat.Application.Interfaces.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

namespace Chat.Infrastructure.Services
{
    public class ChatTimeoutService : BackgroundService
    {
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly PeriodicTimer _timer;

        public ChatTimeoutService(IHubContext<ChatHub> hubContext, IServiceScopeFactory scopeFactory)
        {
            _hubContext = hubContext;
            _scopeFactory = scopeFactory;
            _timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (await _timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested)
            {
                using (var scope = _scopeFactory.CreateScope())
                    {
                        var chatService = scope.ServiceProvider.GetRequiredService<IChatService>();
                        await ChatHub.CheckAndCloseInactiveChats(_hubContext, chatService);
                    }
              
            }
        }
    }
}
