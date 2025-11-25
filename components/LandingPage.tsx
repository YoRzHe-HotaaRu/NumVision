import React from 'react';
import { Camera, Cpu, Hand, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-y-auto scroll-smooth font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full bg-background/80 backdrop-blur-md border-b border-border lg:border-none lg:bg-transparent transition-all">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Hand size={18} className="text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">NumVision AI</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm text-muted-foreground">
          <a 
            href="#features" 
            onClick={(e) => scrollToSection(e, 'features')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            How it Works
          </a>
        </div>
        <button 
          onClick={onStart}
          className="bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border border-border"
        >
          Launch App
        </button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 border border-secondary text-secondary text-xs font-semibold tracking-wide uppercase mb-6">
          <Zap size={12} />
          Powered by Gemini 2.5 Flash
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Turn Hand Gestures <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary">
            Into Digital Data
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Experience real-time computer vision right in your browser. 
          NumVision AI uses advanced generative models to detect and classify 
          hand numbers instantly with zero latency perception.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-full overflow-hidden transition-all hover:opacity-90 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Detecting <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full text-left scroll-mt-24">
          <FeatureCard 
            icon={<Camera className="text-primary" />}
            title="Visual Recognition"
            description="Uses your device camera to analyze frames in real-time."
          />
          <FeatureCard 
            icon={<Cpu className="text-secondary" />}
            title="Edge Intelligence"
            description="Powered by Gemini's multimodal capabilities for high accuracy."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-green-400" />}
            title="Privacy First"
            description="Images are processed for detection and not stored permanently."
          />
        </div>

        {/* How it works section */}
        <div id="how-it-works" className="mt-32 w-full text-left scroll-mt-24 pb-20">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
             <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-primary/20 to-secondary/20 -translate-y-1/2 hidden md:block" />
             
             {[
               { step: "01", title: "Allow Access", desc: "Enable camera permissions to let the app see your hand gestures." },
               { step: "02", title: "Show Number", desc: "Hold up your hand showing a number from 0 to 10 clearly." },
               { step: "03", title: "Get Result", desc: "AI analyzes the frame and returns the detected number instantly." }
             ].map((item, i) => (
                <div key={i} className="relative bg-card p-6 border border-border rounded-2xl z-10 shadow-lg">
                   <div className="text-4xl font-black text-muted mb-4">{item.step}</div>
                   <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                   <p className="text-muted-foreground">{item.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </main>
      
      <footer className="w-full py-8 border-t border-border text-center text-muted-foreground text-sm bg-background">
        &copy; {new Date().getFullYear()} NumVision AI. Built with Gemini API.
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:bg-accent/10 backdrop-blur-sm">
    <div className="mb-4 p-3 bg-secondary/10 rounded-xl w-fit">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default LandingPage;