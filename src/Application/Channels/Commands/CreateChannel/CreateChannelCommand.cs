using FluentValidation;
using MediatR;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.CreateChannel;

public record CreateChannelCommand(
    Guid CreatorId,
    string Name,
    string? Description = null,
    string? AvatarUrl = null,
    List<Guid>? InitialMemberIds = null
) : IRequest<Result<ChannelDetailDto>>;

public class CreateChannelCommandValidator : AbstractValidator<CreateChannelCommand>
{
    public CreateChannelCommandValidator()
    {
        RuleFor(x => x.CreatorId)
            .NotEmpty().WithMessage("Creator ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Channel name is required.")
            .MinimumLength(2).WithMessage("Channel name must be at least 2 characters.")
            .MaximumLength(100).WithMessage("Channel name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Channel description cannot exceed 500 characters.");
    }
}

public class CreateChannelCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateChannelCommand, Result<ChannelDetailDto>>
{
    public async Task<Result<ChannelDetailDto>> Handle(CreateChannelCommand cmd, CancellationToken ct)
    {
        string normalizedName = cmd.Name.Trim();

        bool nameExists = await context.Channels
            .AnyAsync(c => c.Type == ChannelType.Group && c.Name!.ToLower() == normalizedName.ToLower(), ct);

        if (nameExists)
        {
            return Result.Failure<ChannelDetailDto>(
                Error.Conflict("Channel.NameConflict", $"A channel named '{normalizedName}' already exists."));
        }

        Channel channel = Channel.CreateGroup(normalizedName, cmd.CreatorId, cmd.Description, cmd.AvatarUrl);

        if (cmd.InitialMemberIds != null && cmd.InitialMemberIds.Count > 0)
        {
            List<Guid> distinctMembers = cmd.InitialMemberIds
                .Where(id => id != Guid.Empty && id != cmd.CreatorId)
                .Distinct()
                .ToList();

            if (distinctMembers.Count > 0)
            {
                List<Guid> validMemberIds = await context.Users
                    .Where(u => distinctMembers.Contains(u.Id) && !u.IsDeleted)
                    .Select(u => u.Id)
                    .ToListAsync(ct);

                foreach (Guid memberId in validMemberIds)
                {
                    channel.AddMember(memberId, ChannelMemberRole.Member);
                }
            }
        }

        context.Channels.Add(channel);
        await context.SaveChangesAsync(ct);

        return Result.Success(channel.ToDetailDto(cmd.CreatorId));
    }
}
