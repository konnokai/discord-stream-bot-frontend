export const discordOAuthStateKey = 'discordOAuthState';
export const discordOAuthReturnPathKey = 'discordOAuthReturnPath';

export const startDiscordOAuth = (clientId: string): void => {
  const state = Array.from(
    crypto.getRandomValues(new Uint8Array(32)),
    (value) => value.toString(16).padStart(2, '0')
  ).join('');
  sessionStorage.setItem(discordOAuthStateKey, state);
  sessionStorage.setItem(
    discordOAuthReturnPathKey,
    `${location.pathname}${location.search}${location.hash}`
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${location.origin}/`,
    response_type: 'code',
    scope: 'identify guilds',
    state
  });
  location.href = `https://discord.com/api/oauth2/authorize?${params}`;
};
