namespace Chat.Application.Interfaces.Services
{
    public interface IEmailService
    {
        Task SendAsync(string subject, string body);
    }
}
