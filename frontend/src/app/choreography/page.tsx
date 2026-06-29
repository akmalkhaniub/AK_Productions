"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Upload, Music, Sparkles, Sliders, Volume2, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import * as THREE from "three";

// Preset songs configuration
interface PresetTrack {
  id: string;
  name: string;
  style: string;
  bpm: number;
  duration: number;
  description: string;
}

const PRESETS: PresetTrack[] = [
  { id: "synthwave", name: "Midnight Neon Drive", style: "robot", bpm: 125, duration: 30, description: "A crisp, electronic synthwave track with rigid, mechanical snare beats." },
  { id: "hiphop", name: "B-Boy Street Groove", style: "hip-hop", bpm: 110, duration: 30, description: "Boom-bap rhythm with strong low-end kick beats and a swinging snare." },
  { id: "salsa", name: "Salsa del Fuego", style: "salsa", bpm: 100, duration: 30, description: "Fast-paced Latin percussion with syncopated cowbells and piano montunos." },
  { id: "ambient", name: "Ethereal Echoes", style: "contemporary", bpm: 90, duration: 35, description: "Soft sweeping pads, swelling echoes, and fluid ambient beats." },
];

export default function ChoreographyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // App States
  const [selectedStyle, setSelectedStyle] = useState<string>("robot");
  const [selectedTrackName, setSelectedTrackName] = useState<string>("Midnight Neon Drive");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.5);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [bpm, setBpm] = useState<number>(125);
  const [choreoData, setChoreoData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeMoveIndex, setActiveMoveIndex] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  // References for Animation & Three.js
  const sceneRef = useRef<{
    scene: THREE.Scene;
    joints: Record<string, THREE.Object3D>;
    lines: THREE.LineSegments;
    particles: THREE.Points;
    grid: THREE.GridHelper;
    renderer: THREE.WebGLRenderer;
  } | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // Setup logging helper
  const addLog = (msg: string) => {
    setLogMessages((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Generate choreography from backend
  const fetchChoreography = async (styleName: string, trackName: string, fileObj?: File) => {
    setIsAnalyzing(true);
    addLog(`Initiating Choreography Agent for style: ${styleName}...`);
    
    try {
      const formData = new FormData();
      formData.append("style", styleName);
      formData.append("track_name", trackName);
      if (fileObj) {
        formData.append("file", fileObj);
      }

      const res = await fetch("http://localhost:8000/api/choreography/generate", {
        method: "POST",
        body: formData,
      });
      const resJson = await res.json();
      
      if (resJson.status === "success") {
        const data = resJson.data;
        setChoreoData(data);
        setBpm(data.bpm);
        setDuration(data.duration);
        addLog(`Choreography planned successfully via LLM (${data.provider}). BPM: ${data.bpm.toFixed(1)}`);
      } else {
        throw new Error(resJson.message || "Failed to generate");
      }
    } catch (err: any) {
      addLog(`Error generating choreography: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger analysis on load
  useEffect(() => {
    fetchChoreography("robot", "Midnight Neon Drive");
  }, []);

  // Web Audio Synth for procedural music loops matching style and BPM
  const startProceduralSynth = (bpmVal: number, styleVal: string) => {
    if (customAudioUrl) return; // Use actual audio player if custom file uploaded

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const interval = 60 / bpmVal / 2; // eighth notes
    let nextNoteTime = ctx.currentTime;
    let step = 0;

    const playNote = (time: number, stepIndex: number) => {
      // Create master gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.15, time);
      masterGain.connect(ctx.destination);

      // 1. Kick drum (every quarter note / step % 4 == 0)
      if (stepIndex % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.2);
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        osc.start(time);
        osc.stop(time + 0.25);
      }

      // 2. Snare / Hat (step % 4 == 2)
      if (stepIndex % 4 === 2) {
        // Noise buffer for snare
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1000;

        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        noise.start(time);
        noise.stop(time + 0.18);
      }

      // 3. Cowbell (Salsa style syncopation)
      if (styleVal === "salsa" && (stepIndex % 8 === 3 || stepIndex % 8 === 5)) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(masterGain);

        osc.frequency.setValueAtTime(800, time);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

        osc.start(time);
        osc.stop(time + 0.1);
      }

      // 4. Synth Melody / Pluck chords (based on BPM and style)
      if (stepIndex % 2 === 0) {
        const notes = styleVal === "robot" 
          ? [110, 130.81, 146.83, 164.81] // Industrial min-4
          : styleVal === "hip-hop" 
          ? [98, 116.54, 130.81, 146.83] // G-Minor
          : styleVal === "salsa"
          ? [130.81, 164.81, 196.00, 246.94] // Salsa C-maj
          : [146.83, 164.81, 220.00, 261.63]; // Ambient minor

        const note = notes[Math.floor(Math.random() * notes.length)] * (stepIndex % 16 < 8 ? 1 : 1.5);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = styleVal === "robot" ? "sawtooth" : "triangle";
        osc.connect(gain);
        gain.connect(masterGain);

        osc.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

        osc.start(time);
        osc.stop(time + 0.3);
      }
    };

    const scheduler = () => {
      while (nextNoteTime < ctx.currentTime + 0.1) {
        playNote(nextNoteTime, step);
        nextNoteTime += interval;
        step = (step + 1) % 32;
      }
      synthIntervalRef.current = window.setTimeout(scheduler, 25);
    };

    scheduler();
  };

  const stopProceduralSynth = () => {
    if (synthIntervalRef.current) {
      clearTimeout(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Play/Pause Action
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopProceduralSynth();
      if (customAudioRef.current) customAudioRef.current.pause();
      addLog("Choreography playback paused.");
    } else {
      setIsPlaying(true);
      if (customAudioUrl && customAudioRef.current) {
        customAudioRef.current.volume = volume;
        customAudioRef.current.playbackRate = playbackSpeed;
        customAudioRef.current.play();
      } else {
        startProceduralSynth(bpm, selectedStyle);
      }
      addLog("Choreography playback started.");
    }
  };

  // Reset Action
  const handleReset = () => {
    setIsPlaying(false);
    stopProceduralSynth();
    setCurrentTime(0);
    timeRef.current = 0;
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
    }
    addLog("Choreography sequence reset to frame 0.");
  };

  // Handle speed and volume changes
  useEffect(() => {
    if (customAudioRef.current) {
      customAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (customAudioRef.current) {
      customAudioRef.current.volume = volume;
    }
  }, [volume]);

  // Track preset track selection
  const handlePresetSelect = (track: PresetTrack) => {
    handleReset();
    setCustomAudioUrl(null);
    setSelectedTrackName(track.name);
    setSelectedStyle(track.style);
    fetchChoreography(track.style, track.name);
  };

  // Handle custom audio file upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleReset();
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setSelectedTrackName(file.name);
    addLog(`Uploaded custom audio: ${file.name}. Triggering beat-tracking...`);
    fetchChoreography(selectedStyle, file.name, file);
  };

  // Custom Audio element callbacks
  const onAudioTimeUpdate = () => {
    if (customAudioRef.current) {
      setCurrentTime(customAudioRef.current.currentTime);
      timeRef.current = customAudioRef.current.currentTime;
    }
  };

  const onAudioEnded = () => {
    setIsPlaying(false);
    addLog("Track finished.");
  };

  // Setup Three.js Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    // 1. Scene & Render
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate-950
    scene.fog = new THREE.FogExp2(0x020617, 0.15);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 3.8);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const neonPointLight = new THREE.PointLight(0xe0218a, 2, 8); // Pink glow
    neonPointLight.position.set(0, 1.5, 0);
    scene.add(neonPointLight);

    // 3. Grid Floor
    const grid = new THREE.GridHelper(20, 40, 0x38bdf8, 0x1e293b); // Cyan main, slate subdivisions
    grid.position.y = 0;
    scene.add(grid);

    // 4. Mannequin Skeleton Group
    const mannequinGroup = new THREE.Group();
    scene.add(mannequinGroup);

    // Define Joints
    const joints: Record<string, THREE.Object3D> = {};
    const jointMaterial = new THREE.MeshBasicMaterial({ color: 0xe0218a }); // Neon pink joints
    const jointGeom = new THREE.SphereGeometry(0.04, 16, 16);

    const createJoint = (name: string, parent?: THREE.Object3D, localPos: [number, number, number] = [0, 0, 0]) => {
      const obj = new THREE.Object3D();
      obj.name = name;
      obj.position.set(...localPos);
      
      const mesh = new THREE.Mesh(jointGeom, jointMaterial);
      obj.add(mesh);

      if (parent) {
        parent.add(obj);
      } else {
        mannequinGroup.add(obj);
      }
      joints[name] = obj;
      return obj;
    };

    // Construct hierarchy (forward kinematics)
    const hips = createJoint("hips", undefined, [0, 0.9, 0]);
    const spine = createJoint("spine", hips, [0, 0.25, 0]);
    const head = createJoint("head", spine, [0, 0.22, 0]);

    // Head volume
    const faceMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const faceGeom = new THREE.SphereGeometry(0.07, 8, 8);
    const faceMesh = new THREE.Mesh(faceGeom, faceMaterial);
    faceMesh.position.y = 0.05;
    head.add(faceMesh);

    // Arms
    const leftShoulder = createJoint("leftShoulder", spine, [-0.2, 0.15, 0]);
    const leftElbow = createJoint("leftElbow", leftShoulder, [-0.2, 0, 0]);
    const leftWrist = createJoint("leftWrist", leftElbow, [-0.18, 0, 0]);

    const rightShoulder = createJoint("rightShoulder", spine, [0.2, 0.15, 0]);
    const rightElbow = createJoint("rightElbow", rightShoulder, [0.2, 0, 0]);
    const rightWrist = createJoint("rightWrist", rightElbow, [0.18, 0, 0]);

    // Legs
    const leftHip = createJoint("leftHip", hips, [-0.1, -0.05, 0]);
    const leftKnee = createJoint("leftKnee", leftHip, [0, -0.32, 0]);
    const leftAnkle = createJoint("leftAnkle", leftKnee, [0, -0.32, 0]);

    const rightHip = createJoint("rightHip", hips, [0.1, -0.05, 0]);
    const rightKnee = createJoint("rightKnee", rightHip, [0, -0.32, 0]);
    const rightAnkle = createJoint("rightAnkle", rightKnee, [0, -0.32, 0]);

    // 5. Skeleton Connection Lines
    const lineIndices = [
      // Spine
      "hips", "spine", "spine", "head",
      // Left arm
      "spine", "leftShoulder", "leftShoulder", "leftElbow", "leftElbow", "leftWrist",
      // Right arm
      "spine", "rightShoulder", "rightShoulder", "rightElbow", "rightElbow", "rightWrist",
      // Left leg
      "hips", "leftHip", "leftHip", "leftKnee", "leftKnee", "leftAnkle",
      // Right leg
      "hips", "rightHip", "rightHip", "rightKnee", "rightKnee", "rightAnkle"
    ];

    const positions = new Float32Array(lineIndices.length * 3);
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }); // Neon cyan lines
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lines);

    // 6. Particles system
    const particleCount = 120;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 8;
      particlePos[i * 3 + 1] = Math.random() * 4;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.03, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Save resources
    sceneRef.current = { scene, joints, lines, particles, grid, renderer };

    // Handle Resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Animation Loop (Synchronized with Audio)
  useEffect(() => {
    let lastTime = 0;

    const tick = (now: number) => {
      if (!sceneRef.current || !canvasRef.current) {
        animationFrameId.current = requestAnimationFrame(tick);
        return;
      }

      const { scene, joints, lines, particles, grid, renderer } = sceneRef.current;

      // 1. Advance timeline procedural time if synth loop is active
      if (isPlaying && !customAudioUrl) {
        const delta = (now - (lastTime || now)) / 1000;
        const newTime = timeRef.current + delta * playbackSpeed;
        if (newTime >= duration) {
          // loop
          timeRef.current = 0;
          setCurrentTime(0);
        } else {
          timeRef.current = newTime;
          setCurrentTime(newTime);
        }
      }
      lastTime = now;

      // 2. Resolve active choreo state
      const t = timeRef.current;
      let activeMove = null;
      let nextMove = null;

      if (choreoData && choreoData.dance_moves && choreoData.dance_moves.length > 0) {
        const moves = choreoData.dance_moves;
        
        // Find current move
        for (let i = 0; i < moves.length; i++) {
          if (moves[i].time <= t) {
            activeMove = moves[i];
            setActiveMoveIndex(i);
          }
        }
        if (!activeMove) activeMove = moves[0];

        // Find next move for interpolation
        const nextIdx = moves.indexOf(activeMove) + 1;
        if (nextIdx < moves.length) {
          nextMove = moves[nextIdx];
        } else {
          nextMove = activeMove;
        }

        // Interpolation weight
        let weight = 0;
        if (nextMove && nextMove !== activeMove) {
          const moveDuration = nextMove.time - activeMove.time;
          weight = (t - activeMove.time) / moveDuration;
          weight = Math.max(0, Math.min(1, weight)); // Clamp
          // Smooth interpolation
          weight = Math.sin(weight * Math.PI / 2);
        }

        // 3. Animate joints (Forward Kinematics)
        const targetsA = activeMove.joint_targets || {};
        const targetsB = nextMove.joint_targets || {};

        Object.keys(joints).forEach((jName) => {
          const joint = joints[jName];
          const rotA = targetsA[jName] || [0, 0, 0];
          const rotB = targetsB[jName] || [0, 0, 0];

          // Blend rotations
          const rx = rotA[0] * (1 - weight) + rotB[0] * weight;
          const ry = rotA[1] * (1 - weight) + rotB[1] * weight;
          const rz = rotA[2] * (1 - weight) + rotB[2] * weight;

          joint.rotation.set(rx, ry, rz);
        });

        // 4. Procedural Hip Bounce matching BPM / Beat
        const activeIntensity = activeMove.intensity || 0.5;
        const beatPeriod = 60 / bpm;
        const beatProgress = (t % beatPeriod) / beatPeriod;
        // Bounce formula
        const bounce = Math.abs(Math.sin(beatProgress * Math.PI)) * 0.08 * activeIntensity;
        joints["hips"].position.y = 0.9 - bounce;
        
        // Light sync beat pulses
        if (scene.children[2] instanceof THREE.PointLight) {
          scene.children[2].intensity = 1.0 + bounce * 15;
        }

        // Grid reflects beat bounce
        grid.scale.set(1 + bounce * 0.1, 1, 1 + bounce * 0.1);
      }

      // 5. Update Connection Lines World Positions
      const positions = lines.geometry.attributes.position.array as Float32Array;
      const lineIndices = [
        "hips", "spine", "spine", "head",
        "spine", "leftShoulder", "leftShoulder", "leftElbow", "leftElbow", "leftWrist",
        "spine", "rightShoulder", "rightShoulder", "rightElbow", "rightElbow", "rightWrist",
        "hips", "leftHip", "leftHip", "leftKnee", "leftKnee", "leftAnkle",
        "hips", "rightHip", "rightHip", "rightKnee", "rightKnee", "rightAnkle"
      ];

      const v = new THREE.Vector3();
      for (let i = 0; i < lineIndices.length; i += 2) {
        const jA = joints[lineIndices[i]];
        const jB = joints[lineIndices[i + 1]];

        if (jA && jB) {
          jA.getWorldPosition(v);
          positions[i * 3] = v.x;
          positions[i * 3 + 1] = v.y;
          positions[i * 3 + 2] = v.z;

          jB.getWorldPosition(v);
          positions[(i + 1) * 3] = v.x;
          positions[(i + 1) * 3 + 1] = v.y;
          positions[(i + 1) * 3 + 2] = v.z;
        }
      }
      lines.geometry.attributes.position.needsUpdate = true;

      // 6. Camera Orbit rotation
      const orbitSpeed = 0.003;
      const orbitRadius = 4.2;
      const angle = now * orbitSpeed * 0.1;
      // Gently sway camera around dancer
      const cameraObj = scene.children.find(c => c instanceof THREE.PerspectiveCamera);
      if (cameraObj) {
        cameraObj.position.x = Math.sin(angle) * orbitRadius;
        cameraObj.position.z = Math.cos(angle) * orbitRadius;
        cameraObj.lookAt(0, 0.9, 0);
      }

      // Render
      renderer.render(scene, cameraObj as THREE.PerspectiveCamera);

      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, choreoData, bpm, duration, customAudioUrl, playbackSpeed]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent uppercase">
            <Sparkles className="h-3 w-3 animate-pulse" />
            AI Production Suite · R&D
          </span>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl mt-1">
            Music-to-Motion Choreographer
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Procedural dance synchronization pipeline. Upload music and generate skeletal choreographies using Gemini.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 3D Stage & Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-slate-950 shadow-xl group">
            <canvas ref={canvasRef} className="w-full h-full" />
            
            {/* 3D overlay badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2.5 py-1 text-xs font-semibold backdrop-blur text-accent border border-accent/20">
                <Music className="h-3 w-3" />
                {selectedTrackName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2.5 py-1 text-xs font-semibold backdrop-blur text-sky-400 border border-sky-400/20">
                Style: {selectedStyle.toUpperCase()}
              </span>
            </div>

            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2.5 py-1 text-xs font-mono font-bold backdrop-blur text-white border border-border">
                BPM: {bpm.toFixed(0)}
              </span>
            </div>

            {/* Playback Progress Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-slate-900/80 border border-border px-4 py-3 backdrop-blur flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentTime.toFixed(1)}s</span>
                <span className="font-mono text-[10px] text-accent uppercase tracking-wider">
                  {choreoData?.dance_moves?.[activeMoveIndex]?.move_description || "Synchronizing..."}
                </span>
                <span>{duration.toFixed(1)}s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-accent transition-all duration-75"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Player controls */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Audio Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  disabled={isAnalyzing}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90 transition-all glow-hover"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card/60 text-foreground hover:bg-muted transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 accent-accent cursor-pointer bg-slate-800 rounded"
                />
              </div>

              {/* Speed Multiplier */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Speed:</span>
                {[0.5, 1.0, 2.0].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded border ${
                      playbackSpeed === speed
                        ? "bg-accent/15 border-accent text-accent"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Preset Track Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Style:</span>
                {["robot", "hip-hop", "salsa", "contemporary"].map((style) => (
                  <button
                    key={style}
                    onClick={() => {
                      setSelectedStyle(style);
                      fetchChoreography(style, selectedTrackName);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border uppercase ${
                      selectedStyle === style
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

            </div>

            {/* Custom Audio Element if file uploaded */}
            {customAudioUrl && (
              <audio
                ref={(el) => { customAudioRef.current = el; }}
                src={customAudioUrl}
                onTimeUpdate={onAudioTimeUpdate}
                onEnded={onAudioEnded}
                className="hidden"
              />
            )}
          </div>
        </div>

        {/* Right Col: Audio Source, Choreo Routine Log */}
        <div className="space-y-6">
          
          {/* Audio Source / Ingestion */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sliders className="h-4 w-4 text-accent" />
              Choreography Config
            </h3>
            
            {/* Preset selector grid */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">Preset Audio Tracks</label>
              <div className="grid grid-cols-1 gap-2">
                {PRESETS.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handlePresetSelect(track)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all hover:border-accent/40 ${
                      selectedTrackName === track.name && !customAudioUrl
                        ? "bg-accent/5 border-accent text-accent"
                        : "border-border bg-card/40 text-foreground"
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>{track.name}</span>
                      <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {track.bpm} BPM
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{track.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/60 my-4" />

            {/* Audio Upload */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">Or Upload Track (.mp3, .wav)</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/30 p-4 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Custom Soundtrack</span>
              </button>
            </div>
          </div>

          {/* Choreography Routine Timeline */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg flex flex-col h-[400px]">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              Generated Moves
            </h3>
            
            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                <span className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <span className="text-xs text-muted-foreground">Agent mapping choreography timeline...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                {choreoData?.dance_moves?.map((move: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      activeMoveIndex === idx
                        ? "bg-accent/10 border-accent/60 shadow"
                        : "border-border bg-card/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-accent font-semibold">{move.time.toFixed(1)}s</span>
                      <span className="text-xs font-bold uppercase text-foreground">{move.pose_name.replace("_", " ")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{move.move_description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400" style={{ width: `${move.intensity * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Int: {(move.intensity * 10).toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Agent Activity Logs */}
      <div className="rounded-xl border border-border bg-slate-900/60 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          Choreographer Agent Console Logs
        </h4>
        <div className="h-32 overflow-y-auto font-mono text-xs text-muted-foreground space-y-1 bg-slate-950 p-4 rounded-lg border border-border/40">
          {logMessages.map((log, index) => (
            <div key={index} className="leading-relaxed">{log}</div>
          ))}
          {logMessages.length === 0 && <div className="text-muted-foreground/40">Console waiting for actions...</div>}
        </div>
      </div>
    </div>
  );
}
