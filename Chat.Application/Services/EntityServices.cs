namespace Chat.Application.Services
{
    public class ApplicationUserService : BaseService<ApplicationUser>, IApplicationUserService
    {
        public ApplicationUserService(IUnitOfWork unitOfWork)
            : base(unitOfWork, unitOfWork.ApplicationUsers) { }
    }
 
}
