/**
 * GameSection.jsx — Adaptive Games Based on ASD Score
 * =====================================================
 * Games are recommended based on the user's current ASD score
 * Higher score = more calming/sensory games
 * Lower score = more cognitive/social games
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Game definitions with adaptive recommendations
const GAMES = [
    {
        id: 1,
        name: "रंग सामंजस्य",
        nameEn: "Color Harmony",
        description: "Match calming colors in a peaceful environment",
        type: "calming",
        icon: "🎨",
        color: "from-pink-500 to-rose-500",
        minScore: 0,
        maxScore: 40,
        difficulty: "Easy",
    },
    {
        id: 2,
        name: "आकृति अन्वेषण",
        nameEn: "Shape Explorer",
        description: "Find matching shapes and build pattern recognition",
        type: "cognitive",
        icon: "🔷",
        color: "from-blue-500 to-cyan-500",
        minScore: 30,
        maxScore: 70,
        difficulty: "Medium",
    },
    {
        id: 3,
        name: "स्मृति वन",
        nameEn: "Memory Forest",
        description: "A gentle memory game with nature themes",
        type: "therapeutic",
        icon: "🌿",
        color: "from-green-500 to-emerald-500",
        minScore: 50,
        maxScore: 85,
        difficulty: "Medium",
    },
    {
        id: 4,
        name: "भावना कहानी",
        nameEn: "Emotion Stories",
        description: "Interactive stories about feelings and friendship",
        type: "social",
        icon: "📖",
        color: "from-purple-500 to-indigo-500",
        minScore: 70,
        maxScore: 100,
        difficulty: "Advanced",
    },
    {
        id: 5,
        name: "शांत ताल",
        nameEn: "Calming Rhythms",
        description: "Gentle sound and rhythm for sensory regulation",
        type: "sensory",
        icon: "🎵",
        color: "from-amber-500 to-orange-500",
        minScore: 0,
        maxScore: 30,
        difficulty: "Easy",
    },
    {
        id: 6,
        name: "मित्र मिलन",
        nameEn: "Friend Match",
        description: "Connect with friendly characters in simple tasks",
        type: "social",
        icon: "🤝",
        color: "from-teal-500 to-emerald-500",
        minScore: 40,
        maxScore: 80,
        difficulty: "Medium",
    },
];

const ColorHarmonyGame = ({ onScore, isDarkMode }) => {
    const [targetColor, setTargetColor] = useState("");
    const [score, setScore] = useState(0);
    const colors = ["#FFB6C1", "#98FB98", "#87CEEB", "#FFD700", "#DDA0DD", "#F0E68C", "#FFA07A", "#AFEEEE"];

    useEffect(() => {
        setTargetColor(colors[Math.floor(Math.random() * colors.length)]);
    }, []);

    const handleMatch = (color) => {
        if (color === targetColor) {
            const newScore = score + 10;
            setScore(newScore);
            onScore?.(newScore);
            setTargetColor(colors[Math.floor(Math.random() * colors.length)]);
        }
    };

    return (
        <div className="text-center p-6">
            <p className="mb-4 text-gray-600 dark:text-gray-300">Find the matching color:</p>
            <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-28 h-28 rounded-full mx-auto mb-8 shadow-xl"
                style={{ backgroundColor: targetColor }}
            />
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                {colors.map(color => (
                    <motion.button
                        key={color}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMatch(color)}
                        className="w-14 h-14 rounded-full shadow-md transition-all"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
            <p className="mt-6 text-lg font-semibold text-gray-700 dark:text-gray-300">
                Score: {score}
            </p>
        </div>
    );
};

const ShapeExplorerGame = ({ onScore, isDarkMode }) => {
    const shapes = ["🔵 Circle", "🔺 Triangle", "⬛ Square", "⭐ Star", "❤️ Heart", "💎 Diamond"];
    const [targetShape, setTargetShape] = useState(shapes[0]);
    const [score, setScore] = useState(0);

    const handleSelect = (shape) => {
        if (shape === targetShape) {
            const newScore = score + 10;
            setScore(newScore);
            onScore?.(newScore);
            setTargetShape(shapes[Math.floor(Math.random() * shapes.length)]);
        }
    };

    return (
        <div className="text-center p-6">
            <p className="mb-4 text-gray-600 dark:text-gray-300">Find this shape:</p>
            <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-8 p-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl inline-block text-white shadow-xl"
            >
                {targetShape.split(" ")[0]}
            </motion.div>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {shapes.map(shape => (
                    <motion.button
                        key={shape}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect(shape)}
                        className={`p-4 rounded-xl text-lg transition-all ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"
                            }`}
                    >
                        {shape}
                    </motion.button>
                ))}
            </div>
            <p className="mt-6 text-lg font-semibold text-gray-700 dark:text-gray-300">
                Score: {score}
            </p>
        </div>
    );
};

const MemoryForestGame = ({ onScore, isDarkMode }) => {
    const items = ["🌸", "🌿", "🌊", "⛰️", "🦋", "🐚", "🌙", "⭐"];
    const [cards, setCards] = useState(() => {
        const doubled = [...items, ...items];
        return doubled.sort(() => Math.random() - 0.5).map((item, idx) => ({
            id: idx,
            symbol: item,
            flipped: false,
            matched: false,
        }));
    });
    const [selected, setSelected] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (selected.length === 2) {
            const [first, second] = selected;
            if (cards[first].symbol === cards[second].symbol) {
                setCards(prev =>
                    prev.map((card, idx) =>
                        idx === first || idx === second ? { ...card, matched: true } : card
                    )
                );
                const newScore = score + 10;
                setScore(newScore);
                onScore?.(newScore);
                setSelected([]);
            } else {
                setTimeout(() => {
                    setCards(prev =>
                        prev.map((card, idx) =>
                            idx === first || idx === second ? { ...card, flipped: false } : card
                        )
                    );
                    setSelected([]);
                }, 1000);
            }
        }
    }, [selected]);

    const handleClick = (idx) => {
        if (cards[idx].flipped || cards[idx].matched || selected.length === 2) return;
        setCards(prev => prev.map((card, i) => (i === idx ? { ...card, flipped: true } : card)));
        setSelected(prev => [...prev, idx]);
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
                {cards.map((card, idx) => (
                    <motion.button
                        key={card.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleClick(idx)}
                        className={`h-20 rounded-xl text-2xl transition-all ${card.flipped || card.matched
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                            : isDarkMode
                                ? "bg-gray-700 text-gray-400"
                                : "bg-gray-200 text-gray-400"
                            }`}
                    >
                        {card.flipped || card.matched ? card.symbol : "?"}
                    </motion.button>
                ))}
            </div>
            <p className="mt-6 text-center text-lg font-semibold text-gray-700 dark:text-gray-300">
                Score: {score}
            </p>
        </div>
    );
};

const CalmingRhythmsGame = ({ onScore, isDarkMode }) => {
    const [activeNote, setActiveNote] = useState(null);
    const [score, setScore] = useState(0);
    const notes = [
        { note: "🎵", sound: "C", color: "bg-red-400" },
        { note: "🎶", sound: "D", color: "bg-orange-400" },
        { note: "🎵", sound: "E", color: "bg-yellow-400" },
        { note: "🎶", sound: "F", color: "bg-green-400" },
        { note: "🎵", sound: "G", color: "bg-blue-400" },
        { note: "🎶", sound: "A", color: "bg-indigo-400" },
    ];

    const playNote = (index) => {
        setActiveNote(index);
        const newScore = score + 5;
        setScore(newScore);
        onScore?.(newScore);
        setTimeout(() => setActiveNote(null), 300);
    };

    return (
        <div className="text-center p-6">
            <p className="mb-6 text-gray-600 dark:text-gray-300">
                Tap the notes to create a calming melody
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
                {notes.map((note, idx) => (
                    <motion.button
                        key={idx}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => playNote(idx)}
                        className={`w-20 h-20 rounded-2xl ${note.color} ${activeNote === idx ? "ring-4 ring-white shadow-xl" : ""
                            } transition-all text-3xl flex items-center justify-center shadow-lg`}
                    >
                        {note.note}
                    </motion.button>
                ))}
            </div>
            <p className="mt-6 text-lg font-semibold text-gray-700 dark:text-gray-300">
                Calm Points: {score}
            </p>
        </div>
    );
};

const getRecommendedGames = (score) => {
    return GAMES.filter(game => score >= game.minScore && score <= game.maxScore);
};

export default function GameSection({ asdScore = 0, asdLevel, isDarkMode }) {
    const [activeGame, setActiveGame] = useState(null);
    const [gameScore, setGameScore] = useState(0);
    const recommended = getRecommendedGames(asdScore);

    const renderGame = () => {
        if (!activeGame) return null;
        switch (activeGame.id) {
            case 1:
                return <ColorHarmonyGame onScore={setGameScore} isDarkMode={isDarkMode} />;
            case 2:
                return <ShapeExplorerGame onScore={setGameScore} isDarkMode={isDarkMode} />;
            case 3:
                return <MemoryForestGame onScore={setGameScore} isDarkMode={isDarkMode} />;
            case 5:
                return <CalmingRhythmsGame onScore={setGameScore} isDarkMode={isDarkMode} />;
            default:
                return (
                    <div className="text-center p-12">
                        <p className="text-gray-500">Coming soon! ✨</p>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header with score badge */}
            <div className="text-center mb-8">
                <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    🎮 क्रीड़ा स्थल
                </h2>
                <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Games thoughtfully chosen for your comfort and joy
                </p>
                <div className="inline-block mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm">
                    Current Support Score: {Math.round(asdScore)} · {asdLevel?.label || "Exploring"}
                </div>
            </div>

            {!activeGame ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommended.map(game => (
                        <motion.div
                            key={game.id}
                            whileHover={{ y: -8 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <button
                                onClick={() => setActiveGame(game)}
                                className={`w-full text-left rounded-2xl overflow-hidden shadow-xl transition-all ${isDarkMode ? "bg-gray-800" : "bg-white"
                                    }`}
                            >
                                <div className={`bg-gradient-to-r ${game.color} p-6 text-white`}>
                                    <div className="text-5xl mb-3">{game.icon}</div>
                                    <h3 className="text-xl font-bold">{game.name}</h3>
                                    <p className="text-sm opacity-90">{game.nameEn}</p>
                                </div>
                                <div className="p-5">
                                    <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                        {game.description}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                                            }`}>
                                            {game.type} · {game.difficulty}
                                        </span>
                                        <span className="text-indigo-500 font-semibold">Play →</span>
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"
                        }`}
                >
                    <div className={`bg-gradient-to-r ${activeGame.color} p-5 text-white`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-3xl mb-2">{activeGame.icon}</div>
                                <h3 className="text-2xl font-bold">{activeGame.name}</h3>
                                <p className="text-sm opacity-90">{activeGame.description}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveGame(null);
                                    setGameScore(0);
                                }}
                                className="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>
                    {renderGame()}
                    <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            🌟 Every game helps build connection and comfort. Take your time!
                        </p>
                    </div>
                </motion.div>
            )}

            {recommended.length === 0 && (
                <div className={`text-center p-12 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"
                    } shadow-lg`}>
                    <div className="text-6xl mb-4">🌸</div>
                    <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Games will appear here as we get to know you better.
                    </p>
                    <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Continue using the camera detection to see personalized game recommendations.
                    </p>
                </div>
            )}
        </div>
    );
}