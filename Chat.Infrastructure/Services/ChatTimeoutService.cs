using Microsoft.AspNetCore.SignalR;
using Chat.Application.Interfaces.Services.Chat;
using Microsoft.Extensions.Hosting;
using Chat.Application.Interfaces.Services;

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
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var chatService = scope.ServiceProvider.GetRequiredService<IChatService>();
                        await ChatHub.CheckAndCloseInactiveChats(_hubContext, chatService);
                    }
                }
                catch (Exception ex)
                {
                    // Log exception (if logger was injected)
                    // For now we just suppress to prevent service crash
                }
            }
        }
    }
}
