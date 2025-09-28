'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RefreshCw, Shuffle, MapPin, Trash2, Github, Info, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// List of city names to be assigned randomly
const cityNames = [
  "Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
  "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad",
  "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
  "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur",
  "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad", "Mysuru", "Tiruchirappalli", "Bareilly"
];

const PIXELS_PER_KM = 10;

// --- NEW: Java Code Strings for the Modal ---
const javaCode = {

  dp: `
// Dynamic Programming  Approach for TSP in Java
// Time Complexity: O(n^2 * 2^n)

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class TspDynamicProgramming {

    public static double findShortestTour(double[][] distMatrix) {
        int n = distMatrix.length;
        int VISITED_ALL = (1 << n) - 1;
        double[][] dp = new double[1 << n][n];

        for (int i = 0; i < (1 << n); i++) {
            for (int j = 0; j < n; j++) {
                dp[i][j] = Double.POSITIVE_INFINITY;
            }
        }

        // Base case: distance from start city (0) to itself is 0
        dp[1][0] = 0;

        for (int mask = 1; mask < (1 << n); mask += 2) { // Iterate over all subsets of cities
            for (int u = 0; u < n; u++) {
                if ((mask & (1 << u)) != 0) { // If city u is in the subset
                    for (int v = 0; v < n; v++) {
                        if (u != v && (mask & (1 << v)) == 0) { // If city v is not in the subset
                            int newMask = mask | (1 << v);
                            dp[newMask][v] = Math.min(dp[newMask][v], dp[mask][u] + distMatrix[u][v]);
                        }
                    }
                }
            }
        }
        
        // Find the minimum cost to complete the tour
        double minTourCost = Double.POSITIVE_INFINITY;
        for (int i = 0; i < n; i++) {
            minTourCost = Math.min(minTourCost, dp[VISITED_ALL][i] + distMatrix[i][0]);
        }
        
        return minTourCost;
    }
}
  `
};

// --- NEW: Modal Component ---
const CodeModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 text-gray-200 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">TSP Algorithms in Java</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">  
          <h3 className="text-lg font-semibold text-indigo-400 mt-6 mb-2">Dynamic Programming Approach</h3>
          <SyntaxHighlighter language="java" style={atomDark} customStyle={{ borderRadius: '0.5rem' }}>
            {javaCode.dp}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};


export default function Home() {
  const [cities, setCities] = useState([]);
  const [tour, setTour] = useState([]);
  const [distance, setDistance] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [numCities, setNumCities] = useState(10);
  const [solvingSpeed, setSolvingSpeed] = useState(50);
  const [startCityIndex, setStartCityIndex] = useState(null);
  const [adjacencyMatrix, setAdjacencyMatrix] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // --- NEW: State for modal ---

  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const currentTour = useRef([]);

  const calculateDistance = useCallback((city1, city2) => {
    const pixelDistance = Math.sqrt(Math.pow(city1.x - city2.x, 2) + Math.pow(city1.y - city2.y, 2));
    return pixelDistance / PIXELS_PER_KM;
  }, []);

  useEffect(() => {
    if (cities.length > 0) {
      const matrix = Array(cities.length).fill(null).map(() => Array(cities.length).fill(0));
      for (let i = 0; i < cities.length; i++) {
        for (let j = 0; j < cities.length; j++) {
          if (i === j) {
            matrix[i][j] = 0;
          } else {
            matrix[i][j] = Math.round(calculateDistance(cities[i], cities[j]));
          }
        }
      }
      setAdjacencyMatrix(matrix);
    } else {
      setAdjacencyMatrix([]);
    }
  }, [cities, calculateDistance]);

  const calculateTourDistance = useCallback((currentTour) => {
    if (currentTour.length < 2 || adjacencyMatrix.length === 0) return 0;
    let totalDistance = 0;
    for (let i = 0; i < currentTour.length - 1; i++) {
      totalDistance += adjacencyMatrix[currentTour[i]][currentTour[i + 1]];
    }
    if (currentTour.length === cities.length) {
      totalDistance += adjacencyMatrix[currentTour[currentTour.length - 1]][currentTour[0]];
    }
    return totalDistance;
  }, [cities.length, adjacencyMatrix]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    if (tour.length > 1 && cities.length > 0) {
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cities[tour[0]].x, cities[tour[0]].y);
      for (let i = 1; i < tour.length; i++) {
        ctx.lineTo(cities[tour[i]].x, cities[tour[i]].y);
      }
      if (tour.length === cities.length) ctx.closePath();
      ctx.stroke();
    }
    cities.forEach((city, index) => {
      ctx.beginPath();
      ctx.arc(city.x, city.y, 6, 0, 2 * Math.PI);
      const isStartNode = tour.length > 0 && tour[0] === index;
      const isSelectedStartNode = startCityIndex === index;
      if (isStartNode) ctx.fillStyle = '#10b981';
      else if (isSelectedStartNode) ctx.fillStyle = '#f59e0b';
      else ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(city.name, city.x, city.y - 12);
    });
  }, [cities, tour, startCityIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const resizeCanvas = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      draw();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [cities, tour, draw, startCityIndex]);

  const handleAddCity = (event) => {
    if (isSolving || cities.length >= cityNames.length) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const usedNames = new Set(cities.map(c => c.name));
    const availableNames = cityNames.filter(name => !usedNames.has(name));
    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    setCities(prev => [...prev, { x, y, name: randomName }]);
    setTour([]);
    setDistance(0);
  };
  
  const handleRandomCities = () => {
    if (isSolving) return;
    const canvas = canvasRef.current;
    const newCities = [];
    const padding = 30;
    const shuffledNames = [...cityNames].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numCities; i++) {
      newCities.push({
        x: Math.random() * (canvas.width - padding * 2) + padding,
        y: Math.random() * (canvas.height - padding * 2) + padding,
        name: shuffledNames[i],
      });
    }
    setCities(newCities);
    setTour([]);
    setDistance(0);
    setStartCityIndex(null);
  };
  
  const handleReset = () => {
    if (animationFrameId.current) clearTimeout(animationFrameId.current);
    setCities([]);
    setTour([]);
    setDistance(0);
    setIsSolving(false);
    setIsPaused(false);
    setStartCityIndex(null);
    currentTour.current = [];
  };

  const solveNearestNeighbor = () => {
    if (cities.length < 2) return;
    setIsSolving(true);
    setIsPaused(false);
    let unvisited = cities.map((_, i) => i);
    const startingCity = startCityIndex !== null ? startCityIndex : 0;
    let currentCityIndex = startingCity;
    const spliceIndex = unvisited.indexOf(startingCity);
    if (spliceIndex > -1) unvisited.splice(spliceIndex, 1);
    currentTour.current = [currentCityIndex];
    setTour([currentCityIndex]);

    const findNextCity = () => {
        if (isPaused) {
            animationFrameId.current = setTimeout(findNextCity, solvingSpeed);
            return;
        }
        if (unvisited.length === 0) {
            setTour(prev => [...prev, prev[0]]);
            const finalDistance = calculateTourDistance([...currentTour.current, currentTour.current[0]]);
            setDistance(finalDistance);
            setIsSolving(false);
            return;
        }
        let nearestCityIndex = -1;
        let minDistance = Infinity;
        unvisited.forEach(cityIndex => {
            const dist = adjacencyMatrix[currentCityIndex][cityIndex];
            if (dist < minDistance) {
                minDistance = dist;
                nearestCityIndex = cityIndex;
            }
        });
        currentCityIndex = nearestCityIndex;
        currentTour.current.push(currentCityIndex);
        unvisited = unvisited.filter(i => i !== currentCityIndex);
        setTour([...currentTour.current]);
        setDistance(calculateTourDistance(currentTour.current));
        animationFrameId.current = setTimeout(findNextCity, solvingSpeed);
    };
    findNextCity();
  };
  
  const togglePause = () => setIsPaused(prev => !prev);

  return (
    <>
      {isModalOpen && <CodeModal onClose={() => setIsModalOpen(false)} />}
      <div className="flex h-screen w-screen bg-gray-900 text-gray-100 font-sans">
        <div className="w-1/4 max-w-sm p-6 bg-gray-800 border-r border-gray-700 flex flex-col space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="text-indigo-400" size={28}/>
              <h1 className="text-2xl font-bold text-white">TSP Visualizer</h1>
            </div>
            {/* --- NEW: Info Icon Button --- */}
            <button onClick={() => setIsModalOpen(true)} className="text-gray-400 hover:text-indigo-400 transition-colors">
              <Info size={22}/>
            </button>
          </div>
          <p className="text-sm text-gray-400">
            An interactive tool to visualize the Traveling Salesman Problem. Click the info icon for algorithm code.
          </p>
          {/* ... Rest of the controls ... */}
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h2 className="font-semibold text-lg">Controls</h2>
            <div className="flex flex-col space-y-3">
              <label htmlFor="numCities" className="text-sm text-gray-300">Number of Random Cities: {numCities}</label>
              <input type="range" id="numCities" min="3" max="50" value={numCities} onChange={(e) => setNumCities(Number(e.target.value))} disabled={isSolving} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"/>
              <button onClick={handleRandomCities} disabled={isSolving} className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"><Shuffle size={18}/> <span>Generate Random Cities</span></button>
              <button onClick={handleReset} className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"><Trash2 size={18}/> <span>Clear Canvas</span></button>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h2 className="font-semibold text-lg">Algorithm</h2>
            <div className="flex flex-col space-y-2">
              <label htmlFor="startCity" className="text-sm text-gray-300">Starting City</label>
              <select id="startCity" value={startCityIndex === null ? '' : startCityIndex} onChange={(e) => setStartCityIndex(e.target.value === '' ? null : Number(e.target.value))} disabled={isSolving || cities.length === 0} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 disabled:opacity-50"><option value="">Default (First City)</option>{cities.map((city, index) => (<option key={index} value={index}>{city.name}</option>))}</select>
            </div>
            <label htmlFor="solvingSpeed" className="text-sm text-gray-300">Animation Speed (ms): {solvingSpeed}</label>
            <input type="range" id="solvingSpeed" min="10" max="500" step="10" value={solvingSpeed} onChange={(e) => setSolvingSpeed(Number(e.target.value))} disabled={isSolving} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"/>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={solveNearestNeighbor} disabled={isSolving || cities.length < 2} className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"><Play size={18}/> <span>Start</span></button>
              <button onClick={togglePause} disabled={!isSolving} className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">{isPaused ? <Play size={18}/> : <Pause size={18}/>} <span>{isPaused ? 'Resume' : 'Pause'}</span></button>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <div className="bg-gray-900/50 p-3 rounded-lg"><p className="text-sm text-gray-400">Status</p><p className={`font-mono text-lg ${isSolving ? 'text-amber-400 animate-pulse' : 'text-green-400'}`}>{isSolving ? (isPaused ? 'Paused' : 'Solving...') : (tour.length > 0 ? 'Complete' : 'Idle')}</p></div>
            <div className="bg-gray-900/50 p-3 rounded-lg"><p className="text-sm text-gray-400">Total Cities</p><p className="font-mono text-lg text-indigo-300">{cities.length}</p></div>
            <div className="bg-gray-900/50 p-3 rounded-lg"><p className="text-sm text-gray-400">Current Distance (km)</p><p className="font-mono text-lg text-indigo-300">{distance}</p></div>
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <h2 className="font-semibold text-lg">Adjacency Matrix (Costs in km)</h2>
            <div className="overflow-auto rounded-lg bg-gray-900/50 max-h-96 border border-gray-700">
              {adjacencyMatrix.length > 0 ? (<table className="w-full text-xs text-left text-gray-300"><thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0"><tr><th scope="col" className="px-2 py-2"></th>{cities.map((city, index) => (<th key={index} scope="col" className="px-2 py-2 text-center" title={city.name}>{city.name.substring(0,3)}</th>))}</tr></thead><tbody>{adjacencyMatrix.map((row, i) => (<tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30"><th scope="row" className="px-2 py-2 font-medium text-gray-300 whitespace-nowrap bg-gray-700/50 sticky left-0" title={cities[i].name}>{cities[i].name.substring(0,3)}</th>{row.map((cost, j) => (<td key={j} className={`px-2 py-2 text-center font-mono ${i === j ? 'text-amber-400' : ''}`}>{cost}</td>))}</tr>))}</tbody></table>) : (<p className="text-sm text-gray-500 p-4 text-center">Add cities to see the cost matrix.</p>)}
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700">
            <a href="https://github.com/your-github" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 hover:text-indigo-400"><Github size={16}/> <span>View on GitHub</span></a>
          </div>
        </div>
        <div className="flex-1 bg-gray-900 p-4">
          <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <canvas ref={canvasRef} onClick={handleAddCity} className="absolute top-0 left-0 w-full h-full cursor-crosshair"></canvas>
            {!isSolving && cities.length === 0 && (<div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none"><p className="text-xl">Click here to add a city</p></div>)}
          </div>
        </div>
      </div>
    </>
  );
}