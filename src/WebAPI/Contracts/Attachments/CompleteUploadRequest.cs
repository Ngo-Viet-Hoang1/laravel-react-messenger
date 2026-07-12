using MessengerApp.Application.Attachments.Commands.CompleteUpload;

namespace MessengerApp.WebAPI.Contracts.Attachments;

public record CompleteUploadRequest(
    List<CompletePartRequest>? Parts = null
);
