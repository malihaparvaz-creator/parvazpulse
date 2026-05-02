/**
 * Parvaz Pulse - Mood Canvas
 * Full touch + mouse support: draw, zoom, pan on tablet and desktop
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Trash2, ZoomIn, ZoomOut, Maximize2, ChevronUp, ChevronDown } from 'lucide-react';
import { useLocation } from 'wouter';
import { saveMoodCanvasEntry, getAllMoodCanvasEntries, deleteMoodCanvasEntry, syncAllToFirestore } from '@/lib/store';
import { toast } from 'sonner';

interface Sticker {
  id: string; emoji: string; x: number; y: number; rotation: number; size: number;
}
type DrawingMode = 'draw' | 'erase' | 'rectangle' | 'circle' | 'line' | 'triangle' | 'star' | 'pentagon' | 'hexagon' | 'octagon' | 'heart' | 'diamond' | 'arrow-right' | 'arrow-left' | 'arrow-up' | 'arrow-down' | 'arrow-double' | 'arrow-curved' | 'cloud' | 'speech-bubble' | 'rounded-rect';
type BrushPreset = 'pencil' | 'marker' | 'watercolor';

export default function MoodCanvas() {
  const MAX_SCALE = 8;
  const MIN_SCALE = 0.2;
  const DEFAULT_DOC_SIZE = { width: 2400, height: 1800 };

  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('Balanced');
  const [lastSaveTime, setLastSaveTime] = useState('');
  const [draggedSticker, setDraggedSticker] = useState<string | null>(null);
  const [resizingSticker, setResizingSticker] = useState<string | null>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const backgroundContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Drawing controls
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('draw');
  const [brushPreset, setBrushPreset] = useState<BrushPreset>('pencil');
  const [brushColor, setBrushColor] = useState('#C8B4DC');
  const [brushWidth, setBrushWidth] = useState(3);
  const [eraserWidth, setEraserWidth] = useState(15);
  const [shapeColor, setShapeColor] = useState('#C8B4DC');
  const [shapeFill, setShapeFill] = useState(false);
  const [canvasImageData, setCanvasImageData] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documentSize, setDocumentSize] = useState(DEFAULT_DOC_SIZE);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);
  // Pinch-to-zoom
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  // Use refs for scale/pan in touch handlers to avoid stale closures
  const scaleRef = useRef(1);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);

  const moodEmojis = ['✨', '🌿', '💫', '🌸', '🔮', '💎', '🌀', '⚖️', '🌊', '💜'];
  const moods = ['Overwhelmed', 'Calm', 'Focused', 'Creative', 'Energetic', 'Balanced', 'Stressed', 'Happy', 'Sad', 'Neutral'];

  const stickerEmojis = [
    '☁️','⭐','🌙','💭','🎨','🧿','🫧','✨','🌊','🍃','🌟','⚡','🔥','💫','🌠',
    '🌸','🌺','🌻','🌷','🌹','💐','🌼','🌵','🌴','🌲','🌳','🌱','🍀','🌿','🍂',
    '🦋','🐝','🐞','🐢','🐙','🐠','🐟','🌌','🔭','🚀',
    '💎','💍','👑','🎭','🎨','🎵','🎶','📚','✏️','🎀',
    '❤️','🧡','💛','💚','💙','💜','🖤','💕','💞','💓',
    '⚡','🔥','💧','❄️','🌈','☀️','🌤️','🌊','🏔️','🌋',
    '🍎','🍊','🍋','🌸','🎂','🧁','🍫','🍬','☕','🍵',
  ];

  // Load saved canvas data
  useEffect(() => {
    const entries = getAllMoodCanvasEntries();
    const moodEntry = entries.find((e) => e.mood === mood);
    if (moodEntry?.content) {
      setCanvasImageData(moodEntry.content);
      setNotes(moodEntry.notes || '');
      if ((moodEntry as any).stickers) setStickers((moodEntry as any).stickers);
    } else {
      setCanvasImageData(null); setNotes(''); setStickers([]);
    }
  }, [mood]);

  // Initialize canvases
  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const W = Math.max(DEFAULT_DOC_SIZE.width, Math.ceil(rect.width * 2));
    const H = Math.max(DEFAULT_DOC_SIZE.height, Math.ceil(rect.height * 2));
    setDocumentSize({ width: W, height: H });

    canvas.width = W; canvas.height = H;
    bgCanvas.width = W; bgCanvas.height = H;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !bgCtx) return;
    canvasContextRef.current = ctx;
    backgroundContextRef.current = bgCtx;

    const gradientMap: Record<string, [string, string]> = {
      'Overwhelmed': ['#E8D5E8', '#D4C5E8'], 'Calm': ['#E8E4F3', '#D4E8F7'],
      'Focused': ['#D4E8F7', '#C5D9F1'], 'Creative': ['#F5E8D4', '#E8D4C5'],
      'Energetic': ['#E8D4D4', '#F5D4D4'], 'Balanced': ['#E8E4F3', '#D4E8F7'],
      'Stressed': ['#E8D5D5', '#D4C5C5'], 'Happy': ['#FFE8D4', '#FFD4C5'],
      'Sad': ['#D4D4E8', '#C5C5D4'], 'Neutral': ['#E8E8E8', '#D4D4D4'],
    };
    const [c1, c2] = gradientMap[mood] || gradientMap['Balanced'];
    const grad = bgCtx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, c1); grad.addColorStop(1, c2);
    bgCtx.fillStyle = grad; bgCtx.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) {
      bgCtx.fillStyle = 'rgba(255,255,255,0.08)';
      bgCtx.beginPath(); bgCtx.arc(Math.random()*W, Math.random()*H, Math.random()*3+1, 0, Math.PI*2); bgCtx.fill();
    }
    ctx.clearRect(0, 0, W, H);
    if (canvasImageData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = canvasImageData;
    }

    // Start with the document centered in the viewport.
    setPanOffset({ x: (rect.width - W) / 2, y: (rect.height - H) / 2 });
    setScale(1);
  }, [mood, canvasImageData]);

  // Keyboard zoom/pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); spaceHeldRef.current = true; }
      if ((e.ctrlKey || e.metaKey) && e.key === '=') { e.preventDefault(); setScale((s: number) => Math.min(MAX_SCALE, parseFloat((s+0.15).toFixed(2)))); }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); setScale((s: number) => Math.max(MIN_SCALE, parseFloat((s-0.15).toFixed(2)))); }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); setScale(1); setPanOffset({x:0,y:0}); }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') spaceHeldRef.current = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  // ─── Coordinate helpers ────────────────────────────────────────────────────
  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;

    // Get the container (viewport) rect
    const containerRect = container.getBoundingClientRect();

    // Client position relative to container
    const relX = clientX - containerRect.left;
    const relY = clientY - containerRect.top;

    // Undo the CSS transform: translate(panX, panY) scale(s)
    // Canvas world coords = (screenPos - panOffset) / scale
    const s = scaleRef.current;
    const p = panOffsetRef.current;
    const worldX = (relX - p.x) / s;
    const worldY = (relY - p.y) / s;

    // Clamp to canvas bounds
    if (worldX < 0 || worldY < 0 || worldX > canvas.width || worldY > canvas.height) return null;

    return { x: worldX, y: worldY };
  };

  const zoomAtPoint = useCallback((targetScale: number, clientX?: number, clientY?: number) => {
    const wrapper = canvasWrapperRef.current;
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, parseFloat(targetScale.toFixed(2))));
    const prevScale = scaleRef.current;

    if (!wrapper || prevScale === nextScale || clientX === undefined || clientY === undefined) {
      setScale(nextScale);
      return;
    }

    const rect = wrapper.getBoundingClientRect();
    const worldX = (clientX - rect.left) / prevScale;
    const worldY = (clientY - rect.top) / prevScale;

    setScale(nextScale);
    setPanOffset({
      x: clientX - worldX * nextScale,
      y: clientY - worldY * nextScale,
    });
  }, []);
  // ─── Drawing helpers ───────────────────────────────────────────────────────
  const drawWithBrush = (ctx: CanvasRenderingContext2D, x: number, y: number, px: number, py: number) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (brushPreset === 'pencil') {
      ctx.strokeStyle = brushColor; ctx.lineWidth = brushWidth; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    } else if (brushPreset === 'marker') {
      ctx.strokeStyle = brushColor; ctx.lineWidth = brushWidth * 1.5; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      ctx.lineWidth = brushWidth * 0.5; ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    } else {
      const dist = Math.sqrt((x-px)**2+(y-py)**2);
      const steps = Math.ceil(dist);
      for (let i = 0; i < steps; i++) {
        const t = steps > 0 ? i/steps : 0;
        const qx = px+(x-px)*t, qy = py+(y-py)*t;
        ctx.strokeStyle = brushColor; ctx.lineWidth = brushWidth*1.2; ctx.globalAlpha = 0.5+Math.random()*0.3;
        ctx.beginPath(); ctx.moveTo(qx,qy); ctx.lineTo(qx+(Math.random()-.5)*2, qy+(Math.random()-.5)*2); ctx.stroke();
        ctx.lineWidth = brushWidth*2; ctx.globalAlpha = 0.15+Math.random()*0.1;
        ctx.beginPath(); ctx.moveTo(qx,qy); ctx.lineTo(qx+(Math.random()-.5)*4, qy+(Math.random()-.5)*4); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const drawShape = (ctx: CanvasRenderingContext2D, start: {x:number;y:number}, end: {x:number;y:number}, mode: DrawingMode) => {
    ctx.strokeStyle = shapeColor; ctx.fillStyle = shapeColor; ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const W = end.x - start.x, H = end.y - start.y;
    switch(mode) {
      case 'rectangle': shapeFill ? ctx.fillRect(start.x,start.y,W,H) : ctx.strokeRect(start.x,start.y,W,H); break;
      case 'circle': { const r=Math.sqrt(W**2+H**2); ctx.beginPath(); ctx.arc(start.x,start.y,r,0,Math.PI*2); shapeFill?ctx.fill():ctx.stroke(); break; }
      case 'line': ctx.beginPath(); ctx.moveTo(start.x,start.y); ctx.lineTo(end.x,end.y); ctx.stroke(); break;
      case 'triangle': ctx.beginPath(); ctx.moveTo(start.x,start.y); ctx.lineTo(end.x,end.y); ctx.lineTo(start.x-(end.x-start.x),end.y); ctx.closePath(); shapeFill?ctx.fill():ctx.stroke(); break;
      case 'star': drawStar(ctx,start.x,start.y,5,Math.abs(W),Math.abs(H),shapeFill); break;
      case 'pentagon': drawPolygon(ctx,start.x,start.y,5,Math.abs(W),shapeFill); break;
      case 'hexagon': drawPolygon(ctx,start.x,start.y,6,Math.abs(W),shapeFill); break;
      case 'octagon': drawPolygon(ctx,start.x,start.y,8,Math.abs(W),shapeFill); break;
      case 'heart': drawHeart(ctx,start.x,start.y,Math.abs(W),shapeFill); break;
      case 'diamond': drawDiamond(ctx,start.x,start.y,Math.abs(W),Math.abs(H),shapeFill); break;
      case 'arrow-right': drawArrow(ctx,start.x,start.y,end.x,end.y,shapeFill); break;
      case 'arrow-left': drawArrow(ctx,end.x,end.y,start.x,start.y,shapeFill); break;
      case 'arrow-up': drawArrow(ctx,start.x,end.y,start.x,start.y,shapeFill); break;
      case 'arrow-down': drawArrow(ctx,start.x,start.y,start.x,end.y,shapeFill); break;
      case 'arrow-double': drawDoubleArrow(ctx,start.x,start.y,end.x,end.y,shapeFill); break;
      case 'arrow-curved': drawCurvedArrow(ctx,start.x,start.y,end.x,end.y,shapeFill); break;
      case 'cloud': drawCloud(ctx,start.x,start.y,Math.abs(W),Math.abs(H),shapeFill); break;
      case 'speech-bubble': drawSpeechBubble(ctx,start.x,start.y,Math.abs(W),Math.abs(H),shapeFill); break;
      case 'rounded-rect': drawRoundedRect(ctx,start.x,start.y,W,H,10,shapeFill); break;
    }
  };

  const drawStar=(ctx:CanvasRenderingContext2D,cx:number,cy:number,spikes:number,outer:number,inner:number,fill:boolean)=>{
    let rot=Math.PI/2*3; const step=Math.PI/spikes;
    ctx.beginPath(); ctx.moveTo(cx,cy-outer);
    for(let i=0;i<spikes;i++){ctx.lineTo(cx+Math.cos(rot)*outer,cy+Math.sin(rot)*outer);rot+=step;ctx.lineTo(cx+Math.cos(rot)*inner,cy+Math.sin(rot)*inner);rot+=step;}
    ctx.lineTo(cx,cy-outer); ctx.closePath(); fill?ctx.fill():ctx.stroke();
  };
  const drawPolygon=(ctx:CanvasRenderingContext2D,cx:number,cy:number,sides:number,r:number,fill:boolean)=>{
    ctx.beginPath();
    for(let i=0;i<sides;i++){const a=(i*2*Math.PI)/sides-Math.PI/2;const x=cx+r*Math.cos(a);const y=cy+r*Math.sin(a);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.closePath(); fill?ctx.fill():ctx.stroke();
  };
  const drawHeart=(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,fill:boolean)=>{
    ctx.beginPath();ctx.moveTo(x,y+s/4);ctx.quadraticCurveTo(x-s/2,y-s/4,x-s/2,y-s/2);ctx.quadraticCurveTo(x-s/2,y-s,x,y-s/2);ctx.quadraticCurveTo(x+s/2,y-s,x+s/2,y-s/2);ctx.quadraticCurveTo(x+s/2,y-s/4,x,y+s/4);ctx.closePath();fill?ctx.fill():ctx.stroke();
  };
  const drawDiamond=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill:boolean)=>{
    ctx.beginPath();ctx.moveTo(x,y-h/2);ctx.lineTo(x+w/2,y);ctx.lineTo(x,y+h/2);ctx.lineTo(x-w/2,y);ctx.closePath();fill?ctx.fill():ctx.stroke();
  };
  const drawArrow=(ctx:CanvasRenderingContext2D,fx:number,fy:number,tx:number,ty:number,fill:boolean)=>{
    const hl=15,a=Math.atan2(ty-fy,tx-fx);
    ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(tx,ty);ctx.stroke();
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-hl*Math.cos(a-Math.PI/6),ty-hl*Math.sin(a-Math.PI/6));ctx.lineTo(tx-hl*Math.cos(a+Math.PI/6),ty-hl*Math.sin(a+Math.PI/6));ctx.closePath();fill?ctx.fill():ctx.stroke();
  };
  const drawDoubleArrow=(ctx:CanvasRenderingContext2D,fx:number,fy:number,tx:number,ty:number,fill:boolean)=>{
    const hl=15,a=Math.atan2(ty-fy,tx-fx);
    ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(tx,ty);ctx.stroke();
    ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+hl*Math.cos(a+Math.PI-Math.PI/6),fy+hl*Math.sin(a+Math.PI-Math.PI/6));ctx.lineTo(fx+hl*Math.cos(a+Math.PI+Math.PI/6),fy+hl*Math.sin(a+Math.PI+Math.PI/6));ctx.closePath();fill?ctx.fill():ctx.stroke();
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-hl*Math.cos(a-Math.PI/6),ty-hl*Math.sin(a-Math.PI/6));ctx.lineTo(tx-hl*Math.cos(a+Math.PI/6),ty-hl*Math.sin(a+Math.PI/6));ctx.closePath();fill?ctx.fill():ctx.stroke();
  };
  const drawCurvedArrow=(ctx:CanvasRenderingContext2D,fx:number,fy:number,tx:number,ty:number,fill:boolean)=>{
    const cpx=(fx+tx)/2,cpy=(fy+ty)/2-50,a=Math.atan2(ty-cpy,tx-cpx),hl=15;
    ctx.beginPath();ctx.moveTo(fx,fy);ctx.quadraticCurveTo(cpx,cpy,tx,ty);ctx.stroke();
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-hl*Math.cos(a-Math.PI/6),ty-hl*Math.sin(a-Math.PI/6));ctx.lineTo(tx-hl*Math.cos(a+Math.PI/6),ty-hl*Math.sin(a+Math.PI/6));ctx.closePath();fill?ctx.fill():ctx.stroke();
  };
  const drawCloud=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill:boolean)=>{
    const r=Math.min(w,h)/3;
    ctx.beginPath();ctx.arc(x-w/4,y,r,0,Math.PI*2);ctx.arc(x,y-h/4,r,0,Math.PI*2);ctx.arc(x+w/4,y,r,0,Math.PI*2);ctx.arc(x,y+h/4,r,0,Math.PI*2);ctx.closePath();fill?ctx.fill():ctx.stroke();
  };
  const drawSpeechBubble=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill:boolean)=>{
    const r=10;
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+w/2+10,y+h);ctx.lineTo(x+w/2,y+h+15);ctx.lineTo(x+w/2-10,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();fill?ctx.fill():ctx.stroke();
  };
  const drawRoundedRect=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:boolean)=>{
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();fill?ctx.fill():ctx.stroke();
  };

  // ─── Mouse event handlers ─────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (spaceHeldRef.current) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffsetRef.current.x, y: e.clientY - panOffsetRef.current.y };
      return;
    }
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;
    setIsDrawing(true); setStartPoint(pos); lastPointRef.current = pos;
    const ctx = canvasContextRef.current;
    if (!ctx) return;
    if (drawingMode === 'draw') { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
    else if (drawingMode !== 'erase') {
      const canvas = canvasRef.current;
      if (canvas) snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      panOffsetRef.current = {
    x: e.clientX - panStartRef.current.x,
  y: e.clientY - panStartRef.current.y,
};
setPanOffset(panOffsetRef.current);
    }
    if (!isDrawing) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos || !startPoint) return;
    const ctx = canvasContextRef.current;
    if (!ctx) return;
    const prev = lastPointRef.current || startPoint;
    if (drawingMode === 'draw') { drawWithBrush(ctx, pos.x, pos.y, prev.x, prev.y); lastPointRef.current = pos; }
    else if (drawingMode === 'erase') { ctx.clearRect(pos.x - eraserWidth/2, pos.y - eraserWidth/2, eraserWidth, eraserWidth); lastPointRef.current = pos; }
    else {
      const canvas = canvasRef.current;
      if (canvas && snapshotRef.current) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.putImageData(snapshotRef.current, 0, 0);
        ctx.restore();
      }
      drawShape(ctx, startPoint, pos, drawingMode);
    }
  };

  const handleMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) { isPanningRef.current = false; return; }
    if (isDrawing && startPoint && drawingMode !== 'draw' && drawingMode !== 'erase' && e) {
      const pos = getCanvasPos(e.clientX, e.clientY);
      if (pos) { const ctx = canvasContextRef.current; if (ctx) drawShape(ctx, startPoint, pos, drawingMode); }
    }
    setIsDrawing(false); setStartPoint(null); lastPointRef.current = null;
    autoSaveCanvas();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      zoomAtPoint(scaleRef.current + (e.deltaY > 0 ? -0.1 : 0.1), e.clientX, e.clientY);
    }
  };

  // ─── Touch event handlers ─────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      // Pinch-to-zoom start
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      lastPinchDistRef.current = Math.sqrt(dx*dx + dy*dy);
      lastPinchCenterRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      setIsDrawing(false);
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const pos = getCanvasPos(t.clientX, t.clientY);
      if (!pos) return;
      setIsDrawing(true); setStartPoint(pos); lastPointRef.current = pos;
      const ctx = canvasContextRef.current;
      if (!ctx) return;
      if (drawingMode === 'draw') { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
      else if (drawingMode !== 'erase') {
        const canvas = canvasRef.current;
        if (canvas) snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    }
  }, [drawingMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      if (lastPinchDistRef.current !== null) {
        const ratio = dist / lastPinchDistRef.current;
        const prevScale = scaleRef.current;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevScale * ratio));
        const clampedScale = parseFloat(newScale.toFixed(2));

        if (lastPinchCenterRef.current) {
          const prevCenter = lastPinchCenterRef.current;
          const dx2 = center.x - prevCenter.x;
          const dy2 = center.y - prevCenter.y;

          setPanOffset((p: { x: number; y: number }) => ({
            x: center.x - (center.x - p.x) * (clampedScale / prevScale) + dx2,
            y: center.y - (center.y - p.y) * (clampedScale / prevScale) + dy2,
          }));
        }

        setScale(clampedScale);
        lastPinchDistRef.current = dist;
        lastPinchCenterRef.current = center;
        return;
      }
    }
    if (!isDrawing || e.touches.length !== 1) return;
    const t = e.touches[0];
    const pos = getCanvasPos(t.clientX, t.clientY);
    if (!pos || !startPoint) return;
    const ctx = canvasContextRef.current;
    if (!ctx) return;
    const prev = lastPointRef.current || startPoint;
    if (drawingMode === 'draw') { drawWithBrush(ctx, pos.x, pos.y, prev.x, prev.y); lastPointRef.current = pos; }
    else if (drawingMode === 'erase') { ctx.clearRect(pos.x - eraserWidth/2, pos.y - eraserWidth/2, eraserWidth, eraserWidth); lastPointRef.current = pos; }
    else {
      const canvas = canvasRef.current;
      if (canvas && snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      drawShape(ctx, startPoint, pos, drawingMode);
    }
  }, [isDrawing, drawingMode, startPoint, eraserWidth]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    lastPinchDistRef.current = null;
    lastPinchCenterRef.current = null;
    if (e.touches.length === 0) {
      if (isDrawing && startPoint && drawingMode !== 'draw' && drawingMode !== 'erase') {
        const changedTouch = e.changedTouches[0];
        const pos = getCanvasPos(changedTouch.clientX, changedTouch.clientY);
        if (pos) { const ctx = canvasContextRef.current; if (ctx) drawShape(ctx, startPoint, pos, drawingMode); }
      }
      setIsDrawing(false); setStartPoint(null); lastPointRef.current = null;
      autoSaveCanvas();
    }
  }, [isDrawing, drawingMode, startPoint]);

  // ─── Sticker drag (touch-aware) ───────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, emoji: string) => {
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('emoji', emoji);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const emoji = e.dataTransfer.getData('emoji');
    if (!emoji) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;
    const { x, y } = pos;
    setStickers((prev: Sticker[]) => [...prev, { id: `s_${Date.now()}`, emoji, x, y, rotation: Math.random()*30-15, size: 40 }]);
    autoSaveCanvas();
  };
  const handleStickerMouseDown = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setDraggedSticker(id); };
  const handleStickerMouseMove = (e: React.MouseEvent) => {
    if (!draggedSticker) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;
    const { x, y } = pos;
    setStickers((s: Sticker[]) => s.map((st: Sticker) => st.id === draggedSticker ? {...st, x, y} : st));
  };
  const handleStickerMouseUp = () => { setDraggedSticker(null); setResizingSticker(null); autoSaveCanvas(); };
  const handleResizeStart = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setResizingSticker(id); };
  const handleResizeMove = (e: React.MouseEvent) => {
    if (!resizingSticker) return;
    const sticker = stickers.find((s: Sticker) => s.id === resizingSticker); if (!sticker) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;
    const { x, y } = pos;
    const dist = Math.sqrt((x-sticker.x)**2+(y-sticker.y)**2);
    setStickers((s: Sticker[]) => s.map((st: Sticker) => st.id === resizingSticker ? {...st, size: Math.max(20, Math.min(120, dist/2))} : st));
  };
  const removeSticker = (id: string) => { setStickers((s: Sticker[]) => s.filter((st: Sticker) => st.id !== id)); autoSaveCanvas(); };
  const clearCanvas = () => {
    const canvas = canvasRef.current; const ctx = canvasContextRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height); setStickers([]); autoSaveCanvas();
  };
  const autoSaveCanvas = () => {
    const canvas = canvasRef.current; const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas || canvas.width === 0 || canvas.height === 0) return;
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const ctx2 = comp.getContext('2d'); if (!ctx2) return;
    try { ctx2.drawImage(bgCanvas,0,0); ctx2.drawImage(canvas,0,0); } catch { return; }
    const today = new Date().toISOString().split('T')[0];
    saveMoodCanvasEntry({ id: `canvas_${mood}`, date: today, mood, content: comp.toDataURL('image/png'), notes, stickers, textNotes: [], timestamp: Date.now() });
    setLastSaveTime(new Date().toLocaleTimeString());
    syncAllToFirestore();
  };
  const downloadCanvas = (fmt: 'png'|'jpg') => {
    const canvas = canvasRef.current; const bgCanvas = backgroundCanvasRef.current;
    if (!canvas||!bgCanvas) return;
    const comp = document.createElement('canvas'); comp.width=canvas.width; comp.height=canvas.height;
    const ctx2=comp.getContext('2d'); if(!ctx2) return;
    ctx2.drawImage(bgCanvas,0,0); ctx2.drawImage(canvas,0,0);
    const a=document.createElement('a'); a.href=comp.toDataURL(`image/${fmt}`,fmt==='jpg'?0.95:1);
    a.download=`mood-canvas-${new Date().toISOString().split('T')[0]}.${fmt}`; a.click();
    toast.success(`Downloaded as ${fmt.toUpperCase()}`);
  };

  const shapesList: Array<[DrawingMode, string, string]> = [
    ['rectangle','▭','Rectangle'],['circle','●','Circle'],['line','⁄','Line'],
    ['triangle','△','Triangle'],['star','★','Star'],['pentagon','⬠','Pentagon'],
    ['hexagon','⬡','Hexagon'],['octagon','⬢','Octagon'],['heart','♥','Heart'],
    ['diamond','◇','Diamond'],['arrow-right','→','Arrow Right'],['arrow-left','←','Arrow Left'],
    ['arrow-up','↑','Arrow Up'],['arrow-down','↓','Arrow Down'],['arrow-double','↔','Double Arrow'],
    ['arrow-curved','↗','Curved Arrow'],['cloud','☁','Cloud'],['speech-bubble','💬','Speech Bubble'],
    ['rounded-rect','▬','Rounded Rect'],
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#FEFBF8] via-[#F5F1E8] to-[#E8E4F3] overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#E8E4F3] soft-shadow">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-[#E8E4F3]/30 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-foreground">Mood Canvas</h1>
          </div>
          <div className="flex items-center gap-2">
            {lastSaveTime && <span className="text-xs text-muted-foreground hidden sm:block">✓ {lastSaveTime}</span>}
            {/* Mobile: toggle sidebar button */}
            <button
              onClick={() => setSidebarOpen((o: boolean) => !o)}
              className="lg:hidden flex items-center gap-1 px-3 py-2 rounded-lg bg-[#E8E4F3] text-sm font-medium"
            >
              🎨 Tools {sidebarOpen ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#F5F1E8] to-[#E8E4F3]"
          onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => { handleStickerMouseMove(e); handleResizeMove(e); }}
          onMouseUp={() => handleStickerMouseUp()}
          onMouseLeave={() => { handleStickerMouseUp(); isPanningRef.current = false; }}
          onWheel={handleWheel}
        >
          {/* Zoom Controls */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
            <button onClick={() => setScale((s: number) => Math.min(MAX_SCALE, parseFloat((s+0.2).toFixed(2))))} className="w-10 h-10 bg-white/80 hover:bg-white rounded-xl shadow flex items-center justify-center transition-all" title="Zoom In">
              <ZoomIn className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={() => setScale((s: number) => Math.max(MIN_SCALE, parseFloat((s-0.2).toFixed(2))))} className="w-10 h-10 bg-white/80 hover:bg-white rounded-xl shadow flex items-center justify-center transition-all" title="Zoom Out">
              <ZoomOut className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={() => { setScale(1); setPanOffset({x:0,y:0}); }} className="w-10 h-10 bg-white/80 hover:bg-white rounded-xl shadow flex items-center justify-center transition-all" title="Reset">
              <Maximize2 className="w-4 h-4 text-foreground" />
            </button>
            <div className="text-[10px] text-center text-muted-foreground bg-white/60 rounded px-1 py-0.5">{Math.round(scale*100)}%</div>
          </div>
          {/* Controls hint */}
          <div className="absolute bottom-3 left-3 z-20 text-[10px] text-muted-foreground bg-white/50 rounded px-2 py-1 hidden md:block">
            Space+drag to pan • Ctrl+scroll to zoom • Pinch on tablet
          </div>

          {/* Infinite canvas wrapper */}
          <div
            ref={canvasWrapperRef}
            style={{
              width: `${documentSize.width}px`,
              height: `${documentSize.height}px`,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <canvas
              ref={backgroundCanvasRef}
              className="absolute inset-0"
              style={{ width: `${documentSize.width}px`, height: `${documentSize.height}px` }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 canvas-draw"
              style={{ cursor: spaceHeldRef.current ? (isPanningRef.current ? 'grabbing' : 'grab') : (drawingMode === 'erase' ? 'cell' : 'crosshair'), touchAction: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { handleMouseUp(); isPanningRef.current = false; }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            {/* Stickers */}
            <div className="absolute inset-0 pointer-events-none">
              {stickers.map((sticker: Sticker) => (
                <div
                  key={sticker.id}
                  onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => handleStickerMouseDown(e, sticker.id)}
                  className="absolute pointer-events-auto cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity group no-select"
                  style={{ left: `${sticker.x}px`, top: `${sticker.y}px`, transform: `translate(-50%,-50%) rotate(${sticker.rotation}deg)` }}
                  onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); removeSticker(sticker.id); }}
                >
                  <div className="text-center relative" style={{ fontSize: `${sticker.size}px` }}>
                    {sticker.emoji}
                    <div onMouseDown={(e) => handleResizeStart(e, sticker.id)} className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#A8D5F7] rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity soft-shadow" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Tools — desktop: permanent right panel; mobile/tablet: slide-up drawer */}
        <div className={`
          bg-white/80 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-[#E8E4F3] overflow-y-auto scroll-touch p-4 space-y-4
          lg:w-80 lg:relative lg:flex lg:flex-col lg:translate-y-0
          ${sidebarOpen
            ? 'fixed bottom-0 left-0 right-0 max-h-[65vh] z-40 rounded-t-2xl shadow-2xl flex flex-col lg:static lg:max-h-none'
            : 'hidden lg:flex lg:flex-col'}
        `}>
          {/* Mobile drag handle */}
          <div className="lg:hidden flex justify-center mb-1">
            <div className="w-10 h-1 bg-[#D4D4D4] rounded-full" />
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Your Mood</h3>
            <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
              {moodEmojis.map((emoji, i) => (
                <button key={i} onClick={() => setMood(moods[i])}
                  className={`p-2 rounded-lg text-2xl transition-all ${mood === moods[i] ? 'bg-[#D4E8F7] scale-110 soft-shadow' : 'hover:bg-[#E8E4F3]/50'}`}
                  title={moods[i]}>{emoji}</button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">{mood}</p>
          </div>

          {/* Drawing Tools */}
          <div className="space-y-2 pt-2 border-t border-[#E8E4F3]">
            <h3 className="text-sm font-semibold text-foreground">Drawing Tools</h3>
            <div className="flex gap-2">
              {(['draw','erase'] as const).map(m => (
                <button key={m} onClick={() => setDrawingMode(m)}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all ${drawingMode === m ? (m==='draw'?'bg-[#D4E8F7]':'bg-[#FFD4B3]') + ' soft-shadow' : 'bg-white/40 hover:bg-white/60'}`}>
                  {m === 'draw' ? '✏️ Draw' : '🧹 Erase'}
                </button>
              ))}
            </div>
            {drawingMode === 'draw' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {(['pencil','marker','watercolor'] as const).map(p => (
                    <button key={p} onClick={() => setBrushPreset(p)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${brushPreset===p?'bg-[#D4E8F7] soft-shadow':'bg-white/40 hover:bg-white/60'}`}>
                      {p==='pencil'?'✏️ Pencil':p==='marker'?'🖍️ Marker':'🎨 Watercolor'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input type="color" value={brushColor} onChange={e=>setBrushColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border border-[#E8E4F3]" />
                  <div className="flex-1 text-xs text-muted-foreground">{brushColor}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between"><label className="text-xs font-medium">Brush Width</label><span className="text-xs text-muted-foreground">{brushWidth}px</span></div>
                  <input type="range" min="1" max="20" value={brushWidth} onChange={e=>setBrushWidth(+e.target.value)} className="w-full" />
                </div>
              </>
            )}
            {drawingMode === 'erase' && (
              <div className="space-y-1">
                <div className="flex justify-between"><label className="text-xs font-medium">Eraser Width</label><span className="text-xs text-muted-foreground">{eraserWidth}px</span></div>
                <input type="range" min="5" max="50" value={eraserWidth} onChange={e=>setEraserWidth(+e.target.value)} className="w-full" />
              </div>
            )}
          </div>

          {/* Shapes */}
          <div className="space-y-2 pt-2 border-t border-[#E8E4F3]">
            <h3 className="text-sm font-semibold text-foreground">Shapes</h3>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-1">
              {shapesList.map(([mode, icon, title]) => (
                <button key={mode} onClick={() => setDrawingMode(mode)}
                  className={`p-2 rounded text-base transition-all ${drawingMode===mode?'bg-[#D4E8F7] soft-shadow':'bg-white/40 hover:bg-white/60'}`}
                  title={title}>{icon}</button>
              ))}
            </div>
            {shapesList.some(([m]) => m === drawingMode) && (
              <>
                <div className="flex gap-2 items-center">
                  <input type="color" value={shapeColor} onChange={e=>setShapeColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border border-[#E8E4F3]" />
                  <div className="flex-1 text-xs text-muted-foreground">{shapeColor}</div>
                </div>
                {!['line','arrow-right','arrow-left','arrow-up','arrow-down','arrow-double','arrow-curved'].includes(drawingMode) && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="sf" checked={shapeFill} onChange={e=>setShapeFill(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                    <label htmlFor="sf" className="text-xs font-medium cursor-pointer">Fill Shape</label>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Stickers */}
          <div className="space-y-2 pt-2 border-t border-[#E8E4F3]">
            <h3 className="text-sm font-semibold text-foreground">Stickers</h3>
            <p className="text-xs text-muted-foreground">Drag onto canvas • Long-press to delete</p>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-1 max-h-40 overflow-y-auto scroll-touch">
              {stickerEmojis.map((emoji, i) => (
                <div key={i} draggable onDragStart={e => handleDragStart(e, emoji)}
                  className="p-1.5 rounded-lg text-2xl hover:bg-[#E8E4F3]/50 transition-all hover:scale-110 cursor-move text-center no-select"
                >{emoji}</div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-2 border-t border-[#E8E4F3]">
            <h3 className="text-sm font-semibold text-foreground">Notes</h3>
            <textarea value={notes} onChange={e=>{setNotes(e.target.value); autoSaveCanvas();}}
              placeholder="Write your thoughts..."
              className="w-full h-16 p-2 rounded-lg bg-white/60 border border-[#E8E4F3] text-sm focus:outline-none focus:ring-2 focus:ring-[#A8D5F7] resize-none"
            />
          </div>

          {/* Download */}
          <div className="space-y-2 pt-2 border-t border-[#E8E4F3]">
            <h3 className="text-sm font-semibold text-foreground">Download</h3>
            <div className="flex gap-2">
              <button onClick={() => downloadCanvas('png')} className="flex-1 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-all">📥 PNG</button>
              <button onClick={() => downloadCanvas('jpg')} className="flex-1 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium transition-all">📥 JPG</button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-[#E8E4F3] pb-4">
            <button onClick={autoSaveCanvas} className="w-full p-3 rounded-lg bg-gradient-to-r from-[#D4E8F7] to-[#C5D9F1] hover:from-[#C5D9F1] hover:to-[#B6CAFE] transition-all font-medium text-sm text-foreground">
              💾 Save Canvas
            </button>
            <button onClick={clearCanvas} className="w-full p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-all font-medium text-sm text-orange-700 flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Clear Drawing
            </button>
            <button onClick={() => {
              const canvas = canvasRef.current; const ctx = canvasContextRef.current;
              if (!canvas || !ctx) return;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              setStickers([]);
              setNotes('');
              deleteMoodCanvasEntry(`canvas_${mood}`);
              setCanvasImageData(null);
              setLastSaveTime('');
              syncAllToFirestore();
              toast.success(`${mood} canvas deleted`);
            }} className="w-full p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-all font-medium text-sm text-red-700 flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete This Mood Canvas
            </button>
          </div>
        </div>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/20 z-30" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </div>
  );
}
