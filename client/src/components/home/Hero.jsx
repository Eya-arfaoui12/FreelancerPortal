import React, { useContext, useRef, useState, memo } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import SearchPopup from './SearchPopup'

const Hero = memo(() => {
    const { setSearchFilter, setIsSearched } = useContext(AppContext)
    const [showPopup, setShowPopup] = useState(false);
    const [searchTitle, setSearchTitle] = useState("");
    const titleRef = useRef(null)

    const onSearch = () => {
        const title = titleRef.current.value.trim()
        
        // Ne pas ouvrir le popup si la recherche est vide
        if (!title) {
            return;
        }

        setSearchFilter({ title })
        setIsSearched(true)
        setSearchTitle(title)
        setShowPopup(true)
    }

    return (
        <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Video avec overlay */}
            <div className="absolute top-0 left-0 w-full h-full z-0">
                <video 
                    className="w-full h-full object-cover" 
                    src={assets.background} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    preload="none"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/70 to-indigo-900/90" />
            </div>

            {/* Effets d'arrière-plan géométriques */}
            <div className="absolute inset-0 z-0 opacity-30">
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20"></div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto text-center px-4 relative z-10 space-y-8">
                <div className="mb-8">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm mb-6">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                        Connecting businesses with Microsoft experts
                    </div>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                    Find the perfect Microsoft 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> expert </span> 
                    for your project
                </h1>

                <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                    Access verified Microsoft specialists with proven track records. Direct connections, no intermediaries.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-2xl mx-auto mt-10">
                    <div className="relative w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Search by role, skills, or expertise..."
                            className="w-full p-4 pl-12 rounded-xl shadow-lg outline-none text-gray-800 text-lg
                                     border border-blue-300 focus:border-blue-500 transition-colors duration-200
                                     bg-white/95 backdrop-blur-sm"
                            ref={titleRef}
                            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                        />
                        <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" 
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button 
                        onClick={onSearch}
                        className="bg-blue-600 text-white font-semibold px-8 py-4 
                                 rounded-xl hover:bg-blue-700 transition-colors duration-200 min-w-[140px] 
                                 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                    >
                        Search
                    </button>
                </div>

                {/* Stats en ligne */}
                <div className="flex flex-wrap justify-center gap-10 mt-16 text-white">
                    <div className="text-center">
                        <div className="text-3xl font-bold">500+</div>
                        <div className="text-blue-200 text-sm">Verified Experts</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">98%</div>
                        <div className="text-blue-200 text-sm">Client Satisfaction</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">24h</div>
                        <div className="text-blue-200 text-sm">Avg. Response Time</div>
                    </div>
                </div>
            </div>

            {/* SearchPopup - Plus besoin de passer fetchAPI, il est récupéré directement dans le composant */}
            {showPopup && (
                <SearchPopup
                    onClose={() => setShowPopup(false)}
                    title={searchTitle}
                />
            )}

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </div>
    )
})

Hero.displayName = 'Hero';

export default Hero