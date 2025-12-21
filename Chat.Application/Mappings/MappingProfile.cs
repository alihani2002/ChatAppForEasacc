using AutoMapper;
using Chat.Application.Models;
using Chat.Core.Entities;

namespace Chat.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {

            // Get All sessions of user Mappings in service ChatAdminService.cs name GetSessionsByUserAsync(userId)
            CreateMap<ChatSession, ChatSessionDetailsVM>()
                .ForMember(dest => dest.SessionId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Messages,opt => opt.MapFrom(src =>(src.Messages ?? new List<Message>())
                .OrderBy(m => m.CreatedOn)
                .ToList()
                ));
            CreateMap<Message, MessageVM>();


            // get active sessions Mappings in service ChatAdminService.cs name GetAllSessionsAsync()
            CreateMap<ChatSession, ChatSessionVM>()
                .ForMember(dest => dest.MessagesCount, 
                opt => opt.MapFrom(src => src.Messages != null ? src.Messages.Count : 0));


            // Get session with messages in chats Mappings in service ChatAdminService.cs name GetSessionWithMessagesAsync(sessionId)
            CreateMap<ChatSession , ChatSessionDetailsVM>()
                .ForMember(dest => dest.SessionId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.CreatedOn , opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Messages, opt => opt.MapFrom(src => (src.Messages ?? new List<Message>())
                .OrderBy(m => m.CreatedOn)
                .ToList()));
        }
    }
}