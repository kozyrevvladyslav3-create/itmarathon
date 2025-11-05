using CSharpFunctionalExtensions;
using Epam.ItMarathon.ApiService.Application.UseCases.User.Queries;
using Epam.ItMarathon.ApiService.Domain.Abstract;
using Epam.ItMarathon.ApiService.Domain.Shared.ValidationErrors;
using FluentValidation.Results;
using MediatR;
using RoomAggregate = Epam.ItMarathon.ApiService.Domain.Aggregate.Room.Room;

namespace Epam.ItMarathon.ApiService.Application.UseCases.User.Handlers
{
    public class DeleteUserHandler(IRoomRepository roomRepository)
        : IRequestHandler<DeleteUserRequest, Result<RoomAggregate, ValidationResult>>
    {
        public async Task<Result<RoomAggregate, ValidationResult>> Handle(DeleteUserRequest request,
            CancellationToken cancellationToken)
        {
            //1. Get room code from UserCode
            var roomResult = await roomRepository.GetByUserCodeAsync(request.UserCode, cancellationToken);
            if (roomResult.IsFailure)
            {
                return roomResult;
            }
            //2. Delete user by id in User's room - room DeleteUser(userId)
            var room = roomResult.Value;
            var deleteResult = room.DeleteUser(request.UserId);
            if (deleteResult.IsFailure)
            {
                return deleteResult;
            }
            //3. Update room in repository
            var updateResult = await roomRepository.UpdateAsync(room, cancellationToken);
            if (updateResult.IsFailure)
            {
                return Result.Failure<RoomAggregate, ValidationResult>(new BadRequestError([
                    new ValidationFailure(string.Empty, updateResult.Error)
                ]));
            }
            //4. Get updated room
            var updatedRoomResult = await roomRepository.GetByUserCodeAsync(request.UserCode, cancellationToken);
            return updatedRoomResult;
        }
    }
}