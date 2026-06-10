import { useState } from 'react';
import { 
  Search, 
  Star, 
  Download, 
  ExternalLink, 
  ShoppingCart,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  category: string;
  price: number | 'Free';
  rating: number;
  reviews: number;
  image: string;
  isPopular?: boolean;
  isNew?: boolean;
  description: string;
}

const TEMPLATES: Template[] = [
  {
    id: '1',
    title: 'Wedding Planner',
    category: 'Life',
    price: 4.99,
    rating: 4.9,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400',
    isPopular: true,
    description: 'The ultimate guide for your big day. Includes budget tracking, guest lists, and vendor management.'
  },
  {
    id: '2',
    title: 'Student Semester Planner',
    category: 'Student',
    price: 4.99,
    rating: 4.8,
    reviews: 256,
    image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400',
    description: 'Ace your exams with integrated assignment tracking and study schedules.'
  },
  {
    id: '3',
    title: 'Fitness Challenge Log',
    category: 'Fitness',
    price: 4.99,
    rating: 4.7,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400',
    isNew: true,
    description: 'Track your progress, sets, and reps with this streamlined fitness companion.'
  },
  {
    id: '4',
    title: 'Budget Tracker Pro',
    category: 'Budget',
    price: 4.99,
    rating: 4.9,
    reviews: 512,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400',
    description: 'Master your finances with automated categorization and visual spending insights.'
  },
  {
    id: '5',
    title: 'Meal Planner',
    category: 'Life',
    price: 'Free',
    rating: 4.6,
    reviews: 1024,
    image: 'https://images.unsplash.com/photo-1490818387583-1bbf5e638afb?auto=format&fit=crop&q=80&w=400',
    description: 'Plan your weekly meals and generate shopping lists automatically.'
  },
  {
    id: '6',
    title: 'ADHD-Friendly Daily',
    category: 'Productivity',
    price: 4.99,
    rating: 5.0,
    reviews: 42,
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=400',
    description: 'Designed specifically to reduce overwhelm and focus on what matters.'
  }
];

const CATEGORIES = ['All', 'Popular', 'New', 'Budget', 'Student', 'Fitness', 'Productivity'];

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesCategory = selectedCategory === 'All' || 
                           (selectedCategory === 'Popular' && t.isPopular) ||
                           (selectedCategory === 'New' && t.isNew) ||
                           t.category === selectedCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePurchase = (id: string) => {
    setPurchasedIds([...purchasedIds, id]);
  };

  const selectedPreview = TEMPLATES.find(t => t.id === previewId);

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-8 gap-4">
        <div className="space-y-1">
          <p className="text-blue-500 font-black text-xs uppercase tracking-[0.2em]">Marketplace</p>
          <h2 className="text-4xl font-black text-slate-100 tracking-tight">Vault Templates</h2>
          <p className="text-sm font-bold text-slate-500">Specialized planners designed by productivity experts.</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50">
           <ShoppingCart className="w-5 h-5 text-slate-500 ml-2" />
           <span className="font-black text-slate-200 pr-2">0 ITEMS</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search templates (e.g. 'ADHD', 'Wedding', 'Budget')..."
            className="w-full bg-[#16191e] border border-slate-800/50 rounded-2xl pl-14 pr-4 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-bold text-slate-100 placeholder:text-slate-600 shadow-xl"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800/50 text-slate-500 hover:text-slate-200 border border-slate-700/30'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Hero (High-Fidelity Detail) */}
      {selectedCategory === 'All' && !searchQuery && (
        <div className="relative bg-[#16191e] rounded-[2.5rem] border border-slate-800/50 overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setPreviewId('1')}>
           <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
           <img 
             src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200" 
             alt="Featured"
             className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
           />
           <div className="relative z-20 p-12 space-y-6 max-w-xl">
              <div className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-lg w-fit">
                 <Star className="w-4 h-4 fill-current" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Editor's Choice</span>
              </div>
              <h3 className="text-5xl font-black text-white tracking-tighter leading-tight">Wedding Planner Essentials</h3>
              <p className="text-slate-300 font-medium text-lg leading-relaxed">The most comprehensive planning tool for your special day. From budget to bouquet, we've got you covered.</p>
              <div className="flex items-center space-x-4">
                 <button className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl">
                    Get $4.99
                 </button>
                 <button className="text-white font-black uppercase tracking-widest text-sm flex items-center group/btn">
                    Preview Layout <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredTemplates.map(template => (
          <div 
            key={template.id}
            className="bg-[#16191e] rounded-3xl border border-slate-800/50 overflow-hidden shadow-xl flex flex-col group hover:border-blue-600/30 transition-all"
          >
            <div className="h-48 relative overflow-hidden">
               <img 
                 src={template.image} 
                 alt={template.title}
                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
               />
               <div className="absolute top-4 left-4 flex space-x-2">
                  {template.isPopular && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">Popular</span>
                  )}
                  {template.isNew && (
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">New</span>
                  )}
               </div>
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                  <button 
                    onClick={() => setPreviewId(template.id)}
                    className="bg-white/90 backdrop-blur-md text-slate-950 p-3 rounded-full hover:bg-white transition-all shadow-xl"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
               </div>
            </div>
            
            <div className="p-6 space-y-4 flex-1 flex flex-col">
               <div className="flex justify-between items-start">
                  <h4 className="font-black text-lg text-slate-100 tracking-tight leading-tight group-hover:text-blue-400 transition-colors">{template.title}</h4>
                  <div className="flex items-center space-x-1 text-amber-500">
                     <Star className="w-3.5 h-3.5 fill-current" />
                     <span className="text-xs font-black">{template.rating}</span>
                  </div>
               </div>
               
               <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{template.description}</p>
               
               <div className="pt-4 mt-auto border-t border-slate-800/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Price</p>
                    <p className="font-black text-slate-100">{template.price === 'Free' ? 'FREE' : `$${template.price.toFixed(2)}`}</p>
                  </div>
                  
                  {purchasedIds.includes(template.id) ? (
                    <button className="bg-slate-800 text-green-500 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center space-x-2">
                       <CheckCircle2 className="w-4 h-4" />
                       <span>OWNED</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handlePurchase(template.id)}
                      className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 border border-blue-600/20"
                    >
                       {template.price === 'Free' ? <Download className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                       <span>{template.price === 'Free' ? 'DOWNLOAD' : 'BUY NOW'}</span>
                    </button>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal (High-Fidelity) */}
      {previewId && selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewId(null)} />
           <div className="relative bg-[#1a1a2e] w-full max-w-5xl rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[80vh]">
              <div className="md:w-1/2 relative bg-slate-900">
                 <img src={selectedPreview.image} alt="Preview" className="w-full h-full object-cover opacity-60" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-slate-950/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4 max-w-xs scale-90 md:scale-100">
                       <Lock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                       <h3 className="text-xl font-black text-white">Full Preview Locked</h3>
                       <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wider">Purchase to unlock the full high-resolution layout and interactive elements.</p>
                       <button className="bg-blue-600 text-white w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Unlock All Features</button>
                    </div>
                 </div>
              </div>
              <div className="md:w-1/2 p-12 space-y-8 overflow-y-auto custom-scrollbar">
                 <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{selectedPreview.category}</span>
                       <h3 className="text-4xl font-black text-white tracking-tight">{selectedPreview.title}</h3>
                    </div>
                    <button onClick={() => setPreviewId(null)} className="p-2 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                       <ArrowRight className="w-6 h-6 rotate-[-45deg]" />
                    </button>
                 </div>

                 <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                       <Star className="w-5 h-5 text-amber-500 fill-current" />
                       <span className="font-black text-white text-xl">{selectedPreview.rating}</span>
                       <span className="text-sm font-bold text-slate-500">({selectedPreview.reviews} reviews)</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800" />
                    <div className="flex items-center space-x-2">
                       <Download className="w-5 h-5 text-blue-500" />
                       <span className="font-black text-white text-xl">1.2k</span>
                       <span className="text-sm font-bold text-slate-500">Installs</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="font-black text-slate-100 uppercase tracking-widest text-xs flex items-center">
                       <Info className="w-4 h-4 mr-2 text-blue-500" />
                       Description
                    </h4>
                    <p className="text-slate-400 font-medium leading-relaxed italic">
                       {selectedPreview.description} This template features custom widgets for Lifevault, including auto-calculating fields, integrated calendar sync points, and specialized stylus input zones.
                    </p>
                 </div>

                 <div className="space-y-6 pt-8 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Price</span>
                       <span className="text-3xl font-black text-white">{selectedPreview.price === 'Free' ? 'FREE' : `$${selectedPreview.price.toFixed(2)}`}</span>
                    </div>
                    <button 
                      onClick={() => { handlePurchase(selectedPreview.id); setPreviewId(null); }}
                      className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                       Complete Order
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
