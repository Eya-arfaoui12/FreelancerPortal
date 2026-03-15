import { createContext, useState } from "react";  // créer un contexte : un outil pour partager des données (comme l’état d’une app) entre plusieurs composants sans passer les props manuellement à chaque niveau.

export const AppContext = createContext()

export const AppContextProvider = (props) => {   //le provider qui partage des données

    const [searchFilter, setSearchFilter] = useState({
        title:''
    })

    const [isSearched, setIsSearched] = useState(false)

    const value = {  // les données partagées
        searchFilter,setSearchFilter,
        isSearched, setIsSearched
    }

    // {props.children}  les composants qui vont recevoir ces données automatiquement exp : (App, Navbar, etc.)
    return (<AppContext.Provider value={value}>  
        {props.children} 
    </AppContext.Provider>)
}

