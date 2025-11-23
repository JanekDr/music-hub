import React from 'react';

const SpotifyLoginButton = () => {

  const handleLogin = () => {
    const token = localStorage.getItem('accessToken');
    console.log('Access token przed przekierowaniem:', token);

    if (!token) {
      alert('Nie jesteś zalogowany!');
      return;
    }

    window.location.href = `http://127.0.0.1:8000/api/spotify/login/?token=${token}`; //do zmiany music byc axios
  };

  return (
    <button onClick={handleLogin} style={{padding: '10px 20px', fontSize: '16px'}}>
      Zaloguj się przez Spotify
    </button>
  );
};

export default SpotifyLoginButton;
