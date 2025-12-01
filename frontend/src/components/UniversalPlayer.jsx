import {useEffect, useRef, useState} from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSpotifyToken, setDeviceId, setQueue, setCurrentTrackIndex } from "../store/playerSlice";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SpotifyAdapter } from "../adapters/SpotifyAdapter.js";
import {SoundcloudAdapter} from "../adapters/SoundcloudAdapter.js";
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

  const [spAdapter, setSpAdapter] = useState(null);
  const [scAdapter, setScAdapter] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [progress, setProgress] = useState(0);
  const [trackImg, setTrackImg] = useState("");
  const [showQueue, setShowQueue] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const adapterRef = useRef(null);

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
    if (!spotifyToken || spAdapter) return;

    const newAdapter = new SpotifyAdapter(
      () => store.getState().player.spotifyToken,
      () => store.getState().player.deviceId,
      devId => dispatch(setDeviceId(devId)),
      state => {
        if (!state) return;
        setPlaying(!state.paused);
        setTrackName(state.track_window.current_track.name);
        setArtistName(state.track_window.current_track.artists.map(a => a.name).join(", "));
        setAlbumName(state.track_window.current_track.album.name);
        setTrackImg(state.track_window.current_track.album.images?.[0]?.url);
        setProgress(state.duration ? (state.position / state.duration) * 100 : 0);
      },
      () => {
        console.log("skonczyl sie track");
        next();
      }
    );

    newAdapter.init();
    adapterRef.current = newAdapter;
    setSpAdapter(newAdapter);
  }, [spotifyToken, spAdapter, dispatch]);

  //SOUNDCLOUD INIT
  useEffect(() => {
    if (scAdapter) return;

    const a = new SoundcloudAdapter(
      () => {
        const state = store.getState();
        const queue = state.player.queue;
        const index = state.player.currentTrackIndex || 0;
        const tracks = (queue[0]?.queue_tracks) || [];
        return tracks[index] || null;
      },
      scState => {
        if (!scState) return;
        if (typeof scState.playing === "boolean") setPlaying(scState.playing);
        if (typeof scState.progress === "number") setProgress(scState.progress);
      },
      () => {
        console.log("SC: skonczyl sie track");
        next();                                      // ta sama kolejka
      }
    );
    a.init();
    setScAdapter(a);
  }, [scAdapter, queueTracks, currentTrackIndex]);

  const pause = () => {
    if (!spAdapter) return;
    spAdapter.pause();
  };

const resume = async () => {
  const track = queueTracks[currentTrackIndex];
  if (!track) return;

  const platform = track.track.platform;

  if (platform === "spotify") {
    console.log("Spotify playing");
    if (!spAdapter) return;
    const deviceId = store.getState().player.deviceId;
    if (!deviceId) return;

    if (!isStarted) {
      setIsStarted(true);
      await spAdapter.transferPlayback(deviceId);
      setTimeout(() => {
        spAdapter.playUris([track.track.url]);
      }, 700);
    } else {
      spAdapter.resume();
    }
  }

  if (platform === "soundcloud") {
    console.log("Soundcloud playing");
    console.log(queueTracks[currentTrackIndex]);
    if (!scAdapter) return;
    await scAdapter.playCurrent();
  }
};


  const next = () => {
    const a = adapterRef.current;

    const state = store.getState();
    const queueState = state.player.queue;
    const currentIndex = state.player.currentTrackIndex || 0;
    const tracks = (queueState[0]?.queue_tracks) || [];

    if (tracks.length === 0) return;
    if (currentIndex + 1 >= tracks.length) return;

    const nextIndex = currentIndex + 1;
    const nextTrack = tracks[nextIndex];
    const nextUri = nextTrack.track.url;

    dispatch(setCurrentTrackIndex(nextIndex));
    a.playUris([nextUri]);
    setIsStarted(true);
  };

  const previous = () => {
    if (!spAdapter) return;
    if (queueTracks.length === 0) return;
    if (currentTrackIndex === 0) return;

    const prevIndex = currentTrackIndex - 1;
    dispatch(setCurrentTrackIndex(prevIndex));
    const prevUri = queueTracks[prevIndex].track.url;
    spAdapter.playUris([prevUri]);
    setIsStarted(true);
  };

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
