import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, 
  Play, 
  Square, 
  Download, 
  RefreshCcw,
  Zap,
  ChevronRight,
  User,
  Settings,
  Volume2
} from 'lucide-react';
import { MotionSample, PermissionStatus } from './types';
import MotionChart from './components/MotionChart';
import DeviceDiagram from './components/DeviceDiagram';
import { downloadCSV } from './utils/csv';

const SAMPLING_RATE_HZ = 100;
const SAMPLING_INTERVAL_MS = 1000 / SAMPLING_RATE_HZ;

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [currentValues, setCurrentValues] = useState<MotionSample>({ timestamp: 0, x: 0, y: 0, z: 0 });
  const [recordedData, setRecordedData] = useState<MotionSample[]>([]);
  const [displaySampleCount, setDisplaySampleCount] = useState(0);

  // 計測メタデータ
  const [subjectId, setSubjectId] = useState('001');
  const [condition, setCondition] = useState('A');

  const dataRef = useRef<MotionSample[]>([]);
  const latestSensorValueRef = useRef<MotionSample>({ timestamp: 0, x: 0, y: 0, z: 0 });
  const lastDisplayUpdateRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // フィードバック（音と振動）
  const triggerFeedback = (type: 'start' | 'stop') => {
    // 振動フィードバック
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'start' ? 50 : [50, 50, 50]);
    }

    // 音声フィードバック
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'start') {
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'stop') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.error("Audio feedback error", e);
    }
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.acceleration;
    if (!acc) return;

    const now = Date.now();
    latestSensorValueRef.current = {
      timestamp: now,
      x: acc.x || 0,
      y: acc.y || 0,
      z: acc.z || 0
    };

    // 画面更新は30fps程度に制限してブラウザの負荷を下げる
    if (now - lastDisplayUpdateRef.current > 33) {
      setCurrentValues({ ...latestSensorValueRef.current });
      if (isRecording) {
        setDisplaySampleCount(dataRef.current.length);
      }
      lastDisplayUpdateRef.current = now;
    }
  }, [isRecording]);

  const startSampling = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      dataRef.current.push({ ...latestSensorValueRef.current, timestamp: Date.now() });
    }, SAMPLING_INTERVAL_MS);
  }, []);

  const stopSampling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRecording) {
      startSampling();
      requestWakeLock();
    } else {
      stopSampling();
      releaseWakeLock();
    }
    return () => stopSampling();
  }, [isRecording, startSampling, stopSampling]);

  const handleInitialSetup = async () => {
    const DME = (window.DeviceMotionEvent as unknown as any);
    if (typeof DME !== 'undefined' && typeof DME.requestPermission === 'function') {
      try {
        const response = await DME.requestPermission();
        if (response === 'granted') {
          setupSensors();
        } else {
          setPermissionStatus('denied');
        }
      } catch (err) {
        setPermissionStatus('denied');
      }
    } else {
      if (window.DeviceMotionEvent) {
        setupSensors();
      } else {
        setPermissionStatus('not-supported');
      }
    }
  };

  const setupSensors = () => {
    setPermissionStatus('granted');
    window.addEventListener('devicemotion', handleMotion, true);
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      triggerFeedback('start');
      dataRef.current = [];
      setRecordedData([]);
      setDisplaySampleCount(0);
      setIsRecording(true);
    } else {
      triggerFeedback('stop');
      setIsRecording(false);
      const finalData = [...dataRef.current];
      setRecordedData(finalData);
      setDisplaySampleCount(finalData.length);
    }
  };

  const clearData = () => {
    setRecordedData([]);
    dataRef.current = [];
    setDisplaySampleCount(0);
  };

  const handleDownload = () => {
    const now = new Date();
    const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    
    const fileName = `ID_${subjectId}_COND_${condition}_${dateStr}_${timeStr}.csv`;
    const targetData = recordedData.length > 0 ? recordedData : dataRef.current;
    
    if (targetData.length === 0) return;
    downloadCSV(targetData, fileName);
  };

  if (permissionStatus !== 'granted') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
              <Activity className="text-white w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">MotionLogger Pro</h1>
            <p className="text-slate-500 text-sm italic px-8">腰部装着・歩行解析用<br/>(100Hz / 重力補正済 / CSV出力)</p>
          </div>
          <button 
            onClick={handleInitialSetup}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 text-lg active:scale-95 transition-all active:bg-indigo-600"
          >
            センサーと音声を許可
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-44 animate-in fade-in duration-300">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-indigo-600 w-5 h-5" />
            <h1 className="font-black text-slate-900 text-sm tracking-tight">MotionLogger</h1>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            isRecording ? 'bg-red-50 text-red-600 border border-red-100 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              {isRecording ? 'Recording' : 'Standby'}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-4">
        {/* 計測用入力フォーム */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-3 h-3 text-indigo-500" /> Experiment Settings
            </h3>
            <div className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Haptics & Audio ON
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                <User className="w-2.5 h-2.5" /> Subject ID
              </label>
              <input 
                type="text" 
                inputMode="numeric"
                value={subjectId} 
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={isRecording}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                placeholder="001"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Condition
              </label>
              <input 
                type="text" 
                value={condition} 
                onChange={(e) => setCondition(e.target.value)}
                disabled={isRecording}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                placeholder="A"
              />
            </div>
          </div>
        </section>

        {/* リアルタイム表示 */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'X (Lateral)', val: currentValues.x, color: 'text-red-500' },
            { label: 'Y (Vertical)', val: currentValues.y, color: 'text-green-500' },
            { label: 'Z (Depth)', val: currentValues.z, color: 'text-blue-500' }
          ].map((axis) => (
            <div key={axis.label} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase mb-1">{axis.label}</span>
              <span className={`text-lg font-mono font-black ${axis.color}`}>{axis.val.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <DeviceDiagram />

        {/* グラフ */}
        <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-1 py-1 flex items-center justify-between mb-2">
            <h3 className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-500" /> Linear Acceleration Waveform
            </h3>
            <span className="text-[8px] font-bold text-slate-300">unit: m/s²</span>
          </div>
          <MotionChart data={isRecording ? dataRef.current : [currentValues]} />
        </div>

        {!isRecording && recordedData.length > 0 && (
          <button 
            onClick={clearData}
            className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-indigo-600 transition-colors"
          >
            <RefreshCcw className="w-3 h-3" /> New Recording (Clear)
          </button>
        )}
      </main>

      {/* フッター操作パネル */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent z-50">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-900 rounded-[2.8rem] p-5 text-white shadow-2xl flex items-center justify-between gap-4 border border-white/10">
            <div className="flex flex-col pl-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-4xl font-black">{(displaySampleCount * 0.01).toFixed(2)}</span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-tighter">sec</span>
              </div>
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-0.5">
                {isRecording ? 'Sampling 100Hz' : `${displaySampleCount.toLocaleString()} samples`}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isRecording 
                    ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)]' 
                    : 'bg-white text-slate-900 shadow-xl'
                }`}
              >
                {isRecording ? <Square className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </button>

              <button
                onClick={handleDownload}
                disabled={isRecording || displaySampleCount === 0}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isRecording || displaySampleCount === 0
                    ? 'bg-slate-800 text-slate-600'
                    : 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-500'
                }`}
              >
                <Download className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;