using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Attachments.Queries.GetUploadedParts;

public record GetUploadedPartsQuery(
    Guid ChannelId,
    Guid AttachmentId,
    Guid UserId
) : IRequest<Result<List<StoragePartDetail>>>;

public class GetUploadedPartsQueryValidator : AbstractValidator<GetUploadedPartsQuery>
{
    public GetUploadedPartsQueryValidator()
    {
        RuleFor(x => x.ChannelId).NotEmpty().WithMessage("Channel ID is required.");
        RuleFor(x => x.AttachmentId).NotEmpty().WithMessage("Attachment ID is required.");
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
    }
}

public class GetUploadedPartsQueryHandler(
    IApplicationDbContext context,
    IObjectStorageService storage)
    : IRequestHandler<GetUploadedPartsQuery, Result<List<StoragePartDetail>>>
{
    public async Task<Result<List<StoragePartDetail>>> Handle(
        GetUploadedPartsQuery query,
        CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers
            .AnyAsync(m => m.ChannelId == query.ChannelId && m.UserId == query.UserId, ct);

        if (!isMember)
        {
            return Result.Failure<List<StoragePartDetail>>(
                Error.Forbidden("Channel.NotMember", "You are not a member of this channel."));
        }

        MessageAttachment? attachment = await context.MessageAttachments
            .FirstOrDefaultAsync(a => a.Id == query.AttachmentId && a.ChannelId == query.ChannelId, ct);

        if (attachment == null)
        {
            return Result.Failure<List<StoragePartDetail>>(
                Error.NotFound("Attachment.NotFound", "The specified attachment was not found."));
        }

        if (string.IsNullOrWhiteSpace(attachment.S3UploadId))
        {
            return Result.Success(new List<StoragePartDetail>());
        }

        var parts = await storage.ListPartsAsync(attachment.StorageKey, attachment.S3UploadId, ct);
        return Result.Success(parts);
    }
}
