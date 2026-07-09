using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Infrastructure.Persistence;

public static class MessageSeeder
{
    public static async Task SeedAsync(
        AppDbContext context,
        ILogger? logger = null,
        bool force = false,
        CancellationToken ct = default)
    {
        try
        {
            if (!force)
            {
                int messageCount = await context.Messages.AsNoTracking().CountAsync(ct);
                if (messageCount >= 50)
                {
                    return;
                }
            }

            logger?.LogInformation("[MessageSeeder] Starting initial realistic message seeding (~280 messages)...");

            var users = await context.Users
                .AsNoTracking()
                .Where(u => !u.IsDeleted)
                .ToDictionaryAsync(u => u.Username, StringComparer.OrdinalIgnoreCase, ct);

            if (users.Count == 0)
            {
                logger?.LogWarning("[MessageSeeder] No users found. Skipping message seeding.");
                return;
            }

            var groupChannels = await context.Channels
                .Where(c => c.Type == ChannelType.Group && !c.IsDeleted)
                .ToDictionaryAsync(c => c.Name!, StringComparer.OrdinalIgnoreCase, ct);

            var directChannels = await context.Channels
                .Include(c => c.Members)
                .Where(c => c.Type == ChannelType.Direct && !c.IsDeleted)
                .ToListAsync(ct);

            var alex = users.GetValueOrDefault("alex_rivers") ?? users.Values.First();
            var sarah = users.GetValueOrDefault("sarah_connor") ?? users.Values.Skip(1).First();
            var david = users.GetValueOrDefault("david_kim") ?? users.Values.Skip(2).First();
            var elena = users.GetValueOrDefault("elena_rostova") ?? users.Values.Skip(3).First();
            var admin = users.GetValueOrDefault("admin_user") ?? users.Values.Skip(4).First();

            var teamUsers = new[] { alex, sarah, david, elena, admin };

            var messagesToInsert = new List<Message>();
            var now = DateTimeOffset.UtcNow;
            var random = new Random(42);

            context.ChangeTracker.AutoDetectChangesEnabled = false;

            if (groupChannels.TryGetValue("general", out var generalChannel))
            {
                SeedConversation(
                    generalChannel,
                    GeneralDialogue,
                    teamUsers,
                    now.AddDays(-14),
                    TimeSpan.FromMinutes(45),
                    messagesToInsert,
                    random,
                    count: 50
                );
            }

            var techChannel = groupChannels.GetValueOrDefault("releases-changelog")
                ?? groupChannels.GetValueOrDefault("backend-architecture")
                ?? groupChannels.GetValueOrDefault("announcements");

            if (techChannel != null)
            {
                SeedConversation(
                    techChannel,
                    BackendDialogue,
                    new[] { alex, david, sarah },
                    now.AddDays(-10),
                    TimeSpan.FromMinutes(30),
                    messagesToInsert,
                    random,
                    count: 45
                );
            }

            var devChannel = groupChannels.GetValueOrDefault("office-events")
                ?? groupChannels.GetValueOrDefault("frontend-craft")
                ?? groupChannels.GetValueOrDefault("gaming-lounge");

            if (devChannel != null)
            {
                SeedConversation(
                    devChannel,
                    FrontendDialogue,
                    new[] { sarah, elena, alex },
                    now.AddDays(-7),
                    TimeSpan.FromMinutes(35),
                    messagesToInsert,
                    random,
                    count: 40
                );
            }

            if (groupChannels.TryGetValue("random", out var randomChannel))
            {
                SeedConversation(
                    randomChannel,
                    RandomDialogue,
                    teamUsers,
                    now.AddDays(-5),
                    TimeSpan.FromMinutes(60),
                    messagesToInsert,
                    random,
                    count: 35
                );
            }

            if (groupChannels.TryGetValue("gaming-lounge", out var gamingChannel))
            {
                SeedConversation(
                    gamingChannel,
                    RandomDialogue,
                    new[] { david, alex, admin },
                    now.AddDays(-4),
                    TimeSpan.FromMinutes(50),
                    messagesToInsert,
                    random,
                    count: 30
                );
            }

            var direct = directChannels.FirstOrDefault(c => c.Members.Any(m => m.UserId == alex.Id));
            if (direct != null)
            {
                var otherMember = direct.Members.First(m => m.UserId != alex.Id);
                var partner = users.Values.FirstOrDefault(u => u.Id == otherMember.UserId) ?? sarah;

                SeedConversation(
                    direct,
                    DirectDialogue,
                    new[] { alex, partner },
                    now.AddDays(-3),
                    TimeSpan.FromMinutes(15),
                    messagesToInsert,
                    random,
                    count: 35
                );
            }

            if (messagesToInsert.Count > 0)
            {
                await context.Messages.AddRangeAsync(messagesToInsert, ct);

                foreach (var group in messagesToInsert.GroupBy(m => m.ChannelId))
                {
                    var latestMsgTime = group.Max(m => m.CreatedAt);
                    var ch = await context.Channels.FindAsync([group.Key], ct);
                    if (ch != null)
                    {
                        ch.LastModifiedAt = latestMsgTime;
                    }
                }

                await context.SaveChangesAsync(ct);
                logger?.LogInformation("[MessageSeeder] Successfully seeded {Count} realistic messages.", messagesToInsert.Count);
            }
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "[MessageSeeder] Error occurred while seeding messages.");
        }
        finally
        {
            context.ChangeTracker.AutoDetectChangesEnabled = true;
        }
    }

    private static void SeedConversation(
        Channel channel,
        string[] dialogue,
        User[] participants,
        DateTimeOffset startTime,
        TimeSpan averageInterval,
        List<Message> targetList,
        Random random,
        int count = 40)
    {
        var currentTime = startTime;
        Message? lastMessage = null;

        for (int i = 0; i < count; i++)
        {
            var sender = participants[i % participants.Length];
            var baseText = dialogue[i % dialogue.Length];
            var text = i < dialogue.Length ? baseText : $"{baseText} (follow-up #{i - dialogue.Length + 1})";

            Guid? parentId = (lastMessage != null && i % 6 == 0) ? lastMessage.Id : null;

            var msg = Message.Create(channel.Id, sender.Id, text, null, parentId);
            msg.CreatedAt = currentTime;

            if (i % 4 == 0)
            {
                var emojis = new[] { "👍", "❤️", "🚀", "🔥", "👀" };
                var chosenEmoji = emojis[random.Next(emojis.Length)];
                var reactor = participants[(i + 1) % participants.Length];
                msg.Reactions = [new MessageReactionItem(chosenEmoji, 1, [reactor.Id])];
            }

            targetList.Add(msg);
            lastMessage = msg;

            var jitterMinutes = random.Next((int)(averageInterval.TotalMinutes * 0.5), (int)(averageInterval.TotalMinutes * 1.5));
            currentTime = currentTime.AddMinutes(jitterMinutes);
        }
    }

    private static readonly string[] GeneralDialogue =
    [
        "Good morning everyone! Welcome to the new sprint.",
        "Morning team! Hope everyone had a restful weekend.",
        "Quick reminder: Company all-hands meeting is scheduled for Thursday at 3 PM UTC.",
        "Will the all-hands be recorded? I have a client sync at that exact time.",
        "Yes, as always! All recordings will be posted in #announcements right after the session.",
        "Awesome, thank you Alex!",
        "Just a heads up, the staging environment will undergo maintenance tonight between 10 PM and 11 PM UTC.",
        "Will database migrations be applied during this maintenance window?",
        "Yes, we are applying the PostgreSQL JSONB reactions migration and table optimizations.",
        "Please let us know if any services encounter downtime or connection drops.",
        "Everything looks green on Datadog so far. Great work on the release pipeline everyone!",
        "Kudos to the DevOps team for the smooth Kubernetes cluster upgrade.",
        "Has anyone reviewed the updated product roadmap for Q3?",
        "I went over the specs yesterday. The focus on real-time performance and offline sync looks very promising.",
        "Let's schedule a 30-minute design critique tomorrow morning for the new onboarding flow.",
        "Sounds good to me. I'll prepare the Figma prototype link.",
        "Don't forget to submit your monthly expense reports by Friday end of day.",
        "Thanks for the reminder, submitting mine now.",
        "Coffee machine on the 3rd floor is finally fixed! ☕",
        "Best news of the entire week! Heading up right now."
    ];

    private static readonly string[] BackendDialogue =
    [
        "Hey backend folks, how is the .NET 10 Clean Architecture migration progressing?",
        "Going very smoothly! All CQRS handlers for Channels and Messages are completed and tested.",
        "How are we handling concurrent reaction updates in PostgreSQL?",
        "We denormalized reactions into a JSONB column on the messages table with optimistic concurrency control using xmin.",
        "That eliminates the relational joins completely! What was the latency improvement?",
        "Response time dropped from 45ms to under 3ms on high concurrency tests. Zero lock contention.",
        "That's impressive. What about SignalR connection management?",
        "We're using ChatHub with group broadcasting. Each channel is an isolated SignalR group.",
        "Are we keeping track of typing indicators in Redis or in-memory?",
        "For now we have an in-memory concurrent dictionary with server-side auto-expiry timers. Works with zero latency.",
        "If we scale to multiple instances behind a load balancer, we can easily swap to Redis backplane.",
        "Agreed. Clean Architecture interfaces make switching infrastructure trivial.",
        "Has anyone benchmarked EF Core compiled queries vs raw Dapper for message pagination?",
        "Cursor pagination with keyset querying (`CreatedAt < beforeAt`) is already hitting index scans in under 1ms.",
        "Remember to always add `.AsNoTracking()` on read-only queries to avoid ChangeTracker overhead.",
        "Solid advice. We also enforced non-nullable reference types across all DTOs and commands.",
        "All 96 unit tests are green on the CI pipeline. Ready for the next milestone!"
    ];

    private static readonly string[] FrontendDialogue =
    [
        "Morning frontend team! Let's talk about the React 19 and Vite setup.",
        "Feature-Sliced Design (FSD) structure is feeling super clean so far.",
        "How did we solve the scroll jump issue when prepending older messages during infinite scroll?",
        "We implemented boundary tracking in `useChatScroll.ts`. We record `scrollHeight` before update and anchor `scrollTop` in `useLayoutEffect`.",
        "No more jarring viewport jumps! The user's eye stays locked on the exact pixel they were reading.",
        "What about the quoted reply UX? Did we go with inline quote or sidebar thread?",
        "Inline quote banner with smooth scroll navigation and toast fallback if the message is in older history.",
        "Did we extract the DOM scrolling logic out of `ChatWindow.tsx`?",
        "Yes, completely encapsulated into `useChatScroll`. `ChatWindow` is now purely declarative JSX.",
        "How is TanStack Query handling optimistic message sends?",
        "We generate a client UUID, inject into cache immediately, and replace with server confirmed DTO on SignalR `ReceiveMessage`.",
        "Instant snappy feel. Even on 3G throttling it feels like a native desktop app.",
        "Tailwind v4 CSS compile times are blazingly fast with the new Vite plugin.",
        "Lint check passed with 0 errors. Bundle size is well under 300KB gzip."
    ];

    private static readonly string[] RandomDialogue =
    [
        "Happy Friday everyone! Any fun weekend plans?",
        "Going hiking up in the mountains if the weather holds up!",
        "Playing the new RPG that just released yesterday. Goodbye weekend haha.",
        "Who is up for a quick game of chess during lunch break?",
        "Challenge accepted! Send me the link.",
        "Anyone tried that new ramen spot down the street?",
        "Yes! The spicy tonkotsu is incredible, definitely recommend.",
        "Remember to stretch and hydrate, folks! 💧",
        "Setting my Slack status to vacation mode in 3... 2... 1...",
        "Have a wonderful weekend all!"
    ];

    private static readonly string[] DirectDialogue =
    [
        "Hey Sarah, quick question about the security review specs.",
        "Sure Alex, what's on your mind?",
        "For the upcoming E2EE milestone, are we sticking with Web Crypto API ECDH P-256?",
        "Yes, absolutely. Native browser Web Crypto is hardware-accelerated and requires zero external npm packages.",
        "And we'll store the non-extractable private keys in IndexedDB, right?",
        "Exactly. That prevents XSS extraction and persists the cryptographic session across page reloads.",
        "Perfect. I'll make sure the backend endpoint only stores public keys and ciphertexts.",
        "Sounds like a plan! Let's sync up tomorrow after the standup."
    ];
}
