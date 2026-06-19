using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Infrastructure.Persistence;

public static class DbInitializer
{
    private const string DefaultPassword = "Password123!";

    public static async Task SeedAsync(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        ILogger? logger = null,
        CancellationToken ct = default)
    {
        try
        {
            var hashedPassword = passwordHasher.HashPassword(DefaultPassword);

            var coreUsers = new (string Username, string Email)[]
            {
                ("admin_user", "admin@messenger.local"),
                ("alex_rivers", "alex.rivers@messenger.local"),
                ("sarah_connor", "sarah.connor@messenger.local"),
                ("david_kim", "david.kim@messenger.local"),
                ("elena_rostova", "elena.rostova@messenger.local"),
            };

            var dummyNames = new[]
            {
                "marcus_vance", "liam_nguyen", "chloe_zhao", "maya_patel", "jordan_taylor",
                "noah_centineo", "lucas_mendes", "sophia_chen", "emily_blunt", "alan_turing",
                "grace_hopper", "james_wilson", "zoe_saldana", "evelyn_cross", "oliver_twist",
                "isabella_rossi", "ethan_hunt", "daniel_craig", "nathan_drake", "mia_khalid",
                "ava_maxwell", "emma_watson", "william_shakespeare", "harper_lee", "benjamin_button",
                "henry_ford", "abigail_adams", "matthew_mcconaughey", "tom_hanks", "scarlett_johansson"
            };

            var allDefinitions = coreUsers
                .Concat(dummyNames.Select(name => (Username: name, Email: $"{name.Replace('_', '.')}@messenger.local")))
                .ToList();

            var userMap = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);

            foreach (var def in allDefinitions)
            {
                var existingUser = await context.Users
                    .FirstOrDefaultAsync(u => u.Email == def.Email || u.Username == def.Username, ct);

                if (existingUser == null)
                {
                    var avatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={def.Username}";
                    existingUser = User.Create(def.Email, def.Username, hashedPassword, avatarUrl);
                    context.Users.Add(existingUser);
                }

                userMap[def.Username] = existingUser;
            }

            await context.SaveChangesAsync(ct);

            var allUsers = await context.Users.Where(u => !u.IsDeleted).ToListAsync(ct);
            var leadUser = userMap.GetValueOrDefault("alex_rivers") ?? allUsers.First();

            var channelDefs = new (string Name, string Description, bool IsCompanyWide)[]
            {
                ("general", "Company-wide discussions and office banter", true),
                ("announcements", "Official updates, releases and town halls", true),
                ("frontend-craft", "React, TypeScript, Tailwind and UI/UX delights", false),
                ("backend-architecture", ".NET 10, PostgreSQL, Clean Architecture & APIs", false),
                ("design-system", "Figma tokens, accessibility and UI reviews", false),
                ("devops-cloud", "Kubernetes, Docker, CI/CD and cloud infra", false),
                ("product-roadmap", "Sprint planning and customer requests", false),
                ("ai-machine-learning", "LLM integrations, embeddings and AI features", false),
                ("random", "Non-work chats, memes and casual coffee talk", true),
                ("gaming-lounge", "PC gaming, console favorites and Friday game nights", true),
            };

            foreach (var ch in channelDefs)
            {
                var existingChannel = await context.Channels
                    .FirstOrDefaultAsync(c => c.Type == ChannelType.Group && c.Name == ch.Name, ct);

                if (existingChannel == null)
                {
                    var avatarUrl = $"https://api.dicebear.com/7.x/identicon/svg?seed={ch.Name}";
                    existingChannel = Channel.CreateGroup(ch.Name, leadUser.Id, ch.Description, avatarUrl);
                    context.Channels.Add(existingChannel);
                    await context.SaveChangesAsync(ct);
                }

                var targetMembers = ch.IsCompanyWide ? allUsers : allUsers.Take(15);

                foreach (var member in targetMembers)
                {
                    var isAlreadyMember = await context.ChannelMembers
                        .AnyAsync(m => m.ChannelId == existingChannel.Id && m.UserId == member.Id, ct);

                    if (!isAlreadyMember)
                    {
                        var role = member.Id == leadUser.Id ? ChannelMemberRole.Owner : ChannelMemberRole.Member;
                        var memberEntity = new ChannelMember(existingChannel.Id, member.Id, role);
                        context.Entry(memberEntity).State = EntityState.Added;
                    }
                }
            }

            await context.SaveChangesAsync(ct);

            var directPartners = new[]
            {
                "sarah_connor", "david_kim", "elena_rostova", "marcus_vance",
                "chloe_zhao", "liam_nguyen", "jordan_taylor", "maya_patel"
            };

            foreach (var partnerName in directPartners)
            {
                if (!userMap.TryGetValue(partnerName, out var partner)) continue;

                var directExists = await context.Channels
                    .Where(c => c.Type == ChannelType.Direct && !c.IsDeleted)
                    .AnyAsync(c =>
                        c.Members.Any(m => m.UserId == leadUser.Id) &&
                        c.Members.Any(m => m.UserId == partner.Id), ct);

                if (!directExists)
                {
                    context.Channels.Add(Channel.CreateDirect(leadUser.Id, partner.Id));
                }
            }

            await context.SaveChangesAsync(ct);
            logger?.LogInformation("Database seeded successfully ({Users} users, {Channels} groups).", allUsers.Count, channelDefs.Length);
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "An error occurred during database seeding.");
            throw;
        }
    }
}
