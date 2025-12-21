namespace Chat.Application.Services
{
    public class BaseService<T> : IBaseService<T> where T : class
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IBaseRepository<T> _repository;

        public BaseService(IUnitOfWork unitOfWork, IBaseRepository<T> repository)
        {
            _unitOfWork = unitOfWork;
            _repository = repository;
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            var all = await _repository.GetAll();
            var prop = typeof(T).GetProperty(nameof(BaseEntity.IsDeleted));

            if (prop != null)
                return all.Where(x => !(bool)(prop.GetValue(x) ?? false));

            return all;
        }


        public async Task<T?> GetByIdAsync(int id) =>
            await _repository.GetById(id);

        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _repository.FindAll(predicate, include: null, orderBy: null);
        }


        public async Task<T> AddAsync(T entity)
        {
            await _repository.Add(entity);
            _unitOfWork.Complete();
            return entity;
        }

        public async Task UpdateAsync(T entity)
        {
            _repository.Update(entity);
            await Task.Run(() => _unitOfWork.Complete());
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _repository.GetById(id);
            if (entity is null) return;

            var property = entity.GetType().GetProperty(nameof(BaseEntity.IsDeleted));
            if (property != null)
            {
                property.SetValue(entity, true);
                _repository.Update(entity);
            }
            else
            {
                _repository.Remove(entity);
            }

            await Task.Run(() => _unitOfWork.Complete());
        }

    }
}
