import { useEffect, useRef, useState } from 'react';
import { soundcloudApi } from "../services/soundcloudApi.js";

const SoundcloudCallback = () => {
  const hasFetched = useRef(false);
  const [status, setStatus] = useState("Security verification...");

  useEffect(() => {
    if (hasFetched.current) return;

    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const returnedState = params.get("state");
      const error = params.get("error");

      if (error) {
          setStatus(`Authorization error: ${error}`);
          return;
      }

      const storedState = localStorage.getItem('soundcloud_auth_state');

      if (!returnedState || returnedState !== storedState) {
          console.error("Security error: State mismatch!");
          setStatus("Security error: Invalid state parametr, CSRF attack? ");
          localStorage.removeItem('soundcloud_auth_state');
          localStorage.removeItem('soundcloud_pkce_verifier');
          return;
      }

      const code_verifier = localStorage.getItem("soundcloud_pkce_verifier");
      if (!code || !code_verifier) {
          setStatus("Error: Invalid code verifier!.");
          return;
      }

      hasFetched.current = true;
      setStatus("Token exchanging...");

      try {
        await soundcloudApi.exchangeSoundcloudToken(code, code_verifier);

        setStatus("Success!");
        localStorage.removeItem("soundcloud_pkce_verifier");
        localStorage.removeItem("soundcloud_auth_state");

        window.location.href = `http://127.0.0.1:3000/dashboard`;

      } catch (error) {
        console.error(error);
        setStatus("Server error during token exchanging...");
      }
    };

    processCallback();
  }, []);

  return <div>{status}</div>;
};

export default SoundcloudCallback;