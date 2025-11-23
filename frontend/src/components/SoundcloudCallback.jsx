import { useEffect } from 'react';
import { authAPI } from "../services/api.jsx";

const SoundcloudCallback = () => {
  useEffect(() => {
    async function fetchTokens() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const code_verifier = localStorage.getItem("soundcloud_pkce_verifier");
      const token = localStorage.getItem("accessToken");

      try {
        const response = await authAPI.exchangeSoundcloudToken(code, code_verifier, token);
        console.log('SoundCloud token:', response.data);
        window.location.href = `http://127.0.0.1:3000/dashboard`;
      } catch (error) {
        console.error('Error while exchanging tokens', error);
      }
    }
    fetchTokens();
  }, []);

  return <div>Łączenie z SoundCloud...</div>;
};

export default SoundcloudCallback;
