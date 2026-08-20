export interface AdminGuild {
  id: string;
  name: string;
  icon?: string | null;
  owner: boolean;
  permissions: string;
  botInstalled: boolean;
}

export interface AdminChannel {
  id: string;
  name: string;
  type?: string;
  canView: boolean;
  canSendMessages: boolean;
  canEmbedLinks: boolean;
  canManageEvents?: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  position: number;
  managed: boolean;
  everyone: boolean;
  botCanManage: boolean;
}

export interface AdminCrawlerItem {
  sourceId: string;
  sourceName: string;
}

export interface AdminCrawlerPlatform {
  enabled: boolean;
  count: number;
  limit: number;
  items: AdminCrawlerItem[];
}

export interface GuildSettingsSnapshot {
  contractVersion: number;
  capabilities: string[];
  guild: { id: string; name: string; memberCount?: number };
  health: { botConnected?: boolean };
  resources: { channels: AdminChannel[]; roles: AdminRole[] };
  common: {
    locale?: string;
    globalNoticeChannelId?: string;
    verificationLogChannelId?: string;
  };
  notifications: {
    youtube: Array<{
      sourceId: string;
      sourceName?: string;
      streamChannelId: string;
      videoChannelId: string;
      createEvent: boolean;
      messages?: Record<string, string>;
      detectionEnabled?: boolean;
    }>;
    twitch: Array<{
      sourceId: string;
      sourceName?: string;
      channelId: string;
      messages?: Record<string, string>;
      detectionEnabled?: boolean;
    }>;
    twitcasting: Array<{
      sourceId: string;
      sourceName?: string;
      channelId: string;
      startMessage?: string;
      detectionEnabled?: boolean;
    }>;
  };
  crawlers: Record<'youtube' | 'twitch' | 'twitcasting', AdminCrawlerPlatform>;
  verification: {
    youtube: Array<{
      sourceId: string;
      sourceName: string;
      roleId: string;
      previousRoleId: string | null;
      deletionPending: boolean;
      probeMode: 'automatic' | 'manual';
      probeVideoId: string;
      verifiedMemberCount: number;
      pendingRoleRemovalCount: number;
    }>;
    twitch: Array<{
      sourceId: string;
      sourceLogin: string;
      sourceName: string;
      subscriberRoleId: string;
      previousSubscriberRoleId: string | null;
      tierRoleIds: Record<'1000' | '2000' | '3000', string>;
      deletionPending: boolean;
      verifiedMemberCount: number;
      pendingRoleRemovalCount: number;
    }>;
  };
}

export type AdminMutationAction =
  | 'guild.set-locale'
  | 'guild.set-global-notice-channel'
  | 'guild.set-verification-log-channel'
  | 'youtube-notification.upsert'
  | 'youtube-notification.remove'
  | 'twitch-notification.upsert'
  | 'twitch-notification.remove'
  | 'twitcasting-notification.upsert'
  | 'twitcasting-notification.remove'
  | 'youtube-crawler.add'
  | 'youtube-crawler.remove'
  | 'twitch-crawler.add'
  | 'twitch-crawler.remove'
  | 'twitcasting-crawler.add'
  | 'twitcasting-crawler.remove'
  | 'youtube-verification.upsert'
  | 'youtube-verification.remove'
  | 'youtube-verification.set-probe-video'
  | 'youtube-verification.use-automatic-probe'
  | 'twitch-verification.upsert'
  | 'twitch-verification.remove';

export type AdminReplyState =
  'applied' | 'pending' | 'rejected' | 'timeout' | 'unknown';

export interface AdminMutationReply {
  state: AdminReplyState;
  code?: string;
  message?: string;
  arguments?: Record<string, unknown>;
}

export class AdminSettingsApiError extends Error {
  constructor(
    readonly status: number,
    message?: string,
    readonly code?: string
  ) {
    super(message || `admin_settings_request_failed:${status}`);
    this.name = 'AdminSettingsApiError';
  }
}

const readBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined;

  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
};

const request = async (
  apiUrl: string,
  discordToken: string,
  path: string,
  init?: RequestInit
): Promise<Response> =>
  fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${discordToken}`,
      ...init?.headers
    }
  });

const getJson = async <T>(
  apiUrl: string,
  discordToken: string,
  path: string,
  init?: RequestInit
): Promise<T> => {
  const response = await request(apiUrl, discordToken, path, init);
  const body = await readBody(response);

  if (!response.ok)
    throw new AdminSettingsApiError(
      response.status,
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : undefined,
      typeof body === 'object' && body !== null && 'code' in body
        ? String(body.code)
        : undefined
    );

  return body as T;
};

export const getAdminGuilds = (apiUrl: string, discordToken: string) =>
  getJson<AdminGuild[]>(apiUrl, discordToken, '/admin/guilds');

export const getGuildSettings = (
  apiUrl: string,
  discordToken: string,
  guildId: string,
  signal?: AbortSignal
) =>
  getJson<GuildSettingsSnapshot>(
    apiUrl,
    discordToken,
    `/admin/guilds/${encodeURIComponent(guildId)}/settings`,
    { signal }
  );

const responseState = (response: Response, body: unknown): AdminReplyState => {
  const reply =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const value = reply.status ?? reply.state ?? reply.result;
  const state = typeof value === 'string' ? value.toLowerCase() : '';

  if (response.status === 504) return 'timeout';
  if (
    state === 'applied' ||
    state === 'pending' ||
    state === 'rejected' ||
    state === 'timeout' ||
    state === 'unknown'
  )
    return state;
  if (
    response.status === 200 ||
    response.status === 201 ||
    response.status === 204
  )
    return 'applied';
  if (response.status === 202) return 'pending';
  if (response.status >= 400 && response.status < 500) return 'rejected';
  return 'unknown';
};

export const mutateGuildSettings = async (
  apiUrl: string,
  discordToken: string,
  guildId: string,
  action: AdminMutationAction,
  payload: Record<string, unknown>
): Promise<AdminMutationReply> => {
  const response = await request(
    apiUrl,
    discordToken,
    `/admin/guilds/${encodeURIComponent(guildId)}/commands`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    }
  );
  const body = await readBody(response);
  const message =
    typeof body === 'object' && body !== null && 'message' in body
      ? String(body.message)
      : undefined;
  const code =
    typeof body === 'object' && body !== null && 'code' in body
      ? String(body.code)
      : undefined;
  const args =
    typeof body === 'object' &&
    body !== null &&
    'arguments' in body &&
    typeof body.arguments === 'object' &&
    body.arguments !== null
      ? (body.arguments as Record<string, unknown>)
      : undefined;

  return {
    state: responseState(response, body),
    code,
    message,
    arguments: args
  };
};
