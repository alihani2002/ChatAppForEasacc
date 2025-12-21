using Chat.Application.Interfaces.Services;
using System.Net;
using System.Net.Mail;

namespace Chat.Application.Services.Email
{
    public class EmailService : IEmailService
    {
        private readonly string _email = "";
        private readonly string _password = ""; // Gmail App Password

        public async Task SendAsync(string subject, string body)
        {
            var smtp = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_email, _password)
            };

            var msg = new MailMessage()
            {
                From = new MailAddress(_email),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            msg.To.Add(_email); // send notification to yourself

            await smtp.SendMailAsync(msg);
        }
    }
}
