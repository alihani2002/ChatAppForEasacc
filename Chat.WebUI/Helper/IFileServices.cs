namespace Chat.WebUI
{
    public interface IFileServices
    {
        Task<string?> UploadImageAsync(IFormFile file, string folder = "Portfolio/Image");
        Task<string?> UpdateImageAsync(IFormFile newFile, string? existingUrl, string folder = "Portfolio/Image");
        Task<string?> UploadCvAsync(IFormFile file, string folder = "Portfolio/Cv");
        Task<string?> UpdateCvAsync(IFormFile newFile, string? existingUrl, string folder = "Portfolio/Cv");
    }
}
