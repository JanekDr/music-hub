import React, { useState } from 'react';
import { FaMagic, FaSpotify, FaSoundcloud, FaPlus, FaChevronDown, FaChevronUp, FaCheck } from "react-icons/fa";
import { authAPI } from "../services/api";
import "../styles/AiSuggestions.css";

const AiSuggestions = ({ playlistSlug, onTrackAdd }) => {
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await authAPI.getSuggestions(playlistSlug);
            setSuggestions(res.data);
            setExpanded(true);
        } catch (err) {
            console.error("AI Error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!suggestions && !loading) {
        return (
            <div className="magic-btn-container">
                <button className="magic-btn" onClick={fetchSuggestions}>
                    <FaMagic /> Discover AI Magic ✨
                </button>
            </div>
        );
    }

    return (
        <div className={`ai-suggestions-wrapper card-glass ${expanded ? 'is-expanded' : ''}`}>
            <div className="suggestions-header" onClick={() => setExpanded(!expanded)}>
                <div className="header-text-center">
                    <span className="ai-badge">AI Discovery</span>
                    <h3>{suggestions?.insight.genre} vibes</h3>
                    <p className="mood-tag">Mood: {suggestions?.insight.mood}</p>
                </div>
                <div className="header-icon">
                    {expanded ? <FaChevronUp /> : <FaChevronDown />}
                </div>
            </div>

            {expanded && (
                <div className="suggestions-body">
                    {loading ? (
                        <div className="ai-loader-full">
                            <div className="spinner"></div>
                            <p>Analizuję Twoje brzmienie...</p>
                        </div>
                    ) : (
                        <div className="dual-column-layout">
                            <div className="suggestion-column">
                                <div className="column-title"><FaSpotify color="#1DB954" /> Spotify</div>
                                {suggestions.proposals.filter(r => r.spotify).map((rec, idx) => (
                                    <SuggestionCard
                                        key={`sp-${idx}`}
                                        track={rec.spotify}
                                        onAdd={onTrackAdd}
                                    />
                                ))}
                            </div>

                            <div className="suggestion-column">
                                <div className="column-title"><FaSoundcloud color="#FF5500" /> SoundCloud</div>
                                {suggestions.proposals.filter(r => r.soundcloud).map((rec, idx) => (
                                    <SuggestionCard
                                        key={`sc-${idx}`}
                                        track={rec.soundcloud}
                                        onAdd={onTrackAdd}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SuggestionCard = ({ track, onAdd }) => {
    const [added, setAdded] = useState(false);

    const handleAddClick = async () => {
        await onAdd(track);
        setAdded(true);
    };

    return (
        <div className="mini-track-card-glass">
            <img src={track.image_url} alt="" />
            <div className="info">
                <span className="name">{track.name}</span>
                <span className="author">{track.author}</span>
            </div>
            <button
                onClick={handleAddClick}
                className={`add-btn-circle ${added ? 'success' : ''}`}
                disabled={added}
            >
                {added ? <FaCheck /> : <FaPlus size={12} />}
            </button>
        </div>
    );
};

export default AiSuggestions;