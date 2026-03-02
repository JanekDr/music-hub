import { pkceChallengeFromVerifier, generateCodeVerifier, generateState } from '../services/pkce';

const SoundcloudLoginButton = () => {
  const handleLogin = async () => {
    const code_verifier = generateCodeVerifier();
    const code_challenge = await pkceChallengeFromVerifier(code_verifier);
    localStorage.setItem('soundcloud_pkce_verifier', code_verifier);

    const state = generateState();
    localStorage.setItem('soundcloud_auth_state', state);
    const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
    const redirectUri = "http://127.0.0.1:3000/soundcloud/callback";

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      state: state,
      code_challenge: code_challenge,
      code_challenge_method: "S256",
    });

    window.location.href = `https://secure.soundcloud.com/authorize?${params.toString()}`;
  };

  return (
    <button onClick={handleLogin}>Połącz z SoundCloud</button>
  );
};

export default SoundcloudLoginButton;