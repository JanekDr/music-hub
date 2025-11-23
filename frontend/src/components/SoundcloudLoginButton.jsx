import { pkceChallengeFromVerifier, generateCodeVerifier } from '../services/pkce';
import { useAuth } from '../context/AuthContext';

const SoundcloudLoginButton = () => {
  const { user } = useAuth();

  const handleLogin = async () => {
    const code_verifier = generateCodeVerifier();
    const code_challenge = await pkceChallengeFromVerifier(code_verifier);
    localStorage.setItem('soundcloud_pkce_verifier', code_verifier);

    const params = new URLSearchParams({
      token: localStorage.getItem('accessToken'),
      code_challenge,
    });
    window.location.href = `http://127.0.0.1:8000/api/soundcloud/login/?${params.toString()}`;
  };

  return (
    <button onClick={handleLogin}>
      Połącz z SoundCloud
    </button>
  );
};

export default SoundcloudLoginButton;
