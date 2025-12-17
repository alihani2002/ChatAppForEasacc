//using CloudinaryDotNet;
//using CloudinaryDotNet.Actions;
//using Microsoft.AspNetCore.Http;
//using Portfolio.Application.Interfaces.Services;

//namespace Portfolio.Infrastructure.Services
//{
//    public class CloudinaryService : ICloudinaryService
//    {
//        private readonly Cloudinary _cloudinary;
//        private const long MaxImageSize = 5 * 1024 * 1024;  // 5 MB
//        private const long MaxPdfSize = 20 * 1024 * 1024;   // 20 MB

//        public CloudinaryService(Cloudinary cloudinary)
//        {
//            _cloudinary = cloudinary ?? throw new ArgumentNullException(nameof(cloudinary));
//        }

//        public async Task<string?> UploadImageAsync(IFormFile file, string folder = "portfolio/images")
//        {
//            if (file == null || file.Length == 0)
//                throw new ArgumentException("No image file provided.");

//            if (file.Length > MaxImageSize)
//                throw new InvalidOperationException("Image size cannot exceed 5 MB.");

//            await using var stream = file.OpenReadStream();

//            var uploadParams = new ImageUploadParams
//            {
//                File = new FileDescription(file.FileName, stream),
//                Folder = folder,
//                UseFilename = true,
//                UniqueFilename = true,
//                Overwrite = false
//            };

//            var result = await _cloudinary.UploadAsync(uploadParams);

//            if (result.Error != null)
//                throw new Exception($"Cloudinary upload failed: {result.Error.Message}");

//            return result.SecureUrl?.ToString();
//        }

//        public async Task<string?> UploadPdfAsync(IFormFile file, string folder = "portfolio/pdfs")
//        {
//            if (file == null || file.Length == 0)
//                throw new ArgumentException("No PDF file provided.");

//            if (file.Length > MaxPdfSize)
//                throw new InvalidOperationException("PDF size cannot exceed 20 MB.");

//            await using var stream = file.OpenReadStream();

//            var uploadParams = new RawUploadParams
//            {
//                File = new FileDescription(file.FileName, stream),
//                Folder = folder,
//                UseFilename = true,
//                UniqueFilename = true,
//                Overwrite = false
//            };

//            var result = await _cloudinary.UploadAsync(uploadParams);

//            if (result.Error != null)
//                throw new Exception($"Cloudinary upload failed: {result.Error.Message}");

//            return result.SecureUrl?.ToString();
//        }

//        public async Task<string?> UpdateImageAsync(IFormFile newFile, string? existingUrl, string folder = "portfolio/images")
//        {
//            if (newFile == null)
//                return existingUrl;

//            // Optionally: delete old image from Cloudinary using its public ID (not implemented here)
//            return await UploadImageAsync(newFile, folder);
//        }
//    }
//}
