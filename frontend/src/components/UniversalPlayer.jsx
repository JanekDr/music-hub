import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSpotifyToken, setDeviceId, setQueue, setCurrentTrackIndex } from "../store/playerSlice";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SpotifyAdapter } from "../adapters/SpotifyAdapter.js";
import { FaStepBackward, FaStepForward, FaPlay, FaPause, FaWindowMinimize, FaVolumeUp } from "react-icons/fa";
import { PiQueueBold } from "react-icons/pi";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { useSortable, SortableContext, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../styles/spotifyPlayer.css";
import store from "../store/index.js";

const UniversalPlayer = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const spotifyToken = useSelector(state => state.player.spotifyToken);
  const queue = useSelector(state => state.player.queue);
  const currentTrackIndex = useSelector(state => state.player.currentTrackIndex || 0);
  const queueTracks = (queue[0]?.queue_tracks) || [];

  const [adapter, setAdapter] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [progress, setProgress] = useState(0);
  const [trackImg, setTrackImg] = useState("");
  const [showQueue, setShowQueue] = useState(false);

  // 1. Token + kolejka
  useEffect(() => {
    if (isAuthenticated && !spotifyToken) {
      authAPI.getSpotifyToken()
        .then(res => dispatch(setSpotifyToken(res.data.access_token)))
        .catch(() => dispatch(setSpotifyToken(null)));

      authAPI.getQueue()
        .then(res => dispatch(setQueue(res.data)))
        .catch(() => dispatch(setQueue([])));
    }
  }, [isAuthenticated, spotifyToken, dispatch]);

  useEffect(() => {
  if (!spotifyToken) return;

  const newAdapter = new SpotifyAdapter(
    () => store.getState().player.spotifyToken,
      () => store.getState().player.deviceId,
    (devId) => {
      dispatch(setDeviceId(devId));
    },
    (state) => {
      if (!state) return;
        setPlaying(!state.paused);
        setTrackName(state.track_window.current_track.name);
        setArtistName(state.track_window.current_track.artists.map(a => a.name).join(", "));
        setAlbumName(state.track_window.current_track.album.name);
        setTrackImg(state.track_window.current_track.album.images?.[0]?.url);
        setProgress(state.duration ? (state.position / state.duration) * 100 : 0);
    }
  );

  newAdapter.init();
  setAdapter(newAdapter);
}, [spotifyToken]);

  // 3. Sterowanie kolejką

  // const playCurrentFromQueue = () => {
  //   if (!adapter) return;
  //   const track = queueTracks[currentTrackIndex];
  //   if (!track) return;
  //   const uri = track.track.url;      // w Twoim modelu queue -> track.url = spotify uri
  //   adapter.playUris([uri]);
  // };

  const pause = () => {
    if (!adapter) return;
    adapter.pause();
  };

  const resume = () => {
    if (!adapter) return;
    if (playing) {
      adapter.pause();
    } else {
      const track = queueTracks[currentTrackIndex];
      if (track) {
        adapter.playUris([track.track.url]);
      } else {
        adapter.resume();
      }
    }
  };

  const next = () => {
    if (!adapter) return;
    if (queueTracks.length === 0) return;
    if (currentTrackIndex + 1 >= queueTracks.length) return;

    const nextIndex = currentTrackIndex + 1;
    dispatch(setCurrentTrackIndex(nextIndex));
    const nextUri = queueTracks[nextIndex].track.url;
    adapter.playUris([nextUri]);
  };

  const previous = () => {
    if (!adapter) return;
    if (queueTracks.length === 0) return;
    if (currentTrackIndex === 0) return;

    const prevIndex = currentTrackIndex - 1;
    dispatch(setCurrentTrackIndex(prevIndex));
    const prevUri = queueTracks[prevIndex].track.url;
    adapter.playUris([prevUri]);
  };

  // 4. Operacje na kolejce (remove, drag&drop, zapis)

  const handleRemove = async (id) => {
    const updatedQueue = queueTracks.filter(track => track.id !== id);
    try {
      await authAPI.removeFromQueue({ data: { queue_track_id: id } });
      dispatch(setQueue([{ ...queue[0], queue_tracks: updatedQueue }]));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = queueTracks.findIndex(track => track.id === active.id);
    const newIndex = queueTracks.findIndex(track => track.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newTracks = arrayMove(queueTracks, oldIndex, newIndex);
    dispatch(setQueue([{ ...queue[0], queue_tracks: newTracks }]));
  };

  const handleSubmitQueue = async () => {
    const queueTrackIds = queueTracks.map(track => track.id);
    try {
      await authAPI.reorderQueue({ 'queue_track_ids': queueTrackIds });
    } catch (error) {
      console.error(error);
    }
  };

  // 5. DnD item
  const DraggableQueueItem = ({ track, idx }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: track.id });

    return (
      <li
        ref={setNodeRef}
        className={idx === currentTrackIndex ? "active-track" : ""}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span
          {...attributes}
          {...listeners}
          style={{
            cursor: "grab",
            marginRight: 12,
            userSelect: "none"
          }}
          aria-label="Przeciągnij"
        >
          ☰
        </span>
        <div className="track-info">
          <div>{track.track.name}</div>
          <div>{track.track.author}</div>
        </div>
        <button
          className="remove-btn"
          onClick={() => handleRemove(track.id)}
        >
          &minus;
        </button>
      </li>
    );
  };

  if (!spotifyToken || !isAuthenticated) return null;

  return (
    <div style={{ position: "relative" }}>
      <div className="spotify-player-bar">
        <div className="left-section">
          <div className="track-cover-placeholder">
            <img
              src={trackImg}
              alt={trackName}
              className="track-image"
            />
          </div>
          <div className="track-meta">
            <div className="track-name">{trackName || "Brak utworu"}</div>
            <div className="artist-name">{artistName || "Brak wykonawcy"}</div>
            <div className="album-name">{albumName || ""}</div>
          </div>
        </div>
        <div className="center-section">
          <div className="player-controls">
            <button className="player-controls-button" onClick={previous} aria-label="Previous"><FaStepBackward /></button>
            {playing ? (
              <button className="player-controls-button" onClick={pause} aria-label="Pause"><FaPause /></button>
            ) : (
              <button className="player-controls-button" onClick={resume} aria-label="Resume"><FaPlay /></button>
            )}
            <button className="player-controls-button" onClick={next} aria-label="Next"><FaStepForward /></button>
          </div>
          <div className="progress-bar">
            <div className="progress-filled" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="right-section">
          <button className="player-controls-button" onClick={() => setShowQueue(!showQueue)} aria-label=""><PiQueueBold /></button>
          <button className="player-controls-button" onClick={() => { }} aria-label="Change volume"><FaVolumeUp /></button>
        </div>
      </div>

      {showQueue && (
        <div className="queue-sidebar">
          <div className="queue-header">
            <span>Kolejka</span>
            <button className="player-controls-button" onClick={() => setShowQueue(false)}><FaWindowMinimize /></button>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={queueTracks.map(q => q.id)}>
              <ul className="queue-list">
                {queueTracks.map((track, idx) => (
                  <DraggableQueueItem
                    key={track.id}
                    track={track}
                    idx={idx}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <div className="submit-button">
            <button type="submit" className="player-controls-button" onClick={handleSubmitQueue}>Zapisz</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalPlayer;
