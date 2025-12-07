import { api } from "./interceptors";

export const soundcloudApi = {
    exchangeSoundcloudToken: (code, code_verifier, token) => api.post("/soundcloud/token-exchange/", { code, code_verifier, token }),
    getSoundcloudStatus: () => api.get("/soundcloud/user_status/"),
    soundcloudDisconnect: () => api.post("/soundcloud/disconnect/"),
    getSoundcloudUserInfo: () => api.get("/soundcloud/user/"),
    searchSoundcloudTracks: (query) => api.get("/soundcloud/search/", { params: { q: query } }),
    getTrackData:  (trackId) => api.get("/soundcloud/get_track_data/", { params: { track_id: trackId } }),
}

export default soundcloudApi;