export type GoogleLinkStatus = 'linked' | 'unlinked' | 'invalid';
export type TwitchLinkStatus = 'linked' | 'unlinked' | 'invalid' | 'revoked';

export type GoogleViewStatus = GoogleLinkStatus | 'authorizing' | 'error';
export type TwitchViewStatus = TwitchLinkStatus | 'authorizing' | 'error';

export interface GoogleAccountLink {
  status: GoogleLinkStatus;
  channelId?: string;
  userName?: string;
  profileImageUrl?: string;
  subscriptions: GoogleMemberSubscription[];
  cleanupPending: boolean;
}

export interface GoogleMemberSubscription {
  guildId: string;
  channelId: string;
  isChecked: boolean;
  pendingRoleRemoval: boolean;
  lastCheckedAt: string;
}

export interface TwitchAccountLink {
  status: TwitchLinkStatus;
  twitchUserId?: string;
  userLogin?: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface AccountLinks {
  google: GoogleAccountLink;
  twitch: TwitchAccountLink;
}

interface OAuthStartResponse {
  authorizationUrl: string;
}

export interface GoogleUnlinkResponse {
  status: 'unlinked';
  cleanupPending: boolean;
}

export interface TwitchUnlinkResponse {
  status: 'revoked' | 'revocation_pending';
  message: string;
}

export class AccountLinksApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`account_link_request_failed:${status}`);
    this.name = 'AccountLinksApiError';
    this.status = status;
  }
}

const authorizedRequest = async <T>(
  apiUrl: string,
  discordToken: string,
  path: string,
  method: 'GET' | 'POST' | 'DELETE'
): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${discordToken}`
    }
  });

  if (!response.ok) throw new AccountLinksApiError(response.status);
  if (response.status === 204) return undefined as unknown as T;

  return (await response.json()) as T;
};

export const getAccountLinks = (
  apiUrl: string,
  discordToken: string
): Promise<AccountLinks> =>
  authorizedRequest<AccountLinks>(
    apiUrl,
    discordToken,
    '/account-links',
    'GET'
  );

export const startOAuth = (
  apiUrl: string,
  discordToken: string,
  provider: 'google' | 'twitch'
): Promise<OAuthStartResponse> =>
  authorizedRequest<OAuthStartResponse>(
    apiUrl,
    discordToken,
    `/oauth/${provider}/start`,
    'POST'
  );

export function unlinkAccount(
  apiUrl: string,
  discordToken: string,
  provider: 'google'
): Promise<GoogleUnlinkResponse>;
export function unlinkAccount(
  apiUrl: string,
  discordToken: string,
  provider: 'twitch'
): Promise<TwitchUnlinkResponse>;
export function unlinkAccount(
  apiUrl: string,
  discordToken: string,
  provider: 'google' | 'twitch'
): Promise<GoogleUnlinkResponse | TwitchUnlinkResponse> {
  return authorizedRequest<GoogleUnlinkResponse | TwitchUnlinkResponse>(
    apiUrl,
    discordToken,
    `/account-links/${provider}`,
    'DELETE'
  );
}
