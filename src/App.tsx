import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2, 
  Loader2, 
  ChevronRight,
  Info,
  ShieldCheck,
  ScanLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeIngredients } from './services/geminiService';
import { UserProfile, AnalysisResult } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [view, setView] = useState<'home' | 'scan' | 'profile' | 'result'>('home');
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('food-lens-profile');
    return saved ? JSON.parse(saved) : {
      allergies: [],
      healthConditions: [],
      dietaryPreferences: []
    };
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    localStorage.setItem('food-lens-profile', JSON.stringify(profile));
  }, [profile]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0) {
        // Ensure canvas matches video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        handleAnalysis(dataUrl);
      } else {
        setError("Camera not ready. Please wait a moment.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setCapturedImage(dataUrl);
        handleAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async (imageData: string) => {
    setIsAnalyzing(true);
    setView('result');
    setError(null);
    try {
      const analysis = await analyzeIngredients(imageData, profile);
      setResult(analysis);
    } catch (err) {
      setError("Analysis failed. Please try again with a clearer photo.");
    } finally {
      setIsAnalyzing(false);
      stopCamera();
    }
  };

  const [selectedIngredient, setSelectedIngredient] = useState<number | null>(null);

  const addTag = (type: keyof UserProfile, value: string) => {
    if (!value.trim()) return;
    setProfile(prev => ({
      ...prev,
      [type]: [...new Set([...prev[type], value.trim().toLowerCase()])]
    }));
  };

  const removeTag = (type: keyof UserProfile, index: number) => {
    setProfile(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl relative overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-brand-500 p-2 rounded-xl shadow-lg shadow-brand-100">
            <ScanLine className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Food Lens</h1>
        </div>
        <button 
          onClick={() => setView('profile')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Settings className="w-6 h-6 text-slate-500" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                  Check what's <span className="text-brand-600">inside</span> your food.
                </h2>
                <p className="text-slate-500">
                  Scan labels to instantly find allergens and ingredients that don't match your health profile.
                </p>
              </div>

              <div className="grid gap-4">
                <button 
                  onClick={() => {
                    setView('scan');
                    startCamera();
                  }}
                  className="bg-brand-600 hover:bg-brand-700 text-white p-6 rounded-3xl flex flex-col items-center gap-3 shadow-xl shadow-brand-100 transition-all active:scale-95"
                >
                  <Camera className="w-10 h-10" />
                  <span className="font-bold text-lg">Open Scanner</span>
                </button>

                <label className="bg-white border-2 border-dashed border-slate-200 hover:border-brand-500 p-6 rounded-3xl flex flex-col items-center gap-3 cursor-pointer transition-all group">
                  <Upload className="w-10 h-10 text-slate-400 group-hover:text-brand-500" />
                  <span className="font-bold text-lg text-slate-600 group-hover:text-brand-600">Upload Label Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-500" />
                    Your Safety Profile
                  </h3>
                  <button 
                    onClick={() => setView('profile')}
                    className="text-brand-600 text-sm font-bold"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...profile.allergies, ...profile.healthConditions].length === 0 ? (
                    <p className="text-slate-400 text-sm italic">No conditions set yet. Add them to get personalized alerts.</p>
                  ) : (
                    <>
                      {profile.allergies.map((tag, i) => (
                        <span key={i} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                          {tag}
                        </span>
                      ))}
                      {profile.healthConditions.map((tag, i) => (
                        <span key={i} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                          {tag}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex flex-col"
            >
              <div className="absolute top-6 left-6 z-10">
                <button 
                  onClick={() => {
                    stopCamera();
                    setView('home');
                  }}
                  className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="flex-1 object-cover"
              />
              
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-white/50 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-500 -mt-1 -ml-1 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-500 -mt-1 -mr-1 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-500 -mb-1 -ml-1 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-500 -mb-1 -mr-1 rounded-br-lg" />
                </div>
              </div>

              <div className="p-10 flex justify-center bg-black">
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-8 border-white/30 active:scale-90 transition-transform flex items-center justify-center"
                >
                   <div className="w-14 h-14 bg-white rounded-full border-2 border-slate-200" />
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setView('home')} className="p-2 bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">Safety Profile</h2>
              </div>

              <ProfileSection 
                title="Allergies" 
                description="What are you allergic to?"
                items={profile.allergies}
                onAdd={(val) => addTag('allergies', val)}
                onRemove={(i) => removeTag('allergies', i)}
                color="red"
              />

              <ProfileSection 
                title="Health Conditions" 
                description="e.g. Diabetes, Hypertension"
                items={profile.healthConditions}
                onAdd={(val) => addTag('healthConditions', val)}
                onRemove={(i) => removeTag('healthConditions', i)}
                color="blue"
              />

              <ProfileSection 
                title="Dietary Preferences" 
                description="e.g. Vegan, Keto, No Sugar"
                items={profile.dietaryPreferences}
                onAdd={(val) => addTag('dietaryPreferences', val)}
                onRemove={(i) => removeTag('dietaryPreferences', i)}
                color="green"
              />

              <button 
                onClick={() => setView('home')}
                className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-lg"
              >
                Save & Continue
              </button>
            </motion.div>
          )}

          {view === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 space-y-6"
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-brand-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="w-6 h-6 text-brand-600" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold">Analyzing Ingredients...</h3>
                    <p className="text-slate-500">Gemini is checking for allergens and health risks.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertTriangle className="w-8 h-8" />
                    <h3 className="text-xl font-bold">Something went wrong</h3>
                  </div>
                  <p className="text-red-700">{error}</p>
                  <button 
                    onClick={() => setView('home')}
                    className="w-full bg-red-600 text-white p-4 rounded-2xl font-bold"
                  >
                    Try Again
                  </button>
                </div>
              ) : result && (
                <div className="space-y-6">
                  <div className={cn(
                    "p-8 rounded-[2.5rem] text-center space-y-4 shadow-xl",
                    result.isSafe ? "bg-brand-500 text-white" : "bg-red-600 text-white"
                  )}>
                    <div className="flex justify-center">
                      {result.isSafe ? (
                        <ShieldCheck className="w-20 h-20" />
                      ) : (
                        <AlertTriangle className="w-20 h-20" />
                      )}
                    </div>
                    <h2 className="text-3xl font-bold">
                      {result.isSafe ? "Safe to Consume" : "Caution Required"}
                    </h2>
                    <p className="opacity-90 font-medium">
                      {result.summary}
                    </p>
                  </div>

                  {capturedImage && (
                    <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm h-48">
                      <img src={capturedImage} alt="Captured label" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {!result.isSafe && result.problematicIngredients.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Problematic Ingredients
                      </h3>
                      <div className="space-y-2">
                        {result.problematicIngredients.map((item, i) => (
                          <div key={i} className="bg-white p-4 rounded-2xl border border-red-100 flex items-start gap-3 shadow-sm">
                            <div className="bg-red-50 p-2 rounded-lg">
                              <X className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 capitalize">{item.name}</p>
                              <p className="text-sm text-slate-500 leading-tight">{item.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Info className="w-5 h-5 text-slate-400" />
                      Ingredient Details
                    </h3>
                    <p className="text-xs text-slate-500">Tap an ingredient to see nutritional notes based on your profile.</p>
                    <div className="space-y-2">
                      {result.allIngredients.map((ing, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all",
                            selectedIngredient === i ? "ring-2 ring-brand-500" : ""
                          )}
                        >
                          <button 
                            onClick={() => setSelectedIngredient(selectedIngredient === i ? null : i)}
                            className="w-full p-4 flex items-center justify-between text-left"
                          >
                            <span className="font-bold text-slate-800 capitalize">{ing.name}</span>
                            <ChevronRight className={cn("w-5 h-5 text-slate-400 transition-transform", selectedIngredient === i ? "rotate-90" : "")} />
                          </button>
                          
                          <AnimatePresence>
                            {selectedIngredient === i && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3"
                              >
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</p>
                                  <p className="text-sm text-slate-600">{ing.description}</p>
                                </div>
                                {ing.nutritionalNote && (
                                  <div className="bg-brand-50/50 p-3 rounded-xl space-y-1">
                                    <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Health Note</p>
                                    <p className="text-sm text-brand-800">{ing.nutritionalNote}</p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setView('home')}
                    className="w-full bg-slate-900 text-white p-5 rounded-3xl font-bold shadow-xl active:scale-95 transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav Hint */}
      {view === 'home' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-6">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-full shadow-2xl flex items-center justify-around">
            <button onClick={() => setView('home')} className="p-3 bg-brand-500 text-white rounded-full shadow-lg">
              <ScanLine className="w-6 h-6" />
            </button>
            <button onClick={() => setView('profile')} className="p-3 text-slate-400 hover:text-brand-500 transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ 
  title, 
  description, 
  items, 
  onAdd, 
  onRemove,
  color 
}: { 
  title: string; 
  description: string; 
  items: string[]; 
  onAdd: (val: string) => void;
  onRemove: (i: number) => void;
  color: 'red' | 'blue' | 'green';
}) {
  const [input, setInput] = useState('');
  
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-100 focus-within:border-red-400',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 focus-within:border-blue-400',
    green: 'bg-green-50 text-green-600 border-green-100 focus-within:border-green-400'
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2", colors[color])}>
            {item}
            <button onClick={() => onRemove(i)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd(input);
              setInput('');
            }
          }}
          placeholder="Type and press enter..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-500"
        />
        <button 
          onClick={() => {
            onAdd(input);
            setInput('');
          }}
          className="bg-slate-100 p-2 rounded-xl text-slate-600"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
