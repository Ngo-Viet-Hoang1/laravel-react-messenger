using FluentValidation;
using MediatR;
using MessengerApp.Application.Attachments.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Attachments.Queries.GetAttachmentStreamUrl;

public record GetAttachmentStreamUrlQuery(
    Guid ChannelId,
    Guid AttachmentId,
    Guid UserId
) : IRequest<Result<AttachmentStreamUrlDto>>;

public class GetAttachmentStreamUrlQueryValidator : AbstractValidator<GetAttachmentStreamUrlQuery>
{
    public GetAttachmentStreamUrlQueryValidator()
    {
        RuleFor(x => x.ChannelId).NotEmpty().WithMessage("Channel ID is required.");
        RuleFor(x => x.AttachmentId).NotEmpty().WithMessage("Attachment ID is required.");
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
    }
}

public class GetAttachmentStreamUrlQueryHandler(
    IApplicationDbContext context,
    IObjectStorageService storage)
    : IRequestHandler<GetAttachmentStreamUrlQuery, Result<AttachmentStreamUrlDto>>
{
    public async Task<Result<AttachmentStreamUrlDto>> Handle(
        GetAttachmentStreamUrlQuery query,
        CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers
            .AnyAsync(m => m.ChannelId == query.ChannelId && m.UserId == query.UserId, ct);

        if (!isMember)
        {
            return Result.Failure<AttachmentStreamUrlDto>(
                Error.Forbidden("Channel.NotMember", "You are not a member of this channel."));
        }

        MessageAttachment? attachment = await context.MessageAttachments
            .FirstOrDefaultAsync(a => a.Id == query.AttachmentId && a.ChannelId == query.ChannelId, ct);

        if (attachment == null || !attachment.IsUploadCompleted)
        {
            return Result.Failure<AttachmentStreamUrlDto>(
                Error.NotFound("Attachment.NotFound", "The specified attachment was not found or is not completed."));
        }

        TimeSpan expiry = TimeSpan.FromHours(2);
        DateTimeOffset expiresAt = DateTimeOffset.UtcNow.Add(expiry);
        string streamUrl = storage.GeneratePresignedReadUrl(attachment.StorageKey, expiry, null);

        return Result.Success(new AttachmentStreamUrlDto(attachment.Id, streamUrl, expiresAt));
    }
}
