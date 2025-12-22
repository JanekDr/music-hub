import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { setHubPlaylists } from "../store/playerSlice";
import { mapTrackToApiPayload } from "../services/mapTrackToApiPayload.js";
import authAPI from "../services/api.js";
import "../styles/AddToPlaylistModal.css"

const AddToPlaylistModal = ({ isOpen, onClose, track }) => {
    const dispatch = useDispatch();
    const hubPlaylists = useSelector(state => state.player.hubPlaylists);

    useEffect(() => {
        if (isOpen && hubPlaylists.length === 0) {
            authAPI.getUserPlaylists()
                .then(res => dispatch(setHubPlaylists(res.data)))
                .catch(err => console.log(err));
        }
    }, [dispatch, hubPlaylists.length, isOpen]);

    const onAddToPlaylist = async (playlistId) => {
        const payload = mapTrackToApiPayload(track);
        if (!payload) return null;

        try {
            await authAPI.addTrackToPlaylist(playlistId, {
                ...payload,
            });
            onClose();
        } catch (err) {
            console.error(err);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Wybierz playlistę</h3>

                <p style={{color: '#b3b3b3', fontSize: '0.9em', margin: '-15px 0 20px 0', textAlign: 'center'}}>
                    dla utworu: <span style={{color: '#1db954'}}>{track?.name || track.title}</span>
                </p>

                <ul className="playlist-list">
                    {hubPlaylists.map((playlist) => (
                        <li
                            key={playlist.id}
                            onClick={() => onAddToPlaylist(playlist.id)}
                            className="playlist-item"
                        >
                            {playlist.name}
                        </li>
                    ))}
                </ul>
                <button onClick={onClose}>Anuluj</button>
            </div>
        </div>
    )
};

export default AddToPlaylistModal;