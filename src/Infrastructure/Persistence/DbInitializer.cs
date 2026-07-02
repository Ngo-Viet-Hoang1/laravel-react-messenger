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
            // Short-circuit: skip immediately if core data already exists (<2ms)
            bool isAlreadySeeded = await context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Email == "admin@messenger.local", ct);

            if (isAlreadySeeded)
            {
                bool hasChannels = await context.Channels
                    .AsNoTracking()
                    .AnyAsync(c => c.Type == ChannelType.Group, ct);

                if (hasChannels) return;
            }

            string hashedPassword = passwordHasher.HashPassword(DefaultPassword);

            (string Username, string Email)[] coreUsers =
            [
                ("admin_user", "admin@messenger.local"),
                ("alex_rivers", "alex.rivers@messenger.local"),
                ("sarah_connor", "sarah.connor@messenger.local"),
                ("david_kim", "david.kim@messenger.local"),
                ("elena_rostova", "elena.rostova@messenger.local"),
            ];

            string[] dummyNames =
            [
                "marcus_vance", "liam_nguyen", "chloe_zhao", "maya_patel", "jordan_taylor",
                "noah_centineo", "lucas_mendes", "sophia_chen", "emily_blunt", "alan_turing",
                "grace_hopper", "james_wilson", "zoe_saldana", "evelyn_cross", "oliver_twist",
                "isabella_rossi", "ethan_hunt", "daniel_craig", "nathan_drake", "mia_khalid",
                "ava_maxwell", "emma_watson", "william_shakespeare", "harper_lee", "benjamin_button",
                "henry_ford", "abigail_adams", "matthew_mcconaughey", "tom_hanks", "scarlett_johansson"
            ];

            List<(string Username, string Email)> allDefinitions = coreUsers
                .Concat(dummyNames.Select(name => (Username: name, Email: $"{name.Replace('_', '.')}@messenger.local")))
                .ToList();

            List<User> existingUsers = await context.Users
                .Where(u => !u.IsDeleted)
                .ToListAsync(ct);

            Dictionary<string, User> userMap = existingUsers.ToDictionary(u => u.Username, StringComparer.OrdinalIgnoreCase);
            List<User> newUsers = [];

            foreach ((string Username, string Email) def in allDefinitions)
            {
                if (!userMap.TryGetValue(def.Username, out User? user))
                {
                    string avatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={def.Username}";
                    user = User.Create(def.Email, def.Username, hashedPassword, avatarUrl);
                    newUsers.Add(user);
                    userMap[def.Username] = user;
                }
            }

            if (newUsers.Count > 0)
            {
                await context.Users.AddRangeAsync(newUsers, ct);
                await context.SaveChangesAsync(ct);
            }

            List<User> allUsers = userMap.Values.ToList();
            User leadUser = userMap.GetValueOrDefault("alex_rivers") ?? allUsers.First();

            (string Name, string Description, bool IsCompanyWide)[] channelDefs =
            [
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
            ];

            List<Channel> existingChannels = await context.Channels
                .Include(c => c.Members)
                .Where(c => c.Type == ChannelType.Group && !c.IsDeleted)
                .ToListAsync(ct);

            Dictionary<string, Channel> channelMap = existingChannels.ToDictionary(c => c.Name!, StringComparer.OrdinalIgnoreCase);
            List<Channel> newChannels = [];
            List<ChannelMember> newMembers = [];

            foreach ((string Name, string Description, bool IsCompanyWide) ch in channelDefs)
            {
                if (!channelMap.TryGetValue(ch.Name, out Channel? channel))
                {
                    string avatarUrl = $"https://api.dicebear.com/7.x/identicon/svg?seed={ch.Name}";
                    channel = Channel.CreateGroup(ch.Name, leadUser.Id, ch.Description, avatarUrl);
                    newChannels.Add(channel);
                    channelMap[ch.Name] = channel;
                }

                HashSet<Guid> existingMemberIds = channel.Members.Select(m => m.UserId).ToHashSet();
                IEnumerable<User> targetMembers = ch.IsCompanyWide ? allUsers : allUsers.Take(15);

                foreach (User member in targetMembers)
                {
                    if (existingMemberIds.Add(member.Id))
                    {
                        ChannelMemberRole role = member.Id == leadUser.Id ? ChannelMemberRole.Owner : ChannelMemberRole.Member;
                        newMembers.Add(new ChannelMember(channel.Id, member.Id, role));
                    }
                }
            }

            if (newChannels.Count > 0)
            {
                await context.Channels.AddRangeAsync(newChannels, ct);
            }

            if (newMembers.Count > 0)
            {
                await context.ChannelMembers.AddRangeAsync(newMembers, ct);
            }

            if (newChannels.Count > 0 || newMembers.Count > 0)
            {
                await context.SaveChangesAsync(ct);
            }

            string[] directPartners =
            [
                "sarah_connor", "david_kim", "elena_rostova", "marcus_vance",
                "chloe_zhao", "liam_nguyen", "jordan_taylor", "maya_patel"
            ];

            List<Channel> existingDirectChannels = await context.Channels
                .Include(c => c.Members)
                .Where(c => c.Type == ChannelType.Direct && !c.IsDeleted)
                .ToListAsync(ct);

            HashSet<string> existingDirectPairs = [];
            foreach (Channel directChannel in existingDirectChannels)
            {
                List<Guid> memberIds = directChannel.Members.Select(m => m.UserId).OrderBy(id => id).ToList();
                if (memberIds.Count == 2)
                {
                    existingDirectPairs.Add($"{memberIds[0]}_{memberIds[1]}");
                }
            }

            List<Channel> newDirectChannels = [];
            foreach (string partnerName in directPartners)
            {
                if (!userMap.TryGetValue(partnerName, out User? partner)) continue;

                string pairKey = leadUser.Id.CompareTo(partner.Id) < 0
                    ? $"{leadUser.Id}_{partner.Id}"
                    : $"{partner.Id}_{leadUser.Id}";

                if (existingDirectPairs.Add(pairKey))
                {
                    newDirectChannels.Add(Channel.CreateDirect(leadUser.Id, partner.Id));
                }
            }

            if (newDirectChannels.Count > 0)
            {
                await context.Channels.AddRangeAsync(newDirectChannels, ct);
                await context.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "An error occurred during database seeding.");
            throw;
        }
    }
}
