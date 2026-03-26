import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Activity,
  Wifi,
  AlertTriangle,
  Cpu,
  Terminal,
  Zap,
  Lock,
  Wallet
} from 'lucide-react'
import { cn } from './utils/cn'

const CONTRACT_ABI = [
  "function registerUser() external",
  "function requestAccess(string resource) external",
  "function isUserRegistered(address user) view returns (bool)",
  "event UserRegistered(address indexed wallet, uint256 time)",
  "event AccessRequested(address indexed wallet, uint256 time, string resource)"
];

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [wallet, setWallet] = useState(null)
  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)
  const [balance, setBalance] = useState("0")
  const [isRegistered, setIsRegistered] = useState(false)
  const [simulationMode, setSimulationMode] = useState(false)

  const [logs, setLogs] = useState([])
  const [anomalyStatus, setAnomalyStatus] = useState({ is_anomaly: false, score: 0 })
  const [requestCount, setRequestCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Auto-connect attempts if not in simulation
  useEffect(() => {
    if (!simulationMode && window.ethereum) {
      // Optional: Auto-connect logic could go here
    }
  }, [simulationMode])

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{
      msg,
      type,
      time: new Date().toLocaleTimeString(),
      id: Math.random()
    }, ...prev].slice(0, 50))
  }

  const connectWallet = async () => {
    setLoading(true)
    if (simulationMode) {
      setTimeout(() => {
        const mockWallet = "0xSIM..." + Math.random().toString(16).substr(2, 6).toUpperCase();
        setWallet(mockWallet)
        setBalance("10.0")
        addLog(`Simulated Wallet Connected: ${mockWallet}`, 'success')
        setLoading(false)
      }, 800)
      return;
    }

    if (!window.ethereum) {
      alert("Please install MetaMask!")
      setLoading(false)
      return
    }

    try {
      const _provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(_provider)

      const signer = await _provider.getSigner()
      const _wallet = await signer.getAddress()
      setWallet(_wallet)

      const _balance = await _provider.getBalance(_wallet)
      setBalance(ethers.formatEther(_balance).substring(0, 6))

      const _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      setContract(_contract)

      try {
        const registered = await _contract.isUserRegistered(_wallet)
        setIsRegistered(registered)
        addLog(registered ? `Identity Verified: ${_wallet.substr(0, 8)}...` : `Connected Unregistered: ${_wallet.substr(0, 8)}...`, registered ? 'success' : 'warning')
      } catch (e) {
        console.log("Contract Error", e)
        addLog("Contract unreachable (Localhost?)", 'error')
      }

    } catch (err) {
      console.error(err)
      addLog("Wallet Connection Failed", 'error')
    }
    setLoading(false)
  }

  const register = async () => {
    setLoading(true)
    if (simulationMode) {
      setTimeout(() => {
        setIsRegistered(true)
        addLog("Identity Registered on Simulated Chain", 'success')
        setLoading(false)
      }, 1000)
      return
    }

    if (!contract) return
    try {
      addLog("Initiating Registration Transaction...", 'info')
      const tx = await contract.registerUser()
      await tx.wait()
      setIsRegistered(true)
      const _balance = await provider.getBalance(wallet)
      setBalance(ethers.formatEther(_balance).substring(0, 6))
      addLog("Identity Registered On-Chain", 'success')
    } catch (err) {
      console.error(err)
      addLog("Registration Failed", 'error')
    }
    setLoading(false)
  }

  const requestResource = async () => {
    const resource = "HighSpeedData"

    if (!simulationMode) {
      if (!contract) {
        addLog("No contract connection", 'error')
        return
      }
      try {
        const tx = await contract.requestAccess(resource)
        addLog("Verifying identity on blockchain...", 'info')
        await tx.wait()
        const _balance = await provider.getBalance(wallet)
        setBalance(ethers.formatEther(_balance).substring(0, 6))
      } catch (err) {
        addLog("Blockchain Authorization Failed", 'error')
        return
      }
    }

    try {
      // Optimistic UI update
      setRequestCount(prev => prev + 1)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: wallet || "unknown",
          resource: resource,
          timestamp: Date.now() / 1000,
          duration: Math.floor(Math.random() * 400) + 50
        })
      })
      const data = await response.json()

      setAnomalyStatus(data.analysis)

      if (data.analysis.is_anomaly) {
        addLog(`⚠️ ANOMALY DETECTED! Score: ${data.analysis.score.toFixed(2)}`, 'critical')
      } else {
        addLog(`Access Granted. Latency: ${data.analysis.score.toFixed(2)}ms`, 'success')
      }

    } catch (err) {
      addLog("AI Sentinel Disconnected", 'error')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 font-sans selection:bg-cyan-500/30">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid-white opacity-[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 animate-pulse-slow" />
              <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg relative">
                <ShieldCheck className="text-cyan-400 w-8 h-8" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                DECENTRALIZED SENTINEL
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                SYSTEM ONLINE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="group flex items-center gap-3 cursor-pointer p-1 rounded-full border border-transparent hover:border-slate-800 transition-all">
              <span className={cn("text-xs font-medium uppercase tracking-wider transition-colors", simulationMode ? "text-slate-400" : "text-cyan-400")}>
                Live Network
              </span>
              <div className="relative w-12 h-6 rounded-full bg-slate-900 border border-slate-700 shadow-inner overflow-hidden transition-colors group-hover:border-slate-600">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={simulationMode}
                  onChange={(e) => {
                    setSimulationMode(e.target.checked)
                    setWallet(null)
                    setContract(null)
                    setIsRegistered(false)
                    setLogs([])
                    addLog(`Switched to ${e.target.checked ? 'Simulation' : 'Live'} Mode`, 'info')
                  }}
                />
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"
                  animate={{ x: simulationMode ? 24 : 0, backgroundColor: simulationMode ? '#F59E0B' : '#06B6D4' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
              <span className={cn("text-xs font-medium uppercase tracking-wider transition-colors", simulationMode ? "text-amber-400" : "text-slate-400")}>
                Simulation
              </span>
            </label>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Identity & Access */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Identity Card */}
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet className="w-24 h-24 text-slate-400" />
              </div>

              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-slate-600" /> Identity verification
              </h2>

              {!wallet ? (
                <div className="flex flex-col items-start gap-4">
                  <p className="text-slate-300 max-w-md">
                    Connect your blockchain wallet to establish a decentralized identity.
                    In simulation mode, a mock identity will be generated.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={connectWallet}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Lock className="w-4 h-4" />
                    {simulationMode ? "Initialize Simulation Identity" : "Connect MetaMask"}
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold font-mono">
                        0x
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase">Connected Wallet</span>
                        <span className="font-mono text-sm text-cyan-100">{wallet}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 uppercase block">Balance</span>
                      <span className="font-mono text-sm text-green-400 font-bold">{balance} ETH</span>
                    </div>
                  </div>

                  {!isRegistered ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <strong className="block mb-1">Registration Required</strong>
                          Your identity is not yet recorded on the smart contract registry. Access to 5G resources is restricted.
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={register}
                        disabled={loading}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-medium transition-colors flex justify-center items-center gap-2"
                      >
                        {loading && <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
                        Sign On-Chain Registry
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <div className="text-sm">
                        <strong className="block">Identity Verified</strong>
                        Smart Contract Authorization Active
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Action Card */}
            <div className={cn("glass-card rounded-2xl p-8 relative transition-all duration-500", !isRegistered && "opacity-50 grayscale pointer-events-none")}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-slate-600" /> Resource Access
                  </h2>
                  <h3 className="text-2xl font-light text-white mt-2">5G Network Slice <span className="text-purple-400">#89-A</span></h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Wifi className="w-6 h-6 text-purple-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase mb-1">Latency</div>
                  <div className="text-xl font-mono text-cyan-400 fill-current">12<span className="text-sm text-slate-600 ml-1">ms</span></div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase mb-1">Requests</div>
                  <div className="text-xl font-mono text-cyan-400">{requestCount}</div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(168, 85, 247, 0.15)" }}
                whileTap={{ scale: 0.98 }}
                onClick={requestResource}
                className="w-full py-6 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:border-purple-400/50 text-purple-300 font-bold text-lg tracking-wide shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)] transition-all flex flex-col items-center gap-1 group"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 group-hover:text-purple-200" />
                  ACTIVATE HIGH-BANDWIDTH STREAM
                </span>
                <span className="text-xs font-normal text-purple-500/60 uppercase tracking-wider">Secured by AI Anomaly Detection</span>
              </motion.button>
            </div>

          </div>

          {/* Right Column: AI Sentinel Status */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* AI Status Card */}
            <div className={cn("glass-card rounded-2xl p-1 transition-colors duration-300",
              anomalyStatus.is_anomaly ? "bg-red-900/20 border-red-500/50 shadow-[0_0_50px_-10px_rgba(239,68,68,0.3)]" :
                "border-slate-800"
            )}>
              <div className="bg-slate-950/80 rounded-xl p-6 h-full backdrop-blur-sm relative overflow-hidden">
                {/* Animated Scan Line */}
                {!anomalyStatus.is_anomaly && (
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent z-0"
                    animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <Cpu className={cn("w-5 h-5", anomalyStatus.is_anomaly ? "text-red-500" : "text-green-500")} />
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Sentinel AI</h2>
                    </div>
                    <div className={cn("px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border",
                      anomalyStatus.is_anomaly
                        ? "bg-red-500 text-white border-red-400 animate-pulse"
                        : "bg-green-500/10 text-green-400 border-green-500/20"
                    )}>
                      {anomalyStatus.is_anomaly ? "THREAT DETECTED" : "NOMINAL"}
                    </div>
                  </div>

                  <div className="flex justify-center py-8">
                    <div className={cn("relative w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                      anomalyStatus.is_anomaly
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-cyan-500/30 bg-cyan-500/5"
                    )}>
                      {/* Inner Circles */}
                      <div className={cn("absolute inset-2 rounded-full border border-dashed animate-[spin_10s_linear_infinite]",
                        anomalyStatus.is_anomaly ? "border-red-500/50" : "border-cyan-500/30"
                      )} />
                      <div className={cn("absolute inset-6 rounded-full border border-dotted animate-[spin_15s_linear_infinite_reverse]",
                        anomalyStatus.is_anomaly ? "border-red-500/50" : "border-cyan-500/30"
                      )} />

                      <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase font-medium">Anomaly Score</div>
                        <div className={cn("text-3xl font-bold font-mono", anomalyStatus.is_anomaly ? "text-red-500" : "text-white")}>
                          {anomalyStatus.score.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Confidence</span>
                      <span className="text-cyan-400">99.8%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 w-[99.8%]" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>Model</span>
                      <span className="text-slate-300">IsoForest-v2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Console Logs */}
            <div className="flex-1 min-h-[300px] glass-card rounded-2xl p-6 flex flex-col font-mono text-xs overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-white/5 pb-2">
                <Terminal className="w-4 h-4" />
                <span className="uppercase tracking-wider font-semibold">System Output</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <AnimatePresence initial={false}>
                  {logs.length === 0 && (
                    <div className="text-slate-600 italic py-4 text-center">Waiting for network activity...</div>
                  )}
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-l-2 pl-3 py-1"
                      style={{
                        borderColor:
                          log.type === 'error' ? '#ef4444' :
                            log.type === 'success' ? '#22c55e' :
                              log.type === 'critical' ? '#dc2626' :
                                log.type === 'warning' ? '#f59e0b' :
                                  '#3b82f6'
                      }}
                    >
                      <span className="text-slate-500 mr-3">[{log.time}]</span>
                      <span className={cn(
                        log.type === 'critical' && "text-red-400 font-bold animate-pulse",
                        log.type === 'error' && "text-red-300",
                        log.type === 'success' && "text-green-300",
                        log.type === 'warning' && "text-amber-300",
                        log.type === 'info' && "text-blue-200"
                      )}>
                        {log.msg}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App
