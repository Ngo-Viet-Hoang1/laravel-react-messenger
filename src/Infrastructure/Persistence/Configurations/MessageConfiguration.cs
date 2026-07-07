using System.Text.Json;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MessengerApp.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Content)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(m => m.ClientMessageId)
            .HasMaxLength(64);

        // ValueComparer ensures EF Core Change Tracker deeply compares JSON array contents
        var reactionComparer = new ValueComparer<List<MessageReactionItem>>(
            (c1, c2) => JsonSerializer.Serialize(c1, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(c2, (JsonSerializerOptions?)null),
            c => c == null ? 0 : JsonSerializer.Serialize(c, (JsonSerializerOptions?)null).GetHashCode(),
            c => JsonSerializer.Deserialize<List<MessageReactionItem>>(JsonSerializer.Serialize(c, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null) ?? new List<MessageReactionItem>()
        );

        // Denormalized Reactions stored as PostgreSQL JSONB column
        builder.Property(m => m.Reactions)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<MessageReactionItem>>(v, (JsonSerializerOptions?)null) ?? new List<MessageReactionItem>()
            )
            .Metadata.SetValueComparer(reactionComparer);

        // Enterprise Optimistic Concurrency Control using PostgreSQL's native xmin system column
        builder.Property<uint>("Version").IsRowVersion();

        builder.HasOne(m => m.Channel)
            .WithMany()
            .HasForeignKey(m => m.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(m => !m.IsDeleted && !m.Channel.IsDeleted);

        builder.HasIndex(m => new { m.ChannelId, m.CreatedAt });
        builder.HasIndex(m => new { m.ChannelId, m.SenderId, m.ClientMessageId });
    }
}
