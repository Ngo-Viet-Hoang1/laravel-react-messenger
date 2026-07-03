using FluentValidation;
using MediatR;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.UpdateChannel;

public record UpdateChannelCommand(
    Guid ChannelId,
    Guid CurrentUserId,
    string Name,
    string? Description,
    string? AvatarUrl) : IRequest<Result<ChannelDetailDto>>;

public class UpdateChannelCommandValidator : AbstractValidator<UpdateChannelCommand>
{
    public UpdateChannelCommandValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Channel name is required.")
            .MaximumLength(100).WithMessage("Channel name must not exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");
    }
}

public class UpdateChannelCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateChannelCommand, Result<ChannelDetailDto>>
{
    public async Task<Result<ChannelDetailDto>> Handle(UpdateChannelCommand command, CancellationToken ct)
    {
        Channel? channel = await context.Channels
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == command.ChannelId && !c.IsDeleted, ct);

        if (channel == null)
        {
            return Result.Failure<ChannelDetailDto>(
                Error.NotFound("Channel.NotFound", "The requested channel does not exist or has been deleted."));
        }

        if (channel.Type != ChannelType.Group)
        {
            return Result.Failure<ChannelDetailDto>(
                Error.Validation("Channel.DirectCannotUpdate", "Direct message channels cannot be renamed or modified."));
        }

        ChannelMember? caller = channel.Members.FirstOrDefault(m => m.UserId == command.CurrentUserId);
        if (caller == null)
        {
            return Result.Failure<ChannelDetailDto>(
                Error.Forbidden("Channel.AccessDenied", "You are not a member of this channel."));
        }

        if (caller.Role != ChannelMemberRole.Owner && caller.Role != ChannelMemberRole.Admin)
        {
            return Result.Failure<ChannelDetailDto>(
                Error.Forbidden("Channel.NotAuthorized", "Only channel owners and administrators can update channel details."));
        }

        channel.UpdateDetails(command.Name, command.Description, command.AvatarUrl);
        await context.SaveChangesAsync(ct);

        return Result.Success(channel.ToDetailDto(command.CurrentUserId));
    }
}
