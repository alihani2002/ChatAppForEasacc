using Microsoft.AspNetCore.Hosting;

namespace Chat.WebUI.Helper
{
    public class FileServices : IFileServices
    {
        private readonly IWebHostEnvironment _env;
        private const long MaxImageSize = 5 * 1024 * 1024;   // 5 MB
        private const long MaxCvSize = 20 * 1024 * 1024;     // 20 MB

        public FileServices(IWebHostEnvironment env)
        {
            _env = env;
        }

        // ====================== UPLOAD IMAGE ======================
        public async Task<string?> UploadImageAsync(IFormFile? file, string folder = "Portfolio/Image")
        {
            if (file == null || file.Length == 0)
                return null;

            if (file.Length > MaxImageSize)
                throw new InvalidOperationException("Image size cannot exceed 5 MB.");

            string uploadPath = Path.Combine(_env.WebRootPath, "Images", folder);

            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            string fullPath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/Images/{folder}/{fileName}";
        }

        // ====================== UPDATE IMAGE ======================
        public async Task<string?> UpdateImageAsync(IFormFile? newFile, string? existingUrl, string folder = "Portfolio/Image")
        {
            if (newFile == null)
                return existingUrl;

            // Delete old file
            DeleteFile(existingUrl);

            return await UploadImageAsync(newFile, folder);
        }

        // ====================== UPLOAD CV ======================
        public async Task<string?> UploadCvAsync(IFormFile? file, string folder = "Portfolio/Cv")
        {
            if (file == null || file.Length == 0)
                return null;

            if (file.Length > MaxCvSize)
                throw new InvalidOperationException("CV file size cannot exceed 20 MB.");

            string uploadPath = Path.Combine(_env.WebRootPath, "Images", folder);

            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            string fullPath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/Images/{folder}/{fileName}";
        }

        // ====================== UPDATE CV ======================
        public async Task<string?> UpdateCvAsync(IFormFile? newFile, string? existingUrl, string folder = "Portfolio/Cv")
        {
            if (newFile == null)
                return existingUrl;

            DeleteFile(existingUrl);

            return await UploadCvAsync(newFile, folder);
        }

        // ====================== DELETE FILE ======================
        private void DeleteFile(string? fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl))
                return;

            string fullPath = Path.Combine(_env.WebRootPath, fileUrl.TrimStart('/'));

            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
    }
}
