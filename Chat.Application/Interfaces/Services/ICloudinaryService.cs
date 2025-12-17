namespace Chat.Application.Interfaces.Services
{
    public interface ICloudinaryService
    {
        Task<string?> UploadImageAsync(IFormFile file, string folder = "Chat/images");
        Task<string?> UpdateImageAsync(IFormFile newFile, string? existingUrl, string folder = "Chat/images");
        Task<string?> UploadPdfAsync(IFormFile file, string folder = "Chat/pdfs");
        Task<string?> UpdatePdfAsync(IFormFile newFile, string? existingUrl, string folder = "Chat/pdfs");

    }
}
