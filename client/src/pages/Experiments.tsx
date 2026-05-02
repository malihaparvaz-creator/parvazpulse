import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { getAllExperiments, saveExperiment, deleteExperiment, ExperimentEntry } from '@/lib/store';
import { nanoid } from 'nanoid';

export default function Experiments() {
  const [, navigate] = useLocation();
  const [experiments, setExperiments] = useState<ExperimentEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hypothesis: '',
  });

  useEffect(() => {
    setExperiments(getAllExperiments());
  }, []);

  const handleAddExperiment = () => {
    if (!formData.name || !formData.hypothesis) {
      alert('Please fill in name and hypothesis');
      return;
    }

    const newExperiment: ExperimentEntry = {
      id: nanoid(),
      name: formData.name,
      description: formData.description,
      hypothesis: formData.hypothesis,
      startDate: new Date().toISOString().split('T')[0],
      results: '',
      active: true,
    };

    saveExperiment(newExperiment);
    setExperiments([...experiments, newExperiment]);
    setFormData({ name: '', description: '', hypothesis: '' });
    setShowForm(false);
  };

  const handleCompleteExperiment = (id: string) => {
    const exp = experiments.find((e) => e.id === id);
    if (exp) {
      const updated = {
        ...exp,
        active: false,
        endDate: new Date().toISOString().split('T')[0],
      };
      saveExperiment(updated);
      setExperiments(experiments.map((e) => (e.id === id ? updated : e)));
    }
  };

  const handleDeleteExperiment = (id: string) => {
    deleteExperiment(id);
    setExperiments(experiments.filter((e) => e.id !== id));
  };

  const activeExperiments = experiments.filter((e) => e.active);
  const completedExperiments = experiments.filter((e) => !e.active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFBF8] via-[#F5F1E8] to-[#E8E4F3]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#E8E4F3] soft-shadow">
        <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-[#E8E4F3]/30 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Experiments</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Add Experiment Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full p-4 rounded-xl bg-gradient-to-r from-[#E8E4F3] to-[#D4E8F7] hover:from-[#D4E8F7] hover:to-[#C5D9F1] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Start New Experiment</span>
        </button>

        {/* Add Experiment Form */}
        {showForm && (
          <div className="bg-white/60 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">Design Your Experiment</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Experiment Name</label>
                <input
                  type="text"
                  placeholder="e.g., Morning Meditation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg bg-white/80 border border-[#E8E4F3] focus:outline-none focus:ring-2 focus:ring-[#D4E8F7]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <input
                  type="text"
                  placeholder="What will you do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg bg-white/80 border border-[#E8E4F3] focus:outline-none focus:ring-2 focus:ring-[#D4E8F7]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Hypothesis</label>
                <input
                  type="text"
                  placeholder="What do you expect to happen?"
                  value={formData.hypothesis}
                  onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg bg-white/80 border border-[#E8E4F3] focus:outline-none focus:ring-2 focus:ring-[#D4E8F7]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddExperiment}
                  className="flex-1 p-2 rounded-lg bg-[#D4E8F7] hover:bg-[#C5D9F1] transition-all font-medium"
                >
                  Start Experiment
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 p-2 rounded-lg bg-white/60 hover:bg-white/80 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Experiments */}
        {activeExperiments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">🧪 Active Experiments</h3>
            {activeExperiments.map((exp) => (
              <div key={exp.id} className="bg-white/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{exp.name}</h4>
                    {exp.description && <p className="text-sm text-muted-foreground">{exp.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteExperiment(exp.id)}
                    className="p-2 hover:bg-red-100/50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="bg-[#D4E8F7]/30 rounded-lg p-3 text-sm">
                  <p className="text-foreground">
                    <strong>Hypothesis:</strong> {exp.hypothesis}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-muted-foreground">
                    Started: {new Date(exp.startDate + 'T00:00:00').toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleCompleteExperiment(exp.id)}
                  className="w-full p-2 rounded-lg bg-[#D9E8D9] hover:bg-[#C5D9C5] transition-all text-sm font-medium"
                >
                  Complete Experiment
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Completed Experiments */}
        {completedExperiments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">✅ Completed Experiments</h3>
            {completedExperiments.map((exp) => (
              <div key={exp.id} className="bg-white/40 rounded-2xl p-4 space-y-2 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{exp.name}</h4>
                    {exp.description && <p className="text-sm text-muted-foreground">{exp.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteExperiment(exp.id)}
                    className="p-2 hover:bg-red-100/50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(exp.startDate + 'T00:00:00').toLocaleDateString()} -{' '}
                  {exp.endDate && new Date(exp.endDate + 'T00:00:00').toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {experiments.length === 0 && (
          <div className="bg-white/50 rounded-2xl p-12 text-center space-y-4">
            <p className="text-2xl">🧪</p>
            <h2 className="text-lg font-bold text-foreground">No experiments yet</h2>
            <p className="text-muted-foreground">Start an experiment to test habits scientifically</p>
          </div>
        )}
      </main>
    </div>
  );
}
