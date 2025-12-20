namespace Chat.WebUI.Services
{
    public interface IFileService
    {
        Task<string> UploadAsync(IFormFile file, string folder);
    }
}
