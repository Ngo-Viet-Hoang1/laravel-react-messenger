using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MessengerApp.Infrastructure.Persistence.Configurations;

public class MessageAttachmentConfiguration : IEntityTypeConfiguration<MessageAttachment>
{
    public void Configure(EntityTypeBuilder<MessageAttachment> builder)
    {
        builder.ToTable("MessageAttachments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(a => a.StorageKey)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.ContentType)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(a => a.FileSizeBytes)
            .IsRequired();

        builder.Property(a => a.S3UploadId)
            .HasMaxLength(255);

        builder.Property(a => a.ThumbnailStorageKey)
            .HasMaxLength(500);

        builder.HasOne(a => a.Channel)
            .WithMany()
            .HasForeignKey(a => a.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Message)
            .WithMany(m => m.Attachments)
            .HasForeignKey(a => a.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.ChannelId);
        builder.HasIndex(a => a.MessageId);
        builder.HasIndex(a => a.StorageKey).IsUnique();
        builder.HasIndex(a => new { a.IsUploadCompleted, a.CreatedAt });

        builder.HasQueryFilter(a => !a.Channel.IsDeleted);
    }
}
