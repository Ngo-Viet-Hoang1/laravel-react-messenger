import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

type TokenGetter = () => string | null;
let onGetToken: TokenGetter | null = null;

export const registerSignalRTokenGetter = (getter: TokenGetter): void => {
  onGetToken = getter;
};

const getHubUrl = (): string => {
  const customUrl = import.meta.env.VITE_HUB_URL;
  if (customUrl) return customUrl;

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5212/api';
  return apiBase.replace(/\/api\/?$/, '') + '/hubs/chat';
};

let hubConnection: HubConnection | null = null;
let startPromise: Promise<HubConnection> | null = null;

export const getSignalRConnection = (): HubConnection => {
  if (hubConnection) {
    return hubConnection;
  }

  hubConnection = new HubConnectionBuilder()
    .withUrl(getHubUrl(), {
      accessTokenFactory: () => onGetToken?.() ?? '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build();

  hubConnection.onreconnecting((err) => {
    console.warn('[SignalR] Connection lost, reconnecting...', err);
  });

  hubConnection.onreconnected((connectionId) => {
    console.info('[SignalR] Connection re-established:', connectionId);
  });

  hubConnection.onclose((err) => {
    if (err) {
      console.error('[SignalR] Connection closed with error:', err);
    }
    startPromise = null;
  });

  return hubConnection;
};

export const startSignalRConnection = async (): Promise<HubConnection> => {
  const token = onGetToken?.();
  if (!token) {
    throw new Error('[SignalR] Cannot connect without an access token.');
  }

  const connection = getSignalRConnection();

  if (connection.state === HubConnectionState.Connected) {
    return connection;
  }

  if (startPromise) {
    return startPromise;
  }

  startPromise = (async () => {
    try {
      if (connection.state === HubConnectionState.Disconnected) {
        await connection.start();
      }
      return connection;
    } catch (err) {
      console.error('[SignalR] Connection start failed:', err);
      throw err;
    } finally {
      startPromise = null;
    }
  })();

  return startPromise;
};

export const stopSignalRConnection = async (): Promise<void> => {
  if (hubConnection && hubConnection.state === HubConnectionState.Connected) {
    await hubConnection.stop();
  }
};

export { HubConnectionState };
