using Microsoft.AspNetCore.SignalR;

namespace QuizzNetBackend.Hubs
{
    public class QuizzHub: Hub
    {
        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("ReceiveMessage", "Система", $"Добро пожаловать! Ваш ID: {Context.ConnectionId}");
            var userId = Context.UserIdentifier;
            await base.OnConnectedAsync();
        }

        public async Task JoinGame(string linkKey)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, linkKey);
        }
    }
}
