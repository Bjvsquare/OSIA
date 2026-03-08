import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, FileText, RefreshCw, Edit3, Plus, Target, CheckCircle2, AlertCircle, X, MessageSquare, Mic, Image as ImageIcon, Send } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { api } from '../../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskComment {
    id: string;
    author: string;
    type: 'text' | 'image' | 'audio';
    content: string;
    timestamp: string;
}

interface DevOpsTask {
    id: string;
    title: string;
    description: string;
    assignee: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    isFocusPoint: boolean;
    reviewer: string | null;
    comments?: TaskComment[];
    createdAt: string;
}

interface GitLogEntry { hash: string; author: string; date: string; message: string; }
interface GitStatusEntry { status: string; file: string; }
interface DevOpsData { gitBranch: string; gitLog: GitLogEntry[]; gitStatus: GitStatusEntry[]; contextMd: string; lastUpdated: string; }

const TEAM_MEMBERS = ['Barend', 'Teammate', 'Unassigned'];
const CURRENT_USER = 'Barend'; // For demo purposes, we assume the logged in user is Barend

export function CollaborationHub() {
    const [data, setData] = useState<DevOpsData | null>(null);
    const [tasks, setTasks] = useState<DevOpsTask[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast, ToastComponent } = useToast();

    const [editingContext, setEditingContext] = useState(false);
    const [contextDraft, setContextDraft] = useState('');
    const [savingContext, setSavingContext] = useState(false);

    const [showNewTask, setShowNewTask] = useState(false);
    const [newTaskForm, setNewTaskForm] = useState({ title: '', description: '', assignee: CURRENT_USER });
    const [creatingTask, setCreatingTask] = useState(false);

    // Task Review Modal State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;
    const [commentText, setCommentText] = useState('');
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        try {
            const [devopsData, tasksData] = await Promise.all([
                api.getDevOpsContext(),
                api.getDevOpsTasks()
            ]);
            setData(devopsData);
            if (!editingContext) setContextDraft(devopsData.contextMd);
            setTasks(tasksData);

        } catch (error) {
            console.error('Failed to fetch DevOps data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []); // Run on mount and poll

    const handleSaveContext = async () => {
        if (!contextDraft.trim()) return;
        setSavingContext(true);
        try {
            await api.updateDevOpsContext(contextDraft);
            showToast('CONTEXT.md updated');
            setEditingContext(false);
            fetchData();
        } catch (err) {
            showToast('Failed to save context');
        } finally {
            setSavingContext(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTaskForm.title.trim()) return showToast('Title is required');
        setCreatingTask(true);
        try {
            await api.createDevOpsTask(newTaskForm);
            showToast('Task created');
            setShowNewTask(false);
            setNewTaskForm({ title: '', description: '', assignee: CURRENT_USER });
            fetchData();
        } catch (err) {
            showToast('Failed to create task');
        } finally {
            setCreatingTask(false);
        }
    };

    const handleUpdateTaskStatus = async (id: string, status: DevOpsTask['status']) => {
        try {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
            await api.updateDevOpsTask(id, { status });
        } catch (err) {
            showToast('Failed to update task');
            fetchData();
        }
    };

    const handleToggleFocus = async (task: DevOpsTask) => {
        try {
            const isFocusPoint = !task.isFocusPoint;
            setTasks(prev => prev.map(t => {
                if (t.id === task.id) return { ...t, isFocusPoint };
                if (isFocusPoint && t.assignee === task.assignee) return { ...t, isFocusPoint: false };
                return t;
            }));
            await api.updateDevOpsTask(task.id, { isFocusPoint, assignee: task.assignee });
            showToast(isFocusPoint ? 'Focus point set' : 'Focus point removed');
        } catch (err) {
            showToast('Failed to toggle focus');
            fetchData();
        }
    };

    // --- Media Feedback Logic ---

    const addComment = async (type: 'text' | 'image' | 'audio', content: string) => {
        if (!selectedTask) return;
        const newComment: TaskComment = {
            id: Date.now().toString(),
            author: CURRENT_USER,
            type,
            content,
            timestamp: new Date().toISOString()
        };
        const updatedComments = [...(selectedTask.comments || []), newComment];

        try {
            // Optimistic
            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, comments: updatedComments } : t));

            await api.updateDevOpsTask(selectedTask.id, { comments: updatedComments });
            setCommentText('');
        } catch (err) {
            showToast('Failed to post comment');
            fetchData();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            addComment('image', base64);
        };
        reader.readAsDataURL(file);
    };

    const toggleRecording = async () => {
        if (recording) {
            mediaRecorderRef.current?.stop();
            setRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        addComment('audio', base64);
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };
                mediaRecorder.start();
                setRecording(true);
            } catch (err) {
                showToast('Microphone access denied');
            }
        }
    };

    const handleRequestChanges = async () => {
        if (!selectedTask) return;
        await handleUpdateTaskStatus(selectedTask.id, 'in_progress');
        showToast('Task moved back to In Progress for changes');
        setSelectedTaskId(null);
    };

    const handleSignOff = async () => {
        if (!selectedTask) return;
        try {
            await api.updateDevOpsTask(selectedTask.id, { status: 'done', reviewer: CURRENT_USER });
            showToast('Task approved and completed');
            setSelectedTaskId(null);
            fetchData();
        } catch (err) {
            showToast('Failed to sign off task');
        }
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-osia-teal-500 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const columns = [
        { id: 'todo', title: '📋 To Do', color: 'border-osia-neutral-600' },
        { id: 'in_progress', title: '⚡ In Progress', color: 'border-blue-500/50' },
        { id: 'review', title: '👀 In Review', color: 'border-yellow-500/50' },
        { id: 'done', title: '✅ Done', color: 'border-green-500/50' }
    ] as const;

    const activeFocusPoints = tasks.filter(t => t.isFocusPoint && t.status !== 'done');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Active Focus Points */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Target className="text-osia-teal-500" /> System Sync Board
                        </h2>
                        <p className="text-osia-neutral-500 text-sm mt-1">Coordinate tasks, declare active focus, and run sign-off workflows.</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowNewTask(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> New Task
                    </Button>
                </div>

                {activeFocusPoints.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeFocusPoints.map(task => (
                            <Card key={task.id} className="p-5 border-blue-500/30 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/30">
                                        {task.assignee.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
                                                <Target className="w-3 h-3" /> Current Focus
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white cursor-pointer hover:text-blue-300 transition-colors" onClick={() => setSelectedTaskId(task.id)}>{task.title}</h3>
                                        <p className="text-xs text-osia-neutral-400 mt-1 line-clamp-2">{task.description}</p>
                                    </div>
                                    <Button variant="outline" className="h-8 text-xs bg-black/40 border-white/5" onClick={() => handleToggleFocus(task)}>
                                        Unfocus
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Sync Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                {columns.map(col => {
                    const columnTasks = tasks.filter(t => t.status === col.id);
                    return (
                        <Card key={col.id} className={`flex flex-col h-[600px] border-t-2 bg-white/[0.02] border-x-white/5 border-b-white/5 ${col.color}`}>
                            <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                                <h3 className="font-bold text-white tracking-widest text-xs uppercase">{col.title}</h3>
                                <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{columnTasks.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
                                {columnTasks.map(task => (
                                    <motion.div layoutId={task.id} key={task.id} className="group" onClick={() => setSelectedTaskId(task.id)}>
                                        <Card className="p-4 border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer relative overflow-hidden space-y-3">
                                            {task.isFocusPoint && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}

                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-bold text-white text-sm leading-tight group-hover:text-osia-teal-300 transition-colors">{task.title}</h4>
                                                <select
                                                    className="bg-black/80 border border-white/10 text-[10px] text-osia-neutral-300 rounded px-1 py-0.5 outline-none focus:border-osia-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    value={task.status}
                                                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="todo">Todo</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="review">Review</option>
                                                    <option value="done">Done</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-white/10 text-osia-neutral-300 flex items-center justify-center text-[8px] font-bold">
                                                        {task.assignee.substring(0, 1).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {task.comments && task.comments.length > 0 && (
                                                        <span className="flex items-center gap-1 text-[10px] text-osia-neutral-500">
                                                            <MessageSquare className="w-3 h-3" /> {task.comments.length}
                                                        </span>
                                                    )}
                                                    {task.status !== 'done' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleToggleFocus(task); }}
                                                            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${task.isFocusPoint ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-osia-neutral-500 hover:text-white'}`}
                                                        >
                                                            Focus
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Bottom Split (Git Pulse & Contex.md omitted for brevity if needed, but keeping here to preserve full UI) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-white/5 bg-white/[0.02] flex flex-col h-[400px]">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GitBranch className="w-5 h-5 text-purple-400" />
                            <div>
                                <h3 className="font-bold text-white leading-tight">Git Pulse Activity</h3>
                                <p className="text-[10px] text-osia-neutral-500 uppercase font-mono tracking-widest">{data.gitBranch} branch</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                        {/* Summary of Git Pulse */}
                        <div>
                            <h4 className="text-xs font-bold text-osia-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Uncommitted Changes ({data.gitStatus.length})
                            </h4>
                            <div className="space-y-1">
                                {data.gitStatus.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-mono">
                                        <span className="w-4 text-center font-bold text-osia-neutral-400">{file.status.trim()}</span>
                                        <span className="text-osia-neutral-300 truncate">{file.file}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="flex flex-col h-[400px] border-white/5 bg-white/[0.02] overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-osia-teal-400" />
                            <h3 className="font-bold text-white leading-tight">CONTEXT.md</h3>
                        </div>
                        <Button variant="outline" className="h-8 text-xs gap-2" onClick={() => setEditingContext(!editingContext)}>
                            {editingContext ? 'Cancel Edit' : <><Edit3 className="w-3 h-3" /> Edit</>}
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
                        {editingContext ? (
                            <div className="h-full flex flex-col gap-4">
                                <textarea value={contextDraft} onChange={(e) => setContextDraft(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-osia-neutral-300 font-mono" />
                                <Button variant="primary" onClick={handleSaveContext} disabled={savingContext}>Save</Button>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{data.contextMd}</ReactMarkdown></div>
                        )}
                    </div>
                </Card>
            </div>

            {/* TASK REVIEW MODAL (Using Portal to escape stacking contexts) */}
            {createPortal(
                <AnimatePresence>
                    {selectedTask && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-12 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedTaskId(null)}
                        >
                            <motion.div
                                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-osia-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl h-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                            >
                                {/* Left Side: Details & Actions */}
                                <div className="w-full md:w-1/3 bg-black/20 border-r border-white/5 p-6 flex flex-col h-full overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="text-[10px] uppercase font-bold text-osia-neutral-500 bg-white/5 px-2 py-1 rounded">
                                            {selectedTask.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedTask.title}</h2>
                                    <p className="text-sm text-osia-neutral-400 mb-6">{selectedTask.description || 'No description provided.'}</p>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-osia-neutral-500">Assignee</span>
                                            <span className="text-white font-bold">{selectedTask.assignee}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-osia-neutral-500">Created</span>
                                            <span className="text-white">{new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-3 pt-6 border-t border-white/5">
                                        {selectedTask.status === 'review' ? (
                                            <>
                                                <Button variant="outline" className="w-full gap-2 border border-red-500/50 hover:bg-red-500/20 text-red-400 hover:text-white" onClick={handleRequestChanges}>
                                                    <AlertCircle className="w-4 h-4" /> Request Changes
                                                </Button>
                                                <Button variant="primary" className="w-full gap-2 bg-green-500 hover:bg-green-400 text-black border-none" onClick={handleSignOff}>
                                                    <CheckCircle2 className="w-4 h-4" /> Approve & Sign-off
                                                </Button>
                                            </>
                                        ) : (
                                            <select
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-osia-teal-500 transition-colors"
                                                value={selectedTask.status}
                                                onChange={(e) => handleUpdateTaskStatus(selectedTask.id, e.target.value as any)}
                                            >
                                                <option value="todo">Move to To Do</option>
                                                <option value="in_progress">Move to In Progress</option>
                                                <option value="review">Submit for Review</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Feedback Thread */}
                                <div className="w-full md:w-2/3 flex flex-col h-full bg-osia-neutral-900">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-osia-teal-400" /> Review & Feedback
                                        </h3>
                                        <button onClick={() => setSelectedTaskId(null)} className="text-osia-neutral-500 hover:text-white transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                                        {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center text-osia-neutral-500 space-y-2">
                                                <MessageSquare className="w-8 h-8 opacity-20" />
                                                <p className="text-sm">No feedback yet. Start the conversation!</p>
                                            </div>
                                        ) : (
                                            selectedTask.comments.map(comment => (
                                                <div key={comment.id} className={`flex flex-col max-w-[85%] ${comment.author === CURRENT_USER ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                                    <span className="text-[10px] text-osia-neutral-500 mb-1 px-1">
                                                        {comment.author} • {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <div className={`p-3 rounded-2xl text-sm ${comment.author === CURRENT_USER ? 'bg-osia-teal-500/20 text-white rounded-tr-sm border border-osia-teal-500/30' : 'bg-white/5 text-osia-neutral-200 rounded-tl-sm border border-white/5'}`}>
                                                        {comment.type === 'text' && <p className="whitespace-pre-wrap">{comment.content}</p>}
                                                        {comment.type === 'image' && <img src={comment.content} alt="Attachment" className="max-w-full rounded-lg" />}
                                                        {comment.type === 'audio' && <audio controls src={comment.content} className="h-8 w-48" />}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Feedback Input Area */}
                                    <div className="p-4 border-t border-white/5 bg-black/40">
                                        <div className="flex items-end gap-2">
                                            {/* Hidden File Input */}
                                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

                                            <Button variant="outline" className="h-10 w-10 p-0 shrink-0 border-white/10 bg-white/5 hover:bg-white/10 rounded-xl" onClick={() => fileInputRef.current?.click()}>
                                                <ImageIcon className="w-4 h-4 text-osia-neutral-400" />
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className={`h-10 w-10 p-0 shrink-0 rounded-xl transition-all ${recording ? 'border-red-500 bg-red-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                                onClick={toggleRecording}
                                            >
                                                {recording ? <span className="w-2.5 h-2.5 bg-red-500 rounded-sm animate-pulse" /> : <Mic className="w-4 h-4 text-osia-neutral-400" />}
                                            </Button>

                                            <div className="flex-1 relative">
                                                <textarea
                                                    value={commentText}
                                                    onChange={e => setCommentText(e.target.value)}
                                                    placeholder="Type feedback..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-osia-teal-500/50 resize-none h-10 min-h-[40px] max-h-[120px]"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            if (commentText.trim()) addComment('text', commentText);
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <Button variant="primary" className="h-10 w-10 p-0 shrink-0 rounded-xl flex items-center justify-center bg-osia-teal-500 hover:bg-osia-teal-400" onClick={() => { if (commentText.trim()) addComment('text', commentText); }} disabled={!commentText.trim()}>
                                                <Send className="w-4 h-4 text-black ml-0.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* New Task Modal Using Portal */}
            {createPortal(
                <AnimatePresence>
                    {showNewTask && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowNewTask(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-osia-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                            >
                                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">Create Drop/Task</h3>
                                    <button onClick={() => setShowNewTask(false)} className="text-osia-neutral-500 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-osia-neutral-400">Task Title</label>
                                        <input
                                            type="text"
                                            value={newTaskForm.title}
                                            onChange={e => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-osia-teal-500 outline-none transition-colors"
                                            placeholder="e.g. Implement Premium Dashboard"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-osia-neutral-400">Assign To</label>
                                        <select
                                            value={newTaskForm.assignee}
                                            onChange={e => setNewTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-osia-teal-500 transition-colors"
                                        >
                                            {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-osia-neutral-400">Description (Optional)</label>
                                        <textarea
                                            value={newTaskForm.description}
                                            onChange={e => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full h-24 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-osia-teal-500 outline-none transition-colors resize-none"
                                            placeholder="Briefly describe what needs to be done..."
                                        />
                                    </div>
                                </div>
                                <div className="p-5 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
                                    <Button variant="primary" onClick={handleCreateTask} disabled={creatingTask || !newTaskForm.title.trim()}>
                                        {creatingTask ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Create Task
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <ToastComponent />
        </div>
    );
}
