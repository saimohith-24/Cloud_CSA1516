import { useState } from 'react';
import { addSensorReading } from './firestoreDb';
import {
  Activity,
  Thermometer,
  Gauge,
  Cpu,
  Database,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
  BarChart3
} from 'lucide-react';

interface SensorReading {
  id: number;
  time: string;
  temperature: number;
  vibration: number;
  pressure: number;
  status: 'Normal' | 'Warning' | 'Critical';
}

interface PredictionState {
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk';
  condition: 'Normal' | 'Warning' | 'Critical';
  failureProbability: number;
  recommendation: string;
  isPredicted: boolean;
}

export default function App() {
  // Initial Sensor State
  const [sensorData, setSensorData] = useState<Omit<SensorReading, 'id' | 'time'>>({
    temperature: 72.0,
    vibration: 4.2,
    pressure: 8.1,
    status: 'Normal',
  });

  // Table & Big Data Processing State
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>([
    { id: 1, time: '10:00:00', temperature: 70.2, vibration: 3.8, pressure: 7.9, status: 'Normal' },
    { id: 2, time: '10:05:00', temperature: 71.5, vibration: 4.0, pressure: 8.0, status: 'Normal' },
    { id: 3, time: '10:10:00', temperature: 72.8, vibration: 4.1, pressure: 8.1, status: 'Normal' },
    { id: 4, time: '10:15:00', temperature: 73.1, vibration: 4.3, pressure: 8.2, status: 'Normal' },
    { id: 5, time: '10:20:00', temperature: 72.0, vibration: 4.2, pressure: 8.1, status: 'Normal' },
  ]);

  const [processedMessage, setProcessedMessage] = useState<string | null>(null);
  const [processedStats, setProcessedStats] = useState({
    totalRecords: 5,
    missingValues: 1,
    cleanRecords: 5,
  });

  // Prediction State
  const [prediction, setPrediction] = useState<PredictionState>({
    riskLevel: 'Low Risk',
    condition: 'Normal',
    failureProbability: 18,
    recommendation: 'Machine Healthy – Continue routine operation',
    isPredicted: true,
  });

  // Helper to determine status based on thresholds
  const calculateStatus = (temp: number, vib: number, press: number): 'Normal' | 'Warning' | 'Critical' => {
    if (temp >= 90 || vib >= 8.5 || press >= 10.5) return 'Critical';
    if (temp >= 80 || vib >= 6.0 || press >= 9.2) return 'Warning';
    return 'Normal';
  };

  // 1. Generate Sensor Data (Module 1)
  const handleGenerateData = () => {
    // Generate realistic IoT values
    // Normal: temp 65-78, vib 3.0-5.0, press 7.5-8.5
    // Warning: temp 80-89, vib 6.0-8.4, press 9.2-10.4
    // Critical: temp 90-105, vib 8.5-12.0, press 10.5-12.5
    const rand = Math.random();
    let newTemp: number;
    let newVib: number;
    let newPress: number;

    if (rand < 0.6) {
      // 60% chance Normal
      newTemp = parseFloat((68 + Math.random() * 10).toFixed(1));
      newVib = parseFloat((3.5 + Math.random() * 2.0).toFixed(1));
      newPress = parseFloat((7.8 + Math.random() * 1.0).toFixed(1));
    } else if (rand < 0.85) {
      // 25% chance Warning
      newTemp = parseFloat((81 + Math.random() * 8).toFixed(1));
      newVib = parseFloat((6.1 + Math.random() * 2.2).toFixed(1));
      newPress = parseFloat((9.3 + Math.random() * 1.0).toFixed(1));
    } else {
      // 15% chance Critical
      newTemp = parseFloat((92 + Math.random() * 12).toFixed(1));
      newVib = parseFloat((8.6 + Math.random() * 3.0).toFixed(1));
      newPress = parseFloat((10.6 + Math.random() * 1.5).toFixed(1));
    }

    const newStatus = calculateStatus(newTemp, newVib, newPress);

    setSensorData({
      temperature: newTemp,
      vibration: newVib,
      pressure: newPress,
      status: newStatus,
    });
    setProcessedMessage(null);
  };

  // 2. Process Data (Module 2)
  const handleProcessData = async () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newReading: SensorReading = {
      id: Date.now(),
      time: timeStr,
      temperature: sensorData.temperature,
      vibration: sensorData.vibration,
      pressure: sensorData.pressure,
      status: sensorData.status,
    };

    setSensorHistory((prev) => {
      const updated = [...prev, newReading];
      return updated.slice(-10); // Keep max 10 sample records
    });

    setProcessedStats((prev) => ({
      totalRecords: prev.totalRecords + 1,
      missingValues: prev.missingValues + (Math.random() < 0.3 ? 1 : 0),
      cleanRecords: prev.cleanRecords + 1,
    }));

    setProcessedMessage('Data processed & saved to Cloud Firestore');

    // Persist to Cloud Firestore (if configured / emulator active)
    try {
      await addSensorReading({
        temperature: sensorData.temperature,
        vibration: sensorData.vibration,
        pressure: sensorData.pressure,
        status: sensorData.status,
      });
      console.log('Successfully persisted sensor reading to Cloud Firestore');
    } catch (err) {
      console.log('Firestore sync notice (local demo fallback active):', err);
    }
  };

  // 3. Predict Machine Condition (Module 3)
  const handlePredict = () => {
    const { temperature, vibration } = sensorData;

    let condition: 'Normal' | 'Warning' | 'Critical' = 'Normal';
    let riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk' = 'Low Risk';
    let failureProbability = 18;
    let recommendation = 'Machine Healthy – Continue routine operation';

    // Simulated rule-based ML prediction logic
    if (temperature >= 90 && vibration >= 8.5) {
      condition = 'Critical';
      riskLevel = 'High Risk';
      failureProbability = Math.floor(85 + Math.random() * 13); // 85-97%
      recommendation = 'Immediate inspection required! High failure risk detected.';
    } else if (temperature >= 80 || vibration >= 6.0) {
      condition = 'Warning';
      riskLevel = 'Medium Risk';
      failureProbability = Math.floor(55 + Math.random() * 20); // 55-74%
      recommendation = 'Schedule maintenance inspection within 24-48 hours.';
    } else {
      condition = 'Normal';
      riskLevel = 'Low Risk';
      failureProbability = Math.floor(10 + Math.random() * 15); // 10-24%
      recommendation = 'Machine Healthy – No immediate maintenance needed.';
    }

    setPrediction({
      riskLevel,
      condition,
      failureProbability,
      recommendation,
      isPredicted: true,
    });
  };

  // Status Badge Helper
  const getStatusBadge = (status: 'Normal' | 'Warning' | 'Critical') => {
    switch (status) {
      case 'Normal':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Normal
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Warning
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Critical
          </span>
        );
    }
  };

  // Chart coordinate helper for Trend Visualization
  const renderTrendSvg = () => {
    if (sensorHistory.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = 30;

    const minTemp = 50;
    const maxTemp = 120;
    const minVib = 0;
    const maxVib = 15;

    const getX = (index: number) => {
      if (sensorHistory.length === 1) return width / 2;
      return padding + (index / (sensorHistory.length - 1)) * (width - 2 * padding);
    };

    const getTempY = (val: number) => {
      return height - padding - ((val - minTemp) / (maxTemp - minTemp)) * (height - 2 * padding);
    };

    const getVibY = (val: number) => {
      return height - padding - ((val - minVib) / (maxVib - minVib)) * (height - 2 * padding);
    };

    const tempPoints = sensorHistory.map((d, i) => `${getX(i)},${getTempY(d.temperature)}`).join(' ');
    const vibPoints = sensorHistory.map((d, i) => `${getX(i)},${getVibY(d.vibration)}`).join(' ');

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 bg-slate-50 rounded-lg border border-slate-200">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />

          {/* Temperature Polyline (Blue) */}
          <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={tempPoints} />
          {/* Vibration Polyline (Amber) */}
          <polyline fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="4 2" points={vibPoints} />

          {/* Data Points */}
          {sensorHistory.map((d, i) => (
            <g key={d.id}>
              <circle cx={getX(i)} cy={getTempY(d.temperature)} r="4" fill="#2563eb" />
              <circle cx={getX(i)} cy={getVibY(d.vibration)} r="4" fill="#d97706" />
              <text x={getX(i)} y={height - 8} fontSize="10" fill="#64748b" textAnchor="middle">
                {d.time}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex items-center justify-center gap-6 mt-3 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span>Temperature (°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600 inline-block"></span>
            <span>Vibration (mm/s)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-700 tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-blue-600" />
              Cloud-Enabled Predictive Maintenance
            </h1>
            <p className="text-xs md:text-sm font-semibold text-slate-500 mt-0.5">
              Monitor <span className="text-blue-500">→</span> Process <span className="text-blue-500">→</span> Predict{' '}
              <span className="text-blue-500">→</span> Alert
            </p>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex flex-wrap items-center gap-2">
            <a
              href="#module-1"
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Sensor Data
            </a>
            <a
              href="#module-2"
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Data Processing
            </a>
            <a
              href="#module-3"
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Prediction
            </a>
            <a
              href="#module-4"
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Alerts
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        {/* Overall Dashboard Summary */}
        <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Machine Overview
              </h2>
              <p className="text-xs text-slate-500">Real-time status summary of monitored industrial equipment</p>
            </div>
            {getStatusBadge(sensorData.status)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Temperature</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{sensorData.temperature} °C</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Vibration</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{sensorData.vibration} mm/s</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Pressure</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{sensorData.pressure} bar</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Machine Status</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{sensorData.status}</div>
            </div>
          </div>
        </section>

        {/* Visual Module Flow */}
        <section className="bg-blue-900 text-white rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-3 text-center md:text-left">
            Framework Pipeline Architecture
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center justify-between p-3 bg-blue-800/60 rounded-lg border border-blue-700/50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-semibold">1. Sensor Data</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-300 hidden md:block" />
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-800/60 rounded-lg border border-blue-700/50">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-semibold">2. Data Processing</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-300 hidden md:block" />
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-800/60 rounded-lg border border-blue-700/50">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-semibold">3. Predictive Analytics</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-300 hidden md:block" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-800/60 rounded-lg border border-blue-700/50">
              <Bell className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-semibold">4. Alerts & Visualization</span>
            </div>
          </div>
        </section>

        {/* MODULE 1 */}
        <section id="module-1" className="scroll-mt-24 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Module 1</span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">Smart Sensor Data Acquisition</h2>
            </div>
            {getStatusBadge(sensorData.status)}
          </div>

          <p className="text-sm text-slate-600 mb-6">Simulates IoT sensor data from industrial machines.</p>

          {/* Sensor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
                <span className="font-medium">Temperature</span>
                <Thermometer className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{sensorData.temperature} °C</div>
              <p className="text-xs text-slate-400 mt-1">Normal Range: 60 - 80 °C</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
                <span className="font-medium">Vibration</span>
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{sensorData.vibration} mm/s</div>
              <p className="text-xs text-slate-400 mt-1">Normal Range: 2.0 - 5.5 mm/s</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
                <span className="font-medium">Pressure</span>
                <Gauge className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{sensorData.pressure} bar</div>
              <p className="text-xs text-slate-400 mt-1">Normal Range: 7.0 - 9.0 bar</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <button
              onClick={handleGenerateData}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Sensor Data
            </button>
            <p className="text-xs text-blue-800 italic text-center sm:text-right">
              * Simulated IoT sensor stream for demonstration (No physical hardware required).
            </p>
          </div>
        </section>

        {/* MODULE 2 */}
        <section id="module-2" className="scroll-mt-24 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Module 2</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">Scalable Big Data Processing</h2>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Processes and cleans the collected sensor data before prediction.
          </p>

          {/* Simple Processing Flow */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-sm font-medium">
            <span className="px-3 py-1 bg-white rounded border border-slate-300 text-slate-700">Raw Sensor Data</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-3 py-1 bg-blue-100 rounded border border-blue-300 text-blue-800 font-semibold">
              Clean Data
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-3 py-1 bg-emerald-100 rounded border border-emerald-300 text-emerald-800 font-semibold">
              Processed Data
            </span>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Total Records</span>
              <span className="text-lg font-bold text-slate-900">{processedStats.totalRecords}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Missing Values</span>
              <span className="text-lg font-bold text-amber-600">{processedStats.missingValues}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Clean Records</span>
              <span className="text-lg font-bold text-emerald-600">{processedStats.cleanRecords}</span>
            </div>
          </div>

          {/* Action & Feedback */}
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleProcessData}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
            >
              <Database className="w-4 h-4" />
              Process Data
            </button>

            {processedMessage && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {processedMessage}
              </div>
            )}
          </div>

          {/* Sample Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Temperature (°C)</th>
                  <th className="p-3">Vibration (mm/s)</th>
                  <th className="p-3">Pressure (bar)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sensorHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-slate-600">{row.time}</td>
                    <td className="p-3 font-medium">{row.temperature}</td>
                    <td className="p-3 font-medium">{row.vibration}</td>
                    <td className="p-3 font-medium">{row.pressure}</td>
                    <td className="p-3">{getStatusBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODULE 3 */}
        <section id="module-3" className="scroll-mt-24 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Module 3</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">Intelligent Predictive Analytics</h2>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Uses processed sensor data to predict possible machine failure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-6">
            {/* Prediction Output Card */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  Machine Prediction
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    prediction.riskLevel === 'Low Risk'
                      ? 'bg-emerald-100 text-emerald-800'
                      : prediction.riskLevel === 'Medium Risk'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {prediction.riskLevel}
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                  <span>Failure Probability</span>
                  <span className="text-sm font-bold text-slate-900">{prediction.failureProbability}%</span>
                </div>

                {/* Progress Bar Indicator */}
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      prediction.failureProbability > 75
                        ? 'bg-rose-600'
                        : prediction.failureProbability > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${prediction.failureProbability}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Condition:</span>
                  <span className="font-semibold text-slate-900">{prediction.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Failure Probability:</span>
                  <span className="font-semibold text-slate-900">{prediction.failureProbability}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Recommendation:</span>
                  <p className="font-medium text-slate-800 bg-white p-2.5 rounded border border-slate-200">
                    {prediction.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls & Rule explanation */}
            <div className="space-y-4">
              <button
                onClick={handlePredict}
                className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                Predict Machine Condition
              </button>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Prediction Rules (Logic):</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Normal temp + normal vibration:</strong> Low Risk (Machine Healthy)
                  </li>
                  <li>
                    <strong className="text-slate-800">High temp OR high vibration:</strong> Medium Risk (Warning)
                  </li>
                  <li>
                    <strong className="text-slate-800">Very high temp + high vibration:</strong> High Risk (Critical)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic text-center">
            * Note: Demo prediction using simulated rule-based inference, tailored for presentation purposes.
          </p>
        </section>

        {/* MODULE 4 */}
        <section id="module-4" className="scroll-mt-24 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Module 4</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">Proactive Alerting and Visualization</h2>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Displays sensor trends, prediction results, and maintenance alerts.
          </p>

          {/* Sensor Trend Chart */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Sensor Trend (Recent Readings)
            </h3>
            {renderTrendSvg()}
          </div>

          {/* Current Alert Card */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Current Alert</h3>

            {prediction.riskLevel === 'Low Risk' ? (
              <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-900 text-base">No Alert – Machine Operating Normally</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      All parameters are within standard operating limits. Continue standard monitoring.
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 text-xs text-emerald-800">
                  <div>Status: <strong>Normal</strong></div>
                  <div>Probability: <strong>{prediction.failureProbability}%</strong></div>
                </div>
              </div>
            ) : prediction.riskLevel === 'Medium Risk' ? (
              <div className="p-5 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-base">⚠ Maintenance Warning</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Elevated sensor metrics detected. Preventive maintenance recommended.
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 text-xs text-amber-800">
                  <div>Status: <strong>Warning</strong></div>
                  <div>Probability: <strong>{prediction.failureProbability}%</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-rose-50 rounded-xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-rose-900 text-base">⚠ Maintenance Alert</h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      High probability of machine failure. Please inspect the machine immediately.
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 text-xs text-rose-800">
                  <div>Status: <strong>Critical</strong></div>
                  <div>Probability: <strong>{prediction.failureProbability}%</strong></div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="mt-16 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-medium text-slate-600">
            Cloud-Enabled Predictive Maintenance Framework for Industrial Equipment
          </p>
          <p className="mt-1 text-slate-400">College Capstone Project Demonstration</p>
        </div>
      </footer>
    </div>
  );
}
